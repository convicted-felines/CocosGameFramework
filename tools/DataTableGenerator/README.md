# DataTable Generator

将 Excel / txt 配置表**自动生成** TypeScript 数据行类（`DRXxx.ts`）和二进制资源（`Xxx.bytes`）。

---

## 功能概览

本工具实现 **配置表 → 代码 + 资源** 的全自动流水线，无需手写 `DRXxx.ts` 中的字段声明和 `parseDataRow` 解析逻辑。

| 阶段 | 输入 | 输出 |
|------|------|------|
| `excel` | `assets/Game/DataTables/Excel/*.xlsx` | `assets/Game/DataTables/Text/*.txt` |
| `code` | `assets/Game/DataTables/Text/*.txt` | `assets/Game/Scripts/DataTable/DRXxx.ts`（行类）<br>`assets/resources/DataTables/Xxx.bytes`（二进制） |
| `all` | Excel + txt | 依次执行上述两步（默认） |

### 自动生成内容

对每个 txt 表（如 `Entity.txt`），`code` 命令会生成：

**1. TypeScript 行类** `assets/Game/Scripts/DataTable/DREntity.ts`

- 实现 `IDataRow` 接口
- 自动生成所有字段属性（含 JSDoc 注释）
- 自动生成 `parseDataRow()` 解析方法
- 文件头标注「由工具自动生成，请勿手动修改」

示例（由 `Entity.txt` 生成）：

```typescript
/** 实体表 */
export class DREntity implements IDataRow {
    private _id: number = 0;
    get id(): number { return this._id; }

    /** 资源名称 */
    AssetName: string = '';

    parseDataRow(dataRowString: string, _userData?: any): boolean {
        const cols = dataRowString.split('\t');
        let i = 0;
        i++; // 注释列
        this._id = +(cols[i++] || 0);
        i++; // 注释列
        this.AssetName = (cols[i++] || '').trim();
        return true;
    }
}
```

**2. 二进制资源** `assets/resources/DataTables/Entity.bytes`

- 每行数据序列化为二进制，行长前缀使用 7-bit 编码
- 字段编码规则兼容 Unity GameFramework `BinaryWriter` 格式
- 可用于资源热更新或后续扩展二进制加载 Helper

**3. 代码模板** `DataTableCodeTemplate.ts`

生成器读取此模板，将占位符替换为实际内容：

| 占位符 | 替换为 |
|--------|--------|
| `__DATA_TABLE_CREATE_TIME__` | 生成时间 |
| `__DATA_TABLE_NAME__` | 表名（如 `Entity`） |
| `__DATA_TABLE_DESCRIPTION__` | 表描述（txt 第 0 行第 2 列） |
| `__DATA_TABLE_PROPERTIES__` | 自动生成的字段属性 |
| `__DATA_TABLE_PARSER__` | 自动生成的 `parseDataRow` 方法 |

---

## 目录结构

```
tools/DataTableGenerator/
├── DataTableGenerator.js     # 主生成脚本
├── DataTableCodeTemplate.ts  # TS 代码模板
├── package.json
└── README.md

assets/Game/DataTables/
├── Excel/                    # 放置 .xlsx 配置表（策划编辑）
└── Text/                     # tab 分隔 txt（Excel 导出或手写）

assets/Game/Scripts/DataTable/  # 生成的 DRXxx.ts（勿手改）
assets/resources/DataTables/    # 生成的 Xxx.bytes（运行时资源）
```

---

## 快速开始

### 初始化（首次使用）

```bash
cd tools/DataTableGenerator
npm install
```

### 一键生成（推荐）

在项目根目录双击 `gen-datatable.bat`，或执行：

```bash
# 项目根目录
node tools/DataTableGenerator/DataTableGenerator.js all
```

等价于依次执行 `excel`（Excel → txt）和 `code`（txt → TS + bytes）。

### 命令说明

| 命令 | 作用 |
|------|------|
| `excel` | 将 `Excel/*.xlsx` 各工作表导出为 `Text/*.txt` |
| `code` | 读取 `Text/*.txt`，生成 `DRXxx.ts` + `Xxx.bytes` |
| `all` | 依次执行 `excel` + `code`（默认） |

