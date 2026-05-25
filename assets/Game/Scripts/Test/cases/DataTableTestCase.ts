import { ITestCase, ITestItem } from '../TestCase';
import { GameEntry } from '../../Base/GameEntry';
import { DREntity } from '../../DataTable/DREntity';

export class DataTableTestCase implements ITestCase {
    readonly name = 'DataTable 系统';

    readonly items: ITestItem[] = [
        {
            label: 'DataTableComponent 已初始化',
            run: async () => {
                if (!GameEntry.DataTable) throw new Error('DataTableComponent 未初始化');
            },
        },
        {
            label: 'Entity 表已加载且行数 > 0',
            run: async () => {
                if (!GameEntry.DataTable) throw new Error('DataTableComponent 未初始化');
                const table = GameEntry.DataTable.getDataTable(DREntity);
                if (!table) throw new Error('Entity 数据表未找到，请确保已完成 ProcedurePreload');
                if (table.count === 0) throw new Error('Entity 数据表为空');
            },
        },
        {
            label: '按 ID 获取 Entity 行',
            run: async () => {
                if (!GameEntry.DataTable) throw new Error('DataTableComponent 未初始化');
                const table = GameEntry.DataTable.getDataTable(DREntity);
                if (!table) throw new Error('Entity 数据表未找到，请确保已完成 ProcedurePreload');
                const firstRow = table.minIdDataRow;
                if (!firstRow) throw new Error('数据表没有任何行');
                const found = table.getDataRow(firstRow.id);
                if (!found) throw new Error(`通过 id=${firstRow.id} 未能查到行`);
                if (found.id !== firstRow.id) throw new Error('返回行 id 不一致');
            },
        },
        {
            label: '查询不存在的 ID 返回 null',
            run: async () => {
                if (!GameEntry.DataTable) throw new Error('DataTableComponent 未初始化');
                const table = GameEntry.DataTable.getDataTable(DREntity);
                if (!table) throw new Error('Entity 数据表未找到，请确保已完成 ProcedurePreload');
                const notFound = table.getDataRow(-999999);
                if (notFound !== null) throw new Error('期望返回 null，但找到了行');
            },
        },
    ];
}
