import { assetManager, Asset, director } from 'cc';
import { GameFrameworkError } from '../../GameFramework/Base/GameFrameworkError';
import { GameFrameworkModule } from '../../GameFramework/Base/GameFrameworkModule';
import {
    IResourceManager, IResourceGroup, HasAssetResult,
    LoadFailureCallback, LoadSuccessCallback, LoadProgressCallback,
    LoadSceneSuccessCallback, LoadSceneFailureCallback,
    UnloadSceneSuccessCallback, UnloadSceneFailureCallback,
    ResourceUpdateStatus,
} from '../../GameFramework/Resource/IResourceManager';
import { EventHandler } from '../../GameFramework/Event/IEventManager';
import {
    ResourceUpdateStartEventArgs,
    ResourceUpdateChangedEventArgs,
    ResourceUpdateSuccessEventArgs,
    ResourceUpdateFailureEventArgs,
    ResourceUpdateAllCompleteEventArgs,
    ResourceVerifyStartEventArgs,
    ResourceVerifySuccessEventArgs,
    ResourceApplyStartEventArgs,
    ResourceApplySuccessEventArgs,
    LoadSceneSuccessEventArgs,
    LoadSceneFailureEventArgs,
    UnloadSceneSuccessEventArgs,
    UnloadSceneFailureEventArgs,
    LoadAssetSuccessEventArgs,
    LoadAssetFailureEventArgs,
} from '../../GameFramework/Resource/ResourceEventArgs';

// ─── ResourceGroup ────────────────────────────────────────────────────────────

class ResourceGroup implements IResourceGroup {
    private _resourceNames: Set<string> = new Set();
    private _readyNames: Set<string> = new Set();
    private _totalLength: number = 0;
    private _readyLength: number = 0;

    constructor(readonly name: string) {}

    get totalCount(): number { return this._resourceNames.size; }
    get readyCount(): number { return this._readyNames.size; }
    get totalLength(): number { return this._totalLength; }
    get readyLength(): number { return this._readyLength; }
    get progress(): number { return this._totalLength > 0 ? this._readyLength / this._totalLength : 0; }
    get isComplete(): boolean { return this._resourceNames.size > 0 && this._readyNames.size >= this._resourceNames.size; }

    addResource(name: string, length: number = 0): void {
        this._resourceNames.add(name);
        this._totalLength += length;
    }

    markReady(name: string, length: number = 0): void {
        if (this._resourceNames.has(name) && !this._readyNames.has(name)) {
            this._readyNames.add(name);
            this._readyLength += length;
        }
    }

    hasResourceInGroup(resourceName: string): boolean {
        return this._resourceNames.has(resourceName);
    }
}

// ─── UpdateTask 内部结构 ──────────────────────────────────────────────────────

interface UpdateTask {
    name: string;
    downloadPath: string;
    downloadUri: string;
    length: number;
    compressedLength: number;
    retryCount: number;
}

// ─── CocosResourceManager ────────────────────────────────────────────────────

export class CocosResourceManager extends GameFrameworkModule implements IResourceManager {
    get priority(): number { return 60; }

    assetAutoReleaseInterval: number = 60;
    assetCapacity: number = 64;
    assetExpireTime: number = 60;
    updateRetryCount: number = 3;

    private _loadWaitingTaskCount: number = 0;
    get loadWaitingTaskCount(): number { return this._loadWaitingTaskCount; }

    // ─── 热更新事件 ────────────────────────────────────────────────────────────
    onResourceUpdateStart: EventHandler | null = null;
    onResourceUpdateChanged: EventHandler | null = null;
    onResourceUpdateSuccess: EventHandler | null = null;
    onResourceUpdateFailure: EventHandler | null = null;
    onResourceUpdateAllComplete: EventHandler | null = null;

    // ─── Verify 事件 ──────────────────────────────────────────────────────────
    onResourceVerifyStart: EventHandler | null = null;
    onResourceVerifySuccess: EventHandler | null = null;
    onResourceVerifyFailure: EventHandler | null = null;

    // ─── Apply 事件 ───────────────────────────────────────────────────────────
    onResourceApplyStart: EventHandler | null = null;
    onResourceApplySuccess: EventHandler | null = null;
    onResourceApplyFailure: EventHandler | null = null;

    private _resourceGroups: Map<string, ResourceGroup> = new Map();
    private _updateTasks: UpdateTask[] = [];
    private _updatingGroupName: string = '';
    private _isUpdating: boolean = false;
    private _stopUpdate: boolean = false;

    // ─── Bundle ───────────────────────────────────────────────────────────────

