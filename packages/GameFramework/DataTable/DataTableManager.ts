import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { IDataTableManager } from './IDataTableManager';
import { IDataTable } from './IDataTable';
import { IDataRow } from './IDataRow';
import { DataTable } from './DataTable';

// TypeScript 版的 TypeNamePair：以构造函数 + 名称组合为 key
function makeKey(rowType: new () => any, name: string): string {
    return `${rowType.name}|${name}`;
}

export class DataTableManager extends GameFrameworkModule implements IDataTableManager {
    private readonly _tables: Map<string, DataTable<any>> = new Map();

    get priority(): number { return 65; }
    get count(): number { return this._tables.size; }

    // ---- 查询是否存在 ----

    hasDataTable<T extends IDataRow>(rowType: new () => T, name: string = ''): boolean {
        return this._tables.has(makeKey(rowType, name));
    }

    // ---- 获取 ----

    getDataTable<T extends IDataRow>(rowType: new () => T, name: string = ''): IDataTable<T> | null {
        return (this._tables.get(makeKey(rowType, name)) as DataTable<T>) ?? null;
    }

    getAllDataTables(): IDataTable<any>[] {
        return Array.from(this._tables.values());
    }

    // ---- 创建 ----

    createDataTable<T extends IDataRow>(rowType: new () => T, name: string = ''): IDataTable<T> {
        const key = makeKey(rowType, name);
        if (this._tables.has(key)) {
            throw new GameFrameworkError(`DataTable [${key}] already exists.`);
        }
        const table = new DataTable<T>(name || rowType.name, rowType);
        this._tables.set(key, table);
        return table;
    }

    // ---- 销毁 ----

    destroyDataTable<T extends IDataRow>(rowTypeOrTable: (new () => T) | IDataTable<T>, name?: string): boolean;
    destroyDataTable<T extends IDataRow>(rowTypeOrTable: any, name: string = ''): boolean {
        let key: string | undefined;
        if (typeof rowTypeOrTable === 'function') {
            key = makeKey(rowTypeOrTable, name);
        } else {
            for (const [k, v] of this._tables) {
                if (v === rowTypeOrTable) { key = k; break; }
            }
        }
        if (key === undefined) return false;
        const table = this._tables.get(key);
        if (!table) return false;
        table.shutdown();
        return this._tables.delete(key);
    }

    // ---- Module lifecycle ----

    update(_e: number, _r: number): void {}

    shutdown(): void {
        for (const table of this._tables.values()) table.shutdown();
        this._tables.clear();
    }
}
