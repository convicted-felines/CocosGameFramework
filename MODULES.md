# CocosGameFramework 模块使用手册

所有模块通过 `GameEntry.Xxx` 静态属性访问，在 `GameEntry.start()` 完成后可用。

```typescript
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
```

---

## 目录

1. [Base — 基础 / 游戏速度](#1-base--基础--游戏速度)
2. [ReferencePool — 引用池](#2-referencepool--引用池)
3. [Event — 事件系统](#3-event--事件系统)
4. [FSM — 有限状态机](#4-fsm--有限状态机)
5. [Procedure — 流程](#5-procedure--流程)
6. [ObjectPool — 对象池](#6-objectpool--对象池)
7. [Setting — 本地存储](#7-setting--本地存储)
8. [Config — 配置表](#8-config--配置表)
9. [DataTable — 数据表](#9-datatable--数据表)
10. [DataNode — 数据节点树](#10-datanode--数据节点树)
11. [Localization — 本地化](#11-localization--本地化)
12. [Resource — 资源管理](#12-resource--资源管理)
13. [Scene — 场景管理](#13-scene--场景管理)
14. [Network — 网络（HTTP + WebSocket）](#14-network--网络-http--websocket)
15. [WebRequest — Web 请求队列](#15-webrequest--web-请求队列)
16. [UI — 界面管理](#16-ui--界面管理)
17. [Entity — 实体管理](#17-entity--实体管理)
18. [Sound — 音效管理](#18-sound--音效管理)
19. [Download — 下载管理](#19-download--下载管理)
20. [FileSystem — 文件系统](#20-filesystem--文件系统)
21. [Log — 日志](#21-log--日志)

---

## 1. Base — 基础 / 游戏速度

**入口**：`GameEntry.Base`（`BaseComponent`）

Inspector 可配置日志辅助器类型、目标帧率、屏幕常亮等。运行时通过代码控制游戏速度：

```typescript
GameEntry.Base.pauseGame();           // 暂停（速度=0）
GameEntry.Base.resumeGame();          // 恢复（速度=1）
GameEntry.Base.setGameSpeed(0.5);     // 慢动作

GameEntry.Base.gameSpeed             // 当前速度
GameEntry.Base.isGamePaused          // true/false
GameEntry.Base.isNormalGameSpeed     // true/false
```

**全局关闭**：

```typescript
import { ShutdownType } from 'db://assets/CocosGameFramework/Base/ShutdownType';

GameEntry.shutdown(ShutdownType.None);     // 仅清理框架
GameEntry.shutdown(ShutdownType.Restart);  // 重载当前场景
GameEntry.shutdown(ShutdownType.Quit);     // 退出游戏
```

---

## 2. ReferencePool — 引用池

**入口**：`GameEntry.ReferencePool`（`ReferencePoolComponent`），底层直接调用静态类 `ReferencePool`

用于复用频繁创建/销毁的对象（事件参数、消息包等），避免 GC 压力。

### 定义可池化类

```typescript
import { IReference } from 'db://assets/GameFramework/ReferencePool/IReference';
import { ReferencePool } from 'db://assets/GameFramework/ReferencePool/ReferencePool';

class DamageEventArgs extends BaseEventArgs implements IReference {
    static readonly EVENT_ID = 'Damage';
    get id() { return DamageEventArgs.EVENT_ID; }

    attackerId: number = 0;
    damage: number = 0;

    clear(): void {
        this.attackerId = 0;
        this.damage = 0;
    }

    static create(attackerId: number, damage: number): DamageEventArgs {
        const args = ReferencePool.acquire(DamageEventArgs);
        args.attackerId = attackerId;
        args.damage = damage;
        return args;
    }
}
```

### 取出 / 归还

```typescript
const args = ReferencePool.acquire(DamageEventArgs);  // 从池取出
// ... 使用 args ...
ReferencePool.release(args);                           // 归还（内部调用 clear()）
```

### 管理

```typescript
GameEntry.ReferencePool.count                    // 池种类数
GameEntry.ReferencePool.clearAll()               // 清空所有池
GameEntry.ReferencePool.getAllReferencePoolInfos() // 查看各池统计

// Inspector：enableStrictCheck 开启调试时的严格校验
GameEntry.ReferencePool.enableStrictCheck = true;
```

---

## 3. Event — 事件系统

**入口**：`GameEntry.Event`（`EventComponent`）

### 定义事件参数

所有事件参数继承 `BaseEventArgs` 并实现 `IReference`（参见 ReferencePool 示例）。

### 订阅 / 取消

```typescript
// 订阅（推荐在 onEnable/onEnter 中，同步绑定 this）
GameEntry.Event.subscribe(DamageEventArgs.EVENT_ID, this._onDamage, this);

// 取消（必须在 onDisable/onLeave 中，否则内存泄漏）
GameEntry.Event.unsubscribe(DamageEventArgs.EVENT_ID, this._onDamage);

// 取消某事件所有监听
GameEntry.Event.unsubscribeAll(DamageEventArgs.EVENT_ID);

// 处理函数签名
private _onDamage(sender: object, e: BaseEventArgs): void {
    const args = e as DamageEventArgs;
    console.log(args.damage);
}
```

### 派发

```typescript
// 延迟派发（下一 update 执行，推荐）
GameEntry.Event.fire(this, DamageEventArgs.create(101, 50));

// 立即派发（同帧同步执行，谨慎使用）
GameEntry.Event.fireNow(this, DamageEventArgs.create(101, 50));
```

派发后事件参数由框架自动归还引用池，**不要在派发后继续持有引用**。

### 查询

```typescript
GameEntry.Event.count(eventId)                  // 某事件的订阅数
GameEntry.Event.hasSubscriber(eventId, handler) // 是否已订阅
GameEntry.Event.eventCount                      // 事件种类总数
```

### Inspector 配置

| 属性 | 默认 | 说明 |
|------|------|------|
| `allowNoHandler` | ✅ | 允许无监听者的事件 |
| `allowMultiHandler` | ✅ | 允许同一事件有多个监听者 |
| `allowDuplicateHandler` | ❌ | 允许重复注册同一处理函数 |

---

## 4. FSM — 有限状态机

**入口**：`GameEntry.Fsm`（`FsmComponent`）

### 定义状态

```typescript
import { FsmState } from 'db://assets/GameFramework/FSM/FsmState';
import { IFsm } from 'db://assets/GameFramework/FSM/IFsm';

class IdleState extends FsmState<MyCharacter> {
    onEnter(fsm: IFsm<MyCharacter>): void {
        console.log('进入 Idle，owner:', fsm.owner.name);
    }

    onUpdate(fsm: IFsm<MyCharacter>, dt: number, rdt: number): void {
        if (fsm.owner.isAttacking) {
            this.changeState(fsm, AttackState);
        }
    }

    onLeave(fsm: IFsm<MyCharacter>, isShutdown: boolean): void {}
    onDestroy(fsm: IFsm<MyCharacter>): void {}
}
```

### 创建 / 启动 / 销毁

```typescript
// 创建（框架自动调用 start()）
const fsm = GameEntry.Fsm.createFsm('Hero', heroInstance, [
    new IdleState(),
    new AttackState(),
    new DeadState(),
]);

// 启动（进入初始状态）
import { Fsm } from 'db://assets/GameFramework/FSM/Fsm';
(fsm as Fsm<MyCharacter>).start(IdleState);

// 查询
GameEntry.Fsm.hasFsm(MyCharacter, 'Hero')
GameEntry.Fsm.getFsm(MyCharacter, 'Hero')
GameEntry.Fsm.fsmCount

// 销毁
GameEntry.Fsm.destroyFsm(MyCharacter, 'Hero');
GameEntry.Fsm.destroyFsmByInstance(fsm);
```

### FSM 内共享数据

```typescript
import { VarInt32 } from 'db://assets/GameFramework/Variable/Variable';

// 存
fsm.setData(VarInt32, 'score', VarInt32.create(100));

// 取（用完 release）
const scoreVar = fsm.getData(VarInt32, 'score');
const score = scoreVar?.value ?? 0;
ReferencePool.release(scoreVar);
```

---

## 5. Procedure — 流程

**入口**：`GameEntry.Procedure`（`ProcedureComponent`）

流程是游戏最顶层的状态机，继承 `ProcedureBase`（本质是 `FsmState<ProcedureManager>`）。

### 定义流程

```typescript
import { ProcedureBase } from 'db://assets/GameFramework/Procedure/ProcedureBase';
import { IFsm } from 'db://assets/GameFramework/FSM/IFsm';
import { ProcedureManager } from 'db://assets/GameFramework/Procedure/ProcedureManager';

export class ProcedureLaunch extends ProcedureBase {
    protected onEnter(fsm: IFsm<ProcedureManager>): void {
        // 初始化逻辑...
        this.changeState(fsm, ProcedurePreload); // 切换到下一流程
    }

    protected onUpdate(fsm: IFsm<ProcedureManager>, dt: number, rdt: number): void {}

    protected onLeave(fsm: IFsm<ProcedureManager>, isShutdown: boolean): void {}
}
```

### 初始化与启动

在 `GameEntry.initCustomComponents()` 中：

```typescript
GameEntry.Procedure.initialize(
    [
        new ProcedureLaunch(),
        new ProcedurePreload(),
        new ProcedureMain(),
    ],
    new ProcedureLaunch()  // 入口流程
);
```

### 查询

```typescript
GameEntry.Procedure.currentProcedure      // 当前流程实例
GameEntry.Procedure.currentProcedureTime  // 当前流程已运行时长（秒）
GameEntry.Procedure.hasProcedure(ProcedureLaunch)
GameEntry.Procedure.getProcedure(ProcedureLaunch)
```

---

## 6. ObjectPool — 对象池

**入口**：`GameEntry.ObjectPool`（`ObjectPoolComponent`）

用于复用带完整生命周期（初始化/清理/过期）的重量级对象（节点、AI 等）。

### 定义对象

```typescript
import { ObjectBase } from 'db://assets/GameFramework/ObjectPool/ObjectBase';

class BulletObject extends ObjectBase {
    protected onSpawn(): void {
        // 从池取出时调用
        (this.target as BulletLogic).reset();
    }

    protected onUnspawn(): void {
        // 归还时调用
        (this.target as BulletLogic).hide();
    }

    protected onRelease(isShutdown: boolean): void {
        // 真正销毁时调用
        (this.target as BulletLogic).destroy();
    }
}
```

### 创建与使用

```typescript
// 创建单次生成池（同一时间每个对象只能被 Spawn 一次）
const pool = GameEntry.ObjectPool.createSingleSpawnObjectPool(
    BulletObject,
    'Bullet',          // 名称（可选）
    60,                // 自动释放间隔（秒）
    32,                // 容量上限
    120,               // 过期时间（秒）
);

// 注册对象
const bulletObj = new BulletObject();
bulletObj.initialize('bullet_1', bulletLogicInstance);
pool.register(bulletObj, true); // true=立即 Spawn

// 取出
const obj = pool.spawn('bullet_1') as BulletObject;

// 归还
pool.unspawn(obj);

// 主动释放未使用对象
GameEntry.ObjectPool.release();
GameEntry.ObjectPool.releaseAllUnused();

// 查询
GameEntry.ObjectPool.objectPoolCount
GameEntry.ObjectPool.hasObjectPool(BulletObject)
GameEntry.ObjectPool.getObjectPool(BulletObject)
```

### Inspector 配置

| 属性 | 默认 | 说明 |
|------|------|------|
| `defaultAutoReleaseInterval` | 60 | 自动释放检查间隔（秒） |
| `defaultCapacity` | 0（不限） | 池容量上限 |
| `defaultExpireTime` | 0（永不） | 对象过期时间（秒） |

---

## 7. Setting — 本地存储

**入口**：`GameEntry.Setting`（`SettingComponent`）

默认后端为 `localStorage`（Web）或 Cocos JSB 等效存储。

```typescript
// 读写基础类型
GameEntry.Setting.setBool('sound.mute', true);
GameEntry.Setting.setInt('player.level', 10);
GameEntry.Setting.setFloat('sound.volume', 0.8);
GameEntry.Setting.setString('player.name', 'Hero');

const mute   = GameEntry.Setting.getBool('sound.mute', false);
const level  = GameEntry.Setting.getInt('player.level', 1);
const volume = GameEntry.Setting.getFloat('sound.volume', 1.0);
const name   = GameEntry.Setting.getString('player.name', 'Player');

// 读写对象（JSON 序列化）
GameEntry.Setting.setObject('player.data', { hp: 100, mp: 50 });
const data = GameEntry.Setting.getObject<{ hp: number; mp: number }>('player.data');

// 管理
GameEntry.Setting.hasKey('sound.mute')
GameEntry.Setting.removeKey('sound.mute')
GameEntry.Setting.removeAllSettings()
GameEntry.Setting.getAllSettingNames()

// 持久化（localStorage 自动持久，一般无需手动调用）
GameEntry.Setting.save();
```

---

## 8. Config — 配置表

**入口**：`GameEntry.Config`（`ConfigComponent`）

存储简单键值对配置（如服务器地址、关卡参数等），区别于 DataTable（行列结构）。

### 加载

```typescript
// 从资源系统异步加载（推荐在 ProcedurePreload 中）
GameEntry.Config.loadConfig('Configs/GameConfig', 'resources');

// 监听结果事件
import { LoadConfigSuccessEventArgs, LoadConfigFailureEventArgs } from '...';
GameEntry.Event.subscribe(LoadConfigSuccessEventArgs.EVENT_ID, this._onConfigLoaded, this);
GameEntry.Event.subscribe(LoadConfigFailureEventArgs.EVENT_ID, this._onConfigFailed, this);

// 或直接从字符串解析（CSV 格式：Id,Name,Value\n1,ServerUrl,https://...）
GameEntry.Config.parseData(csvText);
```

### 读取

```typescript
GameEntry.Config.getBool('EnableDebug', false)
GameEntry.Config.getInt('MaxLevel', 100)
GameEntry.Config.getFloat('BossHpScale', 1.0)
GameEntry.Config.getString('ServerUrl', 'https://default.com')

GameEntry.Config.hasConfig('ServerUrl')
GameEntry.Config.count   // 配置项总数
```

### 手动增删

```typescript
GameEntry.Config.addConfig('MyKey', 'MyValue')
GameEntry.Config.removeConfig('MyKey')
GameEntry.Config.removeAllConfigs()
```

---

## 9. DataTable — 数据表

**入口**：`GameEntry.DataTable`（`DataTableComponent`）

用于加载和查询结构化的行列数据（技能表、关卡表等），支持 CSV 和 JSON 格式。

### 定义数据行

```typescript
import { IDataRow } from 'db://assets/GameFramework/DataTable/IDataRow';

class DRHero implements IDataRow {
    id: number = 0;
    name: string = '';
    maxHp: number = 0;
    speed: number = 0;

    parseFromCsv(fields: string[]): boolean {
        this.id    = parseInt(fields[0]);
        this.name  = fields[1];
        this.maxHp = parseInt(fields[2]);
        this.speed = parseFloat(fields[3]);
        return !isNaN(this.id);
    }

    parseFromJson(data: Record<string, unknown>): boolean {
        this.id    = data.id as number;
        this.name  = data.name as string;
        this.maxHp = data.maxHp as number;
        this.speed = data.speed as number;
        return typeof this.id === 'number';
    }
}
```

### 加载（推荐在 ProcedurePreload 中）

```typescript
// 从资源系统加载并自动解析（CSV 或 JSON）
GameEntry.DataTable.loadDataTable(DRHero, 'DataTables/DRHero', 'resources');

// 监听加载结果
import { LoadDataTableSuccessEventArgs } from '...';
GameEntry.Event.subscribe(LoadDataTableSuccessEventArgs.EVENT_ID, this._onTableLoaded, this);
```

### 查询

```typescript
const table = GameEntry.DataTable.getDataTable(DRHero);

// 按 ID 查行
const hero = table?.getDataRow(1);       // DRHero | undefined

// 遍历
table?.getAllDataRows().forEach(row => console.log(row.name));

// 条件查找
const fast = table?.getDataRow(row => row.speed > 5);

// 数量
GameEntry.DataTable.dataTableCount
table?.count
```

### 创建 / 销毁

```typescript
const table = GameEntry.DataTable.createDataTable(DRHero);
GameEntry.DataTable.destroyDataTable(DRHero);
```

---

## 10. DataNode — 数据节点树

**入口**：`GameEntry.DataNode`（`DataNodeComponent`）

树形层级键值存储，用斜线路径访问，适合存储运行时状态（玩家属性、关卡进度等）。

```typescript
// 基础读写（路径不存在时自动创建中间节点）
GameEntry.DataNode.setData('Player/HP', 100);
GameEntry.DataNode.setData('Player/Name', 'Hero');
GameEntry.DataNode.setData('Game/Config', { difficulty: 2 });

const hp   = GameEntry.DataNode.getData<number>('Player/HP');     // 100
const name = GameEntry.DataNode.getData<string>('Player/Name');   // 'Hero'
const cfg  = GameEntry.DataNode.getData<{ difficulty: number }>('Game/Config');

// 节点操作
const node   = GameEntry.DataNode.getNode('Player');
const child  = GameEntry.DataNode.getOrAddNode('Player/Inventory');

GameEntry.DataNode.removeNode('Player/HP');  // 删除节点
GameEntry.DataNode.clear();                  // 清空所有

// 根节点
const root = GameEntry.DataNode.root;
```

---

## 11. Localization — 本地化

**入口**：`GameEntry.Localization`（`LocalizationComponent`）

### 加载字典（推荐在 ProcedurePreload 或 ProcedureLaunch 中）

```typescript
// 对象格式
GameEntry.Localization.loadDictionary({
    'ui.btn.start': '开始游戏',
    'ui.hp.format': '生命值: {0}/{1}',
    'ui.level':     '第 {0} 关',
});

// 数组格式
GameEntry.Localization.loadDictionary([
    { key: 'ui.btn.start', value: 'Start' },
    { key: 'ui.hp.format', value: 'HP: {0}/{1}' },
]);
```

### 使用

```typescript
// 获取字符串
label.string = GameEntry.Localization.getString('ui.btn.start');
label.string = GameEntry.Localization.getString('unknown.key', '默认文本');

// 格式化（{0} {1} 占位符）
label.string = GameEntry.Localization.format('ui.hp.format', 80, 100);
// → "生命值: 80/100"

// 切换语言（需重新加载字典）
GameEntry.Localization.language = 'en-US';
GameEntry.Localization.clearDictionary();
// loadDictionary(englishDict) ...

// 查询
GameEntry.Localization.hasString('ui.btn.start')
GameEntry.Localization.dictionaryCount
GameEntry.Localization.language
```

### Inspector 配置

| 属性 | 默认 | 说明 |
|------|------|------|
| `defaultLanguage` | `'zh-CN'` | 初始语言标签 |
| `localizationHelperType` | `DefaultLocalizationHelper` | 辅助器选择 |

---

## 12. Resource — 资源管理

**入口**：`GameEntry.Resource`（`ResourceComponent`）

### 加载资产

```typescript
import { Prefab, TextAsset, SpriteFrame } from 'cc';

// 回调风格
GameEntry.Resource.loadAsset('resources', 'Prefabs/Hero', Prefab,
    (prefab, duration) => {
        const node = instantiate(prefab);
        this.node.addChild(node);
    },
    (name, msg) => console.error(`加载失败: ${msg}`)
);

// Promise 风格（推荐在 async 函数中）
const prefab = await GameEntry.Resource.loadAssetAsync('resources', 'Prefabs/Hero', Prefab);

// 批量加载
GameEntry.Resource.loadAssets('resources', ['UI/Panel1', 'UI/Panel2'], Prefab,
    (current, total) => console.log(`${current}/${total}`),
    (assets) => console.log('全部加载完成'),
);

// 加载目录
GameEntry.Resource.loadDir('resources', 'Sounds', AudioClip, null,
    (clips) => clips.forEach(clip => console.log(clip.name))
);
```

### 加载 Bundle

```typescript
GameEntry.Resource.loadBundle('hotfix',
    () => console.log('Bundle 加载成功'),
    (name, msg) => console.error(msg)
);
GameEntry.Resource.unloadBundle('hotfix');
```

### 卸载

```typescript
GameEntry.Resource.unloadAsset(prefab);
GameEntry.Resource.unloadUnusedAssets('resources');
GameEntry.Resource.forceUnloadUnusedAssets();
```

### 热更新

```typescript
// 检查更新
const hasUpdate = await GameEntry.Resource.checkUpdate('https://cdn.example.com/manifest.json');

// 注册回调
GameEntry.Resource.onResourceUpdateStart   = (sender, e) => { /* 开始下载某资源 */ };
GameEntry.Resource.onResourceUpdateChanged = (sender, e) => { /* 进度变化 */ };
GameEntry.Resource.onResourceUpdateSuccess = (sender, e) => { /* 单文件成功 */ };
GameEntry.Resource.onResourceUpdateFailure = (sender, e) => { /* 单文件失败 */ };
GameEntry.Resource.onResourceUpdateAllComplete = (sender, e) => { /* 全部完成 */ };

// 开始更新
GameEntry.Resource.startUpdate((success) => {
    if (success) console.log('热更新完成');
});

// 查询状态
const status = GameEntry.Resource.getUpdateStatus();
// { totalCount, waitingCount, downloadedCount, failedCount }
```

### Inspector 配置

| 属性 | 默认 | 说明 |
|------|------|------|
| `assetCapacity` | 64 | 对象池容量 |
| `assetAutoReleaseInterval` | 60 | 自动释放间隔（秒） |
| `assetExpireTime` | 60 | 资产过期时间（秒） |
| `updateRetryCount` | 3 | 更新失败重试次数 |

---

## 13. Scene — 场景管理

**入口**：`GameEntry.Scene`（`SceneComponent`）

### 加载场景

```typescript
// 替换当前场景
GameEntry.Scene.loadScene('GameScene', 0,
    (name, scene, duration) => console.log(`${name} 加载完成`),
    (name, msg) => console.error(msg)
);

// 叠加加载（Additive）
GameEntry.Scene.loadSceneAdditive('HUDScene');

// 卸载叠加场景
GameEntry.Scene.unloadScene('HUDScene',
    (name) => console.log(`${name} 已卸载`)
);
```

### 查询

```typescript
GameEntry.Scene.activeScene          // 当前激活场景名
GameEntry.Scene.loadedSceneCount     // 已加载场景数
GameEntry.Scene.mainCamera           // 主摄像机

GameEntry.Scene.sceneIsLoaded('GameScene')
GameEntry.Scene.sceneIsLoading('GameScene')
GameEntry.Scene.getLoadedSceneNames()
```

### 事件

```typescript
GameEntry.Event.subscribe(SceneComponent.EVENT_LOAD_SCENE_SUCCESS, this._onSceneLoaded, this);
GameEntry.Event.subscribe(SceneComponent.EVENT_LOAD_SCENE_FAILURE, this._onSceneFailed, this);
GameEntry.Event.subscribe(SceneComponent.EVENT_LOAD_SCENE_UPDATE,  this._onSceneProgress, this);
GameEntry.Event.subscribe(SceneComponent.EVENT_UNLOAD_SCENE_SUCCESS, this._onUnloaded, this);
GameEntry.Event.subscribe(SceneComponent.EVENT_ACTIVE_SCENE_CHANGED, this._onActiveChanged, this);
```

---

## 14. Network — 网络（HTTP + WebSocket）

**入口**：`GameEntry.Network`（`NetworkComponent`）

### HTTP 请求

```typescript
// 回调风格
GameEntry.Network.sendRequest('https://api.example.com/data',
    { method: 'GET' },
    (res) => {
        const json = JSON.parse(res.data);
        console.log(json);
    },
    (res, msg) => console.error(msg)
);

// Promise 风格
const res = await GameEntry.Network.sendRequestAsync('https://api.example.com/data');
const json = JSON.parse(res.data);

// POST（JSON body 自动序列化）
await GameEntry.Network.sendRequestAsync('https://api.example.com/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { username: 'player', password: '123' },
    timeout: 5000,
});
```

### WebSocket

```typescript
// 创建频道
const channel = GameEntry.Network.createNetworkChannel('chat');

// 订阅连接事件
GameEntry.Event.subscribe(NetworkComponent.EventConnected, (sender, e) => {
    const args = e as NetworkConnectedEventArgs;
    console.log(`${args.channelName} 已连接`);
}, this);

// 连接
channel.connect('wss://chat.example.com');

// 发送数据包（需自定义 Packet 子类）
GameEntry.Network.sendPacket('chat', myPacket);

// 关闭
channel.close();
GameEntry.Network.destroyNetworkChannel('chat');
```

**WebSocket 事件 ID**：`NetworkComponent.EventConnected` / `EventClosed` / `EventMissHeartBeat` / `EventError` / `EventCustomError`

### Inspector 配置

| 属性 | 默认 | 说明 |
|------|------|------|
| `defaultTimeout` | 10000 | HTTP 超时（毫秒） |
| `networkChannelHelperType` | `DefaultNetworkChannelHelper` | 频道辅助器 |

---

## 15. WebRequest — Web 请求队列

**入口**：`GameEntry.WebRequest`（`WebRequestComponent`）

基于任务队列的 HTTP 请求系统，支持并发控制和 tag 批量取消，区别于 Network 的直接请求。

```typescript
import { IWebRequestParams } from 'db://assets/GameFramework/WebRequest/IWebRequestManager';

// 添加请求（返回 serialId）
const serialId = GameEntry.WebRequest.addWebRequest('https://api.example.com/user', {
    method: 'GET',
    tag: 'user-requests',
    priority: 0,
    userData: { playerId: 123 },
});

// 监听结果
GameEntry.Event.subscribe(WebRequestComponent.EventWebRequestSuccess, (sender, e) => {
    const args = e as WebRequestSuccessEventArgs;
    console.log(args.getWebRequestData<string>());
}, this);
GameEntry.Event.subscribe(WebRequestComponent.EventWebRequestFailure, (sender, e) => {
    const args = e as WebRequestFailureEventArgs;
    console.error(args.errorMessage);
}, this);

// 取消
GameEntry.WebRequest.removeWebRequest(serialId);
GameEntry.WebRequest.removeWebRequests('user-requests');  // tag 批量取消
GameEntry.WebRequest.removeAllWebRequests();

// 状态
GameEntry.WebRequest.totalAgentCount     // Agent 总数
GameEntry.WebRequest.freeAgentCount      // 空闲 Agent 数
GameEntry.WebRequest.workingAgentCount   // 工作中 Agent 数
GameEntry.WebRequest.waitingTaskCount    // 等待队列长度
```

### Inspector 配置

| 属性 | 默认 | 说明 |
|------|------|------|
| `maxConcurrent` | 1 | 最大并发请求数 |
| `timeout` | 30 | 超时时长（秒） |

---

## 16. UI — 界面管理

**入口**：`GameEntry.UI`（`UIComponent & UIExtension`）

### 定义 UI 界面

```typescript
import { UIFormLogic } from 'db://assets/CocosGameFramework/UI/UIFormLogic';

@ccclass('MainMenuUI')
export class MainMenuUI extends UIFormLogic {
    // 首次实例化时调用（仅一次）
    protected onInit(): void {
        console.log('MainMenuUI 首次初始化');
    }

    // 每次打开时调用
    onOpen(userData?: object): void {
        const data = userData as { playerName: string };
        this.nameLabel.string = data?.playerName ?? '';
    }

    // 每次关闭时调用
    onClose(isShutdown: boolean, userData?: object): void {}

    // 被其他 UI 覆盖时
    onCover(): void {}
    onReveal(): void {}     // 覆盖层关闭后恢复

    onPause(): void {}      // 被 pauseCovered 暂停
    onResume(): void {}

    // 每帧更新
    onUpdate(dt: number, rdt: number): void {}
}
```

### 打开 / 关闭

```typescript
// 打开（返回 serialId）
const serialId = GameEntry.UI.openUIForm(
    'UI/MainMenuUI',    // 资产路径
    'resources',        // Bundle 名
    'Default',          // 分组名
    false,              // 是否暂停被覆盖的 UI
    { playerName: 'Hero' }  // userData
);

// Promise 风格（UIExtension 提供）
const form = await GameEntry.UI.openUIFormAsync('UI/MainMenuUI', 'resources', 'Dialog', true);

// 关闭
GameEntry.UI.closeUIForm(serialId);
GameEntry.UI.closeUIFormByLogic(formInstance);   // 从 UIFormLogic 内部调用
GameEntry.UI.closeAllLoadedUIForms();
GameEntry.UI.closeAllUIFormsByAsset('UI/MainMenuUI'); // UIExtension 提供
```

### 查询

```typescript
GameEntry.UI.hasUIForm(serialId)
GameEntry.UI.hasUIFormByAsset('UI/MainMenuUI')
GameEntry.UI.getUIForm(serialId)                  // UIFormLogic | null
GameEntry.UI.getUIFormByAsset('UI/MainMenuUI')
GameEntry.UI.getUIFormsByAsset('UI/MainMenuUI')   // UIFormLogic[]
GameEntry.UI.getAllLoadedUIForms()
GameEntry.UI.isLoadingUIForm(serialId)
GameEntry.UI.uiGroupCount
```

### 事件

```typescript
GameEntry.Event.subscribe(OpenUIFormSuccessEventArgs.EVENT_ID, this._onUIOpened, this);
GameEntry.Event.subscribe(OpenUIFormFailureEventArgs.EVENT_ID, this._onUIFailed, this);
GameEntry.Event.subscribe(CloseUIFormCompleteEventArgs.EVENT_ID, this._onUIClosed, this);
```

### Inspector 配置

| 属性 | 默认 | 说明 |
|------|------|------|
| `uiRoot` | null | UI 根节点（必填） |
| `uiGroups` | Default/Dialog/Tip | 预设分组（depth 决定层级） |
| `instanceCapacity` | 16 | 对象池容量 |
| `instanceExpireTime` | 60 | 池中实例过期时间（秒） |

---

## 17. Entity — 实体管理

**入口**：`GameEntry.Entity`（`EntityComponent & EntityExtension`）

### 定义实体逻辑

```typescript
import { EntityLogic } from 'db://assets/CocosGameFramework/Entity/EntityLogic';

@ccclass('HeroEntity')
export class HeroEntity extends EntityLogic {
    // 首次实例化时调用（仅一次）
    protected onInit(userData?: object): void {}

    // 每次显示时调用
    onShow(userData?: object): void {
        const data = userData as { heroId: number };
        this.node.setPosition(0, 0, 0);
    }

    // 每次隐藏时调用（isShutdown=true 表示框架关闭）
    onHide(isShutdown: boolean, userData?: object): void {}

    // 附加到父实体
    protected onAttachTo(parentEntity: EntityLogic, userData?: object): void {}
    protected onDetachFrom(parentEntity: EntityLogic | null, userData?: object): void {}

    onUpdate(dt: number, rdt: number): void {}
}
```

### 显示 / 隐藏

```typescript
// 显示（若资产已缓存则立即显示，否则异步加载）
GameEntry.Entity.showEntity(
    1001,                 // entityId（唯一）
    'Prefabs/Hero',       // 资产路径
    'resources',          // Bundle 名
    'Default',            // 分组名
    0,                    // 优先级
    { heroId: 5 }         // userData
);

// 隐藏（归还到对象池）
GameEntry.Entity.hideEntity(1001);
GameEntry.Entity.hideEntity(entityLogicInstance);
GameEntry.Entity.hideAllLoadedEntities();

// EntityExtension：隐藏整组
GameEntry.Entity.hideAllEntitiesInGroup('Enemy');
```

### 附加子实体

```typescript
GameEntry.Entity.attachEntity(childId, parentId);
GameEntry.Entity.attachEntity(childLogic, parentLogic);

GameEntry.Entity.detachEntity(childId);
GameEntry.Entity.detachChildEntities(parentId);

// 查询父子关系
GameEntry.Entity.getParentEntity(childLogic)
GameEntry.Entity.getChildEntities(parentLogic)
GameEntry.Entity.getChildEntityCount(parentLogic)
```

### 查询

```typescript
GameEntry.Entity.hasEntity(1001)
GameEntry.Entity.getEntity(1001)                        // EntityLogic | null
GameEntry.Entity.getEntities('Prefabs/Hero')            // EntityLogic[]
GameEntry.Entity.getAllLoadedEntities()
GameEntry.Entity.getAllEntitiesInGroup('Default')
GameEntry.Entity.isLoadingEntity(1001)
GameEntry.Entity.entityCount
```

### 事件

```typescript
GameEntry.Event.subscribe(ShowEntitySuccessEventArgs.EVENT_ID, this._onEntityShown, this);
GameEntry.Event.subscribe(ShowEntityFailureEventArgs.EVENT_ID, this._onEntityFailed, this);
GameEntry.Event.subscribe(HideEntityCompleteEventArgs.EVENT_ID, this._onEntityHidden, this);
GameEntry.Event.subscribe(AttachEntitySuccessEventArgs.EVENT_ID, this._onAttached, this);
GameEntry.Event.subscribe(DetachEntitySuccessEventArgs.EVENT_ID, this._onDetached, this);
```

### Inspector 配置

| 属性 | 说明 |
|------|------|
| `entityRoot` | 实体分组挂载根节点 |
| `entityHelperType` | 实体辅助器类型 |
| `entityGroupConfigs` | 分组列表（名称/容量/过期时间/优先级） |

---

## 18. Sound — 音效管理

**入口**：`GameEntry.Sound`（`SoundComponent`）

### 播放

```typescript
import { PlaySoundParams } from 'db://assets/GameFramework/Sound/PlaySoundParams';

// 简单播放
GameEntry.Sound.playSound('Sounds/click', 'resources', 'Sound');

// 带参数播放
const params = new PlaySoundParams();
params.loop   = true;
params.volume = 0.8;
params.time   = 0;       // 从第几秒开始（淡入用）
const serialId = GameEntry.Sound.playSound('Sounds/bgm', 'resources', 'Music', params);

// 停止（fadeOutSeconds=0 立即停止）
GameEntry.Sound.stopSound(serialId, 1.0);
GameEntry.Sound.stopAllLoadedSounds(0.5);
GameEntry.Sound.stopAllLoadingSounds();

// 暂停 / 恢复
GameEntry.Sound.pauseSound(serialId, 0.3);
GameEntry.Sound.resumeSound(serialId, 0.3);
```

### 分组控制

```typescript
// 静音
GameEntry.Sound.setMuted('Music', true);
GameEntry.Sound.isMuted('Music')

// 音量（0~1）
GameEntry.Sound.setVolume('Music', 0.6);
GameEntry.Sound.getVolume('Music')

// 分组信息
GameEntry.Sound.hasSoundGroup('Music')
GameEntry.Sound.getSoundGroup('Music')
GameEntry.Sound.soundGroupCount
```

### 回调

```typescript
GameEntry.Sound.onPlaySoundSuccess = (args) => {
    console.log(`播放成功: ${args.soundAssetName}`);
};
GameEntry.Sound.onPlaySoundFailure = (args) => {
    console.error(`播放失败: ${args.errorMessage}`);
};
```

### Inspector 配置

| 属性 | 说明 |
|------|------|
| `audioNode` | 挂载 AudioSource 的节点 |
| `soundGroups` | 预设分组（名称/静音/音量/Agent 数） |
| `soundHelperType` | 声音辅助器类型 |

---

## 19. Download — 下载管理

**入口**：`GameEntry.Download`（`DownloadComponent`）

支持并发控制、断点续传（Range 请求）、tag 批量取消。

```typescript
import { IDownloadParams } from 'db://assets/GameFramework/Download/IDownloadManager';

const params: IDownloadParams = {
    tag: 'patch',
    priority: 0,
    userData: { version: '1.2.0' },
};

const serialId = GameEntry.Download.addDownload(
    'local/patch.zip',                           // 本地保存路径
    'https://cdn.example.com/patch.zip',         // 下载 URL
    params
);

// 监听事件
GameEntry.Event.subscribe(DownloadComponent.EventDownloadStart, (sender, e) => {
    const args = e as DownloadStartEventArgs;
    console.log(`开始下载: ${args.downloadUri}`);
}, this);

GameEntry.Event.subscribe(DownloadComponent.EventDownloadUpdate, (sender, e) => {
    const args = e as DownloadUpdateEventArgs;
    const progress = args.downloadedSize / args.totalSize;
    progressBar.progress = progress;
}, this);

GameEntry.Event.subscribe(DownloadComponent.EventDownloadSuccess, (sender, e) => {
    const args = e as DownloadSuccessEventArgs;
    console.log(`下载完成: ${args.downloadPath}`);
}, this);

GameEntry.Event.subscribe(DownloadComponent.EventDownloadFailure, (sender, e) => {
    const args = e as DownloadFailureEventArgs;
    console.error(`下载失败: ${args.errorMessage}`);
}, this);

// 取消
GameEntry.Download.removeDownload(serialId);
GameEntry.Download.removeDownloads('patch');      // tag 批量取消
GameEntry.Download.removeAllDownloads();

// 暂停 / 恢复整体下载
GameEntry.Download.paused = true;
GameEntry.Download.paused = false;

// 状态
GameEntry.Download.totalAgentCount      // Agent 总数（并发上限）
GameEntry.Download.workingAgentCount    // 下载中数
GameEntry.Download.waitingTaskCount     // 队列长度
GameEntry.Download.currentSpeed         // 当前速度（字节/秒）
```

### Inspector 配置

| 属性 | 默认 | 说明 |
|------|------|------|
| `downloadAgentHelperCount` | 3 | 并发数 |
| `timeout` | 30 | 超时（秒） |
| `flushSize` | 0 | 分块落盘阈值（0=完成后一次写入） |

---

## 20. FileSystem — 文件系统

**入口**：`GameEntry.FileSystem`（`FileSystemComponent`）

提供跨平台的二进制文件读写，支持多文件系统分区管理。

```typescript
import { FileSystemAccess } from 'db://assets/GameFramework/FileSystem/FileSystemAccess';

// 创建新文件系统
const fs = GameEntry.FileSystem.createFileSystem(
    '/data/save.gfs',   // 完整路径
    FileSystemAccess.ReadWrite,
    64,                 // 最大文件数
    128                 // 最大块数
);

// 加载已有文件系统
const fsRead = GameEntry.FileSystem.loadFileSystem('/data/save.gfs', FileSystemAccess.Read);

// 读写文件
const buf = new Uint8Array([1, 2, 3, 4]);
fs.writeFile('player.dat', buf.buffer);

const data = fs.readFile('player.dat');    // ArrayBuffer | null
const length = fs.getFileLength('player.dat');
const info = fs.getFileInfo('player.dat'); // FileInfo

// 枚举文件
fs.getAllFileInfos().forEach(info => console.log(info.name));

// 删除文件
fs.deleteFile('player.dat');

// 销毁文件系统（deletePhysicalFile=true 同时删除磁盘文件）
GameEntry.FileSystem.destroyFileSystem(fs, false);

// 查询
GameEntry.FileSystem.hasFileSystem('/data/save.gfs')
GameEntry.FileSystem.getFileSystem('/data/save.gfs')
GameEntry.FileSystem.fileSystemCount
GameEntry.FileSystem.getAllFileSystems()
```

---

## 21. Log — 日志

业务层统一日志门面，内部转发给 `GameFrameworkLog`。

```typescript
import { Log } from 'db://assets/CocosGameFramework/Utility/Log';

Log.debug('调试信息');
Log.info('MyTag', '带标签消息');
Log.warning('值为 {0}，期望 {1}', actual, expected);
Log.error('加载失败: {0}', url);
Log.fatal('致命错误，即将崩溃');

// 运行时调整输出级别
import { GameFrameworkLogLevel } from 'db://assets/GameFramework/Base/Log/GameFrameworkLogLevel';
Log.setLevel(GameFrameworkLogLevel.Warning); // 仅输出 Warning 及以上
```

日志辅助器在 `BaseComponent` 的 Inspector 中选择（`logHelperType`），框架启动时自动初始化。

---

## 附：常用模式速查

### 流程间传值

```typescript
// 存（在当前流程 onEnter/onUpdate 中）
fsm.setData('NextScene', 'GameScene');

// 取（在目标流程 onEnter 中）
const name = fsm.getData<string>('NextScene');
```

### 异步加载 + 等待

```typescript
// 在 ProcedurePreload 中并行加载多张表
async onEnter(fsm) {
    await Promise.all([
        GameEntry.Resource.loadAssetAsync('resources', 'DataTables/DRHero', TextAsset)
            .then(asset => GameEntry.DataTable.getDataTable(DRHero)?.parseData(asset.text)),
        GameEntry.Resource.loadAssetAsync('resources', 'DataTables/DRScene', TextAsset)
            .then(asset => GameEntry.DataTable.getDataTable(DRScene)?.parseData(asset.text)),
    ]);
    this.changeState(fsm, ProcedureMenu);
}
```

### 事件的订阅 / 取消配对

```typescript
export class MyUI extends UIFormLogic {
    onOpen(): void {
        GameEntry.Event.subscribe(PlayerDieEventArgs.EVENT_ID, this._onDie, this);
    }
    onClose(): void {
        GameEntry.Event.unsubscribe(PlayerDieEventArgs.EVENT_ID, this._onDie);
    }
    private _onDie(sender: object, e: BaseEventArgs): void { /* ... */ }
}
```
