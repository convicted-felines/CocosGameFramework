import { Node, Prefab, instantiate, _decorator } from 'cc';
import { IEntityInfo } from '../../GameFramework/Entity/IEntityHelper';
import { EntityLogic } from './EntityLogic';
import { EntityHelperBase } from './EntityHelperBase';

const { ccclass } = _decorator;

@ccclass('DefaultEntityHelper')
export class DefaultEntityHelper extends EntityHelperBase {
    private _groupRoots: Map<string, Node> = new Map();

    setGroupRoot(groupName: string, groupRoot: object): void {
        this._groupRoots.set(groupName, groupRoot as Node);
    }

    // ---- 首次创建 ----

    instantiateEntity(entityAsset: object): object {
        return instantiate(entityAsset as Prefab);
    }

    createEntity(entityInstance: object, info: IEntityInfo): void {
        const node = entityInstance as Node;
        const groupRoot = this._groupRoots.get(info.entityGroupName) ?? this.node;
        groupRoot.addChild(node);
        const logic = node.getComponent(EntityLogic);
        logic?.__init(info);
        logic?.onShow(info.userData);
    }

    // ---- 对象池：回收与复用 ----

    recycleEntity(entityInstance: object, userData?: object): void {
        const node = entityInstance as Node;
        const logic = node.getComponent(EntityLogic);
        logic?.onHide(false, userData);
        node.active = false;
    }

    reactivateEntity(entityInstance: object, info: IEntityInfo): void {
        const node = entityInstance as Node;
        // 确保节点挂在正确的分组根节点下（可能因 attach 而改变了父级）
        const groupRoot = this._groupRoots.get(info.entityGroupName) ?? this.node;
        if (node.parent !== groupRoot) {
            groupRoot.addChild(node);
        }
        node.active = true;
        const logic = node.getComponent(EntityLogic);
        logic?.__reinit(info);
        logic?.onShow(info.userData);
    }

    // ---- 彻底销毁 ----

    releaseEntity(_entityAsset: object, entityInstance: object, userData?: object, isShutdown = false): void {
        const node = entityInstance as Node;
        const logic = node.getComponent(EntityLogic);
        logic?.onHide(isShutdown, userData);
        node.destroy();
    }

    // ---- 每帧驱动 ----

    onUpdateEntity(entityInstance: object, elapseSeconds: number, realElapseSeconds: number): void {
        const logic = (entityInstance as Node).getComponent(EntityLogic);
        logic?.onUpdate(elapseSeconds, realElapseSeconds);
    }

    // ---- 工具 ----

    getEntityLogic(entityInstance: object): object | null {
        return (entityInstance as Node).getComponent(EntityLogic);
    }

    // ---- 父子挂载（含 Node 层级重挂） ----

    onAttachEntity(entityInstance: object, parentEntityInstance: object, userData?: object): void {
        const childNode = entityInstance as Node;
        const parentNode = parentEntityInstance as Node;
        const childLogic = childNode.getComponent(EntityLogic);
        const parentLogic = parentNode.getComponent(EntityLogic);
        if (!childLogic || !parentLogic) return;

        // 将子实体节点重挂到父实体节点下（视觉层级同步）
        parentNode.addChild(childNode);

        childLogic.__onAttachTo(parentLogic, userData);
        parentLogic.__onChildAttached(childLogic, userData);
    }

    onDetachEntity(entityInstance: object, parentEntityInstance: object | null, userData?: object): void {
        const childNode = entityInstance as Node;
        const childLogic = childNode.getComponent(EntityLogic);
        const parentLogic = parentEntityInstance
            ? (parentEntityInstance as Node).getComponent(EntityLogic)
            : null;

        // 将子实体节点归还到它所属的分组根节点
        const groupName = childLogic?.entityGroupName;
        const groupRoot = groupName
            ? (this._groupRoots.get(groupName) ?? this.node)
            : this.node;
        groupRoot.addChild(childNode);

        childLogic?.__onDetachFrom(parentLogic, userData);
        if (parentLogic && childLogic) {
            parentLogic.__onChildDetached(childLogic, userData);
        }
    }
}
