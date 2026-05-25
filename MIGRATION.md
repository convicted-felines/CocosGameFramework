# GameFramework → CocosGameFramework 迁移指南

Unity GameFramework（C# / UnityGameFramework）移植到 Cocos Creator 3.8.8（TypeScript）的完整差异说明。

---

## 迁移进度总览

> 最后更新：2026-05-25

### 核心层（`assets/GameFramework/`）

| 模块 | 核心接口 | Manager 实现 | 状态 |
|------|----------|-------------|------|
| Base / Entry | `GameFrameworkModule` `GameFrameworkEntry` `GameFrameworkModuleIds` | — | ✅ 完成 |
| 基础数据结构 | — | `GameFrameworkLinkedList` `GameFrameworkLinkedListRange` `GameFrameworkMultiDictionary` | ✅ 完成 |
| 日志 | `ILogHelper` `GameFrameworkLog` `GameFrameworkLogLevel` | — | ✅ 完成 |
| 任务池 | `ITaskAgent` `TaskBase` `TaskInfo` `StartTaskStatus` `TaskStatus` | `TaskPool` | ✅ 完成 |
| 工具集 | `IJsonHelper` `ITextHelper` `ICompressionHelper` | `Utility`（Path / Text / Json / Converter / Encryption / Random / Verifier / **Compression**）`BinaryExtension` `StringExtension` | ✅ 完成 |
| Variable | `Variable<T>`（泛型基类） | `VarBoolean` `VarInt8/16/32/64` `VarUInt8/16/32/64` `VarFloat` `VarDouble` `VarChar` `VarString` `VarByteArray` `VarCharArray` `VarDateTime` `VarObject` `VarVec2/3/4` `VarQuat` `VarColor` `VarRect` | ✅ 完成 |
| ReferencePool | `IReference` `ReferencePoolInfo` | `ReferencePool`（静态） | ✅ 完成 |
| EventManager | `IEventManager` `BaseEventArgs` `GameEventArgs` | `EventManager` | ✅ 完成 |
| FsmManager | `IFsmManager` `IFsm` `FsmState` | `FsmManager` `Fsm` | ✅ 完成 |
| ProcedureManager | `IProcedureManager` `ProcedureBase` | `ProcedureManager` | ✅ 完成 |
| ObjectPoolManager | `IObjectPoolManager` `IObjectPool` `ObjectBase` `ObjectInfo` | `ObjectPoolManager` `ObjectPool` | ✅ 完成 |
| LocalizationManager | `ILocalizationManager` `ILocalizationHelper` | `LocalizationManager` | ✅ 完成 |
| SettingManager | `ISettingManager` `ISettingHelper` | `SettingManager` | ✅ 完成 |
| ConfigManager | `IConfigManager` `IConfigHelper` | `ConfigManager` | ✅ 完成 |
| DataTableManager | `IDataTableManager` `IDataTable` `IDataRow` `IDataTableHelper` | `DataTableManager` `DataTable` | ✅ 完成 |
| DataNodeManager | `IDataNodeManager` `IDataNode` | `DataNodeManager` `DataNode` | ✅ 完成 |
| NetworkManager | `INetworkManager` `INetworkChannel` `INetworkChannelHelper` `IPacketHeader` `IPacketHandler` `Packet` `NetworkEventArgs` `AddressFamily` `ServiceType` `NetworkErrorCode` | `NetworkManager` | ✅ 完成 |
| WebRequestManager | `IWebRequestManager` `WebRequestEventArgs` | `WebRequestManager` | ✅ 完成 |
| UIManager | `IUIManager` `IUIForm` `IUIGroup` `IUIGroupHelper` `IUIFormHelper` `UIEventArgs` | `UIManager` | ✅ 完成 |
| EntityManager | `IEntityManager` `IEntity` `IEntityGroup` `IEntityGroupHelper` `IEntityHelper` `EntityStatus` `EntityEventArgs` | `EntityManager` | ✅ 完成 |
| SoundManager | `ISoundManager` `ISoundGroup` `ISoundAgent` `ISoundHelper` `PlaySoundParams` `PlaySoundErrorCode` | `SoundManager` | ✅ 完成 |
| ResourceManager | `IResourceManager` `ResourceEventArgs` | — (接口层) | ✅ 完成 |
| DownloadManager | `IDownloadManager` `DownloadEventArgs` | `DownloadManager` | ✅ 完成 |
| SceneManager | `ISceneManager` `SceneEventArgs` | `SceneManager` | ✅ 完成 |
| FileSystemManager | `IFileSystemManager` `IFileSystem` `IFileSystemHelper` `FileInfo` `FileSystemAccess` | `FileSystemManager` `FileSystem` | ✅ 完成 |

### 引擎适配层（`assets/CocosGameFramework/`）

| 模块 | Component 包装 | Helper / 具体实现 | 状态 |
|------|---------------|------------------|------|
| Base | `GameEntry` `GameFrameworkComponent` `BaseComponent` `ShutdownType` | — | ✅ 完成 |
| **Utility（新）** | — | `HelperRegistry` `Log` `LogHelperBase` `DefaultLogHelper` `LogHelperType` | ✅ 完成 |
| EventComponent | `EventComponent` | — | ✅ 完成 |
| FsmComponent | `FsmComponent` | — | ✅ 完成 |
| ProcedureComponent | `ProcedureComponent` | — | ✅ 完成 |
| ObjectPoolComponent | `ObjectPoolComponent` | — | ✅ 完成 |
| ReferencePoolComponent | `ReferencePoolComponent` | — | ✅ 完成 |
| SettingComponent | `SettingComponent` | `SettingHelperBase` `SettingHelperType` `LocalStorageSettingHelper` | ✅ 完成 |
| ConfigComponent | `ConfigComponent` | `ConfigHelperBase` `ConfigHelperType` `DefaultConfigHelper` `ConfigEventArgs` | ✅ 完成 |
| LocalizationComponent | `LocalizationComponent` | `LocalizationHelperBase` `LocalizationHelperType` `DefaultLocalizationHelper` | ✅ 完成 |
| DataTableComponent | `DataTableComponent` | `DataRowBase` `DataTableHelperBase` `DataTableHelperType` `DefaultDataTableHelper` `DataTableEventArgs` | ✅ 完成 |
| DataNodeComponent | `DataNodeComponent` | — | ✅ 完成 |
| NetworkComponent | `NetworkComponent` | `NetworkChannelHelperBase` `NetworkChannelHelperType` `DefaultNetworkChannelHelper` | ✅ 完成 |
| WebRequestComponent | `WebRequestComponent` | `CocosWebRequestManager` | ✅ 完成 |
| ResourceComponent | `ResourceComponent` | `CocosResourceManager` | ✅ 完成 |
| SceneComponent | `SceneComponent` | `CocosSceneManager` | ✅ 完成 |
| UIComponent | `UIComponent` | `UIFormLogic` `UIFormHelperBase` `UIFormHelperType` `DefaultUIFormHelper` `DefaultUIGroupHelper` | ✅ 完成 |
| EntityComponent | `EntityComponent` | `EntityLogic` `EntityHelperBase` `EntityHelperType` `DefaultEntityHelper` `DefaultEntityGroupHelper` | ✅ 完成 |
| SoundComponent | `SoundComponent` | `CocosSoundManager` `SoundHelperBase` `SoundHelperType` `DefaultSoundHelper` `SoundAgentHelperBase` `DefaultSoundAgentHelper` `SoundGroupHelperBase` `DefaultSoundGroupHelper` | ✅ 完成 |
| DownloadComponent | `DownloadComponent` | `CocosDownloadManager` `DownloadAgentHelperBase` `DownloadAgentHelperType` `DefaultDownloadAgentHelper` | ✅ 完成 |
| FileSystemComponent | `FileSystemComponent` | `FileSystemHelperBase` `FileSystemHelperType` `DefaultFileSystemHelper` `AndroidFileSystemHelper` | ✅ 完成 |

