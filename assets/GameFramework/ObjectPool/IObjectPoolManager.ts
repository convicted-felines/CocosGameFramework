import { ObjectBase } from './ObjectBase';
import { IObjectPool } from './IObjectPool';

export interface IObjectPoolManager {
    readonly count: number;

    hasObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T): boolean;
    hasObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name: string): boolean;

    getObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T): IObjectPool<T> | null;
    getObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name: string): IObjectPool<T> | null;

    getAllObjectPools(): IObjectPool<any>[];
    getAllObjectPools(sort: boolean): IObjectPool<any>[];

    createSingleSpawnObjectPool<T extends ObjectBase>(
        objectType: new (...args: any[]) => T,
        name?: string,
        autoReleaseInterval?: number,
        capacity?: number,
        expireTime?: number,
        priority?: number
    ): IObjectPool<T>;

    createMultiSpawnObjectPool<T extends ObjectBase>(
        objectType: new (...args: any[]) => T,
        name?: string,
        autoReleaseInterval?: number,
        capacity?: number,
        expireTime?: number,
        priority?: number
    ): IObjectPool<T>;

    destroyObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name?: string): boolean;

    release(): void;
    releaseAllUnused(): void;
}
