export interface IUIFormInfo {
    readonly serialId: number;
    readonly uiFormAssetName: string;
    readonly uiGroup: IUIGroup;
    readonly isPaused: boolean;
    readonly isCovered: boolean;
    readonly uiFormInstance: object | null;
}

export interface IUIGroup {
    readonly name: string;
    depth: number;
    pause: boolean;
    readonly uiFormCount: number;
    readonly currentUIForm: IUIFormInfo | null;

    hasUIForm(serialId: number): boolean;
    hasUIFormByAsset(uiFormAssetName: string): boolean;
    getUIForm(serialId: number): IUIFormInfo | null;
    getUIFormByAsset(uiFormAssetName: string): IUIFormInfo | null;
    getUIForms(uiFormAssetName: string): IUIFormInfo[];
    getAllUIForms(): IUIFormInfo[];
}
