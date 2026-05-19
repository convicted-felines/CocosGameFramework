import { Component, _decorator } from 'cc';
import { IFileSystemHelper } from '../../GameFramework/FileSystem/IFileSystemHelper';
import { FileSystemAccess } from '../../GameFramework/FileSystem/FileSystemAccess';
import { FileSystemStream } from '../../GameFramework/FileSystem/FileSystemStream';

const { ccclass } = _decorator;

/**
 * 文件系统辅助器基类。
 *
 * 继承此类并实现 createFileSystemStream()，可替换底层 IO 策略。
 * 将具体实现组件挂载到节点后，在 FileSystemComponent 的 fileSystemHelper 属性处拖入即可。
 */
@ccclass('FileSystemHelperBase')
export abstract class FileSystemHelperBase extends Component implements IFileSystemHelper {
    abstract createFileSystemStream(
        fullPath: string,
        access: FileSystemAccess,
        createNew: boolean,
    ): FileSystemStream;
}
