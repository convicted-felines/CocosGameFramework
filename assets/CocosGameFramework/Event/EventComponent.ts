import { _decorator, Component } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { EventManager } from '../../GameFramework/Event/EventManager';
import { EventHandler } from '../../GameFramework/Event/IEventManager';
import { BaseEventArgs } from '../../GameFramework/Event/BaseEventArgs';

const { ccclass } = _decorator;

@ccclass('EventComponent')
export class EventComponent extends Component {
    private _manager!: EventManager;

    get manager(): EventManager { return this._manager; }

    onLoad(): void {
        this._manager = new EventManager();
        GameFrameworkEntry.registerModule(MODULE_ID.EVENT, this._manager);
    }

    get eventHandlerCount(): number { return this._manager.eventHandlerCount; }
    get eventCount(): number { return this._manager.eventCount; }

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

    setDefaultHandler(handler: EventHandler | null): void {
        this._manager.setDefaultHandler(handler);
    }
}
