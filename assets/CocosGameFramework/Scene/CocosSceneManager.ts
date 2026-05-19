import { director, Scene } from 'cc';
import { SceneManager } from '../../GameFramework/Scene/SceneManager';

export class CocosSceneManager extends SceneManager {
    // additive 模式加载的场景（场景名 -> Scene 节点），用于独立卸载
    private _additiveScenes: Map<string, Scene> = new Map();

    /**
     * @param additive 是否以叠加模式加载（不替换当前场景），默认 false
     */
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
        director.loadScene(sceneName, (err) => {
            if (err) {
                onFailure(sceneName, err.message ?? String(err));
            } else {
                onProgress(sceneName, 1);
            }
        });
    }

    protected _doUnloadScene(
        sceneName: string,
        onSuccess: (name: string) => void,
        onFailure: (name: string) => void
    ): void {
        // additive 场景：通过保存的节点引用销毁
        const additiveScene = this._additiveScenes.get(sceneName);
        if (additiveScene) {
            additiveScene.destroy();
            this._additiveScenes.delete(sceneName);
            onSuccess(sceneName);
            return;
        }

        // 非 additive 场景：只能销毁当前活动场景
        const current = director.getScene();
        if (current && current.name === sceneName) {
            current.destroy();
            onSuccess(sceneName);
        } else {
            onFailure(sceneName);
        }
    }

    private _loadAdditiveScene(
        sceneName: string,
        _priority: number,
        onLoaded?: (name: string, duration: number, userData?: object) => void,
        onFailure?: (name: string, errorMessage: string, userData?: object) => void,
        userData?: object
    ): void {
        const startTime = Date.now();
        director.loadScene(sceneName, { additive: true } as any, (err, scene) => {
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
        super.shutdown();
    }
}
