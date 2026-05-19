import { BaseEventArgs } from '../../GameFramework/Event/BaseEventArgs';
import { ReferencePool } from '../../GameFramework/ReferencePool/ReferencePool';

export class LoadDataTableSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'datatable.loadSuccess';
    get id(): string { return LoadDataTableSuccessEventArgs.eventId; }

    dataTableAssetName!: string;
    duration!: number;
    userData?: any;

    static create(dataTableAssetName: string, duration: number, userData?: any): LoadDataTableSuccessEventArgs {
        const e = ReferencePool.acquire(LoadDataTableSuccessEventArgs);
        e.dataTableAssetName = dataTableAssetName;
        e.duration = duration;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.dataTableAssetName = '';
        this.duration = 0;
        this.userData = undefined;
    }
}

export class LoadDataTableFailureEventArgs extends BaseEventArgs {
    static readonly eventId = 'datatable.loadFailure';
    get id(): string { return LoadDataTableFailureEventArgs.eventId; }

    dataTableAssetName!: string;
    errorMessage!: string;
    userData?: any;

    static create(dataTableAssetName: string, errorMessage: string, userData?: any): LoadDataTableFailureEventArgs {
        const e = ReferencePool.acquire(LoadDataTableFailureEventArgs);
        e.dataTableAssetName = dataTableAssetName;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.dataTableAssetName = '';
        this.errorMessage = '';
        this.userData = undefined;
    }
}

export class LoadDataTableUpdateEventArgs extends BaseEventArgs {
    static readonly eventId = 'datatable.loadUpdate';
    get id(): string { return LoadDataTableUpdateEventArgs.eventId; }

    dataTableAssetName!: string;
    progress!: number;
    userData?: any;

    static create(dataTableAssetName: string, progress: number, userData?: any): LoadDataTableUpdateEventArgs {
        const e = ReferencePool.acquire(LoadDataTableUpdateEventArgs);
        e.dataTableAssetName = dataTableAssetName;
        e.progress = progress;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.dataTableAssetName = '';
        this.progress = 0;
        this.userData = undefined;
    }
}
