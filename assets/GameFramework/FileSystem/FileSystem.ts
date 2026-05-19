import { FileSystemAccess } from './FileSystemAccess';
import { FileSystemStream, SeekOrigin } from './FileSystemStream';
import { IFileSystem } from './IFileSystem';
import { FileInfo, makeFileInfo, INVALID_FILE_INFO } from './FileInfo';

// ---- 内部常量 ----

const CLUSTER_SIZE   = 4096;
const HEADER_MAGIC   = [0x47, 0x46, 0x46]; // 'G','F','F'
const HEADER_VERSION = 1;

// Header 布局（字节）
// [0-2]  magic(3) [3] version(1) [4-7] encryptKey(4)
// [8-11] maxFileCount(int32) [12-15] maxBlockCount(int32) [16-19] blockCount(int32)
const HEADER_SIZE       = 20;
const BLOCK_RECORD_SIZE = 12;  // stringIndex(4) + clusterIndex(4) + length(4)
const STRING_RECORD_SIZE = 256; // 1 len byte + 255 data bytes

// ---- 内部数据结构 ----

interface BlockData {
    stringIndex: number; // -1 = 空闲块
    clusterIndex: number;
    length: number;
}

interface StringData {
    length: number;
    bytes: Uint8Array; // 255 字节存储空间（加密后）
}

// ---- 主实现 ----

export class FileSystem implements IFileSystem {
    private readonly _fullPath: string;
    private readonly _access: FileSystemAccess;
    private readonly _stream: FileSystemStream;
    private readonly _encryptKey: Uint8Array; // 4 字节

    private _maxFileCount: number;
    private _maxBlockCount: number;

    /** blockIndex → BlockData */
    private readonly _blocks: BlockData[] = [];
    /** filename → blockIndex */
    private readonly _fileMap: Map<string, number> = new Map();
    /** 按 length 分组的空闲块索引 */
    private readonly _freeBlocks: Map<number, number[]> = new Map();
    /** blockIndex → filename（反向查询） */
    private readonly _stringMap: Map<number, string> = new Map();
    private _freeStringSlots: number[] = [];

    private constructor(
        fullPath: string,
        access: FileSystemAccess,
        stream: FileSystemStream,
        encryptKey: Uint8Array,
        maxFileCount: number,
        maxBlockCount: number,
    ) {
        this._fullPath     = fullPath;
        this._access       = access;
        this._stream       = stream;
        this._encryptKey   = encryptKey;
        this._maxFileCount = maxFileCount;
        this._maxBlockCount = maxBlockCount;
    }

    // ---- 工厂方法 ----

    static create(
        fullPath: string,
        access: FileSystemAccess,
        stream: FileSystemStream,
        maxFileCount: number,
        maxBlockCount: number,
    ): FileSystem {
        if (access === FileSystemAccess.Read) {
            throw new Error(`[FileSystem] Cannot create a read-only file system: ${fullPath}`);
        }
        if (maxFileCount <= 0 || maxBlockCount < maxFileCount) {
            throw new Error(`[FileSystem] Invalid maxFileCount(${maxFileCount}) or maxBlockCount(${maxBlockCount}).`);
        }

        const key = new Uint8Array(4);
        crypto.getRandomValues(key);

        const fs = new FileSystem(fullPath, access, stream, key, maxFileCount, maxBlockCount);
        fs._writeHeader(0);
        return fs;
    }

    static load(
        fullPath: string,
        access: FileSystemAccess,
        stream: FileSystemStream,
    ): FileSystem {
        stream.position = 0;
        const headerBuf = new Uint8Array(HEADER_SIZE);
        stream.read(headerBuf, 0, HEADER_SIZE);

        // 校验魔数
        if (headerBuf[0] !== HEADER_MAGIC[0] || headerBuf[1] !== HEADER_MAGIC[1] || headerBuf[2] !== HEADER_MAGIC[2]) {
            throw new Error(`[FileSystem] Invalid file system: ${fullPath}`);
        }
        if (headerBuf[3] !== HEADER_VERSION) {
            throw new Error(`[FileSystem] Unsupported version ${headerBuf[3]}: ${fullPath}`);
        }

        const key = headerBuf.slice(4, 8);
        const view = new DataView(headerBuf.buffer);
        const maxFileCount  = view.getInt32(8,  true);
        const maxBlockCount = view.getInt32(12, true);
        const blockCount    = view.getInt32(16, true);

        const fs = new FileSystem(fullPath, access, stream, key, maxFileCount, maxBlockCount);
        fs._loadBlocks(blockCount);
        return fs;
    }

