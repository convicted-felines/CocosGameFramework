import { _decorator } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { ObjectPoolManager } from '../../GameFramework/ObjectPool/ObjectPoolManager';
import { ObjectBase } from '../../GameFramework/ObjectPool/ObjectBase';
import { IObjectPool } from '../../GameFramework/ObjectPool/IObjectPool';

const { ccclass, property } = _decorator;

@ccclass('ObjectPoolComponent')
export class ObjectPoolComponent extends GameFrameworkComponent {
    @property({ tooltip: '对象池自动释放检查间隔（秒）' })
    defaultAutoReleaseInterval: number = 60;

    @property({ tooltip: '单个对象池默认容量上限（0 = 不限）' })
    defaultCapacity: number = 0;

    @property({ tooltip: '对象默认过期时间（秒，0 = 永不过期）' })
    defaultExpireTime: number = 0;

    @property({ tooltip: '默认优先级' })
    defaultPriority: number = 0;

    private _manager!: ObjectPoolManager;

    get manager(): ObjectPoolManager { return this._manager; }

    onLoad(): void {
        super.onLoad();
        this._manager = new ObjectPoolManager();
        GameFrameworkEntry.registerModule(MODULE_ID.OBJPOOL, this._manager);
    }

    get objectPoolCount(): number { return this._manager.count; }

    hasObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name: string = ''): boolean {
        return this._manager.hasObjectPool(objectType, name);
    }

    getObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name: string = ''): IObjectPool<T> | null {
        return this._manager.getObjectPool<T>(objectType, name);
    }

    getAllObjectPools(sort: boolean = false): IObjectPool<any>[] {
        return this._manager.getAllObjectPools(sort);
    }

    createSingleSpawnObjectPool<T extends ObjectBase>(
        objectType: new (...args: any[]) => T,
        name: string = '',
        autoReleaseInterval?: number,
        capacity?: number,
        expireTime?: number,
        priority?: number
    ): IObjectPool<T> {
        return this._manager.createSingleSpawnObjectPool<T>(
            objectType, name,
            autoReleaseInterval ?? this.defaultAutoReleaseInterval,
            capacity ?? (this.defaultCapacity === 0 ? Infinity : this.defaultCapacity),
            expireTime ?? this.defaultExpireTime,
            priority ?? this.defaultPriority
        );
    }

    createMultiSpawnObjectPool<T extends ObjectBase>(
        objectType: new (...args: any[]) => T,
        name: string = '',
        autoReleaseInterval?: number,
        capacity?: number,
        expireTime?: number,
        priority?: number
    ): IObjectPool<T> {
        return this._manager.createMultiSpawnObjectPool<T>(
            objectType, name,
            autoReleaseInterval ?? this.defaultAutoReleaseInterval,
            capacity ?? (this.defaultCapacity === 0 ? Infinity : this.defaultCapacity),
            expireTime ?? this.defaultExpireTime,
            priority ?? this.defaultPriority
        );
    }

    destroyObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name: string = ''): boolean {
        return this._manager.destroyObjectPool(objectType, name);
    }

    release(): void {
        this._manager.release();
    }

    releaseAllUnused(): void {
        this._manager.releaseAllUnused();
    }
}
