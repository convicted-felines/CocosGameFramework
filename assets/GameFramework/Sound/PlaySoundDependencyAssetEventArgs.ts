import { BaseEventArgs } from '../Event/BaseEventArgs';
import { ReferencePool } from '../ReferencePool/ReferencePool';
import { PlaySoundParams } from './PlaySoundParams';

export class PlaySoundDependencyAssetEventArgs extends BaseEventArgs {
    static readonly EVENT_ID = 'Sound.PlaySoundDependencyAsset';

    get id(): string { return PlaySoundDependencyAssetEventArgs.EVENT_ID; }

    serialId: number = 0;
    soundAssetName: string = '';
    soundGroupName: string = '';
    playSoundParams: PlaySoundParams | null = null;
    dependencyAssetName: string = '';
    loadedCount: number = 0;
    totalCount: number = 0;
    userData: object | null = null;

    static create(
        serialId: number,
        soundAssetName: string,
        soundGroupName: string,
        playSoundParams: PlaySoundParams | null,
        dependencyAssetName: string,
        loadedCount: number,
        totalCount: number,
        userData: object | null
    ): PlaySoundDependencyAssetEventArgs {
        const e = ReferencePool.acquire(PlaySoundDependencyAssetEventArgs);
        e.serialId = serialId;
        e.soundAssetName = soundAssetName;
        e.soundGroupName = soundGroupName;
        e.playSoundParams = playSoundParams;
        e.dependencyAssetName = dependencyAssetName;
        e.loadedCount = loadedCount;
        e.totalCount = totalCount;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.soundAssetName = '';
        this.soundGroupName = '';
        this.playSoundParams = null;
        this.dependencyAssetName = '';
        this.loadedCount = 0;
        this.totalCount = 0;
        this.userData = null;
    }
}
