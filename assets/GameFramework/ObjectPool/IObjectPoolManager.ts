import { ObjectBase } from './ObjectBase';
import { IObjectPool } from './IObjectPool';

export interface IObjectPoolManager {
    readonly count: number;

    hasObjectPool<T extends ObjectBase>(name: string): boolean;
    getObjectPool<T extends ObjectBase>(name: string): IObjectPool<T> | null;
    getAllObjectPools(): IObjectPool<any>[];

    createObjectPool<T extends ObjectBase>(
        name: string,
        objectType: new (...args: any[]) => T,
        capacity?: number,
        expireTime?: number,
        priority?: number
    ): IObjectPool<T>;

    destroyObjectPool(name: string): boolean;

    release(): void;
    releaseAllUnused(): void;
}
