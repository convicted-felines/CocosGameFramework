export interface IDownloadInfo {
    readonly serialId: number;
    readonly downloadPath: string;
    readonly downloadUri: string;
    readonly tag: string;
    readonly priority: number;
    readonly userData?: object;
}

export interface IDownloadParams {
    tag?: string;
    priority?: number;
    userData?: object;
}

export interface IDownloadManager {
    /** 是否暂停下载 */
    paused: boolean;
    /** 下载代理总数 */
    readonly totalAgentCount: number;
    /** 空闲下载代理数 */
    readonly freeAgentCount: number;
    /** 工作中下载代理数 */
    readonly workingAgentCount: number;
    /** 等待下载任务数 */
    readonly waitingTaskCount: number;
    /** 超时时长（秒） */
    timeout: number;
    /** 当前下载速度（字节/秒） */
    readonly currentSpeed: number;

    addDownload(downloadPath: string, downloadUri: string, params?: IDownloadParams): number;
    removeDownload(serialId: number): boolean;
    removeDownloads(tag: string): number;
    removeAllDownloads(): void;

    getDownloadInfo(serialId: number): IDownloadInfo | null;
    getDownloadInfosByTag(tag: string): IDownloadInfo[];
    getAllDownloadInfos(): IDownloadInfo[];
}
