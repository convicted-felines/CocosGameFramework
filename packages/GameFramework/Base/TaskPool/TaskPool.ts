import { GameFrameworkLinkedList, LinkedListNode } from '../DataStruct/GameFrameworkLinkedList';
import { ITaskAgent } from './ITaskAgent';
import { TaskBase } from './TaskBase';
import { TaskInfo } from './TaskInfo';
import { TaskStatus } from './TaskStatus';
import { StartTaskStatus } from './StartTaskStatus';

export class TaskPool<T extends TaskBase> {
    private readonly _freeAgents: ITaskAgent<T>[] = [];
    private readonly _workingAgents = new GameFrameworkLinkedList<ITaskAgent<T>>();
    private readonly _waitingTasks = new GameFrameworkLinkedList<T>();

    private _paused: boolean = false;

    get paused(): boolean { return this._paused; }
    set paused(value: boolean) { this._paused = value; }

    get totalAgentCount(): number { return this._freeAgents.length + this._workingAgents.count; }
    get freeAgentCount(): number { return this._freeAgents.length; }
    get workingAgentCount(): number { return this._workingAgents.count; }
    get waitingTaskCount(): number { return this._waitingTasks.count; }

    addAgent(agent: ITaskAgent<T>): void {
        agent.initialize();
        this._freeAgents.push(agent);
    }

    addTask(task: T): void {
        // 按优先级降序插入：优先级相同则排在后面（稳定）
        let node = this._waitingTasks.last;
        while (node !== null && task.priority > node.value.priority) {
            node = node.prev;
        }
        if (node === null) {
            this._waitingTasks.addFirst(task);
        } else {
            this._waitingTasks.addAfter(node, task);
        }
    }

    update(elapseSeconds: number, realElapseSeconds: number): void {
        if (this._paused) return;
        this._processWorkingAgents(elapseSeconds, realElapseSeconds);
        this._processWaitingTasks(elapseSeconds, realElapseSeconds);
    }

    removeTask(serialId: number): boolean {
        // 先在等待队列中查找
        let node = this._waitingTasks.first;
        while (node) {
            if (node.value.serialId === serialId) {
                this._waitingTasks.remove(node);
                return true;
            }
            node = node.next;
        }
        // 再在工作代理中查找
        let agentNode = this._workingAgents.first;
        while (agentNode) {
            if (agentNode.value.task?.serialId === serialId) {
                agentNode.value.reset();
                this._freeAgents.push(agentNode.value);
                this._workingAgents.remove(agentNode);
                return true;
            }
            agentNode = agentNode.next;
        }
        return false;
    }

    removeTasks(tag: string): number {
        let count = 0;
        let node = this._waitingTasks.first;
        while (node) {
            const next = node.next;
            if (node.value.tag === tag) {
                this._waitingTasks.remove(node);
                count++;
            }
            node = next;
        }
        let agentNode = this._workingAgents.first;
        while (agentNode) {
            const next = agentNode.next;
            if (agentNode.value.task?.tag === tag) {
                agentNode.value.reset();
                this._freeAgents.push(agentNode.value);
                this._workingAgents.remove(agentNode);
                count++;
            }
            agentNode = next;
        }
        return count;
    }

    removeAllTasks(): void {
        this._waitingTasks.clear();
        let agentNode = this._workingAgents.first;
        while (agentNode) {
            agentNode.value.reset();
            this._freeAgents.push(agentNode.value);
            agentNode = agentNode.next;
        }
        this._workingAgents.clear();
    }

    getTaskInfos(): TaskInfo[] {
        const infos: TaskInfo[] = [];
        let agentNode = this._workingAgents.first;
        while (agentNode) {
            const t = agentNode.value.task!;
            infos.push(new TaskInfo(t.serialId, t.tag, t.priority, t.userData, t.status, t.description));
            agentNode = agentNode.next;
        }
        let taskNode = this._waitingTasks.first;
        while (taskNode) {
            const t = taskNode.value;
            infos.push(new TaskInfo(t.serialId, t.tag, t.priority, t.userData, t.status, t.description));
            taskNode = taskNode.next;
        }
        return infos;
    }

    shutdown(): void {
        this.removeAllTasks();
        while (this._freeAgents.length > 0) {
            this._freeAgents.pop()!.shutdown();
        }
        this._workingAgents.clear();
    }

    private _processWorkingAgents(elapseSeconds: number, realElapseSeconds: number): void {
        let node: LinkedListNode<ITaskAgent<T>> | null = this._workingAgents.first;
        while (node) {
            const agent = node.value;
            const next = node.next;
            agent.update(elapseSeconds, realElapseSeconds);
            if (agent.task?.done) {
                agent.reset();
                this._freeAgents.push(agent);
                this._workingAgents.remove(node);
            }
            node = next;
        }
    }

    private _processWaitingTasks(_elapseSeconds: number, _realElapseSeconds: number): void {
        let taskNode = this._waitingTasks.first;
        while (taskNode && this._freeAgents.length > 0) {
            const agent = this._freeAgents.pop()!;
            const task = taskNode.value;
            const nextTaskNode = taskNode.next;

            const status = agent.start(task);

            // 是否将代理移入工作列表
            if (status === StartTaskStatus.CanResume) {
                this._workingAgents.addLast(agent);
            } else {
                agent.reset();
                this._freeAgents.push(agent);
            }

            // 是否从等待队列移除任务
            if (status !== StartTaskStatus.HasToWait) {
                this._waitingTasks.remove(taskNode);
            }

            taskNode = nextTaskNode;
        }
    }
}
