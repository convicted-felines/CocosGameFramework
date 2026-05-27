import { geometry, PhysicsSystem, Vec3 } from 'cc';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { WeaponHitEventArgs } from 'db://assets/Game/Scripts/FPS/Event/WeaponEventArgs';
import { DRBullet } from 'db://assets/Game/Scripts/DataTable/DRBullet';
import { IBulletBehavior, IBulletProxy } from '../IBulletBehavior';

/** 反弹飞行（碰到墙壁物理反射，最多反弹 N 次后消失） */
export class BounceBulletBehavior implements IBulletBehavior {
    private _speed        = 25;
    private _maxBounces   = 3;
    private _bounceCount  = 0;
    private _lastPos      = new Vec3();

    onStart(proxy: IBulletProxy, config: DRBullet): void {
        this._speed       = config.Speed;
        this._maxBounces  = config.BounceCount;
        this._bounceCount = 0;
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
        const newPos = (proxy.worldPosition as Vec3).clone().add(displacement);
        const dist   = Vec3.distance(this._lastPos, newPos);
        const ray    = new geometry.Ray();
        geometry.Ray.fromPoints(ray, this._lastPos, newPos);

        if (dist > 0 && PhysicsSystem.instance.raycastClosest(ray, 0xffffffff, dist)) {
            const result   = PhysicsSystem.instance.raycastClosestResult;
            const nodeName = result.collider.node.name;

            if (nodeName.includes('Enemy') || nodeName.includes('Player')) {
                this.onHit(proxy, result);
                return;
            }

            // 命中非角色物体：计算反弹方向
            if (this._bounceCount < this._maxBounces) {
                this._bounceCount++;
                const n   = result.hitNormal.clone();
                const d   = proxy.direction.clone();
                // reflect = d - 2*(d·n)*n
                const dot = Vec3.dot(d, n);
                proxy.direction = d.subtract(n.multiplyScalar(2 * dot)).normalize();
                // 移动到命中点附近后继续
                proxy.move(new Vec3(
                    result.hitPoint.x - proxy.worldPosition.x,
                    result.hitPoint.y - proxy.worldPosition.y,
                    result.hitPoint.z - proxy.worldPosition.z,
                ));
            } else {
                proxy.kill();
            }
        } else {
            proxy.move(displacement);
        }
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
