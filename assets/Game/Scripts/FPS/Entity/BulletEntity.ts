import { _decorator, Vec3 } from 'cc';
import { EntityLogic } from 'db://assets/CocosGameFramework/Entity/EntityLogic';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { DRBullet } from 'db://assets/Game/Scripts/DataTable/DRBullet';
import { IBulletBehavior, IBulletProxy } from 'db://assets/Game/Scripts/FPS/Weapon/IBulletBehavior';
import { StraightBulletBehavior } from 'db://assets/Game/Scripts/FPS/Weapon/BulletBehaviors/StraightBulletBehavior';
import { HomingBulletBehavior } from 'db://assets/Game/Scripts/FPS/Weapon/BulletBehaviors/HomingBulletBehavior';
import { BounceBulletBehavior } from 'db://assets/Game/Scripts/FPS/Weapon/BulletBehaviors/BounceBulletBehavior';
import { ExplosiveBulletBehavior } from 'db://assets/Game/Scripts/FPS/Weapon/BulletBehaviors/ExplosiveBulletBehavior';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';

const { ccclass } = _decorator;

const BulletBehaviorType = {
    Straight:  0,
    Homing:    1,
    Bounce:    2,
    Explosive: 3,
} as const;

export interface BulletEntityData {
    drBulletId:    number;
    ownerEntityId: number;
    /** 最终伤害（已由 WeaponEntity 合并配置覆盖值） */
    damage:        number;
    direction:     Vec3;
    spawnPosition: Vec3;
    /** 蓄力比例 0~1，供特效缩放使用 */
    chargeRatio?:  number;
}

@ccclass('BulletEntity')
export class BulletEntity extends EntityLogic implements IBulletProxy {

    // ---- IBulletProxy 实现 ----

    ownerEntityId = 0;
    damage        = 0;
    direction     = new Vec3();
    lifetime      = 3;

    get worldPosition(): Readonly<Vec3> { return this.node.worldPosition; }

    move(displacement: Vec3): void {
        const pos = this.node.worldPosition.clone();
        this.node.setWorldPosition(pos.add(displacement));
    }

    kill(): void {
        GameEntry.Entity.hideEntity(this.entityId!);
    }

    // ---- 运行时 ----

    private _behavior: IBulletBehavior | null = null;

    protected onInit(_userData?: object): void {}

    onShow(userData?: object): void {
        const data = userData as BulletEntityData;
        this.ownerEntityId = data.ownerEntityId;
        this.direction     = data.direction.clone().normalize();

        this.node.setWorldPosition(data.spawnPosition);

        // 合并伤害：DRBullet.Damage > 0 时覆盖武器伤害
        const drBullet = this._loadConfig(data.drBulletId);
        this.damage    = (drBullet && drBullet.Damage > 0) ? drBullet.Damage : data.damage;
        this.lifetime  = drBullet?.Lifetime ?? 3;

        this._behavior = drBullet ? this._createBehavior(drBullet) : new StraightBulletBehavior();
        this._behavior.onStart(this, drBullet!);
    }

    onHide(_isShutdown: boolean, _userData?: object): void {
        this._behavior?.onDispose?.(this);
        this._behavior = null;
    }

    onUpdate(dt: number, _rdt: number): void {
        this._behavior?.onUpdate(this, dt);
    }

    // ---- 内部 ----

    private _loadConfig(drId: number): DRBullet | null {
        const table = GameEntry.DataTable.getDataTable(DRBullet);
        const row   = table?.getDataRow(drId);
        if (!row) {
            GameFrameworkLog.warning('[BulletEntity] DRBullet row {0} not found.', drId);
            return null;
        }
        return row;
    }

    private _createBehavior(config: DRBullet): IBulletBehavior {
        switch (config.BehaviorType) {
            case BulletBehaviorType.Homing:    return new HomingBulletBehavior();
            case BulletBehaviorType.Bounce:    return new BounceBulletBehavior();
            case BulletBehaviorType.Explosive: return new ExplosiveBulletBehavior();
            default:                           return new StraightBulletBehavior();
        }
    }

  
}
