import { ITestCase, ITestItem } from '../TestCase';
import { GameEntry } from '../../Base/GameEntry';
import { GameEventArgs } from 'db://assets/GameFramework/Event/GameEventArgs';
import { ReferencePool } from 'db://assets/GameFramework/ReferencePool/ReferencePool';

class _TestEventArgs extends GameEventArgs {
    static readonly EventId = '__test_event__';
    get id(): string { return _TestEventArgs.EventId; }
    payload: string = '';
    clear(): void { this.payload = ''; }
}

export class EventTestCase implements ITestCase {
    readonly name = 'Event 系统';

    readonly items: ITestItem[] = [
        {
            label: '订阅并发布事件',
            run: () => new Promise<void>((resolve, reject) => {
                if (!GameEntry.Event) { reject(new Error('EventComponent 未初始化')); return; }
                let received = false;
                const handler = (_sender: object, e: GameEventArgs) => {
                    received = (e as _TestEventArgs).payload === 'hello';
                };
                GameEntry.Event.subscribe(_TestEventArgs.EventId, handler);
                const args = ReferencePool.acquire(_TestEventArgs);
                args.payload = 'hello';
                GameEntry.Event.fireNow(this, args);
                GameEntry.Event.unsubscribe(_TestEventArgs.EventId, handler);
                ReferencePool.release(args);
                received ? resolve() : reject(new Error('事件未被正确接收'));
            }),
        },
        {
            label: '取消订阅后不再触发',
            run: () => new Promise<void>((resolve, reject) => {
                if (!GameEntry.Event) { reject(new Error('EventComponent 未初始化')); return; }
                let count = 0;
                const handler = () => { count++; };
                GameEntry.Event.subscribe(_TestEventArgs.EventId, handler);
                GameEntry.Event.unsubscribe(_TestEventArgs.EventId, handler);
                const args = ReferencePool.acquire(_TestEventArgs);
                GameEntry.Event.fireNow(this, args);
                ReferencePool.release(args);
                count === 0 ? resolve() : reject(new Error(`取消订阅后仍触发了 ${count} 次`));
            }),
        },
        {
            label: 'hasSubscriber 检查',
            run: () => new Promise<void>((resolve, reject) => {
                if (!GameEntry.Event) { reject(new Error('EventComponent 未初始化')); return; }
                const handler = () => {};
                GameEntry.Event.subscribe(_TestEventArgs.EventId, handler);
                const hasBefore = GameEntry.Event.hasSubscriber(_TestEventArgs.EventId);
                GameEntry.Event.unsubscribe(_TestEventArgs.EventId, handler);
                hasBefore ? resolve() : reject(new Error('hasSubscriber 返回错误'));
            }),
        },
    ];
}
