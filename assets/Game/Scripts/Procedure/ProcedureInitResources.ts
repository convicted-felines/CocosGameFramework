import { ProcedureBase } from 'db://assets/GameFramework/Procedure/ProcedureBase';
import { IFsm } from 'db://assets/GameFramework/FSM/IFsm';
import { ProcedureManager } from 'db://assets/GameFramework/Procedure/ProcedureManager';
import { ProcedurePreload } from './ProcedurePreload';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';

export class ProcedureInitResources extends ProcedureBase {
    private _complete = false;

    onEnter(_fsm: IFsm<ProcedureManager>): void {
        this._complete = false;

        // Package 模式：Bundle 已随包发布，直接加载主 Bundle 即可
        GameEntry.Resource.loadBundle('resources',
            () => {
                GameFrameworkLog.info('[ProcedureInitResources] Resources bundle initialized.');
                this._complete = true;
            },
            (_name, err) => {
                GameFrameworkLog.warning(`[ProcedureInitResources] Load bundle failed: ${err}. Continuing anyway.`);
                this._complete = true;
            }
        );
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        if (this._complete) {
            this.changeState(fsm, ProcedurePreload);
        }
    }
}
