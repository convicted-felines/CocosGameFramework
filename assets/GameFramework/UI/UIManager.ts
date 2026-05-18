import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { IUIManager } from './IUIManager';
import { IUIFormHelper } from './IUIFormHelper';
import { IUIGroup, IUIFormInfo } from './IUIGroup';
import { IResourceManager } from '../Resource/IResourceManager';

interface UIGroupData {
    name: string;
    depth: number;
    pause: boolean;
    forms: UIFormData[];
}

interface UIFormData {
    serialId: number;
    assetName: string;
    bundleName: string;
    groupName: string;
    pauseCoveredUIForm: boolean;
    userData?: object;
    instance: object | null;
    isLoading: boolean;
    isOpen: boolean;
    isPaused: boolean;
}

export class UIManager extends GameFrameworkModule implements IUIManager {
    private _uiFormHelper: IUIFormHelper | null = null;
    private _resourceManager: IResourceManager | null = null;
    private _groups: Map<string, UIGroupData> = new Map();
    private _forms: Map<number, UIFormData> = new Map();
    private _serialId: number = 0;

    get priority(): number { return 50; }
    get uiGroupCount(): number { return this._groups.size; }
    get currentSerialId(): number { return this._serialId; }

    setHelper(helper: IUIFormHelper): void {
        this._uiFormHelper = helper;
    }

    setResourceManager(resourceManager: IResourceManager): void {
        this._resourceManager = resourceManager;
    }

    addUIGroup(groupName: string, depth: number = 0): boolean {
        if (this._groups.has(groupName)) return false;
        this._groups.set(groupName, { name: groupName, depth, pause: false, forms: [] });
        return true;
    }

    hasUIGroup(groupName: string): boolean { return this._groups.has(groupName); }

    removeUIGroup(groupName: string): boolean {
        const group = this._groups.get(groupName);
        if (!group) return false;
        if (group.forms.length > 0) {
            throw new GameFrameworkError(`UIGroup [${groupName}] still has open forms.`);
        }
        return this._groups.delete(groupName);
    }

    openUIForm(
        uiFormAssetName: string,
        bundleName: string,
        groupName: string,
        pauseCoveredUIForm: boolean = false,
        userData?: object
    ): number {
        if (!this._uiFormHelper) {
            throw new GameFrameworkError('UIFormHelper is not set.');
        }
        if (!this._resourceManager) {
            throw new GameFrameworkError('ResourceManager is not set.');
        }
        if (!this._groups.has(groupName)) {
            throw new GameFrameworkError(`UIGroup [${groupName}] not found.`);
        }

        const serialId = ++this._serialId;
        const formData: UIFormData = {
            serialId,
            assetName: uiFormAssetName,
            bundleName,
            groupName,
            pauseCoveredUIForm,
            userData,
            instance: null,
            isLoading: true,
            isOpen: false,
            isPaused: false,
        };
        this._forms.set(serialId, formData);

        this._resourceManager.loadAsset(
            bundleName,
            uiFormAssetName,
            Object as any,
            (asset: object) => this._onLoadSuccess(serialId, asset),
            (name, msg) => this._onLoadFailure(serialId, name, msg)
        );

        return serialId;
    }

    private _onLoadSuccess(serialId: number, asset: object): void {
        const formData = this._forms.get(serialId);
        if (!formData || !this._uiFormHelper) return;
        formData.isLoading = false;

        const instance = this._uiFormHelper.instantiateUIForm(asset);
        formData.instance = instance;

        const group = this._groups.get(formData.groupName)!;
        this._uiFormHelper.createUIForm(instance, group as unknown as IUIGroup, formData.userData);

        if (formData.pauseCoveredUIForm && group.forms.length > 0) {
            const topForm = group.forms[group.forms.length - 1];
            if (topForm.instance) {
                this._uiFormHelper.onPauseUIForm(topForm.instance);
                topForm.isPaused = true;
            }
        }

        group.forms.push(formData);
        formData.isOpen = true;
        this._uiFormHelper.onOpenUIForm(serialId, instance, formData.userData);
    }

    private _onLoadFailure(serialId: number, assetName: string, errorMsg: string): void {
        const formData = this._forms.get(serialId);
        if (!formData) return;
        console.error(`[UIManager] Open UI [${assetName}] failed: ${errorMsg}`);
        this._forms.delete(serialId);
    }

    closeUIForm(serialId: number, userData?: object): void {
        const formData = this._forms.get(serialId);
        if (!formData || !formData.isOpen || !this._uiFormHelper) return;

        const group = this._groups.get(formData.groupName);
        if (group) {
            const idx = group.forms.indexOf(formData);
            if (idx >= 0) {
                group.forms.splice(idx, 1);
                // 恢复被覆盖的 UIForm
                if (formData.pauseCoveredUIForm && group.forms.length > 0) {
                    const topForm = group.forms[group.forms.length - 1];
                    if (topForm.isPaused && topForm.instance) {
                        this._uiFormHelper.onResumeUIForm(topForm.instance);
                        topForm.isPaused = false;
                    }
                }
            }
        }

        this._uiFormHelper.onCloseUIForm(formData.instance!, userData);
        this._uiFormHelper.releaseUIForm(null!, formData.instance!);
        this._forms.delete(serialId);
    }

    closeAllUIForms(userData?: object): void {
        const ids = Array.from(this._forms.keys());
        for (const id of ids) {
            this.closeUIForm(id, userData);
        }
    }

    hasUIForm(serialId: number): boolean { return this._forms.has(serialId); }

    hasUIFormByAsset(uiFormAssetName: string): boolean {
        return Array.from(this._forms.values()).some(f => f.assetName === uiFormAssetName);
    }

    isLoadingUIForm(serialId: number): boolean {
        return this._forms.get(serialId)?.isLoading ?? false;
    }

    isValidUIForm(serialId: number): boolean {
        const f = this._forms.get(serialId);
        return !!f && !f.isLoading && f.isOpen;
    }

    update(elapseSeconds: number, realElapseSeconds: number): void {
        if (!this._uiFormHelper) return;
        this._forms.forEach(formData => {
            if (formData.isOpen && !formData.isPaused && formData.instance) {
                this._uiFormHelper!.onUpdateUIForm(formData.instance, elapseSeconds, realElapseSeconds);
            }
        });
    }

    shutdown(): void {
        this.closeAllUIForms();
        this._groups.clear();
        this._uiFormHelper = null;
        this._resourceManager = null;
    }
}