    // ---- IFileSystem ----

    get fullPath():     string           { return this._fullPath; }
    get access():       FileSystemAccess { return this._access; }
    get fileCount():    number           { return this._fileMap.size; }
    get maxFileCount(): number           { return this._maxFileCount; }

    hasFile(name: string): boolean {
        return this._fileMap.has(name);
    }

    getFileInfo(name: string): FileInfo {
        const bi = this._fileMap.get(name);
        if (bi === undefined) return INVALID_FILE_INFO;
        const block = this._blocks[bi];
        const offset = this._clusterOffset(block.clusterIndex) + HEADER_SIZE;
        return makeFileInfo(name, offset, block.length);
    }

    getAllFileInfos(): FileInfo[] {
        const result: FileInfo[] = [];
        this._fileMap.forEach((bi, name) => {
            const block = this._blocks[bi];
            result.push(makeFileInfo(name, this._clusterOffset(block.clusterIndex) + HEADER_SIZE, block.length));
        });
        return result;
    }

    readFile(name: string): Uint8Array | null {
        const bi = this._fileMap.get(name);
        if (bi === undefined) return null;
        const block = this._blocks[bi];
        const buf = new Uint8Array(block.length);
        this._readBlockData(block, buf, 0, block.length);
        return buf;
    }

    readFileToBuffer(name: string, buffer: Uint8Array, startIndex = 0, length?: number): number {
        const bi = this._fileMap.get(name);
        if (bi === undefined) return 0;
        const block = this._blocks[bi];
        const toRead = Math.min(length ?? block.length, block.length, buffer.length - startIndex);
        return this._readBlockData(block, buffer, startIndex, toRead);
    }

    readFileSegment(name: string, offset: number, length: number): Uint8Array | null {
        const bi = this._fileMap.get(name);
        if (bi === undefined) return null;
        const block = this._blocks[bi];
        const safeOffset = Math.min(offset, block.length);
        const safeLen    = Math.min(length, block.length - safeOffset);
        const buf = new Uint8Array(safeLen);
        this._readBlockData(block, buf, 0, safeLen, safeOffset);
        return buf;
    }

    readFileSegmentToBuffer(name: string, offset: number, buffer: Uint8Array, startIndex = 0, length?: number): number {
        const bi = this._fileMap.get(name);
        if (bi === undefined) return 0;
        const block  = this._blocks[bi];
        const safeOffset = Math.min(offset, block.length);
        const maxLen     = block.length - safeOffset;
        const toRead     = Math.min(length ?? maxLen, maxLen, buffer.length - startIndex);
        return this._readBlockData(block, buffer, startIndex, toRead, safeOffset);
    }

    writeFile(name: string, buffer: Uint8Array, startIndex = 0, length?: number): boolean {
        this._assertWritable();
        if (!name) throw new Error('[FileSystem] File name is empty.');

        const dataLen = length ?? (buffer.length - startIndex);
        const existing = this._fileMap.get(name);

        if (existing !== undefined) {
            return this._overwriteBlock(existing, buffer, startIndex, dataLen);
        }

        if (this._fileMap.size >= this._maxFileCount) {
            console.warn(`[FileSystem] Max file count reached (${this._maxFileCount}).`);
            return false;
        }

        return this._allocateAndWrite(name, buffer, startIndex, dataLen);
    }

    renameFile(oldName: string, newName: string): boolean {
        this._assertWritable();
        if (!oldName || !newName) return false;
        const bi = this._fileMap.get(oldName);
        if (bi === undefined) return false;
        if (this._fileMap.has(newName)) return false;

        this._fileMap.delete(oldName);
        this._fileMap.set(newName, bi);
        this._stringMap.set(bi, newName);
        this._writeStringRecord(bi, newName);
        return true;
    }

    deleteFile(name: string): boolean {
        this._assertWritable();
        const bi = this._fileMap.get(name);
        if (bi === undefined) return false;

        const block = this._blocks[bi];
        this._fileMap.delete(name);
        this._stringMap.delete(bi);
        this._freeStringSlots.push(block.stringIndex);
        block.stringIndex = -1;
        this._addFreeBlock(bi, block.length);
        this._writeBlockRecord(bi);
        this._writeHeader(this._blocks.filter(b => b.stringIndex >= 0).length);
        return true;
    }

