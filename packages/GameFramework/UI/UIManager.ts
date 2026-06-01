import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { IUIManager } from './IUIManager';
import { IUIFormHelper } from './IUIFormHelper';
import { IUIGroup, IUIFormInfo } from './IUIGroup';
import { IResourceManager } from '../Resource/IResourceManager';

// ================================================================
// 池内空闲条目
// ================================================================

interface PoolEntry {
    instance: object;
    lastUseTime: number;  // ms
    locked: boolean;
    priority: number;
}

// ================================================================
// UIForm 内部数据（同时实现 IUIFormInfo）
// ================================================================

interface UIFormData extends IUIFormInfo {
    serialId: number;
    uiFormAssetName: string;
    bundleName: string;
    groupName: string;
    pauseCoveredUIForm: boolean;
    userData?: object;
    instance: object | null;
    isLoading: boolean;
    isOpen: boolean;
    isPaused: boolean;
    isCovered: boolean;
    isNewInstance: boolean;
    loadStartTime: number;
    get uiGroup(): IUIGroup;
    get uiFormInstance(): object | null;
}

// ================================================================
// UIGroup 内部数据（同时实现 IUIGroup）
// ================================================================

class UIGroupData implements IUIGroup {
    readonly name: string;
    depth: number;
    pause: boolean = false;
    readonly forms: UIFormData[] = [];

    constructor(name: string, depth: number) {
        this.name = name;
        this.depth = depth;
    }

    get uiFormCount(): number { return this.forms.length; }
    get currentUIForm(): IUIFormInfo | null {
        return this.forms.length > 0 ? this.forms[this.forms.length - 1] : null;
    }

    hasUIForm(serialId: number): boolean {
        return this.forms.some(f => f.serialId === serialId && f.isOpen);
    }

    hasUIFormByAsset(uiFormAssetName: string): boolean {
        return this.forms.some(f => f.uiFormAssetName === uiFormAssetName && f.isOpen);
    }

    getUIForm(serialId: number): IUIFormInfo | null {
        return this.forms.find(f => f.serialId === serialId && f.isOpen) ?? null;
    }

    getUIFormByAsset(uiFormAssetName: string): IUIFormInfo | null {
        return this.forms.find(f => f.uiFormAssetName === uiFormAssetName && f.isOpen) ?? null;
    }

    getUIForms(uiFormAssetName: string): IUIFormInfo[] {
        return this.forms.filter(f => f.uiFormAssetName === uiFormAssetName && f.isOpen);
    }

    getAllUIForms(): IUIFormInfo[] {
        return this.forms.filter(f => f.isOpen);
    }
}

// ================================================================
// UIManager
// ================================================================

export class UIManager extends GameFrameworkModule implements IUIManager {
    private _uiFormHelper: IUIFormHelper | null = null;
    private _resourceManager: IResourceManager | null = null;

    private _groups: Map<string, UIGroupData> = new Map();
    private _forms: Map<number, UIFormData> = new Map();
    private _serialId: number = 0;

    // 对象池：assetName → 空闲实例列表
    private _pool: Map<string, PoolEntry[]> = new Map();
    private _autoReleaseTimer: number = 0;

    // 池配置
    private _instanceCapacity: number = 16;
    private _instanceExpireTime: number = 60;
    private _instanceAutoReleaseInterval: number = 60;
    private _instancePriority: number = 0;

    private _cancelledIds: Set<number> = new Set();

    // 事件回调 — 由 UIComponent 绑定
    onOpenUIFormSuccess: ((serialId: number, uiFormAssetName: string, uiGroupName: string, pauseCoveredUIForm: boolean, duration: number, userData?: object) => void) | null = null;
    onOpenUIFormFailure: ((serialId: number, uiFormAssetName: string, uiGroupName: string, pauseCoveredUIForm: boolean, errorMessage: string, userData?: object) => void) | null = null;
    onCloseUIFormComplete: ((serialId: number, uiFormAssetName: string, uiGroupName: string, userData?: object) => void) | null = null;

