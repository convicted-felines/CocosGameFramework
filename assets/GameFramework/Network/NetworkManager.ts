import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import {
    INetworkManager,
    IHttpRequestParams,
    IHttpResponse,
    HttpSuccessCallback,
    HttpFailureCallback,
} from './INetworkManager';
import { INetworkChannel } from './INetworkChannel';
import { INetworkChannelHelper } from './INetworkChannelHelper';
import { Packet } from './Packet';
import {
    NetworkConnectedEventArgs,
    NetworkClosedEventArgs,
    NetworkMissHeartBeatEventArgs,
    NetworkErrorEventArgs,
    NetworkCustomErrorEventArgs,
} from './NetworkEventArgs';

type NetworkEventCallback = (sender: object, e: NetworkConnectedEventArgs | NetworkClosedEventArgs | NetworkMissHeartBeatEventArgs | NetworkErrorEventArgs | NetworkCustomErrorEventArgs) => void;

const DEFAULT_HEARTBEAT_INTERVAL = 30;

/** WebSocket 网络频道实现 */
class NetworkChannel implements INetworkChannel {
    readonly name: string;

    private _ws: WebSocket | null = null;
    private _helper: INetworkChannelHelper | null;
    private _sendQueue: Packet[] = [];
    private _receiveQueue: Packet[] = [];
    private _sentPacketCount = 0;
    private _receivedPacketCount = 0;
    private _heartBeatInterval = DEFAULT_HEARTBEAT_INTERVAL;
    private _heartBeatElapseSeconds = 0;
    private _missHeartBeatCount = 0;
    private _resetHeartBeatOnReceive = true;
    private _userData?: object;

    onConnected?: (channel: NetworkChannel, userData?: object) => void;
    onClosed?: (channel: NetworkChannel, code: number, reason: string) => void;
    onMissHeartBeat?: (channel: NetworkChannel, missCount: number) => void;
    onError?: (channel: NetworkChannel, errorMessage: string) => void;
    onCustomError?: (channel: NetworkChannel, customErrorData?: object) => void;

    constructor(name: string, helper: INetworkChannelHelper | null) {
        this.name = name;
        this._helper = helper;
    }

    get connected(): boolean {
        return this._ws !== null && this._ws.readyState === WebSocket.OPEN;
    }

    get sendPacketCount(): number { return this._sendQueue.length; }
    get sentPacketCount(): number { return this._sentPacketCount; }
    get receivePacketCount(): number { return this._receiveQueue.length; }
    get receivedPacketCount(): number { return this._receivedPacketCount; }

    get resetHeartBeatElapseSecondsWhenReceivePacket(): boolean { return this._resetHeartBeatOnReceive; }
    set resetHeartBeatElapseSecondsWhenReceivePacket(value: boolean) { this._resetHeartBeatOnReceive = value; }

    get missHeartBeatCount(): number { return this._missHeartBeatCount; }
    get heartBeatInterval(): number { return this._heartBeatInterval; }
    set heartBeatInterval(value: number) { this._heartBeatInterval = value; }
    get heartBeatElapseSeconds(): number { return this._heartBeatElapseSeconds; }

    connect(url: string, userData?: object): void {
        if (this._ws) {
            this.close();
        }

        this._userData = userData;
        this._heartBeatElapseSeconds = 0;
        this._missHeartBeatCount = 0;
        this._sendQueue.length = 0;
        this._receiveQueue.length = 0;

        this._helper?.prepareForConnecting();

        this._ws = new WebSocket(url);
        this._ws.binaryType = 'arraybuffer';

        this._ws.onopen = () => {
            this.onConnected?.(this, this._userData);
        };

        this._ws.onmessage = (evt) => {
            this._receivedPacketCount++;
            if (this._resetHeartBeatOnReceive) {
                this._heartBeatElapseSeconds = 0;
            }

            if (this._helper) {
                const raw = new Uint8Array(evt.data as ArrayBuffer);
                const headerResult = this._helper.deserializePacketHeader(raw.slice(0, this._helper.packetHeaderLength));
                if (!headerResult.header) {
                    if (headerResult.customErrorData !== undefined) {
                        this.onCustomError?.(this, headerResult.customErrorData);
                    }
                    return;
                }
                const bodyData = raw.slice(this._helper.packetHeaderLength);
                const packetResult = this._helper.deserializePacket(headerResult.header, bodyData);
                if (!packetResult.packet) {
                    if (packetResult.customErrorData !== undefined) {
                        this.onCustomError?.(this, packetResult.customErrorData);
                    }
                    return;
                }
                this._receiveQueue.push(packetResult.packet);
            }
        };

        this._ws.onclose = (evt) => {
            const code = evt.code;
            const reason = evt.reason;
            this._ws = null;
            this.onClosed?.(this, code, reason);
        };

        this._ws.onerror = () => {
            this.onError?.(this, `WebSocket error on channel [${this.name}]`);
        };
    }

