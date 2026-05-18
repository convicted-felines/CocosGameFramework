import { ObjectBase } from './ObjectBase';
import { IObjectPool } from './IObjectPool';

interface PoolItem<T extends ObjectBase> {
    obj: T;
    inUse: boolean;
}

export class ObjectPool<T extends ObjectBase> implements IObjectPool<T> {
    private _name: string;
    private _objectType: new (...args: any[]) => T;
    private _items: PoolItem<T>[] = [];
    private _capacity: number;
    private _expireTime: number;  // 秒，0 表示永不过期
    private _priority: number;

    constructor(
        name: string,
        objectType: new (...args: any[]) => T,
        capacity: number = Infinity,
        expireTime: number = 0,
        priority: number = 0
    ) {
        this._name = name;
        this._objectType = objectType;
        this._capacity = capacity;
        this._expireTime = expireTime;
        this._priority = priority;
    }

    get name(): string { return this._name; }
    get objectType(): new (...args: any[]) => T { return this._objectType; }
    get count(): number { return this._items.length; }
    get canSpawnCount(): number { return this._items.filter(i => !i.inUse).length; }
    get capacity(): number { return this._capacity; }
    set capacity(v: number) { this._capacity = v; }
    get expireTime(): number { return this._expireTime; }
    set expireTime(v: number) { this._expireTime = v; }
    get priority(): number { return this._priority; }
    set priority(v: number) { this._priority = v; }

    // 注册已创建的对象到池中（spawn 前先 register）
    register(obj: T, spawned: boolean): void {
        this._items.push({ obj, inUse: spawned });
    }

    spawn(name: string): T | null {
        const item = this._items.find(i => !i.inUse && !i.obj.locked && i.obj.name === name);
        if (!item) return null;
        item.inUse = true;
        item.obj.onSpawn();
        return item.obj;
    }

    unspawn(obj: T): void {
        const item = this._items.find(i => i.obj === obj);
        if (!item || !item.inUse) return;
        item.inUse = false;
        obj.onUnspawn();
    }

    setLocked(obj: T, locked: boolean): void {
        const item = this._items.find(i => i.obj === obj);
        if (item) item.obj.locked = locked;
    }

    setPriority(obj: T, priority: number): void {
        const item = this._items.find(i => i.obj === obj);
        if (item) item.obj.priority = priority;
    }

    release(): void {
        if (this._expireTime <= 0) return;
        const now = Date.now();
        const expireMs = this._expireTime * 1000;
        const toRelease = this._items.filter(
            i => !i.inUse && !i.obj.locked && (now - i.obj.lastUseTime) >= expireMs
        );
        for (const item of toRelease) {
            item.obj.onRelease(false);
            this._items.splice(this._items.indexOf(item), 1);
        }
    }

    releaseAllUnused(): void {
        const unused = this._items.filter(i => !i.inUse && !i.obj.locked);
        for (const item of unused) {
            item.obj.onRelease(false);
            this._items.splice(this._items.indexOf(item), 1);
        }
    }

    shutdown(): void {
        for (const item of this._items) {
            item.obj.onRelease(true);
        }
        this._items.length = 0;
    }
}
