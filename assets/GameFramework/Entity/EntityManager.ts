import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { IEntityManager } from './IEntityManager';
import { IEntityHelper, IEntityInfo } from './IEntityHelper';
import { IResourceManager } from '../Resource/IResourceManager';

interface EntityData {
    entityId: number;
    assetName: string;
    bundleName: string;
    groupName: string;
    priority: number;
    userData?: object;
    instance: object | null;
    isLoading: boolean;
    parentEntityId: number;
}

export class EntityManager extends GameFrameworkModule implements IEntityManager {
    private _entityHelper: IEntityHelper | null = null;
    private _resourceManager: IResourceManager | null = null;
    private _groups: Set<string> = new Set();
    private _entities: Map<number, EntityData> = new Map();

    get priority(): number { return 40; }
    get entityCount(): number {
        return Array.from(this._entities.values()).filter(e => !e.isLoading).length;
    }
    get entityGroupCount(): number { return this._groups.size; }

    setHelper(helper: IEntityHelper): void { this._entityHelper = helper; }
    setResourceManager(rm: IResourceManager): void { this._resourceManager = rm; }

    addEntityGroup(groupName: string): boolean {
        if (this._groups.has(groupName)) return false;
        this._groups.add(groupName);
        return true;
    }

    hasEntityGroup(groupName: string): boolean { return this._groups.has(groupName); }

    hasEntity(entityId: number): boolean {
        const e = this._entities.get(entityId);
        return !!e && !e.isLoading;
    }

    isLoadingEntity(entityId: number): boolean {
        return this._entities.get(entityId)?.isLoading ?? false;
    }

    showEntity(
        entityId: number,
        entityAssetName: string,
        bundleName: string,
        groupName: string,
        priority: number = 0,
        userData?: object
    ): void {
        if (!this._entityHelper) throw new GameFrameworkError('EntityHelper is not set.');
        if (!this._resourceManager) throw new GameFrameworkError('ResourceManager is not set.');
        if (!this._groups.has(groupName)) throw new GameFrameworkError(`EntityGroup [${groupName}] not found.`);
        if (this._entities.has(entityId)) {
            throw new GameFrameworkError(`Entity [${entityId}] already exists.`);
        }

        const entityData: EntityData = {
            entityId, assetName: entityAssetName, bundleName, groupName,
            priority, userData, instance: null, isLoading: true, parentEntityId: -1,
        };
        this._entities.set(entityId, entityData);

        this._resourceManager.loadAsset(
            bundleName, entityAssetName, Object as any,
            (asset: object) => this._onLoadSuccess(entityId, asset),
            (name, msg) => this._onLoadFailure(entityId, name, msg)
        );
    }

    private _onLoadSuccess(entityId: number, asset: object): void {
        const data = this._entities.get(entityId);
        if (!data || !this._entityHelper) return;
        data.isLoading = false;
        const instance = this._entityHelper.instantiateEntity(asset);
        data.instance = instance;
        const info: IEntityInfo = {
            entityId, entityAssetName: data.assetName,
            entityGroupName: data.groupName, userData: data.userData,
        };
        this._entityHelper.createEntity(instance, info);
    }

    private _onLoadFailure(entityId: number, assetName: string, msg: string): void {
        console.error(`[EntityManager] Show entity [${assetName}] failed: ${msg}`);
        this._entities.delete(entityId);
    }

    hideEntity(entityId: number, userData?: object): void {
        const data = this._entities.get(entityId);
        if (!data || data.isLoading || !this._entityHelper) return;
        this.detachEntity(entityId, userData);
        this._entityHelper.releaseEntity(null!, data.instance!);
        this._entities.delete(entityId);
    }

    hideAllEntities(userData?: object): void {
        const ids = Array.from(this._entities.keys());
        for (const id of ids) this.hideEntity(id, userData);
    }

    attachEntity(entityId: number, parentEntityId: number, userData?: object): void {
        const child = this._entities.get(entityId);
        const parent = this._entities.get(parentEntityId);
        if (!child || !parent || child.isLoading || parent.isLoading) return;
        child.parentEntityId = parentEntityId;
    }

    detachEntity(entityId: number, _userData?: object): void {
        const data = this._entities.get(entityId);
        if (data) data.parentEntityId = -1;
    }

    detachChildEntities(parentEntityId: number, userData?: object): void {
        this._entities.forEach((data, id) => {
            if (data.parentEntityId === parentEntityId) this.detachEntity(id, userData);
        });
    }

    update(elapseSeconds: number, realElapseSeconds: number): void {
        if (!this._entityHelper) return;
        this._entities.forEach(data => {
            if (!data.isLoading && data.instance) {
                this._entityHelper!.onUpdateEntity(data.instance, elapseSeconds, realElapseSeconds);
            }
        });
    }

    shutdown(): void {
        this.hideAllEntities();
        this._groups.clear();
        this._entityHelper = null;
        this._resourceManager = null;
    }
}
