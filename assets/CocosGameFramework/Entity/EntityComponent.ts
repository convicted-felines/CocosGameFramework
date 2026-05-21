import { _decorator, Node, Enum } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { EntityManager } from '../../GameFramework/Entity/EntityManager';
import { IEntityGroup, EntityStatus } from '../../GameFramework/Entity/IEntityManager';
import {
    ShowEntitySuccessEventArgs,
    ShowEntityFailureEventArgs,
    HideEntityCompleteEventArgs,
    AttachEntitySuccessEventArgs,
    DetachEntitySuccessEventArgs,
} from '../../GameFramework/Entity/EntityEventArgs';
import { EventManager } from '../../GameFramework/Event/EventManager';
import { CocosResourceManager } from '../Resource/CocosResourceManager';
import { EntityHelperBase } from './EntityHelperBase';
import { DefaultEntityHelper } from './DefaultEntityHelper';
import { EntityLogic } from './EntityLogic';
import { HelperRegistry } from '../Base/HelperRegistry';
import { EntityHelperType } from './EntityHelperType';

const { ccclass, property } = _decorator;

/** Inspector 中配置的实体分组参数 */
@ccclass('EntityGroupConfig')
class EntityGroupConfig {
    @property({ tooltip: '分组名称' })
    name: string = 'Default';

    @property({ tooltip: '自动释放间隔(秒)' })
    autoReleaseInterval: number = 60;

    @property({ tooltip: '对象池容量上限' })
    capacity: number = 16;

    @property({ tooltip: '实体过期时间(秒)，超时未使用则从池中释放' })
    expireTime: number = 60;

    @property({ tooltip: '分组优先级，数值越大优先级越高' })
    priority: number = 0;
}

@ccclass('EntityComponent')
export class EntityComponent extends GameFrameworkComponent {
    @property({ type: Node, tooltip: '所有实体分组节点的挂载根节点' })
    entityRoot: Node | null = null;

    @property({ type: Enum(EntityHelperType), tooltip: '实体辅助器类型' })
    entityHelperType: EntityHelperType = EntityHelperType.DefaultEntityHelper;

    @property({ type: [EntityGroupConfig], tooltip: '实体分组配置列表' })
    entityGroupConfigs: EntityGroupConfig[] = [new EntityGroupConfig()];

    private _manager!: EntityManager;
    private _helper!: EntityHelperBase;
    private _eventMgr: EventManager | null = null;

    get manager(): EntityManager { return this._manager; }

    // ---- 生命周期 ----

    onLoad(): void {
        super.onLoad();
        this._manager = new EntityManager();

        const root = this.entityRoot ?? this.node;
        this._helper = HelperRegistry.createHelper(this.node, EntityHelperType[this.entityHelperType], DefaultEntityHelper);
        this._manager.setHelper(this._helper);

        for (const cfg of this.entityGroupConfigs) {
            const trimmed = cfg.name.trim();
            if (!trimmed) continue;
            const groupNode = new Node(trimmed);
            groupNode.parent = root;
            this._helper.setGroupRoot(trimmed, groupNode);
            this._manager.addEntityGroup(trimmed, cfg.autoReleaseInterval, cfg.capacity, cfg.expireTime, cfg.priority);
        }

        this._bindCallbacks();
        GameFrameworkEntry.registerModule(MODULE_ID.ENTITY, this._manager);
    }

    start(): void {
        // start() 时所有模块已注册完毕，安全获取跨模块依赖。
        try {
            this._manager.setResourceManager(
                GameFrameworkEntry.getModule(CocosResourceManager, MODULE_ID.RESOURCE)
            );
        } catch {
            console.warn('[EntityComponent] ResourceComponent not found.');
        }
        try {
            this._eventMgr = GameFrameworkEntry.getModule(EventManager, MODULE_ID.EVENT);
        } catch {
            // 未注册 EventComponent 时静默忽略，不影响实体功能
        }
    }

