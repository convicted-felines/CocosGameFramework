# 开发配方

端到端的常见任务步骤。API 细节见 [MODULES.md](./MODULES.md)。

---

## 1. 新增 Procedure（游戏流程）

### 涉及文件

| 操作 | 文件 |
|------|------|
| 新建 | `assets/Game/Scripts/Procedure/ProcedureXxx.ts` |
| 修改 | `assets/Game/Scripts/Base/GameEntry.ts`（注册到 `initialize` 数组） |
| 可选 | 其他 Procedure 中 `changeState` 跳转过来 |

### 步骤

**1. 创建流程类**

```typescript
import { ProcedureBase, IFsm, ProcedureManager, GameFrameworkLog } from '@game-studio/game-framework';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';

export class ProcedureShop extends ProcedureBase {
    onEnter(_fsm: IFsm<ProcedureManager>): void {
        GameFrameworkLog.info('[ProcedureShop] Enter');
        // 打开 UI、加载资源等
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        // 检查条件后切换流程
        // this.changeState(fsm, ProcedureMenu);
    }

    onLeave(_fsm: IFsm<ProcedureManager>, _isShutdown: boolean): void {
        // 关闭 UI、清理状态
    }
}
```

**2. 注册到 GameEntry**

在 `GameEntry.initCustomComponents()` 的 `initialize` 数组中添加实例：

```typescript
import { ProcedureShop } from '../Procedure/ProcedureShop';

GameEntry.Procedure.initialize([
    launch,
    // ... 其他流程
    new ProcedureShop(),
], launch);
```

**3. 从其他流程跳转**

```typescript
import { ProcedureShop } from './ProcedureShop';

// 在 onUpdate 或事件回调中
this.changeState(fsm, ProcedureShop);

// 流程间传值
fsm.setData('ShopItemId', 1001);
const itemId = fsm.getData<number>('ShopItemId');
```

### 常见坑

- `initialize` 的入口流程实例必须包含在数组中
- `onLeave` 中务必清理 UI 和事件订阅
- 场景切换用 `ProcedureChangeScene`，通过 `fsm.setData('NextSceneName', 'Menu')` 传目标场景名

---

## 2. 新增 UI 界面

### 涉及文件

| 操作 | 文件 |
|------|------|
| 新建 | `assets/Game/Scripts/UI/XxxFormLogic.ts` |
| 新建 | `assets/Game/UI/XxxForm.prefab`（Cocos 编辑器） |
| 修改 | 对应 Procedure 中 `openUIForm` / `closeUIForm` |

### 步骤

**1. 创建 UIFormLogic 子类**

```typescript
import { _decorator, Button, Label } from 'cc';
import { UIFormLogic } from 'db://assets/CocosGameFramework/UI/UIFormLogic';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { ProcedureMenu } from 'db://assets/Game/Scripts/Procedure/ProcedureMenu';

const { ccclass, property } = _decorator;

@ccclass('MenuFormLogic')
export class MenuFormLogic extends UIFormLogic {
    @property(Button)
    startBtn: Button | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    protected onInit(): void {
        // 仅首次创建时调用，绑定按钮等一次性逻辑
        this.startBtn?.node.on(Button.EventType.CLICK, this._onStart, this);
    }

    onOpen(userData?: object): void {
        this.titleLabel!.string = '主菜单';
        // 订阅事件
        // GameEntry.Event.subscribe(SomeEventArgs.EVENT_ID, this._onSome, this);
    }

    onClose(_isShutdown: boolean, _userData?: object): void {
        // 取消事件订阅（必须配对）
        // GameEntry.Event.unsubscribe(SomeEventArgs.EVENT_ID, this._onSome);
    }

    onRecycle(): void {
        // 回收入池前重置状态
    }

    private _onStart(): void {
        // 通知当前 Procedure 开始游戏
        const proc = GameEntry.Procedure.getProcedure(ProcedureMenu) as ProcedureMenu;
        proc?.startGame();
    }
}
```

**2. 在 Cocos 编辑器创建 Prefab**

