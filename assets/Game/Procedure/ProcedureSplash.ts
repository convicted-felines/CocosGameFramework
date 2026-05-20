import { ProcedureBase } from '../../GameFramework/Procedure/ProcedureBase';
import { IFsm } from '../../GameFramework/FSM/IFsm';
import { ProcedureManager } from '../../GameFramework/Procedure/ProcedureManager';
import { ProcedurePreload } from './ProcedurePreload';
import { ProcedureInitResources } from './ProcedureInitResources';
import { ProcedureCheckVersion } from './ProcedureCheckVersion';
import { GameEntry } from '../Base/GameEntry';
import { ResourceMode } from '../Definition/Constant';

export class ProcedureSplash extends ProcedureBase {
    onEnter(_fsm: IFsm<ProcedureManager>): void {
        // TODO: 播放 Splash 动画
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        const mode = GameEntry.BuiltinData.resourceMode;
        if (mode === ResourceMode.Package) {
            this.changeState(fsm, ProcedureInitResources);
        } else if (mode === ResourceMode.Updatable) {
            this.changeState(fsm, ProcedureCheckVersion);
        } else {
            this.changeState(fsm, ProcedurePreload);
        }
    }
}