### 业务层示例（`assets/Game/`）

| 模块 | 文件 | 状态 |
|------|------|------|
| Procedure（12 个） | `ProcedureLaunch` `ProcedureSplash` `ProcedureCheckVersion` `ProcedureUpdateVersion` `ProcedureVerifyResources` `ProcedureCheckResources` `ProcedureUpdateResources` `ProcedureInitResources` `ProcedurePreload` `ProcedureChangeScene` `ProcedureMenu` `ProcedureMain` | ✅ 完成 |
| DataTable 数据行 | `DREntity` `DRMusic` `DRScene` `DRSound` `DRUISound` | ✅ 完成 |
| 扩展工具 | `UIExtension` `EntityExtension` | ✅ 完成 |
| 基础 | `GameEntry`（业务层）`BuiltinDataComponent` `Constant`（ResourceMode 枚举、Setting Key、Layer） | ✅ 完成 |
| 测试面板 | `TestPanelComponent` `TestRunner` `TestCase` + 6 个测试用例 | ✅ 完成 |

### 模块 Update 优先级（高 → 低）

| 优先级 | 模块 |
|--------|------|
| 100 | EventManager |
| 90 | FsmManager |
| 80 | ProcedureManager |
| 70 | SettingManager |
| 68 | LocalizationManager |
| 65 | DataTableManager |
| 62 | ObjectPoolManager |
| 60 | ResourceManager |
| 58 | FileSystemManager |
| 55 | NetworkManager |
| 50 | UIManager |
| 45 | SceneManager |
| 40 | EntityManager |
| 30 | SoundManager |
| 25 | DownloadManager |

---

## 架构对比

