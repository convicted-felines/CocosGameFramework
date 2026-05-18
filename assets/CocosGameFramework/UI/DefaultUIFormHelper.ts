import { Node, Prefab, instantiate } from 'cc';
import { IUIFormHelper } from '../../GameFramework/UI/IUIFormHelper';
import { IUIGroup } from '../../GameFramework/UI/IUIGroup';
import { UIFormLogic } from './UIFormLogic';

export class DefaultUIFormHelper implements IUIFormHelper {
    private _uiRoot: Node;

    constructor(uiRoot: Node) {
        this._uiRoot = uiRoot;
    }

    instantiateUIForm(uiFormAsset: Prefab): Node {
        return instantiate(uiFormAsset);
    }

    createUIForm(uiFormInstance: Node, uiGroup: IUIGroup, _userData?: object): void {
        // 按 UIGroup depth 对应不同父节点或 zIndex
        this._uiRoot.addChild(uiFormInstance);
        uiFormInstance.setSiblingIndex(uiGroup.depth);
    }

    onOpenUIForm(serialId: number, uiFormInstance: Node, userData?: object): void {
        uiFormInstance.active = true;
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.__init(serialId, '');
        logic?.onOpen(userData);
    }

    onCloseUIForm(uiFormInstance: Node, userData?: object): void {
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.onClose(userData);
    }

    onPauseUIForm(uiFormInstance: Node): void {
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.onPause();
    }

    onResumeUIForm(uiFormInstance: Node): void {
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.onResume();
    }

    onUpdateUIForm(uiFormInstance: Node, elapseSeconds: number, realElapseSeconds: number): void {
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.onUpdate(elapseSeconds, realElapseSeconds);
    }

    releaseUIForm(_uiFormAsset: object, uiFormInstance: Node): void {
        uiFormInstance.destroy();
    }
}
