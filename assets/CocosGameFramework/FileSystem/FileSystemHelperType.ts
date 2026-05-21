import { Enum } from 'cc';

/**
 * 文件系统辅助器类型枚举。
 * 新增辅助器时：
 *   1. 实现 FileSystemHelperBase 子类并在末尾调用 HelperRegistry.register('MyHelper', MyHelper)
 *   2. 在此处添加枚举项，枚举名必须与 HelperRegistry.register 的第一个参数完全一致
 *   3. Inspector 下拉即可选择
 */
export enum FileSystemHelperType {
    DefaultFileSystemHelper = 0,
    AndroidFileSystemHelper = 1,
}

Enum(FileSystemHelperType);
