import { ProcedureBase } from '../../GameFramework/Procedure/ProcedureBase';
import { IFsm } from '../../GameFramework/FSM/IFsm';
import { ProcedureManager } from '../../GameFramework/Procedure/ProcedureManager';
import { ProcedureCheckResources } from './ProcedureCheckResources';
import { GameEntry } from '../Base/GameEntry';
import { GameFrameworkLog } from '../../GameFramework/Base/Log/GameFrameworkLog';
import {
    ResourceVerifyStartEventArgs,
    ResourceVerifySuccessEventArgs,
    ResourceVerifyFailureEventArgs,
} from '../../GameFramework/Resource/ResourceEventArgs';

export class ProcedureVerifyResources extends ProcedureBase {
    private _complete = false;

    onEnter(_fsm: IFsm<ProcedureManager>): void {
        this._complete = false;

        GameEntry.Resource.onResourceVerifyStart = (_sender, args) => {
            const e = args as ResourceVerifyStartEventArgs;
            GameFrameworkLog.info(`[ProcedureVerifyResources] Verify start, count=${e.count}`);
        };

        GameEntry.Resource.onResourceVerifySuccess = (_sender, args) => {
            const e = args as ResourceVerifySuccessEventArgs;
            GameFrameworkLog.info(`[ProcedureVerifyResources] Verified '${e.name}'.`);
        };

        GameEntry.Resource.onResourceVerifyFailure = (_sender, args) => {
            const e = args as ResourceVerifyFailureEventArgs;
            GameFrameworkLog.warning(`[ProcedureVerifyResources] Verify failure '${e.name}'.`);
        };

        // Web/Editor 模式下 verifyResources 同步完成
        GameEntry.Resource.verifyResources([]);
        this._complete = true;
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        if (this._complete) {
            this.changeState(fsm, ProcedureCheckResources);
        }
    }

    onLeave(_fsm: IFsm<ProcedureManager>, _isShutdown: boolean): void {
        GameEntry.Resource.onResourceVerifyStart = null;
        GameEntry.Resource.onResourceVerifySuccess = null;
        GameEntry.Resource.onResourceVerifyFailure = null;
    }
}
