import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

// 业务 UI 继承此类，挂在 Prefab 根节点上
@ccclass('UIFormLogic')
export abstract class UIFormLogic extends Component {
    private _serialId: number = 0;
    private _uiFormAssetName: string = '';

    get serialId(): number { return this._serialId; }
    get uiFormAssetName(): string { return this._uiFormAssetName; }

    // 由 DefaultUIFormHelper 调用
    __init(serialId: number, assetName: string): void {
        this._serialId = serialId;
        this._uiFormAssetName = assetName;
        this.onInit();
    }

    // 生命周期钩子（子类重写）
    protected onInit(): void {}
    onOpen(userData?: object): void {}
    onClose(userData?: object): void {}
    onPause(): void {}
    onResume(): void {}
    onUpdate(elapseSeconds: number, realElapseSeconds: number): void {}
}
