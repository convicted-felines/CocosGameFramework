import { director } from 'cc';
import { SceneManager } from '../../GameFramework/Scene/SceneManager';

export class CocosSceneManager extends SceneManager {
    protected _doLoadScene(
        sceneName: string,
        _priority: number,
        onSuccess: (name: string) => void,
        onFailure: (name: string, msg: string) => void
    ): void {
        director.loadScene(sceneName, (err) => {
            if (err) {
                onFailure(sceneName, err.message ?? String(err));
            } else {
                onSuccess(sceneName);
            }
        });
    }

    protected _doUnloadScene(
        sceneName: string,
        onSuccess: (name: string) => void
    ): void {
        // Cocos Creator 没有独立卸载场景的 API；additive 加载时可通过 director.getScene 获取后销毁
        const scene = director.getScene();
        if (scene && scene.name === sceneName) {
            scene.destroy();
        }
        onSuccess(sceneName);
    }
}
