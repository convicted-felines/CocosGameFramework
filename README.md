# CocosGameFramework

基于 Cocos Creator 3.8.8 的游戏框架，移植自 Unity GameFramework。提供流程管理、UI、实体、资源、事件、数据表等完整模块。

## 快速开始

### 环境要求

- Cocos Creator 3.8.8
- Node.js（用于构建核心层 npm 包）

### 首次运行

```bash
# 1. 构建核心层 npm 包
npm run build:framework
npm install

# 2. 用 Cocos Creator 打开本项目
# 3. 运行主场景，使用 TestPanel 验证各模块
```

### 修改核心层后

```bash
npm run build:framework
# 回到 Cocos Creator 重新编译
```

## 架构概览

```
packages/GameFramework/       核心层（无 cc 依赖，npm 包）
        ↓
assets/CocosGameFramework/      引擎适配层（Component + Helper）
        ↓
assets/Game/                    业务层（流程、UI、实体、数据）
```

统一入口：`GameEntry.Xxx`（在 `GameEntry.start()` 后可用）。

场景根节点 `GameEntry` 下挂载各模块 Component（Base、Event、Procedure、UI、Entity 等），详见 [AGENTS.md](./AGENTS.md#场景节点结构)。

## 目录结构

```
CocosGameFramework/
├── packages/GameFramework/     # 核心层源码
├── frameworkNpm/               # 核心层编译产物（npm 包）
├── assets/
│   ├── CocosGameFramework/       # 引擎适配层
│   ├── Game/                   # 业务层
│   │   ├── Scripts/
│   │   │   ├── Base/GameEntry.ts
│   │   │   ├── Procedure/      # 游戏流程
│   │   │   ├── UI/             # UI 扩展
│   │   │   ├── Entity/         # 实体扩展
│   │   │   ├── DataTable/      # 数据表行类 (DRXxx)
│   │   │   └── Test/           # TestPanel 测试用例
│   │   └── DataTables/         # 配置表源文件
│   └── resources/              # 运行时资源（DataTables、Config 等）
├── tools/
│   ├── game-framework-build/   # 核心层 Rollup 构建
│   └── DataTableGenerator/     # 数据表代码生成器
├── AGENTS.md                   # AI 开发指南
├── RECIPES.md                  # 常见任务配方
├── MODULES.md                  # 模块 API 手册
└── MIGRATION.md                # Unity 迁移对照
```

## 文档索引

| 文档 | 说明 | 适合谁 |
|------|------|--------|
| [AGENTS.md](./AGENTS.md) | AI 助手项目上下文、决策树、编码约定 | AI / 新成员 |
| [RECIPES.md](./RECIPES.md) | 新增 Procedure / UI / Entity 等端到端步骤 | 日常开发 |
| [MODULES.md](./MODULES.md) | 21 个模块完整 API 与代码示例 | API 查阅 |
| [MIGRATION.md](./MIGRATION.md) | Unity GameFramework → Cocos 差异与进度 | 从 Unity 迁移 |
| [packages/GameFramework/README.md](./packages/GameFramework/README.md) | 核心层构建、npm 发布、混淆包 | 框架维护 |
| [tools/DataTableGenerator/README.md](./tools/DataTableGenerator/README.md) | 配置表自动生成（DRXxx.ts + .bytes） | 策划 / 程序 |

## 常用命令

```bash
npm run build:framework              # 构建核心层
npm run build:framework:obfuscate    # 构建混淆包
npm run pack:framework:obfuscate     # 打包混淆 tgz

# 数据表自动生成（在项目根目录，或双击 gen-datatable.bat）
node tools/DataTableGenerator/DataTableGenerator.js all    # Excel → txt → DRXxx.ts + .bytes
node tools/DataTableGenerator/DataTableGenerator.js code   # 仅 txt → DRXxx.ts + .bytes
node tools/DataTableGenerator/DataTableGenerator.js excel  # 仅 Excel → txt
```

## 模块一览

通过 `GameEntry` 访问：

| 模块 | 入口 | 用途 |
|------|------|------|
| Procedure | `GameEntry.Procedure` | 游戏顶层流程（启动、预加载、菜单、主游戏） |
| UI | `GameEntry.UI` | UI 界面打开/关闭/分组管理 |
| Entity | `GameEntry.Entity` | 游戏实体显示/隐藏/父子挂载 |
| Event | `GameEntry.Event` | 全局事件订阅与派发 |
| Resource | `GameEntry.Resource` | Bundle 与资源异步加载 |
| DataTable | `GameEntry.DataTable` | 配置数据表查询 |
| Sound | `GameEntry.Sound` | 音乐/音效/UI 音效 |
| FSM | `GameEntry.Fsm` | 通用有限状态机 |
| Setting | `GameEntry.Setting` | 本地持久化存储 |

完整列表见 [MODULES.md](./MODULES.md)。

## AI 辅助开发

本项目针对 AI 协作做了以下准备：

- **AGENTS.md** — 给 AI 的项目说明书（架构、约定、决策树）
- **RECIPES.md** — 可复制的开发配方
- **.cursor/rules/** — Cursor 项目规则（自动注入上下文）
- **TestPanel** — 运行时模块自测（`assets/Game/Scripts/Test/`）

使用 Cursor 开发时，AI 会自动读取 `.cursor/rules/` 中的规则。
