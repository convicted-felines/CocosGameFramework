import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { IEventManager } from '../Event/IEventManager';
import { IWebRequestManager, IWebRequestInfo, IWebRequestParams } from './IWebRequestManager';
import {
    WebRequestStartEventArgs,
    WebRequestSuccessEventArgs,
    WebRequestFailureEventArgs,
} from './WebRequestEventArgs';

export const enum WebRequestTaskStatus {
    Todo,
    Doing,
    Done,
    Error,
}

export class WebRequestTask implements IWebRequestInfo {
    private static _serial: number = 0;

    readonly serialId: number;
    readonly webRequestUri: string;
    readonly postData: ArrayBuffer | string | null;
    readonly headers: Record<string, string>;
    readonly tag: string;
    readonly priority: number;
    readonly userData?: object;

    status: WebRequestTaskStatus = WebRequestTaskStatus.Todo;

    constructor(
        webRequestUri: string,
        postData: ArrayBuffer | string | null,
        headers: Record<string, string>,
        tag: string,
        priority: number,
        userData?: object,
    ) {
        this.serialId = ++WebRequestTask._serial;
        this.webRequestUri = webRequestUri;
        this.postData = postData;
        this.headers = headers;
        this.tag = tag;
        this.priority = priority;
        this.userData = userData;
    }
}

export abstract class WebRequestManager extends GameFrameworkModule implements IWebRequestManager {
    protected _eventManager: IEventManager | null = null;

    private _waitingTasks: WebRequestTask[] = [];
    private _workingTasks: Map<number, WebRequestTask> = new Map();

    private _timeout: number = 30;
    private _maxConcurrent: number = 1;

    get priority(): number { return 24; }

    get timeout(): number { return this._timeout; }
    set timeout(value: number) { this._timeout = value > 0 ? value : 30; }

    get maxConcurrent(): number { return this._maxConcurrent; }
    set maxConcurrent(value: number) { this._maxConcurrent = value > 0 ? value : 1; }

    get totalAgentCount(): number { return this._maxConcurrent; }
    get freeAgentCount(): number { return Math.max(0, this._maxConcurrent - this._workingTasks.size); }
    get workingAgentCount(): number { return this._workingTasks.size; }
    get waitingTaskCount(): number { return this._waitingTasks.length; }

    setEventManager(eventManager: IEventManager): void {
        this._eventManager = eventManager;
    }

    addWebRequest(webRequestUri: string, params: IWebRequestParams = {}): number {
        if (!webRequestUri) throw new Error('webRequestUri is invalid.');

        const task = new WebRequestTask(
            webRequestUri,
            params.postData ?? null,
            params.headers ?? {},
            params.tag ?? '',
            params.priority ?? 0,
            params.userData,
        );

        this._enqueue(task);
        this._scheduleNext();
        return task.serialId;
    }

    removeWebRequest(serialId: number): boolean {
        const waitingIdx = this._waitingTasks.findIndex(t => t.serialId === serialId);
        if (waitingIdx >= 0) {
            this._waitingTasks.splice(waitingIdx, 1);
            return true;
        }
        if (this._workingTasks.has(serialId)) {
            this._doCancelWebRequest(serialId);
            this._workingTasks.delete(serialId);
            return true;
        }
        return false;
    }

    removeWebRequests(tag: string): number {
        let count = 0;
        this._waitingTasks = this._waitingTasks.filter(t => {
            if (t.tag === tag) { count++; return false; }
            return true;
        });
        this._workingTasks.forEach((task, id) => {
            if (task.tag === tag) {
                this._doCancelWebRequest(id);
                this._workingTasks.delete(id);
                count++;
            }
        });
        return count;
    }

    removeAllWebRequests(): number {
        const count = this._waitingTasks.length + this._workingTasks.size;
        this._waitingTasks = [];
        this._workingTasks.forEach((_, id) => this._doCancelWebRequest(id));
        this._workingTasks.clear();
        return count;
    }

    getWebRequestInfo(serialId: number): IWebRequestInfo | null {
        const working = this._workingTasks.get(serialId);
        if (working) return working;
        return this._waitingTasks.find(t => t.serialId === serialId) ?? null;
    }

    getWebRequestInfosByTag(tag: string): IWebRequestInfo[] {
        const result: IWebRequestInfo[] = [];
        this._waitingTasks.forEach(t => { if (t.tag === tag) result.push(t); });
        this._workingTasks.forEach(t => { if (t.tag === tag) result.push(t); });
        return result;
    }

    getAllWebRequestInfos(): IWebRequestInfo[] {
        const result: IWebRequestInfo[] = [...this._waitingTasks];
        this._workingTasks.forEach(t => result.push(t));
        return result;
    }

    update(_elapseSeconds: number, _realElapseSeconds: number): void {
        this._scheduleNext();
    }

    shutdown(): void {
        this.removeAllWebRequests();
    }

    // ── called by concrete implementations ──────────────────────────────────

    protected _onWebRequestStart(serialId: number): void {
        const task = this._workingTasks.get(serialId);
        if (!task) return;
        task.status = WebRequestTaskStatus.Doing;
        if (this._eventManager) {
            this._eventManager.fire(this, WebRequestStartEventArgs.create(
                task.serialId, task.webRequestUri, task.userData,
            ));
        }
    }

    protected _onWebRequestSuccess(serialId: number, responseData: ArrayBuffer): void {
        const task = this._workingTasks.get(serialId);
        if (!task) return;
        task.status = WebRequestTaskStatus.Done;
        this._workingTasks.delete(serialId);
        if (this._eventManager) {
            this._eventManager.fire(this, WebRequestSuccessEventArgs.create(
                task.serialId, task.webRequestUri, responseData, task.userData,
            ));
        }
        this._scheduleNext();
    }

    protected _onWebRequestFailure(serialId: number, errorMessage: string): void {
        const task = this._workingTasks.get(serialId);
        if (!task) return;
        task.status = WebRequestTaskStatus.Error;
        this._workingTasks.delete(serialId);
        if (this._eventManager) {
            this._eventManager.fire(this, WebRequestFailureEventArgs.create(
                task.serialId, task.webRequestUri, errorMessage, task.userData,
            ));
        }
        this._scheduleNext();
    }

    // ── internals ────────────────────────────────────────────────────────────

    private _enqueue(task: WebRequestTask): void {
        let i = this._waitingTasks.length;
        while (i > 0 && this._waitingTasks[i - 1].priority < task.priority) {
            i--;
        }
        this._waitingTasks.splice(i, 0, task);
    }

    private _scheduleNext(): void {
        while (this._workingTasks.size < this._maxConcurrent && this._waitingTasks.length > 0) {
            const task = this._waitingTasks.shift()!;
            this._workingTasks.set(task.serialId, task);
            this._doWebRequest(task);
        }
    }

    protected abstract _doWebRequest(task: WebRequestTask): void;
    protected abstract _doCancelWebRequest(serialId: number): void;
}
