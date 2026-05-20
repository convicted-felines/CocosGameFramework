/** 压缩辅助接口，对应原版 Utility.Compression.ICompressionHelper */
export interface ICompressionHelper {
    /**
     * 压缩数据。
     * @param bytes 待压缩的原始字节
     * @returns 压缩后的字节，失败时返回 null
     */
    compress(bytes: Uint8Array): Uint8Array | null;

    /**
     * 解压数据。
     * @param bytes 待解压的压缩字节
     * @returns 解压后的字节，失败时返回 null
     */
    decompress(bytes: Uint8Array): Uint8Array | null;
}

export class UtilityCompression {
    private static _helper: ICompressionHelper | null = null;

    static setCompressionHelper(helper: ICompressionHelper): void {
        this._helper = helper;
    }

    /**
     * 压缩数据。需先调用 setCompressionHelper 注入具体实现。
     */
    static compress(bytes: Uint8Array): Uint8Array {
        if (!this._helper) throw new Error('[Utility.Compression] Compression helper is not set.');
        const result = this._helper.compress(bytes);
        if (!result) throw new Error('[Utility.Compression] Compress failed.');
        return result;
    }

    /**
     * 解压数据。需先调用 setCompressionHelper 注入具体实现。
     */
    static decompress(bytes: Uint8Array): Uint8Array {
        if (!this._helper) throw new Error('[Utility.Compression] Compression helper is not set.');
        const result = this._helper.decompress(bytes);
        if (!result) throw new Error('[Utility.Compression] Decompress failed.');
        return result;
    }

    /** 当前是否已注入压缩辅助器 */
    static get hasHelper(): boolean {
        return this._helper !== null;
    }
}
