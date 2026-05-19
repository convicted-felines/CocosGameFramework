import { BaseEventArgs } from '../Event/BaseEventArgs';
import { ReferencePool } from '../ReferencePool/ReferencePool';

export class ShowEntitySuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'entity.show.success';
    get id(): string { return ShowEntitySuccessEventArgs.eventId; }

    entityId!: number;
    entityAssetName!: string;
    entityGroupName!: string;
    duration!: number;
    userData?: object;

    static create(entityId: number, entityAssetName: string, entityGroupName: string, duration: number, userData?: object): ShowEntitySuccessEventArgs {
        const e = ReferencePool.acquire(ShowEntitySuccessEventArgs);
        e.entityId = entityId;
        e.entityAssetName = entityAssetName;
        e.entityGroupName = entityGroupName;
        e.duration = duration;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.entityId = 0;
        this.entityAssetName = '';
        this.entityGroupName = '';
        this.duration = 0;
        this.userData = undefined;
    }
}

export class ShowEntityFailureEventArgs extends BaseEventArgs {
    static readonly eventId = 'entity.show.failure';
    get id(): string { return ShowEntityFailureEventArgs.eventId; }

    entityId!: number;
    entityAssetName!: string;
    entityGroupName!: string;
    errorMessage!: string;
    userData?: object;

    static create(entityId: number, entityAssetName: string, entityGroupName: string, errorMessage: string, userData?: object): ShowEntityFailureEventArgs {
        const e = ReferencePool.acquire(ShowEntityFailureEventArgs);
        e.entityId = entityId;
        e.entityAssetName = entityAssetName;
        e.entityGroupName = entityGroupName;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.entityId = 0;
        this.entityAssetName = '';
        this.entityGroupName = '';
        this.errorMessage = '';
        this.userData = undefined;
    }
}

export class HideEntityCompleteEventArgs extends BaseEventArgs {
    static readonly eventId = 'entity.hide.complete';
    get id(): string { return HideEntityCompleteEventArgs.eventId; }

    entityId!: number;
    entityAssetName!: string;
    entityGroupName!: string;
    userData?: object;

    static create(entityId: number, entityAssetName: string, entityGroupName: string, userData?: object): HideEntityCompleteEventArgs {
        const e = ReferencePool.acquire(HideEntityCompleteEventArgs);
        e.entityId = entityId;
        e.entityAssetName = entityAssetName;
        e.entityGroupName = entityGroupName;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.entityId = 0;
        this.entityAssetName = '';
        this.entityGroupName = '';
        this.userData = undefined;
    }
}

export class AttachEntitySuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'entity.attach.success';
    get id(): string { return AttachEntitySuccessEventArgs.eventId; }

    entityId!: number;
    parentEntityId!: number;
    userData?: object;

    static create(entityId: number, parentEntityId: number, userData?: object): AttachEntitySuccessEventArgs {
        const e = ReferencePool.acquire(AttachEntitySuccessEventArgs);
        e.entityId = entityId;
        e.parentEntityId = parentEntityId;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.entityId = 0;
        this.parentEntityId = 0;
        this.userData = undefined;
    }
}

export class DetachEntitySuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'entity.detach.success';
    get id(): string { return DetachEntitySuccessEventArgs.eventId; }

    entityId!: number;
    parentEntityId!: number;
    userData?: object;

    static create(entityId: number, parentEntityId: number, userData?: object): DetachEntitySuccessEventArgs {
        const e = ReferencePool.acquire(DetachEntitySuccessEventArgs);
        e.entityId = entityId;
        e.parentEntityId = parentEntityId;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.entityId = 0;
        this.parentEntityId = 0;
        this.userData = undefined;
    }
}
