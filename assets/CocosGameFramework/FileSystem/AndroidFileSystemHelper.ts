import { sys, _decorator } from 'cc';
import { FileSystemAccess } from '../../GameFramework/FileSystem/FileSystemAccess';
import { FileSystemStream, SeekOrigin } from '../../GameFramework/FileSystem/FileSystemStream';
import { FileSystemHelperBase } from './FileSystemHelperBase';

const { ccclass } = _decorator;

/**
 * Android APK 内建资产流（只读）。
 *
 * 用于访问 APK 压缩包内的文件（assets/ 目录），对应 UnityGameFramework 的
 * AndroidFileSystemStream。在运行时通过 jsb 调用 Android AssetManager，
 * 无需解压即可随机读取字节偏移。
 *
 * 注意：APK 内资产仅支持读取（FileSystemAccess.Read）。
 */
class AndroidAssetFileSystemStream extends FileSystemStream {
    private _buffer: Uint8Array;
    private _pos: number = 0;

    constructor(apkPath: string) {
        super();
        // jsb.fileUtils 在 Android 上支持 jar:file:// 路径直接读取
        const data = (globalThis as any).jsb?.fileUtils?.getDataFromFile(apkPath) as Uint8Array | null;
        if (!data) throw new Error(`[AndroidAssetFileSystemStream] Cannot read: ${apkPath}`);
        this._buffer = data;
    }

    get position(): number  { return this._pos; }
    set position(v: number) { this._pos = Math.max(0, Math.min(v, this._buffer.length)); }

    get length(): number { return this._buffer.length; }

    setLength(_length: number): void {
        throw new Error('[AndroidAssetFileSystemStream] APK assets are read-only.');
    }

    seek(offset: number, origin: SeekOrigin): number {
        switch (origin) {
            case SeekOrigin.Begin:   this._pos = offset; break;
            case SeekOrigin.Current: this._pos += offset; break;
            case SeekOrigin.End:     this._pos = this._buffer.length + offset; break;
        }
        this._pos = Math.max(0, Math.min(this._pos, this._buffer.length));
        return this._pos;
    }

    readByte(): number {
        return this._pos < this._buffer.length ? this._buffer[this._pos++] : -1;
    }

    read(buffer: Uint8Array, offset: number, count: number): number {
        const available = this._buffer.length - this._pos;
        const toRead    = Math.min(count, available);
        buffer.set(this._buffer.subarray(this._pos, this._pos + toRead), offset);
        this._pos += toRead;
        return toRead;
    }

    writeByte(_value: number): void {
        throw new Error('[AndroidAssetFileSystemStream] APK assets are read-only.');
    }

    write(_buffer: Uint8Array, _offset: number, _count: number): void {
        throw new Error('[AndroidAssetFileSystemStream] APK assets are read-only.');
    }

    flush(): void {}

    close(): void {}
}

/**
 * Android 文件系统辅助器。
 *
 * 路由规则：
 *  - 路径以 "jar:" 开头（APK 内建资产）→ AndroidAssetFileSystemStream（只读）
 *  - 其他路径（持久化目录）            → DefaultFileSystemHelper 的 NativeFileSystemStream
 *
 * 使用方式：将此组件挂载到节点，并拖入 FileSystemComponent.fileSystemHelper 属性。
 * 仅在 Android 平台有意义，其他平台建议使用 DefaultFileSystemHelper。
 */
@ccclass('AndroidFileSystemHelper')
export class AndroidFileSystemHelper extends FileSystemHelperBase {
    createFileSystemStream(
        fullPath: string,
        access: FileSystemAccess,
        createNew: boolean,
    ): FileSystemStream {
        if (!sys.isNative || sys.os !== sys.OS.ANDROID) {
            throw new Error('[AndroidFileSystemHelper] Must run on Android native platform.');
        }

        // APK 内建资产只能只读访问
        if (fullPath.startsWith('jar:')) {
            if (access !== FileSystemAccess.Read) {
                throw new Error(`[AndroidFileSystemHelper] APK assets are read-only: ${fullPath}`);
            }
            return new AndroidAssetFileSystemStream(fullPath);
        }

        // 持久化目录使用 jsb 原生文件 API（与 DefaultFileSystemHelper 的 NativeFileSystemStream 相同逻辑）
        const writable = access !== FileSystemAccess.Read;
        const fileUtils = (globalThis as any).jsb?.fileUtils;
        if (!fileUtils) throw new Error('[AndroidFileSystemHelper] jsb.fileUtils not available.');

        return this._createNativeStream(fileUtils, fullPath, writable, createNew);
    }

    private _createNativeStream(fileUtils: any, path: string, writable: boolean, createNew: boolean): FileSystemStream {
        // 委托给内联的精简版 NativeFileSystemStream（避免跨文件依赖 DefaultFileSystemHelper 内部类）
        return new AndroidNativeFileSystemStream(fileUtils, path, writable, createNew);
    }
}

// ---- 精简 Native 流（Android 持久化目录） ----

class AndroidNativeFileSystemStream extends FileSystemStream {
    private readonly _fileUtils: any;
    private _fd: number;
    private _pos: number = 0;
    private _len: number = 0;

    constructor(fileUtils: any, path: string, writable: boolean, createNew: boolean) {
        super();
        this._fileUtils = fileUtils;
        const mode  = writable ? (createNew ? 'wb+' : 'rb+') : 'rb';
        this._fd    = fileUtils.openFile(path, mode);
        if (!this._fd) throw new Error(`[AndroidNativeFileSystemStream] Failed to open: ${path}`);
        this._len   = (fileUtils.getFileSize(path) as number) ?? 0;
    }

    get position(): number { return this._pos; }
    set position(v: number) {
        this._fileUtils.seekFile(this._fd, v, 0);
        this._pos = v;
    }

    get length(): number { return this._len; }

    setLength(length: number): void {
        this._fileUtils.truncateFile(this._fd, length);
        this._len = length;
    }

    seek(offset: number, origin: SeekOrigin): number {
        this._fileUtils.seekFile(this._fd, offset, origin);
        this._pos = this._fileUtils.tellFile(this._fd) as number;
        return this._pos;
    }

    readByte(): number {
        const buf = new Uint8Array(1);
        return this.read(buf, 0, 1) > 0 ? buf[0] : -1;
    }

    read(buffer: Uint8Array, offset: number, count: number): number {
        const n = (this._fileUtils.readFile(this._fd, buffer, offset, count) as number) ?? 0;
        this._pos += n;
        return n;
    }

    writeByte(value: number): void {
        const buf = new Uint8Array([value]);
        this.write(buf, 0, 1);
    }

    write(buffer: Uint8Array, offset: number, count: number): void {
        this._fileUtils.writeFile(this._fd, buffer, offset, count);
        this._pos += count;
        if (this._pos > this._len) this._len = this._pos;
    }

    flush(): void { this._fileUtils.flushFile(this._fd); }

    close(): void {
        this.flush();
        this._fileUtils.closeFile(this._fd);
    }
}
