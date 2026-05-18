import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { IDataTableManager } from './IDataTableManager';
import { IDataTable } from './IDataTable';
import { IDataRow } from './IDataRow';
import { DataTable } from './DataTable';

export class DataTableManager extends GameFrameworkModule implements IDataTableManager {
    private _tables: Map<string, DataTable<any>> = new Map();

    get priority(): number { return 65; }
    get count(): number { return this._tables.size; }

    hasDataTable<T extends IDataRow>(name: string): boolean {
        return this._tables.has(name);
    }

    getDataTable<T extends IDataRow>(name: string): IDataTable<T> | null {
        return (this._tables.get(name) as DataTable<T>) ?? null;
    }

    getAllDataTables(): IDataTable<any>[] {
        return Array.from(this._tables.values());
    }

    createDataTable<T extends IDataRow>(
        name: string,
        rowType: new () => T
    ): IDataTable<T> {
        if (this._tables.has(name)) {
            throw new GameFrameworkError(`DataTable [${name}] already exists.`);
        }
        const table = new DataTable<T>(name, rowType);
        this._tables.set(name, table);
        return table;
    }

    destroyDataTable(name: string): boolean {
        return this._tables.delete(name);
    }

    update(_e: number, _r: number): void {}

    shutdown(): void {
        this._tables.clear();
    }
}
