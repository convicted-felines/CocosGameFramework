import { IFsm } from './IFsm';

export abstract class FsmState<T extends object> {

    onInit(fsm: IFsm<T>): void {}

    onEnter(fsm: IFsm<T>): void {}

    onUpdate(fsm: IFsm<T>, elapseSeconds: number, realElapseSeconds: number): void {}

    onLeave(fsm: IFsm<T>, isShutdown: boolean): void {}

    onDestroy(fsm: IFsm<T>): void {}

    protected changeState<TState extends FsmState<T>>(
        fsm: IFsm<T>,
        ctor: new (...args: any[]) => TState
    ): void {
        fsm.changeState(ctor);
    }
}
