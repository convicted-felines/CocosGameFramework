import { _decorator, Enum, game, native, sys } from 'cc';
import { GameFrameworkComponent } from './GameFrameworkComponent';
import { GameFrameworkLog } from '../../GameFramework/Base/Log/GameFrameworkLog';
import { GameEntry } from './GameEntry';
import { LogHelperBase } from '../Utility/LogHelperBase';
import { DefaultLogHelper } from '../Utility/DefaultLogHelper';
import { LogHelperType } from '../Utility/LogHelperType';
import { HelperRegistry } from '../Utility/HelperRegistry';
import { LanguageType } from './LanguageType';

const { ccclass, property } = _decorator;

/**
 * 框架基础组件，对应 UnityGameFramework 中的 BaseComponent。
 *
 * 职责：
 *  - 初始化日志辅助器（Inspector 下拉选择，可替换为自定义实现）
 *  - 设置目标帧率和屏幕常亮
 *  - 提供游戏速度控制（pauseGame / resumeGame / setGameSpeed）
 *
 * 放置位置：作为 GameEntry 的子节点，其 onLoad 早于 GameEntry 执行，
 * 保证日志和帧率在框架启动前就已就位。
 */
@ccclass('BaseComponent')
export class BaseComponent extends GameFrameworkComponent {
    
    @property({ type: Enum(LogHelperType), tooltip: '日志辅助器类型' })
    logHelperType: LogHelperType = LogHelperType.DefaultLogHelper;

    @property({ type: Enum(LanguageType), tooltip: '编辑器指定语言（仅编辑器内有效，SystemLanguage 表示跟随系统自动识别）' })
    editorLanguage: LanguageType = LanguageType.SystemLanguage;

    @property({ tooltip: '目标帧率，-1 表示不限制' })
    frameRate: number = 60;

    @property({ tooltip: '游戏初始速度（1 为正常，0 为暂停）', range: [0, 10, 0.1] })
    private _gameSpeed: number = 1;

    @property({ tooltip: '进入后台后是否继续运行' })
    runInBackground: boolean = true;

    @property({ tooltip: '是否防止屏幕熄灭' })
    neverSleep: boolean = true;

    // ---- 属性访问 ----

    get gameSpeed(): number { return this._gameSpeed; }
    get isGamePaused(): boolean { return this._gameSpeed <= 0; }
    get isNormalGameSpeed(): boolean { return this._gameSpeed === 1; }

    // ---- 生命周期 ----

    protected onLoad(): void {
        super.onLoad();

        const logHelper = HelperRegistry.createHelper(this.node, LogHelperType[this.logHelperType], DefaultLogHelper) as LogHelperBase;
        GameFrameworkLog.setLogHelper(logHelper);

        game.frameRate = this.frameRate;
        if (sys.isNative) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (native as any).device?.keepScreenOn(this.neverSleep);
        }

        GameEntry.setGameSpeed(this._gameSpeed);

        GameFrameworkLog.info('BaseComponent initialized.');
    }

    // ---- 游戏速度控制 ----

    setGameSpeed(speed: number): void {
        this._gameSpeed = Math.max(0, speed);
        GameEntry.setGameSpeed(this._gameSpeed);
    }

    pauseGame(): void {
        this.setGameSpeed(0);
    }

    resumeGame(): void {
        this.setGameSpeed(1);
    }

    resetNormalGameSpeed(): void {
        this.setGameSpeed(1);
    }
}
