import { ProcedureBase } from '../../GameFramework/Procedure/ProcedureBase';
import { IFsm } from '../../GameFramework/FSM/IFsm';
import { ProcedureManager } from '../../GameFramework/Procedure/ProcedureManager';
import { ProcedureUpdateVersion } from './ProcedureUpdateVersion';
import { ProcedureVerifyResources } from './ProcedureVerifyResources';
import { GameEntry } from '../Base/GameEntry';
import { GameFrameworkLog } from '../../GameFramework/Base/Log/GameFrameworkLog';

export interface VersionInfo {
    latestGameVersion: string;
    internalGameVersion: number;
    internalResourceVersion: number;
    versionListLength: number;
    versionListHashCode: number;
    versionListCompressedLength: number;
    versionListCompressedHashCode: number;
    forceUpdateGame: boolean;
    updatePrefixUri: string;
}

export class ProcedureCheckVersion extends ProcedureBase {
    private _checkComplete = false;
    private _needUpdate = false;
    private _versionInfo: VersionInfo | null = null;

    onEnter(fsm: IFsm<ProcedureManager>): void {
        this._checkComplete = false;
        this._needUpdate = false;
        this._versionInfo = null;

        const url = GameEntry.BuiltinData.checkVersionUrl;
        if (!url) {
            GameFrameworkLog.warning('[ProcedureCheckVersion] checkVersionUrl is empty, skip version check.');
            this._checkComplete = true;
            return;
        }

        fetch(url)
            .then(r => r.json())
            .then((json: VersionInfo) => {
                this._versionInfo = json;
                const localInternal = GameEntry.BuiltinData.buildInfo?.internalResourceVersion ?? 0;
                this._needUpdate = json.internalResourceVersion > localInternal;
                this._checkComplete = true;
                GameFrameworkLog.info(
                    `[ProcedureCheckVersion] Remote v${json.latestGameVersion} (res ${json.internalResourceVersion}), ` +
                    `local res ${localInternal}, needUpdate=${this._needUpdate}`
                );
            })
            .catch(err => {
                GameFrameworkLog.warning(`[ProcedureCheckVersion] Request failed: ${err}`);
                this._checkComplete = true;
            });
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        if (!this._checkComplete) return;

        if (this._needUpdate && this._versionInfo) {
            const v = this._versionInfo;
            fsm.setData('VersionListLength', v.versionListLength);
            fsm.setData('VersionListHashCode', v.versionListHashCode);
            fsm.setData('VersionListCompressedLength', v.versionListCompressedLength);
            fsm.setData('VersionListCompressedHashCode', v.versionListCompressedHashCode);
            if (v.updatePrefixUri) {
                fsm.setData('UpdatePrefixUri', v.updatePrefixUri);
            }
            this.changeState(fsm, ProcedureUpdateVersion);
        } else {
            this.changeState(fsm, ProcedureVerifyResources);
        }
    }
}
