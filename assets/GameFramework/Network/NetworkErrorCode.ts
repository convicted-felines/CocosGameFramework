/** 网络错误码，对应原版 NetworkErrorCode 枚举 */
export const enum NetworkErrorCode {
    /** 未知错误 */
    Unknown = 0,
    /** 地址解析失败 */
    AddressError = 1,
    /** 连接失败 */
    ConnectError = 2,
    /** 发送失败 */
    SendError = 3,
    /** 接收失败 */
    ReceiveError = 4,
    /** 消息包头错误 */
    PacketHeaderError = 5,
    /** 消息包体错误 */
    PacketError = 6,
    /** 序列化错误 */
    SerializeError = 7,
    /** 反序列化错误 */
    DeserializeError = 8,
    /** 心跳超时断开 */
    HeartBeatTimeout = 9,
    /** 自定义错误 */
    CustomError = 10,
}
