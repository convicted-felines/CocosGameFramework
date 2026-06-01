import { FileSystemAccess } from './FileSystemAccess';
import { FileSystemStream } from './FileSystemStream';

/**
 * 文件系统辅助器接口。
 *
 * 负责根据路径和访问模式创建底层流，实现平台解耦。
 */
export interface IFileSystemHelper {
    /**
     * 创建文件系统底层流。
     * @param fullPath  文件系统物理路径
     * @param access    访问权限
     * @param createNew 是否强制新建（true = 覆盖已有文件）
     */
    createFileSystemStream(
        fullPath: string,
        access: FileSystemAccess,
        createNew: boolean,
    ): FileSystemStream;
}
