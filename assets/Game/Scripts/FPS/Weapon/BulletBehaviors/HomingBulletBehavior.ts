import { geometry, PhysicsSystem, Vec3 } from 'cc';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { WeaponHitEventArgs } from 'db://assets/Game/Scripts/FPS/Event/WeaponEventArgs';
import { DRBullet } from 'db://assets/Game/Scripts/DataTable/DRBullet';
import { IBulletBehavior, IBulletProxy } from '../IBulletBehavior';

/** 追踪目标飞行（锁定目标，持续转向）  */
export class HomingBulletBehavior implements IBulletBehavior {
    private _speed          = 20;
    private _homingStrength = 120; // 度/秒
    private _lastPos        = new Vec3();

    onStart(proxy: IBulletProxy, config: DRBullet): void {
        this._speed          = config.Speed;
        this._homingStrength = config.HomingStrength;
        Vec3.copy(this._lastPos, proxy.worldPosition as Vec3);
    }

    onUpdate(proxy: IBulletProxy, dt: number): void {
        proxy.lifetime -= dt;
        if (proxy.lifetime <= 0) { proxy.kill(); return; }

        // 追踪：找最近敌人更新方向
        this._steer(proxy, dt);

        const displacement = new Vec3(
            proxy.direction.x * this._speed * dt,
            proxy.direction.y * this._speed * dt,
            proxy.direction.z * this._speed * dt,
        );

        const newPos = (proxy.worldPosition as Vec3).clone().add(displacement);
        const dist   = Vec3.distance(this._lastPos, newPos);
        const ray    = new geometry.Ray();
        geometry.Ray.fromPoints(ray, this._lastPos, newPos);

        if (dist > 0 && PhysicsSystem.instance.raycastClosest(ray, 0xffffffff, dist)) {
            this.onHit(proxy, PhysicsSystem.instance.raycastClosestResult);
            return;
        }

        proxy.move(displacement);
        Vec3.copy(this._lastPos, proxy.worldPosition as Vec3);
    }

    onHit(proxy: IBulletProxy, result: import('cc').PhysicsRayResult): void {
        GameEntry.Event.fire(
            this,
            WeaponHitEventArgs.create(
                proxy.ownerEntityId, proxy.damage,
                result.hitPoint, result.hitNormal,
                result.collider.node.name,
            ),
        );
        proxy.kill();
    }

    private _steer(proxy: IBulletProxy, dt: number): void {
        // 简单策略：找 'Enemy' 分组中最近实体
        const enemies = GameEntry.Entity.getAllEntitiesInGroup('Enemy');
        if (!enemies || enemies.length === 0) return;

        let nearestDir: Vec3 | null = null;
        let nearestDist = Infinity;

        for (const e of enemies) {
            const ePos = e.node?.worldPosition;
            if (!ePos) continue;
            const dist = Vec3.distance(proxy.worldPosition as Vec3, ePos);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestDir  = new Vec3(ePos.x - proxy.worldPosition.x, ePos.y - proxy.worldPosition.y, ePos.z - proxy.worldPosition.z).normalize();
            }
        }

        if (!nearestDir) return;

        // 按 homingStrength（度/秒）转向目标方向
        const maxAngle = this._homingStrength * dt * Math.PI / 180;
        const cur      = proxy.direction.clone();
        const dot      = Vec3.dot(cur, nearestDir);
        const angle    = Math.acos(Math.min(1, Math.max(-1, dot)));
        if (angle < 0.001) return;

        const t = Math.min(maxAngle / angle, 1);
        Vec3.lerp(proxy.direction, cur, nearestDir, t);
        proxy.direction.normalize();
    }
}
