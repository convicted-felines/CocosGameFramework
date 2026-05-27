import { Vec3 } from 'cc';
import { BaseEventArgs } from 'db://assets/GameFramework/Event/BaseEventArgs';
import { IReference } from 'db://assets/GameFramework/ReferencePool/IReference';
import { ReferencePool } from 'db://assets/GameFramework/ReferencePool/ReferencePool';

/** 武器命中事件 */
export class WeaponHitEventArgs extends BaseEventArgs implements IReference {
    static readonly EVENT_ID = 'FPS.WeaponHit';
    get id(): string { return WeaponHitEventArgs.EVENT_ID; }

    /** 攻击者实体 ID */
    attackerEntityId: number = 0;
    /** 伤害值 */
    damage: number = 0;
    /** 命中点世界坐标 */
    hitPoint: Vec3 = new Vec3();
    /** 命中法线 */
    hitNormal: Vec3 = new Vec3();
    /** 命中节点名（用于判断是否命中敌人） */
    hitNodeName: string = '';

    clear(): void {
        this.attackerEntityId = 0;
        this.damage = 0;
        this.hitPoint.set(0, 0, 0);
        this.hitNormal.set(0, 0, 0);
        this.hitNodeName = '';
    }

    static create(
        attackerEntityId: number,
        damage: number,
        hitPoint: Vec3,
        hitNormal: Vec3,
        hitNodeName: string,
    ): WeaponHitEventArgs {
        const e = ReferencePool.acquire(WeaponHitEventArgs);
        e.attackerEntityId = attackerEntityId;
        e.damage = damage;
        Vec3.copy(e.hitPoint, hitPoint);
        Vec3.copy(e.hitNormal, hitNormal);
        e.hitNodeName = hitNodeName;
        return e;
    }
}

/** 武器弹药变化事件（换弹、开枪消耗时触发，供 HUD 监听） */
export class WeaponAmmoChangedEventArgs extends BaseEventArgs implements IReference {
    static readonly EVENT_ID = 'FPS.WeaponAmmoChanged';
    get id(): string { return WeaponAmmoChangedEventArgs.EVENT_ID; }

    currentClip: number = 0;
    reserveAmmo: number = 0;

    clear(): void {
        this.currentClip = 0;
        this.reserveAmmo = 0;
    }

    static create(currentClip: number, reserveAmmo: number): WeaponAmmoChangedEventArgs {
        const e = ReferencePool.acquire(WeaponAmmoChangedEventArgs);
        e.currentClip = currentClip;
        e.reserveAmmo = reserveAmmo;
        return e;
    }
}
