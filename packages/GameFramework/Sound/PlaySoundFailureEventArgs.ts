import { BaseEventArgs } from '../Event/BaseEventArgs';
import { ReferencePool } from '../ReferencePool/ReferencePool';
import { PlaySoundParams } from './PlaySoundParams';
import { PlaySoundErrorCode } from './PlaySoundErrorCode';

export class PlaySoundFailureEventArgs extends BaseEventArgs {
    static readonly EVENT_ID = 'Sound.PlaySoundFailure';

    get id(): string { return PlaySoundFailureEventArgs.EVENT_ID; }

    serialId: number = 0;
    soundAssetName: string = '';
    soundGroupName: string = '';
    playSoundParams: PlaySoundParams | null = null;
    errorCode: PlaySoundErrorCode = PlaySoundErrorCode.Unknown;
    errorMessage: string = '';
    userData: object | null = null;

    static create(
        serialId: number,
        soundAssetName: string,
        soundGroupName: string,
        playSoundParams: PlaySoundParams | null,
        errorCode: PlaySoundErrorCode,
        errorMessage: string,
        userData: object | null
    ): PlaySoundFailureEventArgs {
        const e = ReferencePool.acquire(PlaySoundFailureEventArgs);
        e.serialId = serialId;
        e.soundAssetName = soundAssetName;
        e.soundGroupName = soundGroupName;
        e.playSoundParams = playSoundParams;
        e.errorCode = errorCode;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.soundAssetName = '';
        this.soundGroupName = '';
        this.playSoundParams = null;
        this.errorCode = PlaySoundErrorCode.Unknown;
        this.errorMessage = '';
        this.userData = null;
    }
}
