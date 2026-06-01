import { ObjectBase } from './ObjectBase';
import { IObjectPool, ReleaseObjectFilterCallback } from './IObjectPool';
import { ObjectInfo } from './ObjectInfo';
import { GameFrameworkError } from '../Base/GameFrameworkError';

interface PoolObject<T extends ObjectBase> {
    obj: T;
    spawnCount: number;
}

export class ObjectPool<T extends ObjectBase> implements IObjectPool<T> {
    private _name: string;
    private _objectType: new (...args: any[]) => T;
    private _allowMultiSpawn: boolean;
    private _items: PoolObject<T>[] = [];
    private _capacity: number;
    private _expireTime: number;
    private _priority: number;
    private _autoReleaseInterval: number;
    private _autoReleaseTimer: number = 0;

    constructor(
        name: string,
        objectType: new (...args: any[]) => T,
        allowMultiSpawn: boolean = false,
        autoReleaseInterval: number = 60,
        capacity: number = Infinity,
        expireTime: number = 0,
        priority: number = 0
    ) {
        this._name = name;
        this._objectType = objectType;
        this._allowMultiSpawn = allowMultiSpawn;
        this._autoReleaseInterval = autoReleaseInterval;
        this._capacity = capacity;
        this._expireTime = expireTime;
        this._priority = priority;
    }

    get name(): string { return this._name; }
    get fullName(): string { return `${this._objectType.name}.${this._name}`; }
    get objectType(): new (...args: any[]) => T { return this._objectType; }
    get count(): number { return this._items.length; }
    get allowMultiSpawn(): boolean { return this._allowMultiSpawn; }

    get canReleaseCount(): number {
        return this._items.filter(i => i.spawnCount === 0 && !i.obj.locked && i.obj.customCanReleaseFlag).length;
    }

    get autoReleaseInterval(): number { return this._autoReleaseInterval; }
    set autoReleaseInterval(v: number) { this._autoReleaseInterval = v; }

    get capacity(): number { return this._capacity; }
    set capacity(v: number) {
        this._capacity = v;
        this.release();
    }

    get expireTime(): number { return this._expireTime; }
    set expireTime(v: number) {
        this._expireTime = v;
        this.release();
    }

    get priority(): number { return this._priority; }
    set priority(v: number) { this._priority = v; }

    register(obj: T, spawned: boolean): void {
        if (obj == null) {
            throw new GameFrameworkError('Object is invalid.');
        }
        const item: PoolObject<T> = { obj, spawnCount: spawned ? 1 : 0 };
        this._items.push(item);
        if (!spawned && this._items.length > this._capacity) {
            this.release();
        }
    }

    canSpawn(): boolean;
    canSpawn(name: string): boolean;
    canSpawn(name?: string): boolean {
        if (name === undefined) {
            return this._items.some(i => (this._allowMultiSpawn || i.spawnCount === 0) && !i.obj.locked);
        }
        return this._items.some(i => i.obj.name === name && (this._allowMultiSpawn || i.spawnCount === 0) && !i.obj.locked);
    }

    spawn(): T | null;
    spawn(name: string): T | null;
    spawn(name?: string): T | null {
        const n = name ?? '';
        const item = this._items.find(
            i => i.obj.name === n && (this._allowMultiSpawn || i.spawnCount === 0) && !i.obj.locked
        );
        if (!item) return null;
        item.spawnCount++;
        item.obj._updateLastUseTime();
        item.obj.onSpawn();
        return item.obj;
    }

    unspawn(obj: T): void;
    unspawn(target: object): void;
    unspawn(objOrTarget: T | object): void {
        const item = this._findItem(objOrTarget);
        if (!item) {
            throw new GameFrameworkError('Can not find target in object pool.');
        }
        item.obj.onUnspawn();
        item.obj._updateLastUseTime();
        item.spawnCount--;
        if (item.spawnCount < 0) item.spawnCount = 0;
        if (this._items.length > this._capacity) {
            this.release();
        }
    }

    setLocked(obj: T, locked: boolean): void;
    setLocked(target: object, locked: boolean): void;
    setLocked(objOrTarget: T | object, locked: boolean): void {
        const item = this._findItem(objOrTarget);
        if (!item) {
            throw new GameFrameworkError('Can not find target in object pool.');
        }
        item.obj.locked = locked;
    }

    setPriority(obj: T, priority: number): void;
    setPriority(target: object, priority: number): void;
    setPriority(objOrTarget: T | object, priority: number): void {
        const item = this._findItem(objOrTarget);
        if (!item) {
            throw new GameFrameworkError('Can not find target in object pool.');
        }
        item.obj.priority = priority;
    }

