


import { ProcedureBase, IFsm, ProcedureManager, GameFrameworkLog, ResourceVerifyStartEventArgs, ResourceVerifySuccessEventArgs, ResourceVerifyFailureEventArgs } from '@game-studio/game-framework';
import { ProcedureCheckResources } from './ProcedureCheckResources';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';



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
