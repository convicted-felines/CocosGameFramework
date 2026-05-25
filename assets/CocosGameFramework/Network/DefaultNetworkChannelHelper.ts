import { _decorator } from 'cc';
import { IPacketHeader } from '../../GameFramework/Network/INetworkChannelHelper';
import { INetworkChannel } from '../../GameFramework/Network/INetworkChannel';
import { Packet } from '../../GameFramework/Network/Packet';
import { NetworkChannelHelperBase } from './NetworkChannelHelperBase';
import { HelperRegistry } from '../Utility/HelperRegistry';

const { ccclass, property } = _decorator;

/** 默认包头：4 字节大端 uint32 表示 payload 长度。 */
class DefaultPacketHeader implements IPacketHeader {
    constructor(readonly packetLength: number) {}
}

/**
 * 默认网络频道辅助器。
 *
 * 协议格式（二进制帧，适合 WebSocket binaryType = 'arraybuffer'）：
 *   [4 字节大端 uint32: payload 长度] [payload: UTF-8 JSON]
 *
 * JSON payload 结构：
 *   { id: string, data: any }
 *   - id    对应 Packet 子类的 eventId 静态字段，用于接收端路由分发
 *   - data  由具体 Packet 子类的 toJSON() 返回（默认取自身可枚举属性）
 *
 * 心跳：发送空 JSON 对象 {}，packetLength 为其 UTF-8 编码长度。
 */
@ccclass('DefaultNetworkChannelHelper')
export class DefaultNetworkChannelHelper extends NetworkChannelHelperBase {
    /** 包头固定占 4 字节（uint32 payload 长度）。 */
    readonly packetHeaderLength: number = 4;

    /** 心跳间隔（秒），与 NetworkChannel.heartBeatInterval 保持一致即可。 */
    @property({ tooltip: '心跳发送间隔（秒）' })
    heartBeatInterval: number = 30;

    private _networkChannel: INetworkChannel | null = null;
    private _encoder = new TextEncoder();
    private _decoder = new TextDecoder('utf-8');

    initialize(networkChannel: INetworkChannel): void {
        this._networkChannel = networkChannel;
    }

    shutdown(): void {
        this._networkChannel = null;
    }

    prepareForConnecting(): void {
        // 连接前无需额外准备。
    }

    sendHeartBeat(): boolean {
        if (!this._networkChannel?.connected) return false;
        // 心跳包为空 JSON 对象，接收端可按约定忽略或回应。
        const payload = this._encoder.encode('{}');
        const frame = this._buildFrame(payload);
        return this._networkChannel.send(new HeartBeatPacket(frame));
    }

    serialize<T extends Packet>(packet: T): Uint8Array | null {
        try {
            const id = (packet.constructor as any).eventId ?? packet.id;
            const data = typeof (packet as any).toJSON === 'function'
                ? (packet as any).toJSON()
                : this._ownProperties(packet);
            const payload = this._encoder.encode(JSON.stringify({ id, data }));
            return this._buildFrame(payload);
        } catch {
            return null;
        }
    }

    deserializePacketHeader(data: Uint8Array): { header: IPacketHeader | null; customErrorData?: object } {
        if (data.length < this.packetHeaderLength) {
            return { header: null, customErrorData: { reason: 'header too short', length: data.length } };
        }
        const view = new DataView(data.buffer, data.byteOffset, this.packetHeaderLength);
        const packetLength = view.getUint32(0, false /* big-endian */);
        return { header: new DefaultPacketHeader(packetLength) };
    }

    deserializePacket(packetHeader: IPacketHeader, data: Uint8Array): { packet: Packet | null; customErrorData?: object } {
        try {
            const text = this._decoder.decode(data.slice(0, packetHeader.packetLength));
            if (text === '{}') {
                // 心跳回应，无需路由。
                return { packet: null };
            }
            const parsed = JSON.parse(text) as { id: string; data: unknown };
            return { packet: new RawJsonPacket(parsed.id, parsed.data) };
        } catch (e) {
            return { packet: null, customErrorData: { reason: 'deserialize failed', error: String(e) } };
        }
    }

    // ── 工具方法 ──────────────────────────────────────────────────────────

    private _buildFrame(payload: Uint8Array): Uint8Array {
        const frame = new Uint8Array(this.packetHeaderLength + payload.length);
        const view = new DataView(frame.buffer);
        view.setUint32(0, payload.length, false /* big-endian */);
        frame.set(payload, this.packetHeaderLength);
        return frame;
    }

    private _ownProperties(obj: object): Record<string, unknown> {
        const result: Record<string, unknown> = {};
        for (const key of Object.keys(obj)) {
            result[key] = (obj as any)[key];
        }
        return result;
    }
}

HelperRegistry.register('DefaultNetworkChannelHelper', DefaultNetworkChannelHelper);

/** 心跳发送占位包：直接携带已编码帧数据，由 NetworkChannel 原样写入 WebSocket。 */
export class HeartBeatPacket extends Packet {
    static readonly eventId = 'network.heartbeat';
    get id(): string { return HeartBeatPacket.eventId; }
    constructor(readonly frame: Uint8Array) { super(); }
    clear(): void {}
}

/**
 * 接收端通用包：携带原始 JSON 数据，业务层按 packetId 路由处理。
 * 若使用强类型包，可在注册 packet handler 时将 data 转换为具体类型。
 */
export class RawJsonPacket extends Packet {
    get id(): string { return this.packetId; }
    constructor(readonly packetId: string, readonly data: unknown) { super(); }
    clear(): void {}
}
