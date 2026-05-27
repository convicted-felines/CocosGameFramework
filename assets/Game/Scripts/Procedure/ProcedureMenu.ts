import { ProcedureBase } from 'db://assets/GameFramework/Procedure/ProcedureBase';
import { IFsm } from 'db://assets/GameFramework/FSM/IFsm';
import { ProcedureManager } from 'db://assets/GameFramework/Procedure/ProcedureManager';
import { ProcedureChangeScene } from './ProcedureChangeScene';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';

const MENU_FORM_ASSET = 'UI/MenuForm';
const MENU_FORM_BUNDLE = 'resources';
const MENU_FORM_GROUP = 'Default';

export class ProcedureMenu extends ProcedureBase {
    private _nextScene: string | null = null;
    private _menuFormSerialId = -1;

    onEnter(_fsm: IFsm<ProcedureManager>): void {
        this._nextScene = null;
        GameFrameworkLog.info('[ProcedureMenu] Enter — opening menu UI.');
        this._menuFormSerialId = GameEntry.UI.openUIForm(
            MENU_FORM_ASSET, MENU_FORM_BUNDLE, MENU_FORM_GROUP,
        );
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        if (this._nextScene === null) return;
        fsm.setData('NextSceneName', this._nextScene);
        this.changeState(fsm, ProcedureChangeScene);
    }

    onLeave(_fsm: IFsm<ProcedureManager>, _isShutdown: boolean): void {
        if (this._menuFormSerialId >= 0) {
            GameEntry.UI.closeUIForm(this._menuFormSerialId);
            this._menuFormSerialId = -1;
        }
    }

    /** 由 MenuForm 的「开始游戏」按钮调用 */
    startFPS(): void {
        this._nextScene = 'FPS';
    }
}
