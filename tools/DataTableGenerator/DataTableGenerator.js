/**
 * DataTable Generator for CocosGameFramework
 *
 * 用法（在项目根目录执行）：
 *   node tools/DataTableGenerator/DataTableGenerator.js [command]
 *
 * 前置条件：在 tools/DataTableGenerator/ 目录下运行 npm install
 *
 * 命令：
 *   excel   — 将 assets/Game/DataTables/Excel/*.xlsx 导出为 txt
 *   code    — 读取 txt 文件，生成 DRXxx.ts + .bytes 二进制文件
 *   all     — 依次执行 excel + code（默认）
 *
 * txt 文件格式（制表符分隔，UTF-8）：
 *   Row 0  : 注释行（#开头列 = 注释列）
 *   Row 1  : 字段名   Id    Name    Hp    ...
 *   Row 2  : 类型     id    string  int   ...
 *   Row 3  : 注释     编号  名称    血量  ...
 *   Row 4+ : 数据行
 *
 * 支持的类型：id, bool, int, uint, float, string, long
 */

'use strict';

const fs = require('fs');
const path = require('path');
// 需要先运行 npm install（在 tools/DataTableGenerator/ 目录下）
const JSZip = require('jszip');

// ─── 路径配置 ───────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '../../');
const EXCEL_FOLDER  = path.join(ROOT, 'assets/Game/DataTables/Excel');
const TEXT_FOLDER   = path.join(ROOT, 'assets/Game/DataTables/Text');
const BYTES_FOLDER  = path.join(ROOT, 'assets/resources/DataTables');
const CODE_FOLDER   = path.join(ROOT, 'assets/Game/Scripts/DataTable');
const TEMPLATE_FILE = path.join(__dirname, 'DataTableCodeTemplate.ts');

// ─── txt 文件行索引 ──────────────────────────────────────────────────────────
const ROW_NAME    = 1;  // 字段名行
const ROW_TYPE    = 2;  // 类型行
const ROW_COMMENT = 3;  // 注释行
const ROW_CONTENT = 4;  // 数据起始行
const ID_COLUMN   = 1;  // Id 所在列（0-based，第0列是注释列）

// ─── 类型映射（txt类型名 → TS类型关键字） ────────────────────────────────────
const TYPE_MAP = {
    'id':     'number',
    'bool':   'boolean',
    'boolean':'boolean',
    'int':    'number',
    'int32':  'number',
    'uint':   'number',
    'uint32': 'number',
    'long':   'number',
    'int64':  'number',
    'float':  'number',
    'single': 'number',
    'double': 'number',
    'string': 'string',
};

// 写入二进制时每种类型占用的字节数（-1 = 变长，需用 7-bit 编码写入长度前缀）
const BINARY_WRITER = {
    'id':     (buf, offset, val) => write7BitInt(buf, offset, val | 0),
    'bool':   (buf, offset, val) => { buf[offset] = val ? 1 : 0; return offset + 1; },
    'boolean':(buf, offset, val) => { buf[offset] = val ? 1 : 0; return offset + 1; },
    'int':    (buf, offset, val) => write7BitInt(buf, offset, val | 0),
    'int32':  (buf, offset, val) => write7BitInt(buf, offset, val | 0),
    'uint':   (buf, offset, val) => write7BitUInt(buf, offset, val >>> 0),
    'uint32': (buf, offset, val) => write7BitUInt(buf, offset, val >>> 0),
    'long':   (buf, offset, val) => writeInt64(buf, offset, BigInt(val)),
    'int64':  (buf, offset, val) => writeInt64(buf, offset, BigInt(val)),
    'float':  (buf, offset, val) => { buf.writeFloatLE(val, offset); return offset + 4; },
    'single': (buf, offset, val) => { buf.writeFloatLE(val, offset); return offset + 4; },
    'double': (buf, offset, val) => { buf.writeDoubleLE(val, offset); return offset + 8; },
    'string': (buf, offset, val) => writeString(buf, offset, String(val)),
};

// ─── 二进制辅助函数 ──────────────────────────────────────────────────────────

