import { ObjectBase } from './ObjectBase';

export interface IObjectPool<T extends ObjectBase> {
    readonly name: string;
    readonly objectType: new (...args: any[]) => T;
    readonly count: number;
    readonly canSpawnCount: number;
    capacity: number;
    expireTime: number;
    priority: number;

    spawn(name: string): T | null;
    unspawn(obj: T): void;
    setLocked(obj: T, locked: boolean): void;
    setPriority(obj: T, priority: number): void;
    release(): void;
    releaseAllUnused(): void;
}
