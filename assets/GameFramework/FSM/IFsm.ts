import { FsmState } from './FsmState';

export interface IFsm<T extends object> {
    readonly name: string;
    readonly owner: T;
    readonly stateCount: number;
    readonly isRunning: boolean;
    readonly isDestroyed: boolean;
    readonly currentState: FsmState<T> | null;
    readonly currentStateTime: number;

    start<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): void;

    hasState<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): boolean;
    getState<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): TState | null;
    getAllStates(): FsmState<T>[];
    changeState<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): void;

    setData<TData>(name: string, data: TData): void;
    getData<TData>(name: string): TData | undefined;
    removeData(name: string): boolean;
}