function write7BitInt(buf, offset, value) {
    // C# BinaryWriter.Write7BitEncodedInt32 — 有符号 zigzag 不使用，直接无符号截断
    let v = value >>> 0;
    return write7BitUInt(buf, offset, v);
}

function write7BitUInt(buf, offset, value) {
    let v = value >>> 0;
    while (v >= 0x80) {
        buf[offset++] = (v & 0x7F) | 0x80;
        v >>>= 7;
    }
    buf[offset++] = v & 0x7F;
    return offset;
}

function writeInt64(buf, offset, value) {
    // 写为 LE 8 字节
    buf.writeBigInt64LE(value, offset);
    return offset + 8;
}

function writeString(buf, offset, value) {
    const strBuf = Buffer.from(value, 'utf8');
    offset = write7BitUInt(buf, offset, strBuf.length);
    strBuf.copy(buf, offset);
    return offset + strBuf.length;
}

// 将字段值解析为 JS 值
function parseValue(typeStr, rawStr) {
    const t = typeStr.toLowerCase();
    rawStr = (rawStr || '').trim();
    switch (t) {
        case 'bool': case 'boolean':
            return rawStr.toLowerCase() === 'true' || rawStr === '1';
        case 'id': case 'int': case 'int32': case 'uint': case 'uint32':
            return parseInt(rawStr, 10) || 0;
        case 'long': case 'int64':
            return Number(rawStr) || 0;
        case 'float': case 'single':
            return parseFloat(rawStr) || 0;
        case 'double':
            return parseFloat(rawStr) || 0;
        default:
            return rawStr;
    }
}

// ─── DataTableProcessor ──────────────────────────────────────────────────────

class DataTableProcessor {
    constructor(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const allLines = content.split(/\r?\n/);

        // 将每行按 tab 拆分，处理列数不一致
        const rawValues = allLines.map(l => l.split('\t'));
        const rawColumnCount = rawValues[ROW_NAME].length;
        this._rawValues = rawValues.map(row => {
            if (row.length >= rawColumnCount) return row.slice(0, rawColumnCount);
            const padded = [...row];
            while (padded.length < rawColumnCount) padded.push('');
            return padded;
        });

        this._nameRow    = this._rawValues[ROW_NAME];
        this._typeRow    = this._rawValues[ROW_TYPE];
        this._commentRow = this._rawValues[ROW_COMMENT];
        this._rawColumnCount = rawColumnCount;
        this._rawRowCount    = this._rawValues.length;
    }

    get rawRowCount()    { return this._rawRowCount; }
    get rawColumnCount() { return this._rawColumnCount; }

    isCommentRow(row)    { return (this._rawValues[row][0] || '').startsWith('#'); }
    isCommentColumn(col) { return col === 0 || !(this._nameRow[col] || '').trim(); }
    isIdColumn(col)      { return col === ID_COLUMN; }

    getName(col)    { return (this._nameRow[col] || '').trim(); }
    getType(col)    { return (this._typeRow[col] || '').trim().toLowerCase(); }
    getComment(col) { return (this._commentRow[col] || '').trim(); }
    getValue(row, col) { return (this._rawValues[row][col] || '').trim(); }

    getTsType(col) {
        const t = this.getType(col);
        return TYPE_MAP[t] || 'string';
    }

    /** 将一行数据序列化为 Buffer（不含行长前缀） */
    serializeRow(rawRow) {
        const chunks = [];
        for (let col = 0; col < this._rawColumnCount; col++) {
            if (this.isCommentColumn(col)) continue;
            const typeStr = this.getType(col);
            const writer  = BINARY_WRITER[typeStr];
            if (!writer) {
                console.warn(`  [WARN] 不支持的类型 '${typeStr}'，跳过列 ${col}`);
                continue;
            }
            const rawStr = this.getValue(rawRow, col);
            const val    = parseValue(typeStr, rawStr);
            const tmp    = Buffer.alloc(256);
            const end    = writer(tmp, 0, val);
            chunks.push(tmp.slice(0, end));
        }
        return Buffer.concat(chunks);
    }
}

// ─── 代码生成 ────────────────────────────────────────────────────────────────

