import { ILocalizationManager } from './ILocalizationManager';

/**
 * 本地化辅助器接口。
 *
 * 负责将原始数据（文本字符串或字节数组）解析为键值对并写入本地化管理器。
 * 通过替换辅助器实现可以支持不同的字典格式（JSON、Tab 分隔、二进制等）。
 */
export interface ILocalizationHelper {
    /** 获取系统语言标签（如 'zh-CN'、'en-US'）。 */
    readonly systemLanguage: string;

    /**
     * 解析文本格式的字典数据，将键值对写入本地化管理器。
     * @param localizationManager 目标本地化管理器
     * @param dictionaryString    原始文本内容
     * @param userData            透传用户数据
     */
    parseData(localizationManager: ILocalizationManager, dictionaryString: string, userData?: any): boolean;

    /**
     * 解析二进制格式的字典数据，将键值对写入本地化管理器。
     * @param localizationManager 目标本地化管理器
     * @param dictionaryBytes     原始字节数据
     * @param userData            透传用户数据
     */
    parseDataFromBytes(localizationManager: ILocalizationManager, dictionaryBytes: ArrayBuffer, userData?: any): boolean;

    /**
     * 释放字典资产。
     * @param localizationManager 拥有该资产的本地化管理器
     * @param dictionaryAsset     待释放资产对象
     */
    releaseDataAsset(localizationManager: ILocalizationManager, dictionaryAsset: object): void;
}
