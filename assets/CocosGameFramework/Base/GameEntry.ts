import { _decorator, Component, director, game } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { GameFrameworkComponent } from './GameFrameworkComponent';
import { ShutdownType } from './ShutdownType';

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

import { CocosResourceManager } from '../Resource/CocosResourceManager';
import { CocosSoundManager } from '../Sound/CocosSoundManager';
import { CocosSceneManager } from '../Scene/CocosSceneManager';
import { CocosDownloadManager } from '../Download/CocosDownloadManager';
import { DataNodeManager } from '../../GameFramework/DataNode/DataNodeManager';

import { BaseComponent } from './BaseComponent';
import { EventComponent } from '../Event/EventComponent';
import { FsmComponent } from '../FSM/FsmComponent';
import { ProcedureComponent } from '../Procedure/ProcedureComponent';
import { SettingComponent } from '../Setting/SettingComponent';
import { DataTableComponent } from '../DataTable/DataTableComponent';
import { ObjectPoolComponent } from '../ObjectPool/ObjectPoolComponent';
import { LocalizationComponent } from '../Localization/LocalizationComponent';
import { NetworkComponent } from '../Network/NetworkComponent';
import { ResourceComponent } from '../Resource/ResourceComponent';
import { SceneComponent } from '../Scene/SceneComponent';
import { UIComponent } from '../UI/UIComponent';
import { EntityComponent } from '../Entity/EntityComponent';
import { SoundComponent } from '../Sound/SoundComponent';
import { DownloadComponent } from '../Download/DownloadComponent';
import { DataNodeComponent } from '../DataNode/DataNodeComponent';

import { ProcedureLaunch } from '../../Game/Procedure/ProcedureLaunch';
import { ProcedurePreload } from '../../Game/Procedure/ProcedurePreload';
import { ProcedureMain } from '../../Game/Procedure/ProcedureMain';

const { ccclass } = _decorator;

/**
 * 框架入口 Component，挂在场景根节点。
 *
 * 场景节点层级示例：
 * GameEntry (此 Component)
 * ├── BaseNode       → BaseComponent   ← 游戏速度 / 帧率 / 日志助手
 * ├── EventNode      → EventComponent
 * ├── FsmNode        → FsmComponent
 * ├── ProcedureNode  → ProcedureComponent
 * ├── SettingNode    → SettingComponent
 * ├── DataTableNode  → DataTableComponent
 * ├── ObjectPoolNode → ObjectPoolComponent
 * ├── LocalizationNode → LocalizationComponent
 * ├── NetworkNode    → NetworkComponent
 * ├── DownloadNode   → DownloadComponent
 * ├── ResourceNode   → ResourceComponent
 * ├── SceneNode      → SceneComponent
 * ├── UIRoot         → UIComponent
 * ├── EntityRoot     → EntityComponent
 * └── AudioNode      → SoundComponent
 */
@ccclass('GameEntry')
export class GameEntry extends Component {
    private _lastRealMs: number = 0;

    // 由 BaseComponent.setGameSpeed() 驱动，无需直接导入 BaseComponent，避免循环依赖
    private static _gameSpeed: number = 1;

    /** 由 BaseComponent 调用，同步游戏速度。 */
    static setGameSpeed(speed: number): void {
        GameEntry._gameSpeed = Math.max(0, speed);
    }

    /**
     * 按组件类型检索已注册的框架组件。
     * 等价于 Unity 的 GameEntry.GetComponent<T>()。
     */
    static getComponent<T extends GameFrameworkComponent>(type: new (...args: any[]) => T): T | null {
        return GameFrameworkComponent.getComponent(type);
    }

    /**
     * 关闭框架，支持三种模式：
     *  - ShutdownType.None    — 仅关闭框架模块
     *  - ShutdownType.Restart — 关闭后重新加载当前场景
     *  - ShutdownType.Quit   — 关闭后退出应用
     */
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

    // ---- 模块静态访问门面（通过 GameFrameworkEntry 直接取已注册实例） ----

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

    // ---- 便捷访问子节点 Component（可选，业务层也可自行 getComponent） ----

    get eventComp(): EventComponent { return this.getComponentInChildren(EventComponent)!; }
    get baseComp(): BaseComponent { return this.getComponentInChildren(BaseComponent)!; }
    get fsmComp(): FsmComponent { return this.getComponentInChildren(FsmComponent)!; }
    get procedureComp(): ProcedureComponent { return this.getComponentInChildren(ProcedureComponent)!; }
    get resourceComp(): ResourceComponent { return this.getComponentInChildren(ResourceComponent)!; }
    get uiComp(): UIComponent { return this.getComponentInChildren(UIComponent)!; }
    get entityComp(): EntityComponent { return this.getComponentInChildren(EntityComponent)!; }
    get soundComp(): SoundComponent { return this.getComponentInChildren(SoundComponent)!; }
    get sceneComp(): SceneComponent { return this.getComponentInChildren(SceneComponent)!; }
    get networkComp(): NetworkComponent { return this.getComponentInChildren(NetworkComponent)!; }
    get downloadComp(): DownloadComponent { return this.getComponentInChildren(DownloadComponent)!; }
    get localizationComp(): LocalizationComponent { return this.getComponentInChildren(LocalizationComponent)!; }
    get settingComp(): SettingComponent { return this.getComponentInChildren(SettingComponent)!; }
    get dataTableComp(): DataTableComponent { return this.getComponentInChildren(DataTableComponent)!; }
    get objectPoolComp(): ObjectPoolComponent { return this.getComponentInChildren(ObjectPoolComponent)!; }
    get dataNodeComp(): DataNodeComponent { return this.getComponentInChildren(DataNodeComponent)!; }

    // ---- 生命周期 ----

    onLoad(): void {
        // 子节点 Component 的 onLoad 先执行，各模块已完成 registerModule。
        // GameEntry 只负责：持久化、启动流程、驱动 update。
        director.addPersistRootNode(this.node);
        this._startProcedure();
        this._lastRealMs = performance.now();
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

    private _startProcedure(): void {
        const fsmMgr = GameFrameworkEntry.getModule(FsmManager, MODULE_ID.FSM);
        const procMgr = GameFrameworkEntry.getModule(ProcedureManager, MODULE_ID.PROCEDURE);
        procMgr.initialize(fsmMgr, [
            new ProcedureLaunch(),
            new ProcedurePreload(),
            new ProcedureMain(),
        ]);
        procMgr.startProcedure(ProcedureLaunch);
    }
}