```bash
# 在 tools/DataTableGenerator/ 目录下
npm run all      # 完整流水线
npm run excel    # 仅 Excel → txt
npm run code     # 仅 txt → TS + bytes

# 或在项目根目录
node tools/DataTableGenerator/DataTableGenerator.js code
node tools/DataTableGenerator/DataTableGenerator.js excel
node tools/DataTableGenerator/DataTableGenerator.js all
```

---

## 配置表格式

### txt 文件结构（制表符 `\t` 分隔，UTF-8 编码）

| 行号 | 作用 | 列 0 | 列 1 | 列 2+ |
|------|------|------|------|-------|
| 0 | 表描述 | `#` | 表名/描述 | ... |
| 1 | 字段名 | `#` | `Id` | `FieldName` ... |
| 2 | 字段类型 | `#` | `id` | `int` / `string` ... |
| 3 | 字段注释 | `#` | 编号 | 字段说明 ... |
| 4+ | 数据行 | 空 | 1001 | 值 ... |

### 真实示例：`Entity.txt`

```
#	实体表
#	Id		AssetName
#	int		string
#	实体编号	策划备注	资源名称
	1000	战斗小猫	BattleCatty
	1001	巨魔农夫	OgreFarmer
```

说明：

- **第 0 列**（`#` 开头或字段名为空）为注释列，生成器自动跳过
- **第 1 列**（`Id` / `id`）为主键列，映射为 `id` 属性（只读 getter）
- 字段名之间的空列（如 `Id` 和 `AssetName` 之间的策划备注列）也会被识别为注释列并跳过
- 数据行第 0 列为空，从第 1 列开始是 Id 值

### 支持的字段类型

| txt 类型 | TS 类型 | 二进制编码 |
|----------|---------|-----------|
| `id` | `number` | 7-bit encoded int |
| `int` / `int32` | `number` | 7-bit encoded int |
| `uint` / `uint32` | `number` | 7-bit encoded uint |
| `long` / `int64` | `number` | 8 字节 LE |
| `float` / `single` | `number` | 4 字节 float LE |
| `double` | `number` | 8 字节 double LE |
| `bool` / `boolean` | `boolean` | 1 字节（0/1） |
| `string` | `string` | 7-bit 长度前缀 + UTF-8 |

---

## 使用方式

### 方式一：直接编辑 txt（推荐快速迭代）

1. 在 `assets/Game/DataTables/Text/` 下创建或修改 `.txt` 文件
2. 运行 `code` 命令生成代码和资源：

```bash
node tools/DataTableGenerator/DataTableGenerator.js code
```

### 方式二：从 Excel 导出（推荐团队协作）

1. 将 `.xlsx` 文件放入 `assets/Game/DataTables/Excel/`
2. Excel 中按上述 txt 格式编排（前 4 行为表头，第 5 行起为数据）
3. **每个工作表对应一张数据表**，工作表名即为表名（生成 `DR{工作表名}.ts`）
4. 运行 `all` 命令：

```bash
node tools/DataTableGenerator/DataTableGenerator.js all
```

#### Excel 注意事项

- 支持 `.xlsx` 和 `.xlsm` 格式
- 以 `~$` 开头的临时文件会自动跳过
- 多个 Excel 中存在同名工作表时，输出文件名自动添加 `_文件名` 后缀（如 `Hero_DataTable.txt`）
- 工作表内容按行导出为 tab 分隔文本，列顺序与 Excel 一致

---

## 新增一张配置表的完整流程

以新增 `Hero` 表为例：

**1. 编写配置源文件**

在 `assets/Game/DataTables/Text/Hero.txt` 中按格式编写，或将 Excel 工作表命名为 `Hero` 放入 `Excel/` 目录。

**2. 运行生成器**

```bash
node tools/DataTableGenerator/DataTableGenerator.js all
```

生成产物：

- `assets/Game/Scripts/DataTable/DRHero.ts`
- `assets/resources/DataTables/Hero.bytes`

**3. 注册到预加载列表**

在 `assets/Game/Scripts/Procedure/ProcedurePreload.ts` 的 `DATA_TABLES` 数组中添加表名：

