import { Component } from 'cc';

/**
 * 所有 Cocos 层框架组件的抽象基类，对应 UnityGameFramework 中的 GameFrameworkComponent。
 * 挂载到子节点时，onLoad 阶段自动注册到静态组件注册表，供 GameEntry.getComponent() 检索。
 */
export abstract class GameFrameworkComponent extends Component {
    private static readonly _registry = new Map<Function, GameFrameworkComponent>();

    /** 按组件类型查找已注册的框架组件实例。 */
    static getComponent<T extends GameFrameworkComponent>(type: new (...args: any[]) => T): T | null {
        return (GameFrameworkComponent._registry.get(type) as T) ?? null;
    }

    protected onLoad(): void {
        GameFrameworkComponent._registry.set(this.constructor as Function, this);
    }

    protected onDestroy(): void {
        if (GameFrameworkComponent._registry.get(this.constructor as Function) === this) {
            GameFrameworkComponent._registry.delete(this.constructor as Function);
        }
    }
}
