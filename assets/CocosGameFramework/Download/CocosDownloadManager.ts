import { DownloadManager } from '../../GameFramework/Download/DownloadManager';

export class CocosDownloadManager extends DownloadManager {
    private _xhrs: Map<number, XMLHttpRequest> = new Map();

    protected _doDownload(task: { serialId: number; url: string; params: { timeout?: number } }): void {
        const xhr = new XMLHttpRequest();
        this._xhrs.set(task.serialId, xhr);

        xhr.responseType = 'arraybuffer';
        xhr.timeout = task.params.timeout ?? 30000;

        xhr.onprogress = (evt) => {
            if (evt.lengthComputable) {
                this._progressTask(task.serialId, evt.loaded, evt.total);
            }
        };

        xhr.onload = () => {
            this._xhrs.delete(task.serialId);
            if (xhr.status >= 200 && xhr.status < 300) {
                this._completeTask(task.serialId, xhr.response as ArrayBuffer);
            } else {
                this._failTask(task.serialId, `HTTP ${xhr.status}`);
            }
        };

        xhr.onerror = () => {
            this._xhrs.delete(task.serialId);
            this._failTask(task.serialId, 'Network error');
        };

        xhr.ontimeout = () => {
            this._xhrs.delete(task.serialId);
            this._failTask(task.serialId, 'Timeout');
        };

        xhr.open('GET', task.url);
        xhr.send();
    }

    protected _doCancelDownload(serialId: number): void {
        const xhr = this._xhrs.get(serialId);
        if (xhr) {
            xhr.abort();
            this._xhrs.delete(serialId);
        }
    }

    shutdown(): void {
        this._xhrs.forEach(xhr => xhr.abort());
        this._xhrs.clear();
        super.shutdown();
    }
}
