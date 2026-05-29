import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import fs from 'fs';

const srcDir = '../../assets/GameFramework';
const outDir = '../../assets/GameFramework-dist';

// 构建前清空输出目录
if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

export default [
    // 1. 编译为 ES Module → game-framework.js
    {
        input: `${srcDir}/index.ts`,
        output: {
            file: `${outDir}/game-framework.js`,
            format: 'es',
            sourcemap: false,
        },
        plugins: [
            typescript({
                tsconfig: './tsconfig.rollup.json',
                declaration: false,
            }),
        ],
    },
    // 2. 生成类型声明 → game-framework.d.ts
    {
        input: `${srcDir}/index.ts`,
        output: {
            file: `${outDir}/game-framework.d.ts`,
            format: 'es',
        },
        plugins: [
            dts({
                tsconfig: './tsconfig.rollup.json',
            }),
        ],
    },
];
