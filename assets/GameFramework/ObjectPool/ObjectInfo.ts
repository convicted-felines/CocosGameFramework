export class ObjectInfo {
    private readonly _name: string;
    private readonly _locked: boolean;
    private readonly _customCanReleaseFlag: boolean;
    private readonly _priority: number;
    private readonly _lastUseTime: number;
    private readonly _spawnCount: number;

    constructor(name: string, locked: boolean, customCanReleaseFlag: boolean, priority: number, lastUseTime: number, spawnCount: number) {
        this._name = name;
        this._locked = locked;
        this._customCanReleaseFlag = customCanReleaseFlag;
        this._priority = priority;
        this._lastUseTime = lastUseTime;
        this._spawnCount = spawnCount;
    }

    get name(): string { return this._name; }
    get locked(): boolean { return this._locked; }
    get customCanReleaseFlag(): boolean { return this._customCanReleaseFlag; }
    get priority(): number { return this._priority; }
    get lastUseTime(): number { return this._lastUseTime; }
    get isInUse(): boolean { return this._spawnCount > 0; }
    get spawnCount(): number { return this._spawnCount; }
}
