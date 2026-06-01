import { IFsm } from './IFsm';
import { GameFrameworkError } from '../Base/GameFrameworkError';

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
        if (!fsm) {
            throw new GameFrameworkError('FSM is invalid.');
        }
        if (!fsm.hasState(ctor)) {
            throw new GameFrameworkError(
                `State type '${ctor.name}' is invalid.`
            );
        }
        fsm.changeState(ctor);
    }
}
