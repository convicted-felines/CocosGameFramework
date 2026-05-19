import { BaseEventArgs } from '../Event/BaseEventArgs';
import { ReferencePool } from '../ReferencePool/ReferencePool';

// ─── 热更新事件 ──────────────────────────────────────────────────────────────

export class ResourceUpdateStartEventArgs extends BaseEventArgs {
    static readonly eventId = 'resource.update.start';
    get id(): string { return ResourceUpdateStartEventArgs.eventId; }

    name!: string;
    downloadPath!: string;
    downloadUri!: string;
    currentLength!: number;
    compressedLength!: number;
    length!: number;

    static create(name: string, downloadPath: string, downloadUri: string, currentLength: number, compressedLength: number, length: number): ResourceUpdateStartEventArgs {
        const e = ReferencePool.acquire(ResourceUpdateStartEventArgs);
        e.name = name; e.downloadPath = downloadPath; e.downloadUri = downloadUri;
        e.currentLength = currentLength; e.compressedLength = compressedLength; e.length = length;
        return e;
    }

    clear(): void {
        this.name = ''; this.downloadPath = ''; this.downloadUri = '';
        this.currentLength = 0; this.compressedLength = 0; this.length = 0;
    }
}

export class ResourceUpdateChangedEventArgs extends BaseEventArgs {
    static readonly eventId = 'resource.update.changed';
    get id(): string { return ResourceUpdateChangedEventArgs.eventId; }

    name!: string;
    downloadPath!: string;
    downloadUri!: string;
    currentLength!: number;
    compressedLength!: number;
    length!: number;

    static create(name: string, downloadPath: string, downloadUri: string, currentLength: number, compressedLength: number, length: number): ResourceUpdateChangedEventArgs {
        const e = ReferencePool.acquire(ResourceUpdateChangedEventArgs);
        e.name = name; e.downloadPath = downloadPath; e.downloadUri = downloadUri;
        e.currentLength = currentLength; e.compressedLength = compressedLength; e.length = length;
        return e;
    }

    clear(): void {
        this.name = ''; this.downloadPath = ''; this.downloadUri = '';
        this.currentLength = 0; this.compressedLength = 0; this.length = 0;
    }
}

export class ResourceUpdateSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'resource.update.success';
    get id(): string { return ResourceUpdateSuccessEventArgs.eventId; }

    name!: string;
    downloadPath!: string;
    downloadUri!: string;
    length!: number;
    compressedLength!: number;

    static create(name: string, downloadPath: string, downloadUri: string, length: number, compressedLength: number): ResourceUpdateSuccessEventArgs {
        const e = ReferencePool.acquire(ResourceUpdateSuccessEventArgs);
        e.name = name; e.downloadPath = downloadPath; e.downloadUri = downloadUri;
        e.length = length; e.compressedLength = compressedLength;
        return e;
    }

    clear(): void {
        this.name = ''; this.downloadPath = ''; this.downloadUri = '';
        this.length = 0; this.compressedLength = 0;
    }
}

export class ResourceUpdateFailureEventArgs extends BaseEventArgs {
    static readonly eventId = 'resource.update.failure';
    get id(): string { return ResourceUpdateFailureEventArgs.eventId; }

    name!: string;
    downloadUri!: string;
    retryCount!: number;
    totalRetryCount!: number;
    errorMessage!: string;

    static create(name: string, downloadUri: string, retryCount: number, totalRetryCount: number, errorMessage: string): ResourceUpdateFailureEventArgs {
        const e = ReferencePool.acquire(ResourceUpdateFailureEventArgs);
        e.name = name; e.downloadUri = downloadUri;
        e.retryCount = retryCount; e.totalRetryCount = totalRetryCount; e.errorMessage = errorMessage;
        return e;
    }

    clear(): void {
        this.name = ''; this.downloadUri = '';
        this.retryCount = 0; this.totalRetryCount = 0; this.errorMessage = '';
    }
}

export class ResourceUpdateAllCompleteEventArgs extends BaseEventArgs {
    static readonly eventId = 'resource.update.allComplete';
    get id(): string { return ResourceUpdateAllCompleteEventArgs.eventId; }

