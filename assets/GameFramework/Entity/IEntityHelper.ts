// 实体生命周期由 EntityLogic 组件承载
export interface IEntityHelper {
    // 实例化实体 Prefab
    instantiateEntity(entityAsset: object): object;

    // 实体初始化（关联到 EntityBase）
    createEntity(entityInstance: object, entity: IEntityInfo): void;

    // 每帧驱动实体逻辑更新
    onUpdateEntity(entityInstance: object, elapseSeconds: number, realElapseSeconds: number): void;

    // 释放实体实例
    releaseEntity(entityAsset: object, entityInstance: object): void;
}

export interface IEntityInfo {
    readonly entityId: number;
    readonly entityAssetName: string;
    readonly entityGroupName: string;
    userData?: object;
}
