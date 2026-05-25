import { Component, Node } from 'cc';

type HelperCtor<T extends Component> = new () => T;

/**
 * Helper 类型注册表。
 *
 * 用途：解决 TypeScript 无反射问题。
 * 各 HelperBase 子类在文件顶层调用 HelperRegistry.register() 完成注册，
 * Component 在 onLoad 时通过类型名字符串查找构造函数，
 * 创建新子节点后调用 addComponent 完成实例化——与 UnityGameFramework CreateHelper 行为等价。
 *
 * 注册示例（在 DefaultEntityHelper.ts 文件顶层）：
 *   HelperRegistry.register('DefaultEntityHelper', DefaultEntityHelper);
 */
export class HelperRegistry {
    private static _map: Map<string, HelperCtor<Component>> = new Map();

    static register<T extends Component>(typeName: string, ctor: HelperCtor<T>): void {
        if (this._map.has(typeName)) {
            console.warn(`[HelperRegistry] '${typeName}' already registered, overwriting.`);
        }
        this._map.set(typeName, ctor as HelperCtor<Component>);
    }

    /**
     * 创建 Helper：
     * 1. 在 parent 下创建名为 helperTypeName 的子节点
     * 2. addComponent 目标类型
     * 3. 若类型名不存在则回退到 fallbackCtor
     */
    static createHelper<T extends Component>(
        parent: Node,
        helperTypeName: string,
        fallbackCtor: HelperCtor<T>,
    ): T {
        const ctor = this._map.get(helperTypeName) as HelperCtor<T> | undefined ?? fallbackCtor;
        const helperNode = new Node(helperTypeName);
        helperNode.parent = parent;
        return helperNode.addComponent(ctor);
    }

    static getRegisteredNames(): string[] {
        return Array.from(this._map.keys());
    }
}
