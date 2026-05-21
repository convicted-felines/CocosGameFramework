import { Enum } from 'cc';

/**
 * 下载代理辅助器类型枚举。
 * 新增辅助器时：
 *   1. 实现 DownloadAgentHelperBase 子类，并在文件末尾调用 HelperRegistry.register('MyHelper', MyHelper)
 *   2. 在此处添加枚举项，枚举名必须与 HelperRegistry.register 第一个参数完全一致
 *   3. Inspector 下拉即可选择
 */
export enum DownloadAgentHelperType {
    DefaultDownloadAgentHelper = 0,
}

Enum(DownloadAgentHelperType);
