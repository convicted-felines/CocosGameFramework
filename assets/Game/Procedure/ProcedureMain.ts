import { ProcedureBase } from '../../GameFramework/Procedure/ProcedureBase';
import { IFsm } from '../../GameFramework/FSM/IFsm';
import { ProcedureManager } from '../../GameFramework/Procedure/ProcedureManager';

// 主游戏流程：游戏正式运行阶段
export class ProcedureMain extends ProcedureBase {
    onEnter(fsm: IFsm<ProcedureManager>): void {
        console.log('[Procedure] Main: Enter — game started!');

        // 示例：打开主界面 UI
        // GameEntry.UI.openUIForm('Prefabs/UI/MainUI', 'resources', 'Default', false);
    }

    onUpdate(fsm: IFsm<ProcedureManager>, elapseSeconds: number, realElapseSeconds: number): void {
        // 主流程常驻，通过事件或按钮触发子流程切换
    }

    onLeave(fsm: IFsm<ProcedureManager>, isShutdown: boolean): void {
        console.log('[Procedure] Main: Leave');
    }
}
