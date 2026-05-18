import { _decorator, Component } from 'cc';
import { IEntityInfo } from '../../GameFramework/Entity/IEntityHelper';

const { ccclass } = _decorator;

// 挂在实体 Prefab 上的 Component，框架通过它驱动实体生命周期
@ccclass('EntityLogic')
export abstract class EntityLogic extends Component {
    private _entityId: number = -1;
    private _entityAssetName: string = '';
    private _entityGroupName: string = '';
    private _userData: object | undefined;

    get entityId(): number { return this._entityId; }
    get entityAssetName(): string { return this._entityAssetName; }
    get entityGroupName(): string { return this._entityGroupName; }

    // 由 DefaultEntityHelper 调用
    __init(info: IEntityInfo): void {
        this._entityId = info.entityId;
        this._entityAssetName = info.entityAssetName;
        this._entityGroupName = info.entityGroupName;
        this._userData = info.userData;
        this.onInit(info.userData);
    }

    protected onInit(userData?: object): void {}
    onShow(userData?: object): void {}
    onHide(isShutdown: boolean, userData?: object): void {}
    onAttachTo(parentEntity: EntityLogic, parentTransform: object, userData?: object): void {}
    onDetachFrom(parentEntity: EntityLogic, userData?: object): void {}
    onUpdate(elapseSeconds: number, realElapseSeconds: number): void {}
}
