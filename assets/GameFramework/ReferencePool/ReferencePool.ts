import { IReference } from './IReference';

class ReferenceCollection<T extends IReference> {
    private _pool: T[] = [];
    private _ctor: new () => T;

    // 统计信息（调试用）
    acquireCount: number = 0;
    releaseCount: number = 0;

    constructor(ctor: new () => T) {
        this._ctor = ctor;
    }

    acquire(): T {
        this.acquireCount++;
        return this._pool.length > 0 ? this._pool.pop()! : new this._ctor();
    }

    release(ref: T): void {
        ref.clear();
        this._pool.push(ref);
        this.releaseCount++;
    }

    releaseAll(): void {
        this._pool.length = 0;
    }

    get unusedCount(): number {
        return this._pool.length;
    }
}

export class ReferencePool {
    private static _collections: Map<Function, ReferenceCollection<any>> = new Map();

    static acquire<T extends IReference>(ctor: new () => T): T {
        return this._getOrCreate(ctor).acquire();
    }

    static release<T extends IReference>(ref: T): void {
        this._getOrCreate((ref as any).constructor as new () => T).release(ref);
    }

    static clearAll(): void {
        this._collections.forEach(c => c.releaseAll());
        this._collections.clear();
    }

    static clear<T extends IReference>(ctor: new () => T): void {
        const col = this._collections.get(ctor);
        if (col) {
            col.releaseAll();
        }
    }

    private static _getOrCreate<T extends IReference>(ctor: new () => T): ReferenceCollection<T> {
        if (!this._collections.has(ctor)) {
            this._collections.set(ctor, new ReferenceCollection(ctor));
        }
        return this._collections.get(ctor)!;
    }
}