    get priority(): number { return 50; }
    get uiGroupCount(): number { return this._groups.size; }
    get currentSerialId(): number { return this._serialId; }

    // ---- 配置 ----

    get instanceCapacity(): number { return this._instanceCapacity; }
    set instanceCapacity(v: number) { this._instanceCapacity = v; }

    get instanceExpireTime(): number { return this._instanceExpireTime; }
    set instanceExpireTime(v: number) { this._instanceExpireTime = v; }

    get instanceAutoReleaseInterval(): number { return this._instanceAutoReleaseInterval; }
    set instanceAutoReleaseInterval(v: number) { this._instanceAutoReleaseInterval = v; }

    get instancePriority(): number { return this._instancePriority; }
    set instancePriority(v: number) { this._instancePriority = v; }

    setHelper(helper: IUIFormHelper): void { this._uiFormHelper = helper; }
    setResourceManager(rm: IResourceManager): void { this._resourceManager = rm; }

    // ---- UIGroup ----

    addUIGroup(groupName: string, depth: number = 0): boolean {
        if (this._groups.has(groupName)) return false;
        this._groups.set(groupName, new UIGroupData(groupName, depth));
        return true;
    }

    hasUIGroup(groupName: string): boolean { return this._groups.has(groupName); }

    getUIGroup(groupName: string): IUIGroup | null { return this._groups.get(groupName) ?? null; }

    getAllUIGroups(): IUIGroup[] { return Array.from(this._groups.values()); }

    removeUIGroup(groupName: string): boolean {
        const group = this._groups.get(groupName);
        if (!group) return false;
        if (group.forms.length > 0) throw new GameFrameworkError(`UIGroup [${groupName}] still has open forms.`);
        return this._groups.delete(groupName);
    }

    // ---- Open ----

    openUIForm(
        uiFormAssetName: string,
        bundleName: string,
        groupName: string,
        pauseCoveredUIForm: boolean = false,
        userData?: object
    ): number {
        if (!this._uiFormHelper) throw new GameFrameworkError('UIFormHelper is not set.');
        if (!this._resourceManager) throw new GameFrameworkError('ResourceManager is not set.');
        if (!this._groups.has(groupName)) throw new GameFrameworkError(`UIGroup [${groupName}] not found.`);

        const serialId = ++this._serialId;
        const groupRef = () => this._groups.get(groupName)!;
        const data: UIFormData = {
            serialId,
            uiFormAssetName,
            bundleName,
            groupName,
            pauseCoveredUIForm,
            userData,
            instance: null,
            isLoading: true,
            isOpen: false,
            isPaused: false,
            isCovered: false,
            isNewInstance: true,
            loadStartTime: Date.now(),
            get uiGroup() { return groupRef(); },
            get uiFormInstance() { return data.instance; },
        };
        this._forms.set(serialId, data);

        const poolEntry = this._acquireFromPool(uiFormAssetName);
        if (poolEntry) {
            data.isLoading = false;
            data.isNewInstance = false;
            data.instance = poolEntry.instance;
            this._uiFormHelper.onReuseUIForm(poolEntry.instance);
            this._activateForm(data);
            return serialId;
        }

        this._resourceManager.loadAsset(
            bundleName, uiFormAssetName, Object as any,
            (asset: object) => this._onLoadSuccess(serialId, asset),
            (_name, msg) => this._onLoadFailure(serialId, uiFormAssetName, msg)
        );

        return serialId;
    }

    private _onLoadSuccess(serialId: number, asset: object): void {
        if (this._cancelledIds.has(serialId)) {
            this._cancelledIds.delete(serialId);
            return;
        }
        const data = this._forms.get(serialId);
        if (!data || !this._uiFormHelper) return;

        data.isLoading = false;
        data.instance = this._uiFormHelper.instantiateUIForm(asset);
        this._activateForm(data);
    }

