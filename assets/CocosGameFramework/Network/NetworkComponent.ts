import { _decorator } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { NetworkManager } from '../../GameFramework/Network/NetworkManager';
import { EventManager } from '../../GameFramework/Event/EventManager';
import { INetworkChannel } from '../../GameFramework/Network/INetworkChannel';
import { INetworkChannelHelper } from '../../GameFramework/Network/INetworkChannelHelper';
import { Packet } from '../../GameFramework/Network/Packet';
import { NetworkChannelHelperBase } from './NetworkChannelHelperBase';
import {
    IHttpRequestParams,
    IHttpResponse,
    HttpSuccessCallback,
    HttpFailureCallback,
} from '../../GameFramework/Network/INetworkManager';
import {
    NetworkConnectedEventArgs,
    NetworkClosedEventArgs,
    NetworkMissHeartBeatEventArgs,
    NetworkErrorEventArgs,
    NetworkCustomErrorEventArgs,
} from '../../GameFramework/Network/NetworkEventArgs';
import { BaseEventArgs } from '../../GameFramework/Event/BaseEventArgs';

const { ccclass, property } = _decorator;

@ccclass('NetworkComponent')
export class NetworkComponent extends GameFrameworkComponent {
    /** HTTP 请求默认超时时间（毫秒） */
    @property({ tooltip: 'HTTP 请求默认超时时间（毫秒）' })
    defaultTimeout: number = 10000;

    /** 默认网络频道辅助器，调用 createNetworkChannel 时未传入 helper 则使用此辅助器。 */
    @property({ type: NetworkChannelHelperBase, tooltip: '默认网络频道辅助器，留空则不附加辅助器' })
    networkChannelHelper: NetworkChannelHelperBase | null = null;

    private _manager!: NetworkManager;

    get manager(): NetworkManager { return this._manager; }

    get networkChannelCount(): number { return this._manager.networkChannelCount; }

    onLoad(): void {
        super.onLoad();
        this._manager = new NetworkManager();

        this._manager.onNetworkConnected = (sender, e) => this._fireEvent(sender, e as BaseEventArgs);
        this._manager.onNetworkClosed = (sender, e) => this._fireEvent(sender, e as BaseEventArgs);
        this._manager.onNetworkMissHeartBeat = (sender, e) => this._fireEvent(sender, e as BaseEventArgs);
        this._manager.onNetworkError = (sender, e) => this._fireEvent(sender, e as BaseEventArgs);
        this._manager.onNetworkCustomError = (sender, e) => this._fireEvent(sender, e as BaseEventArgs);

        GameFrameworkEntry.registerModule(MODULE_ID.NETWORK, this._manager);
    }

    // ── 频道管理 ──────────────────────────────────────────────────────────

    hasNetworkChannel(name: string): boolean {
        return this._manager.hasNetworkChannel(name);
    }

    getNetworkChannel(name: string): INetworkChannel | null {
        return this._manager.getNetworkChannel(name);
    }

    getAllNetworkChannels(): INetworkChannel[] {
        return this._manager.getAllNetworkChannels();
    }

    createNetworkChannel(name: string, helper?: INetworkChannelHelper): INetworkChannel {
        return this._manager.createNetworkChannel(name, helper ?? this.networkChannelHelper ?? undefined);
    }

    destroyNetworkChannel(name: string): boolean {
        return this._manager.destroyNetworkChannel(name);
    }

    sendPacket<T extends Packet>(channelName: string, packet: T): boolean {
        return this._manager.sendPacket(channelName, packet);
    }

    // ── HTTP ──────────────────────────────────────────────────────────────

    sendRequest(
        url: string,
        params?: IHttpRequestParams,
        onSuccess?: HttpSuccessCallback,
        onFailure?: HttpFailureCallback,
        userData?: object
    ): void {
        this._manager.sendRequest(url, { timeout: this.defaultTimeout, ...params }, onSuccess, onFailure, userData);
    }

    sendRequestAsync(url: string, params?: IHttpRequestParams): Promise<IHttpResponse> {
        return this._manager.sendRequestAsync(url, { timeout: this.defaultTimeout, ...params });
    }

    // ── 事件 ID 快捷访问 ──────────────────────────────────────────────────

    static get EventConnected(): string { return NetworkConnectedEventArgs.eventId; }
    static get EventClosed(): string { return NetworkClosedEventArgs.eventId; }
    static get EventMissHeartBeat(): string { return NetworkMissHeartBeatEventArgs.eventId; }
    static get EventError(): string { return NetworkErrorEventArgs.eventId; }
    static get EventCustomError(): string { return NetworkCustomErrorEventArgs.eventId; }

    private _fireEvent(sender: object, e: BaseEventArgs): void {
        const eventMgr = GameFrameworkEntry.getModule(EventManager, MODULE_ID.EVENT);
        eventMgr.fire(sender, e);
    }
}
