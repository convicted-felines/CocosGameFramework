import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { ReferencePool } from '../ReferencePool/ReferencePool';
import { IReference } from '../ReferencePool/IReference';
import { ISoundManager, ISoundGroup, ISoundAgent } from './ISoundManager';
import { PlaySoundParams } from './PlaySoundParams';
import { PlaySoundErrorCode } from './PlaySoundErrorCode';
import { PlaySoundSuccessEventArgs } from './PlaySoundSuccessEventArgs';
import { PlaySoundFailureEventArgs } from './PlaySoundFailureEventArgs';
import { PlaySoundUpdateEventArgs } from './PlaySoundUpdateEventArgs';
import { PlaySoundDependencyAssetEventArgs } from './PlaySoundDependencyAssetEventArgs';
import { IResourceManager } from '../Resource/IResourceManager';
import { ISoundHelper } from './ISoundHelper';

// ---------- PlaySoundInfo (pooled load-request token) ----------

class PlaySoundInfo implements IReference {
    serialId: number = 0;
    soundGroup: SoundGroup | null = null;
    playSoundParams: PlaySoundParams | null = null;
    userData: object | null = null;

    static create(
        serialId: number,
        soundGroup: SoundGroup,
        playSoundParams: PlaySoundParams,
        userData: object | null
    ): PlaySoundInfo {
        const info = ReferencePool.acquire(PlaySoundInfo);
        info.serialId = serialId;
        info.soundGroup = soundGroup;
        info.playSoundParams = playSoundParams;
        info.userData = userData;
        return info;
    }

    clear(): void {
        this.serialId = 0;
        this.soundGroup = null;
        this.playSoundParams = null;
        this.userData = null;
    }
}

// ---------- SoundAgent ----------

export class SoundAgent implements ISoundAgent {
    readonly soundGroup: SoundGroup;

    private _serialId: number = -1;
    private _soundAsset: object | null = null;
    private _muteInSoundGroup: boolean = false;
    private _volumeInSoundGroup: number = 1.0;
    private _priority: number = 0;
    private _loop: boolean = false;
    private _pitch: number = 1.0;
    private _panStereo: number = 0;
    private _spatialBlend: number = 0;
    private _maxDistance: number = 100;
    private _dopplerLevel: number = 1.0;
    private _setSoundAssetTime: number = -Infinity;

    constructor(soundGroup: SoundGroup) {
        this.soundGroup = soundGroup;
    }

    get serialId(): number { return this._serialId; }
    get soundAsset(): object | null { return this._soundAsset; }
    get isPlaying(): boolean { return this._doIsPlaying(); }
    get length(): number { return this._doGetLength(); }
    get time(): number { return this._doGetTime(); }
    set time(v: number) { this._doSetTime(v); }
    get mute(): boolean { return this.soundGroup.mute || this._muteInSoundGroup; }

    get muteInSoundGroup(): boolean { return this._muteInSoundGroup; }
    set muteInSoundGroup(v: boolean) {
        this._muteInSoundGroup = v;
        this._refreshMute();
    }

    get loop(): boolean { return this._loop; }
    set loop(v: boolean) {
        this._loop = v;
        this._doSetLoop(v);
    }

    get priority(): number { return this._priority; }
    set priority(v: number) { this._priority = v; }

    get volume(): number { return this.soundGroup.volume * this._volumeInSoundGroup; }

    get volumeInSoundGroup(): number { return this._volumeInSoundGroup; }
    set volumeInSoundGroup(v: number) {
        this._volumeInSoundGroup = v;
        this._refreshVolume();
    }

    get pitch(): number { return this._pitch; }
    set pitch(v: number) {
        this._pitch = v;
        this._doSetPitch(v);
    }

    get panStereo(): number { return this._panStereo; }
    set panStereo(v: number) {
        this._panStereo = v;
        this._doSetPanStereo(v);
    }

    get spatialBlend(): number { return this._spatialBlend; }
    set spatialBlend(v: number) {
        this._spatialBlend = v;
        this._doSetSpatialBlend(v);
    }

