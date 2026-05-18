export interface IDownloadTask {
    readonly serialId: number;
    readonly url: string;
    readonly savePath: string;
    readonly tag: string;
}

export type DownloadSuccessCallback = (task: IDownloadTask, data: ArrayBuffer, userData?: object) => void;
export type DownloadProgressCallback = (task: IDownloadTask, downloaded: number, total: number) => void;
export type DownloadFailureCallback = (task: IDownloadTask, errorMessage: string, userData?: object) => void;

export interface IDownloadParams {
    tag?: string;
    priority?: number;
    timeout?: number;
    userData?: object;
    onSuccess?: DownloadSuccessCallback;
    onProgress?: DownloadProgressCallback;
    onFailure?: DownloadFailureCallback;
}

export interface IDownloadManager {
    readonly totalCount: number;
    readonly pendingCount: number;

    addDownload(url: string, savePath: string, params?: IDownloadParams): number;
    removeDownload(serialId: number): boolean;
    removeDownloadsByTag(tag: string): number;
}
