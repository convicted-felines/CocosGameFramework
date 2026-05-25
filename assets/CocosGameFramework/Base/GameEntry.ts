import { _decorator, Component, director, game } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { GameFrameworkLog } from '../../GameFramework/Base/Log/GameFrameworkLog';
import { GameFrameworkComponent } from './GameFrameworkComponent';
import { ShutdownType } from './ShutdownType';

const { ccclass } = _decorator;

/**
 * 框架入口 Component 基类，挂在场景根节点。
 *
 * 对应 StarForce 中 GameEntry.cs (partial class GameEntry : MonoBehaviour)。
 * 业务层继承本类，将初始化逻辑拆分到：
 *   initBuiltinComponents() → 对应 GameEntry.Builtin.cs InitBuiltinComponents()
 *   initCustomComponents()  → 对应 GameEntry.Custom.cs  InitCustomComponents()
 *
 * 场景节点层级示例：
 * GameEntry (游戏层子类 Component)
 * ├── BaseNode         → BaseComponent
 * ├── EventNode        → EventComponent
 * ├── FsmNode          → FsmComponent
 * ├── ProcedureNode    → ProcedureComponent
 * ├── SettingNode      → SettingComponent
 * ├── ConfigNode       → ConfigComponent
 * ├── DataTableNode    → DataTableComponent
 * ├── DataNodeNode     → DataNodeComponent
 * ├── ObjectPoolNode   → ObjectPoolComponent
 * ├── LocalizationNode → LocalizationComponent
 * ├── NetworkNode      → NetworkComponent
 * ├── WebRequestNode   → WebRequestComponent
 * ├── DownloadNode     → DownloadComponent
 * ├── ResourceNode     → ResourceComponent
 * ├── SceneNode        → SceneComponent
 * ├── UIRoot           → UIComponent
 * ├── EntityRoot       → EntityComponent
 * ├── AudioNode        → SoundComponent
 * ├── FileSystemNode   → FileSystemComponent
 * └── BuiltinDataNode  → BuiltinDataComponent（游戏层自定义）
 */
@ccclass('GFGameEntry')
export class GameEntry extends Component {
    private _lastRealMs: number = 0;
    private static _gameSpeed: number = 1;

    // ---- 静态工具方法 ----

    static setGameSpeed(speed: number): void {
        GameEntry._gameSpeed = Math.max(0, speed);
    }

    static getComponent<T extends GameFrameworkComponent>(type: new (...args: any[]) => T): T | null {
        return GameFrameworkComponent.getComponent(type);
    }

    static shutdown(type: ShutdownType = ShutdownType.None): void {
        GameFrameworkEntry.shutdown();
        switch (type) {
            case ShutdownType.Restart:
                director.loadScene(director.getScene()!.name);
                break;
            case ShutdownType.Quit:
                game.end();
                break;
        }
    }

    // ---- 生命周期 ----

    onLoad(): void {
        // 持久化根节点必须在 onLoad 完成，早于任何场景切换。
        // 此时子节点 onLoad 尚未执行，不在此处访问任何 Component。
        director.addPersistRootNode(this.node);
    }

    start(): void {
        // 所有子节点 onLoad() 已执行完毕，所有 XxxComponent 已注册。
        // 等价于 StarForce GameEntry.Start()。
        this._lastRealMs = performance.now();
        this.initBuiltinComponents();
        this.initCustomComponents();
        GameFrameworkLog.info('GameFramework started.');
    }

    update(dt: number): void {
        const nowMs = performance.now();
        const realDt = (nowMs - this._lastRealMs) / 1000;
        this._lastRealMs = nowMs;
        GameFrameworkEntry.update(dt * GameEntry._gameSpeed, realDt);
    }

    onDestroy(): void {
        GameFrameworkEntry.shutdown();
        GameFrameworkLog.info('GameFramework shutdown.');
    }

    // ---- 初始化钩子（子类实现）----

    /**
     * 将框架内置 Component 实例赋给业务层静态属性。
     * 对应 StarForce GameEntry.Builtin.cs InitBuiltinComponents()。
     */
    protected initBuiltinComponents(): void {}

    /**
     * 将游戏层自定义 Component 实例赋给业务层静态属性，并启动流程。
     * 对应 StarForce GameEntry.Custom.cs InitCustomComponents()。
     */
    protected initCustomComponents(): void {}
}
