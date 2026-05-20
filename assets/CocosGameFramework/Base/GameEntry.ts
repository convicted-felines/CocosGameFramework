import { _decorator, Component, director, game } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { GameFrameworkComponent } from './GameFrameworkComponent';
import { ShutdownType } from './ShutdownType';
import { ProcedureBase } from '../../GameFramework/Procedure/ProcedureBase';

import { EventManager } from '../../GameFramework/Event/EventManager';
import { FsmManager } from '../../GameFramework/FSM/FsmManager';
import { ProcedureManager } from '../../GameFramework/Procedure/ProcedureManager';
import { SettingManager } from '../../GameFramework/Setting/SettingManager';
import { DataTableManager } from '../../GameFramework/DataTable/DataTableManager';
import { ObjectPoolManager } from '../../GameFramework/ObjectPool/ObjectPoolManager';
import { LocalizationManager } from '../../GameFramework/Localization/LocalizationManager';
import { NetworkManager } from '../../GameFramework/Network/NetworkManager';
import { UIManager } from '../../GameFramework/UI/UIManager';
import { EntityManager } from '../../GameFramework/Entity/EntityManager';
import { DataNodeManager } from '../../GameFramework/DataNode/DataNodeManager';
import { FileSystemManager } from '../../GameFramework/FileSystem/FileSystemManager';
import { CocosResourceManager } from '../Resource/CocosResourceManager';
import { CocosSoundManager } from '../Sound/CocosSoundManager';
import { CocosSceneManager } from '../Scene/CocosSceneManager';
import { CocosDownloadManager } from '../Download/CocosDownloadManager';

const { ccclass } = _decorator;

/**
 * 框架入口 Component 基类，挂在场景根节点。
 *
 * 游戏层通过继承本类并覆盖 createProcedures() 来注入游戏专属流程，
 * 对应 C# UnityGameFramework 中 partial class GameEntry 的模式。
 *
 * 子类需声明自己的 @ccclass，场景中挂载的是子类 Component。
 *
 * 场景节点层级示例（子类场景）：
 * GameEntry (游戏层子类 Component)
 * ├── BaseNode         → BaseComponent
 * ├── EventNode        → EventComponent
 * ├── FsmNode          → FsmComponent
 * ├── ProcedureNode    → ProcedureComponent
 * ├── SettingNode      → SettingComponent
 * ├── DataTableNode    → DataTableComponent
 * ├── ObjectPoolNode   → ObjectPoolComponent
 * ├── LocalizationNode → LocalizationComponent
 * ├── NetworkNode      → NetworkComponent
 * ├── DownloadNode     → DownloadComponent
 * ├── ResourceNode     → ResourceComponent
 * ├── SceneNode        → SceneComponent
 * ├── UIRoot           → UIComponent
 * ├── EntityRoot       → EntityComponent
 * ├── AudioNode        → SoundComponent
 * └── BuiltinDataNode  → BuiltinDataComponent (游戏层自定义)
 */
@ccclass('GFGameEntry')
export class GameEntry extends Component {
    private _lastRealMs: number = 0;

    private static _gameSpeed: number = 1;

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

    // ---- 内置管理器静态访问门面 ----

    static get Event(): EventManager {
        return GameFrameworkEntry.getModule(EventManager, MODULE_ID.EVENT);
    }

    static get Fsm(): FsmManager {
        return GameFrameworkEntry.getModule(FsmManager, MODULE_ID.FSM);
    }

    static get Procedure(): ProcedureManager {
        return GameFrameworkEntry.getModule(ProcedureManager, MODULE_ID.PROCEDURE);
    }

    static get Setting(): SettingManager {
        return GameFrameworkEntry.getModule(SettingManager, MODULE_ID.SETTING);
    }

    static get DataTable(): DataTableManager {
        return GameFrameworkEntry.getModule(DataTableManager, MODULE_ID.DATATABLE);
    }

    static get ObjectPool(): ObjectPoolManager {
        return GameFrameworkEntry.getModule(ObjectPoolManager, MODULE_ID.OBJPOOL);
    }

    static get Localization(): LocalizationManager {
        return GameFrameworkEntry.getModule(LocalizationManager, MODULE_ID.LOCALIZATION);
    }

    static get Network(): NetworkManager {
        return GameFrameworkEntry.getModule(NetworkManager, MODULE_ID.NETWORK);
    }

    static get Resource(): CocosResourceManager {
        return GameFrameworkEntry.getModule(CocosResourceManager, MODULE_ID.RESOURCE);
    }

    static get Scene(): CocosSceneManager {
        return GameFrameworkEntry.getModule(CocosSceneManager, MODULE_ID.SCENE);
    }

    static get UI(): UIManager {
        return GameFrameworkEntry.getModule(UIManager, MODULE_ID.UI);
    }

    static get Entity(): EntityManager {
        return GameFrameworkEntry.getModule(EntityManager, MODULE_ID.ENTITY);
    }

    static get Sound(): CocosSoundManager {
        return GameFrameworkEntry.getModule(CocosSoundManager, MODULE_ID.SOUND);
    }

    static get Download(): CocosDownloadManager {
        return GameFrameworkEntry.getModule(CocosDownloadManager, MODULE_ID.DOWNLOAD);
    }

    static get DataNode(): DataNodeManager {
        return GameFrameworkEntry.getModule(DataNodeManager, MODULE_ID.DATANODE);
    }

    static get FileSystem(): FileSystemManager {
        return GameFrameworkEntry.getModule(FileSystemManager, MODULE_ID.FILESYSTEM);
    }

    // ---- 生命周期 ----

    onLoad(): void {
        // 持久化根节点必须在 onLoad 中完成，早于任何场景切换。
        // 此时子节点的 onLoad 尚未执行，模块还未注册，不在这里启动流程。
        director.addPersistRootNode(this.node);
    }

    start(): void {
        // start() 在所有节点的 onLoad() 全部完成后才执行，
        // 等价于 Unity StarForce.GameEntry.Start() → InitBuiltinComponents()。
        // 此时子节点的 XxxComponent.onLoad() 已跑完，所有模块已注册。
        this._lastRealMs = performance.now();
        this._startProcedure();
        console.log('[GameFramework] Started.');
    }

    update(dt: number): void {
        const nowMs = performance.now();
        const realDt = (nowMs - this._lastRealMs) / 1000;
        this._lastRealMs = nowMs;
        GameFrameworkEntry.update(dt * GameEntry._gameSpeed, realDt);
    }

    onDestroy(): void {
        GameFrameworkEntry.shutdown();
        console.log('[GameFramework] Shutdown.');
    }

    // ---- 流程注入钩子 ----

    /**
     * 子类覆盖此方法，返回游戏所需的全部流程实例（按启动顺序排列）。
     * 第一个元素为初始流程。
     */
    protected createProcedures(): ProcedureBase[] {
        return [];
    }

    private _startProcedure(): void {
        const procedures = this.createProcedures();
        if (procedures.length === 0) {
            console.warn('[GameFramework] createProcedures() returned empty — no procedure started.');
            return;
        }
        const fsmMgr = GameFrameworkEntry.getModule(FsmManager, MODULE_ID.FSM);
        const procMgr = GameFrameworkEntry.getModule(ProcedureManager, MODULE_ID.PROCEDURE);
        procMgr.initialize(fsmMgr, procedures);
        procMgr.startProcedure(procedures[0].constructor as new () => ProcedureBase);
    }
}
