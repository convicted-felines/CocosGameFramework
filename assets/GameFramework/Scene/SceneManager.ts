import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import {
    ISceneManager,
    SceneLoadedCallback,
    SceneUnloadedCallback,
    SceneFailureCallback,
} from './ISceneManager';

export abstract class SceneManager extends GameFrameworkModule implements ISceneManager {
    private _loadedScenes: Set<string> = new Set();
    private _loadingScenes: Set<string> = new Set();
    private _unloadingScenes: Set<string> = new Set();

    get priority(): number { return 45; }
    get loadedSceneCount(): number { return this._loadedScenes.size; }

    loadScene(
        sceneName: string,
        priority: number = 0,
        onLoaded?: SceneLoadedCallback,
        onFailure?: SceneFailureCallback,
        userData?: object
    ): void {
        if (this._loadingScenes.has(sceneName)) return;
        this._loadingScenes.add(sceneName);
        const startTime = Date.now();
        this._doLoadScene(sceneName, priority, (name) => {
            this._loadingScenes.delete(name);
            this._loadedScenes.add(name);
            onLoaded?.(name, (Date.now() - startTime) / 1000, userData);
        }, (name, msg) => {
            this._loadingScenes.delete(name);
            onFailure?.(name, msg, userData);
        });
    }

    unloadScene(
        sceneName: string,
        onUnloaded?: SceneUnloadedCallback,
        userData?: object
    ): void {
        if (!this._loadedScenes.has(sceneName) || this._unloadingScenes.has(sceneName)) return;
        this._unloadingScenes.add(sceneName);
        this._doUnloadScene(sceneName, (name) => {
            this._unloadingScenes.delete(name);
            this._loadedScenes.delete(name);
            onUnloaded?.(name, userData);
        });
    }

    sceneIsLoaded(sceneName: string): boolean { return this._loadedScenes.has(sceneName); }
    sceneIsLoading(sceneName: string): boolean { return this._loadingScenes.has(sceneName); }
    sceneIsUnloading(sceneName: string): boolean { return this._unloadingScenes.has(sceneName); }
    getLoadedSceneNames(): string[] { return Array.from(this._loadedScenes); }

    protected abstract _doLoadScene(
        sceneName: string,
        priority: number,
        onSuccess: (name: string) => void,
        onFailure: (name: string, msg: string) => void
    ): void;

    protected abstract _doUnloadScene(
        sceneName: string,
        onSuccess: (name: string) => void
    ): void;

    update(_e: number, _r: number): void {}

    shutdown(): void {
        this._loadedScenes.clear();
        this._loadingScenes.clear();
        this._unloadingScenes.clear();
    }
}
