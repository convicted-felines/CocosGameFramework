import { IDataNode } from './IDataNode';

export interface IDataNodeManager {
    readonly root: IDataNode;

    getData<T>(path: string, fromNode?: IDataNode): T | null;
    setData<T>(path: string, data: T, fromNode?: IDataNode): void;

    getNode(path: string, fromNode?: IDataNode): IDataNode | null;
    getOrAddNode(path: string, fromNode?: IDataNode): IDataNode;
    removeNode(path: string, fromNode?: IDataNode): void;

    clear(): void;
}