    get maxDistance(): number { return this._maxDistance; }
    set maxDistance(v: number) {
        this._maxDistance = v;
        this._doSetMaxDistance(v);
    }

    get dopplerLevel(): number { return this._dopplerLevel; }
    set dopplerLevel(v: number) {
        this._dopplerLevel = v;
        this._doSetDopplerLevel(v);
    }

    get setSoundAssetTime(): number { return this._setSoundAssetTime; }

    play(fadeInSeconds: number = 0): void { this._doPlay(fadeInSeconds); }
    stop(fadeOutSeconds: number = 0): void { this._doStop(fadeOutSeconds); }
    pause(fadeOutSeconds: number = 0): void { this._doPause(fadeOutSeconds); }
    resume(fadeInSeconds: number = 0): void { this._doResume(fadeInSeconds); }

    reset(): void {
        this._serialId = -1;
        this._soundAsset = null;
        this._setSoundAssetTime = -Infinity;
        this._muteInSoundGroup = false;
        this._volumeInSoundGroup = 1.0;
        this._priority = 0;
        this._loop = false;
        this._pitch = 1.0;
        this._panStereo = 0;
        this._spatialBlend = 0;
        this._maxDistance = 100;
        this._dopplerLevel = 1.0;
        this._doReset();
    }

    setSoundAsset(serialId: number, asset: object, params: PlaySoundParams): boolean {
        this.reset();
        this._serialId = serialId;
        this._soundAsset = asset;
        this._setSoundAssetTime = Date.now();
        this._muteInSoundGroup = params.muteInSoundGroup;
        this._volumeInSoundGroup = params.volumeInSoundGroup;
        this._priority = params.priority;
        this._loop = params.loop;
        this._pitch = params.pitch;
        this._panStereo = params.panStereo;
        this._spatialBlend = params.spatialBlend;
        this._maxDistance = params.maxDistance;
        this._dopplerLevel = params.dopplerLevel;
        return this._doSetSoundAsset(asset, params);
    }

    refreshMute(): void { this._refreshMute(); }
    refreshVolume(): void { this._refreshVolume(); }

    private _refreshMute(): void { this._doSetMute(this.mute); }
    private _refreshVolume(): void { this._doSetVolume(this.volume); }

    // ---------- hooks for engine layer ----------
    protected _doIsPlaying(): boolean { return false; }
    protected _doGetLength(): number { return 0; }
    protected _doGetTime(): number { return 0; }
    protected _doSetTime(_t: number): void {}
    protected _doSetLoop(_v: boolean): void {}
    protected _doSetMute(_v: boolean): void {}
    protected _doSetVolume(_v: number): void {}
    protected _doSetPitch(_v: number): void {}
    protected _doSetPanStereo(_v: number): void {}
    protected _doSetSpatialBlend(_v: number): void {}
    protected _doSetMaxDistance(_v: number): void {}
    protected _doSetDopplerLevel(_v: number): void {}
    protected _doPlay(_fadeInSeconds: number): void {}
    protected _doStop(_fadeOutSeconds: number): void {}
    protected _doPause(_fadeOutSeconds: number): void {}
    protected _doResume(_fadeInSeconds: number): void {}
    protected _doReset(): void {}
    protected _doSetSoundAsset(_asset: object, _params: PlaySoundParams): boolean { return true; }
}

// ---------- SoundGroup ----------

export class SoundGroup implements ISoundGroup {
    readonly name: string;
    readonly agents: SoundAgent[] = [];

    private _avoidBeingReplacedBySamePriority: boolean;
    private _mute: boolean;
    private _volume: number;

    constructor(
        name: string,
        avoidBeingReplacedBySamePriority: boolean,
        mute: boolean,
        volume: number
    ) {
        this.name = name;
        this._avoidBeingReplacedBySamePriority = avoidBeingReplacedBySamePriority;
        this._mute = mute;
        this._volume = volume;
    }

    get soundAgentCount(): number { return this.agents.length; }

