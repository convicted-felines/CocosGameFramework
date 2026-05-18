import { assetManager, Asset } from 'cc';
import { GameFrameworkError } from '../../GameFramework/Base/GameFrameworkError';
import { GameFrameworkModule } from '../../GameFramework/Base/GameFrameworkModule';
import { IResourceManager, LoadFailureCallback, LoadSuccessCallback, LoadProgressCallback } from '../../GameFramework/Resource/IResourceManager';

export class CocosResourceManager extends GameFrameworkModule implements IResourceManager {
    get priority(): number { return 60; }

    loadBundle(
        bundleName: string,
        onSuccess?: () => void,
        onFailure?: LoadFailureCallback
    ): void {
        // 已加载则直接返回
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

    loadAsset<T>(
        bundleName: string,
        assetPath: string,
        assetType: new (...args: any[]) => T,
        onSuccess: LoadSuccessCallback<T>,
        onFailure?: LoadFailureCallback
    ): void {
        const bundle = assetManager.getBundle(bundleName);
        if (!bundle) {
            onFailure?.(assetPath, `Bundle [${bundleName}] not loaded.`);
            return;
        }
        const startTime = Date.now();
        bundle.load(assetPath, assetType as any, (err: Error | null, asset: Asset) => {
            if (err) {
                onFailure?.(assetPath, err.message);
            } else {
                onSuccess(asset as unknown as T, (Date.now() - startTime) / 1000);
            }
        });
    }

    loadAssetAsync<T>(
        bundleName: string,
        assetPath: string,
        assetType: new (...args: any[]) => T
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            this.loadAsset(bundleName, assetPath, assetType,
                (asset) => resolve(asset),
                (name, msg) => reject(new GameFrameworkError(`Load [${name}] failed: ${msg}`))
            );
        });
    }

    loadAssets<T>(
        bundleName: string,
        assetPaths: string[],
        assetType: new (...args: any[]) => T,
        onProgress?: LoadProgressCallback,
        onSuccess?: LoadSuccessCallback<T[]>,
        onFailure?: LoadFailureCallback
    ): void {
        const bundle = assetManager.getBundle(bundleName);
        if (!bundle) {
            onFailure?.(bundleName, `Bundle [${bundleName}] not loaded.`);
            return;
        }
        const startTime = Date.now();
        bundle.load(
            assetPaths as any,
            assetType as any,
            (finished: number, total: number) => onProgress?.(finished, total),
            (err: Error | null, assets: Asset[]) => {
                if (err) {
                    onFailure?.(bundleName, err.message);
                } else {
                    onSuccess?.(assets as unknown as T[], (Date.now() - startTime) / 1000);
                }
            }
        );
    }

    unloadAsset(asset: object): void {
        assetManager.releaseAsset(asset as Asset);
    }

    unloadBundle(bundleName: string): void {
        const bundle = assetManager.getBundle(bundleName);
        bundle?.releaseAll();
        assetManager.removeBundle(bundle!);
    }

    update(_elapseSeconds: number, _realElapseSeconds: number): void {}

    shutdown(): void {}
}
