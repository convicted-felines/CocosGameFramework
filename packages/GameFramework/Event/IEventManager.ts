import { BaseEventArgs } from './BaseEventArgs';

export type EventHandler = (sender: object, e: BaseEventArgs) => void;

/** 事件池模式，可按位组合 */
export enum EventPoolMode {
    Default               = 0,
    AllowNoHandler        = 1, // 允许事件没有处理函数
    AllowMultiHandler     = 2, // 允许事件有多个处理函数
    AllowDuplicateHandler = 4, // 允许事件有重复的处理函数
}

export interface IEventManager {
    readonly eventHandlerCount: number;
    /** 当前待派发的延迟事件数量 */
    readonly eventCount: number;
    /** 已注册的事件类型数量 */
    readonly registeredEventCount: number;

    /** 获取特定事件 ID 的处理函数数量 */
    count(eventId: string): number;

    /** 检查是否已订阅特定处理函数 */
    check(eventId: string, handler: EventHandler): boolean;

    subscribe(eventId: string, handler: EventHandler, priority?: number): void;
    unsubscribe(eventId: string, handler: EventHandler): void;
    unsubscribeAll(eventId: string): void;
    hasSubscriber(eventId: string, handler?: EventHandler): boolean;

    /** 延迟到下一帧 update() 派发，派发后自动释放回引用池 */
    fire(sender: object, e: BaseEventArgs): void;
    /** 立即派发，派发后自动释放回引用池 */
    fireNow(sender: object, e: BaseEventArgs): void;

    /** 清空所有待派发的延迟事件并释放回引用池 */
    clear(): void;

    setDefaultHandler(handler: EventHandler | null): void;
}
