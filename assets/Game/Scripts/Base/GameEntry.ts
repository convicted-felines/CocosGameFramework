import { _decorator } from 'cc';
import { GameEntry as GFGameEntry } from 'db://assets/CocosGameFramework/Base/GameEntry';

// ---- 框架内置 Components（对应 StarForce GameEntry.Builtin.cs）----
import { BaseComponent } from 'db://assets/CocosGameFramework/Base/BaseComponent';
import { EventComponent } from 'db://assets/CocosGameFramework/Event/EventComponent';
import { FsmComponent } from 'db://assets/CocosGameFramework/FSM/FsmComponent';
import { ProcedureComponent } from 'db://assets/CocosGameFramework/Procedure/ProcedureComponent';
import { SettingComponent } from 'db://assets/CocosGameFramework/Setting/SettingComponent';
import { ConfigComponent } from 'db://assets/CocosGameFramework/Config/ConfigComponent';
import { DataTableComponent } from 'db://assets/CocosGameFramework/DataTable/DataTableComponent';
import { DataNodeComponent } from 'db://assets/CocosGameFramework/DataNode/DataNodeComponent';
import { ObjectPoolComponent } from 'db://assets/CocosGameFramework/ObjectPool/ObjectPoolComponent';
import { LocalizationComponent } from 'db://assets/CocosGameFramework/Localization/LocalizationComponent';
import { NetworkComponent } from 'db://assets/CocosGameFramework/Network/NetworkComponent';
import { WebRequestComponent } from 'db://assets/CocosGameFramework/WebRequest/WebRequestComponent';
import { ResourceComponent } from 'db://assets/CocosGameFramework/Resource/ResourceComponent';
import { SceneComponent } from 'db://assets/CocosGameFramework/Scene/SceneComponent';
import { UIComponent } from 'db://assets/CocosGameFramework/UI/UIComponent';
import { EntityComponent } from 'db://assets/CocosGameFramework/Entity/EntityComponent';
import { SoundComponent } from 'db://assets/CocosGameFramework/Sound/SoundComponent';
import { DownloadComponent } from 'db://assets/CocosGameFramework/Download/DownloadComponent';
import { FileSystemComponent } from 'db://assets/CocosGameFramework/FileSystem/FileSystemComponent';
import { ReferencePoolComponent } from 'db://assets/CocosGameFramework/ReferencePool/ReferencePoolComponent';

// ---- 游戏层自定义 Components（对应 StarForce GameEntry.Custom.cs）----
import { BuiltinDataComponent } from 'db://assets/Game/Scripts/BuiltinData/BuiltinDataComponent';

// ---- Component 扩展 mixin ----
import { EntityExtension } from 'db://assets/Game/Scripts/Entity/EntityExtension';
import { UIExtension } from 'db://assets/Game/Scripts/UI/UIExtension';
import { ProcedureChangeScene } from '../Procedure/ProcedureChangeScene';
import { ProcedureFPS } from 'db://assets/Game/Scripts/FPS/Procedure/ProcedureFPS';

// ---- 流程 ----
import { ProcedureCheckResources } from '../Procedure/ProcedureCheckResources';
import { ProcedureCheckVersion } from '../Procedure/ProcedureCheckVersion';
import { ProcedureInitResources } from '../Procedure/ProcedureInitResources';
import { ProcedureLaunch } from '../Procedure/ProcedureLaunch';
import { ProcedureMain } from '../Procedure/ProcedureMain';
import { ProcedureMenu } from '../Procedure/ProcedureMenu';
import { ProcedurePreload } from '../Procedure/ProcedurePreload';
import { ProcedureSplash } from '../Procedure/ProcedureSplash';
import { ProcedureUpdateResources } from '../Procedure/ProcedureUpdateResources';
import { ProcedureUpdateVersion } from '../Procedure/ProcedureUpdateVersion';
import { ProcedureVerifyResources } from '../Procedure/ProcedureVerifyResources';


const { ccclass } = _decorator;

/**
 * 将 mixin 类的所有方法复制到目标类的 prototype 上。
 * 对应参考项目中的 applyMixins 函数。
 */
export function applyMixins(target: any, mixins: any[]): void {
    for (const mixin of mixins) {
        for (const name of Object.getOwnPropertyNames(mixin.prototype)) {
            if (name === 'constructor') continue;
            Object.defineProperty(
                target.prototype,
                name,
                Object.getOwnPropertyDescriptor(mixin.prototype, name) ?? Object.create(null),
            );
        }
    }
}

/**
 * 游戏入口，对应 StarForce 中三个 partial class 文件的合并：
 *
 *   GameEntry.cs          → start() 调用顺序（由基类 GFGameEntry 实现）
 *   GameEntry.Builtin.cs  → 框架内置 Component 的静态属性 + initBuiltinComponents()
 *   GameEntry.Custom.cs   → 游戏层自定义 Component 的静态属性 + initCustomComponents()
 *
 * 扩展机制（mixin）：
 *   _extensionRegistry 声明哪些 Component 需要混入哪些扩展类。
 *   调用 GameEntry.registerExtension() 可在运行时动态追加新扩展，
 *   必须在 start() 执行前完成注册（例如在模块 onLoad 中调用）。
 */
@ccclass('GameEntry')
export class GameEntry extends GFGameEntry {

    // ========== 框架内置 Components ==========
    // 对应 StarForce GameEntry.Builtin.cs 中的静态属性