- 在 `assets/Game/UI/` 下创建 Prefab，命名为 `MenuForm`
- 根节点挂载 `MenuFormLogic` 组件
- 在 Inspector 中绑定 `@property` 引用的节点

**3. 在 Procedure 中打开/关闭**

```typescript
// onEnter
const serialId = GameEntry.UI.openUIForm('MenuForm', 'resources', 'Default');
if (serialId < 0) {
    GameFrameworkLog.error('[ProcedureMenu] Failed to open MenuForm');
}

// onLeave
const form = GameEntry.UI.getUIFormByAsset('MenuForm');
if (form) GameEntry.UI.closeUIFormByLogic(form);
```

**4. 异步打开（使用 UIExtension）**

```typescript
const form = await GameEntry.UI.openUIFormAsync('MenuForm', 'resources', 'Default');
```

### UI 分组

| 分组名 | 深度 | 用途 |
|--------|------|------|
| Default | 0 | 普通界面 |
| Dialog | 1 | 弹窗 |
| Tip | 2 | 提示/Toast |

分组在 `UIComponent` 的 Inspector `uiGroups` 中配置。

### 生命周期

```
onInit → onOpen → onUpdate(每帧) → onPause/onCover → onResume/onReveal → onClose → onRecycle
```

### 常见坑

- Prefab 根节点必须挂 `UIFormLogic` 子类
- `openUIForm` 第一个参数是 **Prefab 资源名**（不含路径），第二个是 Bundle 名
- 事件 subscribe/unsubscribe 必须在 onOpen/onClose 中配对
- `onInit` 只在首次创建时调用，从池中复用不会再次调用

---

## 3. 新增 Entity（游戏实体）

### 涉及文件

| 操作 | 文件 |
|------|------|
| 新建 | `assets/Game/Scripts/Entity/XxxEntityLogic.ts` |
| 新建 | `assets/Game/Entity/Xxx.prefab`（Cocos 编辑器） |
| 修改 | 显示/隐藏实体的 Procedure 或 EntityLogic |

### 步骤

**1. 创建 EntityLogic 子类**

```typescript
import { _decorator, Vec3 } from 'cc';
import { EntityLogic } from 'db://assets/CocosGameFramework/Entity/EntityLogic';

const { ccclass, property } = _decorator;

@ccclass('PlayerEntityLogic')
export class PlayerEntityLogic extends EntityLogic {
    @property
    moveSpeed: number = 5;

    protected onInit(_userData?: object): void {
        // 首次创建
    }

    onShow(userData?: object): void {
        // 每次显示时调用（含池复用）
        const pos = (userData as { position?: Vec3 })?.position;
        if (pos) this.node.setPosition(pos);
    }

    onHide(_isShutdown: boolean, _userData?: object): void {
        // 隐藏时清理
    }

    onUpdate(elapseSeconds: number, _realElapseSeconds: number): void {
        // 每帧更新（未被暂停时）
    }
}
```

**2. 在 Cocos 编辑器创建 Prefab**

- 在 `assets/Game/Entity/` 下创建 Prefab
- 根节点挂载 `PlayerEntityLogic` 组件

**3. 显示/隐藏实体**

```typescript
// 显示（entityId 由业务分配，同 id 同时只能存在一个实例）
GameEntry.Entity.showEntity(
    10001,              // entityId
    'Player',           // Prefab 资源名
    'resources',        // Bundle 名
    'Default',          // 实体分组（在 EntityComponent Inspector 配置）
    0,                  // priority
    { position: new Vec3(0, 0, 0) }  // userData，在 onShow 中读取
);

// 隐藏
GameEntry.Entity.hideEntity(10001);
// 或
const logic = GameEntry.Entity.getEntity(10001);
if (logic) GameEntry.Entity.hideEntity(logic);

// 查询
const player = GameEntry.Entity.getEntity(10001) as PlayerEntityLogic;
```

**4. 父子挂载**

```typescript
GameEntry.Entity.attachEntity(childEntityId, parentEntityId);
GameEntry.Entity.detachEntity(childEntityId);
```

### 实体分组

在 `EntityComponent` 的 Inspector `entityGroupConfigs` 中配置，默认 `Default` 分组。

