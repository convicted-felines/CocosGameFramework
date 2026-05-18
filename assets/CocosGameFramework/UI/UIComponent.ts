import { _decorator, Component, Node } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { UIManager } from '../../GameFramework/UI/UIManager';
import { CocosResourceManager } from '../Resource/CocosResourceManager';
import { DefaultUIFormHelper } from './DefaultUIFormHelper';

const { ccclass, property } = _decorator;

/** UI 分组配置 */
interface UIGroupConfig {
    name: string;
    depth: number;
}

@ccclass('UIGroupConfig')
class UIGroupConfigData {
    @property({ tooltip: '分组名称' })
    name: string = 'Default';

    @property({ tooltip: '分组深度（值越大越靠前）' })
    depth: number = 0;
}

@ccclass('UIComponent')
export class UIComponent extends Component {
    /** UI 根节点（所有 UIForm 挂载于此） */
    @property({ type: Node, tooltip: 'UI 根节点' })
    uiRoot: Node | null = null;

    /** UI 分组列表（在 Inspector 中配置名称和深度） */
    @property({ type: UIGroupConfigData, tooltip: 'UI 分组列表' })
    uiGroups: UIGroupConfigData[] = [
        Object.assign(new UIGroupConfigData(), { name: 'Default', depth: 0 }),
        Object.assign(new UIGroupConfigData(), { name: 'Dialog',  depth: 1 }),
        Object.assign(new UIGroupConfigData(), { name: 'Tip',     depth: 2 }),
    ];

    private _manager!: UIManager;

    get manager(): UIManager { return this._manager; }

    onLoad(): void {
        this._manager = new UIManager();

        const resourceMgr = GameFrameworkEntry.getModule(CocosResourceManager, MODULE_ID.RESOURCE);
        this._manager.setResourceManager(resourceMgr);

        if (this.uiRoot) {
            this._manager.setHelper(new DefaultUIFormHelper(this.uiRoot));
        }

        for (const group of this.uiGroups) {
            this._manager.addUIGroup(group.name, group.depth);
        }

        GameFrameworkEntry.registerModule(MODULE_ID.UI, this._manager);
    }

    get uiGroupCount(): number { return this._manager.uiGroupCount; }

    openUIForm(
        uiFormAssetName: string,
        bundleName: string,
        groupName: string,
        pauseCoveredUIForm?: boolean,
        userData?: object
    ): number {
        return this._manager.openUIForm(uiFormAssetName, bundleName, groupName, pauseCoveredUIForm, userData);
    }

    closeUIForm(serialId: number, userData?: object): void {
        this._manager.closeUIForm(serialId, userData);
    }

    closeAllUIForms(userData?: object): void {
        this._manager.closeAllUIForms(userData);
    }

    hasUIForm(serialId: number): boolean { return this._manager.hasUIForm(serialId); }
    hasUIFormByAsset(uiFormAssetName: string): boolean { return this._manager.hasUIFormByAsset(uiFormAssetName); }
    isLoadingUIForm(serialId: number): boolean { return this._manager.isLoadingUIForm(serialId); }
    isValidUIForm(serialId: number): boolean { return this._manager.isValidUIForm(serialId); }

    addUIGroup(groupName: string, depth?: number): boolean { return this._manager.addUIGroup(groupName, depth); }
    hasUIGroup(groupName: string): boolean { return this._manager.hasUIGroup(groupName); }
    removeUIGroup(groupName: string): boolean { return this._manager.removeUIGroup(groupName); }
}
