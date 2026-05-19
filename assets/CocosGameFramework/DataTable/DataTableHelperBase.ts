import { Component, _decorator } from 'cc';
import { IDataTableHelper } from '../../GameFramework/DataTable/IDataTableHelper';
import { IDataTable } from '../../GameFramework/DataTable/IDataTable';
import { IDataRow } from '../../GameFramework/DataTable/IDataRow';

const { ccclass } = _decorator;

/**
 * 数据表辅助器基类。
 *
 * 继承此类并实现抽象方法，即可替换数据表的文本解析策略（如 Tab 分隔、CSV、JSON 等）。
 * 将具体实现组件挂载到场景节点后，在 DataTableComponent 的 dataTableHelper 属性处拖入该节点。
 */
@ccclass('DataTableHelperBase')
export abstract class DataTableHelperBase extends Component implements IDataTableHelper {
    abstract parseData<T extends IDataRow>(dataTable: IDataTable<T>, dataTableString: string, userData?: any): boolean;

    abstract releaseDataAsset<T extends IDataRow>(dataTable: IDataTable<T>, dataTableAsset: object): void;
}
