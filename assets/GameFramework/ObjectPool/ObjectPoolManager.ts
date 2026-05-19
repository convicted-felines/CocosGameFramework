import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { IObjectPoolManager } from './IObjectPoolManager';
import { IObjectPool } from './IObjectPool';
import { ObjectBase } from './ObjectBase';
import { ObjectPool } from './ObjectPool';

export class ObjectPoolManager extends GameFrameworkModule implements IObjectPoolManager {
    private _pools: Map<string, ObjectPool<any>> = new Map();

    get priority(): number { return 55; }
    get count(): number { return this._pools.size; }

    private _makeKey(objectType: new (...args: any[]) => any, name: string = ''): string {
        return `${objectType.name}.${name}`;
    }

    hasObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name: string = ''): boolean {
        return this._pools.has(this._makeKey(objectType, name));
    }

    getObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name: string = ''): IObjectPool<T> | null {
        return (this._pools.get(this._makeKey(objectType, name)) as ObjectPool<T>) ?? null;
    }

    getAllObjectPools(): IObjectPool<any>[];
    getAllObjectPools(sort: boolean): IObjectPool<any>[];
    getAllObjectPools(sort: boolean = false): IObjectPool<any>[] {
        const pools = Array.from(this._pools.values());
        if (sort) {
            pools.sort((a, b) => b.priority - a.priority);
        }
        return pools;
    }

    createSingleSpawnObjectPool<T extends ObjectBase>(
        objectType: new (...args: any[]) => T,
        name: string = '',
        autoReleaseInterval: number = 60,
        capacity: number = Infinity,
        expireTime: number = 0,
        priority: number = 0
    ): IObjectPool<T> {
        return this._createObjectPool(objectType, false, name, autoReleaseInterval, capacity, expireTime, priority);
    }

    createMultiSpawnObjectPool<T extends ObjectBase>(
        objectType: new (...args: any[]) => T,
        name: string = '',
        autoReleaseInterval: number = 60,
        capacity: number = Infinity,
        expireTime: number = 0,
        priority: number = 0
    ): IObjectPool<T> {
        return this._createObjectPool(objectType, true, name, autoReleaseInterval, capacity, expireTime, priority);
    }

    private _createObjectPool<T extends ObjectBase>(
        objectType: new (...args: any[]) => T,
        allowMultiSpawn: boolean,
        name: string,
        autoReleaseInterval: number,
        capacity: number,
        expireTime: number,
        priority: number
    ): IObjectPool<T> {
        const key = this._makeKey(objectType, name);
        if (this._pools.has(key)) {
            throw new GameFrameworkError(`Object pool '${key}' already exists.`);
        }
        const pool = new ObjectPool<T>(name, objectType, allowMultiSpawn, autoReleaseInterval, capacity, expireTime, priority);
        this._pools.set(key, pool);
        return pool;
    }

    destroyObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name: string = ''): boolean {
        const key = this._makeKey(objectType, name);
        const pool = this._pools.get(key);
        if (!pool) return false;
        pool.shutdown();
        this._pools.delete(key);
        return true;
    }

    release(): void {
        this._pools.forEach(pool => pool.release());
    }

    releaseAllUnused(): void {
        this._pools.forEach(pool => pool.releaseAllUnused());
    }

    update(elapseSeconds: number, realElapseSeconds: number): void {
        this._pools.forEach(pool => pool.update(elapseSeconds, realElapseSeconds));
    }

    shutdown(): void {
        this._pools.forEach(pool => pool.shutdown());
        this._pools.clear();
    }
}
