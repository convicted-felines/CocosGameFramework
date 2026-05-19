import { BaseEventArgs } from '../Event/BaseEventArgs';
import { ReferencePool } from '../ReferencePool/ReferencePool';

export class DownloadStartEventArgs extends BaseEventArgs {
    static readonly eventId = 'download.start';
    get id(): string { return DownloadStartEventArgs.eventId; }

    serialId!: number;
    downloadPath!: string;
    downloadUri!: string;
    currentLength!: number;
    userData?: object;

    static create(serialId: number, downloadPath: string, downloadUri: string, currentLength: number, userData?: object): DownloadStartEventArgs {
        const e = ReferencePool.acquire(DownloadStartEventArgs);
        e.serialId = serialId;
        e.downloadPath = downloadPath;
        e.downloadUri = downloadUri;
        e.currentLength = currentLength;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.downloadPath = '';
        this.downloadUri = '';
        this.currentLength = 0;
        this.userData = undefined;
    }
}

export class DownloadUpdateEventArgs extends BaseEventArgs {
    static readonly eventId = 'download.update';
    get id(): string { return DownloadUpdateEventArgs.eventId; }

    serialId!: number;
    downloadPath!: string;
    downloadUri!: string;
    currentLength!: number;
    userData?: object;

    static create(serialId: number, downloadPath: string, downloadUri: string, currentLength: number, userData?: object): DownloadUpdateEventArgs {
        const e = ReferencePool.acquire(DownloadUpdateEventArgs);
        e.serialId = serialId;
        e.downloadPath = downloadPath;
        e.downloadUri = downloadUri;
        e.currentLength = currentLength;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.downloadPath = '';
        this.downloadUri = '';
        this.currentLength = 0;
        this.userData = undefined;
    }
}

export class DownloadSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'download.success';
    get id(): string { return DownloadSuccessEventArgs.eventId; }

    serialId!: number;
    downloadPath!: string;
    downloadUri!: string;
    currentLength!: number;
    userData?: object;

    static create(serialId: number, downloadPath: string, downloadUri: string, currentLength: number, userData?: object): DownloadSuccessEventArgs {
        const e = ReferencePool.acquire(DownloadSuccessEventArgs);
        e.serialId = serialId;
        e.downloadPath = downloadPath;
        e.downloadUri = downloadUri;
        e.currentLength = currentLength;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.downloadPath = '';
        this.downloadUri = '';
        this.currentLength = 0;
        this.userData = undefined;
    }
}

export class DownloadFailureEventArgs extends BaseEventArgs {
    static readonly eventId = 'download.failure';
    get id(): string { return DownloadFailureEventArgs.eventId; }

    serialId!: number;
    downloadPath!: string;
    downloadUri!: string;
    errorMessage!: string;
    userData?: object;

    static create(serialId: number, downloadPath: string, downloadUri: string, errorMessage: string, userData?: object): DownloadFailureEventArgs {
        const e = ReferencePool.acquire(DownloadFailureEventArgs);
        e.serialId = serialId;
        e.downloadPath = downloadPath;
        e.downloadUri = downloadUri;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.downloadPath = '';
        this.downloadUri = '';
        this.errorMessage = '';
        this.userData = undefined;
    }
}
