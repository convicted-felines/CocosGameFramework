/**
 * Byte-level type conversion utilities.
 * Uses DataView for correct endianness handling.
 */
export class UtilityConverter {
    private static readonly _view: DataView = new DataView(new ArrayBuffer(8));

    static get isLittleEndian(): boolean {
        const buf = new Uint16Array([1]);
        return new Uint8Array(buf.buffer)[0] === 1;
    }

    // ---- Encode (value → bytes) ----

    static getBytesFromBool(value: boolean): Uint8Array {
        return new Uint8Array([value ? 1 : 0]);
    }

    static getBytesFromInt16(value: number): Uint8Array {
        this._view.setInt16(0, value, true);
        return new Uint8Array(this._view.buffer.slice(0, 2));
    }

    static getBytesFromUint16(value: number): Uint8Array {
        this._view.setUint16(0, value, true);
        return new Uint8Array(this._view.buffer.slice(0, 2));
    }

    static getBytesFromInt32(value: number): Uint8Array {
        this._view.setInt32(0, value, true);
        return new Uint8Array(this._view.buffer.slice(0, 4));
    }

    static getBytesFromUint32(value: number): Uint8Array {
        this._view.setUint32(0, value, true);
        return new Uint8Array(this._view.buffer.slice(0, 4));
    }

    static getBytesFromFloat32(value: number): Uint8Array {
        this._view.setFloat32(0, value, true);
        return new Uint8Array(this._view.buffer.slice(0, 4));
    }

    static getBytesFromFloat64(value: number): Uint8Array {
        this._view.setFloat64(0, value, true);
        return new Uint8Array(this._view.buffer.slice(0, 8));
    }

    static getBytesFromString(value: string): Uint8Array {
        const encoder = new TextEncoder();
        return encoder.encode(value);
    }

    // ---- Decode (bytes → value) ----

    static getBool(data: Uint8Array, offset: number = 0): boolean {
        return data[offset] !== 0;
    }

    static getInt16(data: Uint8Array, offset: number = 0): number {
        return (data[offset] | (data[offset + 1] << 8)) << 16 >> 16;
    }

    static getUint16(data: Uint8Array, offset: number = 0): number {
        return (data[offset] | (data[offset + 1] << 8)) & 0xFFFF;
    }

    static getInt32(data: Uint8Array, offset: number = 0): number {
        return (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24));
    }

    static getUint32(data: Uint8Array, offset: number = 0): number {
        return this.getInt32(data, offset) >>> 0;
    }

    static getFloat32(data: Uint8Array, offset: number = 0): number {
        const view = new DataView(data.buffer, data.byteOffset + offset, 4);
        return view.getFloat32(0, true);
    }

    static getFloat64(data: Uint8Array, offset: number = 0): number {
        const view = new DataView(data.buffer, data.byteOffset + offset, 8);
        return view.getFloat64(0, true);
    }

    static getString(data: Uint8Array, offset: number = 0, length: number = -1): string {
        const slice = length < 0 ? data.subarray(offset) : data.subarray(offset, offset + length);
        return new TextDecoder().decode(slice);
    }
}
