import { _decorator } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { FsmManager } from '../../GameFramework/FSM/FsmManager';
import { IProcedureManager } from '../../GameFramework/Procedure/IProcedureManager';
import { ProcedureManager } from '../../GameFramework/Procedure/ProcedureManager';
import { ProcedureBase } from '../../GameFramework/Procedure/ProcedureBase';

const { ccclass } = _decorator;

@ccclass('ProcedureComponent')
export class ProcedureComponent extends GameFrameworkComponent {
    private _manager!: ProcedureManager;

    get manager(): IProcedureManager { return this._manager; }

    onLoad(): void {
        super.onLoad();
        this._manager = new ProcedureManager();
        GameFrameworkEntry.registerModule(MODULE_ID.PROCEDURE, this._manager);
    }

    /**
     * 初始化并启动流程系统。
     * @param procedures 所有可用的流程实例
     * @param entranceProcedure 入口流程实例（必须包含在 procedures 中）
     */
    initialize(procedures: ProcedureBase[], entranceProcedure: ProcedureBase): void {
        const fsmManager = GameFrameworkEntry.getModule(FsmManager, MODULE_ID.FSM);
        this._manager.initialize(fsmManager, procedures);
        this._manager.startProcedureByType(entranceProcedure.constructor);
    }

    get currentProcedure(): ProcedureBase | null { return this._manager.currentProcedure; }
    get currentProcedureTime(): number { return this._manager.currentProcedureTime; }

    startProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): void {
        this._manager.startProcedure(ctor);
    }

    startProcedureByType(procedureType: Function): void {
        this._manager.startProcedureByType(procedureType);
    }

    hasProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): boolean {
        return this._manager.hasProcedure(ctor);
    }

    hasProcedureByType(procedureType: Function): boolean {
        return this._manager.hasProcedureByType(procedureType);
    }

    getProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): T | null {
        return this._manager.getProcedure(ctor);
    }

    getProcedureByType(procedureType: Function): ProcedureBase | null {
        return this._manager.getProcedureByType(procedureType);
    }
}
