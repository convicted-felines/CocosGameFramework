import { WebRequestManager, WebRequestTask } from '../../GameFramework/WebRequest/WebRequestManager';

export class CocosWebRequestManager extends WebRequestManager {
    private _xhrs: Map<number, XMLHttpRequest> = new Map();

    protected _doWebRequest(task: WebRequestTask): void {
        const xhr = new XMLHttpRequest();
        this._xhrs.set(task.serialId, xhr);

        xhr.responseType = 'arraybuffer';
        xhr.timeout = this.timeout * 1000;

        xhr.onloadstart = () => {
            this._onWebRequestStart(task.serialId);
        };

        xhr.onload = () => {
            this._xhrs.delete(task.serialId);
            if (xhr.status >= 200 && xhr.status < 300) {
                this._onWebRequestSuccess(task.serialId, xhr.response as ArrayBuffer);
            } else {
                this._onWebRequestFailure(task.serialId, `HTTP ${xhr.status}`);
            }
        };

        xhr.onerror = () => {
            this._xhrs.delete(task.serialId);
            this._onWebRequestFailure(task.serialId, 'Network error');
        };

        xhr.ontimeout = () => {
            this._xhrs.delete(task.serialId);
            this._onWebRequestFailure(task.serialId, `Timeout after ${this.timeout}s`);
        };

        const method = task.postData !== null ? 'POST' : 'GET';
        xhr.open(method, task.webRequestUri);

        for (const [key, value] of Object.entries(task.headers)) {
            xhr.setRequestHeader(key, value);
        }

        if (task.postData !== null) {
            xhr.send(task.postData);
        } else {
            xhr.send();
        }
    }

    protected _doCancelWebRequest(serialId: number): void {
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
