# GameFramework → CocosGameFramework 迁移指南

Unity GameFramework（C# / UnityGameFramework）移植到 Cocos Creator 3.8.8（TypeScript）的完整差异说明。

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
│   │   └── GameFrameworkError.ts
│   ├── ReferencePool/           ← IReference + ReferencePool
│   ├── Event/                   ← BaseEventArgs + IEventManager + EventManager
│   ├── FSM/                     ← IFsm + FsmState + Fsm + FsmManager
│   ├── Procedure/               ← ProcedureBase + ProcedureManager
│   ├── ObjectPool/              ← ObjectBase + ObjectPool + ObjectPoolManager
│   ├── Resource/                ← IResourceManager（接口）
│   ├── Setting/                 ← ISettingManager + SettingManager（sys.localStorage）
│   ├── DataTable/               ← IDataRow + DataTable + DataTableManager
│   ├── Scene/                   ← ISceneManager + SceneManager（抽象）
│   ├── Network/                 ← INetworkManager + NetworkManager（fetch + WebSocket）
│   ├── Localization/            ← ILocalizationManager + LocalizationManager
│   ├── Download/                ← IDownloadManager + DownloadManager（抽象）
│   ├── UI/                      ← IUIFormHelper + IUIManager + UIManager
│   ├── Entity/                  ← IEntityHelper + IEntityManager + EntityManager
│   └── Sound/                   ← ISoundManager + SoundManager（抽象）
│
├── CocosGameFramework/          ← 引擎适配层
│   ├── Entry/GameEntry.ts       ← Component 驱动 + 模块注册门面
│   ├── Resource/CocosResourceManager.ts
│   ├── Scene/CocosSceneManager.ts
│   ├── Download/CocosDownloadManager.ts
│   ├── UI/
│   │   ├── UIFormLogic.ts       ← Prefab 上的 Component 基类
│   │   └── DefaultUIFormHelper.ts
│   ├── Entity/
│   │   ├── EntityLogic.ts       ← Prefab 上的 Component 基类
│   │   └── DefaultEntityHelper.ts
│   └── Sound/CocosSoundManager.ts
│
└── Game/                        ← 业务层示例
    └── Procedure/
        ├── ProcedureLaunch.ts
        ├── ProcedurePreload.ts
        └── ProcedureMain.ts
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
4. 在`GameEntry._initModules()` 中 `registerModule(MODULE_ID.XXX, new XxxManager())`  
5. 在 `GameEntry` 中添加静态门面属性 `static get Xxx(): XxxManager`

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
