export interface IEntityManager {
    readonly entityCount: number;
    readonly entityGroupCount: number;

    addEntityGroup(groupName: string): boolean;
    hasEntityGroup(groupName: string): boolean;

    hasEntity(entityId: number): boolean;
    isLoadingEntity(entityId: number): boolean;

    showEntity(
        entityId: number,
        entityAssetName: string,
        bundleName: string,
        groupName: string,
        priority?: number,
        userData?: object
    ): void;

    hideEntity(entityId: number, userData?: object): void;
    hideAllEntities(userData?: object): void;

    attachEntity(entityId: number, parentEntityId: number, userData?: object): void;
    detachEntity(entityId: number, userData?: object): void;
    detachChildEntities(parentEntityId: number, userData?: object): void;
}
