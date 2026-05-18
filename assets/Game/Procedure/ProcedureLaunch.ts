import { ProcedureBase } from '../../GameFramework/Procedure/ProcedureBase';
import { IFsm } from '../../GameFramework/FSM/IFsm';
import { ProcedureManager } from '../../GameFramework/Procedure/ProcedureManager';
import { ProcedurePreload } from './ProcedurePreload';

// 启动流程：执行一次性初始化（分析设备、加载基础配置）然后立即进入预加载
export class ProcedureLaunch extends ProcedureBase {
    onEnter(fsm: IFsm<ProcedureManager>): void {
        console.log('[Procedure] Launch: Enter');
        // 执行首帧初始化工作（同步）
    }

    onUpdate(fsm: IFsm<ProcedureManager>, elapseSeconds: number, _r: number): void {
        // 下一帧即切换，给引擎一帧时间完成初始化
        this.changeState(fsm, ProcedurePreload);
    }

    onLeave(fsm: IFsm<ProcedureManager>, isShutdown: boolean): void {
        console.log('[Procedure] Launch: Leave');
    }
}
