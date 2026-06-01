export class GameFrameworkError extends Error {
    constructor(message: string) {
        super(`[GameFramework] ${message}`);
        this.name = 'GameFrameworkError';
    }
}
