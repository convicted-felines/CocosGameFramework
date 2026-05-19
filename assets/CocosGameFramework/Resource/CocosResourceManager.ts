import { assetManager, Asset, director } from 'cc';
import { GameFrameworkError } from '../../GameFramework/Base/GameFrameworkError';
import { GameFrameworkModule } from '../../GameFramework/Base/GameFrameworkModule';
import {
    IResourceManager, IResourceGroup,
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

    // 对象池配置（Cocos 侧靠 assetManager 的 cacheAsset 机制，这里保留属性供外部配置使用）
    assetAutoReleaseInterval: number = 60;
    assetCapacity: number = 64;
    assetExpireTime: number = 60;

    // 热更新事件回调
    onResourceUpdateStart: EventHandler | null = null;
    onResourceUpdateChanged: EventHandler | null = null;
    onResourceUpdateSuccess: EventHandler | null = null;
    onResourceUpdateFailure: EventHandler | null = null;
    onResourceUpdateAllComplete: EventHandler | null = null;

    private _resourceGroups: Map<string, ResourceGroup> = new Map();
    private _updateRetryCount: number = 3;
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
        const startTime = Date.now();
        bundle.load(assetPath, assetType as any, (err: Error | null, asset: Asset) => {
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
        const startTime = Date.now();
        bundle.load(
            assetPaths as any,
            assetType as any,
            (finished: number, total: number) => onProgress?.(finished, total),
            (err: Error | null, assets: Asset[]) => {
                if (err) {
                    onFailure?.(bundleName, err.message, userData);
                } else {
                    onSuccess?.(assets as unknown as T[], (Date.now() - startTime) / 1000, userData);
                }
            }
        );
    }

    unloadAsset(asset: object): void {
        assetManager.releaseAsset(asset as Asset);
    }

    hasAsset(bundleName: string, assetPath: string): boolean {
        const bundle = assetManager.getBundle(bundleName);
        if (!bundle) return false;
        return bundle.get(assetPath) !== null;
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
        // Cocos Creator 没有直接卸载场景的 API，通过释放场景资产实现
        const scene = director.getScene();
        if (scene && scene.name === sceneAssetName) {
            // 当前场景不能卸载自身，认为失败
            onFailure?.(sceneAssetName, userData);
            this._fireEvent(this.onResourceUpdateFailure,
                UnloadSceneFailureEventArgs.create(sceneAssetName, userData));
            return;
        }
        // 释放场景资产引用
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

    /** 创建或获取资源组（供外部业务层调用以登记资源组信息） */
    getOrCreateResourceGroup(groupName: string): ResourceGroup {
        let group = this._resourceGroups.get(groupName);
        if (!group) {
            group = new ResourceGroup(groupName);
            this._resourceGroups.set(groupName, group);
        }
        return group;
    }

    // ─── 热更新（Cocos HotUpdate 适配） ──────────────────────────────────────
    //
    // Cocos Creator 的热更新依赖 jsb.AssetsManager（原生平台）或自定义 HTTP 下载逻辑（Web）。
    // 此处提供统一的接口外壳；具体的 AssetsManager 实例应在 ResourceComponent 中注入。
    // 以下实现为 Web/编辑器模式下的空壳，原生模式时由子类覆盖。

    checkUpdate(_manifestUrl: string): Promise<boolean> {
        // Web/编辑器模式下无热更新，直接返回不需要更新
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
            updateRetryCount: this._updateRetryCount,
            updatingResourceGroupName: this._updatingGroupName,
        };
    }

    /** 登记需要更新的资源（供 Procedure 层在 checkUpdate 后调用） */
    addUpdateTask(task: UpdateTask): void {
        this._updateTasks.push(task);
    }

    /** 设置当前更新组名 */
    setUpdatingGroupName(name: string): void {
        this._updatingGroupName = name;
    }

    /** 设置更新失败重试上限 */
    setUpdateRetryCount(count: number): void {
        this._updateRetryCount = count;
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
                task.name, task.downloadUri, attempt + 1, this._updateRetryCount, reason));

        if (attempt + 1 < this._updateRetryCount) {
            this._downloadTask(task, attempt + 1, onComplete);
        } else {
            // 超过重试次数，跳过此任务继续
            this._updateTasks.shift();
            this._processNextUpdateTask(onComplete);
        }
    }

    private _fireEvent(handler: EventHandler | null, args: object): void {
        if (handler) {
            handler(this, args as any);
        }
    }

    // ─── GameFrameworkModule ──────────────────────────────────────────────────

    update(_elapseSeconds: number, _realElapseSeconds: number): void {}

    shutdown(): void {
        this._resourceGroups.clear();
        this._updateTasks.length = 0;
        this._isUpdating = false;
        this.onResourceUpdateStart = null;
        this.onResourceUpdateChanged = null;
        this.onResourceUpdateSuccess = null;
        this.onResourceUpdateFailure = null;
        this.onResourceUpdateAllComplete = null;
    }
}
