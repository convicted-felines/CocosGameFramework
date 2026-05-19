import { INetworkChannel } from './INetworkChannel';
import { INetworkChannelHelper } from './INetworkChannelHelper';
import { Packet } from './Packet';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface IHttpRequestParams {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: string | object;
    timeout?: number;
}

export interface IHttpResponse {
    statusCode: number;
    headers: Record<string, string>;
    data: string;
}

export type HttpSuccessCallback = (response: IHttpResponse, userData?: object) => void;
export type HttpFailureCallback = (url: string, errorMessage: string, userData?: object) => void;

export interface INetworkManager {
    /** 网络频道数量 */
    readonly networkChannelCount: number;

    // ── WebSocket 频道管理 ────────────────────────────────────────────────

    /** 是否存在指定网络频道 */
    hasNetworkChannel(name: string): boolean;

    /** 获取指定网络频道 */
    getNetworkChannel(name: string): INetworkChannel | null;

    /** 获取所有网络频道 */
    getAllNetworkChannels(): INetworkChannel[];

    /**
     * 创建网络频道（WebSocket）。
     * @param name 频道名称
     * @param helper 频道辅助器（可选，传入自定义辅助器以实现心跳/序列化）
     */
    createNetworkChannel(name: string, helper?: INetworkChannelHelper): INetworkChannel;

    /** 销毁网络频道，返回是否成功 */
    destroyNetworkChannel(name: string): boolean;

    /** 向指定频道发送消息包 */
    sendPacket<T extends Packet>(channelName: string, packet: T): boolean;

    // ── HTTP ──────────────────────────────────────────────────────────────

    sendRequest(
        url: string,
        params?: IHttpRequestParams,
        onSuccess?: HttpSuccessCallback,
        onFailure?: HttpFailureCallback,
        userData?: object
    ): void;

    sendRequestAsync(url: string, params?: IHttpRequestParams): Promise<IHttpResponse>;
}
