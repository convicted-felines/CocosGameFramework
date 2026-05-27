import { FireContext } from './FireContext';

/**
 * 开火行为策略接口。
 * WeaponEntity 根据 DRWeapon.FireBehaviorType 实例化对应实现，
 * 开火时调用 fire() 或 trigger 系列方法，不感知具体行为细节。
 */
export interface IFireBehavior {
    /**
     * true 时 WeaponEntity 跳过 _tryFire 流程，
     * 将 onTriggerDown/Held/Up 转发给此行为（光束、蓄力）。
     */
    readonly manualTrigger: boolean;

    /** 半自动/全自动每次扣弹后调用 */
    fire(ctx: FireContext): void;

    /** 扳机按下（manualTrigger=true 有效） */
    onTriggerDown?(ctx: FireContext): void;

    /** 每帧扳机持续（manualTrigger=true 有效） */
    onTriggerHeld?(ctx: FireContext, dt: number): void;

    /** 扳机松开（manualTrigger=true 有效） */
    onTriggerUp?(ctx: FireContext): void;

    /** 武器隐藏/切换时清理运行时资源（如停止光束特效） */
    onDispose?(): void;
}
