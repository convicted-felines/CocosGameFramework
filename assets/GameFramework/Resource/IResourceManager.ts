export type LoadSuccessCallback<T> = (asset: T, duration: number) => void;
export type LoadFailureCallback = (assetName: string, errorMsg: string) => void;
export type LoadProgressCallback = (loadedCount: number, totalCount: number) => void;

export interface IResourceManager {
    // 加载 Bundle（异步）
    loadBundle(
        bundleName: string,
        onSuccess?: () => void,
        onFailure?: LoadFailureCallback
    ): void;

    // 加载单个资源（回调风格）
    loadAsset<T>(
        bundleName: string,
        assetPath: string,
        assetType: new (...args: any[]) => T,
        onSuccess: LoadSuccessCallback<T>,
        onFailure?: LoadFailureCallback
    ): void;

    // 加载单个资源（Promise 风格）
    loadAssetAsync<T>(
        bundleName: string,
        assetPath: string,
        assetType: new (...args: any[]) => T
    ): Promise<T>;

    // 批量加载（同一 bundle）
    loadAssets<T>(
        bundleName: string,
        assetPaths: string[],
        assetType: new (...args: any[]) => T,
        onProgress?: LoadProgressCallback,
        onSuccess?: LoadSuccessCallback<T[]>,
        onFailure?: LoadFailureCallback
    ): void;

    // 卸载资源（减引用计数）
    unloadAsset(asset: object): void;

    // 卸载 Bundle
    unloadBundle(bundleName: string): void;
}
