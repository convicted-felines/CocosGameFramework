// UI 组接口（管理同一层级的所有 UIForm）
export interface IUIGroup {
    readonly name: string;
    depth: number;
    pause: boolean;
    readonly uiFormCount: number;
    readonly currentUIForm: IUIFormInfo | null;
}

export interface IUIFormInfo {
    readonly serialId: number;
    readonly uiFormAssetName: string;
    readonly uiGroup: IUIGroup;
    readonly isPaused: boolean;
    readonly isCovered: boolean;
    readonly uiFormInstance: object | null;
}
