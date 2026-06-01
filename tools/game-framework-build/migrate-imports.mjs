/**
 * 将 GameFramework 相对/db 路径导入合并为 @game-studio/game-framework
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const FROM_RE =
    /from\s+['"](?:(?:\.\.\/)+GameFramework\/[^'"]+|db:\/\/assets\/GameFramework\/[^'"]+)['"];?/g;

const SCAN_DIRS = [
    path.join(repoRoot, 'assets/CocosGameFramework'),
    path.join(repoRoot, 'assets/Game'),
    path.join(repoRoot, 'tools/DataTableGenerator'),
];

function parseClause(clause) {
    const trimmed = clause.trim();
    const isTypeOnly = trimmed.startsWith('type ');
    const body = isTypeOnly ? trimmed.slice(5).trim() : trimmed;
    if (body.startsWith('* as ')) {
        return { namespace: body, values: [], types: [], typeOnly: false };
    }
    const inner = body.replace(/^\{|\}$/g, '').trim();
    const types = [];
    const values = [];
    for (const part of inner.split(',')) {
        const p = part.trim();
        if (!p) continue;
        if (p.startsWith('type ')) {
            types.push(p.slice(5).trim());
        } else {
            values.push(p);
        }
    }
    return { namespace: null, values, types, typeOnly: isTypeOnly };
}

function findImportBlocks(content) {
    const blocks = [];
    let m;
    FROM_RE.lastIndex = 0;
    while ((m = FROM_RE.exec(content)) !== null) {
        const end = m.index + m[0].length;
        const before = content.slice(0, m.index);
        const start = before.lastIndexOf('import');
        if (start < 0) continue;
        const statement = content.slice(start, end);
        const clauseMatch = statement.match(
            /^import\s+(type\s+)?(\{[\s\S]*?\}|\*\s+as\s+\w+)\s+from\s+/s
        );
        if (!clauseMatch) continue;
        blocks.push({
            start,
            end,
            statement,
            parsed: parseClause((clauseMatch[1] || '') + clauseMatch[2]),
        });
    }
    return blocks;
}

function migrateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const blocks = findImportBlocks(content);
    if (blocks.length === 0) return false;

    const valueSet = new Set();
    const typeSet = new Set();
    let namespaceImport = null;

    for (const b of blocks) {
        if (b.parsed.namespace) namespaceImport = b.parsed.namespace;
        b.parsed.values.forEach((v) => valueSet.add(v));
        b.parsed.types.forEach((t) => typeSet.add(t));
    }

    let newContent = content;
    for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        newContent =
            newContent.slice(0, b.start) + newContent.slice(b.end);
    }
    newContent = newContent.replace(/\n{3,}/g, '\n\n');

    const lines = [];
    if (namespaceImport) {
        lines.push(`import ${namespaceImport} from '@game-studio/game-framework';`);
    }
    if (valueSet.size > 0) {
        lines.push(
            `import { ${[...valueSet].join(', ')} } from '@game-studio/game-framework';`
        );
    }
    if (typeSet.size > 0) {
        lines.push(
            `import type { ${[...typeSet].join(', ')} } from '@game-studio/game-framework';`
        );
    }
    const block = lines.join('\n') + '\n';

    const firstImport = newContent.search(/^import\s/m);
    if (firstImport >= 0) {
        newContent =
            newContent.slice(0, firstImport) +
            block +
            newContent.slice(firstImport);
    } else {
        newContent = block + newContent;
    }

    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
}

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name);
        const st = fs.statSync(p);
        if (st.isDirectory()) walk(p);
        else if (p.endsWith('.ts') && migrateFile(p)) {
            console.log('migrated:', path.relative(repoRoot, p));
        }
    }
}

for (const dir of SCAN_DIRS) walk(dir);