    get avoidBeingReplacedBySamePriority(): boolean { return this._avoidBeingReplacedBySamePriority; }
    set avoidBeingReplacedBySamePriority(v: boolean) { this._avoidBeingReplacedBySamePriority = v; }

    get mute(): boolean { return this._mute; }
    set mute(v: boolean) {
        this._mute = v;
        for (const agent of this.agents) agent.refreshMute();
    }

    get volume(): number { return this._volume; }
    set volume(v: number) {
        this._volume = Math.max(0, Math.min(1, v));
        for (const agent of this.agents) agent.refreshVolume();
    }

    playSound(
        serialId: number,
        soundAsset: object,
        params: PlaySoundParams
    ): { agent: SoundAgent | null; errorCode: PlaySoundErrorCode | null } {
        let candidate: SoundAgent | null = null;

        for (const agent of this.agents) {
            if (agent.serialId < 0) {
                candidate = agent;
                break;
            }
        }

        if (!candidate) {
            // Find lowest priority agent to replace
            let lowestPriority = params.priority;
            for (const agent of this.agents) {
                if (agent.priority < lowestPriority) {
                    lowestPriority = agent.priority;
                    candidate = agent;
                } else if (
                    !this._avoidBeingReplacedBySamePriority &&
                    agent.priority === lowestPriority
                ) {
                    if (!candidate || agent.setSoundAssetTime < candidate.setSoundAssetTime) {
                        candidate = agent;
                    }
                }
            }

            if (!candidate) {
                return { agent: null, errorCode: PlaySoundErrorCode.IgnoredDueToLowPriority };
            }

            candidate.stop(0);
        }

        if (!candidate.setSoundAsset(serialId, soundAsset, params)) {
            return { agent: null, errorCode: PlaySoundErrorCode.SetSoundAssetFailure };
        }

        candidate.play(params.fadeInSeconds);
        return { agent: candidate, errorCode: null };
    }

    stopSound(serialId: number, fadeOutSeconds: number): boolean {
        for (const agent of this.agents) {
            if (agent.serialId === serialId) {
                agent.stop(fadeOutSeconds);
                agent.reset();
                return true;
            }
        }
        return false;
    }

    pauseSound(serialId: number, fadeOutSeconds: number): boolean {
        for (const agent of this.agents) {
            if (agent.serialId === serialId) {
                agent.pause(fadeOutSeconds);
                return true;
            }
        }
        return false;
    }

    resumeSound(serialId: number, fadeInSeconds: number): boolean {
        for (const agent of this.agents) {
            if (agent.serialId === serialId) {
                agent.resume(fadeInSeconds);
                return true;
            }
        }
        return false;
    }

    stopAllLoadedSounds(fadeOutSeconds: number = 0): void {
        for (const agent of this.agents) {
            if (agent.serialId >= 0) {
                agent.stop(fadeOutSeconds);
                agent.reset();
            }
        }
    }
}

// ---------- SoundManager ----------

export abstract class SoundManager extends GameFrameworkModule implements ISoundManager {
    protected _resourceManager: IResourceManager | null = null;
    protected _soundHelper: ISoundHelper | null = null;

    private _groups: Map<string, SoundGroup> = new Map();
    private _soundsBeingLoaded: Set<number> = new Set();
    private _soundsToReleaseOnLoad: Set<number> = new Set();
    private _serialId: number = 0;
    private _pendingLoadInfo: Map<number, PlaySoundInfo> = new Map();

    onPlaySoundSuccess: ((args: PlaySoundSuccessEventArgs) => void) | null = null;
    onPlaySoundFailure: ((args: PlaySoundFailureEventArgs) => void) | null = null;
    onPlaySoundUpdate: ((args: PlaySoundUpdateEventArgs) => void) | null = null;
    onPlaySoundDependencyAsset: ((args: PlaySoundDependencyAssetEventArgs) => void) | null = null;

    get priority(): number { return 30; }
    get soundGroupCount(): number { return this._groups.size; }

    setResourceManager(rm: IResourceManager): void { this._resourceManager = rm; }
    setSoundHelper(helper: ISoundHelper): void { this._soundHelper = helper; }

