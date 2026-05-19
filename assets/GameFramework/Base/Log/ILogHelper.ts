import { GameFrameworkLogLevel } from './GameFrameworkLogLevel';

export interface ILogHelper {
    log(level: GameFrameworkLogLevel, message: unknown): void;
}
