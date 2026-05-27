import { ProcedureBase } from 'db://assets/GameFramework/Procedure/ProcedureBase';
import { IFsm } from 'db://assets/GameFramework/FSM/IFsm';
import { ProcedureManager } from 'db://assets/GameFramework/Procedure/ProcedureManager';
import { ProcedureMenu } from './ProcedureMenu';
import { ProcedureMain } from './ProcedureMain';
import { ProcedureFPS } from 'db://assets/Game/Scripts/FPS/Procedure/ProcedureFPS';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';

const MENU_SCENE_NAME = 'Menu';
const FPS_SCENE_NAME  = 'FPS';

export class ProcedureChangeScene extends ProcedureBase {
    private _complete = false;
    private _nextScene = MENU_SCENE_NAME;

    onEnter(fsm: IFsm<ProcedureManager>): void {
        this._complete = false;
        this._nextScene = fsm.getData<string>('NextSceneName') ?? MENU_SCENE_NAME;
        fsm.removeData('NextSceneName');

        GameEntry.Sound.stopAllLoadedSounds();

        GameEntry.Resource.loadScene(
            this._nextScene,
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

        switch (this._nextScene) {
            case MENU_SCENE_NAME:
                this.changeState(fsm, ProcedureMenu);
                break;
            case FPS_SCENE_NAME:
                this.changeState(fsm, ProcedureFPS);
                break;
            default:
                this.changeState(fsm, ProcedureMain);
                break;
        }
    }
}
