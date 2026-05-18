import { _decorator, Component } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { CocosResourceManager } from './CocosResourceManager';
import {
    LoadSuccessCallback,
    LoadFailureCallback,
    LoadProgressCallback,
} from '../../GameFramework/Resource/IResourceManager';

const { ccclass } = _decorator;

@ccclass('ResourceComponent')
export class ResourceComponent extends Component {
    private _manager!: CocosResourceManager;

    get manager(): CocosResourceManager { return this._manager; }

    onLoad(): void {
        this._manager = new CocosResourceManager();
        GameFrameworkEntry.registerModule(MODULE_ID.RESOURCE, this._manager);
    }

    loadBundle(bundleName: string, onSuccess?: () => void, onFailure?: LoadFailureCallback): void {
        this._manager.loadBundle(bundleName, onSuccess, onFailure);
    }

    loadAsset<T>(
        bundleName: string,
        assetPath: string,
        assetType: new (...args: any[]) => T,
        onSuccess: LoadSuccessCallback<T>,
        onFailure?: LoadFailureCallback
    ): void {
        this._manager.loadAsset(bundleName, assetPath, assetType, onSuccess, onFailure);
    }

    loadAssetAsync<T>(
        bundleName: string,
        assetPath: string,
        assetType: new (...args: any[]) => T
    ): Promise<T> {
        return this._manager.loadAssetAsync(bundleName, assetPath, assetType);
    }

    loadAssets<T>(
        bundleName: string,
        assetPaths: string[],
        assetType: new (...args: any[]) => T,
        onProgress?: LoadProgressCallback,
        onSuccess?: LoadSuccessCallback<T[]>,
        onFailure?: LoadFailureCallback
    ): void {
        this._manager.loadAssets(bundleName, assetPaths, assetType, onProgress, onSuccess, onFailure);
    }

    unloadAsset(asset: object): void { this._manager.unloadAsset(asset); }
    unloadBundle(bundleName: string): void { this._manager.unloadBundle(bundleName); }
}
