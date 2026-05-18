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

    // 由 ObjectPool 调用
    initialize(name: string, target: any, priority: number = 0): void {
        this._name = name;
        this._target = target;
        this._priority = priority;
        this._lastUseTime = Date.now();
    }

    // 取出时调用
    onSpawn(): void {}

    // 归还时调用
    onUnspawn(): void {}

    // 释放时调用（对象销毁）
    onRelease(isShutdown: boolean): void {}
}
