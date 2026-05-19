import { _decorator } from 'cc';
import { IDataTable } from '../../GameFramework/DataTable/IDataTable';
import { IDataRow } from '../../GameFramework/DataTable/IDataRow';
import { DataTableHelperBase } from './DataTableHelperBase';

const { ccclass } = _decorator;

/**
 * 默认数据表辅助器。
 *
 * 支持 Tab 分隔的文本格式，每行对应一条数据行，以 '#' 开头的行为注释行。
 * 每行的解析由对应 DataRowBase 子类的 parseDataRow() 负责。
 *
 * 文件格式示例（列之间用 \t 分隔）：
 *   # Id  Name   Hp   Attack
 *   1001  Slime  100  10
 *   1002  Goblin 200  25
 */
@ccclass('DefaultDataTableHelper')
export class DefaultDataTableHelper extends DataTableHelperBase {
    parseData<T extends IDataRow>(dataTable: IDataTable<T>, dataTableString: string, userData?: any): boolean {
        const lines = dataTableString.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.charAt(0) === '#') continue;
            if (!dataTable.addDataRow(trimmed, userData)) return false;
        }
        return true;
    }

    releaseDataAsset<T extends IDataRow>(_dataTable: IDataTable<T>, _dataTableAsset: object): void {
        // Cocos Creator 通过 ResourceManager.releaseAsset 统一释放，此处无需额外操作。
    }
}
