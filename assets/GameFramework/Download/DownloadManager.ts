import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { IEventManager } from '../Event/IEventManager';
import { IDownloadManager, IDownloadInfo, IDownloadParams } from './IDownloadManager';
import {
    DownloadStartEventArgs,
    DownloadUpdateEventArgs,
    DownloadSuccessEventArgs,
    DownloadFailureEventArgs,
} from './DownloadEventArgs';

export const enum DownloadTaskStatus {
    Todo,
    Doing,
    Done,
    Error,
}

export class DownloadTask implements IDownloadInfo {
    private static _serial: number = 0;

    readonly serialId: number;
    readonly downloadPath: string;
    readonly downloadUri: string;
    readonly tag: string;
    readonly priority: number;
    readonly userData?: object;

    status: DownloadTaskStatus = DownloadTaskStatus.Todo;
    downloadedLength: number = 0;

    constructor(downloadPath: string, downloadUri: string, tag: string, priority: number, userData?: object) {
        this.serialId = ++DownloadTask._serial;
        this.downloadPath = downloadPath;
        this.downloadUri = downloadUri;
        this.tag = tag;
        this.priority = priority;
        this.userData = userData;
    }
}

/** 下载速度统计器 */
class DownloadCounter {
    private _samples: Array<{ time: number; bytes: number }> = [];
    private _windowSeconds: number;
    currentSpeed: number = 0;

    constructor(windowSeconds: number = 3) {
        this._windowSeconds = windowSeconds;
    }

    recordBytes(bytes: number, nowSeconds: number): void {
        this._samples.push({ time: nowSeconds, bytes });
    }

    update(nowSeconds: number): void {
        const cutoff = nowSeconds - this._windowSeconds;
        while (this._samples.length > 0 && this._samples[0].time < cutoff) {
            this._samples.shift();
        }
        const total = this._samples.reduce((s, n) => s + n.bytes, 0);
        this.currentSpeed = this._windowSeconds > 0 ? total / this._windowSeconds : 0;
    }

    reset(): void {
        this._samples = [];
        this.currentSpeed = 0;
    }
}

export abstract class DownloadManager extends GameFrameworkModule implements IDownloadManager {
    protected _eventManager: IEventManager | null = null;

    private _waitingTasks: DownloadTask[] = [];
    private _workingTasks: Map<number, DownloadTask> = new Map();

    private _paused: boolean = false;
    private _timeout: number = 30;
    private _maxConcurrent: number = 3;
    private _counter: DownloadCounter = new DownloadCounter();
    private _elapsedSeconds: number = 0;

    get priority(): number { return 25; }

    get paused(): boolean { return this._paused; }
    set paused(value: boolean) { this._paused = value; }

    get timeout(): number { return this._timeout; }
    set timeout(value: number) { this._timeout = value > 0 ? value : 30; }

    /** 最大并发下载数 */
    get maxConcurrent(): number { return this._maxConcurrent; }
    set maxConcurrent(value: number) { this._maxConcurrent = value > 0 ? value : 1; }

    get totalAgentCount(): number { return this._maxConcurrent; }
    get freeAgentCount(): number { return Math.max(0, this._maxConcurrent - this._workingTasks.size); }
    get workingAgentCount(): number { return this._workingTasks.size; }
    get waitingTaskCount(): number { return this._waitingTasks.length; }

    get currentSpeed(): number { return this._counter.currentSpeed; }

    setEventManager(eventManager: IEventManager): void {
        this._eventManager = eventManager;
    }

    addDownload(downloadPath: string, downloadUri: string, params: IDownloadParams = {}): number {
        if (!downloadPath) throw new Error('downloadPath is invalid.');
        if (!downloadUri) throw new Error('downloadUri is invalid.');

        const task = new DownloadTask(
            downloadPath,
            downloadUri,
            params.tag ?? '',
            params.priority ?? 0,
            params.userData,
        );

        this._enqueue(task);
        this._scheduleNext();
        return task.serialId;
    }

    removeDownload(serialId: number): boolean {
        const waiting = this._waitingTasks.findIndex(t => t.serialId === serialId);
        if (waiting >= 0) {
            this._waitingTasks.splice(waiting, 1);
            return true;
        }
        if (this._workingTasks.has(serialId)) {
            this._doCancelDownload(serialId);
            this._workingTasks.delete(serialId);
            return true;
        }
        return false;
    }

