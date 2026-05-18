import { IDataRow } from './IDataRow';

export interface IDataTable<T extends IDataRow> {
    readonly name: string;
    readonly count: number;

    hasDataRow(id: number): boolean;
    getDataRow(id: number): T | null;
    getAllDataRows(): T[];

    // 解析整个表（CSV 文本 或 JSON 数组）
    parseFromCsv(csv: string): boolean;
    parseFromJson(json: Record<string, any>[]): boolean;
}
