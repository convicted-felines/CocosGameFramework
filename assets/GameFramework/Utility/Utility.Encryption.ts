export class UtilityEncryption {
    private static readonly _quickXorMaxLength = 220;

    /** XOR the first min(length, 220) bytes of data with key (in-place). */
    static getQuickXorBytes(data: Uint8Array, key: Uint8Array): void {
        const len = Math.min(data.length, key.length, this._quickXorMaxLength);
        for (let i = 0; i < len; i++) {
            data[i] ^= key[i];
        }
    }

    /** XOR each byte of data with the corresponding cycled key byte (in-place). */
    static getSelfXorBytes(data: Uint8Array, key: Uint8Array): void {
        if (key.length === 0) return;
        for (let i = 0; i < data.length; i++) {
            data[i] ^= key[i % key.length];
        }
    }

    /** XOR all bytes of data with the full key cycled, returns a new Uint8Array. */
    static getXorBytes(data: Uint8Array, key: Uint8Array, offset: number = 0, length: number = -1): Uint8Array {
        if (length < 0) length = data.length - offset;
        const result = new Uint8Array(length);
        if (key.length === 0) {
            result.set(data.subarray(offset, offset + length));
            return result;
        }
        for (let i = 0; i < length; i++) {
            result[i] = data[offset + i] ^ key[i % key.length];
        }
        return result;
    }
}
