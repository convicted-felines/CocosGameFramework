import { IDataTable } from './IDataTable';
import { IDataRow } from './IDataRow';

/**
 * 数据表辅助器接口。
 *
 * 负责将原始文本解析为数据行并写入数据表，以及释放数据表资产。
 * 通过替换辅助器实现可以支持不同的文本格式（Tab 分隔、CSV、JSON 等）。
 */
export interface IDataTableHelper {
    /**
     * 解析数据表文本，将所有行写入目标数据表。
     * @param dataTable        目标数据表
     * @param dataTableString  原始文本内容
     * @param userData         透传用户数据
     */
    parseData<T extends IDataRow>(dataTable: IDataTable<T>, dataTableString: string, userData?: any): boolean;

    /**
     * 释放数据表资产（如 TextAsset）。
     * @param dataTable      拥有该资产的数据表
     * @param dataTableAsset 待释放资产对象
     */
    releaseDataAsset<T extends IDataRow>(dataTable: IDataTable<T>, dataTableAsset: object): void;
}
