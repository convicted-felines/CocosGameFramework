import { _decorator } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { EventManager } from '../../GameFramework/Event/EventManager';
import { EventHandler, EventPoolMode } from '../../GameFramework/Event/IEventManager';
import { BaseEventArgs } from '../../GameFramework/Event/BaseEventArgs';

const { ccclass, property } = _decorator;

@ccclass('EventComponent')
export class EventComponent extends GameFrameworkComponent {
    @property({ tooltip: '允许事件没有处理函数' })
    allowNoHandler: boolean = true;

    @property({ tooltip: '允许事件有多个处理函数' })
    allowMultiHandler: boolean = true;

    @property({ tooltip: '允许事件有重复的处理函数' })
    allowDuplicateHandler: boolean = false;

    private get _mode(): number {
        let mode = EventPoolMode.Default;
        if (this.allowNoHandler) mode |= EventPoolMode.AllowNoHandler;
        if (this.allowMultiHandler) mode |= EventPoolMode.AllowMultiHandler;
        if (this.allowDuplicateHandler) mode |= EventPoolMode.AllowDuplicateHandler;
        return mode;
    }

    private _manager!: EventManager;

    get manager(): EventManager { return this._manager; }

    onLoad(): void {
        super.onLoad();
        this._manager = new EventManager(this._mode);
        GameFrameworkEntry.registerModule(MODULE_ID.EVENT, this._manager);
    }

    get eventHandlerCount(): number { return this._manager.eventHandlerCount; }
    get eventCount(): number { return this._manager.eventCount; }
    get registeredEventCount(): number { return this._manager.registeredEventCount; }

    count(eventId: string): number {
        return this._manager.count(eventId);
    }

    check(eventId: string, handler: EventHandler): boolean {
        return this._manager.check(eventId, handler);
    }

    subscribe(eventId: string, handler: EventHandler, target?: object, priority?: number): void {
        this._manager.subscribe(eventId, handler?.bind(target), priority);
    }

    unsubscribe(eventId: string, handler: EventHandler): void {
        this._manager.unsubscribe(eventId, handler);
    }

    unsubscribeAll(eventId: string): void {
        this._manager.unsubscribeAll(eventId);
    }

    hasSubscriber(eventId: string, handler?: EventHandler): boolean {
        return this._manager.hasSubscriber(eventId, handler);
    }

    fire(sender: object, e: BaseEventArgs): void {
        this._manager.fire(sender, e);
    }

    fireNow(sender: object, e: BaseEventArgs): void {
        this._manager.fireNow(sender, e);
    }

    clear(): void {
        this._manager.clear();
    }

    setDefaultHandler(handler: EventHandler | null): void {
        this._manager.setDefaultHandler(handler);
    }
}
