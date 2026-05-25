import { _decorator } from 'cc';
import { GameFrameworkLogLevel } from '../../GameFramework/Base/Log/GameFrameworkLogLevel';
import { LogHelperBase } from './LogHelperBase';
import { HelperRegistry } from './HelperRegistry';

const { ccclass } = _decorator;

/**
 * 默认日志辅助器，直接输出到 Cocos 控制台。
 */
@ccclass('DefaultLogHelper')
export class DefaultLogHelper extends LogHelperBase {
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

HelperRegistry.register('DefaultLogHelper', DefaultLogHelper);
