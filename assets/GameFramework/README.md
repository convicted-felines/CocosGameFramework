# GameFramework 核心层构建与复用指南

核心层不依赖任何引擎（无 `import 'cc'`），可通过 Rollup 编译为单一 JS + 类型声明文件，供其他项目复用，类似 UnityGameFramework 中 `GameFramework.dll` 的分发方式。

---

## 目录结构

```
assets/GameFramework/       ← 核心层源码（Cocos Creator 直接扫描）
├── index.ts                ← 所有模块的统一 barrel 导出入口
└── ...模块目录

tools/game-framework-build/ ← 构建工具（Cocos Creator 不扫描）
├── rollup.config.mjs       ← Rollup 打包配置
├── tsconfig.rollup.json    ← Rollup 专用 TS 配置
├── package.json            ← 构建依赖及 build 脚本
└── node_modules/           ← 构建依赖安装目录
```

编译产物输出到：

```
D:/CocosProject/frameworkNpm/
├── game-framework.cjs.js      ← CommonJS 产物
├── game-framework.esm.js      ← ESM 产物（支持 tree-shaking）
├── game-framework.d.ts        ← 合并后的完整类型声明（对应 .dll 的 XML 注释）
└── package.json
```

---

## 构建

### 首次初始化（仅需一次）

```bash
cd tools/game-framework-build
npm install
```

### 重新打包

每次修改核心层代码后执行：

```bash
cd tools/game-framework-build
npm run build
```

等价于 `rollup -c rollup.config.mjs`，输出覆盖 `frameworkNpm/` 目录下的三个文件。

---

## 混淆

混淆开关位于 `tools/game-framework-build/rollup.config.mjs` 顶部：

```js
// 设为 true 启用混淆，false 输出可读代码
const OBFUSCATE = true;
```

改为 `false` 后重新执行 `npm run build`，产物即为可读的原始编译结果，适合开发调试阶段使用。

### 混淆效果

启用后所有标识符替换为 `_0x` 十六进制形式，字符串常量提取到 base64 加密数组，直接阅读 JS 产物无法还原逻辑。类型声明文件 `game-framework.d.ts` 不受影响，使用方仍有完整的 IDE 类型提示。

### 混淆选项说明

| 选项 | 当前值 | 说明 |
|---|---|---|
| `stringArray` | `true` | 字符串提取到加密数组，核心保护手段 |
| `stringArrayEncoding` | `base64` | 平衡保护强度与运行时解码开销 |
| `identifierNamesGenerator` | `hexadecimal` | 变量名替换为 `_0x1a2b` 形式 |
| `controlFlowFlattening` | `false` | 开启会使体积膨胀 1.5-2x，影响 Cocos 二次打包速度 |
| `deadCodeInjection` | `false` | 同上，注入假代码会增大体积 |
| `renameGlobals` | `false` | 不重命名全局符号，防止与引擎冲突 |
| `sourceMap` | `false` | 混淆后不输出 sourcemap，防止反推源码位置 |

如需更强保护，可将 `controlFlowFlattening` 改为 `true`，代价是构建时间和产物体积明显增加。

---

## 分发方式

### 方式一：Git 仓库（推荐）

将 `frameworkNpm/` 目录单独作为一个 git 仓库维护：

```bash
cd D:/CocosProject/frameworkNpm
git init
git add .
git commit -m "chore: release v1.0.0"
git remote add origin https://github.com/your-name/game-framework.git
git push -u origin master
```

打版本 tag：

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 方式二：npm pack 离线包

```bash
cd D:/CocosProject/frameworkNpm
npm pack
# 生成 game-studio-game-framework-1.0.0.tgz，拷贝到目标设备使用
```
把这个 .tgz 文件拷贝/发送到其他设备，然后在目标项目里：
 
npm install ./game-studio-game-framework-1.0.0.tgz

### 方式三：发布到 npm 公共源

```bash
cd D:/CocosProject/frameworkNpm
npm login
npm publish --access public
```

---

## 在其他项目中使用

### 安装

根据分发方式选择对应安装命令：

```bash
# Git 仓库（锁定版本 tag）
npm install github:your-name/game-framework#v1.0.0

# 本地 file 协议
npm install file:D:/CocosProject/frameworkNpm

# 离线 .tgz 包
npm install ./game-studio-game-framework-1.0.0.tgz

# npm 公共源
npm install @game-studio/game-framework
```

### 更新

当核心层发布新版本后：

```bash
npm update @game-studio/game-framework
```

### 代码引用

安装后直接从包名导入，IDE 会自动读取 `game-framework.d.ts` 提供类型提示：

```typescript
import {
    GameFrameworkEntry,
    GameFrameworkModule,
    ReferencePool,
    EventManager,
    FsmManager,
} from '@game-studio/game-framework';
```

---

## 注意事项

- **不要直接修改 `frameworkNpm/` 下的文件**，它是编译产物，下次 `npm run build` 会覆盖。
- 如不希望使用方看到源码位置，发布前删除 `.map` 文件即可屏蔽 sourcemap。
