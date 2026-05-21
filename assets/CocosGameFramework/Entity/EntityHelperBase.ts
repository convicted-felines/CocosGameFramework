import { Component, _decorator } from 'cc';
import { IEntityHelper, IEntityInfo } from '../../GameFramework/Entity/IEntityHelper';

const { ccclass } = _decorator;

/**
 * 实体辅助器基类。
 *
 * 继承此类并实现抽象方法，即可替换框架的实体创建/销毁策略。
 * 子类需在文件末尾调用 HelperRegistry.register('MyEntityHelper', MyEntityHelper) 完成注册，
 * 并在 EntityHelperType 枚举中添加对应条目，之后 EntityComponent Inspector 下拉即可选择。
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
