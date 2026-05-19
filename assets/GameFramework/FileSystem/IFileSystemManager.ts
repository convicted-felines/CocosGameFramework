import { FileSystemAccess } from './FileSystemAccess';
import { IFileSystem } from './IFileSystem';

/**
 * 文件系统管理器接口。
 */
export interface IFileSystemManager {
    readonly count: number;

    setFileSystemHelper(helper: import('./IFileSystemHelper').IFileSystemHelper): void;

    hasFileSystem(fullPath: string): boolean;
    getFileSystem(fullPath: string): IFileSystem | null;

    createFileSystem(fullPath: string, access: FileSystemAccess, maxFileCount: number, maxBlockCount: number): IFileSystem;
    loadFileSystem(fullPath: string, access: FileSystemAccess): IFileSystem;
    destroyFileSystem(fileSystem: IFileSystem, deletePhysicalFile: boolean): void;

    getAllFileSystems(): IFileSystem[];
}
