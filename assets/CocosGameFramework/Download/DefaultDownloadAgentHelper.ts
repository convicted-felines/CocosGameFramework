import { _decorator } from 'cc';
import { DownloadAgentHelperBase } from './DownloadAgentHelperBase';
import { HelperRegistry } from '../Utility/HelperRegistry';

const { ccclass } = _decorator;

/**
 * 默认下载代理辅助器。
 * 使用 XMLHttpRequest 实现，支持进度回调与断点续传（Range 请求头）。
 */
@ccclass('DefaultDownloadAgentHelper')
export class DefaultDownloadAgentHelper extends DownloadAgentHelperBase {
    private _xhr: XMLHttpRequest | null = null;

    download(
        downloadUri: string,
        fromPosition: number,
        timeout: number,
        onStart: () => void,
        onProgress: (deltaBytes: number, currentLength: number) => void,
        onSuccess: (data: ArrayBuffer) => void,
        onFailure: (errorMessage: string) => void,
    ): void {
        const xhr = new XMLHttpRequest();
        this._xhr = xhr;

        xhr.responseType = 'arraybuffer';
        xhr.timeout = timeout * 1000;

        let lastLoaded = 0;

        xhr.onloadstart = () => {
            onStart();
        };

        xhr.onprogress = (evt) => {
            if (evt.lengthComputable) {
                const delta = evt.loaded - lastLoaded;
                lastLoaded = evt.loaded;
                onProgress(delta, evt.loaded);
            }
        };

        xhr.onload = () => {
            this._xhr = null;
            if (xhr.status >= 200 && xhr.status < 300) {
                onSuccess(xhr.response as ArrayBuffer);
            } else if (xhr.status === 416) {
                // Range Not Satisfiable — 文件已完整，视为成功（空内容）
                onSuccess(new ArrayBuffer(0));
            } else {
                onFailure(`HTTP ${xhr.status}`);
            }
        };

        xhr.onerror = () => {
            this._xhr = null;
            onFailure('Network error');
        };

        xhr.ontimeout = () => {
            this._xhr = null;
            onFailure(`Timeout after ${timeout}s`);
        };

        xhr.open('GET', downloadUri);

        if (fromPosition > 0) {
            xhr.setRequestHeader('Range', `bytes=${fromPosition}-`);
        }

        xhr.send();
    }

    cancel(): void {
        if (this._xhr) {
            this._xhr.abort();
            this._xhr = null;
        }
    }
}

HelperRegistry.register('DefaultDownloadAgentHelper', DefaultDownloadAgentHelper);
