import { IUIGroup } from './IUIGroup';

export interface IUIFormHelper {
    // 从资产实例化 UI 节点（asset 由 ResourceManager 加载的 Prefab）
    instantiateUIForm(uiFormAsset: object): object;

    // 创建 UIForm 实例（在 instantiateUIForm 之后）
    createUIForm(uiFormInstance: object, uiGroup: IUIGroup, userData?: object): void;

    // UIForm 打开
    onOpenUIForm(serialId: number, uiFormInstance: object, userData?: object): void;

    // UIForm 关闭（动画完成后调用 releaseUIForm）
    onCloseUIForm(uiFormInstance: object, userData?: object): void;

    // UIForm 暂停（被其他 UIForm 覆盖）
    onPauseUIForm(uiFormInstance: object): void;

    // UIForm 恢复
    onResumeUIForm(uiFormInstance: object): void;

    // UIForm 每帧更新（仅对未暂停的 UIForm 调用）
    onUpdateUIForm(uiFormInstance: object, elapseSeconds: number, realElapseSeconds: number): void;

    // 销毁 UIForm 实例
    releaseUIForm(uiFormAsset: object, uiFormInstance: object): void;
}
