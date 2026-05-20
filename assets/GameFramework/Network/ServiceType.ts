/** 网络服务类型，对应原版 ServiceType 枚举 */
export const enum ServiceType {
    /** TCP 服务 */
    Tcp = 0,
    /** 同步接收 TCP 服务 */
    TcpWithSyncReceive = 1,
    /** WebSocket 服务 */
    WebSocket = 2,
}
