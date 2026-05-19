export interface ISceneManager {
    readonly loadedSceneCount: number;
    readonly activeScene: string;

    hasScene(sceneName: string): boolean;

    loadScene(
        sceneName: string,
        priority?: number,
        onLoaded?: SceneLoadedCallback,
        onFailure?: SceneFailureCallback,
        userData?: object
    ): void;

    unloadScene(
        sceneName: string,
        onUnloaded?: SceneUnloadedCallback,
        userData?: object
    ): void;

    sceneIsLoaded(sceneName: string): boolean;
    sceneIsLoading(sceneName: string): boolean;
    sceneIsUnloading(sceneName: string): boolean;

    getLoadedSceneNames(): string[];
    getLoadingSceneNames(): string[];
    getUnloadingSceneNames(): string[];

    setSceneOrder(sceneName: string, sceneOrder: number): void;
    getSceneOrder(sceneName: string): number;
}

export type SceneLoadedCallback = (sceneName: string, duration: number, userData?: object) => void;
export type SceneUnloadedCallback = (sceneName: string, userData?: object) => void;
export type SceneFailureCallback = (sceneName: string, errorMessage: string, userData?: object) => void;
