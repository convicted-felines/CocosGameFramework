import { geometry, PhysicsSystem, Vec3 } from 'cc';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { WeaponHitEventArgs } from 'db://assets/Game/Scripts/FPS/Event/WeaponEventArgs';
import { DRBullet } from 'db://assets/Game/Scripts/DataTable/DRBullet';
import { IBulletBehavior, IBulletProxy } from '../IBulletBehavior';

/** 范围爆炸（命中时对爆炸半径内所有碰撞体造成伤害） */
export class ExplosiveBulletBehavior implements IBulletBehavior {
    private _speed           = 15;
    private _explosionRadius = 5;
    private _lastPos         = new Vec3();

    onStart(proxy: IBulletProxy, config: DRBullet): void {
        this._speed           = config.Speed;
        this._explosionRadius = config.ExplosionRadius;
        Vec3.copy(this._lastPos, proxy.worldPosition as Vec3);
    }

    onUpdate(proxy: IBulletProxy, dt: number): void {
        proxy.lifetime -= dt;
        if (proxy.lifetime <= 0) {
            this._explode(proxy, proxy.worldPosition as Vec3, Vec3.UP.clone());
            return;
        }

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
            const result = PhysicsSystem.instance.raycastClosestResult;
            this.onHit(proxy, result);
            return;
        }

        proxy.move(displacement);
        Vec3.copy(this._lastPos, proxy.worldPosition as Vec3);
    }

    onHit(proxy: IBulletProxy, result: import('cc').PhysicsRayResult): void {
        this._explode(proxy, result.hitPoint, result.hitNormal);
    }

    private _explode(proxy: IBulletProxy, center: Vec3, _normal: Vec3): void {
        const DIRS = [
            new Vec3( 1, 0, 0), new Vec3(-1, 0, 0),
            new Vec3( 0, 1, 0), new Vec3( 0,-1, 0),
            new Vec3( 0, 0, 1), new Vec3( 0, 0,-1),
            new Vec3( 1, 1, 0).normalize(), new Vec3(-1, 1, 0).normalize(),
        ];

        const alreadyHit = new Set<string>();
        for (const d of DIRS) {
            const ray = new geometry.Ray();
            geometry.Ray.fromPoints(ray, center, new Vec3(
                center.x + d.x * this._explosionRadius,
                center.y + d.y * this._explosionRadius,
                center.z + d.z * this._explosionRadius,
            ));
            if (!PhysicsSystem.instance.raycastClosest(ray, 0xffffffff, this._explosionRadius)) continue;
            const r        = PhysicsSystem.instance.raycastClosestResult;
            const nodeName = r.collider.node.name;
            if (alreadyHit.has(nodeName)) continue;
            alreadyHit.add(nodeName);

            // 距离衰减：距爆炸中心越远伤害越低
            const falloff = 1 - Vec3.distance(center, r.hitPoint) / this._explosionRadius;
            GameEntry.Event.fire(
                this,
                WeaponHitEventArgs.create(
                    proxy.ownerEntityId,
                    proxy.damage * Math.max(0, falloff),
                    r.hitPoint, r.hitNormal, nodeName,
                ),
            );
        }

        // TODO: 播放爆炸特效
        proxy.kill();
    }
}
