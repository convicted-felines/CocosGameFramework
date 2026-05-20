import { Component, Node, _decorator } from 'cc';
import { IUIGroupHelper } from '../../GameFramework/UI/IUIGroupHelper';
import { IUIGroup } from '../../GameFramework/UI/IUIGroup';

const { ccclass } = _decorator;

/**
 * 默认 UI 组辅助器。
 *
 * 通过调整 UI 组根节点的 siblingIndex 来反映组深度，
 * 与 DefaultUIFormHelper 中的 setSiblingIndex 策略保持一致。
 * 将此组件挂载到 UIComponent 所在节点，在 UIComponent 的 uiGroupHelper 属性处拖入即可。
 */
@ccclass('DefaultUIGroupHelper')
export class DefaultUIGroupHelper extends Component implements IUIGroupHelper {
    /** 组名 → 组根节点映射，由 UIComponent 在 addUIGroup 后注册 */
    private _groupNodes: Map<string, Node> = new Map();

    registerGroupNode(groupName: string, node: Node): void {
        this._groupNodes.set(groupName, node);
    }

    setDepth(uiGroup: IUIGroup, depth: number): void {
        const node = this._groupNodes.get(uiGroup.name);
        if (node) {
            node.setSiblingIndex(depth);
        }
    }
}
