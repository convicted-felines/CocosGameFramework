import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { IFsmManager } from '../FSM/IFsmManager';
import { IFsm } from '../FSM/IFsm';
import { IProcedureManager } from './IProcedureManager';
import { ProcedureBase } from './ProcedureBase';

export class ProcedureManager extends GameFrameworkModule implements IProcedureManager {
    private _procedureFsm: IFsm<IProcedureManager> | null = null;

    get priority(): number { return -2; }

    get currentProcedure(): ProcedureBase | null {
        if (!this._procedureFsm) return null;
        return this._procedureFsm.currentState as ProcedureBase | null;
    }

    get currentProcedureTime(): number {
        return this._procedureFsm?.currentStateTime ?? 0;
    }

    initialize(fsmManager: IFsmManager, procedures: ProcedureBase[]): void {
        if (!fsmManager) {
            throw new GameFrameworkError('FSM manager is invalid.');
        }
        if (!procedures || procedures.length === 0) {
            throw new GameFrameworkError('Procedures is invalid.');
        }
        this._procedureFsm = fsmManager.createFsm<IProcedureManager>(
            'GameProcedure',
            this,
            procedures
        );
    }

    startProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): void {
        if (!this._procedureFsm) {
            throw new GameFrameworkError('You must initialize procedure first.');
        }
        this._procedureFsm.start(ctor);
    }

    startProcedureByType(procedureType: Function): void {
        if (!this._procedureFsm) {
            throw new GameFrameworkError('You must initialize procedure first.');
        }
        const state = this._procedureFsm.getAllStates().find(s => s.constructor === procedureType);
        if (!state) {
            throw new GameFrameworkError(`Procedure type '${procedureType.name}' is invalid.`);
        }
        this._procedureFsm.changeState(state.constructor as new (...args: any[]) => ProcedureBase);
    }

    hasProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): boolean {
        return this._procedureFsm?.hasState(ctor) ?? false;
    }

    hasProcedureByType(procedureType: Function): boolean {
        if (!this._procedureFsm) return false;
        return this._procedureFsm.getAllStates().some(s => s.constructor === procedureType);
    }

    getProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): T | null {
        return this._procedureFsm?.getState(ctor) ?? null;
    }

    getProcedureByType(procedureType: Function): ProcedureBase | null {
        if (!this._procedureFsm) return null;
        return (this._procedureFsm.getAllStates().find(s => s.constructor === procedureType) as ProcedureBase) ?? null;
    }

    update(elapseSeconds: number, realElapseSeconds: number): void {}

    shutdown(): void {
        this._procedureFsm = null;
    }
}
