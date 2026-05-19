import { IUIGroup } from './IUIGroup';

export interface IUIManager {
    readonly uiGroupCount: number;
    readonly currentSerialId: number;

    // 对象池配置
    instanceCapacity: number;
    instanceExpireTime: number;
    instanceAutoReleaseInterval: number;
    instancePriority: number;

    // --- UIGroup ---
    addUIGroup(groupName: string, depth?: number): boolean;
    hasUIGroup(groupName: string): boolean;
    getUIGroup(groupName: string): IUIGroup | null;
    getAllUIGroups(): IUIGroup[];
    removeUIGroup(groupName: string): boolean;

    // --- Open ---
    openUIForm(
        uiFormAssetName: string,
        bundleName: string,
        groupName: string,
        pauseCoveredUIForm?: boolean,
        userData?: object
    ): number;

    // --- Close ---
    closeUIForm(serialId: number, userData?: object): void;
    closeUIFormByInstance(uiFormInstance: object, userData?: object): void;
    closeAllLoadedUIForms(userData?: object): void;
    closeAllLoadingUIForms(): void;

    // --- Query ---
    hasUIForm(serialId: number): boolean;
    hasUIFormByAsset(uiFormAssetName: string): boolean;
    getUIForm(serialId: number): object | null;
    getUIFormByAsset(uiFormAssetName: string): object | null;
    getUIFormsByAsset(uiFormAssetName: string): object[];
    getAllLoadedUIForms(): object[];
    getAllLoadingUIFormSerialIds(): number[];
    isLoadingUIForm(serialId: number): boolean;
    isLoadingUIFormByAsset(uiFormAssetName: string): boolean;
    isValidUIForm(uiFormInstance: object): boolean;

    // --- Refocus ---
    refocusUIForm(uiFormInstance: object, userData?: object): void;

    // --- 池实例控制 ---
    setUIFormInstanceLocked(uiFormInstance: object, locked: boolean): void;
    setUIFormInstancePriority(uiFormInstance: object, priority: number): void;
}
