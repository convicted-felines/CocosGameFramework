import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { IEntityManager, IEntityGroup, EntityStatus } from './IEntityManager';
import { IEntityHelper, IEntityInfo } from './IEntityHelper';
import { IResourceManager } from '../Resource/IResourceManager';

// ================================================================
// EntityGroup：分组配置 + 当前分组内实体追踪
// ================================================================

interface EntityRecord {
    instance: object;
    assetName: string;
}

class EntityGroup implements IEntityGroup {
    readonly name: string;
    readonly autoReleaseInterval: number;
    readonly capacity: number;
    readonly expireTime: number;
    readonly priority: number;

    private _records: Map<number, EntityRecord> = new Map();

    constructor(name: string, autoReleaseInterval: number, capacity: number, expireTime: number, priority: number) {
        this.name = name;
        this.autoReleaseInterval = autoReleaseInterval;
        this.capacity = capacity;
        this.expireTime = expireTime;
        this.priority = priority;
    }

    get entityCount(): number { return this._records.size; }

    // ---- 框架内部维护（EntityManager 调用） ----

    _addEntity(entityId: number, instance: object, assetName: string): void {
        this._records.set(entityId, { instance, assetName });
    }

    _removeEntity(entityId: number): void {
        this._records.delete(entityId);
    }

    // ---- IEntityGroup 查询 ----

    hasEntity(entityId: number): boolean {
        return this._records.has(entityId);
    }

    hasEntityByAssetName(entityAssetName: string): boolean {
        for (const r of this._records.values()) {
            if (r.assetName === entityAssetName) return true;
        }
        return false;
    }

    getEntityInstance(entityId: number): object | null {
        return this._records.get(entityId)?.instance ?? null;
    }

    getEntityInstanceByAssetName(entityAssetName: string): object | null {
        for (const r of this._records.values()) {
            if (r.assetName === entityAssetName) return r.instance;
        }
        return null;
    }

    getEntityInstances(entityAssetName: string): object[] {
        const result: object[] = [];
        this._records.forEach(r => { if (r.assetName === entityAssetName) result.push(r.instance); });
        return result;
    }

    getAllEntityInstances(): object[] {
        return Array.from(this._records.values()).map(r => r.instance);
    }

    _clear(): void { this._records.clear(); }
}

// ================================================================
// 池内空闲条目
// ================================================================

interface PoolEntry {
    instance: object;
    lastUseTime: number; // ms，用于过期判断
}

// ================================================================
// 实体运行时信息（内部跟踪用，区别于用户传入的 EntityInfo 业务数据类）
// ================================================================

interface EntityInfo {
    entityId: number;
    entityAssetName: string;
    bundleName: string;
    groupName: string;
    priority: number;
    userData?: object;
    instance: object | null;
    status: EntityStatus;
    parentEntityId: number;
    childEntityIds: Set<number>;
    loadStartTime: number;
}

// ================================================================
// EntityManager
// ================================================================

export class EntityManager extends GameFrameworkModule implements IEntityManager {
    private _entityHelper: IEntityHelper | null = null;
    private _resourceManager: IResourceManager | null = null;
    private _groups: Map<string, EntityGroup> = new Map();
    private _entities: Map<number, EntityInfo> = new Map();

    // 对象池：groupName → assetName → 空闲实例列表
    private _pool: Map<string, Map<string, PoolEntry[]>> = new Map();
    // 每个分组的自动释放计时器（秒）
    private _groupTimers: Map<string, number> = new Map();
    // 加载中途被取消的实体 ID（_onLoadSuccess 收到时直接跳过）
    private _cancelledIds: Set<number> = new Set();

    // 事件回调 — 由引擎层(EntityComponent)绑定
    onShowEntitySuccess: ((entityId: number, entityAssetName: string, groupName: string, instance: object, duration: number, userData?: object) => void) | null = null;
    onShowEntityFailure: ((entityId: number, entityAssetName: string, groupName: string, errorMessage: string, userData?: object) => void) | null = null;
    onHideEntityComplete: ((entityId: number, entityAssetName: string, groupName: string, userData?: object) => void) | null = null;
    onAttachEntitySuccess: ((entityId: number, parentEntityId: number, userData?: object) => void) | null = null;
    onDetachEntitySuccess: ((entityId: number, parentEntityId: number, userData?: object) => void) | null = null;

    get priority(): number { return 40; }

    get entityCount(): number {
        let n = 0;
        this._entities.forEach(e => {
            if (e.status === EntityStatus.Showed) n++;
        });
        return n;
    }

    get entityGroupCount(): number { return this._groups.size; }

    setHelper(helper: IEntityHelper): void { this._entityHelper = helper; }
    setResourceManager(rm: IResourceManager): void { this._resourceManager = rm; }

