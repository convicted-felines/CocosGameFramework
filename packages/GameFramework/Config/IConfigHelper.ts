export interface IConfigHelper {
    /**
     * 从文本解析配置，调用 addConfig 写入配置管理器。
     * @param configString 配置文件文本内容
     * @param userData     透传用户数据
     */
    parseData(configString: string, userData?: any): boolean;
}
