import { Packet } from './Packet';
import { INetworkChannel } from './INetworkChannel';
import { IPacketHeader } from './IPacketHeader';

/** 网络频道辅助器接口，对应原版 INetworkChannelHelper */
export interface INetworkChannelHelper {
    /** 消息包头长度 */
    readonly packetHeaderLength: number;

    /** 初始化网络频道辅助器 */
    initialize(networkChannel: INetworkChannel): void;

    /** 关闭并清理网络频道辅助器 */
    shutdown(): void;

    /** 准备进行连接 */
    prepareForConnecting(): void;

    /** 发送心跳消息包，返回是否发送成功 */
    sendHeartBeat(): boolean;

    /** 序列化消息包，返回序列化后的字节数据 */
    serialize<T extends Packet>(packet: T): Uint8Array | null;

    /** 反序列化消息包头 */
    deserializePacketHeader(data: Uint8Array): { header: IPacketHeader | null; customErrorData?: object };

    /** 反序列化消息包 */
    deserializePacket(packetHeader: IPacketHeader, data: Uint8Array): { packet: Packet | null; customErrorData?: object };
}
