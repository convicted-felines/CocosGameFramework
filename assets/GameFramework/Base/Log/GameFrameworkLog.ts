import { GameFrameworkLogLevel } from './GameFrameworkLogLevel';
import { ILogHelper } from './ILogHelper';

export class GameFrameworkLog {
    private static _logHelper: ILogHelper | null = null;

    static setLogHelper(logHelper: ILogHelper): void {
        this._logHelper = logHelper;
    }

    static debug(message: unknown): void {
        this._logHelper?.log(GameFrameworkLogLevel.Debug, message);
    }

    static info(message: unknown): void {
        this._logHelper?.log(GameFrameworkLogLevel.Info, message);
    }

    static warning(message: unknown): void {
        this._logHelper?.log(GameFrameworkLogLevel.Warning, message);
    }

    static error(message: unknown): void {
        this._logHelper?.log(GameFrameworkLogLevel.Error, message);
    }

    static fatal(message: unknown): void {
        this._logHelper?.log(GameFrameworkLogLevel.Fatal, message);
    }
}
