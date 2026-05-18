import { _decorator, Component } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { ObjectPoolManager } from '../../GameFramework/ObjectPool/ObjectPoolManager';
import { ObjectBase } from '../../GameFramework/ObjectPool/ObjectBase';
import { IObjectPool } from '../../GameFramework/ObjectPool/IObjectPool';

const { ccclass, property } = _decorator;

@ccclass('ObjectPoolComponent')
export class ObjectPoolComponent extends Component {
    /** 对象池自动释放检查间隔（秒） */
    @property({ tooltip: '对象池自动释放检查间隔（秒）' })
    releaseInterval: number = 60;

    /** 单个对象池默认容量上限（0 = 不限） */
    @property({ tooltip: '单个对象池默认容量上限（0=不限）' })
    defaultCapacity: number = 0;

    /** 对象默认过期时间（秒，0 = 永不过期） */
    @property({ tooltip: '对象默认过期时间（秒，0=永不过期）' })
    defaultExpireTime: number = 0;

    private _manager!: ObjectPoolManager;

    get manager(): ObjectPoolManager { return this._manager; }

    onLoad(): void {
        this._manager = new ObjectPoolManager();
        if (this.releaseInterval > 0) {
            (this._manager as any)._autoReleaseInterval = this.releaseInterval;
        }
        GameFrameworkEntry.registerModule(MODULE_ID.OBJPOOL, this._manager);
    }

    get objectPoolCount(): number { return this._manager.count; }

    createObjectPool<T extends ObjectBase>(
        name: string,
        type: new (...args: any[]) => T,
        capacity?: number,
        expireTime?: number
    ): IObjectPool<T> {
        return this._manager.createObjectPool<T>(
            name, type,
            capacity ?? (this.defaultCapacity === 0 ? Infinity : this.defaultCapacity),
            expireTime ?? this.defaultExpireTime
        );
    }

    destroyObjectPool(name: string): boolean {
        return this._manager.destroyObjectPool(name);
    }

    hasObjectPool(name: string): boolean {
        return this._manager.hasObjectPool(name);
    }

    getObjectPool<T extends ObjectBase>(name: string): IObjectPool<T> | null {
        return this._manager.getObjectPool<T>(name);
    }

    releaseAllUnused(): void {
        this._manager.releaseAllUnused();
    }
}
