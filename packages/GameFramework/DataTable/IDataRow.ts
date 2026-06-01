export interface IDataRow {
    readonly id: number;

    // 解析数据表行字符串（原始一行文本，含 tab/逗号分隔），userData 可传入辅助数据
    parseDataRow(dataRowString: string, userData?: any): boolean;
}
