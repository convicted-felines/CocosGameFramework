import { IReference } from './IReference';
import { ReferencePoolInfo } from './ReferencePoolInfo';

class ReferenceCollection<T extends IReference> {
    private _pool: T[] = [];
    private _ctor: new () => T;
    private _getStrictCheck: () => boolean;

    usingReferenceCount: number = 0;
    acquireReferenceCount: number = 0;
    releaseReferenceCount: number = 0;
    addReferenceCount: number = 0;
    removeReferenceCount: number = 0;

    constructor(ctor: new () => T, getStrictCheck: () => boolean) {
        this._ctor = ctor;
        this._getStrictCheck = getStrictCheck;
    }

    get unusedReferenceCount(): number {
        return this._pool.length;
    }

    acquire(): T {
        this.usingReferenceCount++;
        this.acquireReferenceCount++;
        if (this._pool.length > 0) {
            return this._pool.pop()!;
        }
        this.addReferenceCount++;
        return new this._ctor();
    }

    release(ref: T): void {
        ref.clear();
        if (this._getStrictCheck() && this._pool.indexOf(ref) >= 0) {
            throw new Error(`[ReferencePool] Reference '${this._ctor.name}' is already in the pool (double release).`);
        }
        this._pool.push(ref);
        this.releaseReferenceCount++;
        this.usingReferenceCount--;
    }

    add(count: number): void {
        this.addReferenceCount += count;
        for (let i = 0; i < count; i++) {
            this._pool.push(new this._ctor());
        }
    }

    remove(count: number): void {
        const actual = Math.min(count, this._pool.length);
        this.removeReferenceCount += actual;
        this._pool.splice(this._pool.length - actual, actual);
    }

    removeAll(): void {
        this.removeReferenceCount += this._pool.length;
        this._pool.length = 0;
    }

    getInfo(type: Function): ReferencePoolInfo {
        return new ReferencePoolInfo(
            type,
            this.unusedReferenceCount,
            this.usingReferenceCount,
            this.acquireReferenceCount,
            this.releaseReferenceCount,
            this.addReferenceCount,
            this.removeReferenceCount
        );
    }
}

export class ReferencePool {
    private static _collections: Map<Function, ReferenceCollection<any>> = new Map();
    private static _enableStrictCheck: boolean = false;

    static get enableStrictCheck(): boolean {
        return this._enableStrictCheck;
    }

    static set enableStrictCheck(value: boolean) {
        this._enableStrictCheck = value;
    }

    static get count(): number {
        return this._collections.size;
    }

    static getAllReferencePoolInfos(): ReferencePoolInfo[] {
        const infos: ReferencePoolInfo[] = [];
        this._collections.forEach((col, type) => {
            infos.push(col.getInfo(type));
        });
        return infos;
    }

    static acquire<T extends IReference>(ctor: new () => T): T {
        if (this._enableStrictCheck) {
            this._internalCheckReferenceType(ctor);
        }
        return this._getOrCreate(ctor).acquire();
    }

    static release<T extends IReference>(ref: T): void {
        const ctor = (ref as any).constructor as new () => T;
        if (this._enableStrictCheck) {
            this._internalCheckReferenceType(ctor);
        }
        this._getOrCreate(ctor).release(ref);
    }

    /** Pre-warms the pool with `count` instances. */
    static add<T extends IReference>(ctor: new () => T, count: number): void {
        if (this._enableStrictCheck) {
            this._internalCheckReferenceType(ctor);
        }
        this._getOrCreate(ctor).add(count);
    }

    /** Removes up to `count` unused instances from the pool. */
    static remove<T extends IReference>(ctor: new () => T, count: number): void {
        this._getOrCreate(ctor).remove(count);
    }

    /** Removes all unused instances of this type from the pool. */
    static removeAll<T extends IReference>(ctor: new () => T): void {
        const col = this._collections.get(ctor);
        if (col) {
            col.removeAll();
        }
    }

    /** Clears all pools for every type. */
    static clearAll(): void {
        this._collections.forEach(c => c.removeAll());
        this._collections.clear();
    }

    private static _internalCheckReferenceType(ctor: new () => any): void {
        if (!ctor || typeof ctor !== 'function') {
            throw new Error(`[ReferencePool] Reference type is invalid.`);
        }
    }

    private static _getOrCreate<T extends IReference>(ctor: new () => T): ReferenceCollection<T> {
        if (!this._collections.has(ctor)) {
            this._collections.set(ctor, new ReferenceCollection(ctor, () => this._enableStrictCheck));
        }
        return this._collections.get(ctor)!;
    }
}
