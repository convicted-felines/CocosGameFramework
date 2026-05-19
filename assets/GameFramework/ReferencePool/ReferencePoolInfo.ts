export class ReferencePoolInfo {
    readonly type: Function;
    readonly unusedReferenceCount: number;
    readonly usingReferenceCount: number;
    readonly acquireReferenceCount: number;
    readonly releaseReferenceCount: number;
    readonly addReferenceCount: number;
    readonly removeReferenceCount: number;

    constructor(
        type: Function,
        unusedReferenceCount: number,
        usingReferenceCount: number,
        acquireReferenceCount: number,
        releaseReferenceCount: number,
        addReferenceCount: number,
        removeReferenceCount: number
    ) {
        this.type = type;
        this.unusedReferenceCount = unusedReferenceCount;
        this.usingReferenceCount = usingReferenceCount;
        this.acquireReferenceCount = acquireReferenceCount;
        this.releaseReferenceCount = releaseReferenceCount;
        this.addReferenceCount = addReferenceCount;
        this.removeReferenceCount = removeReferenceCount;
    }
}