### 常见坑

- `entityId` 需由业务层唯一分配
- `onInit` 仅首次创建，`onShow` 每次显示都会调用
- 不要直接调用 `__init` / `__reinit` 等 `__` 前缀方法

---

## 4. 新增事件

### 涉及文件

| 操作 | 文件 |
|------|------|
| 新建 | `assets/Game/Scripts/Event/XxxEventArgs.ts`（或放在相关模块旁） |

### 步骤

**1. 定义事件参数类**

```typescript
import { GameEventArgs, ReferencePool } from '@game-studio/game-framework';

export class PlayerDieEventArgs extends GameEventArgs {
    static readonly EventId = 'Player.Die';
    get id(): string { return PlayerDieEventArgs.EventId; }

    playerId: number = 0;
    killerId: number = 0;

    clear(): void {
        this.playerId = 0;
        this.killerId = 0;
    }

    static create(playerId: number, killerId: number): PlayerDieEventArgs {
        const args = ReferencePool.acquire(PlayerDieEventArgs);
        args.playerId = playerId;
        args.killerId = killerId;
        return args;
    }
}
```

**2. 订阅与派发**

```typescript
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { PlayerDieEventArgs } from '../Event/PlayerDieEventArgs';

// 订阅（onOpen / onEnter 中）
GameEntry.Event.subscribe(PlayerDieEventArgs.EventId, this._onPlayerDie, this);

// 派发（延迟到下一帧，推荐）
GameEntry.Event.fire(this, PlayerDieEventArgs.create(101, 202));

// 立即派发
GameEntry.Event.fireNow(this, PlayerDieEventArgs.create(101, 202));

// 取消（onClose / onLeave 中，必须）
GameEntry.Event.unsubscribe(PlayerDieEventArgs.EventId, this._onPlayerDie);

private _onPlayerDie(_sender: object, e: GameEventArgs): void {
    const args = e as PlayerDieEventArgs;
    console.log(args.playerId, args.killerId);
}
```

### 常见坑

- 必须实现 `IReference`（`clear()` 方法）以支持引用池
- `fire` 会自动 release 事件参数，**不要**在 fire 后再使用 args
- 忘记 unsubscribe 会导致内存泄漏和重复触发

---

## 5. 新增 DataTable（配置表）

> 生成器完整说明（自动生成的字段、类型映射、二进制格式、排错）见 [tools/DataTableGenerator/README.md](../tools/DataTableGenerator/README.md)。

### 涉及文件

| 操作 | 文件 |
|------|------|
| 新建/编辑 | `assets/Game/DataTables/Text/Xxx.txt` |
| 生成 | `assets/Game/Scripts/DataTable/DRXxx.ts`（自动生成） |
| 生成 | `assets/resources/DataTables/Xxx.bytes`（自动生成） |
| 修改 | `assets/Game/Scripts/Procedure/ProcedurePreload.ts`（加入加载列表） |

### 步骤

**1. 编写 txt 源文件**

在 `assets/Game/DataTables/Text/Hero.txt`：

```
#	英雄表
#	Id	AssetName	MaxHP
#	id	string	int
#	编号	资源名	最大生命
	1001	HeroKnight	1000
	1002	HeroMage	800
```

**2. 运行生成器**

```bash
# 项目根目录，或双击 gen-datatable.bat
node tools/DataTableGenerator/DataTableGenerator.js all   # 含 Excel 导出
# 或仅生成代码：
node tools/DataTableGenerator/DataTableGenerator.js code
```

自动生成：

- `assets/Game/Scripts/DataTable/DRHero.ts` — 行类（字段 + `parseDataRow`）
- `assets/resources/DataTables/Hero.bytes` — 二进制资源

**3. 在 ProcedurePreload 中加载**

在 `ProcedurePreload.ts` 的 `DATA_TABLES` 数组中添加表名：

```typescript
const DATA_TABLES = [
    'Aircraft', 'Armor', /* ... */ 'Hero',
];
```

**4. 运行时使用**

