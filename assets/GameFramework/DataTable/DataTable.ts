import { IDataRow } from './IDataRow';
import { IDataTable } from './IDataTable';
import { GameFrameworkError } from '../Base/GameFrameworkError';

export class DataTable<T extends IDataRow> implements IDataTable<T> {
    private _name: string;
    private _rowType: new () => T;
    private _rows: Map<number, T> = new Map();

    constructor(name: string, rowType: new () => T) {
        this._name = name;
        this._rowType = rowType;
    }

    get name(): string { return this._name; }
    get count(): number { return this._rows.size; }

    hasDataRow(id: number): boolean { return this._rows.has(id); }

    getDataRow(id: number): T | null { return this._rows.get(id) ?? null; }

    getAllDataRows(): T[] { return Array.from(this._rows.values()); }

    parseFromCsv(csv: string): boolean {
        const lines = csv.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        // 第一行为字段名（注释），第二行起为数据
        const dataLines = lines.filter(l => !l.startsWith('#'));
        if (dataLines.length === 0) return true;

        let success = true;
        for (const line of dataLines) {
            const fields = line.split(',').map(f => f.trim());
            const row = new this._rowType();
            if (row.parseFromRow(fields)) {
                this._rows.set(row.id, row);
            } else {
                console.warn(`[DataTable] ${this._name}: failed to parse row: ${line}`);
                success = false;
            }
        }
        return success;
    }

    parseFromJson(jsonArray: Record<string, any>[]): boolean {
        let success = true;
        for (const data of jsonArray) {
            const row = new this._rowType();
            if (row.parseFromJson(data)) {
                this._rows.set(row.id, row);
            } else {
                console.warn(`[DataTable] ${this._name}: failed to parse json row:`, data);
                success = false;
            }
        }
        return success;
    }
}
