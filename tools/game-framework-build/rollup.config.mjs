import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import obfuscator from 'rollup-plugin-obfuscator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { obfuscatorOptions } from './obfuscator-options.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OBFUSCATE = process.env.OBFUSCATE === '1' || process.env.OBFUSCATE === 'true';

const srcDir = path.resolve(__dirname, '../../packages/GameFramework');
const outDir = path.resolve(
    __dirname,
    OBFUSCATE ? '../../frameworkNpm-obfuscated' : '../../frameworkNpm'
);
const distPackage = path.resolve(
    __dirname,
    OBFUSCATE ? 'dist-package-obfuscated.json' : 'dist-package.json'
);

if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(distPackage, path.join(outDir, 'package.json'));

const jsPlugins = [
    typescript({
        tsconfig: './tsconfig.rollup.json',
        declaration: false,
    }),
];

if (OBFUSCATE) {
    jsPlugins.push(
        obfuscator({
            global: true,
            options: obfuscatorOptions,
        })
    );
}

export default [
    {
        input: path.join(srcDir, 'index.ts'),
        output: {
            file: path.join(outDir, 'game-framework.mjs'),
            format: 'es',
            sourcemap: false,
        },
        plugins: jsPlugins,
    },
    {
        input: path.join(srcDir, 'index.ts'),
        output: {
            file: path.join(outDir, 'game-framework.d.ts'),
            format: 'es',
        },
        plugins: [
            dts({
                tsconfig: './tsconfig.rollup.json',
            }),
        ],
    },
];
