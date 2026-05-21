import { ProcedureBase } from 'db://assets/GameFramework/Procedure/ProcedureBase';
import { IFsm } from 'db://assets/GameFramework/FSM/IFsm';
import { ProcedureManager } from 'db://assets/GameFramework/Procedure/ProcedureManager';
import { ProcedureSplash } from './ProcedureSplash';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { Constant } from 'db://assets/Game/Scripts/Definition/Constant';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';

export class ProcedureLaunch extends ProcedureBase {
    onEnter(_fsm: IFsm<ProcedureManager>): void {
        GameEntry.BuiltinData.initBuildInfo();
        GameEntry.BuiltinData.initDefaultDictionary(GameEntry.Localization);

        // 从持久化设置中恢复音量
        const musicMuted    = GameEntry.Setting.getBool(Constant.Setting.MusicMuted, false);
        const musicVolume   = GameEntry.Setting.getFloat(Constant.Setting.MusicVolume, 0.3);
        const soundMuted    = GameEntry.Setting.getBool(Constant.Setting.SoundMuted, false);
        const soundVolume   = GameEntry.Setting.getFloat(Constant.Setting.SoundVolume, 1.0);
        const uiSoundMuted  = GameEntry.Setting.getBool(Constant.Setting.UISoundMuted, false);
        const uiSoundVolume = GameEntry.Setting.getFloat(Constant.Setting.UISoundVolume, 1.0);

        GameEntry.Sound.setMuted('Music',   musicMuted);
        GameEntry.Sound.setMuted('Sound',   soundMuted);
        GameEntry.Sound.setMuted('UISound', uiSoundMuted);
        GameEntry.Sound.setVolume('Music',   musicVolume);
        GameEntry.Sound.setVolume('Sound',   soundVolume);
        GameEntry.Sound.setVolume('UISound', uiSoundVolume);

        GameFrameworkLog.info(
            `[ProcedureLaunch] v${GameEntry.BuiltinData.buildInfo?.gameVersion ?? '?'}, ` +
            `resVer=${GameEntry.BuiltinData.buildInfo?.internalResourceVersion ?? 0}`
        );
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        this.changeState(fsm, ProcedureSplash);
    }
}