    // ================================================================
    // 分组管理
    // ================================================================

    addEntityGroup(groupName: string, autoReleaseInterval = 60, capacity = 16, expireTime = 60, priority = 0): boolean {
        if (this._groups.has(groupName)) return false;
        this._groups.set(groupName, new EntityGroup(groupName, autoReleaseInterval, capacity, expireTime, priority));
        this._pool.set(groupName, new Map());
        this._groupTimers.set(groupName, 0);
        return true;
    }

    hasEntityGroup(groupName: string): boolean { return this._groups.has(groupName); }

    getEntityGroup(groupName: string): IEntityGroup | null {
        return this._groups.get(groupName) ?? null;
    }

    getAllEntityGroups(): IEntityGroup[] {
        return Array.from(this._groups.values());
    }

    // ================================================================
    // 实体状态查询
    // ================================================================

    hasEntity(entityId: number): boolean {
        return this._entities.get(entityId)?.status === EntityStatus.Showed;
    }

    hasEntityByAssetName(entityAssetName: string): boolean {
        for (const data of this._entities.values()) {
            if (data.status === EntityStatus.Showed && data.entityAssetName === entityAssetName) return true;
        }
        return false;
    }

    isLoadingEntity(entityId: number): boolean {
        const s = this._entities.get(entityId)?.status;
        return s === EntityStatus.WillInit || s === EntityStatus.WillShow;
    }

    isValidEntity(entityId: number): boolean {
        return this._entities.get(entityId)?.status === EntityStatus.Showed;
    }

    getEntityStatus(entityId: number): EntityStatus {
        return this._entities.get(entityId)?.status ?? EntityStatus.Unknown;
    }

    // ================================================================
    // 实体实例查询
    // ================================================================

    getEntityInstance(entityId: number): object | null {
        const data = this._entities.get(entityId);
        return data?.status === EntityStatus.Showed ? data.instance : null;
    }

    getEntityInstances(entityAssetName: string): object[] {
        const result: object[] = [];
        this._entities.forEach(data => {
            if (data.status === EntityStatus.Showed && data.entityAssetName === entityAssetName && data.instance) {
                result.push(data.instance);
            }
        });
        return result;
    }

    getAllLoadedEntityInstances(): object[] {
        const result: object[] = [];
        this._entities.forEach(data => {
            if (data.status === EntityStatus.Showed && data.instance) result.push(data.instance);
        });
        return result;
    }

    getAllLoadingEntityIds(): number[] {
        const result: number[] = [];
        this._entities.forEach((data, id) => {
            if (data.status === EntityStatus.WillInit || data.status === EntityStatus.WillShow) result.push(id);
        });
        return result;
    }

    // ================================================================
    // 父子关系查询
    // ================================================================

    getParentEntityInstance(entityId: number): object | null {
        const data = this._entities.get(entityId);
        if (!data || data.parentEntityId < 0) return null;
        return this.getEntityInstance(data.parentEntityId);
    }

    getChildEntityCount(parentEntityId: number): number {
        return this._entities.get(parentEntityId)?.childEntityIds.size ?? 0;
    }

    getChildEntityInstance(parentEntityId: number): object | null {
        const parent = this._entities.get(parentEntityId);
        if (!parent) return null;
        const firstId = parent.childEntityIds.values().next().value;
        return firstId !== undefined ? this.getEntityInstance(firstId) : null;
    }

    getChildEntityInstances(parentEntityId: number): object[] {
        const parent = this._entities.get(parentEntityId);
        if (!parent) return [];
        const result: object[] = [];
        parent.childEntityIds.forEach(id => {
            const inst = this.getEntityInstance(id);
            if (inst) result.push(inst);
        });
        return result;
    }

    // ================================================================
    // 实体生命周期 — showEntity（优先命中对象池）
    // ================================================================

    showEntity(entityId: number, entityAssetName: string, bundleName: string, groupName: string, priority = 0, userData?: object): void {
        if (!this._entityHelper) throw new GameFrameworkError('EntityHelper is not set.');
        if (!this._resourceManager) throw new GameFrameworkError('ResourceManager is not set.');
        if (!this._groups.has(groupName)) throw new GameFrameworkError(`EntityGroup '${groupName}' does not exist.`);
        if (this._entities.has(entityId)) throw new GameFrameworkError(`Entity '${entityId}' already exists.`);

        const data: EntityInfo = {
            entityId, entityAssetName, bundleName, groupName,
            priority, userData, instance: null,
            status: EntityStatus.WillInit,
            parentEntityId: -1, childEntityIds: new Set(),
            loadStartTime: Date.now(),
        };
        this._entities.set(entityId, data);

        // 优先从对象池取复用实例
        const pooled = this._acquireFromPool(groupName, entityAssetName);
        if (pooled) {
            data.status = EntityStatus.WillShow;
            data.instance = pooled.instance;
            const info: IEntityInfo = { entityId, entityAssetName, entityGroupName: groupName, userData };
            this._entityHelper.reactivateEntity(pooled.instance, info);
            data.status = EntityStatus.Showed;
            this._groups.get(groupName)!._addEntity(entityId, pooled.instance, entityAssetName);
            this.onShowEntitySuccess?.(entityId, entityAssetName, groupName, pooled.instance, 0, userData);
            return;
        }

        // 池未命中 → 从资源加载
        this._resourceManager.loadAsset(
            bundleName, entityAssetName, Object as any,
            (asset: object) => this._onLoadSuccess(entityId, asset),
            (_name, msg) => this._onLoadFailure(entityId, entityAssetName, msg)
        );
    }