function generateTsProperties(proc) {
    const lines = [];
    for (let col = 0; col < proc.rawColumnCount; col++) {
        if (proc.isCommentColumn(col) || proc.isIdColumn(col)) continue;
        const name    = proc.getName(col);
        const tsType  = proc.getTsType(col);
        const comment = proc.getComment(col);
        lines.push(`    /** ${comment} */`);
        lines.push(`    ${name}: ${tsType} = ${tsType === 'string' ? "''" : tsType === 'boolean' ? 'false' : '0'};`);
    }
    return lines.join('\n');
}

function generateTsParser(proc, tableName) {
    const lines = [];
    lines.push(`    parseDataRow(dataRowString: string, _userData?: any): boolean {`);
    lines.push(`        const cols = dataRowString.split('\\t');`);
    lines.push(`        let i = 0;`);

    for (let col = 0; col < proc.rawColumnCount; col++) {
        if (proc.isCommentColumn(col)) {
            lines.push(`        i++; // 注释列`);
            continue;
        }
        const name   = proc.getName(col);
        const type   = proc.getType(col);
        const tsType = proc.getTsType(col);
        const expr   = buildParseExpr(type, tsType, 'cols[i++]');

        if (proc.isIdColumn(col)) {
            lines.push(`        this._id = ${expr};`);
        } else {
            lines.push(`        this.${name} = ${expr};`);
        }
    }

    lines.push(`        return true;`);
    lines.push(`    }`);
    return lines.join('\n');
}

function buildParseExpr(type, tsType, src) {
    switch (type) {
        case 'bool': case 'boolean':
            return `(${src} || '').trim().toLowerCase() === 'true' || (${src} || '') === '1'`;
        case 'string':
            return `(${src} || '').trim()`;
        default:
            return tsType === 'number' ? `+(${src} || 0)` : `(${src} || '').trim()`;
    }
}

function generateDataTableRowTs(tableName, proc) {
    const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
    const now = new Date().toLocaleString('zh-CN');

    const properties = generateTsProperties(proc);
    const parser     = generateTsParser(proc, tableName);
    // 获取首行描述（注释行第一个非空值，通常在 row 0 col 1）
    const description = proc.rawRowCount > 0 ? (proc.getValue(0, 1) || tableName + '数据表') : tableName + '数据表';

    return template
        .replace(/__DATA_TABLE_CREATE_TIME__/g, now)
        .replace(/__DATA_TABLE_NAME__/g, tableName)
        .replace(/__DATA_TABLE_DESCRIPTION__/g, description)
        .replace(/__DATA_TABLE_PROPERTIES__/g, properties)
        .replace(/__DATA_TABLE_PARSER__/g, parser);
}

// ─── 生成二进制文件 ──────────────────────────────────────────────────────────

function generateBytesFile(tableName, proc) {
    const rowBuffers = [];
    for (let row = ROW_CONTENT; row < proc.rawRowCount; row++) {
        if (proc.isCommentRow(row)) continue;
        const rowBuf = proc.serializeRow(row);
        if (!rowBuf || rowBuf.length === 0) continue;

        // 行长前缀：7-bit encoded
        const lenBuf = Buffer.alloc(4);
        const lenEnd = write7BitUInt(lenBuf, 0, rowBuf.length);
        rowBuffers.push(lenBuf.slice(0, lenEnd));
        rowBuffers.push(rowBuf);
    }

    const outPath = path.join(BYTES_FOLDER, `${tableName}.bytes`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.concat(rowBuffers));
    console.log(`  [bytes] ${path.relative(ROOT, outPath)}`);
}

// ─── Excel → txt ─────────────────────────────────────────────────────────────

