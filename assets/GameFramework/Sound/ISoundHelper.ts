/**
 * 声音辅助器接口。
 *
 * 负责释放不再使用的声音资源。
 */
export interface ISoundHelper {
    /** 释放声音资源。 */
    releaseSoundAsset(soundAsset: object): void;
}
