import { Component, Node, _decorator } from 'cc';
import { IEntityGroupHelper } from '../../GameFramework/Entity/IEntityGroupHelper';

const { ccclass, property } = _decorator;

/**
 * 默认实体组辅助器。
 *
 * 为每个实体分组在场景中创建一个空节点作为根节点，
 * 用于将同组实体的 Node 归类挂载，保持场景层级清晰。
 * 将此组件挂载到 EntityComponent 所在节点，
 * 在 EntityComponent 的 entityGroupHelper 属性处拖入即可。
 */
@ccclass('DefaultEntityGroupHelper')
export class DefaultEntityGroupHelper extends Component implements IEntityGroupHelper {
    /** 实体分组根节点的父节点，不设置则默认为本组件所在节点 */
    @property(Node)
    groupRootParent: Node | null = null;

    createEntityGroupRoot(entityGroupName: string): object {
        const parent = this.groupRootParent ?? this.node;
        const groupRoot = new Node(entityGroupName);
        parent.addChild(groupRoot);
        return groupRoot;
    }
}
