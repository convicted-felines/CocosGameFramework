export enum PlaySoundErrorCode {
    Unknown = 0,
    SoundGroupNotExist,
    SoundGroupHasNoAgent,
    LoadAssetFailure,
    IgnoredDueToLowPriority,
    SetSoundAssetFailure,
}
