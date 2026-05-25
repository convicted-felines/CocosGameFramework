import { _decorator, game, native, sys } from 'cc';
import { GameFrameworkComponent } from './GameFrameworkComponent';
import { GameFrameworkLog } from '../../GameFramework/Base/Log/GameFrameworkLog';
import { GameFrameworkLogLevel } from '../../GameFramework/Base/Log/GameFrameworkLogLevel';
import { ILogHelper } from '../../GameFramework/Base/Log/ILogHelper';
import { GameEntry } from './GameEntry';

const { ccclass, property } = _decorator;

/** 默认控制台日志助手，直接输出到 Cocos 控制台。 */
class DefaultLogHelper implements ILogHelper {
    log(level: GameFrameworkLogLevel, tag: string, message: string): void {
        const prefix = tag ? `[GF][${tag}]` : '[GF]';
        switch (level) {
            case GameFrameworkLogLevel.Debug:   console.debug(`${prefix} ${message}`); break;
            case GameFrameworkLogLevel.Info:    console.info(`${prefix} ${message}`);  break;
            case GameFrameworkLogLevel.Warning: console.warn(`${prefix} ${message}`);  break;
            case GameFrameworkLogLevel.Error:   console.error(`${prefix} ${message}`); break;
            case GameFrameworkLogLevel.Fatal:   console.error(`${prefix}[FATAL] ${message}`); break;
        }
    }
}

/**
 * 框架基础组件，对应 UnityGameFramework 中的 BaseComponent。
 *
 * 职责：
 *  - 初始化日志助手（可选使用内置控制台助手）
 *  - 设置目标帧率和屏幕常亮
 *  - 提供游戏速度控制（pauseGame / resumeGame / setGameSpeed）
 *
 * 放置位置：作为 GameEntry 的子节点，其 onLoad 早于 GameEntry 执行，
 * 保证日志和帧率在框架启动前就已就位。
 */
@ccclass('BaseComponent')
export class BaseComponent extends GameFrameworkComponent {
    @property({ tooltip: '目标帧率，-1 表示不限制' })
    frameRate: number = 60;

    @property({ tooltip: '游戏初始速度（1 为正常，0 为暂停）', range: [0, 10, 0.1] })
    private _gameSpeed: number = 1;

    @property({ tooltip: '进入后台后是否继续运行' })
    runInBackground: boolean = true;

    @property({ tooltip: '是否防止屏幕熄灭' })
    neverSleep: boolean = true;

    @property({ tooltip: '是否使用内置控制台日志助手' })
    useDefaultLogHelper: boolean = true;

    // ---- 属性访问 ----

    get gameSpeed(): number { return this._gameSpeed; }
    get isGamePaused(): boolean { return this._gameSpeed <= 0; }
    get isNormalGameSpeed(): boolean { return this._gameSpeed === 1; }

    // ---- 生命周期 ----

    protected onLoad(): void {
        super.onLoad();

        if (this.useDefaultLogHelper) {
            GameFrameworkLog.setLogHelper(new DefaultLogHelper());
        }

        game.frameRate = this.frameRate;
        if (sys.isNative) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (native as any).device?.keepScreenOn(this.neverSleep);
        }

        // 将初始速度同步给 GameEntry
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
