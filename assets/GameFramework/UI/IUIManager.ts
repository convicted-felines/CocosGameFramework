export interface IUIManager {
    readonly uiGroupCount: number;
    readonly currentSerialId: number;

    addUIGroup(groupName: string, depth?: number): boolean;
    hasUIGroup(groupName: string): boolean;
    removeUIGroup(groupName: string): boolean;

    openUIForm(
        uiFormAssetName: string,
        bundleName: string,
        groupName: string,
        pauseCoveredUIForm?: boolean,
        userData?: object
    ): number;

    closeUIForm(serialId: number, userData?: object): void;
    closeAllUIForms(userData?: object): void;

    hasUIForm(serialId: number): boolean;
    hasUIFormByAsset(uiFormAssetName: string): boolean;

    isLoadingUIForm(serialId: number): boolean;
    isValidUIForm(serialId: number): boolean;
}
