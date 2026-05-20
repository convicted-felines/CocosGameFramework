import { IEntityGroup } from './IEntityManager';

/**
 * 实体接口，对应原版 IEntity。
 * 引擎层的 EntityLogic Component 实现此接口。
 */
export interface IEntity {
    /** 实体编号 */
    readonly entityId: number;
    /** 实体资源名称 */
    readonly entityAssetName: string;
    /** 所属实体组 */
    readonly entityGroup: IEntityGroup;
    /** 实体逻辑对象（引擎层 EntityLogic 实例） */
    readonly entityLogic: object | null;

    /** 初始化实体 */
    onInit(entityId: number, entityAssetName: string, entityGroup: IEntityGroup, isNewInstance: boolean, userData?: object): void;
    /** 显示实体 */
    onShow(userData?: object): void;
    /** 隐藏实体 */
    onHide(isShutdown: boolean, userData?: object): void;
    /** 挂载到父实体时回调 */
    onAttached(parentEntity: IEntity, userData?: object): void;
    /** 从父实体卸载时回调 */
    onDetached(parentEntity: IEntity, userData?: object): void;
    /** 子实体挂载到本实体时回调 */
    onAttachChild(childEntity: IEntity, userData?: object): void;
    /** 子实体从本实体卸载时回调 */
    onDetachChild(childEntity: IEntity, userData?: object): void;
    /** 回池时回调 */
    onRecycle(): void;
    /** 实体轮询 */
    onUpdate(elapseSeconds: number, realElapseSeconds: number): void;
}
