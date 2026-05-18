import { _decorator, Component, director } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';

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

import { ProcedureLaunch } from '../../Game/Procedure/ProcedureLaunch';
import { ProcedurePreload } from '../../Game/Procedure/ProcedurePreload';
import { ProcedureMain } from '../../Game/Procedure/ProcedureMain';

const { ccclass } = _decorator;

/**
 * 框架入口 Component，挂在场景根节点。
 *
 * 场景节点层级示例：
 * GameEntry (此 Component)
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

    // ---- 便捷访问子节点 Component（可选，业务层也可自行 getComponent） ----

    get eventComp(): EventComponent { return this.getComponentInChildren(EventComponent)!; }
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
        GameFrameworkEntry.update(dt, realDt);
    }

    onDestroy(): void {
        GameFrameworkEntry.shutdown();
        console.log('[GameFramework] Shutdown.');
    }

    private _startProcedure(): void {
        const procMgr = GameFrameworkEntry.getModule(ProcedureManager, MODULE_ID.PROCEDURE);
        procMgr.initialize([
            new ProcedureLaunch(),
            new ProcedurePreload(),
            new ProcedureMain(),
        ]);
        procMgr.startProcedure(ProcedureLaunch);
    }
}