    close(): void {
        if (!this._ws) return;
        const ws = this._ws;
        this._ws = null;
        this._sendQueue.length = 0;
        this._receiveQueue.length = 0;
        if (ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
            ws.close();
        }
    }

    send<T extends Packet>(packet: T): boolean {
        if (!packet) throw new GameFrameworkError('Packet is invalid.');
        if (!this.connected) return false;

        if (this._helper) {
            const data = this._helper.serialize(packet);
            if (!data) return false;
            this._ws!.send(data.buffer as ArrayBuffer);
        } else {
            this._sendQueue.push(packet);
        }
        this._sentPacketCount++;
        return true;
    }

    /** 每帧由 NetworkManager 调用 */
    update(elapseSeconds: number): void {
        if (!this.connected || this._heartBeatInterval <= 0) return;

        this._heartBeatElapseSeconds += elapseSeconds;
        if (this._heartBeatElapseSeconds >= this._heartBeatInterval) {
            this._heartBeatElapseSeconds = 0;
            this._missHeartBeatCount++;

            const sent = this._helper?.sendHeartBeat() ?? false;
            if (!sent) {
                this.onMissHeartBeat?.(this, this._missHeartBeatCount);
            }
        }
    }
}

export class NetworkManager extends GameFrameworkModule implements INetworkManager {
    private _channels: Map<string, NetworkChannel> = new Map();

    /** 网络事件回调，由 NetworkComponent 注入后统一分发到 EventManager */
    onNetworkConnected?: NetworkEventCallback;
    onNetworkClosed?: NetworkEventCallback;
    onNetworkMissHeartBeat?: NetworkEventCallback;
    onNetworkError?: NetworkEventCallback;
    onNetworkCustomError?: NetworkEventCallback;

    get priority(): number { return 55; }

    get networkChannelCount(): number { return this._channels.size; }

    hasNetworkChannel(name: string): boolean {
        return this._channels.has(name);
    }

    getNetworkChannel(name: string): INetworkChannel | null {
        return this._channels.get(name) ?? null;
    }

    getAllNetworkChannels(): INetworkChannel[] {
        return Array.from(this._channels.values());
    }

    createNetworkChannel(name: string, helper?: INetworkChannelHelper): INetworkChannel {
        if (this._channels.has(name)) {
            throw new GameFrameworkError(`Network channel [${name}] already exists.`);
        }

        const channel = new NetworkChannel(name, helper ?? null);

        channel.onConnected = (ch, userData) => {
            this.onNetworkConnected?.(this, NetworkConnectedEventArgs.create(ch.name, userData));
        };
        channel.onClosed = (ch, code, reason) => {
            this._channels.delete(ch.name);
            this.onNetworkClosed?.(this, NetworkClosedEventArgs.create(ch.name, code, reason));
        };
        channel.onMissHeartBeat = (ch, missCount) => {
            this.onNetworkMissHeartBeat?.(this, NetworkMissHeartBeatEventArgs.create(ch.name, missCount));
        };
        channel.onError = (ch, errorMessage) => {
            this.onNetworkError?.(this, NetworkErrorEventArgs.create(ch.name, errorMessage));
        };
        channel.onCustomError = (ch, customErrorData) => {
            this.onNetworkCustomError?.(this, NetworkCustomErrorEventArgs.create(ch.name, customErrorData));
        };

        this._channels.set(name, channel);
        return channel;
    }

    destroyNetworkChannel(name: string): boolean {
        const channel = this._channels.get(name);
        if (!channel) return false;
        channel.close();
        this._channels.delete(name);
        return true;
    }

    sendPacket<T extends Packet>(channelName: string, packet: T): boolean {
        const channel = this._channels.get(channelName);
        if (!channel) return false;
        return channel.send(packet);
    }

    // ── HTTP ──────────────────────────────────────────────────────────────

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

        const init: RequestInit = { method, headers, signal: controller.signal };

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

    update(elapseSeconds: number, _realElapseSeconds: number): void {
        this._channels.forEach(ch => ch.update(elapseSeconds));
    }

    shutdown(): void {
        this._channels.forEach(ch => ch.close());
        this._channels.clear();
    }
}
