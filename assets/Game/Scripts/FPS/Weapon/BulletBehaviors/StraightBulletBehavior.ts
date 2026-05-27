import { geometry, PhysicsSystem, Vec3 } from 'cc';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { WeaponHitEventArgs } from 'db://assets/Game/Scripts/FPS/Event/WeaponEventArgs';
import { DRBullet } from 'db://assets/Game/Scripts/DataTable/DRBullet';
import { IBulletBehavior, IBulletProxy } from '../IBulletBehavior';

/** 直线飞行（等离子弹、能量球等） */
export class StraightBulletBehavior implements IBulletBehavior {
    private _speed    = 30;
    private _lastPos  = new Vec3();

    onStart(proxy: IBulletProxy, config: DRBullet): void {
        this._speed = config.Speed;
        Vec3.copy(this._lastPos, proxy.worldPosition as Vec3);
    }

    onUpdate(proxy: IBulletProxy, dt: number): void {
        proxy.lifetime -= dt;
        if (proxy.lifetime <= 0) { proxy.kill(); return; }

        const displacement = new Vec3(
            proxy.direction.x * this._speed * dt,
            proxy.direction.y * this._speed * dt,
            proxy.direction.z * this._speed * dt,
        );

        // 扫描射线检测（防止高速穿透薄物体）
        const newPos = (proxy.worldPosition as Vec3).clone().add(displacement);
        const sweep  = newPos.clone().subtract(this._lastPos);
        const dist   = sweep.length();
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
}
