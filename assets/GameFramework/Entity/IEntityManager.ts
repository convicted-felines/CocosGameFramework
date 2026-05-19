/** 实体生命周期状态（对应 Unity 原版 EntityStatus 枚举） */
export const enum EntityStatus {
    Unknown    = 0,
    WillInit   = 1,
    Inited     = 2,
    WillShow   = 3,
    Showed     = 4,
    WillHide   = 5,
    Hidden     = 6,
    WillRecycle = 7,
    Recycled   = 8,
}

export interface IEntityGroup {
    readonly name: string;
    readonly autoReleaseInterval: number;
    readonly capacity: number;
    readonly expireTime: number;
    readonly priority: number;

    /** 当前分组内已显示的实体数量 */
    readonly entityCount: number;

    /** 按 entityId 判断分组内是否有该实体 */
    hasEntity(entityId: number): boolean;
    /** 按资源名判断分组内是否有该类型的实体 */
    hasEntityByAssetName(entityAssetName: string): boolean;

    /** 按 entityId 取分组内实体的原始实例（引擎层转换为 EntityLogic） */
    getEntityInstance(entityId: number): object | null;
    /** 按资源名取分组内第一个匹配实例 */
    getEntityInstanceByAssetName(entityAssetName: string): object | null;
    /** 按资源名取分组内所有匹配实例 */
    getEntityInstances(entityAssetName: string): object[];
    /** 取分组内所有已显示实体的实例 */
    getAllEntityInstances(): object[];
}

export interface IEntityManager {
    readonly entityCount: number;
    readonly entityGroupCount: number;

    // ---- 分组管理 ----
    addEntityGroup(groupName: string, autoReleaseInterval?: number, capacity?: number, expireTime?: number, priority?: number): boolean;
    hasEntityGroup(groupName: string): boolean;
    getEntityGroup(groupName: string): IEntityGroup | null;
    getAllEntityGroups(): IEntityGroup[];

    // ---- 实体状态查询 ----
    hasEntity(entityId: number): boolean;
    hasEntityByAssetName(entityAssetName: string): boolean;
    isLoadingEntity(entityId: number): boolean;
    isValidEntity(entityId: number): boolean;
    getEntityStatus(entityId: number): EntityStatus;

    // ---- 实体实例查询（返回 object，引擎层负责类型转换） ----
    getEntityInstance(entityId: number): object | null;
    getEntityInstances(entityAssetName: string): object[];
    getAllLoadedEntityInstances(): object[];
    getAllLoadingEntityIds(): number[];

    // ---- 父子关系查询 ----
    getParentEntityInstance(entityId: number): object | null;
    getChildEntityCount(parentEntityId: number): number;
    getChildEntityInstance(parentEntityId: number): object | null;
    getChildEntityInstances(parentEntityId: number): object[];

    // ---- 实体生命周期 ----
    showEntity(entityId: number, entityAssetName: string, bundleName: string, groupName: string, priority?: number, userData?: object): void;
    /** 隐藏实体；若实体正在加载中则立即取消该次加载 */
    hideEntity(entityId: number, userData?: object): void;
    hideAllLoadedEntities(userData?: object): void;
    hideAllLoadingEntities(userData?: object): void;
    hideAllEntities(userData?: object): void;

    // ---- 父子挂载 ----
    attachEntity(entityId: number, parentEntityId: number, userData?: object): void;
    detachEntity(entityId: number, userData?: object): void;
    detachChildEntities(parentEntityId: number, userData?: object): void;
}
