import { FileSystemAccess } from './FileSystemAccess';

/**
 * 文件系统流抽象基类。
 *
 * 平台辅助器负责实例化具体子类（Web 用 IndexedDB / File API，Android 用 AssetManager 等）。
 * FileSystem 核心只依赖此接口读写底层字节流。
 */
export abstract class FileSystemStream {
    abstract get position(): number;
    abstract set position(value: number);

    abstract get length(): number;

    abstract setLength(length: number): void;

    abstract seek(offset: number, origin: SeekOrigin): number;

    abstract readByte(): number;

    /** 从当前位置读取最多 count 字节到 buffer[offset..] 并返回实际读到的字节数。 */
    abstract read(buffer: Uint8Array, offset: number, count: number): number;

    abstract writeByte(value: number): void;

    abstract write(buffer: Uint8Array, offset: number, count: number): void;

    abstract flush(): void;

    abstract close(): void;

    /** 将 count 字节从当前流拷贝到目标流，返回实际拷贝字节数。 */
    copyTo(dst: FileSystemStream, count: number): number {
        const buf = new Uint8Array(Math.min(count, 4096));
        let remaining = count;
        let total = 0;
        while (remaining > 0) {
            const toRead = Math.min(remaining, buf.length);
            const read = this.read(buf, 0, toRead);
            if (read <= 0) break;
            dst.write(buf, 0, read);
            remaining -= read;
            total += read;
        }
        return total;
    }
}

export const enum SeekOrigin {
    Begin   = 0,
    Current = 1,
    End     = 2,
}
