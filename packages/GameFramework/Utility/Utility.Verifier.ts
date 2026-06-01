export class UtilityVerifier {
    private static readonly _crc32Table: Uint32Array = UtilityVerifier._buildTable(0xEDB88320);
    private static _buffer: Uint8Array = new Uint8Array(4096);

    private static _buildTable(polynomial: number): Uint32Array {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (polynomial ^ (c >>> 1)) : (c >>> 1);
            }
            table[i] = c;
        }
        return table;
    }

    static getCrc32(data: Uint8Array, offset: number = 0, length: number = -1): number {
        if (length < 0) length = data.length - offset;
        let crc = 0xFFFFFFFF;
        const table = this._crc32Table;
        for (let i = offset; i < offset + length; i++) {
            crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
        }
        return ((crc ^ 0xFFFFFFFF) >>> 0);
    }

    static getCrc32FromStream(
        getBytes: (buf: Uint8Array) => number,
        xorKey?: Uint8Array
    ): number {
        let crc = 0xFFFFFFFF;
        const table = this._crc32Table;
        let read: number;
        while ((read = getBytes(this._buffer)) > 0) {
            for (let i = 0; i < read; i++) {
                const byte = xorKey ? (this._buffer[i] ^ xorKey[i % xorKey.length]) : this._buffer[i];
                crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
            }
        }
        return ((crc ^ 0xFFFFFFFF) >>> 0);
    }

    static getCrc32Bytes(crc32: number): Uint8Array {
        const result = new Uint8Array(4);
        result[0] = (crc32 >>> 24) & 0xFF;
        result[1] = (crc32 >>> 16) & 0xFF;
        result[2] = (crc32 >>> 8) & 0xFF;
        result[3] = crc32 & 0xFF;
        return result;
    }
}
