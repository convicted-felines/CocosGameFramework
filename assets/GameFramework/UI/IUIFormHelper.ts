import { IUIGroup } from './IUIGroup';

export interface IUIFormHelper {
    // 从资产实例化 UI 节点
    instantiateUIForm(uiFormAsset: object): object;

    // 首次创建 UIForm 实例（挂载到场景树）
    createUIForm(uiFormInstance: object, uiGroup: IUIGroup, userData?: object): void;

    // UIForm 打开（首次或复用均调用）
    onOpenUIForm(serialId: number, uiFormInstance: object, uiGroup: IUIGroup, pauseCoveredUIForm: boolean, depthInUIGroup: number, isNewInstance: boolean, userData?: object): void;

    // UIForm 关闭（isShutdown=true 表示框架正在关闭）
    onCloseUIForm(uiFormInstance: object, isShutdown: boolean, userData?: object): void;

    // UIForm 回收入池（隐藏节点，重置状态）
    onRecycleUIForm(uiFormInstance: object): void;

    // UIForm 从池中复用（在 onOpenUIForm 之前调用）
    onReuseUIForm(uiFormInstance: object): void;

    // UIForm 暂停（被其他 UIForm 覆盖）
    onPauseUIForm(uiFormInstance: object): void;

    // UIForm 恢复
    onResumeUIForm(uiFormInstance: object): void;

    // UIForm 被遮挡（仍可见但不在最顶层）
    onCoverUIForm?(uiFormInstance: object): void;

    // UIForm 不再被遮挡
    onRevealUIForm?(uiFormInstance: object): void;

    // UIForm 被 refocus 移到顶层
    onRefocusUIForm?(uiFormInstance: object, userData?: object): void;

    // UIForm 深度变化
    onDepthChangedUIForm?(uiFormInstance: object, uiGroupDepth: number, depthInUIGroup: number): void;

    // UIForm 每帧更新
    onUpdateUIForm(uiFormInstance: object, elapseSeconds: number, realElapseSeconds: number): void;

    // 销毁 UIForm 实例（池满或 shutdown 时）
    releaseUIForm(uiFormAsset: object, uiFormInstance: object): void;
}
