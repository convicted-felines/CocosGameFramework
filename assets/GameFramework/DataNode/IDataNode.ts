export interface IDataNode {
    readonly name: string;
    readonly fullName: string;
    readonly parent: IDataNode | null;
    readonly childCount: number;

    getData<T>(): T | null;
    setData<T>(data: T): void;

    hasChild(indexOrName: number | string): boolean;
    getChild(indexOrName: number | string): IDataNode | null;
    getOrAddChild(name: string): IDataNode;
    getAllChildren(): IDataNode[];
    removeChild(indexOrName: number | string): void;

    clear(): void;
    toDataString(): string;
}
