import { BaseEventArgs } from '../Event/BaseEventArgs';
import { ReferencePool } from '../ReferencePool/ReferencePool';

export class OpenUIFormSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'ui.open.success';
    get id(): string { return OpenUIFormSuccessEventArgs.eventId; }

    serialId!: number;
    uiFormAssetName!: string;
    uiGroupName!: string;
    pauseCoveredUIForm!: boolean;
    duration!: number;
    userData?: object;

    static create(
        serialId: number,
        uiFormAssetName: string,
        uiGroupName: string,
        pauseCoveredUIForm: boolean,
        duration: number,
        userData?: object
    ): OpenUIFormSuccessEventArgs {
        const e = ReferencePool.acquire(OpenUIFormSuccessEventArgs);
        e.serialId = serialId;
        e.uiFormAssetName = uiFormAssetName;
        e.uiGroupName = uiGroupName;
        e.pauseCoveredUIForm = pauseCoveredUIForm;
        e.duration = duration;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.uiFormAssetName = '';
        this.uiGroupName = '';
        this.pauseCoveredUIForm = false;
        this.duration = 0;
        this.userData = undefined;
    }
}

export class OpenUIFormFailureEventArgs extends BaseEventArgs {
    static readonly eventId = 'ui.open.failure';
    get id(): string { return OpenUIFormFailureEventArgs.eventId; }

    serialId!: number;
    uiFormAssetName!: string;
    uiGroupName!: string;
    pauseCoveredUIForm!: boolean;
    errorMessage!: string;
    userData?: object;

    static create(
        serialId: number,
        uiFormAssetName: string,
        uiGroupName: string,
        pauseCoveredUIForm: boolean,
        errorMessage: string,
        userData?: object
    ): OpenUIFormFailureEventArgs {
        const e = ReferencePool.acquire(OpenUIFormFailureEventArgs);
        e.serialId = serialId;
        e.uiFormAssetName = uiFormAssetName;
        e.uiGroupName = uiGroupName;
        e.pauseCoveredUIForm = pauseCoveredUIForm;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.uiFormAssetName = '';
        this.uiGroupName = '';
        this.pauseCoveredUIForm = false;
        this.errorMessage = '';
        this.userData = undefined;
    }
}

export class CloseUIFormCompleteEventArgs extends BaseEventArgs {
    static readonly eventId = 'ui.close.complete';
    get id(): string { return CloseUIFormCompleteEventArgs.eventId; }

    serialId!: number;
    uiFormAssetName!: string;
    uiGroupName!: string;
    userData?: object;

    static create(
        serialId: number,
        uiFormAssetName: string,
        uiGroupName: string,
        userData?: object
    ): CloseUIFormCompleteEventArgs {
        const e = ReferencePool.acquire(CloseUIFormCompleteEventArgs);
        e.serialId = serialId;
        e.uiFormAssetName = uiFormAssetName;
        e.uiGroupName = uiGroupName;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.uiFormAssetName = '';
        this.uiGroupName = '';
        this.userData = undefined;
    }
}

export class OpenUIFormUpdateEventArgs extends BaseEventArgs {
    static readonly eventId = 'ui.open.update';
    get id(): string { return OpenUIFormUpdateEventArgs.eventId; }

    serialId!: number;
    uiFormAssetName!: string;
    uiGroupName!: string;
    pauseCoveredUIForm!: boolean;
    progress!: number;
    userData?: object;

    static create(
        serialId: number,
        uiFormAssetName: string,
        uiGroupName: string,
        pauseCoveredUIForm: boolean,
        progress: number,
        userData?: object
    ): OpenUIFormUpdateEventArgs {
        const e = ReferencePool.acquire(OpenUIFormUpdateEventArgs);
        e.serialId = serialId;
        e.uiFormAssetName = uiFormAssetName;
        e.uiGroupName = uiGroupName;
        e.pauseCoveredUIForm = pauseCoveredUIForm;
        e.progress = progress;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.uiFormAssetName = '';
        this.uiGroupName = '';
        this.pauseCoveredUIForm = false;
        this.progress = 0;
        this.userData = undefined;
    }
}

export class OpenUIFormDependencyAssetEventArgs extends BaseEventArgs {
    static readonly eventId = 'ui.open.dependency';
    get id(): string { return OpenUIFormDependencyAssetEventArgs.eventId; }

    serialId!: number;
    uiFormAssetName!: string;
    uiGroupName!: string;
    pauseCoveredUIForm!: boolean;
    dependencyAssetName!: string;
    loadedCount!: number;
    totalCount!: number;
    userData?: object;

    static create(
        serialId: number,
        uiFormAssetName: string,
        uiGroupName: string,
        pauseCoveredUIForm: boolean,
        dependencyAssetName: string,
        loadedCount: number,
        totalCount: number,
        userData?: object
    ): OpenUIFormDependencyAssetEventArgs {
        const e = ReferencePool.acquire(OpenUIFormDependencyAssetEventArgs);
        e.serialId = serialId;
        e.uiFormAssetName = uiFormAssetName;
        e.uiGroupName = uiGroupName;
        e.pauseCoveredUIForm = pauseCoveredUIForm;
        e.dependencyAssetName = dependencyAssetName;
        e.loadedCount = loadedCount;
        e.totalCount = totalCount;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.uiFormAssetName = '';
        this.uiGroupName = '';
        this.pauseCoveredUIForm = false;
        this.dependencyAssetName = '';
        this.loadedCount = 0;
        this.totalCount = 0;
        this.userData = undefined;
    }
}