    addSoundGroup(
        groupName: string,
        avoidBeingReplacedBySamePriority: boolean = false,
        mute: boolean = false,
        volume: number = 1.0,
        agentCount: number = 1
    ): boolean {
        if (this._groups.has(groupName)) return false;
        const group = new (this._createSoundGroup())(groupName, avoidBeingReplacedBySamePriority, mute, volume);
        for (let i = 0; i < agentCount; i++) {
            group.agents.push(this._createSoundAgent(group));
        }
        this._groups.set(groupName, group);
        return true;
    }

    hasSoundGroup(groupName: string): boolean { return this._groups.has(groupName); }

    getSoundGroup(groupName: string): ISoundGroup | null {
        return this._groups.get(groupName) ?? null;
    }

    getAllSoundGroups(): ISoundGroup[] {
        return Array.from(this._groups.values());
    }

    getAllLoadingSoundSerialIds(): number[] {
        return Array.from(this._soundsBeingLoaded);
    }

    isLoadingSound(serialId: number): boolean {
        return this._soundsBeingLoaded.has(serialId);
    }

    playSound(
        soundAssetName: string,
        bundleName: string,
        groupName: string,
        params?: PlaySoundParams,
        userData?: object
    ): number {
        if (!this._resourceManager) {
            throw new GameFrameworkError('ResourceManager is not set.');
        }

        const group = this._groups.get(groupName);
        if (!group) {
            throw new GameFrameworkError(`SoundGroup [${groupName}] not found.`);
        }

        if (group.agents.length === 0) {
            throw new GameFrameworkError(`SoundGroup [${groupName}] has no agent.`);
        }

        const serialId = ++this._serialId;
        const resolvedParams = params ?? PlaySoundParams.create();
        const info = PlaySoundInfo.create(serialId, group, resolvedParams, userData ?? null);

        this._soundsBeingLoaded.add(serialId);
        this._pendingLoadInfo.set(serialId, info);

        this._resourceManager.loadAsset(
            bundleName,
            soundAssetName,
            Object as any,
            (asset: object) => this._onLoadSuccess(serialId, soundAssetName, asset),
            (name: string, msg: string) => this._onLoadFailure(serialId, soundAssetName, groupName, name, msg),
        );

        return serialId;
    }

    private _onLoadSuccess(serialId: number, soundAssetName: string, asset: object): void {
        if (this._soundsToReleaseOnLoad.has(serialId)) {
            this._soundsToReleaseOnLoad.delete(serialId);
            this._cleanupPendingInfo(serialId);
            return;
        }

        this._soundsBeingLoaded.delete(serialId);
        const info = this._pendingLoadInfo.get(serialId);
        if (!info || !info.soundGroup || !info.playSoundParams) {
            this._cleanupPendingInfo(serialId);
            return;
        }

        const startTime = Date.now();
        const { agent, errorCode } = info.soundGroup.playSound(serialId, asset, info.playSoundParams);

        if (!agent || errorCode !== null) {
            const code = errorCode ?? PlaySoundErrorCode.Unknown;
            const errMsg = `Play sound '${soundAssetName}' failed, error code: ${PlaySoundErrorCode[code]}.`;
            if (this.onPlaySoundFailure) {
                this.onPlaySoundFailure(PlaySoundFailureEventArgs.create(
                    serialId, soundAssetName, info.soundGroup.name,
                    info.playSoundParams, code, errMsg, info.userData
                ));
            }
            this._cleanupPendingInfo(serialId);
            return;
        }

        const duration = (Date.now() - startTime) / 1000;
        if (this.onPlaySoundSuccess) {
            this.onPlaySoundSuccess(PlaySoundSuccessEventArgs.create(
                serialId, soundAssetName, agent, duration, info.userData
            ));
        }
        this._cleanupPendingInfo(serialId);
    }

