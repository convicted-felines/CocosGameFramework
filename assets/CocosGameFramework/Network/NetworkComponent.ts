import { _decorator, Component } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { NetworkManager } from '../../GameFramework/Network/NetworkManager';
import {
    IHttpRequestParams,
    IHttpResponse,
    HttpSuccessCallback,
    HttpFailureCallback,
    WsMessageCallback,
    WsOpenCallback,
    WsCloseCallback,
    WsErrorCallback,
} from '../../GameFramework/Network/INetworkManager';

const { ccclass, property } = _decorator;

@ccclass('NetworkComponent')
export class NetworkComponent extends Component {
    /** HTTP 请求默认超时时间（毫秒） */
    @property({ tooltip: 'HTTP 请求默认超时时间（毫秒）' })
    defaultTimeout: number = 10000;

    private _manager!: NetworkManager;

    get manager(): NetworkManager { return this._manager; }

    onLoad(): void {
        this._manager = new NetworkManager();
        GameFrameworkEntry.registerModule(MODULE_ID.NETWORK, this._manager);
    }

    sendRequest(
        url: string,
        params?: IHttpRequestParams,
        onSuccess?: HttpSuccessCallback,
        onFailure?: HttpFailureCallback,
        userData?: object
    ): void {
        this._manager.sendRequest(
            url,
            { timeout: this.defaultTimeout, ...params },
            onSuccess,
            onFailure,
            userData
        );
    }

    sendRequestAsync(url: string, params?: IHttpRequestParams): Promise<IHttpResponse> {
        return this._manager.sendRequestAsync(url, { timeout: this.defaultTimeout, ...params });
    }

    createWebSocketChannel(
        channelName: string,
        url: string,
        onOpen?: WsOpenCallback,
        onMessage?: WsMessageCallback,
        onClose?: WsCloseCallback,
        onError?: WsErrorCallback
    ): void {
        this._manager.createWebSocketChannel(channelName, url, onOpen, onMessage, onClose, onError);
    }

    sendWebSocketMessage(channelName: string, data: string | ArrayBuffer): boolean {
        return this._manager.sendWebSocketMessage(channelName, data);
    }

    closeWebSocketChannel(channelName: string): void {
        this._manager.closeWebSocketChannel(channelName);
    }

    hasWebSocketChannel(channelName: string): boolean {
        return this._manager.hasWebSocketChannel(channelName);
    }
}
