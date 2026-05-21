import { _decorator } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { EventManager } from '../../GameFramework/Event/EventManager';
import { IWebRequestInfo, IWebRequestParams } from '../../GameFramework/WebRequest/IWebRequestManager';
import {
    WebRequestStartEventArgs,
    WebRequestSuccessEventArgs,
    WebRequestFailureEventArgs,
} from '../../GameFramework/WebRequest/WebRequestEventArgs';
import { CocosWebRequestManager } from './CocosWebRequestManager';

const { ccclass, property } = _decorator;

@ccclass('WebRequestComponent')
export class WebRequestComponent extends GameFrameworkComponent {
    @property({ tooltip: '最大并发请求数' })
    maxConcurrent: number = 1;

    @property({ tooltip: '请求超时时长（秒）' })
    timeout: number = 30;

    private _manager!: CocosWebRequestManager;

    get manager(): CocosWebRequestManager { return this._manager; }

    // ---- 生命周期 ----

    protected override onLoad(): void {
        super.onLoad();
        this._manager = new CocosWebRequestManager();
        this._manager.maxConcurrent = this.maxConcurrent;
        this._manager.timeout = this.timeout;
        GameFrameworkEntry.registerModule(MODULE_ID.WEBREQUEST, this._manager);
    }

    start(): void {
        try {
            const eventMgr = GameFrameworkEntry.getModule(EventManager, MODULE_ID.EVENT);
            this._manager.setEventManager(eventMgr);
        } catch {
            // EventComponent 未挂载时静默忽略
        }
    }

    // ---- 代理统计属性 ----

    get totalAgentCount(): number { return this._manager.totalAgentCount; }
    get freeAgentCount(): number { return this._manager.freeAgentCount; }
    get workingAgentCount(): number { return this._manager.workingAgentCount; }
    get waitingTaskCount(): number { return this._manager.waitingTaskCount; }

    // ---- 请求操作 ----

    addWebRequest(webRequestUri: string, params?: IWebRequestParams): number {
        return this._manager.addWebRequest(webRequestUri, params);
    }

    removeWebRequest(serialId: number): boolean {
        return this._manager.removeWebRequest(serialId);
    }

    removeWebRequests(tag: string): number {
        return this._manager.removeWebRequests(tag);
    }

    removeAllWebRequests(): number {
        return this._manager.removeAllWebRequests();
    }

    // ---- 任务查询 ----

    getWebRequestInfo(serialId: number): IWebRequestInfo | null {
        return this._manager.getWebRequestInfo(serialId);
    }

    getWebRequestInfosByTag(tag: string): IWebRequestInfo[] {
        return this._manager.getWebRequestInfosByTag(tag);
    }

    getAllWebRequestInfos(): IWebRequestInfo[] {
        return this._manager.getAllWebRequestInfos();
    }

    // ---- 事件 ID 快捷访问 ----

    static readonly EventWebRequestStart   = WebRequestStartEventArgs.eventId;
    static readonly EventWebRequestSuccess = WebRequestSuccessEventArgs.eventId;
    static readonly EventWebRequestFailure = WebRequestFailureEventArgs.eventId;
}
