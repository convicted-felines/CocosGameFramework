/**
 * Extensions for reading/writing 7-bit encoded integers and encrypted strings,
 * ported from UnityGameFramework BinaryExtension.cs.
 *
 * These operate on a raw byte buffer with a position cursor rather than BinaryReader/Writer,
 * which doesn't exist in JavaScript.
 */
export class BinaryExtension {
    /** Read a 7-bit encoded variable-length Int32 from buf at pos; advances pos. */
    static read7BitEncodedInt32(buf: Uint8Array, pos: { value: number }): number {
        let result = 0;
        let shift = 0;
        let b: number;
        do {
            if (shift >= 35) throw new RangeError('[BinaryExtension] Bad 7-bit encoded Int32.');
            b = buf[pos.value++];
            result |= (b & 0x7F) << shift;
            shift += 7;
        } while (b & 0x80);
        return result | 0;
    }

    /** Write a 7-bit encoded variable-length Int32 into buf at pos; advances pos. */
    static write7BitEncodedInt32(buf: Uint8Array, pos: { value: number }, value: number): void {
        let v = value >>> 0;
        while (v >= 0x80) {
            buf[pos.value++] = (v & 0x7F) | 0x80;
            v >>>= 7;
        }
        buf[pos.value++] = v;
    }

    /** Read a 7-bit encoded variable-length UInt32. */
    static read7BitEncodedUint32(buf: Uint8Array, pos: { value: number }): number {
        let result = 0;
        let shift = 0;
        let b: number;
        do {
            if (shift >= 35) throw new RangeError('[BinaryExtension] Bad 7-bit encoded Uint32.');
            b = buf[pos.value++];
            result = (result | ((b & 0x7F) << shift)) >>> 0;
            shift += 7;
        } while (b & 0x80);
        return result;
    }

    /** Write a 7-bit encoded variable-length UInt32. */
    static write7BitEncodedUint32(buf: Uint8Array, pos: { value: number }, value: number): void {
        let v = value >>> 0;
        while (v >= 0x80) {
            buf[pos.value++] = (v & 0x7F) | 0x80;
            v >>>= 7;
        }
        buf[pos.value++] = v;
    }

    /**
     * Read an encrypted string from buf at pos using the given XOR key.
     * Format: [7-bit encoded length][XOR-encrypted UTF-8 bytes]
     */
    static readEncryptedString(buf: Uint8Array, pos: { value: number }, key: Uint8Array): string | null {
        const length = this.read7BitEncodedInt32(buf, pos);
        if (length < 0) return null;
        if (length === 0) return '';
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = buf[pos.value + i] ^ key[i % key.length];
        }
        pos.value += length;
        return new TextDecoder().decode(bytes);
    }

    /**
     * Write an encrypted string into buf at pos using the given XOR key.
     * Format: [7-bit encoded length][XOR-encrypted UTF-8 bytes]
     */
    static writeEncryptedString(buf: Uint8Array, pos: { value: number }, value: string | null, key: Uint8Array): void {
        if (value === null) {
            this.write7BitEncodedInt32(buf, pos, -1);
            return;
        }
        const bytes = new TextEncoder().encode(value);
        this.write7BitEncodedInt32(buf, pos, bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            buf[pos.value++] = bytes[i] ^ key[i % key.length];
        }
    }
}
