import { IConfigHelper } from './IConfigHelper';

export interface IConfigManager {
    readonly count: number;

    setConfigHelper(helper: IConfigHelper): void;

    /**
     * 直接从字符串内容解析配置（由 Helper 实现具体格式）。
     */
    parseData(configString: string, userData?: any): boolean;

    hasConfig(configName: string): boolean;

    addConfig(configName: string, configValue: string): boolean;
    removeConfig(configName: string): boolean;
    removeAllConfigs(): void;

    getBool(configName: string, defaultValue?: boolean): boolean;
    getInt(configName: string, defaultValue?: number): number;
    getFloat(configName: string, defaultValue?: number): number;
    getString(configName: string, defaultValue?: string): string;
}
