import { GameFrameworkModule } from './GameFrameworkModule';
import { GameFrameworkError } from './GameFrameworkError';

interface ModuleNode {
    module: GameFrameworkModule;
    prev: ModuleNode | null;
    next: ModuleNode | null;
}

export class GameFrameworkEntry {
    private static _moduleMap: Map<string, GameFrameworkModule> = new Map();
    private static _head: ModuleNode | null = null;

    // 懒加载并注册模块，调用方式：GameFrameworkEntry.getModule(CocosResourceManager, MODULE_ID.RESOURCE)
    static getModule<T extends GameFrameworkModule>(ctor: new () => T, moduleId: string): T {
        let m = this._moduleMap.get(moduleId) as T | undefined;
        if (!m) {
            m = new ctor();
            this._moduleMap.set(moduleId, m);
            this._insertModuleSorted(m);
        }
        return m;
    }

    // 注册外部已创建的实例（引擎层注入具体实现）
    static registerModule(moduleId: string, module: GameFrameworkModule): void {
        if (this._moduleMap.has(moduleId)) {
            throw new GameFrameworkError(`Module [${moduleId}] is already registered.`);
        }
        this._moduleMap.set(moduleId, module);
        this._insertModuleSorted(module);
    }

    // 每帧由 GameEntry Component 驱动
    static update(elapseSeconds: number, realElapseSeconds: number): void {
        let node = this._head;
        while (node) {
            node.module.update(elapseSeconds, realElapseSeconds);
            node = node.next;
        }
    }

    // 倒序 Shutdown（与 update 顺序相反，低优先级先销毁）
    static shutdown(): void {
        const modules: GameFrameworkModule[] = [];
        let node = this._head;
        while (node) {
            modules.push(node.module);
            node = node.next;
        }
        for (let i = modules.length - 1; i >= 0; i--) {
            modules[i].shutdown();
        }
        this._moduleMap.clear();
        this._head = null;
    }

    static hasModule(moduleId: string): boolean {
        return this._moduleMap.has(moduleId);
    }

    // 按 priority 降序插入（高 priority 在链表前面，先 update）
    private static _insertModuleSorted(module: GameFrameworkModule): void {
        const newNode: ModuleNode = { module, prev: null, next: null };
        if (!this._head || module.priority >= this._head.module.priority) {
            newNode.next = this._head;
            if (this._head) {
                this._head.prev = newNode;
            }
            this._head = newNode;
            return;
        }
        let cur = this._head;
        while (cur.next && cur.next.module.priority > module.priority) {
            cur = cur.next;
        }
        newNode.next = cur.next;
        newNode.prev = cur;
        if (cur.next) {
            cur.next.prev = newNode;
        }
        cur.next = newNode;
    }
}