    removeDownloads(tag: string): number {
        let count = 0;
        this._waitingTasks = this._waitingTasks.filter(t => {
            if (t.tag === tag) { count++; return false; }
            return true;
        });
        this._workingTasks.forEach((task, id) => {
            if (task.tag === tag) {
                this._doCancelDownload(id);
                this._workingTasks.delete(id);
                count++;
            }
        });
        return count;
    }

    removeAllDownloads(): void {
        this._waitingTasks = [];
        this._workingTasks.forEach((_, id) => this._doCancelDownload(id));
        this._workingTasks.clear();
    }

    getDownloadInfo(serialId: number): IDownloadInfo | null {
        const working = this._workingTasks.get(serialId);
        if (working) return working;
        return this._waitingTasks.find(t => t.serialId === serialId) ?? null;
    }

    getDownloadInfosByTag(tag: string): IDownloadInfo[] {
        const result: IDownloadInfo[] = [];
        this._waitingTasks.forEach(t => { if (t.tag === tag) result.push(t); });
        this._workingTasks.forEach(t => { if (t.tag === tag) result.push(t); });
        return result;
    }

    getAllDownloadInfos(): IDownloadInfo[] {
        const result: IDownloadInfo[] = [...this._waitingTasks];
        this._workingTasks.forEach(t => result.push(t));
        return result;
    }

    update(elapseSeconds: number, _realElapseSeconds: number): void {
        this._elapsedSeconds += elapseSeconds;
        this._counter.update(this._elapsedSeconds);
        if (!this._paused) {
            this._scheduleNext();
        }
    }

    shutdown(): void {
        this.removeAllDownloads();
        this._counter.reset();
    }

    // ── called by concrete implementations ──────────────────────────────────

    protected _onDownloadStart(serialId: number): void {
        const task = this._workingTasks.get(serialId);
        if (!task) return;
        task.status = DownloadTaskStatus.Doing;
        if (this._eventManager) {
            this._eventManager.fire(this, DownloadStartEventArgs.create(
                task.serialId, task.downloadPath, task.downloadUri, task.downloadedLength, task.userData,
            ));
        }
    }

    protected _onDownloadProgress(serialId: number, deltaBytes: number, currentLength: number): void {
        const task = this._workingTasks.get(serialId);
        if (!task) return;
        task.downloadedLength = currentLength;
        this._counter.recordBytes(deltaBytes, this._elapsedSeconds);
        if (this._eventManager) {
            this._eventManager.fire(this, DownloadUpdateEventArgs.create(
                task.serialId, task.downloadPath, task.downloadUri, currentLength, task.userData,
            ));
        }
    }

    protected _onDownloadSuccess(serialId: number, data: ArrayBuffer): void {
        const task = this._workingTasks.get(serialId);
        if (!task) return;
        task.status = DownloadTaskStatus.Done;
        task.downloadedLength = data.byteLength;
        this._workingTasks.delete(serialId);
        if (this._eventManager) {
            this._eventManager.fire(this, DownloadSuccessEventArgs.create(
                task.serialId, task.downloadPath, task.downloadUri, data.byteLength, task.userData,
            ));
        }
        this._scheduleNext();
    }

    protected _onDownloadFailure(serialId: number, errorMessage: string): void {
        const task = this._workingTasks.get(serialId);
        if (!task) return;
        task.status = DownloadTaskStatus.Error;
        this._workingTasks.delete(serialId);
        if (this._eventManager) {
            this._eventManager.fire(this, DownloadFailureEventArgs.create(
                task.serialId, task.downloadPath, task.downloadUri, errorMessage, task.userData,
            ));
        }
        this._scheduleNext();
    }

    // ── internals ────────────────────────────────────────────────────────────

    private _enqueue(task: DownloadTask): void {
        let i = this._waitingTasks.length;
        while (i > 0 && this._waitingTasks[i - 1].priority < task.priority) {
            i--;
        }
        this._waitingTasks.splice(i, 0, task);
    }

    private _scheduleNext(): void {
        while (!this._paused && this._workingTasks.size < this._maxConcurrent && this._waitingTasks.length > 0) {
            const task = this._waitingTasks.shift()!;
            this._workingTasks.set(task.serialId, task);
            this._doDownload(task);
        }
    }

    protected abstract _doDownload(task: DownloadTask): void;
    protected abstract _doCancelDownload(serialId: number): void;
}
