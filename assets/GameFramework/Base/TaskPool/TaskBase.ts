import { TaskStatus } from './TaskStatus';

let _nextSerialId = 0;

export abstract class TaskBase {
    static readonly DEFAULT_PRIORITY = 0;

    private _serialId: number = 0;
    private _tag: string = '';
    private _priority: number = 0;
    private _userData: unknown = null;

    status: TaskStatus = TaskStatus.Todo;

    get serialId(): number { return this._serialId; }
    get tag(): string { return this._tag; }
    get priority(): number { return this._priority; }
    get userData(): unknown { return this._userData; }
    get done(): boolean { return this.status === TaskStatus.Done; }

    get description(): string | null { return null; }

    initialize(tag: string, priority: number, userData: unknown): void {
        this._serialId = ++_nextSerialId;
        this._tag = tag;
        this._priority = priority;
        this._userData = userData;
        this.status = TaskStatus.Todo;
    }

    clear(): void {
        this._serialId = 0;
        this._tag = '';
        this._priority = 0;
        this._userData = null;
        this.status = TaskStatus.Todo;
    }
}
