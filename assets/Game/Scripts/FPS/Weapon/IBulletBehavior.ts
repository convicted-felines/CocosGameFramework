import { PhysicsRayResult } from 'cc';
import { DRBullet } from 'db://assets/Game/Scripts/DataTable/DRBullet';

/**
 * BulletEntity 暴露给飞行行为的最小代理接口，
 * 避免 IBulletBehavior ↔ BulletEntity 循环依赖。
 */
export interface IBulletProxy {
    readonly ownerEntityId: number;
    /** 最终伤害值（已合并武器与配置表覆盖） */
    readonly damage: number;
    /** 世界位置（只读，通过 move 修改） */
    readonly worldPosition: Readonly<import('cc').Vec3>;
    /** 飞行方向（单位向量，可由追踪行为修改） */
    direction: import('cc').Vec3;
    /** 剩余存活时间（秒），行为可读写 */
    lifetime: number;
    /** 移动节点（位移相对世界坐标） */
    move(displacement: import('cc').Vec3): void;
    /** 销毁子弹（归还对象池） */
    kill(): void;
}

/**
 * 子弹飞行行为策略接口。
 * BulletEntity 根据 DRBullet.BehaviorType 实例化对应实现。
 */
export interface IBulletBehavior {
    onStart(proxy: IBulletProxy, config: DRBullet): void;
    onUpdate(proxy: IBulletProxy, dt: number): void;
    /** 命中时调用，result 来自帧内扫描射线检测 */
    onHit(proxy: IBulletProxy, result: PhysicsRayResult): void;
    /** 子弹回池前清理（可选） */
    onDispose?(proxy: IBulletProxy): void;
}
