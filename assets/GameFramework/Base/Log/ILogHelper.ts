import { GameFrameworkLogLevel } from './GameFrameworkLogLevel';

export interface ILogHelper {
    log(level: GameFrameworkLogLevel, tag: string, message: string): void;
}
