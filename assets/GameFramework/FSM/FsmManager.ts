import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { IFsmManager } from './IFsmManager';
import { IFsm } from './IFsm';
import { FsmState } from './FsmState';
import { Fsm } from './Fsm';

export class FsmManager extends GameFrameworkModule implements IFsmManager {
    private _fsms: Map<string, Fsm<any>> = new Map();

    get priority(): number { return 90; }

    get fsmCount(): number { return this._fsms.size; }

    hasFsm<T extends object>(name: string): boolean {
        return this._fsms.has(name);
    }

    getFsm<T extends object>(name: string): IFsm<T> | null {
        return (this._fsms.get(name) as Fsm<T>) ?? null;
    }

    getAllFsms(): IFsm<any>[] {
        return Array.from(this._fsms.values());
    }

    createFsm<T extends object>(
        name: string,
        owner: T,
        states: FsmState<T>[]
    ): IFsm<T> {
        if (this._fsms.has(name)) {
            throw new GameFrameworkError(`FSM [${name}] already exists.`);
        }
        if (!states || states.length === 0) {
            throw new GameFrameworkError(`FSM [${name}] must have at least one state.`);
        }
        const fsm = new Fsm<T>(name, owner, states);
        this._fsms.set(name, fsm);
        return fsm;
    }

    destroyFsm<T extends object>(name: string): boolean {
        const fsm = this._fsms.get(name);
        if (!fsm) return false;
        fsm.shutdown();
        this._fsms.delete(name);
        return true;
    }

    update(elapseSeconds: number, realElapseSeconds: number): void {
        this._fsms.forEach(fsm => fsm.update(elapseSeconds, realElapseSeconds));
    }

    shutdown(): void {
        this._fsms.forEach(fsm => fsm.shutdown());
        this._fsms.clear();
    }
}
