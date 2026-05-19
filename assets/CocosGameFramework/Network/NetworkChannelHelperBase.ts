import { Component, _decorator } from 'cc';
import { INetworkChannelHelper, IPacketHeader } from '../../GameFramework/Network/INetworkChannelHelper';
import { INetworkChannel } from '../../GameFramework/Network/INetworkChannel';
import { Packet } from '../../GameFramework/Network/Packet';

const { ccclass } = _decorator;

/**
 * 网络频道辅助器基类。
 *
 * 继承此类并实现抽象方法，即可自定义消息包的序列化/反序列化策略与心跳逻辑。
 * 将具体实现组件挂载到场景节点后，在 NetworkComponent.createNetworkChannel 时传入。
 */
@ccclass('NetworkChannelHelperBase')
export abstract class NetworkChannelHelperBase extends Component implements INetworkChannelHelper {
    abstract readonly packetHeaderLength: number;

    abstract initialize(networkChannel: INetworkChannel): void;

    abstract shutdown(): void;

    abstract prepareForConnecting(): void;

    abstract sendHeartBeat(): boolean;

    abstract serialize<T extends Packet>(packet: T): Uint8Array | null;

    abstract deserializePacketHeader(data: Uint8Array): { header: IPacketHeader | null; customErrorData?: object };

    abstract deserializePacket(packetHeader: IPacketHeader, data: Uint8Array): { packet: Packet | null; customErrorData?: object };
}
