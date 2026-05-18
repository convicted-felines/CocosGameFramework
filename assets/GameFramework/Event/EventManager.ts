import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { ReferencePool } from '../ReferencePool/ReferencePool';
import { IEventManager, EventHandler } from './IEventManager';
import { BaseEventArgs } from './BaseEventArgs';

interface HandlerNode {
    handler: EventHandler;
    priority: number;
}

interface DeferredEvent {
    sender: object;
    e: BaseEventArgs;
}

export class EventManager extends GameFrameworkModule implements IEventManager {
    private _handlers: Map<string, HandlerNode[]> = new Map();
    private _deferredQueue: DeferredEvent[] = [];
    private _processingQueue: DeferredEvent[] = [];
    private _defaultHandler: EventHandler | null = null;

    get priority(): number { return 100; }

    get eventHandlerCount(): number {
        let count = 0;
        this._handlers.forEach(list => count += list.length);
        return count;
    }

    get eventCount(): number {
        return this._handlers.size;
    }

    subscribe(eventId: string, handler: EventHandler, priority: number = 0): void {
        let list = this._handlers.get(eventId);
        if (!list) {
            list = [];
            this._handlers.set(eventId, list);
        }
        if (list.some(n => n.handler === handler)) {
            throw new GameFrameworkError(`Event [${eventId}] handler already subscribed.`);
        }
        const node: HandlerNode = { handler, priority };
        let inserted = false;
        for (let i = 0; i < list.length; i++) {
            if (priority > list[i].priority) {
                list.splice(i, 0, node);
                inserted = true;
                break;
            }
        }
        if (!inserted) list.push(node);
    }

    unsubscribe(eventId: string, handler: EventHandler): void {
        const list = this._handlers.get(eventId);
        if (!list) return;
        const idx = list.findIndex(n => n.handler === handler);
        if (idx >= 0) list.splice(idx, 1);
    }

    unsubscribeAll(eventId: string): void {
        this._handlers.delete(eventId);
    }

    hasSubscriber(eventId: string, handler?: EventHandler): boolean {
        const list = this._handlers.get(eventId);
        if (!list || list.length === 0) return false;
        if (handler === undefined) return true;
        return list.some(n => n.handler === handler);
    }

    fire(sender: object, e: BaseEventArgs): void {
        this._deferredQueue.push({ sender, e });
    }

    fireNow(sender: object, e: BaseEventArgs): void {
        this._dispatch(sender, e);
        ReferencePool.release(e);
    }

    setDefaultHandler(handler: EventHandler | null): void {
        this._defaultHandler = handler;
    }

    update(elapseSeconds: number, _realElapseSeconds: number): void {
        // 交换队列以避免派发时新入队的事件被本帧处理
        const tmp = this._processingQueue;
        this._processingQueue = this._deferredQueue;
        this._deferredQueue = tmp;

        for (const { sender, e } of this._processingQueue) {
            this._dispatch(sender, e);
            ReferencePool.release(e);
        }
        this._processingQueue.length = 0;
    }

    shutdown(): void {
        this._handlers.clear();
        this._deferredQueue.length = 0;
        this._processingQueue.length = 0;
        this._defaultHandler = null;
    }

    private _dispatch(sender: object, e: BaseEventArgs): void {
        const list = this._handlers.get(e.id);
        if (list && list.length > 0) {
            // 快照防止派发中途 unsubscribe 导致数组变化
            const snapshot = list.slice();
            for (const node of snapshot) {
                node.handler(sender, e);
            }
        } else if (this._defaultHandler) {
            this._defaultHandler(sender, e);
        }
    }
}
