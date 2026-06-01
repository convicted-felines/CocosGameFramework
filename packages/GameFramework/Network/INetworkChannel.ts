import { Packet } from './Packet';

/** 网络频道接口，对应原版 INetworkChannel */
export interface INetworkChannel {
    /** 频道名称 */
    readonly name: string;

    /** 是否已连接 */
    readonly connected: boolean;

    /** 已发送但未收到回执的消息包数量 */
    readonly sendPacketCount: number;

    /** 累计已发送消息包数量 */
    readonly sentPacketCount: number;

    /** 已接收但尚未处理的消息包数量 */
    readonly receivePacketCount: number;

    /** 累计已接收消息包数量 */
    readonly receivedPacketCount: number;

    /** 收到任意消息包时是否重置心跳计时 */
    resetHeartBeatElapseSecondsWhenReceivePacket: boolean;

    /** 丢失心跳次数 */
    readonly missHeartBeatCount: number;

    /** 心跳间隔（秒） */
    heartBeatInterval: number;

    /** 当前心跳计时（秒） */
    readonly heartBeatElapseSeconds: number;

    /** 连接到远端 */
    connect(url: string, userData?: object): void;

    /** 关闭频道 */
    close(): void;

    /** 发送消息包 */
    send<T extends Packet>(packet: T): boolean;
}
