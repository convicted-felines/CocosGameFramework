import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { IFsmManager } from './IFsmManager';
import { IFsm } from './IFsm';
import { FsmState } from './FsmState';
import { Fsm } from './Fsm';

function makeFsmKey(ownerCtorName: string, name: string): string {
    return name ? `${ownerCtorName}.${name}` : ownerCtorName;
}

export class FsmManager extends GameFrameworkModule implements IFsmManager {
    private _fsms: Map<string, Fsm<any>> = new Map();

    get priority(): number { return 90; }

    get fsmCount(): number { return this._fsms.size; }

    hasFsm<T extends object>(ownerCtor: new (...args: any[]) => T, name: string = ''): boolean {
        return this._fsms.has(makeFsmKey(ownerCtor.name, name));
    }

    getFsm<T extends object>(ownerCtor: new (...args: any[]) => T, name: string = ''): IFsm<T> | null {
        return (this._fsms.get(makeFsmKey(ownerCtor.name, name)) as Fsm<T>) ?? null;
    }

    getAllFsms(): IFsm<any>[] {
        return Array.from(this._fsms.values());
    }

    createFsm<T extends object>(
        name: string,
        owner: T,
        states: FsmState<T>[]
    ): IFsm<T> {
        const key = makeFsmKey(owner.constructor.name, name);
        if (this._fsms.has(key)) {
            throw new GameFrameworkError(`FSM [${key}] already exists.`);
        }
        if (!states || states.length === 0) {
            throw new GameFrameworkError(`FSM [${key}] must have at least one state.`);
        }
        const fsm = new Fsm<T>(name, owner, states);
        this._fsms.set(key, fsm);
        return fsm;
    }

    destroyFsm<T extends object>(ownerCtor: new (...args: any[]) => T, name: string = ''): boolean {
        const key = makeFsmKey(ownerCtor.name, name);
        const fsm = this._fsms.get(key);
        if (!fsm) return false;
        fsm.shutdown();
        this._fsms.delete(key);
        return true;
    }

    destroyFsmByInstance<T extends object>(fsm: IFsm<T>): boolean {
        const key = makeFsmKey(fsm.ownerType.name, fsm.name);
        const existing = this._fsms.get(key);
        if (!existing) return false;
        existing.shutdown();
        this._fsms.delete(key);
        return true;
    }

    update(elapseSeconds: number, realElapseSeconds: number): void {
        const fsms = Array.from(this._fsms.values());
        for (const fsm of fsms) {
            if (!fsm.isDestroyed) {
                fsm.update(elapseSeconds, realElapseSeconds);
            }
        }
    }

    shutdown(): void {
        this._fsms.forEach(fsm => fsm.shutdown());
        this._fsms.clear();
    }
}
