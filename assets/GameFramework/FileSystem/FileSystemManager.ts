import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { FileSystemAccess } from './FileSystemAccess';
import { IFileSystem } from './IFileSystem';
import { IFileSystemManager } from './IFileSystemManager';
import { IFileSystemHelper } from './IFileSystemHelper';
import { FileSystem } from './FileSystem';

/**
 * 文件系统管理器。
 *
 * 管理多个并行开放的虚拟文件系统实例，每个实例对应存储中的一个物理文件。
 * 通过 setFileSystemHelper() 注入平台相关的流实现。
 */
export class FileSystemManager extends GameFrameworkModule implements IFileSystemManager {
    private _helper: IFileSystemHelper | null = null;
    private readonly _fileSystems: Map<string, FileSystem> = new Map();

    get priority(): number { return 0; }

    get count(): number { return this._fileSystems.size; }

    setFileSystemHelper(helper: IFileSystemHelper): void {
        this._helper = helper;
    }

    hasFileSystem(fullPath: string): boolean {
        return this._fileSystems.has(fullPath);
    }

    getFileSystem(fullPath: string): IFileSystem | null {
        return this._fileSystems.get(fullPath) ?? null;
    }

    createFileSystem(
        fullPath: string,
        access: FileSystemAccess,
        maxFileCount: number,
        maxBlockCount: number,
    ): IFileSystem {
        this._assertHelper();
        if (access === FileSystemAccess.Unspecified) {
            throw new GameFrameworkError('[FileSystemManager] Access cannot be Unspecified.');
        }
        if (this._fileSystems.has(fullPath)) {
            throw new GameFrameworkError(`[FileSystemManager] File system already exists: ${fullPath}`);
        }
        const stream = this._helper!.createFileSystemStream(fullPath, access, true);
        const fs = FileSystem.create(fullPath, access, stream, maxFileCount, maxBlockCount);
        this._fileSystems.set(fullPath, fs);
        return fs;
    }

    loadFileSystem(fullPath: string, access: FileSystemAccess): IFileSystem {
        this._assertHelper();
        if (access === FileSystemAccess.Unspecified) {
            throw new GameFrameworkError('[FileSystemManager] Access cannot be Unspecified.');
        }
        if (this._fileSystems.has(fullPath)) {
            throw new GameFrameworkError(`[FileSystemManager] File system already open: ${fullPath}`);
        }
        const stream = this._helper!.createFileSystemStream(fullPath, access, false);
        const fs = FileSystem.load(fullPath, access, stream);
        this._fileSystems.set(fullPath, fs);
        return fs;
    }

    destroyFileSystem(fileSystem: IFileSystem, deletePhysicalFile: boolean): void {
        const fs = this._fileSystems.get(fileSystem.fullPath);
        if (!fs) return;
        fs.shutdown();
        this._fileSystems.delete(fileSystem.fullPath);
        if (deletePhysicalFile) {
            console.warn(`[FileSystemManager] Physical file deletion for '${fileSystem.fullPath}' must be handled by the platform helper.`);
        }
    }

    getAllFileSystems(): IFileSystem[] {
        return [...this._fileSystems.values()];
    }

    // ---- GameFrameworkModule 生命周期 ----

    update(_elapseSeconds: number, _realElapseSeconds: number): void {}

    shutdown(): void {
        this._fileSystems.forEach(fs => fs.shutdown());
        this._fileSystems.clear();
        this._helper = null;
    }

    private _assertHelper(): void {
        if (!this._helper) {
            throw new GameFrameworkError('[FileSystemManager] File system helper is not set.');
        }
    }
}
