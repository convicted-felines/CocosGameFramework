import { IDataRow } from './IDataRow';
import { IDataTable } from './IDataTable';

export interface IDataTableManager {
    readonly count: number;

    // ---- 查询是否存在 ----
    /** 以行类型构造函数为 key，可选附带名称 */
    hasDataTable<T extends IDataRow>(rowType: new () => T, name?: string): boolean;

    // ---- 获取 ----
    getDataTable<T extends IDataRow>(rowType: new () => T, name?: string): IDataTable<T> | null;
    getAllDataTables(): IDataTable<any>[];

    // ---- 创建 ----
    createDataTable<T extends IDataRow>(rowType: new () => T, name?: string): IDataTable<T>;

    // ---- 销毁 ----
    destroyDataTable<T extends IDataRow>(rowType: new () => T, name?: string): boolean;
    destroyDataTable<T extends IDataRow>(dataTable: IDataTable<T>): boolean;
}
