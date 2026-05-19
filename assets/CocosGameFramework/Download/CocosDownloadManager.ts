import { DownloadManager, DownloadTask } from '../../GameFramework/Download/DownloadManager';

export class CocosDownloadManager extends DownloadManager {
    private _xhrs: Map<number, XMLHttpRequest> = new Map();

    protected _doDownload(task: DownloadTask): void {
        const xhr = new XMLHttpRequest();
        this._xhrs.set(task.serialId, xhr);

        xhr.responseType = 'arraybuffer';
        xhr.timeout = this.timeout * 1000;

        let lastLoaded = 0;

        xhr.onloadstart = () => {
            this._onDownloadStart(task.serialId);
        };

        xhr.onprogress = (evt) => {
            if (evt.lengthComputable) {
                const delta = evt.loaded - lastLoaded;
                lastLoaded = evt.loaded;
                this._onDownloadProgress(task.serialId, delta, evt.loaded);
            }
        };

        xhr.onload = () => {
            this._xhrs.delete(task.serialId);
            if (xhr.status >= 200 && xhr.status < 300) {
                this._onDownloadSuccess(task.serialId, xhr.response as ArrayBuffer);
            } else {
                this._onDownloadFailure(task.serialId, `HTTP ${xhr.status}`);
            }
        };

        xhr.onerror = () => {
            this._xhrs.delete(task.serialId);
            this._onDownloadFailure(task.serialId, 'Network error');
        };

        xhr.ontimeout = () => {
            this._xhrs.delete(task.serialId);
            this._onDownloadFailure(task.serialId, `Timeout after ${this.timeout}s`);
        };

        xhr.open('GET', task.downloadUri);
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
