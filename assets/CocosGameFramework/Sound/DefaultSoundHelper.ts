import { _decorator } from 'cc';
import { SoundHelperBase } from './SoundHelperBase';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { CocosResourceManager } from '../Resource/CocosResourceManager';

const { ccclass } = _decorator;

/**
 * 默认声音辅助器。
 *
 * 通过 ResourceManager 的 unloadAsset 释放声音资源。
 * 若不需要自定义释放逻辑，可直接使用本类。
 */
@ccclass('DefaultSoundHelper')
export class DefaultSoundHelper extends SoundHelperBase {
    private _resourceManager: CocosResourceManager | null = null;

    onLoad(): void {
        this._resourceManager = GameFrameworkEntry.getModule(CocosResourceManager, MODULE_ID.RESOURCE);
        if (!this._resourceManager) {
            console.error('[DefaultSoundHelper] ResourceManager is invalid.');
        }
    }

    releaseSoundAsset(soundAsset: object): void {
        this._resourceManager?.unloadAsset(soundAsset);
    }
}
