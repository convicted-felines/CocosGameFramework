import { ProcedureBase } from 'db://assets/GameFramework/Procedure/ProcedureBase';
import { IFsm } from 'db://assets/GameFramework/FSM/IFsm';
import { ProcedureManager } from 'db://assets/GameFramework/Procedure/ProcedureManager';
import { ProcedurePreload } from './ProcedurePreload';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';
import {
    ResourceUpdateStartEventArgs,
    ResourceUpdateChangedEventArgs,
    ResourceUpdateSuccessEventArgs,
    ResourceUpdateFailureEventArgs,
} from 'db://assets/GameFramework/Resource/ResourceEventArgs';

interface UpdateLengthData {
    name: string;
    length: number;
}

export class ProcedureUpdateResources extends ProcedureBase {
    private _complete = false;
    private _updateSuccessCount = 0;
    private _updateCount = 0;
    private _totalCompressedLength = 0;
    private _lengthData: UpdateLengthData[] = [];

    onEnter(_fsm: IFsm<ProcedureManager>): void {
        this._complete = false;
        this._updateSuccessCount = 0;
        this._lengthData = [];

        const status = GameEntry.Resource.getUpdateStatus();
        this._updateCount = status.waitingCount;
        this._totalCompressedLength = 0;

        GameEntry.Resource.onResourceUpdateStart = (_sender, args) => {
            const e = args as ResourceUpdateStartEventArgs;
            this._lengthData.push({ name: e.name, length: 0 });
            this._totalCompressedLength += e.compressedLength;
            GameFrameworkLog.info(`[ProcedureUpdateResources] Start '${e.name}'.`);
        };

        GameEntry.Resource.onResourceUpdateChanged = (_sender, args) => {
            const e = args as ResourceUpdateChangedEventArgs;
            const entry = this._lengthData.find(d => d.name === e.name);
            if (entry) entry.length = e.currentLength;
        };

        GameEntry.Resource.onResourceUpdateSuccess = (_sender, args) => {
            const e = args as ResourceUpdateSuccessEventArgs;
            const entry = this._lengthData.find(d => d.name === e.name);
            if (entry) entry.length = e.compressedLength;
            this._updateSuccessCount++;
            GameFrameworkLog.info(`[ProcedureUpdateResources] Success '${e.name}' (${this._updateSuccessCount}/${this._updateCount}).`);
        };

        GameEntry.Resource.onResourceUpdateFailure = (_sender, args) => {
            const e = args as ResourceUpdateFailureEventArgs;
            GameFrameworkLog.warning(`[ProcedureUpdateResources] Failure '${e.name}': ${e.errorMessage}`);
            const idx = this._lengthData.findIndex(d => d.name === e.name);
            if (idx >= 0) this._lengthData.splice(idx, 1);
        };

        GameEntry.Resource.onResourceUpdateAllComplete = () => {
            this._complete = true;
        };

        GameEntry.Resource.startUpdate();
    }

    onUpdate(_fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        if (this._complete) {
            this.changeState(_fsm, ProcedurePreload);
        }
    }

    onLeave(_fsm: IFsm<ProcedureManager>, _isShutdown: boolean): void {
        GameEntry.Resource.onResourceUpdateStart = null;
        GameEntry.Resource.onResourceUpdateChanged = null;
        GameEntry.Resource.onResourceUpdateSuccess = null;
        GameEntry.Resource.onResourceUpdateFailure = null;
        GameEntry.Resource.onResourceUpdateAllComplete = null;
    }

    get progress(): number {
        if (this._totalCompressedLength === 0) return 0;
        const current = this._lengthData.reduce((sum, d) => sum + d.length, 0);
        return current / this._totalCompressedLength;
    }
}
