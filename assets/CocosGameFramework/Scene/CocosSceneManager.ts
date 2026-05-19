import { director, Camera, Scene } from 'cc';
import { SceneManager } from '../../GameFramework/Scene/SceneManager';

export class CocosSceneManager extends SceneManager {
    private _additiveScenes: Map<string, Scene> = new Map();
    private _mainCamera: Camera | null = null;

    get mainCamera(): Camera | null { return this._mainCamera; }

    loadSceneAdditive(
        sceneName: string,
        priority?: number,
        onLoaded?: (name: string, duration: number, userData?: object) => void,
        onFailure?: (name: string, errorMessage: string, userData?: object) => void,
        userData?: object
    ): void {
        this._loadAdditiveScene(sceneName, priority ?? 0, onLoaded, onFailure, userData);
    }

    protected _doLoadScene(
        sceneName: string,
        _priority: number,
        onProgress: (name: string, progress: number) => void,
        onFailure: (name: string, msg: string) => void
    ): void {
        director.preloadScene(
            sceneName,
            (completedCount, totalCount) => {
                const progress = totalCount > 0 ? completedCount / totalCount : 0;
                if (progress < 1) {
                    onProgress(sceneName, progress);
                }
            },
            (err) => {
                if (err) {
                    onFailure(sceneName, err.message ?? String(err));
                    return;
                }
                director.loadScene(sceneName, (loadErr) => {
                    if (loadErr) {
                        onFailure(sceneName, loadErr.message ?? String(loadErr));
                    } else {
                        this.refreshMainCamera();
                        onProgress(sceneName, 1);
                    }
                });
            }
        );
    }

    protected _doUnloadScene(
        sceneName: string,
        onSuccess: (name: string) => void,
        onFailure: (name: string) => void
    ): void {
        const additiveScene = this._additiveScenes.get(sceneName);
        if (additiveScene) {
            additiveScene.destroy();
            this._additiveScenes.delete(sceneName);
            onSuccess(sceneName);
            return;
        }

        const current = director.getScene();
        if (current && current.name === sceneName) {
            current.destroy();
            this.refreshMainCamera();
            onSuccess(sceneName);
        } else {
            onFailure(sceneName);
        }
    }

    protected override _doSetActiveScene(sceneName: string): void {
        if (!sceneName) return;
        const scene = this._additiveScenes.get(sceneName) ?? director.getScene();
        if (scene && scene.name === sceneName) {
            director.runScene(scene);
            this.refreshMainCamera();
        }
    }

    refreshMainCamera(): void {
        const scene = director.getScene();
        if (!scene) {
            this._mainCamera = null;
            return;
        }
        const cameras = scene.getComponentsInChildren(Camera);
        this._mainCamera = cameras.find(c => c.node.name === 'Main Camera') ?? cameras[0] ?? null;
    }

    private _loadAdditiveScene(
        sceneName: string,
        _priority: number,
        onLoaded?: (name: string, duration: number, userData?: object) => void,
        onFailure?: (name: string, errorMessage: string, userData?: object) => void,
        userData?: object
    ): void {
        const startTime = Date.now();
        director.loadScene(sceneName, (err: Error | null, scene: Scene) => {
            if (err || !scene) {
                onFailure?.(sceneName, err?.message ?? String(err), userData);
            } else {
                this._additiveScenes.set(sceneName, scene);
                onLoaded?.(sceneName, (Date.now() - startTime) / 1000, userData);
            }
        });
    }

    override shutdown(): void {
        this._additiveScenes.clear();
        this._mainCamera = null;
        super.shutdown();
    }
}
