// 数据行接口，每个配置表的行数据类实现此接口
export interface IDataRow {
    readonly id: number;

    // 从数组数据（CSV 行解析后）初始化字段，返回是否成功
    parseFromRow(fields: string[]): boolean;

    // 也支持从 JSON 对象初始化
    parseFromJson(data: Record<string, any>): boolean;
}
