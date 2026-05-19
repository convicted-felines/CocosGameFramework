import { IDataRow } from './IDataRow';

export interface IDataTable<T extends IDataRow> {
    readonly name: string;
    readonly count: number;

    /** 编号最小的行，表为空时返回 null */
    readonly minIdDataRow: T | null;
    /** 编号最大的行，表为空时返回 null */
    readonly maxIdDataRow: T | null;

    // ---- 查询 ----
    hasDataRow(id: number): boolean;
    hasDataRow(condition: (row: T) => boolean): boolean;

    getDataRow(id: number): T | null;
    getDataRow(condition: (row: T) => boolean): T | null;

    /** 按条件过滤 */
    getDataRows(condition: (row: T) => boolean): T[];
    getDataRowsInto(condition: (row: T) => boolean, results: T[]): void;

    /** 按比较器排序（全部行） */
    getDataRowsSorted(comparison: (a: T, b: T) => number): T[];
    getDataRowsSortedInto(comparison: (a: T, b: T) => number, results: T[]): void;

    /** 过滤 + 排序 */
    getDataRowsFiltered(condition: (row: T) => boolean, comparison: (a: T, b: T) => number): T[];
    getDataRowsFilteredInto(condition: (row: T) => boolean, comparison: (a: T, b: T) => number, results: T[]): void;

    getAllDataRows(): T[];
    getAllDataRowsInto(results: T[]): void;

    // ---- 逐行写入（由 helper 调用） ----
    addDataRow(dataRowString: string, userData?: any): boolean;
    removeDataRow(id: number): boolean;
    removeAllDataRows(): void;

    // ---- 批量解析（便捷 API，内部逐行调用 addDataRow） ----
    parseData(dataTableString: string, userData?: any): boolean;

    // TS iterator support
    [Symbol.iterator](): Iterator<T>;
}
