import { Node, Prefab, instantiate, _decorator } from 'cc';
import { IUIGroup } from '../../GameFramework/UI/IUIGroup';
import { UIFormLogic } from './UIFormLogic';
import { UIFormHelperBase } from './UIFormHelperBase';
import { HelperRegistry } from '../Utility/HelperRegistry';

const { ccclass } = _decorator;

@ccclass('DefaultUIFormHelper')
export class DefaultUIFormHelper extends UIFormHelperBase {
    private _uiRoot: Node | null = null;

    setUIRoot(uiRoot: Node): void {
        this._uiRoot = uiRoot;
    }

    instantiateUIForm(uiFormAsset: Prefab): Node {
        return instantiate(uiFormAsset);
    }

    createUIForm(uiFormInstance: Node, uiGroup: IUIGroup, _userData?: object): void {
        const root = this._uiRoot ?? this.node;
        root.addChild(uiFormInstance);
        uiFormInstance.setSiblingIndex(uiGroup.depth);
        uiFormInstance.active = false;
    }

    onOpenUIForm(
        serialId: number,
        uiFormInstance: Node,
        uiGroup: IUIGroup,
        pauseCoveredUIForm: boolean,
        depthInUIGroup: number,
        isNewInstance: boolean,
        userData?: object
    ): void {
        uiFormInstance.active = true;
        const logic = uiFormInstance.getComponent(UIFormLogic);
        if (logic) {
            logic.__init(serialId, logic.uiFormAssetName || '', uiGroup, pauseCoveredUIForm, depthInUIGroup, isNewInstance);
            logic.onOpen(userData);
        }
    }

    onCloseUIForm(uiFormInstance: Node, isShutdown: boolean, userData?: object): void {
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.onClose(isShutdown, userData);
    }

    onRecycleUIForm(uiFormInstance: Node): void {
        uiFormInstance.active = false;
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.onRecycle();
    }

    onReuseUIForm(_uiFormInstance: Node): void {
        // 节点已在场景中，onOpenUIForm 负责激活
    }

    onPauseUIForm(uiFormInstance: Node): void {
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.onPause();
    }

    onResumeUIForm(uiFormInstance: Node): void {
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.onResume();
    }

    onCoverUIForm(uiFormInstance: Node): void {
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.__setCovered(true);
    }

    onRevealUIForm(uiFormInstance: Node): void {
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.__setCovered(false);
    }

    onRefocusUIForm(uiFormInstance: Node, userData?: object): void {
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.onRefocus(userData);
    }

    onDepthChangedUIForm(uiFormInstance: Node, uiGroupDepth: number, depthInUIGroup: number): void {
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.__setDepthInUIGroup(depthInUIGroup, uiGroupDepth);
    }

    onUpdateUIForm(uiFormInstance: Node, elapseSeconds: number, realElapseSeconds: number): void {
        const logic = uiFormInstance.getComponent(UIFormLogic);
        logic?.onUpdate(elapseSeconds, realElapseSeconds);
    }

    releaseUIForm(_uiFormAsset: object, uiFormInstance: Node): void {
        uiFormInstance.destroy();
    }
}

HelperRegistry.register('DefaultUIFormHelper', DefaultUIFormHelper);
