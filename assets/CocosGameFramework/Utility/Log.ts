import { GameFrameworkLog } from '../../GameFramework/Base/Log/GameFrameworkLog';
import { GameFrameworkLogLevel } from '../../GameFramework/Base/Log/GameFrameworkLogLevel';

/**
 * 业务层日志门面。所有日志从此处统一进入，内部转发给 GameFrameworkLog。
 *
 * 调用方式：
 *   Log.debug('消息')
 *   Log.info('MyTag', '消息')
 *   Log.warning('值为 {0}，期望 {1}', actual, expected)
 */
export class Log {
    static debug(message: unknown): void;
    static debug(tag: string, message: unknown): void;
    static debug(format: string, ...args: unknown[]): void;
    static debug(...args: unknown[]): void {
        (GameFrameworkLog.debug as (...a: unknown[]) => void)(...args);
    }

    static info(message: unknown): void;
    static info(tag: string, message: unknown): void;
    static info(format: string, ...args: unknown[]): void;
    static info(...args: unknown[]): void {
        (GameFrameworkLog.info as (...a: unknown[]) => void)(...args);
    }

    static warning(message: unknown): void;
    static warning(tag: string, message: unknown): void;
    static warning(format: string, ...args: unknown[]): void;
    static warning(...args: unknown[]): void {
        (GameFrameworkLog.warning as (...a: unknown[]) => void)(...args);
    }

    static error(message: unknown): void;
    static error(tag: string, message: unknown): void;
    static error(format: string, ...args: unknown[]): void;
    static error(...args: unknown[]): void {
        (GameFrameworkLog.error as (...a: unknown[]) => void)(...args);
    }

    static fatal(message: unknown): void;
    static fatal(tag: string, message: unknown): void;
    static fatal(format: string, ...args: unknown[]): void;
    static fatal(...args: unknown[]): void {
        (GameFrameworkLog.fatal as (...a: unknown[]) => void)(...args);
    }

    /** 运行时调整日志级别（低于此级别的日志不输出）。 */
    static setLevel(level: GameFrameworkLogLevel): void {
        GameFrameworkLog.setLogLevel(level);
    }
}
