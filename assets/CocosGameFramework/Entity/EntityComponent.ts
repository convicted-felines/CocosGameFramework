import { _decorator, Component, Node } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { EntityManager } from '../../GameFramework/Entity/EntityManager';
import { CocosResourceManager } from '../Resource/CocosResourceManager';
import { DefaultEntityHelper } from './DefaultEntityHelper';

const { ccclass, property } = _decorator;

@ccclass('EntityComponent')
export class EntityComponent extends Component {
    /** 实体根节点（所有实体节点挂载于此） */
    @property({ type: Node, tooltip: '实体根节点' })
    entityRoot: Node | null = null;

    /** 默认实体分组名称列表 */
    @property({ tooltip: '默认实体分组名称列表（逗号分隔）' })
    entityGroups: string = 'Default';

    private _manager!: EntityManager;

    get manager(): EntityManager { return this._manager; }

    onLoad(): void {
        this._manager = new EntityManager();

        const resourceMgr = GameFrameworkEntry.getModule(CocosResourceManager, MODULE_ID.RESOURCE);
        this._manager.setResourceManager(resourceMgr);

        if (this.entityRoot) {
            this._manager.setHelper(new DefaultEntityHelper(this.entityRoot));
        }

        for (const groupName of this.entityGroups.split(',').map(s => s.trim()).filter(Boolean)) {
            this._manager.addEntityGroup(groupName);
        }

        GameFrameworkEntry.registerModule(MODULE_ID.ENTITY, this._manager);
    }

    get entityCount(): number { return this._manager.entityCount; }
    get entityGroupCount(): number { return this._manager.entityGroupCount; }

    showEntity(
        entityId: number,
        entityAssetName: string,
        bundleName: string,
        groupName: string,
        priority?: number,
        userData?: object
    ): void {
        this._manager.showEntity(entityId, entityAssetName, bundleName, groupName, priority, userData);
    }

    hideEntity(entityId: number, userData?: object): void {
        this._manager.hideEntity(entityId, userData);
    }

    hideAllEntities(userData?: object): void {
        this._manager.hideAllEntities(userData);
    }

    attachEntity(entityId: number, parentEntityId: number, userData?: object): void {
        this._manager.attachEntity(entityId, parentEntityId, userData);
    }

    detachEntity(entityId: number, userData?: object): void {
        this._manager.detachEntity(entityId, userData);
    }

    detachChildEntities(parentEntityId: number, userData?: object): void {
        this._manager.detachChildEntities(parentEntityId, userData);
    }

    hasEntity(entityId: number): boolean { return this._manager.hasEntity(entityId); }
    isLoadingEntity(entityId: number): boolean { return this._manager.isLoadingEntity(entityId); }

    addEntityGroup(groupName: string): boolean { return this._manager.addEntityGroup(groupName); }
    hasEntityGroup(groupName: string): boolean { return this._manager.hasEntityGroup(groupName); }
}
