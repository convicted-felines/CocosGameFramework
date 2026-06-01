import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { IEventManager } from '../Event/IEventManager';
import {
    ISceneManager,
    SceneLoadedCallback,
    SceneUnloadedCallback,
    SceneFailureCallback,
} from './ISceneManager';
import {
    LoadSceneSuccessEventArgs,
    LoadSceneFailureEventArgs,
    LoadSceneUpdateEventArgs,
    UnloadSceneSuccessEventArgs,
    UnloadSceneFailureEventArgs,
    ActiveSceneChangedEventArgs,
} from './SceneEventArgs';

export abstract class SceneManager extends GameFrameworkModule implements ISceneManager {
    private _loadedScenes: Set<string> = new Set();
    private _loadingScenes: Set<string> = new Set();
    private _unloadingScenes: Set<string> = new Set();
    private _sceneOrder: Map<string, number> = new Map();
    private _activeScene: string = '';
    private _eventManager: IEventManager | null = null;

    get priority(): number { return 2; }
    get loadedSceneCount(): number { return this._loadedScenes.size; }
    get activeScene(): string { return this._activeScene; }

    setEventManager(eventManager: IEventManager): void {
        this._eventManager = eventManager;
    }

    hasScene(sceneName: string): boolean {
        return this._loadedScenes.has(sceneName)
            || this._loadingScenes.has(sceneName)
            || this._unloadingScenes.has(sceneName);
    }

    loadScene(
        sceneName: string,
        priority: number = 0,
        onLoaded?: SceneLoadedCallback,
        onFailure?: SceneFailureCallback,
        userData?: object
    ): void {
        if (this._loadingScenes.has(sceneName) || this._unloadingScenes.has(sceneName)) return;
        this._loadingScenes.add(sceneName);
        this._sceneOrder.set(sceneName, 0);
        const startTime = Date.now();
        this._doLoadScene(
            sceneName,
            priority,
            (name, progress) => {
                if (progress < 1) {
                    this._eventManager?.fire(this, LoadSceneUpdateEventArgs.create(name, progress, userData));
                } else {
                    this._loadingScenes.delete(name);
                    this._loadedScenes.add(name);
                    this._refreshSceneOrder();
                    const duration = (Date.now() - startTime) / 1000;
                    onLoaded?.(name, duration, userData);
                    this._eventManager?.fire(this, LoadSceneSuccessEventArgs.create(name, duration, userData));
                }
            },
            (name, msg) => {
                this._loadingScenes.delete(name);
                this._sceneOrder.delete(name);
                onFailure?.(name, msg, userData);
                this._eventManager?.fire(this, LoadSceneFailureEventArgs.create(name, msg, userData));
            }
        );
    }

    unloadScene(
        sceneName: string,
        onUnloaded?: SceneUnloadedCallback,
        userData?: object
    ): void {
        if (!this._loadedScenes.has(sceneName) || this._unloadingScenes.has(sceneName)) return;
        this._unloadingScenes.add(sceneName);
        this._sceneOrder.delete(sceneName);
        this._doUnloadScene(
            sceneName,
            (name) => {
                this._unloadingScenes.delete(name);
                this._loadedScenes.delete(name);
                this._refreshSceneOrder();
                onUnloaded?.(name, userData);
                this._eventManager?.fire(this, UnloadSceneSuccessEventArgs.create(name, userData));
            },
            (name) => {
                this._unloadingScenes.delete(name);
                this._eventManager?.fire(this, UnloadSceneFailureEventArgs.create(name, userData));
            }
        );
    }

    setSceneOrder(sceneName: string, sceneOrder: number): void {
        if (this._loadingScenes.has(sceneName)) {
            this._sceneOrder.set(sceneName, sceneOrder);
            return;
        }
        if (this._loadedScenes.has(sceneName)) {
            this._sceneOrder.set(sceneName, sceneOrder);
            this._refreshSceneOrder();
            return;
        }
    }

    getSceneOrder(sceneName: string): number {
        return this._sceneOrder.get(sceneName) ?? 0;
    }

    sceneIsLoaded(sceneName: string): boolean { return this._loadedScenes.has(sceneName); }
    sceneIsLoading(sceneName: string): boolean { return this._loadingScenes.has(sceneName); }
    sceneIsUnloading(sceneName: string): boolean { return this._unloadingScenes.has(sceneName); }
    getLoadedSceneNames(): string[] { return Array.from(this._loadedScenes); }
    getLoadingSceneNames(): string[] { return Array.from(this._loadingScenes); }
    getUnloadingSceneNames(): string[] { return Array.from(this._unloadingScenes); }

    protected _refreshSceneOrder(): void {
        let maxName = '';
        let maxOrder = -Infinity;
        for (const [name, order] of this._sceneOrder) {
            if (this._loadingScenes.has(name)) continue;
            if (order > maxOrder) {
                maxOrder = order;
                maxName = name;
            }
        }
        const newActive = maxName;
        if (newActive !== this._activeScene) {
            const last = this._activeScene;
            this._activeScene = newActive;
            this._doSetActiveScene(newActive);
            this._eventManager?.fire(this, ActiveSceneChangedEventArgs.create(last, newActive));
        }
    }

    /**
     * @param onProgress progress < 1 为进度回调，=== 1 为成功回调
     */
    protected abstract _doLoadScene(
        sceneName: string,
        priority: number,
        onProgress: (name: string, progress: number) => void,
        onFailure: (name: string, msg: string) => void
    ): void;

    protected abstract _doUnloadScene(
        sceneName: string,
        onSuccess: (name: string) => void,
        onFailure: (name: string) => void
    ): void;

    protected _doSetActiveScene(_sceneName: string): void {}

    update(_e: number, _r: number): void {}

    shutdown(): void {
        this._loadedScenes.clear();
        this._loadingScenes.clear();
        this._unloadingScenes.clear();
        this._sceneOrder.clear();
        this._activeScene = '';
        this._eventManager = null;
    }
}