    loadBundle(
        bundleName: string,
        onSuccess?: () => void,
        onFailure?: LoadFailureCallback
    ): void {
        if (assetManager.getBundle(bundleName)) {
            onSuccess?.();
            return;
        }
        assetManager.loadBundle(bundleName, (err: Error | null) => {
            if (err) {
                onFailure?.(bundleName, err.message);
            } else {
                onSuccess?.();
            }
        });
    }

    unloadBundle(bundleName: string): void {
        const bundle = assetManager.getBundle(bundleName);
        if (bundle) {
            bundle.releaseAll();
            assetManager.removeBundle(bundle);
        }
    }

    // ─── 单个资源 ─────────────────────────────────────────────────────────────

    loadAsset<T>(
        bundleName: string,
        assetPath: string,
        assetType: new (...args: any[]) => T,
        onSuccess: LoadSuccessCallback<T>,
        onFailure?: LoadFailureCallback,
        userData?: object
    ): void {
        const bundle = assetManager.getBundle(bundleName);
        if (!bundle) {
            onFailure?.(assetPath, `Bundle [${bundleName}] not loaded.`, userData);
            this._fireEvent(this.onResourceUpdateFailure,
                LoadAssetFailureEventArgs.create(assetPath, `Bundle [${bundleName}] not loaded.`, userData));
            return;
        }
        this._loadWaitingTaskCount++;
        const startTime = Date.now();
        bundle.load(assetPath, assetType as any, (err: Error | null, asset: Asset) => {
            this._loadWaitingTaskCount--;
            if (err) {
                onFailure?.(assetPath, err.message, userData);
                this._fireEvent(this.onResourceUpdateFailure,
                    LoadAssetFailureEventArgs.create(assetPath, err.message, userData));
            } else {
                const duration = (Date.now() - startTime) / 1000;
                onSuccess(asset as unknown as T, duration, userData);
                this._fireEvent(this.onResourceUpdateSuccess,
                    LoadAssetSuccessEventArgs.create(assetPath, asset, duration, userData));
            }
        });
    }

