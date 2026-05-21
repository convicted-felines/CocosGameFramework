import { _decorator, Node, Enum } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { UIManager } from '../../GameFramework/UI/UIManager';
import { IUIGroup } from '../../GameFramework/UI/IUIGroup';
import {
    OpenUIFormSuccessEventArgs,
    OpenUIFormFailureEventArgs,
    CloseUIFormCompleteEventArgs,
} from '../../GameFramework/UI/UIEventArgs';
import { EventManager } from '../../GameFramework/Event/EventManager';
import { CocosResourceManager } from '../Resource/CocosResourceManager';
import { DefaultUIFormHelper } from './DefaultUIFormHelper';
import { UIFormLogic } from './UIFormLogic';
import { HelperRegistry } from '../Base/HelperRegistry';
import { UIFormHelperType } from './UIFormHelperType';

const { ccclass, property } = _decorator;

@ccclass('UIGroupConfig')
class UIGroupConfigData {
    @property({ tooltip: '分组名称' })
    name: string = 'Default';

    @property({ tooltip: '分组深度（值越大越靠前）' })
    depth: number = 0;
}

@ccclass('UIComponent')
export class UIComponent extends GameFrameworkComponent {
    @property({ type: Node, tooltip: 'UI 根节点' })
    uiRoot: Node | null = null;

    @property({ type: Enum(UIFormHelperType), tooltip: 'UI 界面辅助器类型' })
    uiFormHelperType: UIFormHelperType = UIFormHelperType.DefaultUIFormHelper;

    @property({ type: [UIGroupConfigData], tooltip: 'UI 分组列表' })
    uiGroups: UIGroupConfigData[] = [
        Object.assign(new UIGroupConfigData(), { name: 'Default', depth: 0 }),
        Object.assign(new UIGroupConfigData(), { name: 'Dialog',  depth: 1 }),
        Object.assign(new UIGroupConfigData(), { name: 'Tip',     depth: 2 }),
    ];

    @property({ tooltip: '实例对象池容量上限' })
    instanceCapacity: number = 16;

    @property({ tooltip: '实例过期时间（秒），超时未使用则从池中释放，0 表示永不过期' })
    instanceExpireTime: number = 60;

    @property({ tooltip: '自动释放检查间隔（秒）' })
    instanceAutoReleaseInterval: number = 60;

    @property({ tooltip: '实例入池时的默认优先级' })
    instancePriority: number = 0;

    private _manager!: UIManager;
    private _eventMgr: EventManager | null = null;

    get manager(): UIManager { return this._manager; }

    onLoad(): void {
        super.onLoad();
        this._manager = new UIManager();

        const helper = HelperRegistry.createHelper(this.node, UIFormHelperType[this.uiFormHelperType], DefaultUIFormHelper);
        if (helper instanceof DefaultUIFormHelper && this.uiRoot) {
            helper.setUIRoot(this.uiRoot);
        }
        this._manager.setHelper(helper);

        this._manager.instanceCapacity = this.instanceCapacity;
        this._manager.instanceExpireTime = this.instanceExpireTime;
        this._manager.instanceAutoReleaseInterval = this.instanceAutoReleaseInterval;
        this._manager.instancePriority = this.instancePriority;

        for (const group of this.uiGroups) {
            this._manager.addUIGroup(group.name, group.depth);
        }

        this._bindCallbacks();
        GameFrameworkEntry.registerModule(MODULE_ID.UI, this._manager);
    }

    start(): void {
        try {
            this._manager.setResourceManager(
                GameFrameworkEntry.getModule(CocosResourceManager, MODULE_ID.RESOURCE)
            );
        } catch {
            console.warn('[UIComponent] ResourceComponent not found.');
        }
        try {
            this._eventMgr = GameFrameworkEntry.getModule(EventManager, MODULE_ID.EVENT);
        } catch {
            // 未注册 EventComponent 时静默忽略
        }
    }