    shutdown(): void {
        this._stream.flush();
        this._stream.close();
    }

    // ---- 内部实现 ----

    private _assertWritable(): void {
        if (this._access === FileSystemAccess.Read) {
            throw new Error('[FileSystem] File system is read-only.');
        }
    }

    private _clusterOffset(clusterIndex: number): number {
        return HEADER_SIZE
            + this._maxBlockCount * BLOCK_RECORD_SIZE
            + this._maxFileCount  * STRING_RECORD_SIZE
            + clusterIndex * CLUSTER_SIZE;
    }

    private _readBlockData(block: BlockData, out: Uint8Array, outOffset: number, count: number, blockOffset = 0): number {
        const pos = this._clusterOffset(block.clusterIndex) + blockOffset;
        this._stream.position = pos;
        return this._stream.read(out, outOffset, count);
    }

    private _overwriteBlock(bi: number, buf: Uint8Array, startIndex: number, dataLen: number): boolean {
        const block = this._blocks[bi];
        const neededClusters = Math.ceil(dataLen / CLUSTER_SIZE);
        const currentClusters = Math.ceil(block.length / CLUSTER_SIZE);

        if (neededClusters > currentClusters) {
            // 需要更多空间：释放旧块，重新分配
            this._addFreeBlock(bi, block.length);
            block.stringIndex = -1; // 暂时标记为空闲
            return this._allocateAndWrite(this._fileMap.get('') ?? '', buf, startIndex, dataLen);
        }

        // 原地覆写
        block.length = dataLen;
        this._stream.position = this._clusterOffset(block.clusterIndex);
        this._stream.write(buf, startIndex, dataLen);
        this._writeBlockRecord(bi);
        return true;
    }

    private _allocateAndWrite(name: string, buf: Uint8Array, startIndex: number, dataLen: number): boolean {
        const clusterCount = Math.ceil(dataLen / CLUSTER_SIZE) || 1;
        const clusterBytes = clusterCount * CLUSTER_SIZE;

        // 尝试找足够大的空闲块
        let freeBi = this._findFreeBlock(clusterBytes);
        let clusterIndex: number;

        if (freeBi >= 0) {
            clusterIndex = this._blocks[freeBi].clusterIndex;
            this._removeFreeBlock(freeBi, this._blocks[freeBi].length);
        } else {
            // 追加到末尾
            clusterIndex = this._nextFreeCluster();
            freeBi = this._blocks.length;
            this._blocks.push({ stringIndex: -1, clusterIndex, length: 0 });
        }

        if (freeBi >= this._maxBlockCount) {
            console.warn('[FileSystem] Max block count reached.');
            return false;
        }

        // 分配字符串槽
        const stringIndex = this._freeStringSlots.pop() ?? this._usedStringCount();
        if (stringIndex >= this._maxFileCount) {
            console.warn('[FileSystem] Max string slot reached.');
            return false;
        }

        const block = this._blocks[freeBi];
        block.stringIndex  = stringIndex;
        block.clusterIndex = clusterIndex;
        block.length       = dataLen;

        this._fileMap.set(name, freeBi);
        this._stringMap.set(freeBi, name);

        // 写入数据
        this._stream.position = this._clusterOffset(clusterIndex);
        this._stream.write(buf, startIndex, dataLen);

        // 更新元数据
        this._writeBlockRecord(freeBi);
        this._writeStringRecord(freeBi, name);
        this._writeHeader(this._fileMap.size);
        return true;
    }

    private _findFreeBlock(minBytes: number): number {
        let bestBi   = -1;
        let bestSize = Infinity;
        this._freeBlocks.forEach((list, size) => {
            if (size >= minBytes && size < bestSize && list.length > 0) {
                bestSize = size;
                bestBi   = list[list.length - 1];
            }
        });
        return bestBi;
    }

    private _addFreeBlock(bi: number, length: number): void {
        if (!this._freeBlocks.has(length)) this._freeBlocks.set(length, []);
        this._freeBlocks.get(length)!.push(bi);
    }