```typescript
const DATA_TABLES = [
    'Aircraft', 'Armor', /* ... */ 'Hero',
];
```

**4. 回到 Cocos Creator 刷新资源**

生成器会覆盖已有的 `DRHero.ts` 和 `Hero.bytes`，在编辑器中确认资源已更新。

**5. 运行时使用**

```typescript
import { DRHero } from 'db://assets/Game/Scripts/DataTable/DRHero';

// 方式 A：通过 DataTableComponent 异步加载（文本资源）
GameEntry.DataTable.loadDataTable(DRHero, 'DataTables/Hero', 'resources');

// 方式 B：手动解析 txt 内容
const table = GameEntry.DataTable.createDataTable(DRHero);
table.parseData(txtContent);  // txt 第 4 行起的 tab 分隔数据

// 查询
const heroTable = GameEntry.DataTable.getDataTable(DRHero);
const row = heroTable?.getDataRow(1001);
console.log(row?.AssetName);
```

---

## 运行时集成说明

### 生成的行类

- 类名规则：`DR` + 表名（`Entity` → `DREntity`）
- 通过 `GameEntry.DataTable.getDataTable(DRXxx)` 获取表实例
- 通过 `table.getDataRow(id)` 按主键查询
- 通过 `table.getAllDataRows()` 遍历所有行

### 资源格式

| 产物 | 路径 | 用途 |
|------|------|------|
| `DRXxx.ts` | `assets/Game/Scripts/DataTable/` | 编译期类型定义 + `parseDataRow` 解析 |
| `Xxx.bytes` | `assets/resources/DataTables/` | 二进制运行时资源（热更新兼容） |

当前 `DefaultDataTableHelper` 解析的是 **Tab 分隔文本**（与 txt 数据行格式一致）。若使用 `loadDataTable` 加载，需确保 `resources` 目录下有对应的文本资源；`.bytes` 二进制文件可用于热更新流程或后续扩展二进制 Helper。

### 监听加载事件

```typescript
import { LoadDataTableSuccessEventArgs } from 'db://assets/CocosGameFramework/DataTable/DataTableEventArgs';

GameEntry.Event.subscribe(
    LoadDataTableSuccessEventArgs.EVENT_ID,
    this._onTableLoaded,
    this
);
```

---

## 注意事项

- **`DRXxx.ts` 由工具自动生成，请勿手动修改**。修改配置请编辑 txt / Excel 后重新运行生成器
- 重新生成会**覆盖**已有的 `DRXxx.ts` 和 `Xxx.bytes`
- txt 文件必须使用 **UTF-8** 编码、**Tab** 分隔（不是空格）
- 表名（文件名去掉 `.txt`）会直接影响类名：`Sound.txt` → `DRSound.ts`
- 每张表必须有 `Id` 列（第 1 列），类型为 `id`
- 同一表中 Id 不可重复（运行时 `addDataRow` 会抛错）
- 修改配置表后需重新生成，并在 Cocos Creator 中刷新资源

---

## 排错

| 现象 | 可能原因 | 处理 |
|------|---------|------|
| `[CodeGen] 未找到 txt 文件` | `Text/` 目录为空 | 先编写 txt 或运行 `excel` 命令 |
| `[ExcelExport] 未找到 Excel 文件` | `Excel/` 目录为空 | 放入 `.xlsx` 文件或直接用 txt 方式 |
| `[ERROR] xxx: ...` | txt 格式不正确 | 检查前 4 行表头和 Tab 分隔 |
| `[WARN] 不支持的类型` | 字段类型不在支持列表中 | 改用支持的类型名 |
| 生成后 Cocos 报类型错误 | 未刷新 | 回到编辑器等待编译完成 |
| 运行时查不到数据 | 未注册到 `DATA_TABLES` 或未加载 | 检查 `ProcedurePreload` 和 `loadDataTable` 调用 |

---

## 相关文档

- 模块 API：[MODULES.md](../../MODULES.md) §9 DataTable
- 开发配方：[RECIPES.md](../../RECIPES.md) §5 新增 DataTable
- AI 指南：[AGENTS.md](../../AGENTS.md)