    private _onLoadFailure(serialId: number, assetName: string, errorMsg: string): void {
        if (this._cancelledIds.has(serialId)) {
            this._cancelledIds.delete(serialId);
            return;
        }
        const data = this._forms.get(serialId);
        if (!data) return;
        console.error(`[UIManager] Open UI [${assetName}] failed: ${errorMsg}`);
        this.onOpenUIFormFailure?.(serialId, assetName, data.groupName, data.pauseCoveredUIForm, errorMsg, data.userData);
        this._forms.delete(serialId);
    }

    private _activateForm(data: UIFormData): void {
        const group = this._groups.get(data.groupName)!;
        const depthInUIGroup = group.forms.length;

        this._uiFormHelper!.createUIForm(data.instance!, group, data.userData);

        // 暂停 / 遮挡当前顶层
        if (group.forms.length > 0) {
            const prevTop = group.forms[group.forms.length - 1];
            if (!prevTop.isCovered) {
                prevTop.isCovered = true;
                if (prevTop.instance) this._uiFormHelper!.onCoverUIForm?.(prevTop.instance);
            }
            if (data.pauseCoveredUIForm && !prevTop.isPaused && prevTop.instance) {
                this._uiFormHelper!.onPauseUIForm(prevTop.instance);
                prevTop.isPaused = true;
            }
        }

        group.forms.push(data);
        data.isOpen = true;

        this._uiFormHelper!.onOpenUIForm(
            data.serialId, data.instance!, group,
            data.pauseCoveredUIForm, depthInUIGroup,
            data.isNewInstance, data.userData
        );

        const duration = (Date.now() - data.loadStartTime) / 1000;
        this.onOpenUIFormSuccess?.(
            data.serialId, data.uiFormAssetName, data.groupName,
            data.pauseCoveredUIForm, duration, data.userData
        );
    }

    // ---- Close ----

    closeUIForm(serialId: number, userData?: object): void {
        const data = this._forms.get(serialId);
        if (!data) return;
        if (data.isLoading) {
            this._cancelledIds.add(serialId);
            this._forms.delete(serialId);
            return;
        }
        if (!data.isOpen || !this._uiFormHelper) return;
        this._internalClose(data, false, userData);
    }

    closeUIFormByInstance(uiFormInstance: object, userData?: object): void {
        const data = Array.from(this._forms.values()).find(f => f.instance === uiFormInstance);
        if (!data || !data.isOpen || !this._uiFormHelper) return;
        this._internalClose(data, false, userData);
    }

    private _internalClose(data: UIFormData, isShutdown: boolean, userData?: object): void {
        const group = this._groups.get(data.groupName);
        if (group) {
            const idx = group.forms.indexOf(data);
            if (idx >= 0) {
                group.forms.splice(idx, 1);
                // 恢复被该 UI 暂停的界面
                if (data.pauseCoveredUIForm && group.forms.length > 0) {
                    const newTop = group.forms[group.forms.length - 1];
                    if (newTop.isPaused && newTop.instance) {
                        this._uiFormHelper!.onResumeUIForm(newTop.instance);
                        newTop.isPaused = false;
                    }
                }
                // 更新新顶层遮挡状态
                if (group.forms.length > 0) {
                    const newTop = group.forms[group.forms.length - 1];
                    if (newTop.isCovered) {
                        newTop.isCovered = false;
                        if (newTop.instance) this._uiFormHelper!.onRevealUIForm?.(newTop.instance);
                    }
                }
                // 通知剩余界面深度变化
                this._notifyGroupDepthChanged(group);
            }
        }

        this._uiFormHelper!.onCloseUIForm(data.instance!, isShutdown, userData);

        if (this._returnToPool(data.uiFormAssetName, data.instance!)) {
            this._uiFormHelper!.onRecycleUIForm(data.instance!);
        } else {
            this._uiFormHelper!.releaseUIForm(null!, data.instance!);
        }

        const { serialId, uiFormAssetName, groupName } = data;
        this._forms.delete(data.serialId);
        if (!isShutdown) {
            this.onCloseUIFormComplete?.(serialId, uiFormAssetName, groupName, userData);
        }
    }

