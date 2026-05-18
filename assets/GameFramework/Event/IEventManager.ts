import { BaseEventArgs } from './BaseEventArgs';

export type EventHandler = (sender: object, e: BaseEventArgs) => void;

export interface IEventManager {
    readonly eventHandlerCount: number;
    readonly eventCount: number;

    subscribe(eventId: string, handler: EventHandler, priority?: number): void;
    unsubscribe(eventId: string, handler: EventHandler): void;
    unsubscribeAll(eventId: string): void;
    hasSubscriber(eventId: string, handler?: EventHandler): boolean;

    // 延迟到下一帧 update() 派发，派发后自动 ReferencePool.release(e)
    fire(sender: object, e: BaseEventArgs): void;
    // 立即派发，派发后自动 ReferencePool.release(e)
    fireNow(sender: object, e: BaseEventArgs): void;

    setDefaultHandler(handler: EventHandler | null): void;
}
