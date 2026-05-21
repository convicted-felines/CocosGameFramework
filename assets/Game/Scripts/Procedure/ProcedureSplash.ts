import { ProcedureBase } from 'db://assets/GameFramework/Procedure/ProcedureBase';
import { IFsm } from 'db://assets/GameFramework/FSM/IFsm';
import { ProcedureManager } from 'db://assets/GameFramework/Procedure/ProcedureManager';
import { ProcedurePreload } from './ProcedurePreload';
import { ProcedureInitResources } from './ProcedureInitResources';
import { ProcedureCheckVersion } from './ProcedureCheckVersion';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { ResourceMode } from 'db://assets/Game/Scripts/Definition/Constant';

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