    private _onLoadSuccess(entityId: number, asset: object): void {
        // 加载期间被取消
        if (this._cancelledIds.has(entityId)) {
            this._cancelledIds.delete(entityId);
            return;
        }
        const data = this._entities.get(entityId);
        if (!data || !this._entityHelper) return;

        const duration = (Date.now() - data.loadStartTime) / 1000;
        data.status = EntityStatus.WillShow;

        const instance = this._entityHelper.instantiateEntity(asset);
        data.instance = instance;
        data.status = EntityStatus.Inited;

        const info: IEntityInfo = {
            entityId,
            entityAssetName: data.entityAssetName,
            entityGroupName: data.groupName,
            userData: data.userData,
        };
        this._entityHelper.createEntity(instance, info);
        data.status = EntityStatus.Showed;
        this._groups.get(data.groupName)?._addEntity(entityId, instance, data.entityAssetName);
        this.onShowEntitySuccess?.(entityId, data.entityAssetName, data.groupName, instance, duration, data.userData);
    }

    private _onLoadFailure(entityId: number, assetName: string, msg: string): void {
        if (this._cancelledIds.has(entityId)) {
            this._cancelledIds.delete(entityId);
            return;
        }
        const data = this._entities.get(entityId);
        if (!data) return;
        const { groupName, userData } = data;
        this._entities.delete(entityId);
        if (this.onShowEntityFailure) {
            this.onShowEntityFailure(entityId, assetName, groupName, msg, userData);
        } else {
            console.error(`[EntityManager] Show entity '${assetName}' failed: ${msg}`);
        }
    }

    // ================================================================
    // 实体生命周期 — hideEntity
    // ================================================================

    hideEntity(entityId: number, userData?: object): void {
        const data = this._entities.get(entityId);
        if (!data) return;

        // 正在加载中：取消该次加载，不需要等待加载完成
        if (data.status === EntityStatus.WillInit || data.status === EntityStatus.WillShow) {
            this._cancelledIds.add(entityId);
            this._entities.delete(entityId);
            this.onHideEntityComplete?.(entityId, data.entityAssetName, data.groupName, userData);
            return;
        }

        if (!this._entityHelper || data.status !== EntityStatus.Showed) return;

        data.status = EntityStatus.WillHide;

        // 先断开父子关系
        if (data.parentEntityId >= 0) this.detachEntity(entityId, userData);
        if (data.childEntityIds.size > 0) this.detachChildEntities(entityId, userData);

        const { entityAssetName, groupName } = data;
        const inst = data.instance!;

        data.status = EntityStatus.Hidden;
        this._groups.get(groupName)?._removeEntity(entityId);
        this._entities.delete(entityId);

        // 尝试回池；池满则销毁
        data.status = EntityStatus.WillRecycle;
        if (this._returnToPool(groupName, entityAssetName, inst)) {
            this._entityHelper.recycleEntity(inst, userData);
        } else {
            this._entityHelper.releaseEntity(null!, inst, userData, false);
        }

        this.onHideEntityComplete?.(entityId, entityAssetName, groupName, userData);
    }

    hideAllLoadedEntities(userData?: object): void {
        const ids: number[] = [];
        this._entities.forEach((data, id) => { if (data.status === EntityStatus.Showed) ids.push(id); });
        for (const id of ids) this.hideEntity(id, userData);
    }

    hideAllLoadingEntities(userData?: object): void {
        const loading: EntityInfo[] = [];
        this._entities.forEach((data, id) => {
            if (data.status === EntityStatus.WillInit || data.status === EntityStatus.WillShow) {
                loading.push(data);
                this._cancelledIds.add(id);
                this._entities.delete(id);
            }
        });
        for (const data of loading) {
            this.onHideEntityComplete?.(data.entityId, data.entityAssetName, data.groupName, userData);
        }
    }

    hideAllEntities(userData?: object): void {
        this.hideAllLoadedEntities(userData);
        this.hideAllLoadingEntities(userData);
    }

