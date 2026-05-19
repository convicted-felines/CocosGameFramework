import { _decorator, Component, Node } from 'cc';
import { IUIGroup } from '../../GameFramework/UI/IUIGroup';

const { ccclass } = _decorator;

// 业务 UI 继承此类，挂在 Prefab 根节点上
@ccclass('UIFormLogic')
export abstract class UIFormLogic extends Component {
    private _serialId: number = 0;
    private _uiFormAssetName: string = '';
    private _uiGroup: IUIGroup | null = null;
    private _depthInUIGroup: number = 0;
    private _pauseCoveredUIForm: boolean = false;
    private _available: boolean = false;
    private _isCovered: boolean = false;

    /** 底层节点句柄 */
    get handle(): Node { return this.node; }

    get serialId(): number { return this._serialId; }
    get uiFormAssetName(): string { return this._uiFormAssetName; }
    get uiGroup(): IUIGroup | null { return this._uiGroup; }
    get depthInUIGroup(): number { return this._depthInUIGroup; }
    get pauseCoveredUIForm(): boolean { return this._pauseCoveredUIForm; }
    get available(): boolean { return this._available; }
    get isCovered(): boolean { return this._isCovered; }

    /** 控制界面可见性（对应 Unity 版 Visible 属性） */
    get visible(): boolean { return this.node.active; }
    set visible(value: boolean) { this.node.active = value; }

    // ----------------------------------------------------------------
    // 由 DefaultUIFormHelper 调用的内部初始化方法
    // ----------------------------------------------------------------

    __init(
        serialId: number,
        assetName: string,
        uiGroup: IUIGroup,
        pauseCoveredUIForm: boolean,
        depthInUIGroup: number,
        isNewInstance: boolean
    ): void {
        this._serialId = serialId;
        this._uiFormAssetName = assetName;
        this._uiGroup = uiGroup;
        this._pauseCoveredUIForm = pauseCoveredUIForm;
        this._depthInUIGroup = depthInUIGroup;
        this._available = true;
        if (isNewInstance) {
            this.onInit();
        }
    }

    __setDepthInUIGroup(depthInUIGroup: number, uiGroupDepth: number): void {
        this._depthInUIGroup = depthInUIGroup;
        this.onDepthChanged(uiGroupDepth, depthInUIGroup);
    }

    __setCovered(covered: boolean): void {
        if (this._isCovered === covered) return;
        this._isCovered = covered;
        if (covered) {
            this.onCover();
        } else {
            this.onReveal();
        }
    }

    // ----------------------------------------------------------------
    // 生命周期钩子（子类重写）
    // ----------------------------------------------------------------

    /** 首次创建时调用（isNewInstance=true），从池中复用时不调用 */
    protected onInit(): void {}

    /** 打开时调用（包括从池中复用后的打开） */
    onOpen(_userData?: object): void {}

    /** 关闭时调用。isShutdown=true 表示整个框架正在关闭 */
    onClose(_isShutdown: boolean, _userData?: object): void {}

    /** 回收入池前调用（对应 Unity OnRecycle，用于重置状态） */
    onRecycle(): void {}

    /** 被其他界面覆盖，暂停时调用 */
    onPause(): void {}

    /** 从暂停中恢复时调用 */
    onResume(): void {}

    /** 被遮挡（在后面，仍可见）时调用 */
    onCover(): void {}

    /** 不再被遮挡时调用 */
    onReveal(): void {}

    /** refocus 后重新激活时调用 */
    onRefocus(_userData?: object): void {}

    /** 每帧驱动（未暂停时调用） */
    onUpdate(_elapseSeconds: number, _realElapseSeconds: number): void {}

    /** UIGroup 深度或本界面在组内深度发生变化时调用 */
    onDepthChanged(_uiGroupDepth: number, _depthInUIGroup: number): void {}
}
