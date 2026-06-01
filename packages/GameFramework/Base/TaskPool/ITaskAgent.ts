import { StartTaskStatus } from './StartTaskStatus';
import { TaskBase } from './TaskBase';

export interface ITaskAgent<T extends TaskBase> {
    readonly task: T | null;
    initialize(): void;
    update(elapseSeconds: number, realElapseSeconds: number): void;
    shutdown(): void;
    start(task: T): StartTaskStatus;
    reset(): void;
}
