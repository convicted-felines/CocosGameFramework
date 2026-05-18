import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import {
    IDownloadManager,
    IDownloadTask,
    IDownloadParams,
} from './IDownloadManager';

class DownloadTask implements IDownloadTask {
    constructor(
        public readonly serialId: number,
        public readonly url: string,
        public readonly savePath: string,
        public readonly tag: string,
        public readonly priority: number,
        public readonly params: IDownloadParams
    ) {}
}

export abstract class DownloadManager extends GameFrameworkModule implements IDownloadManager {
    private _tasks: Map<number, DownloadTask> = new Map();
    private _serialId: number = 0;

    get priority(): number { return 25; }
    get totalCount(): number { return this._tasks.size; }
    get pendingCount(): number { return this._tasks.size; }

    addDownload(url: string, savePath: string, params: IDownloadParams = {}): number {
        const serialId = ++this._serialId;
        const task = new DownloadTask(
            serialId, url, savePath,
            params.tag ?? '', params.priority ?? 0, params
        );
        this._tasks.set(serialId, task);
        this._doDownload(task);
        return serialId;
    }

    removeDownload(serialId: number): boolean {
        if (!this._tasks.has(serialId)) return false;
        this._doCancelDownload(serialId);
        this._tasks.delete(serialId);
        return true;
    }

    removeDownloadsByTag(tag: string): number {
        let count = 0;
        this._tasks.forEach((task, id) => {
            if (task.tag === tag) {
                this._doCancelDownload(id);
                this._tasks.delete(id);
                count++;
            }
        });
        return count;
    }

    protected _completeTask(serialId: number, data: ArrayBuffer): void {
        const task = this._tasks.get(serialId);
        if (!task) return;
        this._tasks.delete(serialId);
        task.params.onSuccess?.(task, data, task.params.userData);
    }

    protected _failTask(serialId: number, errorMessage: string): void {
        const task = this._tasks.get(serialId);
        if (!task) return;
        this._tasks.delete(serialId);
        task.params.onFailure?.(task, errorMessage, task.params.userData);
    }

    protected _progressTask(serialId: number, downloaded: number, total: number): void {
        const task = this._tasks.get(serialId);
        if (!task) return;
        task.params.onProgress?.(task, downloaded, total);
    }

    protected abstract _doDownload(task: DownloadTask): void;
    protected abstract _doCancelDownload(serialId: number): void;

    update(_e: number, _r: number): void {}

    shutdown(): void {
        this._tasks.forEach((_, id) => this._doCancelDownload(id));
        this._tasks.clear();
    }
}
