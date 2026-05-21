import { ProcedureBase } from 'db://assets/GameFramework/Procedure/ProcedureBase';
import { IFsm } from 'db://assets/GameFramework/FSM/IFsm';
import { ProcedureManager } from 'db://assets/GameFramework/Procedure/ProcedureManager';
import { ProcedureMenu } from './ProcedureMenu';
import { ProcedureMain } from './ProcedureMain';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';

const MENU_SCENE_NAME = 'Menu';

export class ProcedureChangeScene extends ProcedureBase {
    private _complete = false;
    private _gotoMenu = false;

    onEnter(fsm: IFsm<ProcedureManager>): void {
        this._complete = false;
        this._gotoMenu = false;

        const nextScene = fsm.getData<string>('NextSceneName') ?? MENU_SCENE_NAME;
        fsm.removeData('NextSceneName');

        this._gotoMenu = nextScene === MENU_SCENE_NAME;

        GameEntry.Sound.stopAllLoadedSounds();

        GameEntry.Resource.loadScene(
            nextScene,
            (sceneAssetName, duration, _userData) => {
                GameFrameworkLog.info(`[ProcedureChangeScene] Scene '${sceneAssetName}' loaded in ${duration.toFixed(2)}s.`);
                this._complete = true;
            },
            (sceneAssetName, errorMessage, _userData) => {
                GameFrameworkLog.error(`[ProcedureChangeScene] Load scene '${sceneAssetName}' failure: ${errorMessage}`);
            },
            this
        );
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        if (!this._complete) return;

        if (this._gotoMenu) {
            this.changeState(fsm, ProcedureMenu);
        } else {
            this.changeState(fsm, ProcedureMain);
        }
    }
}