    private _removeFreeBlock(bi: number, length: number): void {
        const list = this._freeBlocks.get(length);
        if (!list) return;
        const idx = list.lastIndexOf(bi);
        if (idx >= 0) list.splice(idx, 1);
    }

    private _nextFreeCluster(): number {
        let max = 0;
        for (const b of this._blocks) {
            const end = b.clusterIndex + Math.ceil((b.length || 1) / CLUSTER_SIZE);
            if (end > max) max = end;
        }
        return max;
    }

    private _usedStringCount(): number {
        let max = -1;
        this._blocks.forEach(b => { if (b.stringIndex > max) max = b.stringIndex; });
        return max + 1;
    }

    // ---- 序列化 / 反序列化 ----

    private _writeHeader(blockCount: number): void {
        this._stream.position = 0;
        const buf  = new Uint8Array(HEADER_SIZE);
        const view = new DataView(buf.buffer);
        buf[0] = HEADER_MAGIC[0]; buf[1] = HEADER_MAGIC[1]; buf[2] = HEADER_MAGIC[2];
        buf[3] = HEADER_VERSION;
        buf.set(this._encryptKey, 4);
        view.setInt32(8,  this._maxFileCount,  true);
        view.setInt32(12, this._maxBlockCount, true);
        view.setInt32(16, blockCount,          true);
        this._stream.write(buf, 0, HEADER_SIZE);
    }

    private _writeBlockRecord(bi: number): void {
        const offset = HEADER_SIZE + bi * BLOCK_RECORD_SIZE;
        this._stream.position = offset;
        const buf  = new Uint8Array(BLOCK_RECORD_SIZE);
        const view = new DataView(buf.buffer);
        const b    = this._blocks[bi];
        view.setInt32(0, b.stringIndex,  true);
        view.setInt32(4, b.clusterIndex, true);
        view.setInt32(8, b.length,       true);
        this._stream.write(buf, 0, BLOCK_RECORD_SIZE);
    }

    private _writeStringRecord(bi: number, name: string): void {
        const block  = this._blocks[bi];
        const si     = block.stringIndex;
        const offset = HEADER_SIZE + this._maxBlockCount * BLOCK_RECORD_SIZE + si * STRING_RECORD_SIZE;
        this._stream.position = offset;

        const encoded  = new TextEncoder().encode(name).slice(0, 255);
        const rec      = new Uint8Array(STRING_RECORD_SIZE);
        rec[0]         = encoded.length;
        for (let i = 0; i < encoded.length; i++) {
            rec[1 + i] = encoded[i] ^ this._encryptKey[i % 4];
        }
        this._stream.write(rec, 0, STRING_RECORD_SIZE);
    }

    private _loadBlocks(blockCount: number): void {
        const blockAreaOffset  = HEADER_SIZE;
        const stringAreaOffset = HEADER_SIZE + this._maxBlockCount * BLOCK_RECORD_SIZE;

        // 读取所有块记录
        this._stream.position = blockAreaOffset;
        const blockBuf  = new Uint8Array(blockCount * BLOCK_RECORD_SIZE);
        this._stream.read(blockBuf, 0, blockBuf.length);
        const blockView = new DataView(blockBuf.buffer);

        for (let i = 0; i < blockCount; i++) {
            const base = i * BLOCK_RECORD_SIZE;
            this._blocks.push({
                stringIndex:  blockView.getInt32(base + 0, true),
                clusterIndex: blockView.getInt32(base + 4, true),
                length:       blockView.getInt32(base + 8, true),
            });
        }

        // 读取字符串记录并建立映射
        this._stream.position = stringAreaOffset;
        const strBuf  = new Uint8Array(this._maxFileCount * STRING_RECORD_SIZE);
        this._stream.read(strBuf, 0, strBuf.length);

        for (let i = 0; i < blockCount; i++) {
            const b = this._blocks[i];
            if (b.stringIndex < 0) {
                this._addFreeBlock(i, b.length);
                continue;
            }
            const strBase  = b.stringIndex * STRING_RECORD_SIZE;
            const nameLen  = strBuf[strBase];
            const decoded  = new Uint8Array(nameLen);
            for (let j = 0; j < nameLen; j++) {
                decoded[j] = strBuf[strBase + 1 + j] ^ this._encryptKey[j % 4];
            }
            const name = new TextDecoder().decode(decoded);
            this._fileMap.set(name, i);
            this._stringMap.set(i, name);
        }
    }
}
