import { ProcedureBase } from '../../GameFramework/Procedure/ProcedureBase';
import { IFsm } from '../../GameFramework/FSM/IFsm';
import { ProcedureManager } from '../../GameFramework/Procedure/ProcedureManager';
import { ProcedureUpdateResources } from './ProcedureUpdateResources';
import { ProcedurePreload } from './ProcedurePreload';
import { GameEntry } from '../Base/GameEntry';
import { GameFrameworkLog } from '../../GameFramework/Base/Log/GameFrameworkLog';

export class ProcedureCheckResources extends ProcedureBase {
    private _complete = false;
    private _needUpdate = false;

    onEnter(_fsm: IFsm<ProcedureManager>): void {
        this._complete = false;
        this._needUpdate = false;

        // 检查是否有待更新资源
        const status = GameEntry.Resource.getUpdateStatus();
        this._needUpdate = status.waitingCount > 0;

        GameFrameworkLog.info(
            `[ProcedureCheckResources] waitingCount=${status.waitingCount}, needUpdate=${this._needUpdate}`
        );
        this._complete = true;
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        if (!this._complete) return;

        if (this._needUpdate) {
            this.changeState(fsm, ProcedureUpdateResources);
        } else {
            this.changeState(fsm, ProcedurePreload);
        }
    }
}
