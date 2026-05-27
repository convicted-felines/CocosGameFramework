import { geometry, Line, PhysicsSystem, Vec3 } from 'cc';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { WeaponHitEventArgs } from 'db://assets/Game/Scripts/FPS/Event/WeaponEventArgs';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';
import { FireContext } from '../FireContext';
import { IFireBehavior } from '../IFireBehavior';

const AMMO_DRAIN_RATE = 5; // 每秒消耗弹药数
const TICK_INTERVAL   = 0.05; // 伤害判定间隔（秒）

/** 持续光束开火（激光步枪，按住持续伤害） */
export class BeamFireBehavior implements IFireBehavior {
    readonly manualTrigger = true;

    private _active       = false;
    private _tickTimer    = 0;
    private _drainAccum   = 0;

    fire(_ctx: FireContext): void { /* manualTrigger=true，不走此路径 */ }

    onTriggerDown(ctx: FireContext): void {
        this._active     = true;
        this._tickTimer  = 0;
        this._drainAccum = 0;
        GameFrameworkLog.info('[Beam] Beam start.');
        // TODO: 激活光束 LineRenderer 节点
    }

    onTriggerHeld(ctx: FireContext, dt: number): void {
        if (!this._active) return;

        // 弹药按时间消耗
        this._drainAccum += AMMO_DRAIN_RATE * dt;
        const toConsume = Math.floor(this._drainAccum);
        if (toConsume > 0) {
            this._drainAccum -= toConsume;
            if (!ctx.callbacks.consumeAmmo(toConsume)) {
                this._stop(ctx);
                return;
            }
            ctx.callbacks.broadcastAmmo();
        }

        // 伤害判定按 tick 间隔
        this._tickTimer -= dt;
        if (this._tickTimer > 0) return;
        this._tickTimer = TICK_INTERVAL;

        const camNode = ctx.camera.node;
        const origin  = camNode.worldPosition.clone();
        const forward = new Vec3();
        Vec3.transformQuat(forward, Vec3.FORWARD, camNode.worldRotation);
        forward.negative();

        const ray = new geometry.Ray();
        geometry.Ray.fromPoints(ray, origin, new Vec3(
            origin.x + forward.x * ctx.range,
            origin.y + forward.y * ctx.range,
            origin.z + forward.z * ctx.range,
        ));

        if (PhysicsSystem.instance.raycastClosest(ray, 0xffffffff, ctx.range)) {
            const result = PhysicsSystem.instance.raycastClosestResult;
            GameEntry.Event.fire(
                this,
                WeaponHitEventArgs.create(
                    ctx.ownerEntityId,
                    ctx.damage * TICK_INTERVAL, // 按 tick 比例折算伤害
                    result.hitPoint, result.hitNormal,
                    result.collider.node.name,
                ),
            );
            // TODO: 更新光束端点到 hitPoint
        }
    }

    onTriggerUp(ctx: FireContext): void {
        this._stop(ctx);
    }

    onDispose(): void {
        this._active = false;
        // TODO: 隐藏光束节点
    }

    private _stop(ctx: FireContext): void {
        this._active = false;
        GameFrameworkLog.info('[Beam] Beam stop.');
        // TODO: 隐藏光束节点
    }
}
