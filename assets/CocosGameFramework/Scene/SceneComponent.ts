import { _decorator, Component } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { CocosSceneManager } from './CocosSceneManager';
import {
    SceneLoadedCallback,
    SceneUnloadedCallback,
    SceneFailureCallback,
} from '../../GameFramework/Scene/ISceneManager';

const { ccclass } = _decorator;

@ccclass('SceneComponent')
export class SceneComponent extends Component {
    private _manager!: CocosSceneManager;

    get manager(): CocosSceneManager { return this._manager; }

    onLoad(): void {
        this._manager = new CocosSceneManager();
        GameFrameworkEntry.registerModule(MODULE_ID.SCENE, this._manager);
    }

    get loadedSceneCount(): number { return this._manager.loadedSceneCount; }

    loadScene(
        sceneName: string,
        priority?: number,
        onLoaded?: SceneLoadedCallback,
        onFailure?: SceneFailureCallback,
        userData?: object
    ): void {
        this._manager.loadScene(sceneName, priority, onLoaded, onFailure, userData);
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
}
