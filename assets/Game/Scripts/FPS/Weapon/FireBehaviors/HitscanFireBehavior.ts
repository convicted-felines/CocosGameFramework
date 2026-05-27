import { geometry, PhysicsSystem, Vec3 } from 'cc';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { WeaponHitEventArgs } from 'db://assets/Game/Scripts/FPS/Event/WeaponEventArgs';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';
import { FireContext } from '../FireContext';
import { IFireBehavior } from '../IFireBehavior';

/** 即时射线开火（手枪、步枪、狙击等） */
export class HitscanFireBehavior implements IFireBehavior {
    readonly manualTrigger = false;

    fire(ctx: FireContext): void {
        const camNode = ctx.camera.node;
        const origin  = camNode.worldPosition.clone();
        // Cocos 相机默认 -Z 朝前
        const forward = new Vec3();
        Vec3.transformQuat(forward, Vec3.FORWARD, camNode.worldRotation);
        forward.negative();

        for (let i = 0; i < ctx.bulletCount; i++) {
            const dir = this._applySpread(forward, ctx.spreadAngle);
            const ray = new geometry.Ray();
            geometry.Ray.fromPoints(ray, origin, new Vec3(
                origin.x + dir.x * ctx.range,
                origin.y + dir.y * ctx.range,
                origin.z + dir.z * ctx.range,
            ));

            if (PhysicsSystem.instance.raycastClosest(ray, 0xffffffff, ctx.range)) {
                const result   = PhysicsSystem.instance.raycastClosestResult;
                const hitNode  = result.collider.node;
                GameEntry.Event.fire(
                    this,
                    WeaponHitEventArgs.create(
                        ctx.ownerEntityId, ctx.damage,
                        result.hitPoint, result.hitNormal, hitNode.name,
                    ),
                );
                GameFrameworkLog.info('[Hitscan] Hit: {0}', hitNode.name);
            }
        }
    }

    private _applySpread(dir: Vec3, angleDeg: number): Vec3 {
        if (angleDeg <= 0) return dir.clone();
        const rad     = (angleDeg * Math.PI) / 180;
        const theta   = Math.random() * Math.PI * 2;
        const phi     = Math.random() * rad;
        const sinPhi  = Math.sin(phi);
        const spread  = new Vec3(
            dir.x + sinPhi * Math.cos(theta),
            dir.y + sinPhi * Math.sin(theta),
            dir.z,
        );
        return spread.normalize();
    }
}
