import { BaseEventArgs } from '../Event/BaseEventArgs';
import { ReferencePool } from '../ReferencePool/ReferencePool';
import { ISoundAgent } from './ISoundManager';

export class PlaySoundSuccessEventArgs extends BaseEventArgs {
    static readonly EVENT_ID = 'Sound.PlaySoundSuccess';

    get id(): string { return PlaySoundSuccessEventArgs.EVENT_ID; }

    serialId: number = 0;
    soundAssetName: string = '';
    soundAgent: ISoundAgent | null = null;
    duration: number = 0;
    userData: object | null = null;

    static create(
        serialId: number,
        soundAssetName: string,
        soundAgent: ISoundAgent,
        duration: number,
        userData: object | null
    ): PlaySoundSuccessEventArgs {
        const e = ReferencePool.acquire(PlaySoundSuccessEventArgs);
        e.serialId = serialId;
        e.soundAssetName = soundAssetName;
        e.soundAgent = soundAgent;
        e.duration = duration;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.soundAssetName = '';
        this.soundAgent = null;
        this.duration = 0;
        this.userData = null;
    }
}
