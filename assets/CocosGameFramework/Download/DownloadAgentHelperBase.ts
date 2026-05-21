import { Component, _decorator } from 'cc';
import { IDownloadAgentHelper } from '../../GameFramework/Download/IDownloadAgentHelper';

const { ccclass } = _decorator;

/**
 * 下载代理辅助器基类。
 * 继承此类并实现 download() / cancel()，可替换底层网络实现（XHR、JSB 原生下载器等）。
 */
@ccclass('DownloadAgentHelperBase')
export abstract class DownloadAgentHelperBase extends Component implements IDownloadAgentHelper {
    abstract download(
        downloadUri: string,
        fromPosition: number,
        timeout: number,
        onStart: () => void,
        onProgress: (deltaBytes: number, currentLength: number) => void,
        onSuccess: (data: ArrayBuffer) => void,
        onFailure: (errorMessage: string) => void,
    ): void;

    abstract cancel(): void;
}