    closeAllLoadedUIForms(userData?: object): void {
        const loaded = Array.from(this._forms.values()).filter(f => f.isOpen);
        for (const f of loaded) this._internalClose(f, false, userData);
    }

    closeAllLoadingUIForms(): void {
        const loading = Array.from(this._forms.values()).filter(f => f.isLoading);
        for (const f of loading) {
            this._cancelledIds.add(f.serialId);
            this._forms.delete(f.serialId);
        }
    }

    // ---- 深度变化通知 ----

    private _notifyGroupDepthChanged(group: UIGroupData): void {
        if (!this._uiFormHelper?.onDepthChangedUIForm) return;
        group.forms.forEach((f, i) => {
            if (f.instance) {
                this._uiFormHelper!.onDepthChangedUIForm!(f.instance, group.depth, i);
            }
        });
    }

    // ---- Query ----

    hasUIForm(serialId: number): boolean { return this._forms.has(serialId); }

    hasUIFormByAsset(uiFormAssetName: string): boolean {
        return Array.from(this._forms.values()).some(f => f.uiFormAssetName === uiFormAssetName);
    }

    getUIForm(serialId: number): object | null { return this._forms.get(serialId)?.instance ?? null; }

    getUIFormByAsset(uiFormAssetName: string): object | null {
        return Array.from(this._forms.values()).find(f => f.uiFormAssetName === uiFormAssetName && f.isOpen)?.instance ?? null;
    }

    getUIFormsByAsset(uiFormAssetName: string): object[] {
        return Array.from(this._forms.values())
            .filter(f => f.uiFormAssetName === uiFormAssetName && f.isOpen && f.instance)
            .map(f => f.instance!);
    }

    getAllLoadedUIForms(): object[] {
        return Array.from(this._forms.values())
            .filter(f => f.isOpen && f.instance)
            .map(f => f.instance!);
    }

    getAllLoadingUIFormSerialIds(): number[] {
        return Array.from(this._forms.values()).filter(f => f.isLoading).map(f => f.serialId);
    }

    isLoadingUIForm(serialId: number): boolean { return this._forms.get(serialId)?.isLoading ?? false; }

    isLoadingUIFormByAsset(uiFormAssetName: string): boolean {
        return Array.from(this._forms.values()).some(f => f.uiFormAssetName === uiFormAssetName && f.isLoading);
    }

    isValidUIForm(uiFormInstance: object): boolean {
        return Array.from(this._forms.values()).some(f => f.instance === uiFormInstance && f.isOpen);
    }

    // ---- Refocus ----

    refocusUIForm(uiFormInstance: object, userData?: object): void {
        if (!this._uiFormHelper) return;
        const data = Array.from(this._forms.values()).find(f => f.instance === uiFormInstance && f.isOpen);
        if (!data) return;

        const group = this._groups.get(data.groupName);
        if (!group) return;

        const idx = group.forms.indexOf(data);
        if (idx < 0 || idx === group.forms.length - 1) {
            // 已在顶层，只触发 refocus 回调
            this._uiFormHelper.onRefocusUIForm?.(uiFormInstance, userData);
            return;
        }

        const currentTop = group.forms[group.forms.length - 1];
        if (!currentTop.isCovered) {
            currentTop.isCovered = true;
            if (currentTop.instance) this._uiFormHelper.onCoverUIForm?.(currentTop.instance);
        }
        if (data.pauseCoveredUIForm && !currentTop.isPaused && currentTop.instance) {
            this._uiFormHelper.onPauseUIForm(currentTop.instance);
            currentTop.isPaused = true;
        }

        group.forms.splice(idx, 1);
        group.forms.push(data);

        if (data.isCovered) {
            data.isCovered = false;
            if (data.instance) this._uiFormHelper.onRevealUIForm?.(data.instance);
        }
        if (data.isPaused && data.instance) {
            this._uiFormHelper.onResumeUIForm(data.instance);
            data.isPaused = false;
        }

        this._notifyGroupDepthChanged(group);
        this._uiFormHelper.onRefocusUIForm?.(uiFormInstance, userData);
    }

