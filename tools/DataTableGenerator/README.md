# DataTable Generator

将 Excel 配置表导出为 TypeScript 行类和二进制文件。

## 目录结构

```
tools/DataTableGenerator/
├── DataTableGenerator.js     # 主生成脚本
├── DataTableCodeTemplate.ts  # TS 代码模板
├── package.json
└── README.md

assets/Game/DataTables/
├── Excel/                    # 放置 .xlsx 配置表文件
└── Text/                     # 生成的 tab 分隔 txt 文件（中间产物）

assets/Game/DataTable/        # 生成的 DRXxx.ts 数据行类
assets/resources/DataTables/  # 生成的 .bytes 二进制文件（运行时加载）
```

## txt 文件格式

| 行  | 说明              | 列0  | 列1  | 列2+       |
|-----|-------------------|------|------|-----------|
| 0   | 注释/描述行（#开头）| #   | 表描述| ...       |
| 1   | 字段名行（#开头）  | #   | Id   | FieldName |
| 2   | 类型行（#开头）    | #   | id   | int/string/bool/float/long |
| 3   | 注释行（#开头）    | #   | 编号 | 字段说明   |
| 4+  | 数据行（列0为空） | 空  | 1001 | 值...     |

支持的类型：`id`, `bool`, `int`, `uint`, `float`, `double`, `long`, `string`

## 使用方法

### 方式一：直接编辑 txt 文件（推荐快速迭代）

1. 在 `assets/Game/DataTables/Text/` 下编写 `.txt` 文件
2. 运行生成命令：

```bash
cd tools/DataTableGenerator
node DataTableGenerator.js code
```

### 方式二：从 Excel 一键导出（推荐团队协作）

1. 将 `.xlsx` 文件放入 `assets/Game/DataTables/Excel/`
2. 每张 Excel 的**每个工作表**对应一张数据表，工作表名即为表名
3. 运行：

```bash
cd tools/DataTableGenerator
node DataTableGenerator.js all
```

或使用快捷脚本（从项目根目录）：
```bash
node tools/DataTableGenerator/DataTableGenerator.js all
```

## 运行时使用生成的行类

```typescript
import { DRAircraft } from '../DataTable/DRAircraft';

// 加载数据表（ProcedurePreload 中）
GameEntry.DataTable.loadDataTable(DRAircraft, 'DataTables/Aircraft', 'resources');

// 查询
const table = GameEntry.DataTable.getDataTable(DRAircraft);
const row = table?.getDataRow(10000); // 按 Id 查询
console.log(row?.Name, row?.MaxHP);
```

## 初始化（首次使用）

```bash
cd tools/DataTableGenerator
npm install
```
