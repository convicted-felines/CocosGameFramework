import { _decorator, Component, Node } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { CocosSoundManager } from './CocosSoundManager';
import { CocosResourceManager } from '../Resource/CocosResourceManager';
import { IPlaySoundParams } from '../../GameFramework/Sound/ISoundManager';

const { ccclass, property } = _decorator;

@ccclass('SoundGroupConfig')
class SoundGroupConfig {
    @property({ tooltip: '音效分组名称' })
    name: string = 'Sound';

    @property({ tooltip: '是否静音' })
    mute: boolean = false;

    @property({ tooltip: '默认音量（0~1）', range: [0, 1, 0.01] })
    volume: number = 1.0;

    @property({ tooltip: '同优先级时是否避免被替换' })
    avoidReplace: boolean = false;
}

@ccclass('SoundComponent')
export class SoundComponent extends Component {
    /** 挂载 AudioSource 的节点 */
    @property({ type: Node, tooltip: '挂载 AudioSource 的节点' })
    audioNode: Node | null = null;

    /** 音效分组配置 */
    @property({ type: SoundGroupConfig, tooltip: '音效分组配置列表' })
    soundGroups: SoundGroupConfig[] = [
        Object.assign(new SoundGroupConfig(), { name: 'Music',  volume: 0.8 }),
        Object.assign(new SoundGroupConfig(), { name: 'Sound',  volume: 1.0 }),
    ];

    private _manager!: CocosSoundManager;

    get manager(): CocosSoundManager { return this._manager; }

    onLoad(): void {
        this._manager = new CocosSoundManager();

        const resourceMgr = GameFrameworkEntry.getModule(CocosResourceManager, MODULE_ID.RESOURCE);
        this._manager.setResourceManager(resourceMgr);

        if (this.audioNode) {
            this._manager.setAudioNode(this.audioNode);
        }

        for (const group of this.soundGroups) {
            this._manager.addSoundGroup(group.name, group.avoidReplace, group.mute, group.volume);
        }

        GameFrameworkEntry.registerModule(MODULE_ID.SOUND, this._manager);
    }

    get soundGroupCount(): number { return this._manager.soundGroupCount; }

    playSound(
        soundAssetName: string,
        bundleName: string,
        groupName: string,
        params?: IPlaySoundParams,
        userData?: object
    ): number {
        return this._manager.playSound(soundAssetName, bundleName, groupName, params, userData);
    }

    stopSound(serialId: number, fadeOutSeconds?: number): boolean {
        return this._manager.stopSound(serialId, fadeOutSeconds);
    }

    stopAllSounds(fadeOutSeconds?: number): void {
        this._manager.stopAllSounds(fadeOutSeconds);
    }

    pauseSound(serialId: number, fadeOutSeconds?: number): boolean {
        return this._manager.pauseSound(serialId, fadeOutSeconds);
    }

    resumeSound(serialId: number, fadeInSeconds?: number): boolean {
        return this._manager.resumeSound(serialId, fadeInSeconds);
    }

    addSoundGroup(
        groupName: string,
        avoidReplace?: boolean,
        mute?: boolean,
        volume?: number
    ): boolean {
        return this._manager.addSoundGroup(groupName, avoidReplace, mute, volume);
    }

    hasSoundGroup(groupName: string): boolean { return this._manager.hasSoundGroup(groupName); }

    isMuted(groupName: string): boolean { return this._manager.isMuted(groupName); }
    setMuted(groupName: string, mute: boolean): void { this._manager.setMuted(groupName, mute); }

    getVolume(groupName: string): number { return this._manager.getVolume(groupName); }
    setVolume(groupName: string, volume: number): void { this._manager.setVolume(groupName, volume); }
}
