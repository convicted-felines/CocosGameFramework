import { ObjectBase } from './ObjectBase';
import { ObjectInfo } from './ObjectInfo';

export type ReleaseObjectFilterCallback<T extends ObjectBase> = (candidateObjects: T[], toReleaseCount: number, expireTime: number) => T[];

export interface IObjectPool<T extends ObjectBase> {
    readonly name: string;
    readonly fullName: string;
    readonly objectType: new (...args: any[]) => T;
    readonly count: number;
    readonly canReleaseCount: number;
    readonly allowMultiSpawn: boolean;
    autoReleaseInterval: number;
    capacity: number;
    expireTime: number;
    priority: number;

    register(obj: T, spawned: boolean): void;

    canSpawn(): boolean;
    canSpawn(name: string): boolean;

    spawn(): T | null;
    spawn(name: string): T | null;

    unspawn(obj: T): void;
    unspawn(target: object): void;

    setLocked(obj: T, locked: boolean): void;
    setLocked(target: object, locked: boolean): void;

    setPriority(obj: T, priority: number): void;
    setPriority(target: object, priority: number): void;

    releaseObject(obj: T): boolean;
    releaseObject(target: object): boolean;

    release(): void;
    release(toReleaseCount: number): void;
    release(releaseObjectFilterCallback: ReleaseObjectFilterCallback<T>): void;
    release(toReleaseCount: number, releaseObjectFilterCallback: ReleaseObjectFilterCallback<T>): void;

    releaseAllUnused(): void;

    getAllObjectInfos(): ObjectInfo[];
}
