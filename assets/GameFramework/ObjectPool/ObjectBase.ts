export abstract class ObjectBase {
    private _name: string = '';
    private _target: any = null;
    private _locked: boolean = false;
    private _priority: number = 0;
    private _lastUseTime: number = 0;

    get name(): string { return this._name; }
    get target(): any { return this._target; }
    get locked(): boolean { return this._locked; }
    set locked(value: boolean) { this._locked = value; }
    get priority(): number { return this._priority; }
    set priority(value: number) { this._priority = value; }
    get lastUseTime(): number { return this._lastUseTime; }

    /** 自定义是否可释放标志，子类可覆盖以阻止特定对象被自动释放 */
    get customCanReleaseFlag(): boolean { return true; }

    protected initialize(target: any): void;
    protected initialize(name: string, target: any): void;
    protected initialize(name: string, target: any, locked: boolean): void;
    protected initialize(name: string, target: any, priority: number): void;
    protected initialize(name: string, target: any, locked: boolean, priority: number): void;
    protected initialize(nameOrTarget: string | any, target?: any, lockedOrPriority?: boolean | number, priority?: number): void {
        let name: string;
        let tgt: any;
        let locked: boolean = false;
        let prio: number = 0;

        if (typeof nameOrTarget !== 'string') {
            // initialize(target)
            name = '';
            tgt = nameOrTarget;
        } else if (target === undefined) {
            name = nameOrTarget;
            tgt = null;
        } else {
            name = nameOrTarget;
            tgt = target;
            if (typeof lockedOrPriority === 'boolean') {
                locked = lockedOrPriority;
                prio = priority ?? 0;
            } else if (typeof lockedOrPriority === 'number') {
                prio = lockedOrPriority;
            }
        }

        if (tgt == null) {
            throw new Error(`Target '${name}' is invalid.`);
        }

        this._name = name;
        this._target = tgt;
        this._locked = locked;
        this._priority = prio;
        this._lastUseTime = Date.now();
    }

    /** 由 ObjectPool 内部更新最后使用时间 */
    _updateLastUseTime(): void {
        this._lastUseTime = Date.now();
    }

    clear(): void {
        this._name = '';
        this._target = null;
        this._locked = false;
        this._priority = 0;
        this._lastUseTime = 0;
    }

    onSpawn(): void {}
    onUnspawn(): void {}
    abstract release(isShutdown: boolean): void;
}
