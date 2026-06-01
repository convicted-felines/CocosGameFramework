import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { ReferencePool } from '../ReferencePool/ReferencePool';
import { IEventManager, EventHandler, EventPoolMode } from './IEventManager';
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
    private readonly _mode: EventPoolMode;
    private _handlers: Map<string, HandlerNode[]> = new Map();
    private _deferredQueue: DeferredEvent[] = [];
    private _processingQueue: DeferredEvent[] = [];
    private _defaultHandler: EventHandler | null = null;

    /**
     * 派发过程中记录各事件参数对象的下一个待调用索引。
     * 用于在处理函数内安全地 subscribe / unsubscribe，避免漏调或重复调用。
     */
    private _cachedIndices: Map<BaseEventArgs, number> = new Map();

    constructor(mode: EventPoolMode = EventPoolMode.AllowNoHandler | EventPoolMode.AllowMultiHandler) {
        super();
        this._mode = mode;
    }

    /** 对应原版 EventManager，优先级为 7 */
    get priority(): number { return 7; }

    get eventHandlerCount(): number {
        let count = 0;
        this._handlers.forEach(list => (count += list.length));
        return count;
    }

    /** 当前待派发的延迟事件数量（对应原版 EventPool.EventCount） */
    get eventCount(): number {
        return this._deferredQueue.length;
    }

    /** 已注册的事件类型数量 */
    get registeredEventCount(): number {
        return this._handlers.size;
    }

    count(eventId: string): number {
        return this._handlers.get(eventId)?.length ?? 0;
    }

    check(eventId: string, handler: EventHandler): boolean {
        if (!handler) throw new GameFrameworkError('Event handler is invalid.');
        return this._handlers.get(eventId)?.some(n => n.handler === handler) ?? false;
    }

    subscribe(eventId: string, handler: EventHandler, priority: number = 0): void {
        if (!handler) throw new GameFrameworkError('Event handler is invalid.');

        let list = this._handlers.get(eventId);
        if (!list) {
            list = [];
            this._handlers.set(eventId, list);
        } else if ((this._mode & EventPoolMode.AllowMultiHandler) === 0) {
            throw new GameFrameworkError(`Event [${eventId}] not allow multi handler.`);
        } else if ((this._mode & EventPoolMode.AllowDuplicateHandler) === 0 && this.check(eventId, handler)) {
            throw new GameFrameworkError(`Event [${eventId}] not allow duplicate handler.`);
        }

        const node: HandlerNode = { handler, priority };
        let insertIdx = list.length;
        for (let i = 0; i < list.length; i++) {
            if (priority > list[i].priority) {
                insertIdx = i;
                break;
            }
        }
        list.splice(insertIdx, 0, node);

        // 若正在派发该事件，插入点在已处理位置之前时需右移缓存索引，防止重复调用
        for (const [e, nextIdx] of this._cachedIndices) {
            if (e.id === eventId && nextIdx > insertIdx) {
                this._cachedIndices.set(e, nextIdx + 1);
            }
        }
    }

    unsubscribe(eventId: string, handler: EventHandler): void {
        if (!handler) throw new GameFrameworkError('Event handler is invalid.');

        const list = this._handlers.get(eventId);
        if (!list) {
            throw new GameFrameworkError(`Event [${eventId}] not exists specified handler.`);
        }
        const idx = list.findIndex(n => n.handler === handler);
        if (idx < 0) {
            throw new GameFrameworkError(`Event [${eventId}] not exists specified handler.`);
        }

        // 若正在派发该事件，移除点在待调用范围内时需左移缓存索引，防止跳过处理函数
        for (const [e, nextIdx] of this._cachedIndices) {
            if (e.id === eventId && nextIdx > idx) {
                this._cachedIndices.set(e, nextIdx - 1);
            }
        }

        list.splice(idx, 1);
    }

    unsubscribeAll(eventId: string): void {
        const list = this._handlers.get(eventId);
        if (list) {
            // 清空数组内容，正在进行的派发循环会因 list.length === 0 而立即退出
            list.length = 0;
        }
        this._handlers.delete(eventId);
    }

    hasSubscriber(eventId: string, handler?: EventHandler): boolean {
        const list = this._handlers.get(eventId);
        if (!list || list.length === 0) return false;
        if (handler === undefined) return true;
        return list.some(n => n.handler === handler);
    }

    fire(sender: object, e: BaseEventArgs): void {
        if (!e) throw new GameFrameworkError('Event is invalid.');
        this._deferredQueue.push({ sender, e });
    }

    fireNow(sender: object, e: BaseEventArgs): void {
        if (!e) throw new GameFrameworkError('Event is invalid.');
        this._handleEvent(sender, e);
    }

    clear(): void {
        for (const { e } of this._deferredQueue) {
            ReferencePool.release(e);
        }
        this._deferredQueue.length = 0;
    }

    setDefaultHandler(handler: EventHandler | null): void {
        this._defaultHandler = handler;
    }

    update(_elapseSeconds: number, _realElapseSeconds: number): void {
        // 交换队列，避免派发期间新入队的事件被本帧处理
        const tmp = this._processingQueue;
        this._processingQueue = this._deferredQueue;
        this._deferredQueue = tmp;

        for (const { sender, e } of this._processingQueue) {
            this._handleEvent(sender, e);
        }
        this._processingQueue.length = 0;
    }

    shutdown(): void {
        this.clear();
        this._handlers.clear();
        this._processingQueue.length = 0;
        this._cachedIndices.clear();
        this._defaultHandler = null;
    }

    private _handleEvent(sender: object, e: BaseEventArgs): void {
        const list = this._handlers.get(e.id);
        let noHandlerException = false;

        if (list && list.length > 0) {
            // 使用 cachedIndices 在派发期间安全地支持 subscribe / unsubscribe
            let i = 0;
            this._cachedIndices.set(e, 0);
            while (i < list.length) {
                this._cachedIndices.set(e, i + 1);
                list[i].handler(sender, e);
                i = this._cachedIndices.get(e)!;
            }
            this._cachedIndices.delete(e);
        } else if (this._defaultHandler) {
            this._defaultHandler(sender, e);
        } else if ((this._mode & EventPoolMode.AllowNoHandler) === 0) {
            noHandlerException = true;
        }

        ReferencePool.release(e);

        if (noHandlerException) {
            throw new GameFrameworkError(`Event [${e.id}] not allow no handler.`);
        }
    }
}
