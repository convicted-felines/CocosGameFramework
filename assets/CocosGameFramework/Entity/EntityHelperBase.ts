import { Component, _decorator } from 'cc';
import { IEntityHelper, IEntityInfo } from '../../GameFramework/Entity/IEntityHelper';

const { ccclass } = _decorator;

/**
 * 实体辅助器基类。
 *
 * 继承此类并实现抽象方法，即可替换框架的实体创建/销毁策略。
 * 将具体实现组件挂载到场景节点后，在 EntityComponent 的 entityHelper 属性处拖入该节点即可。
 */
@ccclass('EntityHelperBase')
export abstract class EntityHelperBase extends Component implements IEntityHelper {
    abstract setGroupRoot(groupName: string, groupRoot: object): void;

    abstract instantiateEntity(entityAsset: object): object;

    abstract createEntity(entityInstance: object, entityInfo: IEntityInfo): void;

    abstract onUpdateEntity(entityInstance: object, elapseSeconds: number, realElapseSeconds: number): void;

    abstract releaseEntity(entityAsset: object, entityInstance: object, userData?: object, isShutdown?: boolean): void;

    abstract recycleEntity(entityInstance: object, userData?: object): void;

    abstract reactivateEntity(entityInstance: object, entityInfo: IEntityInfo): void;

    abstract getEntityLogic(entityInstance: object): object | null;

    abstract onAttachEntity(entityInstance: object, parentEntityInstance: object, userData?: object): void;

    abstract onDetachEntity(entityInstance: object, parentEntityInstance: object | null, userData?: object): void;
}
