import { Vec3 } from 'cc';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';
import { FireContext } from '../FireContext';
import { IFireBehavior } from '../IFireBehavior';

let _bulletIdCounter = 4000;

/** 蓄力开火（按住充能，松开发射，伤害/速度随蓄力比例提升） */
export class ChargedFireBehavior implements IFireBehavior {
    readonly manualTrigger = true;

    private _charging   = false;
    private _chargeTime = 0; // 已蓄力时间
    /** chargeRatio 0~1，由调用方在 ctx.chargeTime 内累积 */
    get chargeRatio(): number { return Math.min(this._chargeTime / this._configChargeTime, 1); }

    constructor(private readonly _configChargeTime: number) {}

    fire(_ctx: FireContext): void { /* manualTrigger=true，不走此路径 */ }

    onTriggerDown(_ctx: FireContext): void {
        this._charging   = true;
        this._chargeTime = 0;
        GameFrameworkLog.info('[Charged] Charging...');
        // TODO: 播放蓄力特效 / 声音
    }

    onTriggerHeld(_ctx: FireContext, dt: number): void {
        if (!this._charging) return;
        this._chargeTime = Math.min(this._chargeTime + dt, this._configChargeTime);
        // TODO: 更新蓄力 UI 进度条
    }

    onTriggerUp(ctx: FireContext): void {
        if (!this._charging) return;
        this._charging = false;

        if (!ctx.callbacks.consumeAmmo(1)) return;
        ctx.callbacks.broadcastAmmo();

        const ratio     = this.chargeRatio;
        const damage    = ctx.damage * (0.5 + ratio * 0.5); // 50%~100% 伤害
        const bulletId  = _bulletIdCounter++;
        const camNode   = ctx.camera.node;
        const forward   = new Vec3();
        Vec3.transformQuat(forward, Vec3.FORWARD, camNode.worldRotation);
        forward.negative();

        GameEntry.Entity.showEntity(
            bulletId,
            `FPS/Prefabs/Bullet_${ctx.bulletId}`,
            'resources',
            'Bullet',
            0,
            {
                drBulletId:    ctx.bulletId,
                ownerEntityId: ctx.ownerEntityId,
                damage,
                direction:     forward,
                spawnPosition: camNode.worldPosition.clone(),
                chargeRatio:   ratio,
            },
        );
        GameFrameworkLog.info('[Charged] Fired at charge {0:.0%}', ratio);
    }

    onDispose(): void {
        this._charging   = false;
        this._chargeTime = 0;
    }
}
