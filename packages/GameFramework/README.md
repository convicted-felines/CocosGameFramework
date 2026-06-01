# GameFramework 核心层

核心层不依赖任何引擎（无 `import 'cc'`），源码位于 `packages/GameFramework/`（**不在** `assets/` 下，避免被 Cocos 重复编译）。

通过 `tools/game-framework-build` 打包为 npm 包，本仓库与其它项目统一从 `@game-studio/game-framework` 引用。

---

## 目录结构

```
packages/GameFramework/     ← 核心层源码
├── index.ts                ← barrel 导出入口
└── ...

frameworkNpm/               ← 编译产物（npm 包根目录）
├── package.json
├── game-framework.mjs        ← ESM（type: module）
└── game-framework.d.ts

tools/game-framework-build/ ← Rollup 构建工具
```

---

## 构建

```bash
cd tools/game-framework-build
npm install
npm run build
```

或在仓库根目录：

```bash
npm run build:framework
```

构建完成后在根目录执行 `npm install`，将 `file:./frameworkNpm` 链接到 `node_modules/@game-studio/game-framework`。

---

## 在 Cocos 项目中使用

```typescript
import {
    GameFrameworkEntry,
    ProcedureBase,
    ReferencePool,
} from '@game-studio/game-framework';
```

`tsconfig.json` 建议包含：

```json
"compilerOptions": {
  "allowSyntheticDefaultImports": true,
  "skipLibCheck": true
}
```

核心层源码**仅**维护在 `packages/GameFramework/`，**不要**再在 `assets/` 下放置 `GameFramework` 副本（会与 npm 包重复编译）。

---

## 修改核心层后的流程

1. 改 `packages/GameFramework/**/*.ts`
2. `npm run build:framework`
3. 根目录 `npm install`（若版本号未变可跳过）
4. 回到 Cocos Creator 重新编译项目

---

## 其它项目复用

将 `frameworkNpm/` 单独发布（git / `npm pack` / 私有源），安装：

```bash
npm install file:../frameworkNpm
# 或
npm install @game-studio/game-framework
```

**注意：** 不要直接改 `frameworkNpm/` 下的文件，下次 build 会覆盖。

### 混淆包（测试 / 发布）

```bash
cd tools/game-framework-build
npm run build:obfuscate
# 产物：frameworkNpm-obfuscated/
# 打 tgz：npm run pack:obfuscate
```

或在仓库根目录：

```bash
npm run build:framework:obfuscate
npm run pack:framework:obfuscate
```

混淆包版本号为 `1.0.0-obfuscated`，`.d.ts` 与未混淆包相同，仅 `game-framework.mjs` 被混淆。安装到测试项目：

```bash
npm install file:../CocosGameFramework/frameworkNpm-obfuscated/game-studio-game-framework-1.0.0-obfuscated.tgz
```

### 枚举与 npm 包

对外暴露、且引擎层会在运行时访问的枚举（如 `GameFrameworkLogLevel`）必须使用 `export enum`，不要用 `export const enum`。`const enum` 打包后不会生成运行时对象，会导致 `undefined.Debug` 一类错误。
