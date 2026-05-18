export interface ISoundGroup {
    readonly name: string;
    avoidBeingReplacedBySamePriority: boolean;
    mute: boolean;
    volume: number;
    readonly soundCount: number;
}

export interface IPlaySoundParams {
    priority?: number;
    loop?: boolean;
    volume?: number;
    fadeInSeconds?: number;
    startTime?: number;
}

export interface ISoundManager {
    readonly soundGroupCount: number;

    addSoundGroup(
        groupName: string,
        avoidBeingReplacedBySamePriority?: boolean,
        mute?: boolean,
        volume?: number
    ): boolean;

    hasSoundGroup(groupName: string): boolean;
    getSoundGroup(groupName: string): ISoundGroup | null;
    getAllSoundGroups(): ISoundGroup[];

    // 返回 serialId（-1 表示失败）
    playSound(
        soundAssetName: string,
        bundleName: string,
        groupName: string,
        params?: IPlaySoundParams,
        userData?: object
    ): number;

    stopSound(serialId: number, fadeOutSeconds?: number): boolean;
    stopAllSounds(fadeOutSeconds?: number): void;
    pauseSound(serialId: number, fadeOutSeconds?: number): boolean;
    resumeSound(serialId: number, fadeInSeconds?: number): boolean;

    isMuted(groupName: string): boolean;
    setMuted(groupName: string, mute: boolean): void;
    getVolume(groupName: string): number;
    setVolume(groupName: string, volume: number): void;
}
