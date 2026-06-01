import { FileSystemAccess } from './FileSystemAccess';
import { FileInfo } from './FileInfo';

/**
 * 文件系统接口。
 *
 * 每个文件系统对应磁盘/持久化存储中的一个物理文件，内部使用块（Block）管理多个逻辑文件。
 */
export interface IFileSystem {
    readonly fullPath: string;
    readonly access: FileSystemAccess;
    readonly fileCount: number;
    readonly maxFileCount: number;

    // ---- 查询 ----

    hasFile(name: string): boolean;
    getFileInfo(name: string): FileInfo;
    getAllFileInfos(): FileInfo[];

    // ---- 读取整文件 ----

    readFile(name: string): Uint8Array | null;
    readFileToBuffer(name: string, buffer: Uint8Array, startIndex?: number, length?: number): number;

    // ---- 读取文件片段 ----

    readFileSegment(name: string, offset: number, length: number): Uint8Array | null;
    readFileSegmentToBuffer(name: string, offset: number, buffer: Uint8Array, startIndex?: number, length?: number): number;

    // ---- 写入 ----

    writeFile(name: string, buffer: Uint8Array, startIndex?: number, length?: number): boolean;

    // ---- 文件管理 ----

    renameFile(oldName: string, newName: string): boolean;
    deleteFile(name: string): boolean;
}
