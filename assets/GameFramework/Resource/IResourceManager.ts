import { EventHandler } from '../Event/IEventManager';

export type LoadSuccessCallback<T> = (asset: T, duration: number, userData?: object) => void;
export type LoadFailureCallback = (assetName: string, errorMsg: string, userData?: object) => void;
export type LoadProgressCallback = (loadedCount: number, totalCount: number) => void;
export type LoadSceneSuccessCallback = (sceneAssetName: string, duration: number, userData?: object) => void;
export type LoadSceneFailureCallback = (sceneAssetName: string, errorMsg: string, userData?: object) => void;
export type UnloadSceneSuccessCallback = (sceneAssetName: string, userData?: object) => void;
export type UnloadSceneFailureCallback = (sceneAssetName: string, userData?: object) => void;

/** 资源存在状态（对应 Unity HasAssetResult 枚举） */
export const enum HasAssetResult {
    /** 资源不存在 */
    NotExist = 0,
    /** 资源已在 Bundle 缓存中（可直接获取） */
    Loaded = 1,
    /** 资源所属 Bundle 已加载，但资源本身尚未加载 */
    InBundle = 2,
    /** Bundle 未加载，资源无法访问 */
    BundleNotLoaded = 3,
}

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
    /** 更新失败最大重试次数 */
    updateRetryCount: number;
    /** 当前等待加载的任务数 */
    readonly loadWaitingTaskCount: number;

    // ─── 热更新事件 ────────────────────────────────────────────────────────────

    /** 单个资源更新开始 */
    onResourceUpdateStart: EventHandler | null;
    /** 单个资源更新进度变化 */
    onResourceUpdateChanged: EventHandler | null;
    /** 单个资源更新成功 */
    onResourceUpdateSuccess: EventHandler | null;
    /** 单个资源更新失败 */
    onResourceUpdateFailure: EventHandler | null;
    /** 全部资源更新完毕 */
    onResourceUpdateAllComplete: EventHandler | null;

    // ─── Verify 校验事件 ──────────────────────────────────────────────────────

    /** 资源校验开始 */
    onResourceVerifyStart: EventHandler | null;
    /** 单个资源校验成功 */
    onResourceVerifySuccess: EventHandler | null;
    /** 单个资源校验失败 */
    onResourceVerifyFailure: EventHandler | null;

    // ─── Apply 应用事件 ───────────────────────────────────────────────────────

    /** 资源包应用开始 */
    onResourceApplyStart: EventHandler | null;
    /** 单个资源应用成功 */
    onResourceApplySuccess: EventHandler | null;
    /** 单个资源应用失败 */
    onResourceApplyFailure: EventHandler | null;

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

    /** 批量加载（同一 bundle 下多个路径） */
    loadAssets<T>(
        bundleName: string,
        assetPaths: string[],
        assetType: new (...args: any[]) => T,
        onProgress?: LoadProgressCallback,
        onSuccess?: LoadSuccessCallback<T[]>,
        onFailure?: LoadFailureCallback,
        userData?: object
    ): void;

    /** 按目录批量加载（对应 Cocos bundle.loadDir） */
    loadDir<T>(
        bundleName: string,
        dir: string,
        assetType: new (...args: any[]) => T,
        onProgress?: LoadProgressCallback,
        onSuccess?: LoadSuccessCallback<T[]>,
        onFailure?: LoadFailureCallback,
        userData?: object
    ): void;

    /** 卸载资源（减引用计数） */
    unloadAsset(asset: object): void;

    /** 释放 Bundle 内所有未被引用的资产 */
    unloadUnusedAssets(bundleName: string): void;

    /** 强制释放所有未被引用的资产（跨 Bundle） */
    forceUnloadUnusedAssets(): void;

    /** 检查资源是否存在及其状态 */
    hasAsset(bundleName: string, assetPath: string): HasAssetResult;

    // ─── 场景 ─────────────────────────────────────────────────────────────────

    /** 加载场景 */
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

    // ─── 热更新 ───────────────────────────────────────────────────────────────

    /** 检查热更新（返回是否有需要更新的资源） */
    checkUpdate(manifestUrl: string): Promise<boolean>;

    /** 执行热更新 */
    startUpdate(onComplete?: (success: boolean) => void): void;

    /** 停止热更新 */
    stopUpdate(): void;

    /** 获取热更新状态 */
    getUpdateStatus(): ResourceUpdateStatus;
}
