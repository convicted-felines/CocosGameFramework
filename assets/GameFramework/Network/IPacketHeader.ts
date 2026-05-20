import { Packet } from './Packet';

/** 消息包头接口，对应原版 IPacketHeader */
export interface IPacketHeader {
    /** 消息包 ID */
    readonly id: number;
    /** 消息包体长度（字节） */
    readonly packetLength: number;
    /** 消息包头是否有效 */
    readonly isValid: boolean;
}
