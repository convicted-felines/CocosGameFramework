import { GameFrameworkLinkedList, LinkedListNode } from './GameFrameworkLinkedList';
import { GameFrameworkLinkedListRange } from './GameFrameworkLinkedListRange';

/**
 * 一键多值字典。每个键对应链表中连续的一段节点（不含尾哨兵）。
 * 内部维护一条共享链表，各键的数据段之间用独立的哨兵节点分隔。
 */
export class GameFrameworkMultiDictionary<TKey, TValue> {
    private readonly _linkedList = new GameFrameworkLinkedList<TValue>();
    // 每个键存储 { dataFirst, terminal } — dataFirst 可随删除而更新
    private readonly _map = new Map<TKey, { dataFirst: LinkedListNode<TValue> | null; terminal: LinkedListNode<TValue> }>();

    get count(): number { return this._map.size; }

    containsKey(key: TKey): boolean {
        return this._map.has(key);
    }

    contains(key: TKey, value: TValue): boolean {
        const entry = this._map.get(key);
        if (!entry || !entry.dataFirst) return false;
        let cur: LinkedListNode<TValue> | null = entry.dataFirst;
        while (cur !== null && cur !== entry.terminal) {
            if (cur.value === value) return true;
            cur = cur.next;
        }
        return false;
    }

    /** 获取 key 对应的范围快照（不存在或为空时返回 undefined）。 */
    get(key: TKey): GameFrameworkLinkedListRange<TValue> | undefined {
        const entry = this._map.get(key);
        if (!entry || !entry.dataFirst) return undefined;
        return new GameFrameworkLinkedListRange(entry.dataFirst, entry.terminal);
    }

    add(key: TKey, value: TValue): void {
        const entry = this._map.get(key);
        if (entry) {
            const node = this._linkedList.addBefore(entry.terminal, value);
            // 若之前无数据节点，dataFirst 指向新节点
            if (!entry.dataFirst) entry.dataFirst = node;
        } else {
            const terminal = this._linkedList.addLast(value as unknown as TValue);
            // terminal 是哨兵，不存值；先占位，再在它前面插入真实数据
            // 实际: 先加 terminal 哨兵（空），再在它前插入数据节点
            const dataNode = this._linkedList.addBefore(terminal, value);
            this._map.set(key, { dataFirst: dataNode, terminal });
        }
    }

    remove(key: TKey, value: TValue): boolean {
        const entry = this._map.get(key);
        if (!entry || !entry.dataFirst) return false;
        let cur: LinkedListNode<TValue> | null = entry.dataFirst;
        while (cur !== null && cur !== entry.terminal) {
            if (cur.value === value) {
                const isFirst = cur === entry.dataFirst;
                const next = cur.next;
                this._linkedList.remove(cur);
                if (isFirst) {
                    // 更新 dataFirst；若移除后紧邻 terminal，则该键无数据
                    entry.dataFirst = (next !== entry.terminal) ? next : null;
                }
                return true;
            }
            cur = cur.next;
        }
        return false;
    }

    removeAll(key: TKey): boolean {
        const entry = this._map.get(key);
        if (!entry) return false;
        let cur: LinkedListNode<TValue> | null = entry.dataFirst;
        while (cur !== null && cur !== entry.terminal) {
            const next = cur.next;
            this._linkedList.remove(cur);
            cur = next;
        }
        this._linkedList.remove(entry.terminal);
        this._map.delete(key);
        return true;
    }

    clear(): void {
        this._map.clear();
        this._linkedList.clear();
    }

    [Symbol.iterator](): IterableIterator<[TKey, GameFrameworkLinkedListRange<TValue>]> {
        const entries: [TKey, GameFrameworkLinkedListRange<TValue>][] = [];
        this._map.forEach((entry, key) => {
            if (entry.dataFirst) {
                entries.push([key, new GameFrameworkLinkedListRange(entry.dataFirst, entry.terminal)]);
            }
        });
        return entries[Symbol.iterator]();
    }
}
