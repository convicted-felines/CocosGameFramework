import { GameFrameworkLogLevel } from './GameFrameworkLogLevel';
import { ILogHelper } from './ILogHelper';

export class GameFrameworkLog {
    private static _logHelper: ILogHelper | null = null;
    private static _logLevel: GameFrameworkLogLevel = GameFrameworkLogLevel.Debug;

    static setLogHelper(logHelper: ILogHelper): void {
        this._logHelper = logHelper;
    }

    static setLogLevel(level: GameFrameworkLogLevel): void {
        this._logLevel = level;
    }

    static getLogLevel(): GameFrameworkLogLevel {
        return this._logLevel;
    }

    // ---- Debug ----

    static debug(message: unknown): void;
    static debug(tag: string, message: unknown): void;
    static debug(format: string, ...args: unknown[]): void;
    static debug(tagOrMsg: unknown, ...rest: unknown[]): void {
        this._emit(GameFrameworkLogLevel.Debug, tagOrMsg, rest);
    }

    // ---- Info ----

    static info(message: unknown): void;
    static info(tag: string, message: unknown): void;
    static info(format: string, ...args: unknown[]): void;
    static info(tagOrMsg: unknown, ...rest: unknown[]): void {
        this._emit(GameFrameworkLogLevel.Info, tagOrMsg, rest);
    }

    // ---- Warning ----

    static warning(message: unknown): void;
    static warning(tag: string, message: unknown): void;
    static warning(format: string, ...args: unknown[]): void;
    static warning(tagOrMsg: unknown, ...rest: unknown[]): void {
        this._emit(GameFrameworkLogLevel.Warning, tagOrMsg, rest);
    }

    // ---- Error ----

    static error(message: unknown): void;
    static error(tag: string, message: unknown): void;
    static error(format: string, ...args: unknown[]): void;
    static error(tagOrMsg: unknown, ...rest: unknown[]): void {
        this._emit(GameFrameworkLogLevel.Error, tagOrMsg, rest);
    }

    // ---- Fatal ----

    static fatal(message: unknown): void;
    static fatal(tag: string, message: unknown): void;
    static fatal(format: string, ...args: unknown[]): void;
    static fatal(tagOrMsg: unknown, ...rest: unknown[]): void {
        this._emit(GameFrameworkLogLevel.Fatal, tagOrMsg, rest);
    }

    // ---- Internal ----

    private static _emit(level: GameFrameworkLogLevel, tagOrMsg: unknown, rest: unknown[]): void {
        if (!this._logHelper || level < this._logLevel) {
            return;
        }

        let tag = '';
        let message: string;

        if (rest.length === 0) {
            // debug(message)
            message = String(tagOrMsg);
        } else if (rest.length === 1 && typeof tagOrMsg === 'string' && !tagOrMsg.includes('{0}')) {
            // debug(tag, message)
            tag = tagOrMsg;
            message = String(rest[0]);
        } else {
            // debug(format, ...args)  — {0} {1} ... substitution
            message = GameFrameworkLog._format(String(tagOrMsg), rest);
        }

        this._logHelper.log(level, tag, message);
    }

    /** 简单的 {0} {1} ... 占位符替换。 */
    private static _format(format: string, args: unknown[]): string {
        return format.replace(/\{(\d+)\}/g, (_, i) => {
            const idx = Number(i);
            return idx < args.length ? String(args[idx]) : `{${i}}`;
        });
    }
}
