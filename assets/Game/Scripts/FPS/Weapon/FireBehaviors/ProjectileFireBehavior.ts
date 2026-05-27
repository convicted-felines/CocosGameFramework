import { Vec3 } from 'cc';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';
import { FireContext } from '../FireContext';
import { IFireBehavior } from '../IFireBehavior';

let _bulletIdCounter = 3000;

/** 抛射物开火（火箭筒、等离子枪、追踪导弹等） */
export class ProjectileFireBehavior implements IFireBehavior {
    readonly manualTrigger = false;

    fire(ctx: FireContext): void {
        const camNode = ctx.camera.node;
        const origin  = camNode.worldPosition.clone();
        const forward = new Vec3();
        Vec3.transformQuat(forward, Vec3.FORWARD, camNode.worldRotation);
        forward.negative();

        for (let i = 0; i < ctx.bulletCount; i++) {
            const dir       = this._applySpread(forward, ctx.spreadAngle);
            const bulletId  = _bulletIdCounter++;
            const bulletData = {
                drBulletId:    ctx.bulletId,
                ownerEntityId: ctx.ownerEntityId,
                damage:        ctx.damage,
                direction:     dir,
                spawnPosition: origin.clone(),
            };

            GameEntry.Entity.showEntity(
                bulletId,
                `FPS/Prefabs/Bullet_${ctx.bulletId}`,
                'resources',
                'Bullet',
                0,
                bulletData,
            );
            GameFrameworkLog.info('[Projectile] Spawned bullet {0} (drBulletId={1})', bulletId, ctx.bulletId);
        }
    }

    private _applySpread(dir: Vec3, angleDeg: number): Vec3 {
        if (angleDeg <= 0) return dir.clone();
        const rad    = (angleDeg * Math.PI) / 180;
        const theta  = Math.random() * Math.PI * 2;
        const phi    = Math.random() * rad;
        const sinPhi = Math.sin(phi);
        return new Vec3(
            dir.x + sinPhi * Math.cos(theta),
            dir.y + sinPhi * Math.sin(theta),
            dir.z,
        ).normalize();
    }
}
