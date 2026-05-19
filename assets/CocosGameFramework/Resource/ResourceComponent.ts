import { _decorator } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { CocosResourceManager } from './CocosResourceManager';
import {
    LoadSuccessCallback,
    LoadFailureCallback,
    LoadProgressCallback,
    LoadSceneSuccessCallback,
    LoadSceneFailureCallback,
    UnloadSceneSuccessCallback,
    UnloadSceneFailureCallback,
    IResourceGroup,
    ResourceUpdateStatus,
} from '../../GameFramework/Resource/IResourceManager';
import { EventHandler } from '../../GameFramework/Event/IEventManager';

const { ccclass, property } = _decorator;

@ccclass('ResourceComponent')
export class ResourceComponent extends GameFrameworkComponent {
    @property({ tooltip: '对象池容量上限' })
    assetCapacity: number = 64;

    @property({ tooltip: '对象池自动释放间隔（秒）' })
    assetAutoReleaseInterval: number = 60;

    @property({ tooltip: '对象池过期时间（秒）' })
    assetExpireTime: number = 60;

    private _manager!: CocosResourceManager;

    get manager(): CocosResourceManager { return this._manager; }

    onLoad(): void {
        super.onLoad();
        this._manager = new CocosResourceManager();
        this._manager.assetCapacity = this.assetCapacity;
        this._manager.assetAutoReleaseInterval = this.assetAutoReleaseInterval;
        this._manager.assetExpireTime = this.assetExpireTime;
        GameFrameworkEntry.registerModule(MODULE_ID.RESOURCE, this._manager);
    }

    // ─── 热更新事件绑定 ───────────────────────────────────────────────────────

    set onResourceUpdateStart(handler: EventHandler | null) { this._manager.onResourceUpdateStart = handler; }
    set onResourceUpdateChanged(handler: EventHandler | null) { this._manager.onResourceUpdateChanged = handler; }
    set onResourceUpdateSuccess(handler: EventHandler | null) { this._manager.onResourceUpdateSuccess = handler; }
    set onResourceUpdateFailure(handler: EventHandler | null) { this._manager.onResourceUpdateFailure = handler; }
    set onResourceUpdateAllComplete(handler: EventHandler | null) { this._manager.onResourceUpdateAllComplete = handler; }

    // ─── Bundle ───────────────────────────────────────────────────────────────

    loadBundle(bundleName: string, onSuccess?: () => void, onFailure?: LoadFailureCallback): void {
        this._manager.loadBundle(bundleName, onSuccess, onFailure);
    }

    unloadBundle(bundleName: string): void {
        this._manager.unloadBundle(bundleName);
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
        this._manager.loadAsset(bundleName, assetPath, assetType, onSuccess, onFailure, userData);
    }

    loadAssetAsync<T>(
        bundleName: string,
        assetPath: string,
        assetType: new (...args: any[]) => T,
        userData?: object
    ): Promise<T> {
        return this._manager.loadAssetAsync(bundleName, assetPath, assetType, userData);
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
        this._manager.loadAssets(bundleName, assetPaths, assetType, onProgress, onSuccess, onFailure, userData);
    }

    unloadAsset(asset: object): void {
        this._manager.unloadAsset(asset);
    }

    hasAsset(bundleName: string, assetPath: string): boolean {
        return this._manager.hasAsset(bundleName, assetPath);
    }

    // ─── 场景 ─────────────────────────────────────────────────────────────────

    loadScene(
        sceneAssetName: string,
        onSuccess?: LoadSceneSuccessCallback,
        onFailure?: LoadSceneFailureCallback,
        userData?: object
    ): void {
        this._manager.loadScene(sceneAssetName, onSuccess, onFailure, userData);
    }

    unloadScene(
        sceneAssetName: string,
        onSuccess?: UnloadSceneSuccessCallback,
        onFailure?: UnloadSceneFailureCallback,
        userData?: object
    ): void {
        this._manager.unloadScene(sceneAssetName, onSuccess, onFailure, userData);
    }

    // ─── 资源组 ───────────────────────────────────────────────────────────────

    hasResourceGroup(groupName: string): boolean {
        return this._manager.hasResourceGroup(groupName);
    }

    getResourceGroup(groupName: string): IResourceGroup | null {
        return this._manager.getResourceGroup(groupName);
    }

    getAllResourceGroups(): IResourceGroup[] {
        return this._manager.getAllResourceGroups();
    }

    // ─── 热更新 ───────────────────────────────────────────────────────────────

    checkUpdate(manifestUrl: string): Promise<boolean> {
        return this._manager.checkUpdate(manifestUrl);
    }

    startUpdate(onComplete?: (success: boolean) => void): void {
        this._manager.startUpdate(onComplete);
    }

    stopUpdate(): void {
        this._manager.stopUpdate();
    }

    getUpdateStatus(): ResourceUpdateStatus {
        return this._manager.getUpdateStatus();
    }
}
