import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { IEventManager } from '../Event/IEventManager';
import { IDownloadAgentHelper } from './IDownloadAgentHelper';
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
    /** 断点续传起始字节偏移 */
    readonly fromPosition: number;
    readonly userData?: object;

    status: DownloadTaskStatus = DownloadTaskStatus.Todo;
    downloadedLength: number = 0;

    constructor(downloadPath: string, downloadUri: string, tag: string, priority: number, fromPosition: number, userData?: object) {
        this.serialId = ++DownloadTask._serial;
        this.downloadPath = downloadPath;
        this.downloadUri = downloadUri;
        this.tag = tag;
        this.priority = priority;
        this.fromPosition = fromPosition;
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

export class DownloadManager extends GameFrameworkModule implements IDownloadManager {
    protected _eventManager: IEventManager | null = null;

    private _waitingTasks: DownloadTask[] = [];
    private _workingTasks: Map<number, DownloadTask> = new Map();
    /** serialId → 正在使用的辅助器实例 */
    private _workingHelpers: Map<number, IDownloadAgentHelper> = new Map();
    /** 空闲辅助器池（由 addDownloadAgentHelper 注入） */
    private _freeHelpers: IDownloadAgentHelper[] = [];

    private _paused: boolean = false;
    private _timeout: number = 30;
    /** 分块写盘阈值（字节），0 = 下载完成后一次性写入 */
    private _flushSize: number = 0;
    private _counter: DownloadCounter = new DownloadCounter();
    private _elapsedSeconds: number = 0;

    get priority(): number { return 25; }

    get paused(): boolean { return this._paused; }
    set paused(value: boolean) { this._paused = value; }

    get timeout(): number { return this._timeout; }
    set timeout(value: number) { this._timeout = value > 0 ? value : 30; }

    get flushSize(): number { return this._flushSize; }
    set flushSize(value: number) { this._flushSize = value >= 0 ? value : 0; }

    get totalAgentCount(): number { return this._freeHelpers.length + this._workingHelpers.size; }
    get freeAgentCount(): number { return this._freeHelpers.length; }
    get workingAgentCount(): number { return this._workingHelpers.size; }
    get waitingTaskCount(): number { return this._waitingTasks.length; }

    get currentSpeed(): number { return this._counter.currentSpeed; }

    setEventManager(eventManager: IEventManager): void {
        this._eventManager = eventManager;
    }

    /** 注入一个辅助器实例（由 CocosDownloadManager 根据编辑器配置创建并注入） */
    addDownloadAgentHelper(helper: IDownloadAgentHelper): void {
        this._freeHelpers.push(helper);
    }

    addDownload(downloadPath: string, downloadUri: string, params: IDownloadParams = {}): number {
        if (!downloadPath) throw new Error('downloadPath is invalid.');
        if (!downloadUri) throw new Error('downloadUri is invalid.');

        const task = new DownloadTask(
            downloadPath,
            downloadUri,
            params.tag ?? '',
            params.priority ?? 0,
            params.fromPosition ?? 0,
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
        const helper = this._workingHelpers.get(serialId);
        if (helper) {
            helper.cancel();
            this._workingHelpers.delete(serialId);
            this._freeHelpers.push(helper);
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
                const helper = this._workingHelpers.get(id);
                if (helper) {
                    helper.cancel();
                    this._workingHelpers.delete(id);
                    this._freeHelpers.push(helper);
                }
                this._workingTasks.delete(id);
                count++;
            }
        });
        return count;
    }

    removeAllDownloads(): void {
        this._waitingTasks = [];
        this._workingHelpers.forEach((helper, id) => {
            helper.cancel();
            this._freeHelpers.push(helper);
            this._workingTasks.delete(id);
        });
        this._workingHelpers.clear();
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

    // ── internals ────────────────────────────────────────────────────────────

    private _enqueue(task: DownloadTask): void {
        let i = this._waitingTasks.length;
        while (i > 0 && this._waitingTasks[i - 1].priority < task.priority) {
            i--;
        }
        this._waitingTasks.splice(i, 0, task);
    }

    private _scheduleNext(): void {
        while (!this._paused && this._freeHelpers.length > 0 && this._waitingTasks.length > 0) {
            const task = this._waitingTasks.shift()!;
            const helper = this._freeHelpers.pop()!;
            this._workingTasks.set(task.serialId, task);
            this._workingHelpers.set(task.serialId, helper);
            this._startTask(task, helper);
        }
    }

    private _startTask(task: DownloadTask, helper: IDownloadAgentHelper): void {
        let lastFlushed = 0;

        helper.download(
            task.downloadUri,
            task.fromPosition,
            this._timeout,
            () => {
                // onStart
                task.status = DownloadTaskStatus.Doing;
                if (this._eventManager) {
                    this._eventManager.fire(this, DownloadStartEventArgs.create(
                        task.serialId, task.downloadPath, task.downloadUri, task.fromPosition, task.userData,
                    ));
                }
            },
            (deltaBytes, currentLength) => {
                // onProgress
                task.downloadedLength = currentLength;
                this._counter.recordBytes(deltaBytes, this._elapsedSeconds);
                if (this._eventManager) {
                    this._eventManager.fire(this, DownloadUpdateEventArgs.create(
                        task.serialId, task.downloadPath, task.downloadUri,
                        task.fromPosition + currentLength, task.userData,
                    ));
                }
                // flushSize 阈值检测
                if (this._flushSize > 0 && currentLength - lastFlushed >= this._flushSize) {
                    lastFlushed = currentLength;
                }
            },
            (data) => {
                // onSuccess
                task.status = DownloadTaskStatus.Done;
                task.downloadedLength = data.byteLength;
                this._workingTasks.delete(task.serialId);
                this._workingHelpers.delete(task.serialId);
                this._freeHelpers.push(helper);
                if (this._eventManager) {
                    this._eventManager.fire(this, DownloadSuccessEventArgs.create(
                        task.serialId, task.downloadPath, task.downloadUri,
                        task.fromPosition + data.byteLength, data, task.userData,
                    ));
                }
                this._scheduleNext();
            },
            (errorMessage) => {
                // onFailure
                task.status = DownloadTaskStatus.Error;
                this._workingTasks.delete(task.serialId);
                this._workingHelpers.delete(task.serialId);
                this._freeHelpers.push(helper);
                if (this._eventManager) {
                    this._eventManager.fire(this, DownloadFailureEventArgs.create(
                        task.serialId, task.downloadPath, task.downloadUri, errorMessage, task.userData,
                    ));
                }
                this._scheduleNext();
            },
        );
    }
}