```typescript
import { DRHero } from 'db://assets/Game/Scripts/DataTable/DRHero';

const table = GameEntry.DataTable.getDataTable(DRHero);
const row = table?.getDataRow(1001);
console.log(row?.AssetName, row?.MaxHP);
```

### 常见坑

- `DRXxx.ts` 由工具生成，**不要手动修改**（改 txt 后重新生成）
- 表名大小写需与 `DATA_TABLES` 数组一致
- 首次使用生成器需 `cd tools/DataTableGenerator && npm install`

---

## 6. 扩展 GameEntry（mixin）

### 适用场景

为 `UIComponent` 或 `EntityComponent` 添加游戏层专属方法，无需修改框架代码。

### 涉及文件

| 操作 | 文件 |
|------|------|
| 修改 | `assets/Game/Scripts/UI/UIExtension.ts` 或 `EntityExtension.ts` |
| 可选 | `assets/Game/Scripts/Base/GameEntry.ts`（新 Component 扩展需注册） |

### 步骤

**1. 在 Extension 类中添加方法**

```typescript
// assets/Game/Scripts/UI/UIExtension.ts
import { UIComponent } from 'db://assets/CocosGameFramework/UI/UIComponent';

export class UIExtension {
    closeAllDialogs(userData?: object): void {
        const self = this as unknown as UIComponent;
        for (const form of self.getUIFormsByAsset('ConfirmDialog')) {
            self.closeUIFormByLogic(form, userData);
        }
    }
}
```

**2. 直接调用**

```typescript
GameEntry.UI.closeAllDialogs();
```

**3. 为新 Component 注册扩展（少见）**

在 `GameEntry.ts` 的 `_extensionRegistry` 中添加，或在 `start()` 前调用：

```typescript
GameEntry.registerExtension(SoundComponent, MySoundExtension);
```

### 常见坑

- Extension 方法中访问 Component 内部用 `(this as unknown as UIComponent)`
- `registerExtension` 必须在 `GameEntry.start()` 之前调用
- 不要直接修改 `assets/CocosGameFramework/` 下的 Component

---

## 7. 新增 Helper

### 适用场景

替换框架默认的 Helper 实现（如自定义 UI 实例化逻辑、实体创建方式）。

### 涉及文件

| 操作 | 文件 |
|------|------|
| 新建 | `assets/Game/Scripts/Helper/MyUIFormHelper.ts` |
| 修改 | 对应 `XxxHelperType` 枚举 |
| 注册 | Helper 文件顶层调用 `HelperRegistry.register()` |

### 步骤

**1. 继承 HelperBase 并实现**

```typescript
import { _decorator } from 'cc';
import { UIFormHelperBase } from 'db://assets/CocosGameFramework/UI/UIFormHelperBase';
import { HelperRegistry } from 'db://assets/CocosGameFramework/Utility/HelperRegistry';

const { ccclass } = _decorator;

@ccclass('MyUIFormHelper')
export class MyUIFormHelper extends UIFormHelperBase {
    // 实现抽象方法...
}

HelperRegistry.register('MyUIFormHelper', MyUIFormHelper);
```

**2. 在 HelperType 枚举中添加选项**

参考 `UIFormHelperType.ts`，添加新枚举值。

**3. 在 Component Inspector 中选择**

将 `UIComponent` 的 `uiFormHelperType` 改为 `MyUIFormHelper`。

### 常见坑

- `HelperRegistry.register()` 必须在文件顶层执行（模块加载时）
- 枚举名与注册名必须一致
- Helper 通过 `HelperRegistry.createHelper()` 自动创建子节点并挂载

---

## 8. 流程间切换场景

### 步骤

```typescript
import { ProcedureChangeScene } from './ProcedureChangeScene';

// 在当前 Procedure 的 onUpdate 中
fsm.setData('NextSceneName', 'Game');  // 目标场景名
this.changeState(fsm, ProcedureChangeScene);
```

`ProcedureChangeScene` 会读取 `NextSceneName`，加载场景后根据配置跳转到对应 Procedure。

### 常见坑

- 场景名必须与 Cocos 项目中场景资源名一致
- 预加载的资源应在 `ProcedurePreload` 中完成，场景切换不会重新加载 DataTable
