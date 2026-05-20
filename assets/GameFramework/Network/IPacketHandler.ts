import { IPacketHeader } from './IPacketHeader';
import { Packet } from './Packet';

/** 消息包处理器接口，对应原版 IPacketHandler */
export interface IPacketHandler {
    /** 处理器关联的消息包 ID */
    readonly id: number;

    /**
     * 处理消息包。
     * @param header 已解析的消息包头
     * @param body 消息体字节数据
     */
    handle(header: IPacketHeader, body: Uint8Array): Packet | null;
}
