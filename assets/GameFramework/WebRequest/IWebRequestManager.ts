export interface IWebRequestInfo {
    readonly serialId: number;
    readonly webRequestUri: string;
    readonly tag: string;
    readonly priority: number;
    readonly userData?: object;
}

export interface IWebRequestParams {
    /** POST 数据，不传则为 GET 请求 */
    postData?: ArrayBuffer | string;
    /** 自定义请求头 */
    headers?: Record<string, string>;
    tag?: string;
    priority?: number;
    userData?: object;
}

export interface IWebRequestManager {
    /** 并发请求代理总数 */
    readonly totalAgentCount: number;
    /** 空闲代理数 */
    readonly freeAgentCount: number;
    /** 工作中代理数 */
    readonly workingAgentCount: number;
    /** 等待中任务数 */
    readonly waitingTaskCount: number;
    /** 超时时长（秒） */
    timeout: number;

    addWebRequest(webRequestUri: string, params?: IWebRequestParams): number;
    removeWebRequest(serialId: number): boolean;
    removeWebRequests(tag: string): number;
    removeAllWebRequests(): number;

    getWebRequestInfo(serialId: number): IWebRequestInfo | null;
    getWebRequestInfosByTag(tag: string): IWebRequestInfo[];
    getAllWebRequestInfos(): IWebRequestInfo[];
}
