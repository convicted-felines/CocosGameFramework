import { _decorator, Node, Enum } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { CocosSoundManager } from './CocosSoundManager';
import { CocosResourceManager } from '../Resource/CocosResourceManager';
import { PlaySoundParams } from '../../GameFramework/Sound/PlaySoundParams';
import { ISoundGroup, ISoundAgent } from '../../GameFramework/Sound/ISoundManager';
import { PlaySoundSuccessEventArgs } from '../../GameFramework/Sound/PlaySoundSuccessEventArgs';
import { PlaySoundFailureEventArgs } from '../../GameFramework/Sound/PlaySoundFailureEventArgs';
import { PlaySoundUpdateEventArgs } from '../../GameFramework/Sound/PlaySoundUpdateEventArgs';
import { PlaySoundDependencyAssetEventArgs } from '../../GameFramework/Sound/PlaySoundDependencyAssetEventArgs';
import { DefaultSoundHelper } from './DefaultSoundHelper';
import { HelperRegistry } from '../Base/HelperRegistry';
import { SoundHelperType } from './SoundHelperType';

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

    @property({ tooltip: '音频 Agent 数量（同时播放数）', min: 1 })
    agentCount: number = 1;
}

@ccclass('SoundComponent')
export class SoundComponent extends GameFrameworkComponent {
    @property({ type: Node, tooltip: '挂载 AudioSource 的节点' })
    audioNode: Node | null = null;

    @property({ type: Enum(SoundHelperType), tooltip: '声音辅助器类型（用于释放声音资源）' })
    soundHelperType: SoundHelperType = SoundHelperType.DefaultSoundHelper;

    @property({ type: SoundGroupConfig, tooltip: '音效分组配置列表' })
    soundGroups: SoundGroupConfig[] = [
        Object.assign(new SoundGroupConfig(), { name: 'Music', volume: 0.8, agentCount: 1 }),
        Object.assign(new SoundGroupConfig(), { name: 'Sound', volume: 1.0, agentCount: 4 }),
    ];

    @property({ tooltip: '启用播放更新事件' })
    enablePlaySoundUpdateEvent: boolean = false;

    @property({ tooltip: '启用依赖资源事件' })
    enablePlaySoundDependencyAssetEvent: boolean = false;

    private _manager!: CocosSoundManager;

    get manager(): CocosSoundManager { return this._manager; }

    onLoad(): void {
        super.onLoad();
        this._manager = new CocosSoundManager();

        if (this.audioNode) {
            this._manager.setAudioNode(this.audioNode);
        }

        if (this.soundHelperType !== undefined) {
            this._manager.setSoundHelper(
                HelperRegistry.createHelper(this.node, SoundHelperType[this.soundHelperType], DefaultSoundHelper)
            );
        }

        for (const cfg of this.soundGroups) {
            this._manager.addSoundGroup(cfg.name, cfg.avoidReplace, cfg.mute, cfg.volume, cfg.agentCount);
        }

        GameFrameworkEntry.registerModule(MODULE_ID.SOUND, this._manager);
    }

    start(): void {
        try {
            this._manager.setResourceManager(
                GameFrameworkEntry.getModule(CocosResourceManager, MODULE_ID.RESOURCE)
            );
        } catch {
            console.warn('[SoundComponent] ResourceComponent not found.');
        }
    }

    // ---------- event wiring ----------

    set onPlaySoundSuccess(handler: ((args: PlaySoundSuccessEventArgs) => void) | null) {
        this._manager.onPlaySoundSuccess = handler;
    }

    set onPlaySoundFailure(handler: ((args: PlaySoundFailureEventArgs) => void) | null) {
        this._manager.onPlaySoundFailure = handler;
    }

    set onPlaySoundUpdate(handler: ((args: PlaySoundUpdateEventArgs) => void) | null) {
        this._manager.onPlaySoundUpdate = handler;
    }

    set onPlaySoundDependencyAsset(handler: ((args: PlaySoundDependencyAssetEventArgs) => void) | null) {
        this._manager.onPlaySoundDependencyAsset = handler;
    }

    // ---------- group query ----------

    get soundGroupCount(): number { return this._manager.soundGroupCount; }

    hasSoundGroup(groupName: string): boolean { return this._manager.hasSoundGroup(groupName); }

    getSoundGroup(groupName: string): ISoundGroup | null { return this._manager.getSoundGroup(groupName); }

    getAllSoundGroups(): ISoundGroup[] { return this._manager.getAllSoundGroups(); }

    addSoundGroup(
        groupName: string,
        avoidReplace?: boolean,
        mute?: boolean,
        volume?: number,
        agentCount?: number
    ): boolean {
        return this._manager.addSoundGroup(groupName, avoidReplace, mute, volume, agentCount);
    }

    // ---------- loading state ----------

    getAllLoadingSoundSerialIds(): number[] { return this._manager.getAllLoadingSoundSerialIds(); }

    isLoadingSound(serialId: number): boolean { return this._manager.isLoadingSound(serialId); }

    // ---------- playback ----------

    playSound(
        soundAssetName: string,
        bundleName: string,
        groupName: string,
        params?: PlaySoundParams,
        userData?: object
    ): number {
        return this._manager.playSound(soundAssetName, bundleName, groupName, params, userData);
    }

    stopSound(serialId: number, fadeOutSeconds?: number): boolean {
        return this._manager.stopSound(serialId, fadeOutSeconds);
    }

    stopAllLoadedSounds(fadeOutSeconds?: number): void {
        this._manager.stopAllLoadedSounds(fadeOutSeconds);
    }

    stopAllLoadingSounds(): void {
        this._manager.stopAllLoadingSounds();
    }

    pauseSound(serialId: number, fadeOutSeconds?: number): void {
        this._manager.pauseSound(serialId, fadeOutSeconds);
    }

    resumeSound(serialId: number, fadeInSeconds?: number): void {
        this._manager.resumeSound(serialId, fadeInSeconds);
    }

    // ---------- volume / mute ----------

    isMuted(groupName: string): boolean { return this._manager.isMuted(groupName); }
    setMuted(groupName: string, mute: boolean): void { this._manager.setMuted(groupName, mute); }

    getVolume(groupName: string): number { return this._manager.getVolume(groupName); }
    setVolume(groupName: string, volume: number): void { this._manager.setVolume(groupName, volume); }
}
