import { EventHandler } from '../Event/IEventManager';

export type LoadSuccessCallback<T> = (asset: T, duration: number, userData?: object) => void;
export type LoadFailureCallback = (assetName: string, errorMsg: string, userData?: object) => void;
export type LoadProgressCallback = (loadedCount: number, totalCount: number) => void;
export type LoadSceneSuccessCallback = (sceneAssetName: string, duration: number, userData?: object) => void;
export type LoadSceneFailureCallback = (sceneAssetName: string, errorMsg: string, userData?: object) => void;
export type UnloadSceneSuccessCallback = (sceneAssetName: string, userData?: object) => void;
export type UnloadSceneFailureCallback = (sceneAssetName: string, userData?: object) => void;

/** 资源组接口，对应原版 IResourceGroup */
export interface IResourceGroup {
    readonly name: string;
    readonly totalCount: number;
    readonly readyCount: number;
    readonly totalLength: number;
    readonly readyLength: number;
    /** [0, 1] 进度 */
    readonly progress: number;
    readonly isComplete: boolean;
    hasResourceInGroup(resourceName: string): boolean;
}

/** 热更新状态快照 */
export interface ResourceUpdateStatus {
    /** 待更新资源数 */
    waitingCount: number;
    /** 候选资源数（已检查需更新） */
    candidateCount: number;
    /** 更新失败重试次数上限 */
    updateRetryCount: number;
    /** 当前更新的资源组名 */
    updatingResourceGroupName: string;
}

export interface IResourceManager {
    // ─── 属性 ─────────────────────────────────────────────────────────────────

    /** 对象池自动释放间隔（秒） */
    assetAutoReleaseInterval: number;
    /** 对象池容量上限 */
    assetCapacity: number;
    /** 对象池过期时间（秒） */
    assetExpireTime: number;

    // ─── 热更新事件（对应原版 IResourceManager 事件） ──────────────────────────

    /** 单个资源更新开始事件 id: ResourceUpdateStartEventArgs.eventId */
    onResourceUpdateStart: EventHandler | null;
    /** 单个资源更新进度事件 */
    onResourceUpdateChanged: EventHandler | null;
    /** 单个资源更新成功事件 */
    onResourceUpdateSuccess: EventHandler | null;
    /** 单个资源更新失败事件 */
    onResourceUpdateFailure: EventHandler | null;
    /** 所有资源更新完毕事件 */
    onResourceUpdateAllComplete: EventHandler | null;

    // ─── Bundle ───────────────────────────────────────────────────────────────

    /** 加载 Bundle（异步） */
    loadBundle(
        bundleName: string,
        onSuccess?: () => void,
        onFailure?: LoadFailureCallback
    ): void;

    /** 卸载 Bundle */
    unloadBundle(bundleName: string): void;

    // ─── 单个资源 ─────────────────────────────────────────────────────────────

    /** 回调风格加载 */
    loadAsset<T>(
        bundleName: string,
        assetPath: string,
        assetType: new (...args: any[]) => T,
        onSuccess: LoadSuccessCallback<T>,
        onFailure?: LoadFailureCallback,
        userData?: object
    ): void;

    /** Promise 风格加载 */
    loadAssetAsync<T>(
        bundleName: string,
        assetPath: string,
        assetType: new (...args: any[]) => T,
        userData?: object
    ): Promise<T>;

    /** 批量加载（同一 bundle） */
    loadAssets<T>(
        bundleName: string,
        assetPaths: string[],
        assetType: new (...args: any[]) => T,
        onProgress?: LoadProgressCallback,
        onSuccess?: LoadSuccessCallback<T[]>,
        onFailure?: LoadFailureCallback,
        userData?: object
    ): void;

    /** 卸载资源（减引用计数） */
    unloadAsset(asset: object): void;

    /** 检查资源是否存在于已加载的 bundle 中 */
    hasAsset(bundleName: string, assetPath: string): boolean;

    // ─── 场景 ─────────────────────────────────────────────────────────────────

    /** 加载场景（异步，additive 模式） */
    loadScene(
        sceneAssetName: string,
        onSuccess?: LoadSceneSuccessCallback,
        onFailure?: LoadSceneFailureCallback,
        userData?: object
    ): void;

    /** 卸载场景 */
    unloadScene(
        sceneAssetName: string,
        onSuccess?: UnloadSceneSuccessCallback,
        onFailure?: UnloadSceneFailureCallback,
        userData?: object
    ): void;

    // ─── 资源组 ───────────────────────────────────────────────────────────────

    /** 是否存在指定资源组 */
    hasResourceGroup(groupName: string): boolean;

    /** 获取指定资源组 */
    getResourceGroup(groupName: string): IResourceGroup | null;

    /** 获取所有资源组 */
    getAllResourceGroups(): IResourceGroup[];

    // ─── 热更新（Cocos 热更新适配） ───────────────────────────────────────────

    /** 检查热更新（返回是否有需要更新的资源） */
    checkUpdate(manifestUrl: string): Promise<boolean>;

    /** 执行热更新 */
    startUpdate(onComplete?: (success: boolean) => void): void;

    /** 停止热更新 */
    stopUpdate(): void;

    /** 获取热更新状态 */
    getUpdateStatus(): ResourceUpdateStatus;
}