async function exportExcelToText() {
    if (!fs.existsSync(EXCEL_FOLDER)) {
        console.log(`[ExcelExport] Excel 文件夹不存在，跳过: ${EXCEL_FOLDER}`);
        return;
    }
    fs.mkdirSync(TEXT_FOLDER, { recursive: true });

    const files = fs.readdirSync(EXCEL_FOLDER)
        .filter(f => !f.startsWith('~$') && (f.endsWith('.xlsx') || f.endsWith('.xlsm')));

    if (files.length === 0) {
        console.log('[ExcelExport] 未找到 Excel 文件。');
        return;
    }

    // 收集所有工作表名，检测重名
    const sheetToFiles = {};
    for (const file of files) {
        const sheetNames = await getSheetNames(path.join(EXCEL_FOLDER, file));
        for (const name of sheetNames) {
            (sheetToFiles[name] = sheetToFiles[name] || []).push(file);
        }
    }
    const duplicates = new Set(Object.keys(sheetToFiles).filter(k => sheetToFiles[k].length > 1));
    if (duplicates.size > 0) {
        console.log(`[ExcelExport] 检测到重名工作表（将添加文件名后缀）: ${[...duplicates].join(', ')}`);
    }

    let total = 0;
    for (const file of files) {
        const fileBase = path.basename(file, path.extname(file));
        const count = await exportSheets(path.join(EXCEL_FOLDER, file), fileBase, duplicates);
        total += count;
    }
    console.log(`[ExcelExport] 完成，共导出 ${total} 个工作表到 ${path.relative(ROOT, TEXT_FOLDER)}`);
}

async function getSheetNames(excelPath) {
    const data  = fs.readFileSync(excelPath);
    const zip   = await JSZip.loadAsync(data);
    const wb    = zip.file('xl/workbook.xml');
    if (!wb) return [];
    const xml   = await wb.async('string');
    const names = [];
    const re    = /<sheet[^>]*name="([^"]+)"/g;
    let m;
    while ((m = re.exec(xml)) !== null) names.push(m[1]);
    return names;
}

async function exportSheets(excelPath, fileBase, duplicates) {
    const data = fs.readFileSync(excelPath);
    const zip  = await JSZip.loadAsync(data);

    // 读取共享字符串
    const sharedStrings = await readSharedStrings(zip);

    // 读取 workbook.xml 获取工作表列表
    const sheets = await readWorkbookSheets(zip);

    // 读取关系文件
    const rels = await readWorkbookRels(zip);

    let count = 0;
    for (const sheet of sheets) {
        const relPath  = rels[sheet.rid];
        if (!relPath) continue;
        const entryPath = 'xl/' + relPath;
        const sheetFile = zip.file(entryPath) || zip.file(relPath);
        if (!sheetFile) {
            console.warn(`  [WARN] 找不到工作表文件: ${entryPath}`);
            continue;
        }
        const tsv = await readSheetAsTsv(sheetFile, sharedStrings);
        const outName = duplicates.has(sheet.name)
            ? `${sheet.name}_${fileBase}.txt`
            : `${sheet.name}.txt`;
        const outPath = path.join(TEXT_FOLDER, outName);
        fs.writeFileSync(outPath, tsv, 'utf-8');
        console.log(`  [txt] ${outName}`);
        count++;
    }
    return count;
}

async function readSharedStrings(zip) {
    const entry = zip.file('xl/sharedStrings.xml');
    if (!entry) return [];
    const xml = await entry.async('string');
    const strings = [];
    const siRe = /<si>([\s\S]*?)<\/si>/g;
    let m;
    while ((m = siRe.exec(xml)) !== null) {
        const si = m[1];
        // 简单文本
        const tMatch = /<t(?:[^>]*)>([\s\S]*?)<\/t>/g;
        const parts = [];
        let tm;
        while ((tm = tMatch.exec(si)) !== null) {
            parts.push(decodeXmlEntities(tm[1]));
        }
        strings.push(parts.join(''));
    }
    return strings;
}

async function readWorkbookSheets(zip) {
    const entry = zip.file('xl/workbook.xml');
    if (!entry) return [];
    const xml = await entry.async('string');
    const sheets = [];
    const re = /<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
        sheets.push({ name: m[1], rid: m[2] });
    }
    return sheets;
}

async function readWorkbookRels(zip) {
    const entry = zip.file('xl/_rels/workbook.xml.rels');
    if (!entry) return {};
    const xml = await entry.async('string');
    const rels = {};
    const re = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
        rels[m[1]] = m[2];
    }
    return rels;
}

