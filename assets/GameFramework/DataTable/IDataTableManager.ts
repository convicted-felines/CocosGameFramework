import { IDataRow } from './IDataRow';
import { IDataTable } from './IDataTable';

export interface IDataTableManager {
    readonly count: number;

    hasDataTable<T extends IDataRow>(name: string): boolean;
    getDataTable<T extends IDataRow>(name: string): IDataTable<T> | null;
    getAllDataTables(): IDataTable<any>[];

    createDataTable<T extends IDataRow>(
        name: string,
        rowType: new () => T
    ): IDataTable<T>;

    destroyDataTable(name: string): boolean;
}
