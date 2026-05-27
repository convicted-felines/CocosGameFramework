import { Camera, Node } from 'cc';

/** 供 manualTrigger 行为回调 WeaponEntity 的接口 */
export interface FireCallbacks {
    /** 消耗弹药，返回 false 表示弹药不足并已触发换弹 */
    consumeAmmo(count?: number): boolean;
    /** 主动触发换弹 */
    triggerReload(): void;
    /** 广播当前弹药量到 Event / DataNode */
    broadcastAmmo(): void;
}

/** 每次开火时传入行为对象的上下文，只读快照 + 回调 */
export interface FireContext {
    /** 射击用相机（提供射线方向，每帧读取最新朝向） */
    readonly camera: Camera;
    /** 枪口节点（特效/子弹生成位置） */
    readonly muzzle: Node;
    /** 所属实体 ID */
    readonly ownerEntityId: number;
    /** 单次伤害（武器配置值） */
    readonly damage: number;
    /** 即时射线最大射程 */
    readonly range: number;
    /** 子弹配置 ID，对应 DRBullet.id（ProjectileFireBehavior 使用） */
    readonly bulletId: number;
    /** 每次开火发射的子弹数（散弹枪 > 1） */
    readonly bulletCount: number;
    /** 散布半锥角（度），0 表示无散布 */
    readonly spreadAngle: number;
    /** 蓄力满充时间（秒），ChargedFireBehavior 使用 */
    readonly chargeTime: number;
    /** 回调，供 manualTrigger 行为消耗弹药 */
    readonly callbacks: FireCallbacks;
}
