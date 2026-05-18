import { ProcedureBase } from '../../GameFramework/Procedure/ProcedureBase';
import { IFsm } from '../../GameFramework/FSM/IFsm';
import { ProcedureManager } from '../../GameFramework/Procedure/ProcedureManager';
import { ProcedureMain } from './ProcedureMain';

// 预加载流程：加载 resources Bundle 和必要配置表，完成后进入主流程
export class ProcedurePreload extends ProcedureBase {
    private _loadComplete: boolean = false;

    onEnter(fsm: IFsm<ProcedureManager>): void {
        console.log('[Procedure] Preload: Enter — loading resources...');
        this._loadComplete = false;

        // 示例：在此加载 resources Bundle
        // GameEntry.Resource.loadBundle('resources', () => {
        //     this._loadComplete = true;
        // });

        // Phase 1 骨架阶段直接设为完成
        this._loadComplete = true;
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        if (this._loadComplete) {
            this.changeState(fsm, ProcedureMain);
        }
    }

    onLeave(fsm: IFsm<ProcedureManager>, isShutdown: boolean): void {
        console.log('[Procedure] Preload: Leave');
    }
}
