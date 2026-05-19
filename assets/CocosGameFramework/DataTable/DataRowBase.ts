import { IDataRow } from '../../GameFramework/DataTable/IDataRow';

/**
 * 数据表行基类，用户的具体行类继承此类并实现 id 与 parseDataRow。
 */
export abstract class DataRowBase implements IDataRow {
    abstract get id(): number;

    parseDataRow(dataRowString: string, userData?: any): boolean {
        console.warn('[DataRowBase] parseDataRow not implemented.');
        return false;
    }
}
