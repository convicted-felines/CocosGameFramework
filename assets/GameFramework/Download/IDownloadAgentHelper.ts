/**
 * 下载代理辅助器接口。
 *
 * 负责执行单次 HTTP 下载，将进度/成功/失败通过回调通知调用方。
 * 通过实现此接口可替换底层网络层（XHR、jsb.fileDownloader、自定义协议等）。
 */
export interface IDownloadAgentHelper {
    /**
     * 开始下载。
     * @param downloadUri   下载地址
     * @param fromPosition  断点续传起始字节偏移，0 表示全量下载
     * @param timeout       超时时长（秒）
     * @param onStart       下载开始时回调
     * @param onProgress    进度更新回调，deltaBytes = 本次新增字节数，currentLength = 当前已收到总字节数
     * @param onSuccess     下载成功回调，data = 本次收到的完整内容
     * @param onFailure     下载失败回调，errorMessage = 错误描述
     */
    download(
        downloadUri: string,
        fromPosition: number,
        timeout: number,
        onStart: () => void,
        onProgress: (deltaBytes: number, currentLength: number) => void,
        onSuccess: (data: ArrayBuffer) => void,
        onFailure: (errorMessage: string) => void,
    ): void;

    /** 取消当前下载 */
    cancel(): void;
}
