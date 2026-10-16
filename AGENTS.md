# AI 开发指南

本文档为 AI 助手提供项目上下文。开始任何任务前请先阅读本文件。

## 项目简介

Cocos Creator 3.8.8 游戏框架，移植自 Unity GameFramework（C#）。TypeScript 编写，三层架构分离核心逻辑与引擎适配。

## 三层架构

| 层级 | 路径 | 职责 | 是否依赖 `cc` |
|------|------|------|--------------|
| 核心层 | `packages/GameFramework/` | 纯逻辑 Manager、接口、数据结构 | 否 |
| 引擎适配层 | `assets/CocosGameFramework/` | Component 包装、Helper 实现 | 是 |
| 业务层 | `assets/Game/` | 游戏流程、UI、实体、数据表 | 是 |

### 代码放置决策树

```
需要改框架通用能力？
├─ 是，且不依赖 Cocos API → packages/GameFramework/（改后必须 rebuild）
├─ 是，且需要 Component/Node/Prefab → assets/CocosGameFramework/
└─ 否，仅游戏业务逻辑 → assets/Game/
```

**禁止**在 `assets/` 下放置 `GameFramework` 副本（会与 npm 包重复编译）。

## 统一入口

所有模块通过 `GameEntry.Xxx` 静态属性访问，**仅在 `GameEntry.start()` 完成后可用**。

```typescript
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
```

| 静态属性 | 类型 | 说明 |
|---------|------|------|
| `GameEntry.Base` | BaseComponent | 游戏速度、帧率 |
| `GameEntry.Event` | EventComponent | 事件订阅/派发 |
| `GameEntry.Fsm` | FsmComponent | 有限状态机 |
| `GameEntry.Procedure` | ProcedureComponent | 顶层流程 |
| `GameEntry.UI` | UIComponent & UIExtension | UI 管理（含游戏层 mixin） |
| `GameEntry.Entity` | EntityComponent & EntityExtension | 实体管理（含游戏层 mixin） |
| `GameEntry.Resource` | ResourceComponent | 资源加载 |
| `GameEntry.DataTable` | DataTableComponent | 配置数据表 |
| `GameEntry.Sound` | SoundComponent | 音效 |
| `GameEntry.Setting` | SettingComponent | 本地存储 |
| `GameEntry.Config` | ConfigComponent | 配置 |
| `GameEntry.Localization` | LocalizationComponent | 本地化 |
| `GameEntry.Network` | NetworkComponent | 网络 |
| `GameEntry.WebRequest` | WebRequestComponent | HTTP 请求 |
| `GameEntry.Scene` | SceneComponent | 场景切换 |
| `GameEntry.ObjectPool` | ObjectPoolComponent | 对象池 |
| `GameEntry.ReferencePool` | ReferencePoolComponent | 引用池 |
| `GameEntry.Download` | DownloadComponent | 下载 |
| `GameEntry.FileSystem` | FileSystemComponent | 文件系统 |
| `GameEntry.BuiltinData` | BuiltinDataComponent | 游戏内置数据 |

## 导入路径约定

```typescript
// 核心层（npm 包，推荐）
import { ProcedureBase, ReferencePool } from '@game-studio/game-framework';

// 引擎适配层 / 业务层（Cocos db:// 协议）
import { UIFormLogic } from 'db://assets/CocosGameFramework/UI/UIFormLogic';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
```

## 场景节点结构

`GameEntry` 挂在场景根节点（持久化），子节点各挂一个 Component：

```
GameEntry (assets/Game/Scripts/Base/GameEntry.ts)
├── BaseNode         → BaseComponent
├── EventNode        → EventComponent
├── FsmNode          → FsmComponent
├── ProcedureNode    → ProcedureComponent
├── SettingNode      → SettingComponent
├── ConfigNode       → ConfigComponent
├── DataTableNode    → DataTableComponent
├── DataNodeNode     → DataNodeComponent
├── ObjectPoolNode   → ObjectPoolComponent
├── LocalizationNode → LocalizationComponent
├── NetworkNode      → NetworkComponent
├── WebRequestNode   → WebRequestComponent
├── DownloadNode     → DownloadComponent
├── ResourceNode     → ResourceComponent
├── SceneNode        → SceneComponent
├── UIRoot           → UIComponent（uiGroups: Default / Dialog / Tip）
├── EntityRoot       → EntityComponent
├── AudioNode        → SoundComponent
├── FileSystemNode   → FileSystemComponent
└── BuiltinDataNode  → BuiltinDataComponent
```

## 核心层修改流程

修改 `packages/GameFramework/` 后必须执行：

```bash
npm run build:framework
npm install   # 版本号未变时可跳过
```

然后在 Cocos Creator 中重新编译项目。**不要直接修改 `frameworkNpm/` 下的文件**。

## 编码约定

| 类别 | 约定 |
|------|------|
| Procedure 类 | `ProcedureXxx.ts`，继承 `ProcedureBase` |
| UI 逻辑类 | `XxxFormLogic.ts`，继承 `UIFormLogic`，挂在 Prefab 根节点 |
| 实体逻辑类 | `XxxEntityLogic.ts`，继承 `EntityLogic`，挂在 Prefab 根节点 |
| 数据表行类 | `DRXxx.ts`，由生成器自动生成，勿手动修改 |
| 事件参数 | 继承 `BaseEventArgs` 或 `GameEventArgs`，实现 `IReference` |
| 事件 ID | `static readonly EVENT_ID` 或 `EventId` |
| 私有成员 | `_camelCase` |
| 扩展方法 | 通过 mixin 写入 `UIExtension` / `EntityExtension`，不直接改 Component |

## 必须遵守的规则

1. **事件配对**：`subscribe` 必须在 `onOpen`/`onEnter` 中，`unsubscribe` 必须在 `onClose`/`onLeave` 中
2. **引用池**：`ReferencePool.acquire` 使用后必须 `ReferencePool.release`
3. **流程切换**：使用 `this.changeState(fsm, TargetProcedure)`，不要直接操作 FSM
4. **UI 打开**：`GameEntry.UI.openUIForm(assetName, bundleName, groupName)`，返回值 `< 0` 表示失败
5. **实体显示**：`GameEntry.Entity.showEntity(entityId, assetName, bundleName, groupName)`
6. **枚举导出**：对外暴露的枚举用 `export enum`，不要用 `export const enum`（npm 打包后无运行时对象）

## 常见任务

详见 [RECIPES.md](./RECIPES.md)：

- 新增 Procedure
- 新增 UI 界面
- 新增 Entity
- 新增事件
- 新增 DataTable
- 扩展 GameEntry（mixin）
- 新增 Helper

## 文档索引

| 文档 | 用途 |
|------|------|
| [README.md](./README.md) | 项目导航与快速开始 |
| [RECIPES.md](./RECIPES.md) | 常见开发任务配方 |
| [MODULES.md](./MODULES.md) | 21 个模块 API 参考 |
| [MIGRATION.md](./MIGRATION.md) | Unity → Cocos 迁移对照 |
| [packages/GameFramework/README.md](./packages/GameFramework/README.md) | 核心层构建说明 |
| [tools/DataTableGenerator/README.md](./tools/DataTableGenerator/README.md) | 数据表生成器 |

## 自测

运行游戏后使用 TestPanel 验证模块功能。测试用例位于 `assets/Game/Scripts/Test/cases/`。
