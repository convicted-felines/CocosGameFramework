import { _decorator, Component } from 'cc';
import { IEntityInfo } from '../../GameFramework/Entity/IEntityHelper';

const { ccclass } = _decorator;

@ccclass('EntityLogic')
export abstract class EntityLogic extends Component {
    private _entityId: number = -1;
    private _entityAssetName: string = '';
    private _entityGroupName: string = '';
    private _userData: object | undefined;
    private _parentEntity: EntityLogic | null = null;
    private _childEntities: EntityLogic[] = [];

    get entityId(): number { return this._entityId; }
    get entityAssetName(): string { return this._entityAssetName; }
    get entityGroupName(): string { return this._entityGroupName; }
    get parentEntity(): EntityLogic | null { return this._parentEntity; }
    get childEntities(): readonly EntityLogic[] { return this._childEntities; }

    // ---- 框架内部调用（__前缀表示由 Helper 驱动，业务代码不应直接调用） ----

    __init(info: IEntityInfo): void {
        this._entityId = info.entityId;
        this._entityAssetName = info.entityAssetName;
        this._entityGroupName = info.entityGroupName;
        this._userData = info.userData;
        this.onInit(info.userData);
    }

    /** 对象池复用时更新标识，不触发 onInit（实体已初始化过） */
    __reinit(info: IEntityInfo): void {
        this._entityId = info.entityId;
        this._entityAssetName = info.entityAssetName;
        this._entityGroupName = info.entityGroupName;
        this._userData = info.userData;
        this._parentEntity = null;
        this._childEntities = [];
    }

    __onAttachTo(parentEntity: EntityLogic, userData?: object): void {
        this._parentEntity = parentEntity;
        this.onAttachTo(parentEntity, userData);
    }

    __onDetachFrom(parentEntity: EntityLogic | null, userData?: object): void {
        this._parentEntity = null;
        this.onDetachFrom(parentEntity, userData);
    }

    __onChildAttached(childEntity: EntityLogic, userData?: object): void {
        if (this._childEntities.indexOf(childEntity) < 0) {
            this._childEntities.push(childEntity);
        }
        this.onChildAttached(childEntity, userData);
    }

    __onChildDetached(childEntity: EntityLogic, userData?: object): void {
        const idx = this._childEntities.indexOf(childEntity);
        if (idx >= 0) this._childEntities.splice(idx, 1);
        this.onChildDetached(childEntity, userData);
    }

    // ---- 生命周期钩子（子类重写） ----

    protected onInit(_userData?: object): void {}
    onShow(_userData?: object): void {}
    onHide(_isShutdown: boolean, _userData?: object): void {}
    protected onAttachTo(_parentEntity: EntityLogic, _userData?: object): void {}
    protected onDetachFrom(_parentEntity: EntityLogic | null, _userData?: object): void {}
    protected onChildAttached(_childEntity: EntityLogic, _userData?: object): void {}
    protected onChildDetached(_childEntity: EntityLogic, _userData?: object): void {}
    onUpdate(_elapseSeconds: number, _realElapseSeconds: number): void {}
}
