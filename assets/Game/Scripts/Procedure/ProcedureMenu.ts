import { ProcedureBase } from 'db://assets/GameFramework/Procedure/ProcedureBase';
import { IFsm } from 'db://assets/GameFramework/FSM/IFsm';
import { ProcedureManager } from 'db://assets/GameFramework/Procedure/ProcedureManager';
import { ProcedureChangeScene } from './ProcedureChangeScene';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';

export class ProcedureMenu extends ProcedureBase {
    private _startGame = false;

    onEnter(_fsm: IFsm<ProcedureManager>): void {
        this._startGame = false;
        GameFrameworkLog.info('[ProcedureMenu] Enter — opening menu UI.');
        // TODO: GameEntry.UI.openUIForm('MenuForm', ...)
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        if (!this._startGame) return;

        fsm.setData('NextSceneName', 'Game');
        this.changeState(fsm, ProcedureChangeScene);
    }

    onLeave(_fsm: IFsm<ProcedureManager>, _isShutdown: boolean): void {
        // TODO: GameEntry.UI.closeUIForm(menuForm)
    }

    /** 由菜单 UI 按钮调用，触发游戏开始 */
    startGame(): void {
        this._startGame = true;
    }
}
