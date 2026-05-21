import { _decorator, Enum } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { EventManager } from '../../GameFramework/Event/EventManager';
import { IDownloadInfo, IDownloadParams } from '../../GameFramework/Download/IDownloadManager';
import {
    DownloadStartEventArgs,
    DownloadUpdateEventArgs,
    DownloadSuccessEventArgs,
    DownloadFailureEventArgs,
} from '../../GameFramework/Download/DownloadEventArgs';
import { CocosDownloadManager } from './CocosDownloadManager';
import { DownloadAgentHelperType } from './DownloadAgentHelperType';
import { DefaultDownloadAgentHelper } from './DefaultDownloadAgentHelper';

const { ccclass, property } = _decorator;

// 确保 DefaultDownloadAgentHelper 已向 HelperRegistry 完成注册
void DefaultDownloadAgentHelper;

@ccclass('DownloadComponent')
export class DownloadComponent extends GameFrameworkComponent {
    @property({ type: Enum(DownloadAgentHelperType), tooltip: '下载代理辅助器类型' })
    downloadAgentHelperType: DownloadAgentHelperType = DownloadAgentHelperType.DefaultDownloadAgentHelper;

    @property({ tooltip: '下载代理数量（并发上限）', min: 1 })
    downloadAgentHelperCount: number = 3;

    @property({ tooltip: '下载超时时长（秒）' })
    timeout: number = 30;

    @property({ tooltip: '分块落盘阈值（字节），0 = 下载完成后一次性写入' })
    flushSize: number = 0;

    private _manager!: CocosDownloadManager;

    get manager(): CocosDownloadManager { return this._manager; }

    // ---- 生命周期 ----

    protected override onLoad(): void {
        super.onLoad();
        this._manager = new CocosDownloadManager();
        this._manager.timeout = this.timeout;
        this._manager.flushSize = this.flushSize;

        const helperTypeName = DownloadAgentHelperType[this.downloadAgentHelperType];
        this._manager.createAndAddHelpers(this.node, helperTypeName, this.downloadAgentHelperCount);

        GameFrameworkEntry.registerModule(MODULE_ID.DOWNLOAD, this._manager);
    }

    start(): void {
        try {
            const eventMgr = GameFrameworkEntry.getModule(EventManager, MODULE_ID.EVENT);
            this._manager.setEventManager(eventMgr);
        } catch {
            // EventComponent 未挂载时静默忽略，回调仍可用
        }
    }

    // ---- 代理统计属性 ----

    get paused(): boolean { return this._manager.paused; }
    set paused(value: boolean) { this._manager.paused = value; }

    get totalAgentCount(): number { return this._manager.totalAgentCount; }
    get freeAgentCount(): number { return this._manager.freeAgentCount; }
    get workingAgentCount(): number { return this._manager.workingAgentCount; }
    get waitingTaskCount(): number { return this._manager.waitingTaskCount; }
    get currentSpeed(): number { return this._manager.currentSpeed; }

    // ---- 下载操作 ----

    addDownload(downloadPath: string, downloadUri: string, params?: IDownloadParams): number {
        return this._manager.addDownload(downloadPath, downloadUri, params);
    }

    removeDownload(serialId: number): boolean {
        return this._manager.removeDownload(serialId);
    }

    removeDownloads(tag: string): number {
        return this._manager.removeDownloads(tag);
    }

    removeAllDownloads(): void {
        this._manager.removeAllDownloads();
    }

    // ---- 任务查询 ----

    getDownloadInfo(serialId: number): IDownloadInfo | null {
        return this._manager.getDownloadInfo(serialId);
    }

    getDownloadInfosByTag(tag: string): IDownloadInfo[] {
        return this._manager.getDownloadInfosByTag(tag);
    }

    getAllDownloadInfos(): IDownloadInfo[] {
        return this._manager.getAllDownloadInfos();
    }

    // ---- 事件 ID 快捷访问 ----

    static readonly EventDownloadStart   = DownloadStartEventArgs.eventId;
    static readonly EventDownloadUpdate  = DownloadUpdateEventArgs.eventId;
    static readonly EventDownloadSuccess = DownloadSuccessEventArgs.eventId;
    static readonly EventDownloadFailure = DownloadFailureEventArgs.eventId;
}