    private _onLoadFailure(
        serialId: number,
        soundAssetName: string,
        groupName: string,
        _name: string,
        msg: string
    ): void {
        if (this._soundsToReleaseOnLoad.has(serialId)) {
            this._soundsToReleaseOnLoad.delete(serialId);
            this._cleanupPendingInfo(serialId);
            return;
        }

        this._soundsBeingLoaded.delete(serialId);
        const info = this._pendingLoadInfo.get(serialId);
        const errMsg = `Load sound '${soundAssetName}' failed: ${msg}`;
        if (this.onPlaySoundFailure) {
            this.onPlaySoundFailure(PlaySoundFailureEventArgs.create(
                serialId, soundAssetName, groupName,
                info?.playSoundParams ?? null,
                PlaySoundErrorCode.LoadAssetFailure,
                errMsg,
                info?.userData ?? null
            ));
        }
        this._cleanupPendingInfo(serialId);
    }

    private _cleanupPendingInfo(serialId: number): void {
        const info = this._pendingLoadInfo.get(serialId);
        if (info) {
            if (info.playSoundParams?.referenced) {
                ReferencePool.release(info.playSoundParams);
            }
            ReferencePool.release(info);
            this._pendingLoadInfo.delete(serialId);
        }
    }

    stopSound(serialId: number, fadeOutSeconds: number = 0): boolean {
        if (this._soundsBeingLoaded.has(serialId)) {
            this._soundsToReleaseOnLoad.add(serialId);
            this._soundsBeingLoaded.delete(serialId);
            return true;
        }

        for (const group of this._groups.values()) {
            for (const agent of group.agents) {
                if (agent.serialId === serialId) {
                    const asset = agent.soundAsset;
                    if (group.stopSound(serialId, fadeOutSeconds)) {
                        if (asset) this._soundHelper?.releaseSoundAsset(asset);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    stopAllLoadedSounds(fadeOutSeconds: number = 0): void {
        for (const group of this._groups.values()) {
            const assets: (object | null)[] = group.agents
                .filter(a => a.serialId >= 0)
                .map(a => a.soundAsset);
            group.stopAllLoadedSounds(fadeOutSeconds);
            for (const asset of assets) {
                if (asset) this._soundHelper?.releaseSoundAsset(asset);
            }
        }
    }

    stopAllLoadingSounds(): void {
        for (const id of this._soundsBeingLoaded) {
            this._soundsToReleaseOnLoad.add(id);
        }
    }

    pauseSound(serialId: number, fadeOutSeconds: number = 0): void {
        for (const group of this._groups.values()) {
            if (group.pauseSound(serialId, fadeOutSeconds)) return;
        }
        throw new GameFrameworkError(`Sound [${serialId}] not found.`);
    }

    resumeSound(serialId: number, fadeInSeconds: number = 0): void {
        for (const group of this._groups.values()) {
            if (group.resumeSound(serialId, fadeInSeconds)) return;
        }
        throw new GameFrameworkError(`Sound [${serialId}] not found.`);
    }

    isMuted(groupName: string): boolean {
        return this._groups.get(groupName)?.mute ?? false;
    }

    setMuted(groupName: string, mute: boolean): void {
        const g = this._groups.get(groupName);
        if (g) g.mute = mute;
    }

    getVolume(groupName: string): number {
        return this._groups.get(groupName)?.volume ?? 1.0;
    }

    setVolume(groupName: string, volume: number): void {
        const g = this._groups.get(groupName);
        if (g) g.volume = volume;
    }

    // Subclasses provide concrete agent/group factories
    protected abstract _createSoundAgent(group: SoundGroup): SoundAgent;
    protected _createSoundGroup(): new (
        name: string,
        avoidBeingReplacedBySamePriority: boolean,
        mute: boolean,
        volume: number
    ) => SoundGroup {
        return SoundGroup;
    }

    update(_e: number, _r: number): void {}

    shutdown(): void {
        this.stopAllLoadedSounds();
        this._groups.clear();
        this._soundsBeingLoaded.clear();
        this._soundsToReleaseOnLoad.clear();
        this._pendingLoadInfo.forEach((_, id) => this._cleanupPendingInfo(id));
        this._pendingLoadInfo.clear();
        this._resourceManager = null;
    }
}
