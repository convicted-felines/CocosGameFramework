import { PlaySoundParams } from './PlaySoundParams';
import { PlaySoundSuccessEventArgs } from './PlaySoundSuccessEventArgs';
import { PlaySoundFailureEventArgs } from './PlaySoundFailureEventArgs';
import { PlaySoundUpdateEventArgs } from './PlaySoundUpdateEventArgs';
import { PlaySoundDependencyAssetEventArgs } from './PlaySoundDependencyAssetEventArgs';

export type { PlaySoundParams };

export interface ISoundAgent {
    readonly soundGroup: ISoundGroup;
    readonly serialId: number;
    readonly isPlaying: boolean;
    readonly length: number;
    time: number;
    readonly mute: boolean;
    muteInSoundGroup: boolean;
    loop: boolean;
    priority: number;
    readonly volume: number;
    volumeInSoundGroup: number;
    pitch: number;
    panStereo: number;
    spatialBlend: number;
    maxDistance: number;
    dopplerLevel: number;

    play(fadeInSeconds?: number): void;
    stop(fadeOutSeconds?: number): void;
    pause(fadeOutSeconds?: number): void;
    resume(fadeInSeconds?: number): void;
    reset(): void;
}

export interface ISoundGroup {
    readonly name: string;
    readonly soundAgentCount: number;
    avoidBeingReplacedBySamePriority: boolean;
    mute: boolean;
    volume: number;
    stopAllLoadedSounds(fadeOutSeconds?: number): void;
}

export type PlaySoundSuccessHandler = (args: PlaySoundSuccessEventArgs) => void;
export type PlaySoundFailureHandler = (args: PlaySoundFailureEventArgs) => void;
export type PlaySoundUpdateHandler = (args: PlaySoundUpdateEventArgs) => void;
export type PlaySoundDependencyAssetHandler = (args: PlaySoundDependencyAssetEventArgs) => void;

export interface ISoundManager {
    readonly soundGroupCount: number;

    onPlaySoundSuccess: PlaySoundSuccessHandler | null;
    onPlaySoundFailure: PlaySoundFailureHandler | null;
    onPlaySoundUpdate: PlaySoundUpdateHandler | null;
    onPlaySoundDependencyAsset: PlaySoundDependencyAssetHandler | null;

    addSoundGroup(
        groupName: string,
        avoidBeingReplacedBySamePriority?: boolean,
        mute?: boolean,
        volume?: number,
        agentCount?: number
    ): boolean;

    hasSoundGroup(groupName: string): boolean;
    getSoundGroup(groupName: string): ISoundGroup | null;
    getAllSoundGroups(): ISoundGroup[];

    getAllLoadingSoundSerialIds(): number[];
    isLoadingSound(serialId: number): boolean;

    playSound(
        soundAssetName: string,
        bundleName: string,
        groupName: string,
        params?: PlaySoundParams,
        userData?: object
    ): number;

    stopSound(serialId: number, fadeOutSeconds?: number): boolean;
    stopAllLoadedSounds(fadeOutSeconds?: number): void;
    stopAllLoadingSounds(): void;
    pauseSound(serialId: number, fadeOutSeconds?: number): void;
    resumeSound(serialId: number, fadeInSeconds?: number): void;

    isMuted(groupName: string): boolean;
    setMuted(groupName: string, mute: boolean): void;
    getVolume(groupName: string): number;
    setVolume(groupName: string, volume: number): void;
}