    // ================================================================
    // 父子挂载
    // ================================================================

    attachEntity(entityId: number, parentEntityId: number, userData?: object): void {
        const child = this._entities.get(entityId);
        const parent = this._entities.get(parentEntityId);
        if (!child || !parent || child.status !== EntityStatus.Showed || parent.status !== EntityStatus.Showed || !this._entityHelper) return;

        if (child.parentEntityId >= 0) this.detachEntity(entityId, userData);

        child.parentEntityId = parentEntityId;
        parent.childEntityIds.add(entityId);
        this._entityHelper.onAttachEntity(child.instance!, parent.instance!, userData);
        this.onAttachEntitySuccess?.(entityId, parentEntityId, userData);
    }

    detachEntity(entityId: number, userData?: object): void {
        const data = this._entities.get(entityId);
        if (!data || data.parentEntityId < 0) return;

        const parentId = data.parentEntityId;
        const parent = this._entities.get(parentId);
        parent?.childEntityIds.delete(entityId);
        data.parentEntityId = -1;

        if (this._entityHelper && data.instance) {
            this._entityHelper.onDetachEntity(data.instance, parent?.instance ?? null, userData);
        }
        this.onDetachEntitySuccess?.(entityId, parentId, userData);
    }

    detachChildEntities(parentEntityId: number, userData?: object): void {
        const parent = this._entities.get(parentEntityId);
        if (!parent) return;
        const childIds = Array.from(parent.childEntityIds);
        for (const id of childIds) this.detachEntity(id, userData);
    }

    // ================================================================
    // 每帧更新：驱动实体 + 对象池过期扫描
    // ================================================================

    update(elapseSeconds: number, realElapseSeconds: number): void {
        if (!this._entityHelper) return;

        // 驱动活跃实体
        this._entities.forEach(data => {
            if (data.status === EntityStatus.Showed && data.instance) {
                this._entityHelper!.onUpdateEntity(data.instance, elapseSeconds, realElapseSeconds);
            }
        });

        // 对象池过期扫描（每组独立计时）
        this._groups.forEach((group, groupName) => {
            const elapsed = (this._groupTimers.get(groupName) ?? 0) + elapseSeconds;
            if (elapsed >= group.autoReleaseInterval) {
                this._groupTimers.set(groupName, 0);
                this._releaseExpiredPoolEntries(groupName, group.expireTime);
            } else {
                this._groupTimers.set(groupName, elapsed);
            }
        });
    }

    // ================================================================
    // 关闭：销毁全部活跃实体 + 池内实体（isShutdown=true）
    // ================================================================

    shutdown(): void {
        if (!this._entityHelper) return;

        this._entities.forEach(data => {
            if (data.status === EntityStatus.Showed && data.instance) {
                this._entityHelper!.releaseEntity(null!, data.instance, undefined, true);
            }
        });
        this._entities.clear();

        this._pool.forEach(groupPool => {
            groupPool.forEach(entries => {
                entries.forEach(entry => {
                    this._entityHelper!.releaseEntity(null!, entry.instance, undefined, true);
                });
            });
        });

        this._pool.clear();
        this._groupTimers.clear();
        this._cancelledIds.clear();
        this._groups.forEach(g => g._clear());
        this._groups.clear();
        this._entityHelper = null;
        this._resourceManager = null;
    }

    // ================================================================
    // 对象池内部工具
    // ================================================================

    private _acquireFromPool(groupName: string, assetName: string): PoolEntry | null {
        const groupPool = this._pool.get(groupName);
        if (!groupPool) return null;
        const entries = groupPool.get(assetName);
        if (!entries || entries.length === 0) return null;
        return entries.shift()!;
    }

    private _returnToPool(groupName: string, assetName: string, instance: object): boolean {
        const group = this._groups.get(groupName);
        const groupPool = this._pool.get(groupName);
        if (!group || !groupPool) return false;

        let total = 0;
        groupPool.forEach(entries => { total += entries.length; });
        if (total >= group.capacity) return false;

        let entries = groupPool.get(assetName);
        if (!entries) { entries = []; groupPool.set(assetName, entries); }
        entries.push({ instance, lastUseTime: Date.now() });
        return true;
    }

    private _releaseExpiredPoolEntries(groupName: string, expireTime: number): void {
        const groupPool = this._pool.get(groupName);
        if (!groupPool || !this._entityHelper) return;
        const now = Date.now();
        groupPool.forEach(entries => {
            for (let i = entries.length - 1; i >= 0; i--) {
                if ((now - entries[i].lastUseTime) / 1000 >= expireTime) {
                    const [expired] = entries.splice(i, 1);
                    this._entityHelper!.releaseEntity(null!, expired.instance, undefined, false);
                }
            }
        });
    }
}
