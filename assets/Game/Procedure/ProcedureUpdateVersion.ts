import { ProcedureBase } from '../../GameFramework/Procedure/ProcedureBase';
import { IFsm } from '../../GameFramework/FSM/IFsm';
import { ProcedureManager } from '../../GameFramework/Procedure/ProcedureManager';
import { ProcedureVerifyResources } from './ProcedureVerifyResources';
import { GameEntry } from '../Base/GameEntry';
import { GameFrameworkLog } from '../../GameFramework/Base/Log/GameFrameworkLog';
import { UpdateTask } from '../../CocosGameFramework/Resource/CocosResourceManager';

export class ProcedureUpdateVersion extends ProcedureBase {
    private _complete = false;

    onEnter(fsm: IFsm<ProcedureManager>): void {
        this._complete = false;

        const prefixUri = fsm.getData<string>('UpdatePrefixUri') ?? '';

        fsm.removeData('VersionListLength');
        fsm.removeData('VersionListHashCode');
        fsm.removeData('VersionListCompressedLength');
        fsm.removeData('VersionListCompressedHashCode');
        fsm.removeData('UpdatePrefixUri');

        if (!prefixUri) {
            GameFrameworkLog.warning('[ProcedureUpdateVersion] No UpdatePrefixUri, skipping version list download.');
            this._complete = true;
            return;
        }

        // 下载版本列表 JSON，将待更新资源注册到 ResourceManager
        fetch(`${prefixUri}/version_list.json`)
            .then(r => r.json())
            .then((list: Array<UpdateTask>) => {
                for (const item of list) {
                    GameEntry.Resource.addUpdateTask({
                        name: item.name,
                        downloadPath: '',
                        downloadUri: `${prefixUri}/${item.downloadUri}`,
                        length: item.length,
                        compressedLength: item.compressedLength,
                        retryCount: 0,
                    });
                }
                GameFrameworkLog.info(`[ProcedureUpdateVersion] Queued ${list.length} update tasks.`);
                this._complete = true;
            })
            .catch(err => {
                GameFrameworkLog.warning(`[ProcedureUpdateVersion] Version list download failed: ${err}`);
                this._complete = true;
            });
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        if (this._complete) {
            this.changeState(fsm, ProcedureVerifyResources);
        }
    }
}
