import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { ISoundManager, ISoundGroup, IPlaySoundParams } from './ISoundManager';
import { IResourceManager } from '../Resource/IResourceManager';

class SoundGroupData implements ISoundGroup {
    sounds: SoundData[] = [];

    constructor(
        public name: string,
        public avoidBeingReplacedBySamePriority: boolean,
        public mute: boolean,
        public volume: number
    ) {}

    get soundCount(): number { return this.sounds.length; }
}

interface SoundData {
    serialId: number;
    assetName: string;
    groupName: string;
    priority: number;
    instance: object | null;
    isPaused: boolean;
    userData?: object;
}

export class SoundManager extends GameFrameworkModule implements ISoundManager {
    protected _resourceManager: IResourceManager | null = null;
    private _groups: Map<string, SoundGroupData> = new Map();
    private _sounds: Map<number, SoundData> = new Map();
    private _serialId: number = 0;

    get priority(): number { return 30; }
    get soundGroupCount(): number { return this._groups.size; }

    setResourceManager(rm: IResourceManager): void { this._resourceManager = rm; }

    addSoundGroup(
        groupName: string,
        avoidBeingReplacedBySamePriority: boolean = false,
        mute: boolean = false,
        volume: number = 1.0
    ): boolean {
        if (this._groups.has(groupName)) return false;
        this._groups.set(groupName, new SoundGroupData(groupName, avoidBeingReplacedBySamePriority, mute, volume));
        return true;
    }

    hasSoundGroup(groupName: string): boolean { return this._groups.has(groupName); }

    getSoundGroup(groupName: string): ISoundGroup | null {
        return (this._groups.get(groupName) as ISoundGroup) ?? null;
    }

    getAllSoundGroups(): ISoundGroup[] {
        return Array.from(this._groups.values());
    }

    playSound(
        soundAssetName: string,
        bundleName: string,
        groupName: string,
        params?: IPlaySoundParams,
        userData?: object
    ): number {
        if (!this._groups.has(groupName)) {
            throw new GameFrameworkError(`SoundGroup [${groupName}] not found.`);
        }
        if (!this._resourceManager) {
            throw new GameFrameworkError('ResourceManager is not set.');
        }
        const serialId = ++this._serialId;
        const soundData: SoundData = {
            serialId, assetName: soundAssetName, groupName,
            priority: params?.priority ?? 0, instance: null, isPaused: false, userData,
        };
        this._sounds.set(serialId, soundData);

        this._resourceManager.loadAsset(
            bundleName, soundAssetName, Object as any,
            (asset: object) => this._onLoadSuccess(serialId, asset, params),
            (name, msg) => {
                console.error(`[SoundManager] Play [${name}] failed: ${msg}`);
                this._sounds.delete(serialId);
            }
        );
        return serialId;
    }

    // 子类（CocosSoundManager）重写此方法执行实际播放
    protected _onLoadSuccess(serialId: number, asset: object, params?: IPlaySoundParams): void {
        const data = this._sounds.get(serialId);
        if (!data) return;
        data.instance = asset;
    }

    stopSound(serialId: number, _fadeOutSeconds?: number): boolean {
        const data = this._sounds.get(serialId);
        if (!data) return false;
        this._doStop(data);
        this._sounds.delete(serialId);
        const group = this._groups.get(data.groupName);
        if (group) {
            const idx = group.sounds.indexOf(data);
            if (idx >= 0) group.sounds.splice(idx, 1);
        }
        return true;
    }

    stopAllSounds(_fadeOutSeconds?: number): void {
        this._sounds.forEach(data => this._doStop(data));
        this._sounds.clear();
        this._groups.forEach(g => g.sounds.splice(0));
    }

    pauseSound(serialId: number, _fadeOutSeconds?: number): boolean {
        const data = this._sounds.get(serialId);
        if (!data) return false;
        data.isPaused = true;
        this._doPause(data);
        return true;
    }

    resumeSound(serialId: number, _fadeInSeconds?: number): boolean {
        const data = this._sounds.get(serialId);
        if (!data) return false;
        data.isPaused = false;
        this._doResume(data);
        return true;
    }

    isMuted(groupName: string): boolean {
        return this._groups.get(groupName)?.mute ?? false;
    }

    setMuted(groupName: string, mute: boolean): void {
        const g = this._groups.get(groupName);
        if (!g) return;
        g.mute = mute;
        g.sounds.forEach(data => this._doSetMuted(data, mute));
    }

    getVolume(groupName: string): number {
        return this._groups.get(groupName)?.volume ?? 1.0;
    }

    setVolume(groupName: string, volume: number): void {
        const g = this._groups.get(groupName);
        if (!g) return;
        g.volume = Math.max(0, Math.min(1, volume));
        g.sounds.forEach(data => this._doSetVolume(data, g.volume));
    }

    // 子类重写以实现真正的引擎音频操作
    protected _doStop(_data: SoundData): void {}
    protected _doPause(_data: SoundData): void {}
    protected _doResume(_data: SoundData): void {}
    protected _doSetMuted(_data: SoundData, _mute: boolean): void {}
    protected _doSetVolume(_data: SoundData, _volume: number): void {}

    update(_e: number, _r: number): void {}

    shutdown(): void {
        this.stopAllSounds();
        this._groups.clear();
        this._resourceManager = null;
    }
}