    private _bindCallbacks(): void {
        this._manager.onOpenUIFormSuccess = (serialId, uiFormAssetName, uiGroupName, pauseCoveredUIForm, duration, userData) => {
            this._eventMgr?.fire(this, OpenUIFormSuccessEventArgs.create(
                serialId, uiFormAssetName, uiGroupName, pauseCoveredUIForm, duration, userData
            ));
        };

        this._manager.onOpenUIFormFailure = (serialId, uiFormAssetName, uiGroupName, pauseCoveredUIForm, errorMessage, userData) => {
            console.warn(`[UIComponent] Open UI '${uiFormAssetName}' (serialId=${serialId}) failed: ${errorMessage}`);
            this._eventMgr?.fire(this, OpenUIFormFailureEventArgs.create(
                serialId, uiFormAssetName, uiGroupName, pauseCoveredUIForm, errorMessage, userData
            ));
        };

        this._manager.onCloseUIFormComplete = (serialId, uiFormAssetName, uiGroupName, userData) => {
            this._eventMgr?.fire(this, CloseUIFormCompleteEventArgs.create(
                serialId, uiFormAssetName, uiGroupName, userData
            ));
        };
    }

    // ---- UIGroup ----

    get uiGroupCount(): number { return this._manager.uiGroupCount; }

    hasUIGroup(groupName: string): boolean { return this._manager.hasUIGroup(groupName); }

    getUIGroup(groupName: string): IUIGroup | null { return this._manager.getUIGroup(groupName); }

    getAllUIGroups(): IUIGroup[] { return this._manager.getAllUIGroups(); }

    addUIGroup(groupName: string, depth: number = 0): boolean { return this._manager.addUIGroup(groupName, depth); }

    removeUIGroup(groupName: string): boolean { return this._manager.removeUIGroup(groupName); }

    // ---- Open ----

    openUIForm(
        uiFormAssetName: string,
        bundleName: string,
        groupName: string,
        pauseCoveredUIForm: boolean = false,
        userData?: object
    ): number {
        return this._manager.openUIForm(uiFormAssetName, bundleName, groupName, pauseCoveredUIForm, userData);
    }

    // ---- Close ----

    closeUIForm(serialId: number, userData?: object): void {
        this._manager.closeUIForm(serialId, userData);
    }

    closeUIFormByLogic(uiForm: UIFormLogic, userData?: object): void {
        this._manager.closeUIFormByInstance(uiForm, userData);
    }

    closeAllLoadedUIForms(userData?: object): void {
        this._manager.closeAllLoadedUIForms(userData);
    }

    closeAllLoadingUIForms(): void {
        this._manager.closeAllLoadingUIForms();
    }

    // ---- Query ----

    hasUIForm(serialId: number): boolean { return this._manager.hasUIForm(serialId); }

    hasUIFormByAsset(uiFormAssetName: string): boolean { return this._manager.hasUIFormByAsset(uiFormAssetName); }

    getUIForm(serialId: number): UIFormLogic | null {
        const inst = this._manager.getUIForm(serialId);
        return inst ? (inst as Node).getComponent(UIFormLogic) : null;
    }

    getUIFormByAsset(uiFormAssetName: string): UIFormLogic | null {
        const inst = this._manager.getUIFormByAsset(uiFormAssetName);
        return inst ? (inst as Node).getComponent(UIFormLogic) : null;
    }

    getUIFormsByAsset(uiFormAssetName: string): UIFormLogic[] {
        return this._manager.getUIFormsByAsset(uiFormAssetName)
            .map(inst => (inst as Node).getComponent(UIFormLogic))
            .filter((l): l is UIFormLogic => l !== null);
    }

    getAllLoadedUIForms(): UIFormLogic[] {
        return this._manager.getAllLoadedUIForms()
            .map(inst => (inst as Node).getComponent(UIFormLogic))
            .filter((l): l is UIFormLogic => l !== null);
    }

    getAllLoadingUIFormSerialIds(): number[] {
        return this._manager.getAllLoadingUIFormSerialIds();
    }

    isLoadingUIForm(serialId: number): boolean { return this._manager.isLoadingUIForm(serialId); }

    isLoadingUIFormByAsset(uiFormAssetName: string): boolean { return this._manager.isLoadingUIFormByAsset(uiFormAssetName); }

    isValidUIForm(uiForm: UIFormLogic): boolean { return this._manager.isValidUIForm(uiForm); }

    // ---- Refocus ----

    refocusUIForm(uiForm: UIFormLogic, userData?: object): void {
        this._manager.refocusUIForm(uiForm, userData);
    }

    // ---- 池实例控制 ----

    setUIFormInstanceLocked(uiForm: UIFormLogic, locked: boolean): void {
        this._manager.setUIFormInstanceLocked(uiForm, locked);
    }

    setUIFormInstancePriority(uiForm: UIFormLogic, priority: number): void {
        this._manager.setUIFormInstancePriority(uiForm, priority);
    }
}
