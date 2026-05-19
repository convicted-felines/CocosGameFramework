import { LinkedListNode } from './GameFrameworkLinkedList';
import { GameFrameworkError } from '../GameFrameworkError';

/**
 * 表示链表中 [first, terminal) 区间的一段连续节点。
 * terminal 为哨兵节点，自身不存储有效数据。
 */
export class GameFrameworkLinkedListRange<T> {
    readonly first: LinkedListNode<T>;
    readonly terminal: LinkedListNode<T>;

    constructor(first: LinkedListNode<T>, terminal: LinkedListNode<T>) {
        if (!first || !terminal || first === terminal) {
            throw new GameFrameworkError('Range is invalid.');
        }
        this.first = first;
        this.terminal = terminal;
    }

    get isValid(): boolean {
        return this.first !== null && this.terminal !== null && this.first !== this.terminal;
    }

    get count(): number {
        let count = 0;
        let cur: LinkedListNode<T> | null = this.first;
        while (cur !== null && cur !== this.terminal) {
            count++;
            cur = cur.next;
        }
        return count;
    }

    contains(value: T): boolean {
        let cur: LinkedListNode<T> | null = this.first;
        while (cur !== null && cur !== this.terminal) {
            if (cur.value === value) return true;
            cur = cur.next;
        }
        return false;
    }

    [Symbol.iterator](): Iterator<T> {
        const terminal = this.terminal;
        let cur: LinkedListNode<T> | null = this.first;
        return {
            next(): IteratorResult<T> {
                if (cur !== null && cur !== terminal) {
                    const value = cur.value;
                    cur = cur.next;
                    return { value, done: false };
                }
                return { value: undefined as unknown as T, done: true };
            },
        };
    }
}
