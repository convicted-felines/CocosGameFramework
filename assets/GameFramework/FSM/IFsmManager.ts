import { IFsm } from './IFsm';
import { FsmState } from './FsmState';

export interface IFsmManager {
    readonly fsmCount: number;

    hasFsm<T extends object>(name: string): boolean;
    getFsm<T extends object>(name: string): IFsm<T> | null;
    getAllFsms(): IFsm<any>[];

    createFsm<T extends object>(
        name: string,
        owner: T,
        states: FsmState<T>[]
    ): IFsm<T>;

    destroyFsm<T extends object>(name: string): boolean;
}
