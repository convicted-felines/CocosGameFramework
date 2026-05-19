import { BaseEventArgs } from '../../GameFramework/Event/BaseEventArgs';
import { ReferencePool } from '../../GameFramework/ReferencePool/ReferencePool';

export class LoadConfigSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'config.loadSuccess';
    get id(): string { return LoadConfigSuccessEventArgs.eventId; }

    configAssetName!: string;
    duration!: number;
    userData?: any;

    static create(configAssetName: string, duration: number, userData?: any): LoadConfigSuccessEventArgs {
        const e = ReferencePool.acquire(LoadConfigSuccessEventArgs);
        e.configAssetName = configAssetName;
        e.duration = duration;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.configAssetName = '';
        this.duration = 0;
        this.userData = undefined;
    }
}

export class LoadConfigFailureEventArgs extends BaseEventArgs {
    static readonly eventId = 'config.loadFailure';
    get id(): string { return LoadConfigFailureEventArgs.eventId; }

    configAssetName!: string;
    errorMessage!: string;
    userData?: any;

    static create(configAssetName: string, errorMessage: string, userData?: any): LoadConfigFailureEventArgs {
        const e = ReferencePool.acquire(LoadConfigFailureEventArgs);
        e.configAssetName = configAssetName;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.configAssetName = '';
        this.errorMessage = '';
        this.userData = undefined;
    }
}