| 层级 | Unity GameFramework | CocosGameFramework (Cocos) |
|------|--------------------|-----------------------------|
| 核心层 | `GameFramework/` (纯 C#) | `assets/GameFramework/` (纯 TS，禁止 `import 'cc'`) |
| 引擎层 | `UnityGameFramework/` | `assets/CocosGameFramework/` |
| 业务层 | `Assets/GameMain/` | `assets/Game/` |
| 入口节点 | `GameFramework.prefab` | 挂 `GameEntry` Component 的空节点 |

**核心分层原则**：`GameFramework/` 下所有文件严禁 `import { ... } from 'cc'`，引擎调用全部通过 `IXxxHelper` 接口注入。

---

## 模块注册机制

### C# 原版（反射）

```csharp
// 通过接口名字符串 + Activator.CreateInstance 反射创建
T module = GameFrameworkEntry.GetModule<IEventManager>();
```

### TypeScript 版（字符串 key + 构造函数）

```typescript
// 注册（通常在 GameEntry._initModules()）
GameFrameworkEntry.registerModule(MODULE_ID.EVENT, new EventManager());

// 获取（懒加载，或直接用门面属性）
const eventMgr = GameFrameworkEntry.getModule(EventManager, MODULE_ID.EVENT);

// 推荐：通过 GameEntry 静态门面
GameEntry.Event.fire(this, MyEventArgs.create('hello'));
```

**MODULE_ID** 定义在 `GameFramework/Base/GameFrameworkModuleIds.ts`，每个模块 ID 是唯一字符串常量，替代 C# 中的 `typeof(T).FullName`。

---

## 模块生命周期对比

| C# | TypeScript |
|----|-----------|
| `GameFrameworkModule.Priority` | `get priority(): number` |
| `GameFrameworkModule.Update(float, float)` | `update(elapseSeconds, realElapseSeconds)` |
| `GameFrameworkModule.Shutdown()` | `shutdown()` |
| `GameEntry.Update()` (MonoBehaviour) | `GameEntry.update(dt)` (Component) |
| `Time.deltaTime` → elapseSeconds | Cocos `update(dt)` 的 `dt` 参数（已含 timeScale） |
| `Time.unscaledDeltaTime` → realElapseSeconds | `performance.now()` 差值计算 |

**更新顺序**：两者均按 `priority` 降序 Update（高优先级先执行），逆序 Shutdown。

---

## 各模块具体差异

### EventManager

| 特性 | C# | TypeScript |
|------|-----|-----------|
| 订阅 | `Subscribe(int eventId, EventHandler<T>)` | `subscribe(eventId: string, handler, priority?)` |
| 事件 ID | `int` 类型 | `string` 类型（避免枚举依赖） |
| 延迟派发 | `Fire()` | `fire()` |
| 立即派发 | `FireNow()` | `fireNow()` |
| 事件参数 | `GameEventArgs : BaseEventArgs` | 继承 `BaseEventArgs implements IReference` |
| 自动回池 | 派发后 `ReferencePool.Release()` | 同，派发后 `ReferencePool.release(e)` |

```typescript
// 定义事件参数
class PlayerDieEventArgs extends BaseEventArgs {
    static readonly EVENT_ID = 'PlayerDie';
    get id() { return PlayerDieEventArgs.EVENT_ID; }
    playerId: number = 0;
    clear() { this.playerId = 0; }

    static create(id: number): PlayerDieEventArgs {
        const args = ReferencePool.acquire(PlayerDieEventArgs);
        args.playerId = id;
        return args;
    }
}

// 订阅
GameEntry.Event.subscribe(PlayerDieEventArgs.EVENT_ID, this._onPlayerDie, this);

// 派发（延迟到下一帧）
GameEntry.Event.fire(this, PlayerDieEventArgs.create(1));
```

### FSM

| 特性 | C# | TypeScript |
|------|-----|-----------|
| 泛型约束 | `where T : class` | `T extends object` |
| 状态方法 | `internal virtual OnEnter(IFsm<T>)` | `onEnter(fsm: IFsm<T>): void`（public，框架约定） |
| 切换状态 | `ChangeState<TState>(IFsm<T>)` | `this.changeState(fsm, TState)`（protected 工具方法） |
| 创建 FSM | `FsmManager.CreateFsm<T>(name, owner, states)` | `FsmManager.createFsm(name, owner, states)` |
| 启动 FSM | FSM 在 CreateFsm 时传入初始状态 | `(fsm as Fsm<T>).start(InitialStateCtor)` |
| 数据共享 | `IFsm<T>.SetData<TData>(string, TData)` | `fsm.setData<TData>(key, data)` |

```typescript
class IdleState extends FsmState<MyCharacter> {
    onEnter(fsm: IFsm<MyCharacter>): void {
        console.log('Enter Idle, owner:', fsm.owner.name);
    }
    onUpdate(fsm: IFsm<MyCharacter>, dt: number, rdt: number): void {
        if (isAttacking) {
            this.changeState(fsm, AttackState); // 切换状态
        }
    }
}
```

### Procedure（流程）

| 特性 | C# | TypeScript |
|------|-----|-----------|
| 基类 | `ProcedureBase : FsmState<ProcedureOwner>` | `ProcedureBase extends FsmState<ProcedureManager>` |
| 初始化 | `ProcedureManager.Initialize(fsmManager, procedures)` | `procedureManager.initialize(procedures[])` |
| 启动 | `ProcedureManager.StartProcedure<T>()` | `procedureManager.startProcedure(ProcedureLaunch)` |
| 切换 | `ChangeState<ProcedureMain>(fsm)` | `this.changeState(fsm, ProcedureMain)` |
| FsmManager 依赖 | 通过 Initialize 注入 | 通过 `setFsmManager(fsmMgr)` 注入 |

```typescript
export class ProcedureLaunch extends ProcedureBase {
    onEnter(fsm: IFsm<ProcedureManager>): void {
        // 初始化完成后进入下一流程
        this.changeState(fsm, ProcedurePreload);
    }
}
```

### ResourceManager

| 特性 | C# | TypeScript (Cocos) |
|------|-----|---------------------|
| 加载资源 | `LoadAsset<T>(assetName, LoadAssetCallbacks, userData)` | `loadAsset(bundle, path, type, onSuccess, onFailure)` |
| Bundle 管理 | `ResourcePackage` / `AssetBundle` | `assetManager.loadBundle()` / `assetManager.getBundle()` |
| Promise 支持 | 无 | `loadAssetAsync<T>()` 返回 `Promise<T>` |
| 卸载 | `UnloadAsset(asset)` | `unloadAsset(asset)` → `assetManager.releaseAsset()` |
| 类型参数 | `typeof(T)` 传入 | `assetType: new() => T`（构造函数）传入 |

```typescript
// 回调风格
GameEntry.Resource.loadAsset('resources', 'Prefabs/Hero', Prefab,
    (prefab, duration) => console.log(`Loaded in ${duration}s`),
    (name, msg) => console.error(msg)
);

// Promise 风格
const prefab = await GameEntry.Resource.loadAssetAsync('resources', 'Prefabs/Hero', Prefab);
```

### UIManager

| 特性 | C# | TypeScript (Cocos) |
|------|-----|---------------------|
| UI 实体类 | `UIFormLogic : UIForm : MonoBehaviour` | `UIFormLogic extends Component` |
| 打开 UI | `OpenUIForm(assetName, groupName, pauseCovered, userData)` | `openUIForm(assetName, bundleName, groupName, pauseCovered, userData)` |
| 关闭 UI | `CloseUIForm(serialId)` | `closeUIForm(serialId)` |
| 生命周期 | `OnInit/OnOpen/OnClose/OnPause/OnResume` | `onInit/onOpen/onClose/onPause/onResume` |
| Helper 注入 | `SetUIFormHelper()` | `uiMgr.setHelper(new DefaultUIFormHelper(uiRoot))` |
| UI 分组 | `AddUIGroup(name, depth)` | `addUIGroup(name, depth)` |

```typescript
// 自定义 UI（挂在 Prefab 上）
@ccclass('MainUI')
export class MainUI extends UIFormLogic {
    onOpen(userData?: object): void {
        console.log('MainUI opened!', userData);
    }
}

// 打开 UI
GameEntry.UI.openUIForm('Prefabs/UI/MainUI', 'resources', 'Default', false, { level: 1 });
```

### EntityManager

| 特性 | C# | TypeScript (Cocos) |
|------|-----|---------------------|
| 实体逻辑类 | `EntityLogic : Entity : MonoBehaviour` | `EntityLogic extends Component` |
| 显示实体 | `ShowEntity(id, type, assetName, group, priority, userData)` | `showEntity(id, assetName, bundleName, group, priority, userData)` |
| 隐藏实体 | `HideEntity(entityId)` | `hideEntity(entityId)` |
| 挂载子实体 | `AttachEntity(childId, parentId, parentTransformPath)` | `attachEntity(childId, parentId)` |
| 生命周期 | `OnInit/OnShow/OnHide/OnRecycle/OnUpdate` | `onInit/onShow/onHide/onUpdate` |

```typescript
@ccclass('HeroEntity')
export class HeroEntity extends EntityLogic {
    onShow(userData?: object): void {
        console.log('Hero spawned!');
    }
    onHide(isShutdown: boolean): void {
        console.log('Hero hidden');
    }
}

// 显示实体
GameEntry.Entity.showEntity(1001, 'Prefabs/Hero', 'resources', 'Default', 0, { heroId: 1 });
```

### SoundManager

| 特性 | C# | TypeScript (Cocos) |
|------|-----|---------------------|
| 音效组 | `AddSoundGroup(name, avoidReplace, mute, volume)` | `addSoundGroup(name, avoidReplace, mute, volume)` |
| 播放 | `PlaySound(assetName, groupName, params, userData)` | `playSound(assetName, bundleName, groupName, params, userData)` |
| 停止 | `StopSound(serialId, fadeOut)` | `stopSound(serialId, fadeOutSeconds)` |
| 引擎实现 | `AudioSource` Component | `CocosSoundManager extends SoundManager`（重写 `_doStop` 等） |

```typescript
GameEntry.Sound.playSound('Sounds/bgm', 'resources', 'Music', { loop: true, volume: 0.8 });
GameEntry.Sound.playSound('Sounds/click', 'resources', 'Sound');
```

### SettingManager

| 特性 | C# | TypeScript (Cocos) |
|------|-----|---------------------|
| 后端存储 | `PlayerPrefs` | `sys.localStorage`（Web 对应 `localStorage`，Native 对应 JSB 等效） |
| 读取 int | `GetInt(key, default)` | `getInt(key, defaultValue)` |
| 存对象 | `GetObject<T>(key)` | `getObject<T>(key)` → `JSON.parse/stringify` |
| 保存 | `Save()` (PlayerPrefs.Save) | `save()`（localStorage 自动持久化，无需显式调用） |

### DataTableManager

| 特性 | C# | TypeScript |
|------|-----|-----------|
| 数据行基类 | `DataRowBase` | `IDataRow` 接口 |
| 解析方式 | `ParseFromSegment(GameFrameworkSegment)` | `parseFromRow(fields: string[])` 或 `parseFromJson(data)` |
| 获取行 | `GetDataRow<T>(id)` | `getDataRow(id)` |
| 创建表 | `CreateDataTable<T>(name)` | `createDataTable<T>(name, RowClass)` |

```typescript
// 定义数据行
class DRHero implements IDataRow {
    id: number = 0;
    name: string = '';
    maxHp: number = 0;

    parseFromRow(fields: string[]): boolean {
        this.id = parseInt(fields[0]);
        this.name = fields[1];
        this.maxHp = parseInt(fields[2]);
        return !isNaN(this.id);
    }

    parseFromJson(data: Record<string, any>): boolean {
        this.id = data.id;
        this.name = data.name;
        this.maxHp = data.maxHp;
        return typeof this.id === 'number';
    }
}

// 创建和使用
const table = GameEntry.DataTable.createDataTable('Hero', DRHero);
table.parseFromJson([{ id: 1, name: 'Warrior', maxHp: 100 }]);
const hero = table.getDataRow(1); // DRHero 实例
```

### ObjectPoolManager

| 特性 | C# | TypeScript |
|------|-----|-----------|
| 对象基类 | `ObjectBase` | `ObjectBase` |
| 创建池 | `CreateSingleSpawnObjectPool<T>(name, capacity, expireTime)` | `createObjectPool<T>(name, type, capacity, expireTime)` |
| 取出对象 | `pool.Spawn(name)` | `pool.spawn(name)` |
| 归还对象 | `pool.Unspawn(obj)` | `pool.unspawn(obj)` |
| 自动释放 | 定时 `Release()` | `ObjectPoolManager.update()` 内定时调用（默认 60 秒） |

---

## 跨场景持久化

| C# (Unity) | TypeScript (Cocos) |
|-----------|---------------------|
| `DontDestroyOnLoad(gameObject)` | `director.addPersistRootNode(this.node)` |
| 静态类天然持久 | ES Module 缓存保证 `GameFrameworkEntry` 静态属性单例不被 GC |

---

## ReferencePool 对比

| 特性 | C# | TypeScript |
|------|-----|-----------|
| 接口 | `IReference` | `IReference`（含 `clear()` 方法） |
| 取出 | `ReferencePool.Acquire<T>()` | `ReferencePool.acquire(MyClass)` |
| 归还 | `ReferencePool.Release(ref)` | `ReferencePool.release(ref)`（内部调用 `clear()`） |
| 类型键 | `typeof(T)` | `constructor` 引用（`ref.constructor`） |

---

## 文件路径速查表

```
assets/
├── GameFramework/               ← 核心层（零引擎依赖）
│   ├── Base/
│   │   ├── GameFrameworkModule.ts
│   │   ├── GameFrameworkEntry.ts
│   │   ├── GameFrameworkModuleIds.ts
│   │   ├── GameFrameworkError.ts
│   │   ├── DataStruct/
│   │   │   ├── GameFrameworkLinkedList.ts
│   │   │   ├── GameFrameworkLinkedListRange.ts
│   │   │   └── GameFrameworkMultiDictionary.ts
│   │   ├── Log/                 ← ILogHelper + GameFrameworkLog + GameFrameworkLogLevel
│   │   └── TaskPool/            ← ITaskAgent + TaskBase + TaskPool + TaskInfo + StartTaskStatus + TaskStatus
│   ├── Utility/                 ← Path / Text / Json / Converter / Encryption / Random / Verifier / Compression + BinaryExtension + StringExtension
│   ├── Variable/                ← Variable<T>(基类) + VarBoolean/VarInt8~64/VarUInt8~64/VarFloat/VarDouble/VarChar/VarString/VarByteArray/VarCharArray/VarDateTime/VarObject/VarVec2/VarVec3/VarVec4/VarQuat/VarColor/VarRect
│   ├── ReferencePool/           ← IReference + ReferencePool + ReferencePoolInfo
│   ├── Event/                   ← BaseEventArgs + GameEventArgs + IEventManager + EventManager
│   ├── FSM/                     ← IFsm + FsmState + Fsm + FsmManager
│   ├── Procedure/               ← ProcedureBase + ProcedureManager
│   ├── ObjectPool/              ← ObjectBase + ObjectInfo + ObjectPool + ObjectPoolManager
│   ├── Resource/                ← IResourceManager + ResourceEventArgs（接口）
│   ├── Setting/                 ← ISettingManager + ISettingHelper + SettingManager
│   ├── Config/                  ← IConfigManager + IConfigHelper + ConfigManager
│   ├── DataTable/               ← IDataRow + IDataTable + IDataTableHelper + DataTable + DataTableManager
│   ├── DataNode/                ← IDataNode + DataNode + IDataNodeManager + DataNodeManager
│   ├── Scene/                   ← ISceneManager + SceneEventArgs + SceneManager
│   ├── Network/                 ← INetworkManager + INetworkChannel + INetworkChannelHelper + IPacketHeader + IPacketHandler + Packet + NetworkEventArgs + AddressFamily + ServiceType + NetworkErrorCode + NetworkManager
│   ├── WebRequest/              ← IWebRequestManager + WebRequestEventArgs + WebRequestManager
│   ├── Localization/            ← ILocalizationManager + ILocalizationHelper + LocalizationManager
│   ├── Download/                ← IDownloadManager + DownloadEventArgs + DownloadManager
│   ├── UI/                      ← IUIForm + IUIFormHelper + IUIGroup + IUIGroupHelper + IUIManager + UIManager + UIEventArgs
│   ├── Entity/                  ← IEntity + IEntityGroup + IEntityGroupHelper + IEntityHelper + IEntityManager + EntityStatus + EntityEventArgs + EntityManager
│   ├── Sound/                   ← ISoundManager + ISoundHelper + PlaySoundParams + PlaySoundErrorCode + SoundManager
│   └── FileSystem/              ← IFileSystemManager + IFileSystem + IFileSystemHelper + FileInfo + FileSystemAccess + FileSystem + FileSystemManager
│
├── CocosGameFramework/          ← 引擎适配层
│   ├── Base/
│   │   ├── GameEntry.ts         ← Component 驱动 + 模块注册门面
│   │   ├── GameFrameworkComponent.ts
│   │   ├── BaseComponent.ts     ← 日志/帧率/游戏速度控制，Inspector 可选 LogHelperType
│   │   └── ShutdownType.ts
│   ├── Utility/                 ← 新增：引擎层工具集
│   │   ├── HelperRegistry.ts    ← 替代反射的 Helper 注册表（string→ctor）
│   │   ├── Log.ts               ← 业务层日志门面（转发 GameFrameworkLog）
│   │   ├── LogHelperBase.ts     ← 日志辅助器抽象基类（Component）
│   │   ├── DefaultLogHelper.ts  ← 默认实现（console.*）
│   │   └── LogHelperType.ts     ← Inspector 下拉枚举
│   ├── Event/EventComponent.ts
│   ├── Fsm/FsmComponent.ts
│   ├── Procedure/ProcedureComponent.ts
│   ├── ObjectPool/ObjectPoolComponent.ts
│   ├── ReferencePool/ReferencePoolComponent.ts
│   ├── Setting/
│   │   ├── SettingComponent.ts
│   │   ├── SettingHelperBase.ts
│   │   ├── SettingHelperType.ts ← Inspector 枚举
│   │   └── LocalStorageSettingHelper.ts
│   ├── Config/
│   │   ├── ConfigComponent.ts
│   │   ├── ConfigHelperBase.ts
│   │   ├── ConfigHelperType.ts  ← Inspector 枚举
│   │   ├── DefaultConfigHelper.ts
│   │   └── ConfigEventArgs.ts
│   ├── Localization/
│   │   ├── LocalizationComponent.ts
│   │   ├── LocalizationHelperBase.ts
│   │   ├── LocalizationHelperType.ts ← Inspector 枚举
│   │   └── DefaultLocalizationHelper.ts
│   ├── DataTable/
│   │   ├── DataTableComponent.ts
│   │   ├── DataRowBase.ts
│   │   ├── DataTableHelperBase.ts
│   │   ├── DataTableHelperType.ts ← Inspector 枚举
│   │   ├── DefaultDataTableHelper.ts
│   │   └── DataTableEventArgs.ts
│   ├── DataNode/DataNodeComponent.ts
│   ├── Network/
│   │   ├── NetworkComponent.ts
│   │   ├── NetworkChannelHelperBase.ts
│   │   ├── NetworkChannelHelperType.ts ← Inspector 枚举
│   │   └── DefaultNetworkChannelHelper.ts
│   ├── WebRequest/
│   │   ├── WebRequestComponent.ts
│   │   └── CocosWebRequestManager.ts
│   ├── Resource/
│   │   ├── ResourceComponent.ts
│   │   └── CocosResourceManager.ts
│   ├── Scene/
│   │   ├── SceneComponent.ts
│   │   └── CocosSceneManager.ts
│   ├── UI/
│   │   ├── UIComponent.ts
│   │   ├── UIFormLogic.ts       ← Prefab 上的 Component 基类
│   │   ├── UIFormHelperBase.ts
│   │   ├── UIFormHelperType.ts  ← Inspector 枚举
│   │   ├── DefaultUIFormHelper.ts
│   │   └── DefaultUIGroupHelper.ts ← 新增：组深度 → siblingIndex
│   ├── Entity/
│   │   ├── EntityComponent.ts
│   │   ├── EntityLogic.ts       ← Prefab 上的 Component 基类
│   │   ├── EntityHelperBase.ts
│   │   ├── EntityHelperType.ts  ← Inspector 枚举
│   │   ├── DefaultEntityHelper.ts
│   │   └── DefaultEntityGroupHelper.ts ← 新增：为每组创建根节点
│   ├── Sound/
│   │   ├── SoundComponent.ts
│   │   ├── CocosSoundManager.ts
│   │   ├── SoundHelperBase.ts
│   │   ├── SoundHelperType.ts   ← Inspector 枚举
│   │   ├── DefaultSoundHelper.ts
│   │   ├── SoundAgentHelperBase.ts
│   │   ├── DefaultSoundAgentHelper.ts
│   │   ├── SoundGroupHelperBase.ts
│   │   └── DefaultSoundGroupHelper.ts
│   ├── Download/
│   │   ├── DownloadComponent.ts
│   │   ├── CocosDownloadManager.ts
│   │   ├── DownloadAgentHelperBase.ts  ← 新增：下载代理抽象基类
│   │   ├── DownloadAgentHelperType.ts  ← Inspector 枚举
│   │   └── DefaultDownloadAgentHelper.ts ← 新增：XHR + Range 断点续传
│   └── FileSystem/
│       ├── FileSystemComponent.ts
│       ├── FileSystemHelperBase.ts
│       ├── FileSystemHelperType.ts ← Inspector 枚举
│       ├── DefaultFileSystemHelper.ts
│       └── AndroidFileSystemHelper.ts
│
└── Game/                        ← 业务层
    ├── Scripts/
    │   ├── Base/GameEntry.ts          ← 注册 12 个 Procedure
    │   ├── BuiltinData/BuiltinDataComponent.ts ← build-info.json / 默认字典 / resourceMode
    │   ├── Definition/Constant.ts    ← ResourceMode 枚举 / Setting Key / AssetPriority / Layer
    │   ├── UI/UIExtension.ts
    │   ├── Entity/EntityExtension.ts
    │   ├── DataTable/               ← DREntity / DRMusic / DRScene / DRSound / DRUISound
    │   ├── Procedure/               ← 12 个流程（见下文流程图）
    │   └── Test/                    ← 运行时测试面板
    │       ├── TestPanelComponent.ts
    │       ├── TestRunner.ts
    │       ├── TestCase.ts
    │       └── cases/               ← Event / DataNode / ReferencePool / Config / Sound / DataTable
    └── DataTables/                  ← CSV / JSON 配置文件
```

---

## HelperRegistry 机制（引擎适配层新增）

TypeScript 没有 C# 的运行时反射，无法通过字符串直接 `Activator.CreateInstance("MyHelper")`。`HelperRegistry` 解决这个问题，使 Inspector 下拉选择 Helper 类型成为可能（对应 UnityGameFramework 的 `CreateHelper<T>(typeName)` 行为）。

### 工作流程

```
Helper 文件末尾 → HelperRegistry.register('TypeName', TypeCtor)
                                    ↓
Component.onLoad() → HelperRegistry.createHelper(parentNode, typeName, fallback)
                                    ↓
              新建子节点 → addComponent(ctor) → 返回实例
```

### Inspector 下拉接入步骤（以新增日志 Helper 为例）

```typescript
// 1. 继承 LogHelperBase 并注册
@ccclass('FileLogHelper')
export class FileLogHelper extends LogHelperBase {
    log(level, tag, message) { /* 写文件 */ }
}
HelperRegistry.register('FileLogHelper', FileLogHelper);

// 2. 在 LogHelperType.ts 添加枚举项（名称必须与 register 第一参数一致）
export enum LogHelperType {
    DefaultLogHelper = 0,
    FileLogHelper = 1,   // 新增
}
Enum(LogHelperType);

// 3. Inspector 下拉选择 FileLogHelper，BaseComponent.onLoad 自动实例化
```

所有带 `*HelperType.ts` 的模块均遵循同一模式：`SettingHelperType` / `ConfigHelperType` / `LocalizationHelperType` / `DataTableHelperType` / `NetworkChannelHelperType` / `UIFormHelperType` / `EntityHelperType` / `SoundHelperType` / `DownloadAgentHelperType` / `FileSystemHelperType` / `LogHelperType`。

---

## BaseComponent 更新（2026-05-25）

`BaseComponent` 现已接管日志辅助器的初始化，并新增游戏速度控制 API：

| Inspector 属性 | 类型 | 说明 |
|---------------|------|------|
| `logHelperType` | `LogHelperType` 枚举 | 选择日志辅助器实现，默认 `DefaultLogHelper` |
| `frameRate` | number | 目标帧率，-1 不限制，默认 60 |
| `runInBackground` | bool | 后台是否继续运行 |
| `neverSleep` | bool | 防止屏幕熄灭（Native 平台） |
| `_gameSpeed` | number | 初始游戏速度，0=暂停，1=正常 |

| API | 说明 |
|-----|------|
| `setGameSpeed(speed)` | 设置速度（0~N） |
| `pauseGame()` | 等同 `setGameSpeed(0)` |
| `resumeGame()` | 等同 `setGameSpeed(1)` |
| `isGamePaused` | speed ≤ 0 |
| `isNormalGameSpeed` | speed === 1 |

---

## Log 门面（业务层日志）

`CocosGameFramework/Utility/Log.ts` 提供业务层统一日志入口，内部转发给 `GameFrameworkLog`：

```typescript
import { Log } from 'CocosGameFramework/Utility/Log';

Log.debug('简单消息');
Log.info('MyTag', '带标签消息');
Log.warning('值为 {0}，期望 {1}', actual, expected);
Log.error('加载失败: {0}', url);
Log.setLevel(GameFrameworkLogLevel.Warning); // 屏蔽 Debug / Info
```

---

## 业务层流程图（StarForce 风格）

```
ProcedureLaunch
  ├─ 初始化 BuildInfo / DefaultDictionary / Sound 设置
  └─→ ProcedureSplash
        ├─ resourceMode=Updatable → ProcedureCheckVersion
        │    └─→ ProcedureUpdateVersion
        │          └─→ ProcedureVerifyResources
        │                └─→ ProcedureCheckResources
        │                      ├─ 有更新 → ProcedureUpdateResources → ProcedurePreload
        │                      └─ 无更新 → ProcedurePreload
        ├─ resourceMode=Package → ProcedureInitResources → ProcedurePreload
        └─ resourceMode=Unspecified/Editor → ProcedurePreload
              └─→ ProcedureChangeScene
                    ├─→ ProcedureMenu  ──(startGame)──→ ProcedureChangeScene
                    └─→ ProcedureMain ──(gotoMenu, 2s)→ ProcedureChangeScene
```

**关键 API 速查**：

```typescript
// 流程间传值（FSM data）
fsm.setData('NextSceneName', 'Menu');
fsm.getData<string>('NextSceneName');

// 资源模式（Constant.ts）
import { ResourceMode } from 'Game/Scripts/Definition/Constant';
// Unspecified=0, Package=1, Updatable=2

// 资源更新回调（ProcedureUpdateResources 中）
GameEntry.Resource.onResourceUpdateStart = (name, size) => { /* ... */ };
GameEntry.Resource.onResourceUpdateChanged = (name, loaded, total) => { /* ... */ };
GameEntry.Resource.onResourceUpdateSuccess = (name, size) => { /* ... */ };
GameEntry.Resource.onResourceUpdateFailure = (name, msg) => { /* ... */ };
GameEntry.Resource.startUpdate();
```

---

## 测试面板系统（`assets/Game/Scripts/Test/`）

挂 `TestPanelComponent` 到场景节点，运行时显示可手动触发的测试用例列表。

| 文件 | 说明 |
|------|------|
| `TestPanelComponent.ts` | Cocos Component，驱动 UI 面板 |
| `TestRunner.ts` | 执行 TestCase，收集结果 |
| `TestCase.ts` | 抽象基类，子类实现 `run()` |
| `cases/EventTestCase.ts` | 事件系统测试 |
| `cases/DataNodeTestCase.ts` | DataNode 树形路径测试 |
| `cases/ReferencePoolTestCase.ts` | ReferencePool 取还测试 |
| `cases/ConfigTestCase.ts` | 配置表读取测试 |
| `cases/SoundTestCase.ts` | 音效播放测试 |
| `cases/DataTableTestCase.ts` | 数据表解析测试 |

---

## DownloadManager — DownloadAgentHelper（新增）

| 特性 | C# | TypeScript (Cocos) |
|------|-----|---------------------|
| 代理基类 | `DownloadAgentHelperBase` | `DownloadAgentHelperBase extends Component implements IDownloadAgentHelper` |
| 默认实现 | 内置 | `DefaultDownloadAgentHelper`（XHR + Range 断点续传） |
| 断点续传 | `fromPosition` | XHR `Range: bytes=<fromPosition>-` |
| 416 处理 | — | 文件已完整，视为空内容成功 |
| Inspector 选择 | — | `DownloadAgentHelperType` 枚举 + `HelperRegistry` |

---

## UIManager — DefaultUIGroupHelper（新增）

`DefaultUIGroupHelper` 实现 `IUIGroupHelper`，通过调整组根节点的 `siblingIndex` 反映 `depth` 变化，无需业务层手动管理 Canvas 层级：

```typescript
// UIComponent 在 addUIGroup 后自动调用
defaultUIGroupHelper.registerGroupNode('Default', groupRootNode);
defaultUIGroupHelper.setDepth(uiGroup, depth); // → node.setSiblingIndex(depth)
```

---

## EntityManager — DefaultEntityGroupHelper（新增）

`DefaultEntityGroupHelper` 为每个实体分组在场景中创建根节点（空 Node），可通过 Inspector 指定父节点：

```typescript
// Inspector 属性
@property(Node) groupRootParent: Node | null = null;

// 框架调用（EntityManager 内部）
entityGroupHelper.createEntityGroupRoot('EnemyGroup');
// → 在 groupRootParent（或本节点）下 new Node('EnemyGroup')
```

---

### ConfigManager

| 特性 | C# | TypeScript |
|------|-----|-----------|
| 读取值 | `GetConfig<T>(key)` | `getConfig(key)` / `getBool/getInt/getFloat/getString(key)` |
| Helper 注入 | `SetConfigHelper()` | `configMgr.setHelper(new DefaultConfigHelper())` |
| 解析 | 字节流 / CSV | `DefaultConfigHelper` 解析 JSON / CSV |
| 引擎层 | `ConfigComponent` + Helper | `ConfigComponent` + `ConfigHelperBase` + `DefaultConfigHelper` |

```typescript
// 注入 Helper 并加载配置
GameEntry.Config.setHelper(new DefaultConfigHelper());
await GameEntry.Resource.loadAssetAsync('resources', 'Config/GameConfig', TextAsset)
    .then(asset => GameEntry.Config.parseData(asset.text));

// 读取
const maxLevel = GameEntry.Config.getInt('MaxLevel');
const serverUrl = GameEntry.Config.getString('ServerUrl');
```

### DataNodeManager

| 特性 | C# | TypeScript |
|------|-----|-----------|
| 数据结构 | — | 树形层级节点（斜线路径访问） |
| 获取节点 | — | `getNode('Player/HP')` |
| 读写值 | — | `getInt/setInt` `getString/setString` `getObject/setObject` |
| 节点创建 | — | 访问路径时自动创建中间节点 |

```typescript
// 按路径存取（支持 bool / int / float / string / object）
GameEntry.DataNode.setInt('Player/HP', 100);
GameEntry.DataNode.setString('Player/Name', 'Hero');
const hp = GameEntry.DataNode.getInt('Player/HP');

// 树形嵌套
GameEntry.DataNode.setObject('Game/Config', { difficulty: 2 });
```

### WebRequestManager

| 特性 | C# | TypeScript (Cocos) |
|------|-----|---------------------|
| 对应原版 | `WebRequestComponent` | `WebRequestManager` + `CocosWebRequestManager` |
| 发起 GET | `AddGetWebRequest(url, callbacks)` | `sendGetRequest(url, params?)` |
| 发起 POST | `AddPostWebRequest(url, body, callbacks)` | `sendPostRequest(url, body, params?)` |
| Promise 支持 | 无 | `sendGetRequestAsync / sendPostRequestAsync` |
| 任务队列 | Agent 池 + 优先级 | 同，基于 `TaskPool` |
| Priority | — | 50（与 UIManager 相邻） |

```typescript
// GET
const res = await GameEntry.WebRequest.sendGetRequestAsync('https://api.example.com/data');

// POST（JSON body）
GameEntry.WebRequest.sendPostRequest(
    'https://api.example.com/login',
    { username: 'player', password: '123' },
    { onSuccess: (res) => console.log(res.data) }
);
```

---

## 常见问题

**Q: 为什么 Setting/SettingManager.ts 在 GameFramework 目录但 import 了 'cc'？**  
A: 因为 `sys.localStorage` 是 Cocos 提供的跨平台存储 API，它被归类在适配层职责里。如需严格分离，可将 SettingManager 移到 `CocosGameFramework/Setting/`。

**Q: 为什么 ProcedureManager.update() 是空实现？**  
A: FsmManager（priority=90）已经在自己的 `update()` 中驱动所有 FSM，包括 ProcedureManager 内部持有的 `GameProcedure` FSM。ProcedureManager（priority=80）无需重复驱动。

**Q: TypeScript 的 EventManager fire() 是否真的线程安全？**  
A: JavaScript/TypeScript 是单线程，不存在 C# 中的真正并发问题。`fire()` 的队列设计保持与原版语义一致——事件在下一帧处理，避免在遍历回调列表时修改列表导致的 bug。

**Q: DataTable 如何加载 CSV/JSON 文件？**  
A: 通过 ResourceManager 加载文本资源（`TextAsset`），再调用 `table.parseFromCsv(text)` 或 `table.parseFromJson(jsonArr)`。建议在 `ProcedurePreload` 中统一加载所有配置表。

**Q: 如何扩展新模块？**  
1. 在 `GameFramework/` 下定义接口（`IXxxManager`）和纯逻辑实现（`XxxManager extends GameFrameworkModule`）  
2. 若需要引擎 API，在 `CocosGameFramework/` 实现具体类并通过 `IXxxHelper` 注入  
3. 在 `GameFrameworkModuleIds.ts` 添加 `XXX: 'GameFramework.IXxxManager'`  
4. 在 `GameEntry._initModules()` 中 `registerModule(MODULE_ID.XXX, new XxxManager())`  
5. 在 `GameEntry` 中添加静态门面属性 `static get Xxx(): XxxManager`

**Q: 如何新增自定义 Helper 并让 Inspector 能选择？**  
1. 继承对应 `*HelperBase`（如 `LogHelperBase`）并实现接口方法  
2. 文件末尾调用 `HelperRegistry.register('MyHelper', MyHelper)`  
3. 在对应 `*HelperType.ts` 枚举中添加同名枚举项（枚举名 = register 第一参数）  
4. Inspector 下拉选择即可，Component 的 `onLoad` 通过 `HelperRegistry.createHelper()` 自动实例化

**Q: `Log` 门面和 `GameFrameworkLog` 有何区别？**  
A: `GameFrameworkLog` 是核心层静态类，业务层应通过 `Log`（`CocosGameFramework/Utility/Log`）访问，保持分层。两者 API 完全一致，`Log` 只是转发。

**Q: 测试面板如何使用？**  
A: 将 `TestPanelComponent` 挂到场景节点，运行时点击面板中的测试用例按钮即可触发。新测试用例继承 `TestCase` 并实现 `run()` 方法，在 `TestPanelComponent` 中注册即可。

---

### SceneManager

| 特性 | C# | TypeScript (Cocos) |
|------|-----|---------------------|
| 加载场景 | `LoadScene(assetName, callbacks)` | `loadScene(sceneName, priority?, onLoaded?, onFailure?, userData?)` |
| 卸载场景 | `UnloadScene(assetName)` | `unloadScene(sceneName, onUnloaded?, userData?)` |
| 引擎实现 | `SceneComponent` + Helper | `CocosSceneManager extends SceneManager`（重写 `_doLoadScene`） |
| 状态查询 | `SceneIsLoaded/Loading/Unloading` | `sceneIsLoaded/sceneIsLoading/sceneIsUnloading` |
| Priority | — | 45 |

```typescript
// 加载场景（additive 需项目设置支持）
GameEntry.Scene.loadScene('GameScene', 0,
    (name, duration) => console.log(`场景 ${name} 加载完成，耗时 ${duration}s`),
    (name, msg) => console.error(`场景 ${name} 加载失败: ${msg}`)
);

// 查询状态
if (GameEntry.Scene.sceneIsLoaded('GameScene')) { ... }
```

---

### NetworkManager

| 特性 | C# | TypeScript |
|------|-----|-----------|
| HTTP 请求 | `WebRequest` 模块 | `sendRequest(url, params, onSuccess, onFailure)` |
| Promise 支持 | 无 | `sendRequestAsync(url, params): Promise<IHttpResponse>` |
| WebSocket | `Network` 模块 + Channel | `createWebSocketChannel / sendWebSocketMessage / closeWebSocketChannel` |
| 无引擎依赖 | — | 纯 TS（`fetch` + `WebSocket`），直接注册核心层实现 |
| Priority | — | 55 |

```typescript
// HTTP GET
const res = await GameEntry.Network.sendRequestAsync('https://api.example.com/data');
const json = JSON.parse(res.data);

// HTTP POST（JSON body）
GameEntry.Network.sendRequest('https://api.example.com/login', {
    method: 'POST',
    body: { username: 'player', password: '123' },
}, (res) => console.log(res.data));

// WebSocket
GameEntry.Network.createWebSocketChannel('chat', 'wss://chat.example.com',
    (ch) => console.log(`${ch} 已连接`),
    (ch, data) => console.log(`${ch} 收到:`, data),
    (ch, code, reason) => console.log(`${ch} 关闭 ${code}: ${reason}`)
);
GameEntry.Network.sendWebSocketMessage('chat', JSON.stringify({ msg: 'hello' }));
```

---

### LocalizationManager

| 特性 | C# | TypeScript |
|------|-----|-----------|
| 语言切换 | `Language` 属性 | `language` 属性（仅标记，需业务层重新加载字典） |
| 加载字典 | `ReadData / ParseData` | `loadDictionary(Record<string,string> 或 {key,value}[])` |
| 取字符串 | `GetString<T>(key, args)` | `getString(key, defaultValue?)` |
| 格式化 | 泛型重载 | `format(key, ...args)` 使用 `{0}`, `{1}` 占位符 |
| Priority | — | 68 |

```typescript
// 加载中文字典（通常在 ProcedurePreload 中）
GameEntry.Localization.language = 'zh-CN';
GameEntry.Localization.loadDictionary({
    'ui.btn.start': '开始游戏',
    'ui.hp.format': '生命值: {0}/{1}',
});

// 取字符串
label.string = GameEntry.Localization.getString('ui.btn.start');

// 格式化
label.string = GameEntry.Localization.format('ui.hp.format', 80, 100); // "生命值: 80/100"
```

---

### DownloadManager

| 特性 | C# | TypeScript (Cocos) |
|------|-----|---------------------|
| 添加下载 | `AddDownload(url, savePath, ...)` | `addDownload(url, savePath, params?)` 返回 serialId |
| 取消下载 | `RemoveDownload(serialId)` | `removeDownload(serialId)` |
| 按 tag 批量取消 | `RemoveDownloadsByTag` | `removeDownloadsByTag(tag)` |
| 进度回调 | `DownloadProgress` 事件 | `params.onProgress(task, downloaded, total)` |
| 引擎实现 | `DownloadComponent` + Agent | `CocosDownloadManager`（XMLHttpRequest） |
| Priority | — | 25 |

```typescript
// 下载文件（结果为 ArrayBuffer）
const serialId = GameEntry.Download.addDownload(
    'https://cdn.example.com/patch.zip',
    'local/patch.zip',
    {
        tag: 'patch',
        onProgress: (task, loaded, total) => {
            progressBar.progress = loaded / total;
        },
        onSuccess: (task, data) => {
            console.log(`下载完成: ${task.url}, 大小: ${data.byteLength}`);
        },
        onFailure: (task, msg) => {
            console.error(`下载失败: ${task.url} - ${msg}`);
        },
    }
);

// 取消全部补丁下载
GameEntry.Download.removeDownloadsByTag('patch');
```

---

### Variable 模块

对应 `UnityGameFramework/Scripts/Runtime/Variable/`，提供类型化变量包装，配合 **ReferencePool** 使用，可安全存入 FSM `setData` 或 DataNode。

| 类型 | TS 类 | 对应 C# 类 | 备注 |
|------|--------|-----------|------|
| 布尔 | `VarBoolean` | `VarBoolean` | — |
| 整数 | `VarInt8` `VarUInt8` `VarInt16` `VarUInt16` `VarInt32` `VarUInt32` | `VarSByte` `VarByte` `VarInt16` `VarUInt16` `VarInt32` `VarUInt32` | — |
| 长整数 | `VarInt64`（number）`VarUInt64`（bigint） | `VarInt64` `VarUInt64` | TS number 精度有限，超大数用 `VarUInt64` |
| 浮点 | `VarFloat` `VarDouble` | `VarSingle` `VarDouble` | — |
| 字符串 | `VarChar` `VarString` | `VarChar` `VarString` | — |
| 字节数组 | `VarByteArray` `VarCharArray` | `VarByteArray` `VarCharArray` | — |
| 日期 | `VarDateTime` | `VarDateTime` | — |
| 通用对象 | `VarObject` | `VarObject` | — |
| 向量 | `VarVec2` `VarVec3` `VarVec4` | `VarVector2/3/4` | 存 `{x,y[,z[,w]]}` 纯值对象，无引擎依赖 |
| 四元数 | `VarQuat` | `VarQuaternion` | 默认 `{x:0,y:0,z:0,w:1}` |
| 颜色 | `VarColor` | `VarColor` `VarColor32` | 存 `{r,g,b,a}`（0-255） |
| 矩形 | `VarRect` | `VarRect` | 存 `{x,y,width,height}` |

> **Unity 特有类型**（`VarGameObject / VarTransform / VarMaterial / VarTexture / VarUnityObject`）在 Cocos 中用 `VarObject` 替代，引擎层直接将 `Node / Component / Asset` 等赋给 `.value` 即可。

```typescript
// FSM 中存取变量
import { VarInt32, VarString, VarVec3 } from 'GameFramework/Variable/Variable';

// 存入
fsm.setData(VarInt32, 'score', VarInt32.create(100));
fsm.setData(VarString, 'playerName', VarString.create('Hero'));
fsm.setData(VarVec3, 'spawnPos', VarVec3.create(0, 1, 0));

// 取出（取完后 release 回池）
const scoreVar = fsm.getData(VarInt32, 'score');
const score = scoreVar?.value ?? 0;
ReferencePool.release(scoreVar);
```

---

### Utility.Compression

| 特性 | C# | TypeScript |
|------|----|-----------|
| 接口 | `ICompressionHelper` | `ICompressionHelper`（compress / decompress） |
| 注入 | `GameFrameworkEntry.SetCompressionHelper()` | `Utility.Compression.setCompressionHelper(helper)` |
| 调用 | `Utility.Compression.Compress(bytes)` | `Utility.Compression.compress(bytes)` |
| 默认实现 | 内置 Deflate | TS 无内置，需业务层注入（如 pako / fflate） |

```typescript
import { UtilityCompression } from 'GameFramework/Utility/Utility.Compression';

// 注入第三方压缩库（如 pako）
UtilityCompression.setCompressionHelper({
    compress: (data) => pako.deflate(data),
    decompress: (data) => pako.inflate(data),
});

// 使用
const compressed = Utility.Compression.compress(rawBytes);
const raw = Utility.Compression.decompress(compressed);
```

---

### Network 枚举与接口补充

| 新增文件 | 内容 |
|---------|------|
| `AddressFamily.ts` | `Unknown=0` `IPv4=2` `IPv6=23` |
| `ServiceType.ts` | `Tcp=0` `TcpWithSyncReceive=1` `WebSocket=2` |
| `NetworkErrorCode.ts` | 0~10，含 ConnectError / PacketError / HeartBeatTimeout 等 |
| `IPacketHeader.ts` | `id` `packetLength` `isValid` 三个只读属性 |
| `IPacketHandler.ts` | `id` + `handle(header, body): Packet \| null` |

`IPacketHandler` 用于业务层注册自定义消息处理器，在 `INetworkChannelHelper` 的消息分发中调用：

```typescript
class LoginResponseHandler implements IPacketHandler {
    readonly id = 1001;
    handle(header: IPacketHeader, body: Uint8Array): Packet | null {
        // 解析 body 并返回 Packet 实例
        const loginResp = new LoginResponsePacket();
        loginResp.parseFrom(body);
        return loginResp;
    }
}
```

---

### IUIForm 接口

`IUIForm` 定义了 UI 窗体完整生命周期，`UIFormLogic`（引擎层）实现此接口：

```
onInit → onOpen → onPause/onResume → onCover/onReveal → onRefocus → onUpdate → onClose → onRecycle
```

`IUIGroupHelper` 由引擎层实现，负责调整 Canvas 子节点顺序以反映 `depth` 变化。

---

### IEntity 与 IEntityGroupHelper 接口

`IEntity` 定义实体完整生命周期，`EntityLogic`（引擎层）实现此接口：

```
onInit → onShow → onAttached/onDetached → onAttachChild/onDetachChild → onUpdate → onHide → onRecycle
```

`IEntityGroupHelper` 负责在引擎层为每个分组创建根节点（对应 Unity 中 `EntityGroup` 下的空 GameObject）：

```typescript
class DefaultEntityGroupHelper implements IEntityGroupHelper {
    createEntityGroupRoot(entityGroupName: string): object {
        const node = new Node(entityGroupName);
        this.entityRootNode.addChild(node);
        return node;
    }
}
```
