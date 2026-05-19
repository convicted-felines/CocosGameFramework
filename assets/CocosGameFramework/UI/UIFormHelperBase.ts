import { Component, _decorator } from 'cc';
import { IUIFormHelper } from '../../GameFramework/UI/IUIFormHelper';
import { IUIGroup } from '../../GameFramework/UI/IUIGroup';

const { ccclass } = _decorator;

/**
 * UI 界面辅助器基类。
 *
 * 继承此类并实现抽象方法，即可替换框架的 UI 创建/销毁策略。
 * 将具体实现组件挂载到场景节点后，在 UIComponent 的 uiFormHelper 属性处拖入该节点即可。
 */
@ccclass('UIFormHelperBase')
export abstract class UIFormHelperBase extends Component implements IUIFormHelper {
    abstract instantiateUIForm(uiFormAsset: object): object;

    abstract createUIForm(uiFormInstance: object, uiGroup: IUIGroup, userData?: object): void;

    abstract onOpenUIForm(serialId: number, uiFormInstance: object, uiGroup: IUIGroup, pauseCoveredUIForm: boolean, depthInUIGroup: number, isNewInstance: boolean, userData?: object): void;

    abstract onCloseUIForm(uiFormInstance: object, isShutdown: boolean, userData?: object): void;

    abstract onRecycleUIForm(uiFormInstance: object): void;

    abstract onReuseUIForm(uiFormInstance: object): void;

    abstract onPauseUIForm(uiFormInstance: object): void;

    abstract onResumeUIForm(uiFormInstance: object): void;

    onCoverUIForm?(uiFormInstance: object): void;

    onRevealUIForm?(uiFormInstance: object): void;

    onRefocusUIForm?(uiFormInstance: object, userData?: object): void;

    onDepthChangedUIForm?(uiFormInstance: object, uiGroupDepth: number, depthInUIGroup: number): void;

    abstract onUpdateUIForm(uiFormInstance: object, elapseSeconds: number, realElapseSeconds: number): void;

    abstract releaseUIForm(uiFormAsset: object, uiFormInstance: object): void;
}
