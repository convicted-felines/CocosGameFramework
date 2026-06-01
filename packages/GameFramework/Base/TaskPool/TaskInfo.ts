import { TaskStatus } from './TaskStatus';
import { GameFrameworkError } from '../GameFrameworkError';

export class TaskInfo {
    private readonly _isValid: boolean;
    private readonly _serialId: number;
    private readonly _tag: string;
    private readonly _priority: number;
    private readonly _userData: unknown;
    private readonly _status: TaskStatus;
    private readonly _description: string | null;

    constructor(
        serialId: number,
        tag: string,
        priority: number,
        userData: unknown,
        status: TaskStatus,
        description: string | null,
    ) {
        this._isValid = true;
        this._serialId = serialId;
        this._tag = tag;
        this._priority = priority;
        this._userData = userData;
        this._status = status;
        this._description = description;
    }

    get isValid(): boolean { return this._isValid; }

    get serialId(): number {
        if (!this._isValid) throw new GameFrameworkError('Data is invalid.');
        return this._serialId;
    }

    get tag(): string {
        if (!this._isValid) throw new GameFrameworkError('Data is invalid.');
        return this._tag;
    }

    get priority(): number {
        if (!this._isValid) throw new GameFrameworkError('Data is invalid.');
        return this._priority;
    }

    get userData(): unknown {
        if (!this._isValid) throw new GameFrameworkError('Data is invalid.');
        return this._userData;
    }

    get status(): TaskStatus {
        if (!this._isValid) throw new GameFrameworkError('Data is invalid.');
        return this._status;
    }

    get description(): string | null {
        if (!this._isValid) throw new GameFrameworkError('Data is invalid.');
        return this._description;
    }
}
