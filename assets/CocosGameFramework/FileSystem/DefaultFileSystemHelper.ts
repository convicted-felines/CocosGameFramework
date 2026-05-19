import { sys, _decorator } from 'cc';
import { FileSystemAccess } from '../../GameFramework/FileSystem/FileSystemAccess';
import { FileSystemStream, SeekOrigin } from '../../GameFramework/FileSystem/FileSystemStream';
import { FileSystemHelperBase } from './FileSystemHelperBase';

const { ccclass } = _decorator;

// ---- Web 实现：内存 + LocalStorage（小文件/原型用；大文件请换 IndexedDB） ----

class WebFileSystemStream extends FileSystemStream {
    private _data: Uint8Array;
    private _pos: number = 0;
    private readonly _key: string;
    private readonly _writable: boolean;

    constructor(key: string, writable: boolean, initialData?: Uint8Array) {
        super();
        this._key      = key;
        this._writable = writable;
        this._data     = initialData ? initialData.slice() : new Uint8Array(0);
    }

    get position(): number { return this._pos; }
    set position(v: number) { this._pos = Math.max(0, Math.min(v, this._data.length)); }

    get length(): number { return this._data.length; }

    setLength(length: number): void {
        const next = new Uint8Array(length);
        next.set(this._data.subarray(0, Math.min(length, this._data.length)));
        this._data = next;
    }

    seek(offset: number, origin: SeekOrigin): number {
        switch (origin) {
            case SeekOrigin.Begin:   this._pos = offset; break;
            case SeekOrigin.Current: this._pos += offset; break;
            case SeekOrigin.End:     this._pos = this._data.length + offset; break;
        }
        this._pos = Math.max(0, Math.min(this._pos, this._data.length));
        return this._pos;
    }

    readByte(): number {
        if (this._pos >= this._data.length) return -1;
        return this._data[this._pos++];
    }

    read(buffer: Uint8Array, offset: number, count: number): number {
        const available = this._data.length - this._pos;
        const toRead    = Math.min(count, available);
        buffer.set(this._data.subarray(this._pos, this._pos + toRead), offset);
        this._pos += toRead;
        return toRead;
    }

    writeByte(value: number): void {
        this._ensureCapacity(this._pos + 1);
        this._data[this._pos++] = value;
    }

    write(buffer: Uint8Array, offset: number, count: number): void {
        this._ensureCapacity(this._pos + count);
        this._data.set(buffer.subarray(offset, offset + count), this._pos);
        this._pos += count;
    }

    flush(): void {
        if (!this._writable) return;
        // 持久化到 LocalStorage（base64 编码）
        try {
            const bin  = String.fromCharCode(...this._data);
            localStorage.setItem(this._key, btoa(bin));
        } catch (e) {
            console.warn('[WebFileSystemStream] flush failed:', e);
        }
    }

    close(): void {
        this.flush();
    }

    private _ensureCapacity(needed: number): void {
        if (needed <= this._data.length) return;
        const grown = new Uint8Array(Math.max(needed, this._data.length * 2));
        grown.set(this._data);
        this._data = grown;
    }
}

// ---- Native (JSB) 实现 ----

class NativeFileSystemStream extends FileSystemStream {
    private _fd: number;
    private _pos: number = 0;
    private _len: number = 0;
    private readonly _writable: boolean;
    private readonly _path: string;

    constructor(path: string, writable: boolean, createNew: boolean) {
        super();
        this._path     = path;
        this._writable = writable;

        // jsb.fileUtils provides low-level file access on native
        const fileUtils = (globalThis as any).jsb?.fileUtils;
        if (!fileUtils) throw new Error('[NativeFileSystemStream] jsb.fileUtils not available.');

        const mode = writable ? (createNew ? 'wb+' : 'rb+') : 'rb';
        this._fd  = fileUtils.openFile(path, mode);
        if (!this._fd) throw new Error(`[NativeFileSystemStream] Failed to open: ${path}`);

        this._len = fileUtils.getFileSize(path) as number ?? 0;
    }

    get position(): number { return this._pos; }
    set position(v: number) {
        const utils = (globalThis as any).jsb.fileUtils;
        utils.seekFile(this._fd, v, 0 /* SEEK_SET */);
        this._pos = v;
    }

    get length(): number { return this._len; }

    setLength(length: number): void {
        (globalThis as any).jsb.fileUtils.truncateFile(this._fd, length);
        this._len = length;
    }

    seek(offset: number, origin: SeekOrigin): number {
        const utils = (globalThis as any).jsb.fileUtils;
        utils.seekFile(this._fd, offset, origin);
        this._pos = utils.tellFile(this._fd) as number;
        return this._pos;
    }

    readByte(): number {
        const buf = new Uint8Array(1);
        const n   = this.read(buf, 0, 1);
        return n > 0 ? buf[0] : -1;
    }

    read(buffer: Uint8Array, offset: number, count: number): number {
        const n = (globalThis as any).jsb.fileUtils.readFile(this._fd, buffer, offset, count) as number;
        this._pos += n;
        return n;
    }

    writeByte(value: number): void {
        const buf = new Uint8Array([value]);
        this.write(buf, 0, 1);
    }

    write(buffer: Uint8Array, offset: number, count: number): void {
        (globalThis as any).jsb.fileUtils.writeFile(this._fd, buffer, offset, count);
        this._pos += count;
        if (this._pos > this._len) this._len = this._pos;
    }

    flush(): void {
        (globalThis as any).jsb.fileUtils.flushFile(this._fd);
    }

    close(): void {
        this.flush();
        (globalThis as any).jsb.fileUtils.closeFile(this._fd);
    }
}

// ---- 辅助器 ----

@ccclass('DefaultFileSystemHelper')
export class DefaultFileSystemHelper extends FileSystemHelperBase {
    createFileSystemStream(
        fullPath: string,
        access: FileSystemAccess,
        createNew: boolean,
    ): FileSystemStream {
        const writable = access !== FileSystemAccess.Read;

        if (sys.isNative) {
            return new NativeFileSystemStream(fullPath, writable, createNew);
        }

        // Web：从 LocalStorage 还原已有数据
        let initial: Uint8Array | undefined;
        if (!createNew) {
            try {
                const stored = localStorage.getItem(fullPath);
                if (stored) {
                    const bin = atob(stored);
                    initial   = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++) initial[i] = bin.charCodeAt(i);
                }
            } catch { /* 忽略 */ }
        }
        return new WebFileSystemStream(fullPath, writable, initial);
    }
}
