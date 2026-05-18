import { _decorator, Component } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { ProcedureManager } from '../../GameFramework/Procedure/ProcedureManager';
import { ProcedureBase } from '../../GameFramework/Procedure/ProcedureBase';
import { FsmManager } from '../../GameFramework/FSM/FsmManager';

const { ccclass } = _decorator;

@ccclass('ProcedureComponent')
export class ProcedureComponent extends Component {
    private _manager!: ProcedureManager;

    get manager(): ProcedureManager { return this._manager; }

    onLoad(): void {
        this._manager = new ProcedureManager();
        // FsmManager 必须先注册；onLoad 顺序由节点层级决定，FsmComponent 需在父层或同层更早
        const fsmMgr = GameFrameworkEntry.getModule(FsmManager, MODULE_ID.FSM);
        this._manager.setFsmManager(fsmMgr);
        GameFrameworkEntry.registerModule(MODULE_ID.PROCEDURE, this._manager);
    }

    get currentProcedure(): ProcedureBase | null { return this._manager.currentProcedure; }
    get currentProcedureTime(): number { return this._manager.currentProcedureTime; }

    initialize(procedures: ProcedureBase[]): void {
        this._manager.initialize(procedures);
    }

    startProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): void {
        this._manager.startProcedure(ctor);
    }

    hasProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): boolean {
        return this._manager.hasProcedure(ctor);
    }

    getProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): T | null {
        return this._manager.getProcedure(ctor);
    }
}