async function readSheetAsTsv(sheetFile, sharedStrings) {
    const xml = await sheetFile.async('string');
    const ns  = '';
    const rows = [];

    // 解析所有行
    const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g;
    let rm;
    while ((rm = rowRe.exec(xml)) !== null) {
        const rowXml = rm[1];
        const cellMap = {};
        let maxCol = -1;

        const cellRe = /<c\s+r="([^"]+)"([^>]*)>([\s\S]*?)<\/c>/g;
        let cm;
        while ((cm = cellRe.exec(rowXml)) !== null) {
            const ref  = cm[1];
            const attr = cm[2];
            const inner = cm[3];
            const colIdx = parseColIndex(ref);
            if (colIdx > maxCol) maxCol = colIdx;

            const typeMatch = /t="([^"]+)"/.exec(attr);
            const cellType  = typeMatch ? typeMatch[1] : '';
            const vMatch    = /<v>([\s\S]*?)<\/v>/.exec(inner);
            const rawVal    = vMatch ? decodeXmlEntities(vMatch[1]) : '';
            const isMatch   = /<is>([\s\S]*?)<\/is>/.exec(inner);

            let value = '';
            if (cellType === 's') {
                const idx = parseInt(rawVal, 10);
                value = (sharedStrings[idx] !== undefined) ? sharedStrings[idx] : '';
            } else if (cellType === 'inlineStr' && isMatch) {
                const tRe = /<t(?:[^>]*)>([\s\S]*?)<\/t>/g;
                let tv;
                const parts = [];
                while ((tv = tRe.exec(isMatch[1])) !== null) parts.push(decodeXmlEntities(tv[1]));
                value = parts.join('');
            } else if (cellType === 'b') {
                value = rawVal === '1' ? 'TRUE' : 'FALSE';
            } else {
                value = rawVal;
            }
            cellMap[colIdx] = value;
        }

        if (maxCol < 0) { rows.push(''); continue; }
        const rowArr = [];
        for (let i = 0; i <= maxCol; i++) {
            rowArr.push(cellMap[i] !== undefined ? cellMap[i] : '');
        }
        rows.push(rowArr.join('\t'));
    }
    return rows.join('\n') + '\n';
}

function parseColIndex(ref) {
    let col = 0;
    for (let i = 0; i < ref.length; i++) {
        const c = ref.charCodeAt(i);
        if (c >= 65 && c <= 90) col = col * 26 + (c - 64);
        else break;
    }
    return col - 1;
}

function decodeXmlEntities(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

// ─── txt → code + bytes ──────────────────────────────────────────────────────

function generateFromText() {
    if (!fs.existsSync(TEXT_FOLDER)) {
        console.log(`[CodeGen] txt 文件夹不存在: ${TEXT_FOLDER}`);
        return;
    }
    fs.mkdirSync(CODE_FOLDER, { recursive: true });
    fs.mkdirSync(BYTES_FOLDER, { recursive: true });

    const txtFiles = fs.readdirSync(TEXT_FOLDER).filter(f => f.endsWith('.txt'));
    if (txtFiles.length === 0) {
        console.log('[CodeGen] 未找到 txt 文件。');
        return;
    }

    for (const file of txtFiles) {
        const tableName = path.basename(file, '.txt');
        const filePath  = path.join(TEXT_FOLDER, file);
        console.log(`[CodeGen] 处理: ${tableName}`);
        try {
            const proc = new DataTableProcessor(filePath);

            // 生成 TS 代码
            const tsCode  = generateDataTableRowTs(tableName, proc);
            const tsPath  = path.join(CODE_FOLDER, `DR${tableName}.ts`);
            fs.writeFileSync(tsPath, tsCode, 'utf-8');
            console.log(`  [ts]    ${path.relative(ROOT, tsPath)}`);

            // 生成二进制文件
            generateBytesFile(tableName, proc);
        } catch (e) {
            console.error(`  [ERROR] ${tableName}: ${e.message}`);
        }
    }
    console.log('[CodeGen] 完成。');
}

// ─── 入口 ─────────────────────────────────────────────────────────────────────

async function main() {
    const cmd = process.argv[2] || 'all';
    console.log(`DataTableGenerator — 命令: ${cmd}\n`);

    if (cmd === 'excel' || cmd === 'all') {
        await exportExcelToText();
    }
    if (cmd === 'code' || cmd === 'all') {
        generateFromText();
    }
}

main().catch(e => { console.error(e); process.exit(1); });
