import { ProcedureBase } from 'db://assets/GameFramework/Procedure/ProcedureBase';
import { IFsm } from 'db://assets/GameFramework/FSM/IFsm';
import { ProcedureManager } from 'db://assets/GameFramework/Procedure/ProcedureManager';
import { ProcedureChangeScene } from './ProcedureChangeScene';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';

const GAMEOVER_DELAY_SECONDS = 2;

export class ProcedureMain extends ProcedureBase {
    private _gotoMenu = false;
    private _gotoMenuCountdown = 0;

    onEnter(_fsm: IFsm<ProcedureManager>): void {
        this._gotoMenu = false;
        this._gotoMenuCountdown = 0;
        GameFrameworkLog.info('[ProcedureMain] Game started.');
        // TODO: GameEntry.UI.openUIForm('GameForm', ...)
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _elapseSeconds: number, realElapseSeconds: number): void {
        if (this._gotoMenu) {
            this._gotoMenuCountdown -= realElapseSeconds;
            if (this._gotoMenuCountdown <= 0) {
                fsm.setData('NextSceneName', 'Menu');
                this.changeState(fsm, ProcedureChangeScene);
            }
        }
    }

    onLeave(_fsm: IFsm<ProcedureManager>, _isShutdown: boolean): void {
        // TODO: 清理游戏逻辑、关闭游戏 UI
    }

    /** 游戏结束后调用，延迟 2 秒返回菜单 */
    gotoMenu(): void {
        if (this._gotoMenu) return;
        this._gotoMenu = true;
        this._gotoMenuCountdown = GAMEOVER_DELAY_SECONDS;
    }
}