    private _bindCallbacks(): void {
        this._manager.onShowEntitySuccess = (entityId, entityAssetName, groupName, _instance, duration, userData) => {
            if (!this._eventMgr) return;
            this._eventMgr.fire(this, ShowEntitySuccessEventArgs.create(entityId, entityAssetName, groupName, duration, userData));
        };

        this._manager.onShowEntityFailure = (entityId, entityAssetName, groupName, errorMessage, userData) => {
            console.warn(`[EntityComponent] Show entity '${entityAssetName}' (id=${entityId}) failed: ${errorMessage}`);
            if (!this._eventMgr) return;
            this._eventMgr.fire(this, ShowEntityFailureEventArgs.create(entityId, entityAssetName, groupName, errorMessage, userData));
        };

        this._manager.onHideEntityComplete = (entityId, entityAssetName, groupName, userData) => {
            if (!this._eventMgr) return;
            this._eventMgr.fire(this, HideEntityCompleteEventArgs.create(entityId, entityAssetName, groupName, userData));
        };

        this._manager.onAttachEntitySuccess = (entityId, parentEntityId, userData) => {
            if (!this._eventMgr) return;
            this._eventMgr.fire(this, AttachEntitySuccessEventArgs.create(entityId, parentEntityId, userData));
        };

        this._manager.onDetachEntitySuccess = (entityId, parentEntityId, userData) => {
            if (!this._eventMgr) return;
            this._eventMgr.fire(this, DetachEntitySuccessEventArgs.create(entityId, parentEntityId, userData));
        };
    }

    // ---- 统计属性 ----

    get entityCount(): number { return this._manager.entityCount; }
    get entityGroupCount(): number { return this._manager.entityGroupCount; }

    // ---- 分组管理 ----

    addEntityGroup(groupName: string, autoReleaseInterval = 60, capacity = 16, expireTime = 60, priority = 0): boolean {
        return this._manager.addEntityGroup(groupName, autoReleaseInterval, capacity, expireTime, priority);
    }

    hasEntityGroup(groupName: string): boolean { return this._manager.hasEntityGroup(groupName); }

    getEntityGroup(groupName: string): IEntityGroup | null { return this._manager.getEntityGroup(groupName); }

    getAllEntityGroups(): IEntityGroup[] { return this._manager.getAllEntityGroups(); }

    // ---- 实体状态查询 ----

    hasEntity(entityId: number): boolean { return this._manager.hasEntity(entityId); }
    hasEntityByAssetName(entityAssetName: string): boolean { return this._manager.hasEntityByAssetName(entityAssetName); }
    isLoadingEntity(entityId: number): boolean { return this._manager.isLoadingEntity(entityId); }
    isValidEntity(entityLogic: EntityLogic): boolean { return this._manager.isValidEntity(entityLogic.entityId); }
    getEntityStatus(entityId: number): EntityStatus { return this._manager.getEntityStatus(entityId); }

    // ---- 实体实例查询（返回 EntityLogic 组件） ----

    getEntity(entityId: number): EntityLogic | null {
        return this._toLogic(this._manager.getEntityInstance(entityId));
    }

    getEntityByAssetName(entityAssetName: string): EntityLogic | null {
        const instances = this._manager.getEntityInstances(entityAssetName);
        return instances.length > 0 ? this._toLogic(instances[0]) : null;
    }

    getEntities(entityAssetName: string): EntityLogic[] {
        return this._manager.getEntityInstances(entityAssetName)
            .map(inst => this._toLogic(inst))
            .filter((l): l is EntityLogic => l !== null);
    }

    getAllLoadedEntities(): EntityLogic[] {
        return this._manager.getAllLoadedEntityInstances()
            .map(inst => this._toLogic(inst))
            .filter((l): l is EntityLogic => l !== null);
    }

    getAllLoadingEntityIds(): number[] { return this._manager.getAllLoadingEntityIds(); }

    // ---- 分组内实体查询（EntityLogic 版，对 IEntityGroup 原始接口的 Cocos 封装） ----

    getEntityInGroup(groupName: string, entityId: number): EntityLogic | null {
        return this._toLogic(this._manager.getEntityGroup(groupName)?.getEntityInstance(entityId) ?? null);
    }

    getEntityInGroupByAssetName(groupName: string, entityAssetName: string): EntityLogic | null {
        return this._toLogic(this._manager.getEntityGroup(groupName)?.getEntityInstanceByAssetName(entityAssetName) ?? null);
    }

