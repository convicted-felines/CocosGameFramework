'use strict';

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '../..');
const GENERATOR_DIR = path.join(PROJECT_ROOT, 'tools/DataTableGenerator');
const GENERATOR_SCRIPT = path.join(GENERATOR_DIR, 'DataTableGenerator.js');
const JSZIP_MARKER = path.join(GENERATOR_DIR, 'node_modules/jszip/package.json');

const REFRESH_URLS = [
    'db://assets/Game/Scripts/DataTable',
    'db://assets/resources/DataTables',
    'db://assets/Game/DataTables/Text',
];

let _running = false;

function log(message) {
    console.log(`[DataTableGenerator] ${message}`);
}

function warn(message) {
    console.warn(`[DataTableGenerator] ${message}`);
}

function error(message) {
    console.error(`[DataTableGenerator] ${message}`);
}

function ensureDependencies() {
    if (fs.existsSync(JSZIP_MARKER)) {
        return true;
    }

    log('首次运行，正在安装依赖...');
    const result = spawnSync('npm', ['install'], {
        cwd: GENERATOR_DIR,
        shell: true,
        stdio: 'inherit',
        encoding: 'utf-8',
    });

    if (result.status !== 0) {
        error('依赖安装失败，请确认已安装 Node.js 且网络可用。');
        return false;
    }

    return true;
}

async function refreshGeneratedAssets() {
    for (const url of REFRESH_URLS) {
        try {
            await Editor.Message.request('asset-db', 'refresh-asset', url);
        } catch (err) {
            warn(`刷新资源失败: ${url}`);
            console.warn(err);
        }
    }
}

function runGenerator(command) {
    if (_running) {
        warn('生成任务正在执行中，请稍候...');
        return;
    }

    if (!fs.existsSync(GENERATOR_SCRIPT)) {
        error(`未找到生成脚本: ${GENERATOR_SCRIPT}`);
        return;
    }

    if (!ensureDependencies()) {
        return;
    }

    _running = true;
    log(`开始执行: ${command}`);

    const child = spawn('node', [GENERATOR_SCRIPT, command], {
        cwd: GENERATOR_DIR,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (data) => {
        const text = data.toString().trimEnd();
        if (text) {
            console.log(text);
        }
    });

    child.stderr.on('data', (data) => {
        const text = data.toString().trimEnd();
        if (text) {
            console.error(text);
        }
    });

    child.on('error', (err) => {
        _running = false;
        error(`启动失败: ${err.message}`);
        error('请确认系统已安装 Node.js，并且可在命令行中执行 node 命令。');
    });

    child.on('close', async (code) => {
        _running = false;

        if (code === 0) {
            log('生成完成，正在刷新资源...');
            await refreshGeneratedAssets();
            log('全部完成。');
            return;
        }

        error(`生成失败，退出码: ${code}`);
    });
}

exports.methods = {
    generateAll() {
        runGenerator('all');
    },
    generateExcel() {
        runGenerator('excel');
    },
    generateCode() {
        runGenerator('code');
    },
};

exports.load = function () {
    log('扩展已加载。菜单路径: GameFramework → 数据表');
};

exports.unload = function () {};