    releaseObject(obj: T): boolean;
    releaseObject(target: object): boolean;
    releaseObject(objOrTarget: T | object): boolean {
        const item = this._findItem(objOrTarget);
        if (!item || item.spawnCount > 0 || item.obj.locked || !item.obj.customCanReleaseFlag) {
            return false;
        }
        item.obj.release(false);
        this._items.splice(this._items.indexOf(item), 1);
        return true;
    }

    release(): void;
    release(toReleaseCount: number): void;
    release(releaseObjectFilterCallback: ReleaseObjectFilterCallback<T>): void;
    release(toReleaseCount: number, releaseObjectFilterCallback: ReleaseObjectFilterCallback<T>): void;
    release(
        toReleaseCountOrFilter?: number | ReleaseObjectFilterCallback<T>,
        releaseObjectFilterCallback?: ReleaseObjectFilterCallback<T>
    ): void {
        let toReleaseCount: number;
        let filter: ReleaseObjectFilterCallback<T>;

        if (typeof toReleaseCountOrFilter === 'number') {
            toReleaseCount = toReleaseCountOrFilter;
            filter = releaseObjectFilterCallback ?? this._defaultReleaseFilter.bind(this);
        } else if (typeof toReleaseCountOrFilter === 'function') {
            toReleaseCount = this._items.length - this._capacity;
            filter = toReleaseCountOrFilter;
        } else {
            toReleaseCount = this._items.length - this._capacity;
            filter = this._defaultReleaseFilter.bind(this);
        }

        if (toReleaseCount <= 0) return;

        const candidates = this._items.filter(
            i => i.spawnCount === 0 && !i.obj.locked && i.obj.customCanReleaseFlag
        ).map(i => i.obj);

        if (candidates.length === 0) return;

        const expireTime = this._expireTime > 0 ? Date.now() - this._expireTime * 1000 : 0;
        const toRelease = filter(candidates, toReleaseCount, expireTime);

        for (const obj of toRelease) {
            const idx = this._items.findIndex(i => i.obj === obj);
            if (idx >= 0) {
                obj.release(false);
                this._items.splice(idx, 1);
            }
        }
    }

    releaseAllUnused(): void {
        const now = Date.now();
        const expireMs = this._expireTime > 0 ? this._expireTime * 1000 : 0;
        const toRelease = this._items.filter(i => {
            if (i.spawnCount > 0 || i.obj.locked || !i.obj.customCanReleaseFlag) return false;
            if (expireMs > 0 && (now - i.obj.lastUseTime) < expireMs) return false;
            return true;
        });
        for (const item of toRelease) {
            item.obj.release(false);
            this._items.splice(this._items.indexOf(item), 1);
        }
    }

    getAllObjectInfos(): ObjectInfo[] {
        return this._items.map(i => new ObjectInfo(
            i.obj.name,
            i.obj.locked,
            i.obj.customCanReleaseFlag,
            i.obj.priority,
            i.obj.lastUseTime,
            i.spawnCount
        ));
    }

    update(elapseSeconds: number, _realElapseSeconds: number): void {
        this._autoReleaseTimer += elapseSeconds;
        if (this._autoReleaseTimer >= this._autoReleaseInterval) {
            this._autoReleaseTimer = 0;
            this.release();
        }
    }

    shutdown(): void {
        for (const item of this._items) {
            item.obj.release(true);
        }
        this._items.length = 0;
    }

    private _findItem(objOrTarget: T | object): PoolObject<T> | undefined {
        if (objOrTarget instanceof ObjectBase) {
            return this._items.find(i => i.obj === objOrTarget);
        }
        return this._items.find(i => i.obj.target === objOrTarget);
    }

    private _defaultReleaseFilter(candidates: T[], toReleaseCount: number, expireTime: number): T[] {
        const result: T[] = [];
        // 先收集过期的
        const expired = expireTime > 0 ? candidates.filter(o => o.lastUseTime <= expireTime) : [];
        for (const o of expired) {
            if (result.length >= toReleaseCount) break;
            result.push(o);
        }
        if (result.length >= toReleaseCount) return result;

        // 剩余按优先级升序、最后使用时间升序排序
        const remaining = candidates.filter(o => !result.includes(o));
        remaining.sort((a, b) => a.priority !== b.priority ? a.priority - b.priority : a.lastUseTime - b.lastUseTime);
        for (const o of remaining) {
            if (result.length >= toReleaseCount) break;
            result.push(o);
        }
        return result;
    }
}
