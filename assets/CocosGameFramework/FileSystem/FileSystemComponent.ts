import { _decorator } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { FileSystemManager } from '../../GameFramework/FileSystem/FileSystemManager';
import { FileSystemAccess } from '../../GameFramework/FileSystem/FileSystemAccess';
import { IFileSystem } from '../../GameFramework/FileSystem/IFileSystem';
import { FileSystemHelperBase } from './FileSystemHelperBase';
import { DefaultFileSystemHelper } from './DefaultFileSystemHelper';

const { ccclass, property } = _decorator;

@ccclass('FileSystemComponent')
export class FileSystemComponent extends GameFrameworkComponent {
    @property({
        type: FileSystemHelperBase,
        tooltip: '文件系统辅助器，留空则自动使用 DefaultFileSystemHelper',
    })
    fileSystemHelper: FileSystemHelperBase | null = null;

    private _manager!: FileSystemManager;

    get manager(): FileSystemManager { return this._manager; }

    onLoad(): void {
        super.onLoad();
        this._manager = new FileSystemManager();

        const helper = this.fileSystemHelper ?? this.node.addComponent(DefaultFileSystemHelper);
        this._manager.setFileSystemHelper(helper);

        GameFrameworkEntry.registerModule(MODULE_ID.FILESYSTEM, this._manager);
    }

    // ---- 代理方法 ----

    get fileSystemCount(): number { return this._manager.count; }

    hasFileSystem(fullPath: string): boolean {
        return this._manager.hasFileSystem(fullPath);
    }

    getFileSystem(fullPath: string): IFileSystem | null {
        return this._manager.getFileSystem(fullPath);
    }

    createFileSystem(
        fullPath: string,
        access: FileSystemAccess,
        maxFileCount: number,
        maxBlockCount: number,
    ): IFileSystem {
        return this._manager.createFileSystem(fullPath, access, maxFileCount, maxBlockCount);
    }

    loadFileSystem(fullPath: string, access: FileSystemAccess): IFileSystem {
        return this._manager.loadFileSystem(fullPath, access);
    }

    destroyFileSystem(fileSystem: IFileSystem, deletePhysicalFile = false): void {
        this._manager.destroyFileSystem(fileSystem, deletePhysicalFile);
    }

    getAllFileSystems(): IFileSystem[] {
        return this._manager.getAllFileSystems();
    }
}