    static Base: BaseComponent = null!;
    static Event: EventComponent = null!;
    static Fsm: FsmComponent = null!;
    static Procedure: ProcedureComponent = null!;
    static Setting: SettingComponent = null!;
    static Config: ConfigComponent = null!;
    static DataTable: DataTableComponent = null!;
    static DataNode: DataNodeComponent = null!;
    static ObjectPool: ObjectPoolComponent = null!;
    static Localization: LocalizationComponent = null!;
    static Network: NetworkComponent = null!;
    static WebRequest: WebRequestComponent = null!;
    static Resource: ResourceComponent = null!;
    static Scene: SceneComponent = null!;
    static Sound: SoundComponent = null!;
    static Download: DownloadComponent = null!;
    static FileSystem: FileSystemComponent = null!;
    static ReferencePool: ReferencePoolComponent = null!;

    // 有扩展的 Component 声明为交叉类型，使 GameEntry.Entity.xxx() 可直接调用扩展方法
    static Entity: EntityComponent & EntityExtension = null!;
    static UI: UIComponent & UIExtension = null!;

    // ========== 游戏层自定义 Components ==========
    // 对应 StarForce GameEntry.Custom.cs 中的静态属性

    static BuiltinData: BuiltinDataComponent = null!;

    // ========== 扩展注册表 ==========
    // 内置扩展在此声明；新增扩展只需在此表里加一行，或在外部调用 registerExtension()

    private static readonly _extensionRegistry = new Map<
        new (...args: any[]) => any,
        (new (...args: any[]) => any)[]
    >([
        [EntityComponent, [EntityExtension]],
        [UIComponent,     [UIExtension]],
        // 新增扩展示例：
        // [SoundComponent, [MySoundExtension]],
    ]);

    private static _extensionsApplied = false;

    /**
     * 注册额外的 mixin 扩展，必须在 start() 执行前调用（例如在 onLoad 里）。
     *
     * 示例：
     *   GameEntry.registerExtension(SoundComponent, MySoundExtension);
     *   GameEntry.registerExtension(EntityComponent, AnotherEntityExtension);
     */
    static registerExtension(
        component: new (...args: any[]) => any,
        ...mixins: (new (...args: any[]) => any)[]
    ): void {
        const existing = GameEntry._extensionRegistry.get(component) ?? [];
        GameEntry._extensionRegistry.set(component, [...existing, ...mixins]);
    }

    private static _applyExtensions(): void {
        if (GameEntry._extensionsApplied) return;
        GameEntry._extensionsApplied = true;
        for (const [component, mixins] of GameEntry._extensionRegistry) {
            applyMixins(component, mixins);
        }
    }

    // ========== 初始化实现 ==========

    /** 对应 StarForce GameEntry.Builtin.cs InitBuiltinComponents() */
    protected override initBuiltinComponents(): void {
        // 混入扩展必须在 Component 实例被使用前完成
        GameEntry._applyExtensions();

        GameEntry.Base         = GFGameEntry.getComponent(BaseComponent)!;
        GameEntry.Event        = GFGameEntry.getComponent(EventComponent)!;
        GameEntry.Fsm          = GFGameEntry.getComponent(FsmComponent)!;
        GameEntry.Procedure    = GFGameEntry.getComponent(ProcedureComponent)!;
        GameEntry.Setting      = GFGameEntry.getComponent(SettingComponent)!;
        GameEntry.Config       = GFGameEntry.getComponent(ConfigComponent)!;
        GameEntry.DataTable    = GFGameEntry.getComponent(DataTableComponent)!;
        GameEntry.DataNode     = GFGameEntry.getComponent(DataNodeComponent)!;
        GameEntry.ObjectPool   = GFGameEntry.getComponent(ObjectPoolComponent)!;
        GameEntry.Localization = GFGameEntry.getComponent(LocalizationComponent)!;
        GameEntry.Network      = GFGameEntry.getComponent(NetworkComponent)!;
        GameEntry.WebRequest   = GFGameEntry.getComponent(WebRequestComponent)!;
        GameEntry.Resource     = GFGameEntry.getComponent(ResourceComponent)!;
        GameEntry.Scene        = GFGameEntry.getComponent(SceneComponent)!;
        GameEntry.Entity       = GFGameEntry.getComponent(EntityComponent)! as EntityComponent & EntityExtension;
        GameEntry.UI           = GFGameEntry.getComponent(UIComponent)! as UIComponent & UIExtension;
        GameEntry.Sound        = GFGameEntry.getComponent(SoundComponent)!;
        GameEntry.Download     = GFGameEntry.getComponent(DownloadComponent)!;
        GameEntry.FileSystem   = GFGameEntry.getComponent(FileSystemComponent)!;
        GameEntry.ReferencePool = GFGameEntry.getComponent(ReferencePoolComponent)!;
    }

    /** 对应 StarForce GameEntry.Custom.cs InitCustomComponents() */
    protected override initCustomComponents(): void {
        GameEntry.BuiltinData = GFGameEntry.getComponent(BuiltinDataComponent)!;

        GameEntry.BuiltinData.initBuildInfo();

        const launch = new ProcedureLaunch();
        GameEntry.Procedure.initialize([
            launch,
            new ProcedureSplash(),
            new ProcedureCheckVersion(),
            new ProcedureUpdateVersion(),
            new ProcedureVerifyResources(),
            new ProcedureCheckResources(),
            new ProcedureUpdateResources(),
            new ProcedureInitResources(),
            new ProcedurePreload(),
            new ProcedureChangeScene(),
            new ProcedureMenu(),
            new ProcedureMain(),
            new ProcedureFPS(),
        ], launch);
    }
}
