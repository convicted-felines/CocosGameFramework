export abstract class GameFrameworkModule {

    get priority(): number {
        return 0;
    }

    abstract update(elapseSeconds: number, realElapseSeconds: number): void;

    abstract shutdown(): void;
}