    static create(): ResourceUpdateAllCompleteEventArgs {
        return ReferencePool.acquire(ResourceUpdateAllCompleteEventArgs);
    }

    clear(): void {}
}

// ─── 场景事件 ────────────────────────────────────────────────────────────────

export class LoadSceneSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'resource.scene.loadSuccess';
    get id(): string { return LoadSceneSuccessEventArgs.eventId; }

    sceneAssetName!: string;
    duration!: number;
    userData?: object;

    static create(sceneAssetName: string, duration: number, userData?: object): LoadSceneSuccessEventArgs {
        const e = ReferencePool.acquire(LoadSceneSuccessEventArgs);
        e.sceneAssetName = sceneAssetName; e.duration = duration; e.userData = userData;
        return e;
    }

    clear(): void { this.sceneAssetName = ''; this.duration = 0; this.userData = undefined; }
}

export class LoadSceneFailureEventArgs extends BaseEventArgs {
    static readonly eventId = 'resource.scene.loadFailure';
    get id(): string { return LoadSceneFailureEventArgs.eventId; }

    sceneAssetName!: string;
    errorMessage!: string;
    userData?: object;

    static create(sceneAssetName: string, errorMessage: string, userData?: object): LoadSceneFailureEventArgs {
        const e = ReferencePool.acquire(LoadSceneFailureEventArgs);
        e.sceneAssetName = sceneAssetName; e.errorMessage = errorMessage; e.userData = userData;
        return e;
    }

    clear(): void { this.sceneAssetName = ''; this.errorMessage = ''; this.userData = undefined; }
}

export class UnloadSceneSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'resource.scene.unloadSuccess';
    get id(): string { return UnloadSceneSuccessEventArgs.eventId; }

    sceneAssetName!: string;
    userData?: object;

    static create(sceneAssetName: string, userData?: object): UnloadSceneSuccessEventArgs {
        const e = ReferencePool.acquire(UnloadSceneSuccessEventArgs);
        e.sceneAssetName = sceneAssetName; e.userData = userData;
        return e;
    }

    clear(): void { this.sceneAssetName = ''; this.userData = undefined; }
}

export class UnloadSceneFailureEventArgs extends BaseEventArgs {
    static readonly eventId = 'resource.scene.unloadFailure';
    get id(): string { return UnloadSceneFailureEventArgs.eventId; }

    sceneAssetName!: string;
    userData?: object;

    static create(sceneAssetName: string, userData?: object): UnloadSceneFailureEventArgs {
        const e = ReferencePool.acquire(UnloadSceneFailureEventArgs);
        e.sceneAssetName = sceneAssetName; e.userData = userData;
        return e;
    }

    clear(): void { this.sceneAssetName = ''; this.userData = undefined; }
}

// ─── 资产加载事件 ────────────────────────────────────────────────────────────

export class LoadAssetSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'resource.asset.loadSuccess';
    get id(): string { return LoadAssetSuccessEventArgs.eventId; }

    assetName!: string;
    asset!: object;
    duration!: number;
    userData?: object;

    static create(assetName: string, asset: object, duration: number, userData?: object): LoadAssetSuccessEventArgs {
        const e = ReferencePool.acquire(LoadAssetSuccessEventArgs);
        e.assetName = assetName; e.asset = asset; e.duration = duration; e.userData = userData;
        return e;
    }

    clear(): void { this.assetName = ''; this.asset = {}; this.duration = 0; this.userData = undefined; }
}

export class LoadAssetFailureEventArgs extends BaseEventArgs {
    static readonly eventId = 'resource.asset.loadFailure';
    get id(): string { return LoadAssetFailureEventArgs.eventId; }

    assetName!: string;
    errorMessage!: string;
    userData?: object;

    static create(assetName: string, errorMessage: string, userData?: object): LoadAssetFailureEventArgs {
        const e = ReferencePool.acquire(LoadAssetFailureEventArgs);
        e.assetName = assetName; e.errorMessage = errorMessage; e.userData = userData;
        return e;
    }

    clear(): void { this.assetName = ''; this.errorMessage = ''; this.userData = undefined; }
}
