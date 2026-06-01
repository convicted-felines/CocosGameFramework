import { BaseEventArgs } from '../Event/BaseEventArgs';
import { ReferencePool } from '../ReferencePool/ReferencePool';

export class LoadSceneSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'scene.load.success';
    get id(): string { return LoadSceneSuccessEventArgs.eventId; }

    sceneName!: string;
    duration!: number;
    userData?: object;

    static create(sceneName: string, duration: number, userData?: object): LoadSceneSuccessEventArgs {
        const e = ReferencePool.acquire(LoadSceneSuccessEventArgs);
        e.sceneName = sceneName;
        e.duration = duration;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.sceneName = '';
        this.duration = 0;
        this.userData = undefined;
    }
}

export class LoadSceneFailureEventArgs extends BaseEventArgs {
    static readonly eventId = 'scene.load.failure';
    get id(): string { return LoadSceneFailureEventArgs.eventId; }

    sceneName!: string;
    errorMessage!: string;
    userData?: object;

    static create(sceneName: string, errorMessage: string, userData?: object): LoadSceneFailureEventArgs {
        const e = ReferencePool.acquire(LoadSceneFailureEventArgs);
        e.sceneName = sceneName;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.sceneName = '';
        this.errorMessage = '';
        this.userData = undefined;
    }
}

export class LoadSceneUpdateEventArgs extends BaseEventArgs {
    static readonly eventId = 'scene.load.update';
    get id(): string { return LoadSceneUpdateEventArgs.eventId; }

    sceneName!: string;
    progress!: number;
    userData?: object;

    static create(sceneName: string, progress: number, userData?: object): LoadSceneUpdateEventArgs {
        const e = ReferencePool.acquire(LoadSceneUpdateEventArgs);
        e.sceneName = sceneName;
        e.progress = progress;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.sceneName = '';
        this.progress = 0;
        this.userData = undefined;
    }
}

export class UnloadSceneSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'scene.unload.success';
    get id(): string { return UnloadSceneSuccessEventArgs.eventId; }

    sceneName!: string;
    userData?: object;

    static create(sceneName: string, userData?: object): UnloadSceneSuccessEventArgs {
        const e = ReferencePool.acquire(UnloadSceneSuccessEventArgs);
        e.sceneName = sceneName;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.sceneName = '';
        this.userData = undefined;
    }
}

export class UnloadSceneFailureEventArgs extends BaseEventArgs {
    static readonly eventId = 'scene.unload.failure';
    get id(): string { return UnloadSceneFailureEventArgs.eventId; }

    sceneName!: string;
    userData?: object;

    static create(sceneName: string, userData?: object): UnloadSceneFailureEventArgs {
        const e = ReferencePool.acquire(UnloadSceneFailureEventArgs);
        e.sceneName = sceneName;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.sceneName = '';
        this.userData = undefined;
    }
}

export class ActiveSceneChangedEventArgs extends BaseEventArgs {
    static readonly eventId = 'scene.active.changed';
    get id(): string { return ActiveSceneChangedEventArgs.eventId; }

    lastActiveScene!: string;
    activeScene!: string;

    static create(lastActiveScene: string, activeScene: string): ActiveSceneChangedEventArgs {
        const e = ReferencePool.acquire(ActiveSceneChangedEventArgs);
        e.lastActiveScene = lastActiveScene;
        e.activeScene = activeScene;
        return e;
    }

    clear(): void {
        this.lastActiveScene = '';
        this.activeScene = '';
    }
}
