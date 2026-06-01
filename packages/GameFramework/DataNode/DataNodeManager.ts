import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { IDataNodeManager } from './IDataNodeManager';
import { IDataNode } from './IDataNode';
import { DataNode } from './DataNode';

const PATH_SPLIT = /[./\\]+/;
const ROOT_NAME = '<Root>';

export class DataNodeManager extends GameFrameworkModule implements IDataNodeManager {
    private _root: DataNode;

    get priority(): number { return 40; }

    constructor() {
        super();
        this._root = DataNode.create(ROOT_NAME, null);
    }

    get root(): IDataNode { return this._root; }

    getData<T>(path: string, fromNode?: IDataNode): T | null {
        const node = this.getNode(path, fromNode);
        return node ? node.getData<T>() : null;
    }

    setData<T>(path: string, data: T, fromNode?: IDataNode): void {
        this.getOrAddNode(path, fromNode).setData(data);
    }

    getNode(path: string, fromNode?: IDataNode): IDataNode | null {
        const parts = this._splitPath(path);
        if (parts.length === 0) return fromNode ?? this._root;
        let current: IDataNode = fromNode ?? this._root;
        for (const part of parts) {
            const child = current.getChild(part);
            if (child === null) return null;
            current = child;
        }
        return current;
    }

    getOrAddNode(path: string, fromNode?: IDataNode): IDataNode {
        const parts = this._splitPath(path);
        let current: IDataNode = fromNode ?? this._root;
        for (const part of parts) {
            current = current.getOrAddChild(part);
        }
        return current;
    }

    removeNode(path: string, fromNode?: IDataNode): void {
        const parts = this._splitPath(path);
        if (parts.length === 0) return;
        const parentParts = parts.slice(0, -1);
        const childName = parts[parts.length - 1];
        let parent: IDataNode | null = fromNode ?? this._root;
        for (const part of parentParts) {
            parent = parent.getChild(part);
            if (parent === null) return;
        }
        parent.removeChild(childName);
    }

    clear(): void {
        this._root.clear();
    }

    update(_elapseSeconds: number, _realElapseSeconds: number): void {}

    shutdown(): void {
        this._root.clear();
    }

    private _splitPath(path: string): string[] {
        if (!path) return [];
        return path.split(PATH_SPLIT).filter(p => p.length > 0);
    }
}