    loadAssetAsync<T>(
        bundleName: string,
        assetPath: string,
        assetType: new (...args: any[]) => T,
        userData?: object
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            this.loadAsset(bundleName, assetPath, assetType,
                (asset) => resolve(asset),
                (name, msg) => reject(new GameFrameworkError(`Load [${name}] failed: ${msg}`)),
                userData
            );
        });
    }

    loadAssets<T>(
        bundleName: string,
        assetPaths: string[],
        assetType: new (...args: any[]) => T,
        onProgress?: LoadProgressCallback,
        onSuccess?: LoadSuccessCallback<T[]>,
        onFailure?: LoadFailureCallback,
        userData?: object
    ): void {
        const bundle = assetManager.getBundle(bundleName);
        if (!bundle) {
            onFailure?.(bundleName, `Bundle [${bundleName}] not loaded.`, userData);
            return;
        }
        this._loadWaitingTaskCount++;
        const startTime = Date.now();
        bundle.load(
            assetPaths as any,
            assetType as any,
            (finished: number, total: number) => onProgress?.(finished, total),
            (err: Error | null, assets: Asset[]) => {
                this._loadWaitingTaskCount--;
                if (err) {
                    onFailure?.(bundleName, err.message, userData);
                } else {
                    onSuccess?.(assets as unknown as T[], (Date.now() - startTime) / 1000, userData);
                }
            }
        );
    }

    loadDir<T>(
        bundleName: string,
        dir: string,
        assetType: new (...args: any[]) => T,
        onProgress?: LoadProgressCallback,
        onSuccess?: LoadSuccessCallback<T[]>,
        onFailure?: LoadFailureCallback,
        userData?: object
    ): void {
        const bundle = assetManager.getBundle(bundleName);
        if (!bundle) {
            onFailure?.(dir, `Bundle [${bundleName}] not loaded.`, userData);
            return;
        }
        this._loadWaitingTaskCount++;
        const startTime = Date.now();
        bundle.loadDir(
            dir,
            assetType as any,
            (finished: number, total: number) => onProgress?.(finished, total),
            (err: Error | null, assets: Asset[]) => {
                this._loadWaitingTaskCount--;
                if (err) {
                    onFailure?.(dir, err.message, userData);
                } else {
                    onSuccess?.(assets as unknown as T[], (Date.now() - startTime) / 1000, userData);
                }
            }
        );
    }

    unloadAsset(asset: object): void {
        assetManager.releaseAsset(asset as Asset);
    }

    unloadUnusedAssets(bundleName: string): void {
        const bundle = assetManager.getBundle(bundleName);
        // Cocos Creator 3.x 类型定义缺失此方法，运行时存在
        (bundle as any)?.releaseUnusedAssets?.();
    }

    forceUnloadUnusedAssets(): void {
        assetManager.releaseAll();
    }

    hasAsset(bundleName: string, assetPath: string): HasAssetResult {
        const bundle = assetManager.getBundle(bundleName);
        if (!bundle) return HasAssetResult.BundleNotLoaded;
        const cached = bundle.get(assetPath);
        if (cached !== null) return HasAssetResult.Loaded;
        // bundle 已加载但资源未缓存，检查 bundle 资源清单
        const info = (bundle as any)._config?.getAssetInfo?.(assetPath);
        return info ? HasAssetResult.InBundle : HasAssetResult.NotExist;
    }

    // ─── 场景 ─────────────────────────────────────────────────────────────────

    loadScene(
        sceneAssetName: string,
        onSuccess?: LoadSceneSuccessCallback,
        onFailure?: LoadSceneFailureCallback,
        userData?: object
    ): void {
        const startTime = Date.now();
        director.loadScene(sceneAssetName, (err: Error | null) => {
            if (err) {
                onFailure?.(sceneAssetName, err.message, userData);
                this._fireEvent(this.onResourceUpdateFailure,
                    LoadSceneFailureEventArgs.create(sceneAssetName, err.message, userData));
            } else {
                const duration = (Date.now() - startTime) / 1000;
                onSuccess?.(sceneAssetName, duration, userData);
                this._fireEvent(this.onResourceUpdateSuccess,
                    LoadSceneSuccessEventArgs.create(sceneAssetName, duration, userData));
            }
        });
    }

    unloadScene(
        sceneAssetName: string,
        onSuccess?: UnloadSceneSuccessCallback,
        onFailure?: UnloadSceneFailureCallback,
        userData?: object
    ): void {
        const scene = director.getScene();
        if (scene && scene.name === sceneAssetName) {
            onFailure?.(sceneAssetName, userData);
            this._fireEvent(this.onResourceUpdateFailure,
                UnloadSceneFailureEventArgs.create(sceneAssetName, userData));
            return;
        }
        assetManager.releaseAsset(sceneAssetName as any);
        onSuccess?.(sceneAssetName, userData);
        this._fireEvent(this.onResourceUpdateSuccess,
            UnloadSceneSuccessEventArgs.create(sceneAssetName, userData));
    }

    // ─── 资源组 ───────────────────────────────────────────────────────────────

    hasResourceGroup(groupName: string): boolean {
        return this._resourceGroups.has(groupName);
    }

    getResourceGroup(groupName: string): IResourceGroup | null {
        return this._resourceGroups.get(groupName) ?? null;
    }

    getAllResourceGroups(): IResourceGroup[] {
        return Array.from(this._resourceGroups.values());
    }

    getOrCreateResourceGroup(groupName: string): ResourceGroup {
        let group = this._resourceGroups.get(groupName);
        if (!group) {
            group = new ResourceGroup(groupName);
            this._resourceGroups.set(groupName, group);
        }
        return group;
    }

    // ─── 热更新 ───────────────────────────────────────────────────────────────

    checkUpdate(_manifestUrl: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    startUpdate(onComplete?: (success: boolean) => void): void {
        if (this._isUpdating || this._updateTasks.length === 0) {
            onComplete?.(true);
            this._fireEvent(this.onResourceUpdateAllComplete,
                ResourceUpdateAllCompleteEventArgs.create());
            return;
        }
        this._isUpdating = true;
        this._stopUpdate = false;
        this._processNextUpdateTask(onComplete);
    }

    stopUpdate(): void {
        this._stopUpdate = true;
    }

    getUpdateStatus(): ResourceUpdateStatus {
        return {
            waitingCount: this._updateTasks.length,
            candidateCount: this._updateTasks.length,
            updateRetryCount: this.updateRetryCount,
            updatingResourceGroupName: this._updatingGroupName,
        };
    }

    addUpdateTask(task: UpdateTask): void {
        this._updateTasks.push(task);
    }

    setUpdatingGroupName(name: string): void {
        this._updatingGroupName = name;
    }

    // ─── Verify（校验） ────────────────────────────────────────────────────────
    //
    // Cocos 平台的资源校验通常由 AssetsManager 处理（原生）或跳过（Web）。
    // 此处提供统一外壳，供 Procedure 层在需要时触发事件通知 UI。

    verifyResources(resources: Array<{ name: string; length: number }>): void {
        const totalLength = resources.reduce((sum, r) => sum + r.length, 0);
        this._fireEvent(this.onResourceVerifyStart,
            ResourceVerifyStartEventArgs.create(resources.length, totalLength));

        for (const r of resources) {
            // Web/Editor 模式下视为全部通过；原生模式可在子类重写做真实校验
            this._fireEvent(this.onResourceVerifySuccess,
                ResourceVerifySuccessEventArgs.create(r.name, r.length));
        }
    }

    // ─── Apply（应用资源包） ───────────────────────────────────────────────────
    //
    // 将已下载的资源包内容应用到 ReadWrite 路径（原生平台）。
    // Web 模式下为空壳；原生平台子类可重写实现真实文件拷贝。

    applyResources(
        resourcePackPath: string,
        resources: Array<{ name: string; applyPath: string; compressedLength: number; length: number }>
    ): void {
        const totalCompressed = resources.reduce((sum, r) => sum + r.compressedLength, 0);
        const totalLength = resources.reduce((sum, r) => sum + r.length, 0);
        this._fireEvent(this.onResourceApplyStart,
            ResourceApplyStartEventArgs.create(resourcePackPath, resources.length, totalCompressed, totalLength));

        for (const r of resources) {
            this._fireEvent(this.onResourceApplySuccess,
                ResourceApplySuccessEventArgs.create(r.name, r.applyPath, resourcePackPath, r.compressedLength, r.length));
        }
    }

    // ─── 内部 ─────────────────────────────────────────────────────────────────

    private _processNextUpdateTask(onComplete?: (success: boolean) => void): void {
        if (this._stopUpdate || this._updateTasks.length === 0) {
            this._isUpdating = false;
            onComplete?.(this._updateTasks.length === 0);
            this._fireEvent(this.onResourceUpdateAllComplete,
                ResourceUpdateAllCompleteEventArgs.create());
            return;
        }

        const task = this._updateTasks[0];
        this._fireEvent(this.onResourceUpdateStart,
            ResourceUpdateStartEventArgs.create(
                task.name, task.downloadPath ?? '', task.downloadUri,
                0, task.compressedLength, task.length));

        this._downloadTask(task, 0, onComplete);
    }

    private _downloadTask(task: UpdateTask, attempt: number, onComplete?: (success: boolean) => void): void {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', task.downloadUri, true);
        xhr.responseType = 'arraybuffer';

        xhr.onprogress = (e) => {
            if (e.lengthComputable) {
                this._fireEvent(this.onResourceUpdateChanged,
                    ResourceUpdateChangedEventArgs.create(
                        task.name, task.downloadPath, task.downloadUri,
                        e.loaded, task.compressedLength, task.length));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                this._updateTasks.shift();
                this._fireEvent(this.onResourceUpdateSuccess,
                    ResourceUpdateSuccessEventArgs.create(
                        task.name, task.downloadPath, task.downloadUri,
                        task.length, task.compressedLength));

                const group = this._resourceGroups.get(this._updatingGroupName);
                group?.markReady(task.name, task.length);

                this._processNextUpdateTask(onComplete);
            } else {
                this._handleUpdateFailure(task, attempt, `HTTP ${xhr.status}`, onComplete);
            }
        };

        xhr.onerror = () => {
            this._handleUpdateFailure(task, attempt, 'Network error', onComplete);
        };

        xhr.send();
    }

    private _handleUpdateFailure(task: UpdateTask, attempt: number, reason: string, onComplete?: (success: boolean) => void): void {
        this._fireEvent(this.onResourceUpdateFailure,
            ResourceUpdateFailureEventArgs.create(
                task.name, task.downloadUri, attempt + 1, this.updateRetryCount, reason));

        if (attempt + 1 < this.updateRetryCount) {
            this._downloadTask(task, attempt + 1, onComplete);
        } else {
            this._updateTasks.shift();
            this._processNextUpdateTask(onComplete);
        }
    }

    private _fireEvent(handler: EventHandler | null, args: object): void {
        handler?.(this, args as any);
    }

    // ─── GameFrameworkModule ──────────────────────────────────────────────────

    update(_elapseSeconds: number, _realElapseSeconds: number): void {}

    shutdown(): void {
        this._resourceGroups.clear();
        this._updateTasks.length = 0;
        this._isUpdating = false;
        this._loadWaitingTaskCount = 0;
        this.onResourceUpdateStart = null;
        this.onResourceUpdateChanged = null;
        this.onResourceUpdateSuccess = null;
        this.onResourceUpdateFailure = null;
        this.onResourceUpdateAllComplete = null;
        this.onResourceVerifyStart = null;
        this.onResourceVerifySuccess = null;
        this.onResourceVerifyFailure = null;
        this.onResourceApplyStart = null;
        this.onResourceApplySuccess = null;
        this.onResourceApplyFailure = null;
    }
}
