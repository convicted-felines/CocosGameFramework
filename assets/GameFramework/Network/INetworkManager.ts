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

export type WsMessageCallback = (channelName: string, data: string | ArrayBuffer) => void;
export type WsOpenCallback = (channelName: string) => void;
export type WsCloseCallback = (channelName: string, code: number, reason: string) => void;
export type WsErrorCallback = (channelName: string, errorMessage: string) => void;

export interface INetworkManager {
    // HTTP
    sendRequest(
        url: string,
        params?: IHttpRequestParams,
        onSuccess?: HttpSuccessCallback,
        onFailure?: HttpFailureCallback,
        userData?: object
    ): void;

    sendRequestAsync(url: string, params?: IHttpRequestParams): Promise<IHttpResponse>;

    // WebSocket
    createWebSocketChannel(
        channelName: string,
        url: string,
        onOpen?: WsOpenCallback,
        onMessage?: WsMessageCallback,
        onClose?: WsCloseCallback,
        onError?: WsErrorCallback
    ): void;

    sendWebSocketMessage(channelName: string, data: string | ArrayBuffer): boolean;
    closeWebSocketChannel(channelName: string): void;
    hasWebSocketChannel(channelName: string): boolean;
}
