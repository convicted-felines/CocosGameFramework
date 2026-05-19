import { _decorator } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { EventManager } from '../../GameFramework/Event/EventManager';
import { EventHandler } from '../../GameFramework/Event/IEventManager';
import { CocosSceneManager } from './CocosSceneManager';
import {
    SceneLoadedCallback,
    SceneUnloadedCallback,
    SceneFailureCallback,
} from '../../GameFramework/Scene/ISceneManager';
import {
    LoadSceneSuccessEventArgs,
    LoadSceneFailureEventArgs,
    LoadSceneUpdateEventArgs,
    UnloadSceneSuccessEventArgs,
    UnloadSceneFailureEventArgs,
} from '../../GameFramework/Scene/SceneEventArgs';

const { ccclass, property } = _decorator;

@ccclass('SceneComponent')
export class SceneComponent extends GameFrameworkComponent {
    @property({ tooltip: '是否通过事件系统广播加载进度事件' })
    private _enableLoadSceneUpdateEvent: boolean = true;

    private _manager!: CocosSceneManager;

    static readonly EVENT_LOAD_SCENE_SUCCESS = LoadSceneSuccessEventArgs.eventId;
    static readonly EVENT_LOAD_SCENE_FAILURE = LoadSceneFailureEventArgs.eventId;
    static readonly EVENT_LOAD_SCENE_UPDATE = LoadSceneUpdateEventArgs.eventId;
    static readonly EVENT_UNLOAD_SCENE_SUCCESS = UnloadSceneSuccessEventArgs.eventId;
    static readonly EVENT_UNLOAD_SCENE_FAILURE = UnloadSceneFailureEventArgs.eventId;

    get manager(): CocosSceneManager { return this._manager; }

    onLoad(): void {
        super.onLoad();
        this._manager = new CocosSceneManager();
        GameFrameworkEntry.registerModule(MODULE_ID.SCENE, this._manager);
    }

    start(): void {
        if (GameFrameworkEntry.hasModule(MODULE_ID.EVENT)) {
            const eventManager = GameFrameworkEntry.getModule(EventManager, MODULE_ID.EVENT);
            this._manager.setEventManager(eventManager);
        }
    }

    get loadedSceneCount(): number { return this._manager.loadedSceneCount; }
    get enableLoadSceneUpdateEvent(): boolean { return this._enableLoadSceneUpdateEvent; }
    set enableLoadSceneUpdateEvent(v: boolean) { this._enableLoadSceneUpdateEvent = v; }

    loadScene(
        sceneName: string,
        priority?: number,
        onLoaded?: SceneLoadedCallback,
        onFailure?: SceneFailureCallback,
        userData?: object
    ): void {
        this._manager.loadScene(sceneName, priority, onLoaded, onFailure, userData);
    }

    loadSceneAdditive(
        sceneName: string,
        priority?: number,
        onLoaded?: SceneLoadedCallback,
        onFailure?: SceneFailureCallback,
        userData?: object
    ): void {
        this._manager.loadSceneAdditive(sceneName, priority, onLoaded, onFailure, userData);
    }

    unloadScene(
        sceneName: string,
        onUnloaded?: SceneUnloadedCallback,
        userData?: object
    ): void {
        this._manager.unloadScene(sceneName, onUnloaded, userData);
    }

    sceneIsLoaded(sceneName: string): boolean { return this._manager.sceneIsLoaded(sceneName); }
    sceneIsLoading(sceneName: string): boolean { return this._manager.sceneIsLoading(sceneName); }
    sceneIsUnloading(sceneName: string): boolean { return this._manager.sceneIsUnloading(sceneName); }

    getLoadedSceneNames(): string[] { return this._manager.getLoadedSceneNames(); }
    getLoadingSceneNames(): string[] { return this._manager.getLoadingSceneNames(); }
    getUnloadingSceneNames(): string[] { return this._manager.getUnloadingSceneNames(); }

    subscribe(eventId: string, handler: EventHandler): void {
        if (GameFrameworkEntry.hasModule(MODULE_ID.EVENT)) {
            GameFrameworkEntry.getModule(EventManager, MODULE_ID.EVENT).subscribe(eventId, handler);
        }
    }

    unsubscribe(eventId: string, handler: EventHandler): void {
        if (GameFrameworkEntry.hasModule(MODULE_ID.EVENT)) {
            GameFrameworkEntry.getModule(EventManager, MODULE_ID.EVENT).unsubscribe(eventId, handler);
        }
    }
}
