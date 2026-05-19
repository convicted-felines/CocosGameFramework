import { IDataRow } from './IDataRow';
import { IDataTable } from './IDataTable';
import { GameFrameworkError } from '../Base/GameFrameworkError';

export class DataTable<T extends IDataRow> implements IDataTable<T> {
    private readonly _name: string;
    private readonly _rowType: new () => T;
    private readonly _rows: Map<number, T> = new Map();
    private _minIdDataRow: T | null = null;
    private _maxIdDataRow: T | null = null;

    constructor(name: string, rowType: new () => T) {
        this._name = name;
        this._rowType = rowType;
    }

    get name(): string { return this._name; }
    get count(): number { return this._rows.size; }
    get minIdDataRow(): T | null { return this._minIdDataRow; }
    get maxIdDataRow(): T | null { return this._maxIdDataRow; }

    // ---- 查询 ----

    hasDataRow(idOrCondition: number | ((row: T) => boolean)): boolean {
        if (typeof idOrCondition === 'number') {
            return this._rows.has(idOrCondition);
        }
        for (const row of this._rows.values()) {
            if (idOrCondition(row)) return true;
        }
        return false;
    }

    getDataRow(idOrCondition: number | ((row: T) => boolean)): T | null {
        if (typeof idOrCondition === 'number') {
            return this._rows.get(idOrCondition) ?? null;
        }
        for (const row of this._rows.values()) {
            if (idOrCondition(row)) return row;
        }
        return null;
    }

    getDataRows(condition: (row: T) => boolean): T[] {
        const results: T[] = [];
        this.getDataRowsInto(condition, results);
        return results;
    }

    getDataRowsInto(condition: (row: T) => boolean, results: T[]): void {
        results.length = 0;
        for (const row of this._rows.values()) {
            if (condition(row)) results.push(row);
        }
    }

    getDataRowsSorted(comparison: (a: T, b: T) => number): T[] {
        const results: T[] = [];
        this.getDataRowsSortedInto(comparison, results);
        return results;
    }

    getDataRowsSortedInto(comparison: (a: T, b: T) => number, results: T[]): void {
        results.length = 0;
        for (const row of this._rows.values()) results.push(row);
        results.sort(comparison);
    }

    getDataRowsFiltered(condition: (row: T) => boolean, comparison: (a: T, b: T) => number): T[] {
        const results: T[] = [];
        this.getDataRowsFilteredInto(condition, comparison, results);
        return results;
    }

    getDataRowsFilteredInto(condition: (row: T) => boolean, comparison: (a: T, b: T) => number, results: T[]): void {
        results.length = 0;
        for (const row of this._rows.values()) {
            if (condition(row)) results.push(row);
        }
        results.sort(comparison);
    }

    getAllDataRows(): T[] {
        return Array.from(this._rows.values());
    }

    getAllDataRowsInto(results: T[]): void {
        results.length = 0;
        for (const row of this._rows.values()) results.push(row);
    }

    // ---- 逐行写入 ----

    addDataRow(dataRowString: string, userData?: any): boolean {
        const row = new this._rowType();
        if (!row.parseDataRow(dataRowString, userData)) {
            console.warn(`[DataTable] ${this._name}: failed to parse row: ${dataRowString}`);
            return false;
        }
        if (this._rows.has(row.id)) {
            throw new GameFrameworkError(`DataRow id [${row.id}] already exists in DataTable [${this._name}].`);
        }
        this._rows.set(row.id, row);
        this._updateMinMax(row);
        return true;
    }

    removeDataRow(id: number): boolean {
        if (!this._rows.delete(id)) return false;
        if ((this._minIdDataRow !== null && this._minIdDataRow.id === id) ||
            (this._maxIdDataRow !== null && this._maxIdDataRow.id === id)) {
            this._recalcMinMax();
        }
        return true;
    }

    removeAllDataRows(): void {
        this._rows.clear();
        this._minIdDataRow = null;
        this._maxIdDataRow = null;
    }

    // ---- 批量解析 ----

    parseData(dataTableString: string, userData?: any): boolean {
        let pos = 0;
        while (pos < dataTableString.length) {
            const nl = dataTableString.indexOf('\n', pos);
            const end = nl === -1 ? dataTableString.length : nl;
            const line = dataTableString.substring(pos, end).replace(/[\r\s]+$/, '');
            pos = end + 1;
            if (line.length === 0 || line.charAt(0) === '#') continue;
            if (!this.addDataRow(line, userData)) return false;
        }
        return true;
    }

    // ---- Iterator ----

    [Symbol.iterator](): Iterator<T> {
        return this._rows.values();
    }

    // ---- Internal ----

    private _updateMinMax(row: T): void {
        if (this._minIdDataRow === null || row.id < this._minIdDataRow.id) this._minIdDataRow = row;
        if (this._maxIdDataRow === null || row.id > this._maxIdDataRow.id) this._maxIdDataRow = row;
    }

    private _recalcMinMax(): void {
        this._minIdDataRow = null;
        this._maxIdDataRow = null;
        for (const row of this._rows.values()) this._updateMinMax(row);
    }

    shutdown(): void {
        this.removeAllDataRows();
    }
}
