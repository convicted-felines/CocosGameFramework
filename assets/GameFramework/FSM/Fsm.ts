import { IFsm } from './IFsm';
import { FsmState } from './FsmState';
import { GameFrameworkError } from '../Base/GameFrameworkError';

export class Fsm<T extends object> implements IFsm<T> {
    private _name: string;
    private _owner: T;
    private _states: Map<Function, FsmState<T>> = new Map();
    private _data: Map<string, any> = new Map();
    private _currentState: FsmState<T> | null = null;
    private _currentStateTime: number = 0;
    private _isRunning: boolean = false;
    private _isDestroyed: boolean = false;

    constructor(name: string, owner: T, states: FsmState<T>[]) {
        this._name = name;
        this._owner = owner;
        for (const state of states) {
            const ctor = state.constructor;
            if (this._states.has(ctor)) {
                throw new GameFrameworkError(
                    `FSM [${name}] already has state [${ctor.name}].`
                );
            }
            this._states.set(ctor, state);
            state.onInit(this);
        }
    }

    get name(): string { return this._name; }
    get owner(): T { return this._owner; }
    get stateCount(): number { return this._states.size; }
    get isRunning(): boolean { return this._isRunning; }
    get isDestroyed(): boolean { return this._isDestroyed; }
    get currentState(): FsmState<T> | null { return this._currentState; }
    get currentStateTime(): number { return this._currentStateTime; }

    start<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): void {
        if (this._isRunning) {
            throw new GameFrameworkError(`FSM [${this._name}] is already running.`);
        }
        const state = this._states.get(ctor);
        if (!state) {
            throw new GameFrameworkError(
                `FSM [${this._name}] has no state [${ctor.name}].`
            );
        }
        this._currentState = state;
        this._currentStateTime = 0;
        this._isRunning = true;
        state.onEnter(this);
    }

    hasState<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): boolean {
        return this._states.has(ctor);
    }

    getState<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): TState | null {
        return (this._states.get(ctor) as TState) ?? null;
    }

    getAllStates(): FsmState<T>[] {
        return Array.from(this._states.values());
    }

    changeState<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): void {
        if (!this._isRunning) {
            throw new GameFrameworkError(`FSM [${this._name}] is not running.`);
        }
        const nextState = this._states.get(ctor);
        if (!nextState) {
            throw new GameFrameworkError(
                `FSM [${this._name}] has no state [${ctor.name}].`
            );
        }
        const prevState = this._currentState;
        this._currentState = nextState;
        this._currentStateTime = 0;
        prevState?.onLeave(this, false);
        nextState.onEnter(this);
    }

    setData<TData>(name: string, data: TData): void {
        this._data.set(name, data);
    }

    getData<TData>(name: string): TData | undefined {
        return this._data.get(name) as TData | undefined;
    }

    removeData(name: string): boolean {
        return this._data.delete(name);
    }

    update(elapseSeconds: number, realElapseSeconds: number): void {
        if (!this._isRunning || !this._currentState) return;
        this._currentStateTime += elapseSeconds;
        this._currentState.onUpdate(this, elapseSeconds, realElapseSeconds);
    }

    shutdown(): void {
        if (this._currentState) {
            this._currentState.onLeave(this, true);
            this._currentState = null;
        }
        this._states.forEach(state => state.onDestroy(this));
        this._states.clear();
        this._data.clear();
        this._isRunning = false;
        this._isDestroyed = true;
    }
}
