import { IDataNode } from './IDataNode';

export class DataNode implements IDataNode {
    private _name: string = '';
    private _data: any = null;
    private _parent: DataNode | null = null;
    private _children: DataNode[] = [];

    get name(): string { return this._name; }

    get fullName(): string {
        if (this._parent === null) return this._name;
        return `${this._parent.fullName}.${this._name}`;
    }

    get parent(): IDataNode | null { return this._parent; }

    get childCount(): number { return this._children.length; }

    static create(name: string, parent: DataNode | null): DataNode {
        const node = new DataNode();
        node._name = name;
        node._parent = parent;
        return node;
    }

    getData<T>(): T | null {
        return this._data as T | null;
    }

    setData<T>(data: T): void {
        this._data = data;
    }

    hasChild(indexOrName: number | string): boolean {
        return this.getChild(indexOrName) !== null;
    }

    getChild(indexOrName: number | string): IDataNode | null {
        if (typeof indexOrName === 'number') {
            const i = indexOrName;
            return (i >= 0 && i < this._children.length) ? this._children[i] : null;
        }
        for (const child of this._children) {
            if (child._name === indexOrName) return child;
        }
        return null;
    }

    getOrAddChild(name: string): IDataNode {
        const existing = this.getChild(name);
        if (existing !== null) return existing;
        const child = DataNode.create(name, this);
        this._children.push(child);
        return child;
    }

    getAllChildren(): IDataNode[] {
        return this._children.slice();
    }

    removeChild(indexOrName: number | string): void {
        if (typeof indexOrName === 'number') {
            const i = indexOrName;
            if (i >= 0 && i < this._children.length) {
                this._children[i].clear();
                this._children.splice(i, 1);
            }
        } else {
            const idx = this._children.findIndex(c => c._name === indexOrName);
            if (idx >= 0) {
                this._children[idx].clear();
                this._children.splice(idx, 1);
            }
        }
    }

    clear(): void {
        this._data = null;
        for (const child of this._children) {
            child.clear();
        }
        this._children.length = 0;
    }

    toDataString(): string {
        return this._data !== null ? String(this._data) : '';
    }

    toString(): string {
        return `[DataNode] ${this.fullName} = ${this.toDataString()} (children: ${this._children.length})`;
    }
}
