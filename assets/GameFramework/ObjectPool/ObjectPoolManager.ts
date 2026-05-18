import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { IObjectPoolManager } from './IObjectPoolManager';
import { IObjectPool } from './IObjectPool';
import { ObjectBase } from './ObjectBase';
import { ObjectPool } from './ObjectPool';

export class ObjectPoolManager extends GameFrameworkModule implements IObjectPoolManager {
    private _pools: Map<string, ObjectPool<any>> = new Map();
    private _autoReleaseInterval: number = 60;
    private _autoReleaseTimer: number = 0;

    get priority(): number { return 55; }
    get count(): number { return this._pools.size; }

    hasObjectPool<T extends ObjectBase>(name: string): boolean {
        return this._pools.has(name);
    }

    getObjectPool<T extends ObjectBase>(name: string): IObjectPool<T> | null {
        return (this._pools.get(name) as ObjectPool<T>) ?? null;
    }

    getAllObjectPools(): IObjectPool<any>[] {
        return Array.from(this._pools.values());
    }

    createObjectPool<T extends ObjectBase>(
        name: string,
        objectType: new (...args: any[]) => T,
        capacity: number = Infinity,
        expireTime: number = 0,
        priority: number = 0
    ): IObjectPool<T> {
        if (this._pools.has(name)) {
            throw new GameFrameworkError(`ObjectPool [${name}] already exists.`);
        }
        const pool = new ObjectPool<T>(name, objectType, capacity, expireTime, priority);
        this._pools.set(name, pool);
        return pool;
    }

    destroyObjectPool(name: string): boolean {
        const pool = this._pools.get(name);
        if (!pool) return false;
        pool.shutdown();
        this._pools.delete(name);
        return true;
    }

    release(): void {
        this._pools.forEach(pool => pool.release());
    }

    releaseAllUnused(): void {
        this._pools.forEach(pool => pool.releaseAllUnused());
    }

    update(elapseSeconds: number, _realElapseSeconds: number): void {
        this._autoReleaseTimer += elapseSeconds;
        if (this._autoReleaseTimer >= this._autoReleaseInterval) {
            this._autoReleaseTimer = 0;
            this.release();
        }
    }

    shutdown(): void {
        this._pools.forEach(pool => pool.shutdown());
        this._pools.clear();
    }
}
