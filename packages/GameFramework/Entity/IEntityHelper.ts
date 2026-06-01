export interface IEntityInfo {
    readonly entityId: number;
    readonly entityAssetName: string;
    readonly entityGroupName: string;
    userData?: object;
}

export interface IEntityHelper {
    /** 注册分组根节点，引擎层据此将实体挂载到对应分组子节点 */
    setGroupRoot(groupName: string, groupRoot: object): void;

    /** 实例化实体 Prefab（首次创建） */
    instantiateEntity(entityAsset: object): object;

    /** 首次创建：挂载节点、调用 onInit + onShow */
    createEntity(entityInstance: object, entityInfo: IEntityInfo): void;

    /** 每帧驱动实体逻辑 */
    onUpdateEntity(entityInstance: object, elapseSeconds: number, realElapseSeconds: number): void;

    /**
     * 彻底销毁实体实例。
     * @param isShutdown true 表示框架关闭时批量销毁，onHide 收到该标记可做区分。
     */
    releaseEntity(entityAsset: object, entityInstance: object, userData?: object, isShutdown?: boolean): void;

    /**
     * 回收至对象池：调用 onHide(false) 并令节点隐藏（不销毁）。
     */
    recycleEntity(entityInstance: object, userData?: object): void;

    /**
     * 从对象池复用：重新激活节点、更新数据、调用 onShow（不调用 onInit）。
     */
    reactivateEntity(entityInstance: object, entityInfo: IEntityInfo): void;

    /** 从实体实例中取回逻辑组件对象 */
    getEntityLogic(entityInstance: object): object | null;

    /** 实体被附加到父实体时调用（含 Node 重挂载） */
    onAttachEntity(entityInstance: object, parentEntityInstance: object, userData?: object): void;

    /** 实体从父实体脱离时调用（含 Node 归还分组根节点） */
    onDetachEntity(entityInstance: object, parentEntityInstance: object | null, userData?: object): void;
}
