export class LinkedListNode<T> {
    value: T;
    prev: LinkedListNode<T> | null = null;
    next: LinkedListNode<T> | null = null;

    constructor(value: T) {
        this.value = value;
    }
}

export class GameFrameworkLinkedList<T> {
    private _head: LinkedListNode<T> | null = null;
    private _tail: LinkedListNode<T> | null = null;
    private _count: number = 0;
    private _cachedNodes: LinkedListNode<T>[] = [];

    get count(): number { return this._count; }
    get first(): LinkedListNode<T> | null { return this._head; }
    get last(): LinkedListNode<T> | null { return this._tail; }
    get cachedNodeCount(): number { return this._cachedNodes.length; }

    private acquireNode(value: T): LinkedListNode<T> {
        const node = this._cachedNodes.pop();
        if (node) {
            node.value = value;
            node.prev = null;
            node.next = null;
            return node;
        }
        return new LinkedListNode<T>(value);
    }

    private releaseNode(node: LinkedListNode<T>): void {
        node.value = undefined as unknown as T;
        node.prev = null;
        node.next = null;
        this._cachedNodes.push(node);
    }

    addFirst(value: T): LinkedListNode<T> {
        const node = this.acquireNode(value);
        node.next = this._head;
        if (this._head) this._head.prev = node;
        this._head = node;
        if (!this._tail) this._tail = node;
        this._count++;
        return node;
    }

    addLast(value: T): LinkedListNode<T> {
        const node = this.acquireNode(value);
        node.prev = this._tail;
        if (this._tail) this._tail.next = node;
        this._tail = node;
        if (!this._head) this._head = node;
        this._count++;
        return node;
    }

    addBefore(refNode: LinkedListNode<T>, value: T): LinkedListNode<T> {
        const node = this.acquireNode(value);
        node.next = refNode;
        node.prev = refNode.prev;
        if (refNode.prev) refNode.prev.next = node;
        else this._head = node;
        refNode.prev = node;
        this._count++;
        return node;
    }

    addAfter(refNode: LinkedListNode<T>, value: T): LinkedListNode<T> {
        const node = this.acquireNode(value);
        node.prev = refNode;
        node.next = refNode.next;
        if (refNode.next) refNode.next.prev = node;
        else this._tail = node;
        refNode.next = node;
        this._count++;
        return node;
    }

    remove(node: LinkedListNode<T>): void {
        if (node.prev) node.prev.next = node.next;
        else this._head = node.next;
        if (node.next) node.next.prev = node.prev;
        else this._tail = node.prev;
        this._count--;
        this.releaseNode(node);
    }

    removeFirst(): void {
        if (this._head) this.remove(this._head);
    }

    removeLast(): void {
        if (this._tail) this.remove(this._tail);
    }

    find(value: T): LinkedListNode<T> | null {
        let node = this._head;
        while (node) {
            if (node.value === value) return node;
            node = node.next;
        }
        return null;
    }

    contains(value: T): boolean {
        return this.find(value) !== null;
    }

    clear(): void {
        let node = this._head;
        while (node) {
            const next = node.next;
            this.releaseNode(node);
            node = next;
        }
        this._head = null;
        this._tail = null;
        this._count = 0;
    }

    clearCachedNodes(): void {
        this._cachedNodes.length = 0;
    }

    [Symbol.iterator](): Iterator<T> {
        let current = this._head;
        return {
            next(): IteratorResult<T> {
                if (current) {
                    const value = current.value;
                    current = current.next;
                    return { value, done: false };
                }
                return { value: undefined as unknown as T, done: true };
            },
        };
    }
}