    // ---- 池操作 ----

    setUIFormInstanceLocked(uiFormInstance: object, locked: boolean): void {
        this._pool.forEach(entries => {
            const e = entries.find(x => x.instance === uiFormInstance);
            if (e) e.locked = locked;
        });
    }

    setUIFormInstancePriority(uiFormInstance: object, priority: number): void {
        this._pool.forEach(entries => {
            const e = entries.find(x => x.instance === uiFormInstance);
            if (e) e.priority = priority;
        });
    }

    private _acquireFromPool(assetName: string): PoolEntry | null {
        const entries = this._pool.get(assetName);
        if (!entries || entries.length === 0) return null;
        let bestIdx = -1;
        let bestPriority = -Infinity;
        for (let i = 0; i < entries.length; i++) {
            if (!entries[i].locked && entries[i].priority >= bestPriority) {
                bestPriority = entries[i].priority;
                bestIdx = i;
            }
        }
        if (bestIdx < 0) return null;
        return entries.splice(bestIdx, 1)[0];
    }

    private _returnToPool(assetName: string, instance: object): boolean {
        let total = 0;
        this._pool.forEach(entries => { total += entries.length; });
        if (total >= this._instanceCapacity) return false;

        let entries = this._pool.get(assetName);
        if (!entries) { entries = []; this._pool.set(assetName, entries); }
        entries.push({ instance, lastUseTime: Date.now(), locked: false, priority: this._instancePriority });
        return true;
    }

    private _releaseExpiredPoolEntries(): void {
        if (this._instanceExpireTime <= 0 || !this._uiFormHelper) return;
        const now = Date.now();
        const expireMs = this._instanceExpireTime * 1000;
        this._pool.forEach(entries => {
            for (let i = entries.length - 1; i >= 0; i--) {
                const e = entries[i];
                if (!e.locked && (now - e.lastUseTime) >= expireMs) {
                    this._uiFormHelper!.releaseUIForm(null!, e.instance);
                    entries.splice(i, 1);
                }
            }
        });
    }

    // ---- Lifecycle ----

    update(elapseSeconds: number, realElapseSeconds: number): void {
        if (!this._uiFormHelper) return;

        this._forms.forEach(data => {
            if (data.isOpen && !data.isPaused && data.instance) {
                this._uiFormHelper!.onUpdateUIForm(data.instance, elapseSeconds, realElapseSeconds);
            }
        });

        this._autoReleaseTimer += elapseSeconds;
        if (this._autoReleaseTimer >= this._instanceAutoReleaseInterval) {
            this._autoReleaseTimer = 0;
            this._releaseExpiredPoolEntries();
        }
    }

    shutdown(): void {
        // 关闭所有已打开的界面（isShutdown=true）
        const loaded = Array.from(this._forms.values()).filter(f => f.isOpen);
        for (const f of loaded) this._internalClose(f, true, undefined);

        this.closeAllLoadingUIForms();

        // 销毁池内剩余实例
        if (this._uiFormHelper) {
            this._pool.forEach(entries => {
                entries.forEach(e => this._uiFormHelper!.releaseUIForm(null!, e.instance));
            });
        }

        this._pool.clear();
        this._groups.clear();
        this._cancelledIds.clear();
        this._uiFormHelper = null;
        this._resourceManager = null;
    }
}
