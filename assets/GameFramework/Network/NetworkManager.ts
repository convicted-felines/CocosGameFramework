import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import {
    INetworkManager,
    IHttpRequestParams,
    IHttpResponse,
    HttpSuccessCallback,
    HttpFailureCallback,
    WsMessageCallback,
    WsOpenCallback,
    WsCloseCallback,
    WsErrorCallback,
} from './INetworkManager';

interface WsChannel {
    ws: WebSocket;
    onMessage?: WsMessageCallback;
    onOpen?: WsOpenCallback;
    onClose?: WsCloseCallback;
    onError?: WsErrorCallback;
}

export class NetworkManager extends GameFrameworkModule implements INetworkManager {
    private _wsChannels: Map<string, WsChannel> = new Map();

    get priority(): number { return 55; }

    sendRequest(
        url: string,
        params: IHttpRequestParams = {},
        onSuccess?: HttpSuccessCallback,
        onFailure?: HttpFailureCallback,
        userData?: object
    ): void {
        this.sendRequestAsync(url, params).then(res => {
            onSuccess?.(res, userData);
        }).catch((err: Error) => {
            onFailure?.(url, err.message, userData);
        });
    }

    async sendRequestAsync(url: string, params: IHttpRequestParams = {}): Promise<IHttpResponse> {
        const { method = 'GET', headers = {}, body, timeout = 10000 } = params;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        const init: RequestInit = {
            method,
            headers,
            signal: controller.signal,
        };

        if (body !== undefined) {
            if (typeof body === 'string') {
                init.body = body;
            } else {
                init.body = JSON.stringify(body);
                (init.headers as Record<string, string>)['Content-Type'] =
                    (init.headers as Record<string, string>)['Content-Type'] ?? 'application/json';
            }
        }

        try {
            const response = await fetch(url, init);
            clearTimeout(timer);
            const data = await response.text();
            const respHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => { respHeaders[key] = value; });
            return { statusCode: response.status, headers: respHeaders, data };
        } catch (err) {
            clearTimeout(timer);
            throw err;
        }
    }

    createWebSocketChannel(
        channelName: string,
        url: string,
        onOpen?: WsOpenCallback,
        onMessage?: WsMessageCallback,
        onClose?: WsCloseCallback,
        onError?: WsErrorCallback
    ): void {
        if (this._wsChannels.has(channelName)) {
            this.closeWebSocketChannel(channelName);
        }

        const ws = new WebSocket(url);
        const channel: WsChannel = { ws, onOpen, onMessage, onClose, onError };
        this._wsChannels.set(channelName, channel);

        ws.onopen = () => onOpen?.(channelName);
        ws.onmessage = (evt) => onMessage?.(channelName, evt.data);
        ws.onclose = (evt) => {
            this._wsChannels.delete(channelName);
            onClose?.(channelName, evt.code, evt.reason);
        };
        ws.onerror = () => onError?.(channelName, 'WebSocket error');
    }

    sendWebSocketMessage(channelName: string, data: string | ArrayBuffer): boolean {
        const channel = this._wsChannels.get(channelName);
        if (!channel || channel.ws.readyState !== WebSocket.OPEN) return false;
        channel.ws.send(data);
        return true;
    }

    closeWebSocketChannel(channelName: string): void {
        const channel = this._wsChannels.get(channelName);
        if (!channel) return;
        channel.ws.close();
        this._wsChannels.delete(channelName);
    }

    hasWebSocketChannel(channelName: string): boolean {
        return this._wsChannels.has(channelName);
    }

    update(_e: number, _r: number): void {}

    shutdown(): void {
        this._wsChannels.forEach((ch) => ch.ws.close());
        this._wsChannels.clear();
    }
}
