import { BaseEventArgs } from '../Event/BaseEventArgs';
import { ReferencePool } from '../ReferencePool/ReferencePool';
import { PlaySoundParams } from './PlaySoundParams';

export class PlaySoundUpdateEventArgs extends BaseEventArgs {
    static readonly EVENT_ID = 'Sound.PlaySoundUpdate';

    get id(): string { return PlaySoundUpdateEventArgs.EVENT_ID; }

    serialId: number = 0;
    soundAssetName: string = '';
    soundGroupName: string = '';
    playSoundParams: PlaySoundParams | null = null;
    progress: number = 0;
    userData: object | null = null;

    static create(
        serialId: number,
        soundAssetName: string,
        soundGroupName: string,
        playSoundParams: PlaySoundParams | null,
        progress: number,
        userData: object | null
    ): PlaySoundUpdateEventArgs {
        const e = ReferencePool.acquire(PlaySoundUpdateEventArgs);
        e.serialId = serialId;
        e.soundAssetName = soundAssetName;
        e.soundGroupName = soundGroupName;
        e.playSoundParams = playSoundParams;
        e.progress = progress;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.soundAssetName = '';
        this.soundGroupName = '';
        this.playSoundParams = null;
        this.progress = 0;
        this.userData = null;
    }
}