    getEntitiesInGroup(groupName: string, entityAssetName: string): EntityLogic[] {
        return (this._manager.getEntityGroup(groupName)?.getEntityInstances(entityAssetName) ?? [])
            .map(inst => this._toLogic(inst))
            .filter((l): l is EntityLogic => l !== null);
    }

    getAllEntitiesInGroup(groupName: string): EntityLogic[] {
        return (this._manager.getEntityGroup(groupName)?.getAllEntityInstances() ?? [])
            .map(inst => this._toLogic(inst))
            .filter((l): l is EntityLogic => l !== null);
    }

    getEntityCountInGroup(groupName: string): number {
        return this._manager.getEntityGroup(groupName)?.entityCount ?? 0;
    }

    // ---- 父子关系查询 ----

    getParentEntity(entityLogic: EntityLogic): EntityLogic | null {
        return this._toLogic(this._manager.getParentEntityInstance(entityLogic.entityId));
    }

    getChildEntityCount(entityLogic: EntityLogic): number {
        return this._manager.getChildEntityCount(entityLogic.entityId);
    }

    getChildEntity(entityLogic: EntityLogic): EntityLogic | null {
        return this._toLogic(this._manager.getChildEntityInstance(entityLogic.entityId));
    }

    getChildEntities(entityLogic: EntityLogic): EntityLogic[] {
        return this._manager.getChildEntityInstances(entityLogic.entityId)
            .map(inst => this._toLogic(inst))
            .filter((l): l is EntityLogic => l !== null);
    }

    // ---- 显示实体 ----

    showEntity(entityId: number, entityAssetName: string, bundleName: string, groupName: string, priority = 0, userData?: object): void {
        this._manager.showEntity(entityId, entityAssetName, bundleName, groupName, priority, userData);
    }

    // ---- 隐藏实体 ----

    hideEntity(entityId: number, userData?: object): void;
    hideEntity(entityLogic: EntityLogic, userData?: object): void;
    hideEntity(entityIdOrLogic: number | EntityLogic, userData?: object): void {
        if (typeof entityIdOrLogic === 'number') {
            this._manager.hideEntity(entityIdOrLogic, userData);
        } else {
            this._manager.hideEntity(entityIdOrLogic.entityId, userData);
        }
    }

    hideAllLoadedEntities(userData?: object): void { this._manager.hideAllLoadedEntities(userData); }
    hideAllLoadingEntities(userData?: object): void { this._manager.hideAllLoadingEntities(userData); }
    hideAllEntities(userData?: object): void { this._manager.hideAllEntities(userData); }

    // ---- 父子挂载 ----

    attachEntity(entityId: number, parentEntityId: number, userData?: object): void;
    attachEntity(entityLogic: EntityLogic, parentEntityLogic: EntityLogic, userData?: object): void;
    attachEntity(childArg: number | EntityLogic, parentArg: number | EntityLogic, userData?: object): void {
        const childId = typeof childArg === 'number' ? childArg : childArg.entityId;
        const parentId = typeof parentArg === 'number' ? parentArg : parentArg.entityId;
        this._manager.attachEntity(childId, parentId, userData);
    }

    detachEntity(entityId: number, userData?: object): void;
    detachEntity(entityLogic: EntityLogic, userData?: object): void;
    detachEntity(entityIdOrLogic: number | EntityLogic, userData?: object): void {
        const id = typeof entityIdOrLogic === 'number' ? entityIdOrLogic : entityIdOrLogic.entityId;
        this._manager.detachEntity(id, userData);
    }

    detachChildEntities(entityId: number, userData?: object): void;
    detachChildEntities(entityLogic: EntityLogic, userData?: object): void;
    detachChildEntities(entityIdOrLogic: number | EntityLogic, userData?: object): void {
        const id = typeof entityIdOrLogic === 'number' ? entityIdOrLogic : entityIdOrLogic.entityId;
        this._manager.detachChildEntities(id, userData);
    }

    // ---- 内部工具 ----

    private _toLogic(instance: object | null): EntityLogic | null {
        if (!instance) return null;
        return this._helper.getEntityLogic(instance) as EntityLogic | null;
    }
}
