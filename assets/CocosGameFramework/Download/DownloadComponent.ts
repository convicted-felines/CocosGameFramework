import { _decorator } from 'cc';
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

const { ccclass, property } = _decorator;

@ccclass('DownloadComponent')
export class DownloadComponent extends GameFrameworkComponent {
    @property({ tooltip: '最大并发下载数' })
    maxConcurrent: number = 3;

    @property({ tooltip: '下载超时时长（秒）' })
    timeout: number = 30;

    private _manager!: CocosDownloadManager;
    private _eventMgr: EventManager | null = null;

    get manager(): CocosDownloadManager { return this._manager; }

    // ---- 生命周期 ----

    onLoad(): void {
        super.onLoad();
        this._manager = new CocosDownloadManager();
        this._manager.maxConcurrent = this.maxConcurrent;
        this._manager.timeout = this.timeout;
        GameFrameworkEntry.registerModule(MODULE_ID.DOWNLOAD, this._manager);
    }

    start(): void {
        try {
            this._eventMgr = GameFrameworkEntry.getModule(EventManager, MODULE_ID.EVENT);
            this._manager.setEventManager(this._eventMgr);
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
