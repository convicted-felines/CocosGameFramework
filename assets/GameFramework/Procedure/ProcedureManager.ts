import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { IFsmManager } from '../FSM/IFsmManager';
import { IFsm } from '../FSM/IFsm';
import { IProcedureManager } from './IProcedureManager';
import { ProcedureBase } from './ProcedureBase';

export class ProcedureManager extends GameFrameworkModule implements IProcedureManager {
    private _fsmManager: IFsmManager | null = null;
    private _procedureFsm: IFsm<ProcedureManager> | null = null;

    get priority(): number { return 80; }

    get currentProcedure(): ProcedureBase | null {
        if (!this._procedureFsm) return null;
        return this._procedureFsm.currentState as ProcedureBase | null;
    }

    get currentProcedureTime(): number {
        return this._procedureFsm?.currentStateTime ?? 0;
    }

    // 必须在 startProcedure 前调用
    setFsmManager(fsmManager: IFsmManager): void {
        this._fsmManager = fsmManager;
    }

    initialize(procedures: ProcedureBase[]): void {
        if (!this._fsmManager) {
            throw new GameFrameworkError('ProcedureManager requires FsmManager to be set first.');
        }
        this._procedureFsm = this._fsmManager.createFsm<ProcedureManager>(
            'GameProcedure',
            this,
            procedures
        );
    }

    startProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): void {
        if (!this._procedureFsm) {
            throw new GameFrameworkError('ProcedureManager is not initialized.');
        }
        this._procedureFsm.start(ctor);
    }

    hasProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): boolean {
        return this._procedureFsm?.hasState(ctor) ?? false;
    }

    getProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): T | null {
        return this._procedureFsm?.getState(ctor) ?? null;
    }

    update(elapseSeconds: number, realElapseSeconds: number): void {
        // FsmManager 统一驱动 FSM update，此处无需重复调用
    }

    shutdown(): void {
        if (this._fsmManager && this._procedureFsm) {
            this._fsmManager.destroyFsm('GameProcedure');
        }
        this._procedureFsm = null;
        this._fsmManager = null;
    }
}
