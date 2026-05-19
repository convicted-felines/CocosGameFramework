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
    @property({ type: Number, tooltip: '事件池模式（位掩码）：1=AllowNoHandler 2=AllowMultiHandler 4=AllowDuplicateHandler' })
    private _mode: number = EventPoolMode.AllowNoHandler | EventPoolMode.AllowMultiHandler;

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

    subscribe(eventId: string, handler: EventHandler, priority?: number): void {
        this._manager.subscribe(eventId, handler, priority);
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
