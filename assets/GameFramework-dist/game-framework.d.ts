declare abstract class GameFrameworkModule {
    get priority(): number;
    abstract update(elapseSeconds: number, realElapseSeconds: number): void;
    abstract shutdown(): void;
}

declare class GameFrameworkEntry {
    private static _moduleMap;
    private static _head;
    static getModule<T extends GameFrameworkModule>(ctor: new () => T, moduleId: string): T;
    static registerModule(moduleId: string, module: GameFrameworkModule): void;
    static update(elapseSeconds: number, realElapseSeconds: number): void;
    static shutdown(): void;
    static hasModule(moduleId: string): boolean;
    private static _insertModuleSorted;
}

declare class GameFrameworkError extends Error {
    constructor(message: string);
}

declare const MODULE_ID: {
    readonly EVENT: "GameFramework.IEventManager";
    readonly FSM: "GameFramework.IFsmManager";
    readonly PROCEDURE: "GameFramework.IProcedureManager";
    readonly SETTING: "GameFramework.ISettingManager";
    readonly CONFIG: "GameFramework.IConfigManager";
    readonly DATATABLE: "GameFramework.IDataTableManager";
    readonly RESOURCE: "GameFramework.IResourceManager";
    readonly OBJPOOL: "GameFramework.IObjectPoolManager";
    readonly UI: "GameFramework.IUIManager";
    readonly ENTITY: "GameFramework.IEntityManager";
    readonly SOUND: "GameFramework.ISoundManager";
    readonly SCENE: "GameFramework.ISceneManager";
    readonly NETWORK: "GameFramework.INetworkManager";
    readonly LOCALIZATION: "GameFramework.ILocalizationManager";
    readonly DOWNLOAD: "GameFramework.IDownloadManager";
    readonly WEBREQUEST: "GameFramework.IWebRequestManager";
    readonly DATANODE: "GameFramework.IDataNodeManager";
    readonly FILESYSTEM: "GameFramework.IFileSystemManager";
};
type ModuleId = typeof MODULE_ID[keyof typeof MODULE_ID];

declare class LinkedListNode<T> {
    value: T;
    prev: LinkedListNode<T> | null;
    next: LinkedListNode<T> | null;
    constructor(value: T);
}
declare class GameFrameworkLinkedList<T> {
    private _head;
    private _tail;
    private _count;
    private _cachedNodes;
    get count(): number;
    get first(): LinkedListNode<T> | null;
    get last(): LinkedListNode<T> | null;
    get cachedNodeCount(): number;
    private acquireNode;
    private releaseNode;
    addFirst(value: T): LinkedListNode<T>;
    addLast(value: T): LinkedListNode<T>;
    addBefore(refNode: LinkedListNode<T>, value: T): LinkedListNode<T>;
    addAfter(refNode: LinkedListNode<T>, value: T): LinkedListNode<T>;
    remove(node: LinkedListNode<T>): void;
    removeFirst(): void;
    removeLast(): void;
    find(value: T): LinkedListNode<T> | null;
    contains(value: T): boolean;
    clear(): void;
    clearCachedNodes(): void;
    [Symbol.iterator](): Iterator<T>;
}

/**
 * 表示链表中 [first, terminal) 区间的一段连续节点。
 * terminal 为哨兵节点，自身不存储有效数据。
 */
declare class GameFrameworkLinkedListRange<T> {
    readonly first: LinkedListNode<T>;
    readonly terminal: LinkedListNode<T>;
    constructor(first: LinkedListNode<T>, terminal: LinkedListNode<T>);
    get isValid(): boolean;
    get count(): number;
    contains(value: T): boolean;
    [Symbol.iterator](): Iterator<T>;
}

/**
 * 一键多值字典。每个键对应链表中连续的一段节点（不含尾哨兵）。
 * 内部维护一条共享链表，各键的数据段之间用独立的哨兵节点分隔。
 */
declare class GameFrameworkMultiDictionary<TKey, TValue> {
    private readonly _linkedList;
    private readonly _map;
    get count(): number;
    containsKey(key: TKey): boolean;
    contains(key: TKey, value: TValue): boolean;
    /** 获取 key 对应的范围快照（不存在或为空时返回 undefined）。 */
    get(key: TKey): GameFrameworkLinkedListRange<TValue> | undefined;
    add(key: TKey, value: TValue): void;
    remove(key: TKey, value: TValue): boolean;
    removeAll(key: TKey): boolean;
    clear(): void;
    [Symbol.iterator](): IterableIterator<[TKey, GameFrameworkLinkedListRange<TValue>]>;
}

declare enum GameFrameworkLogLevel {
    Debug = 0,
    Info = 1,
    Warning = 2,
    Error = 3,
    Fatal = 4
}

interface ILogHelper {
    log(level: GameFrameworkLogLevel, tag: string, message: string): void;
}

declare class GameFrameworkLog {
    private static _logHelper;
    private static _logLevel;
    static setLogHelper(logHelper: ILogHelper): void;
    static setLogLevel(level: GameFrameworkLogLevel): void;
    static getLogLevel(): GameFrameworkLogLevel;
    static debug(message: unknown): void;
    static debug(tag: string, message: unknown): void;
    static debug(format: string, ...args: unknown[]): void;
    static info(message: unknown): void;
    static info(tag: string, message: unknown): void;
    static info(format: string, ...args: unknown[]): void;
    static warning(message: unknown): void;
    static warning(tag: string, message: unknown): void;
    static warning(format: string, ...args: unknown[]): void;
    static error(message: unknown): void;
    static error(tag: string, message: unknown): void;
    static error(format: string, ...args: unknown[]): void;
    static fatal(message: unknown): void;
    static fatal(tag: string, message: unknown): void;
    static fatal(format: string, ...args: unknown[]): void;
    private static _emit;
    /** 简单的 {0} {1} ... 占位符替换。 */
    private static _format;
}

declare enum StartTaskStatus {
    /** 任务可立即完成，代理可立即释放。 */
    Done = 0,
    /** 任务正在进行，代理继续持有。 */
    CanResume = 1,
    /** 任务需等待其他任务完成后再处理。 */
    HasToWait = 2,
    /** 发生未知错误，任务和代理均释放。 */
    UnknownError = 3
}

declare enum TaskStatus {
    Todo = 0,
    Doing = 1,
    Done = 2
}

declare abstract class TaskBase {
    static readonly DEFAULT_PRIORITY = 0;
    private _serialId;
    private _tag;
    private _priority;
    private _userData;
    status: TaskStatus;
    get serialId(): number;
    get tag(): string;
    get priority(): number;
    get userData(): unknown;
    get done(): boolean;
    get description(): string | null;
    initialize(tag: string, priority: number, userData: unknown): void;
    clear(): void;
}

interface ITaskAgent<T extends TaskBase> {
    readonly task: T | null;
    initialize(): void;
    update(elapseSeconds: number, realElapseSeconds: number): void;
    shutdown(): void;
    start(task: T): StartTaskStatus;
    reset(): void;
}

declare class TaskInfo {
    private readonly _isValid;
    private readonly _serialId;
    private readonly _tag;
    private readonly _priority;
    private readonly _userData;
    private readonly _status;
    private readonly _description;
    constructor(serialId: number, tag: string, priority: number, userData: unknown, status: TaskStatus, description: string | null);
    get isValid(): boolean;
    get serialId(): number;
    get tag(): string;
    get priority(): number;
    get userData(): unknown;
    get status(): TaskStatus;
    get description(): string | null;
}

declare class TaskPool<T extends TaskBase> {
    private readonly _freeAgents;
    private readonly _workingAgents;
    private readonly _waitingTasks;
    private _paused;
    get paused(): boolean;
    set paused(value: boolean);
    get totalAgentCount(): number;
    get freeAgentCount(): number;
    get workingAgentCount(): number;
    get waitingTaskCount(): number;
    addAgent(agent: ITaskAgent<T>): void;
    addTask(task: T): void;
    update(elapseSeconds: number, realElapseSeconds: number): void;
    removeTask(serialId: number): boolean;
    removeTasks(tag: string): number;
    removeAllTasks(): void;
    getTaskInfos(): TaskInfo[];
    shutdown(): void;
    private _processWorkingAgents;
    private _processWaitingTasks;
}

interface IConfigHelper {
    /**
     * 从文本解析配置，调用 addConfig 写入配置管理器。
     * @param configString 配置文件文本内容
     * @param userData     透传用户数据
     */
    parseData(configString: string, userData?: any): boolean;
}

interface IConfigManager {
    readonly count: number;
    setConfigHelper(helper: IConfigHelper): void;
    /**
     * 直接从字符串内容解析配置（由 Helper 实现具体格式）。
     */
    parseData(configString: string, userData?: any): boolean;
    hasConfig(configName: string): boolean;
    addConfig(configName: string, configValue: string): boolean;
    removeConfig(configName: string): boolean;
    removeAllConfigs(): void;
    getBool(configName: string, defaultValue?: boolean): boolean;
    getInt(configName: string, defaultValue?: number): number;
    getFloat(configName: string, defaultValue?: number): number;
    getString(configName: string, defaultValue?: string): string;
}

declare class ConfigManager extends GameFrameworkModule implements IConfigManager {
    private _helper;
    private readonly _configs;
    get priority(): number;
    get count(): number;
    setConfigHelper(helper: IConfigHelper): void;
    parseData(configString: string, userData?: any): boolean;
    hasConfig(configName: string): boolean;
    addConfig(configName: string, configValue: string): boolean;
    removeConfig(configName: string): boolean;
    removeAllConfigs(): void;
    getBool(configName: string, defaultValue?: boolean): boolean;
    getInt(configName: string, defaultValue?: number): number;
    getFloat(configName: string, defaultValue?: number): number;
    getString(configName: string, defaultValue?: string): string;
    update(_elapseSeconds: number, _realElapseSeconds: number): void;
    shutdown(): void;
    private _checkName;
}

interface IDataNode {
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

declare class DataNode implements IDataNode {
    private _name;
    private _data;
    private _parent;
    private _children;
    get name(): string;
    get fullName(): string;
    get parent(): IDataNode | null;
    get childCount(): number;
    static create(name: string, parent: DataNode | null): DataNode;
    getData<T>(): T | null;
    setData<T>(data: T): void;
    hasChild(indexOrName: number | string): boolean;
    getChild(indexOrName: number | string): IDataNode | null;
    getOrAddChild(name: string): IDataNode;
    getAllChildren(): IDataNode[];
    removeChild(indexOrName: number | string): void;
    clear(): void;
    toDataString(): string;
    toString(): string;
}

interface IDataNodeManager {
    readonly root: IDataNode;
    getData<T>(path: string, fromNode?: IDataNode): T | null;
    setData<T>(path: string, data: T, fromNode?: IDataNode): void;
    getNode(path: string, fromNode?: IDataNode): IDataNode | null;
    getOrAddNode(path: string, fromNode?: IDataNode): IDataNode;
    removeNode(path: string, fromNode?: IDataNode): void;
    clear(): void;
}

declare class DataNodeManager extends GameFrameworkModule implements IDataNodeManager {
    private _root;
    get priority(): number;
    constructor();
    get root(): IDataNode;
    getData<T>(path: string, fromNode?: IDataNode): T | null;
    setData<T>(path: string, data: T, fromNode?: IDataNode): void;
    getNode(path: string, fromNode?: IDataNode): IDataNode | null;
    getOrAddNode(path: string, fromNode?: IDataNode): IDataNode;
    removeNode(path: string, fromNode?: IDataNode): void;
    clear(): void;
    update(_elapseSeconds: number, _realElapseSeconds: number): void;
    shutdown(): void;
    private _splitPath;
}

interface IDataRow {
    readonly id: number;
    parseDataRow(dataRowString: string, userData?: any): boolean;
}

interface IDataTable<T extends IDataRow> {
    readonly name: string;
    readonly count: number;
    /** 编号最小的行，表为空时返回 null */
    readonly minIdDataRow: T | null;
    /** 编号最大的行，表为空时返回 null */
    readonly maxIdDataRow: T | null;
    hasDataRow(id: number): boolean;
    hasDataRow(condition: (row: T) => boolean): boolean;
    getDataRow(id: number): T | null;
    getDataRow(condition: (row: T) => boolean): T | null;
    /** 按条件过滤 */
    getDataRows(condition: (row: T) => boolean): T[];
    getDataRowsInto(condition: (row: T) => boolean, results: T[]): void;
    /** 按比较器排序（全部行） */
    getDataRowsSorted(comparison: (a: T, b: T) => number): T[];
    getDataRowsSortedInto(comparison: (a: T, b: T) => number, results: T[]): void;
    /** 过滤 + 排序 */
    getDataRowsFiltered(condition: (row: T) => boolean, comparison: (a: T, b: T) => number): T[];
    getDataRowsFilteredInto(condition: (row: T) => boolean, comparison: (a: T, b: T) => number, results: T[]): void;
    getAllDataRows(): T[];
    getAllDataRowsInto(results: T[]): void;
    addDataRow(dataRowString: string, userData?: any): boolean;
    removeDataRow(id: number): boolean;
    removeAllDataRows(): void;
    parseData(dataTableString: string, userData?: any): boolean;
    [Symbol.iterator](): Iterator<T>;
}

declare class DataTable<T extends IDataRow> implements IDataTable<T> {
    private readonly _name;
    private readonly _rowType;
    private readonly _rows;
    private _minIdDataRow;
    private _maxIdDataRow;
    constructor(name: string, rowType: new () => T);
    get name(): string;
    get count(): number;
    get minIdDataRow(): T | null;
    get maxIdDataRow(): T | null;
    hasDataRow(idOrCondition: number | ((row: T) => boolean)): boolean;
    getDataRow(idOrCondition: number | ((row: T) => boolean)): T | null;
    getDataRows(condition: (row: T) => boolean): T[];
    getDataRowsInto(condition: (row: T) => boolean, results: T[]): void;
    getDataRowsSorted(comparison: (a: T, b: T) => number): T[];
    getDataRowsSortedInto(comparison: (a: T, b: T) => number, results: T[]): void;
    getDataRowsFiltered(condition: (row: T) => boolean, comparison: (a: T, b: T) => number): T[];
    getDataRowsFilteredInto(condition: (row: T) => boolean, comparison: (a: T, b: T) => number, results: T[]): void;
    getAllDataRows(): T[];
    getAllDataRowsInto(results: T[]): void;
    addDataRow(dataRowString: string, userData?: any): boolean;
    removeDataRow(id: number): boolean;
    removeAllDataRows(): void;
    parseData(dataTableString: string, userData?: any): boolean;
    [Symbol.iterator](): Iterator<T>;
    private _updateMinMax;
    private _recalcMinMax;
    shutdown(): void;
}

interface IDataTableManager {
    readonly count: number;
    /** 以行类型构造函数为 key，可选附带名称 */
    hasDataTable<T extends IDataRow>(rowType: new () => T, name?: string): boolean;
    getDataTable<T extends IDataRow>(rowType: new () => T, name?: string): IDataTable<T> | null;
    getAllDataTables(): IDataTable<any>[];
    createDataTable<T extends IDataRow>(rowType: new () => T, name?: string): IDataTable<T>;
    destroyDataTable<T extends IDataRow>(rowType: new () => T, name?: string): boolean;
    destroyDataTable<T extends IDataRow>(dataTable: IDataTable<T>): boolean;
}

declare class DataTableManager extends GameFrameworkModule implements IDataTableManager {
    private readonly _tables;
    get priority(): number;
    get count(): number;
    hasDataTable<T extends IDataRow>(rowType: new () => T, name?: string): boolean;
    getDataTable<T extends IDataRow>(rowType: new () => T, name?: string): IDataTable<T> | null;
    getAllDataTables(): IDataTable<any>[];
    createDataTable<T extends IDataRow>(rowType: new () => T, name?: string): IDataTable<T>;
    destroyDataTable<T extends IDataRow>(rowTypeOrTable: (new () => T) | IDataTable<T>, name?: string): boolean;
    update(_e: number, _r: number): void;
    shutdown(): void;
}

/**
 * 数据表辅助器接口。
 *
 * 负责将原始文本解析为数据行并写入数据表，以及释放数据表资产。
 * 通过替换辅助器实现可以支持不同的文本格式（Tab 分隔、CSV、JSON 等）。
 */
interface IDataTableHelper {
    /**
     * 解析数据表文本，将所有行写入目标数据表。
     * @param dataTable        目标数据表
     * @param dataTableString  原始文本内容
     * @param userData         透传用户数据
     */
    parseData<T extends IDataRow>(dataTable: IDataTable<T>, dataTableString: string, userData?: any): boolean;
    /**
     * 释放数据表资产（如 TextAsset）。
     * @param dataTable      拥有该资产的数据表
     * @param dataTableAsset 待释放资产对象
     */
    releaseDataAsset<T extends IDataRow>(dataTable: IDataTable<T>, dataTableAsset: object): void;
}

interface IReference {
    clear(): void;
}

declare abstract class BaseEventArgs implements IReference {
    abstract get id(): string;
    abstract clear(): void;
}

declare class DownloadStartEventArgs extends BaseEventArgs {
    static readonly eventId = "download.start";
    get id(): string;
    serialId: number;
    downloadPath: string;
    downloadUri: string;
    currentLength: number;
    userData?: object;
    static create(serialId: number, downloadPath: string, downloadUri: string, currentLength: number, userData?: object): DownloadStartEventArgs;
    clear(): void;
}
declare class DownloadUpdateEventArgs extends BaseEventArgs {
    static readonly eventId = "download.update";
    get id(): string;
    serialId: number;
    downloadPath: string;
    downloadUri: string;
    currentLength: number;
    userData?: object;
    static create(serialId: number, downloadPath: string, downloadUri: string, currentLength: number, userData?: object): DownloadUpdateEventArgs;
    clear(): void;
}
declare class DownloadSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "download.success";
    get id(): string;
    serialId: number;
    downloadPath: string;
    downloadUri: string;
    currentLength: number;
    /** 完整下载内容（包含断点续传的新增部分） */
    data: ArrayBuffer;
    userData?: object;
    static create(serialId: number, downloadPath: string, downloadUri: string, currentLength: number, data: ArrayBuffer, userData?: object): DownloadSuccessEventArgs;
    clear(): void;
}
declare class DownloadFailureEventArgs extends BaseEventArgs {
    static readonly eventId = "download.failure";
    get id(): string;
    serialId: number;
    downloadPath: string;
    downloadUri: string;
    errorMessage: string;
    userData?: object;
    static create(serialId: number, downloadPath: string, downloadUri: string, errorMessage: string, userData?: object): DownloadFailureEventArgs;
    clear(): void;
}

type EventHandler = (sender: object, e: BaseEventArgs) => void;
/** 事件池模式，可按位组合 */
declare enum EventPoolMode {
    Default = 0,
    AllowNoHandler = 1,// 允许事件没有处理函数
    AllowMultiHandler = 2,// 允许事件有多个处理函数
    AllowDuplicateHandler = 4
}
interface IEventManager {
    readonly eventHandlerCount: number;
    /** 当前待派发的延迟事件数量 */
    readonly eventCount: number;
    /** 已注册的事件类型数量 */
    readonly registeredEventCount: number;
    /** 获取特定事件 ID 的处理函数数量 */
    count(eventId: string): number;
    /** 检查是否已订阅特定处理函数 */
    check(eventId: string, handler: EventHandler): boolean;
    subscribe(eventId: string, handler: EventHandler, priority?: number): void;
    unsubscribe(eventId: string, handler: EventHandler): void;
    unsubscribeAll(eventId: string): void;
    hasSubscriber(eventId: string, handler?: EventHandler): boolean;
    /** 延迟到下一帧 update() 派发，派发后自动释放回引用池 */
    fire(sender: object, e: BaseEventArgs): void;
    /** 立即派发，派发后自动释放回引用池 */
    fireNow(sender: object, e: BaseEventArgs): void;
    /** 清空所有待派发的延迟事件并释放回引用池 */
    clear(): void;
    setDefaultHandler(handler: EventHandler | null): void;
}

/**
 * 下载代理辅助器接口。
 *
 * 负责执行单次 HTTP 下载，将进度/成功/失败通过回调通知调用方。
 * 通过实现此接口可替换底层网络层（XHR、jsb.fileDownloader、自定义协议等）。
 */
interface IDownloadAgentHelper {
    /**
     * 开始下载。
     * @param downloadUri   下载地址
     * @param fromPosition  断点续传起始字节偏移，0 表示全量下载
     * @param timeout       超时时长（秒）
     * @param onStart       下载开始时回调
     * @param onProgress    进度更新回调，deltaBytes = 本次新增字节数，currentLength = 当前已收到总字节数
     * @param onSuccess     下载成功回调，data = 本次收到的完整内容
     * @param onFailure     下载失败回调，errorMessage = 错误描述
     */
    download(downloadUri: string, fromPosition: number, timeout: number, onStart: () => void, onProgress: (deltaBytes: number, currentLength: number) => void, onSuccess: (data: ArrayBuffer) => void, onFailure: (errorMessage: string) => void): void;
    /** 取消当前下载 */
    cancel(): void;
}

interface IDownloadInfo {
    readonly serialId: number;
    readonly downloadPath: string;
    readonly downloadUri: string;
    readonly tag: string;
    readonly priority: number;
    readonly userData?: object;
}
interface IDownloadParams {
    tag?: string;
    priority?: number;
    /** 断点续传起始字节偏移 */
    fromPosition?: number;
    userData?: object;
}
interface IDownloadManager {
    /** 是否暂停下载 */
    paused: boolean;
    /** 下载代理总数 */
    readonly totalAgentCount: number;
    /** 空闲下载代理数 */
    readonly freeAgentCount: number;
    /** 工作中下载代理数 */
    readonly workingAgentCount: number;
    /** 等待下载任务数 */
    readonly waitingTaskCount: number;
    /** 超时时长（秒） */
    timeout: number;
    /** 将缓冲区写入磁盘的字节阈值（0 = 下载完成后一次性写入） */
    flushSize: number;
    /** 当前下载速度（字节/秒） */
    readonly currentSpeed: number;
    addDownload(downloadPath: string, downloadUri: string, params?: IDownloadParams): number;
    removeDownload(serialId: number): boolean;
    removeDownloads(tag: string): number;
    removeAllDownloads(): void;
    getDownloadInfo(serialId: number): IDownloadInfo | null;
    getDownloadInfosByTag(tag: string): IDownloadInfo[];
    getAllDownloadInfos(): IDownloadInfo[];
}

declare enum DownloadTaskStatus {
    Todo = 0,
    Doing = 1,
    Done = 2,
    Error = 3
}
declare class DownloadTask implements IDownloadInfo {
    private static _serial;
    readonly serialId: number;
    readonly downloadPath: string;
    readonly downloadUri: string;
    readonly tag: string;
    readonly priority: number;
    /** 断点续传起始字节偏移 */
    readonly fromPosition: number;
    readonly userData?: object;
    status: DownloadTaskStatus;
    downloadedLength: number;
    constructor(downloadPath: string, downloadUri: string, tag: string, priority: number, fromPosition: number, userData?: object);
}
declare class DownloadManager extends GameFrameworkModule implements IDownloadManager {
    protected _eventManager: IEventManager | null;
    private _waitingTasks;
    private _workingTasks;
    /** serialId → 正在使用的辅助器实例 */
    private _workingHelpers;
    /** 空闲辅助器池（由 addDownloadAgentHelper 注入） */
    private _freeHelpers;
    private _paused;
    private _timeout;
    /** 分块写盘阈值（字节），0 = 下载完成后一次性写入 */
    private _flushSize;
    private _counter;
    private _elapsedSeconds;
    get priority(): number;
    get paused(): boolean;
    set paused(value: boolean);
    get timeout(): number;
    set timeout(value: number);
    get flushSize(): number;
    set flushSize(value: number);
    get totalAgentCount(): number;
    get freeAgentCount(): number;
    get workingAgentCount(): number;
    get waitingTaskCount(): number;
    get currentSpeed(): number;
    setEventManager(eventManager: IEventManager): void;
    /** 注入一个辅助器实例（由 CocosDownloadManager 根据编辑器配置创建并注入） */
    addDownloadAgentHelper(helper: IDownloadAgentHelper): void;
    addDownload(downloadPath: string, downloadUri: string, params?: IDownloadParams): number;
    removeDownload(serialId: number): boolean;
    removeDownloads(tag: string): number;
    removeAllDownloads(): void;
    getDownloadInfo(serialId: number): IDownloadInfo | null;
    getDownloadInfosByTag(tag: string): IDownloadInfo[];
    getAllDownloadInfos(): IDownloadInfo[];
    update(elapseSeconds: number, _realElapseSeconds: number): void;
    shutdown(): void;
    private _enqueue;
    private _scheduleNext;
    private _startTask;
}

declare class ShowEntitySuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "entity.show.success";
    get id(): string;
    entityId: number;
    entityAssetName: string;
    entityGroupName: string;
    duration: number;
    userData?: object;
    static create(entityId: number, entityAssetName: string, entityGroupName: string, duration: number, userData?: object): ShowEntitySuccessEventArgs;
    clear(): void;
}
declare class ShowEntityFailureEventArgs extends BaseEventArgs {
    static readonly eventId = "entity.show.failure";
    get id(): string;
    entityId: number;
    entityAssetName: string;
    entityGroupName: string;
    errorMessage: string;
    userData?: object;
    static create(entityId: number, entityAssetName: string, entityGroupName: string, errorMessage: string, userData?: object): ShowEntityFailureEventArgs;
    clear(): void;
}
declare class HideEntityCompleteEventArgs extends BaseEventArgs {
    static readonly eventId = "entity.hide.complete";
    get id(): string;
    entityId: number;
    entityAssetName: string;
    entityGroupName: string;
    userData?: object;
    static create(entityId: number, entityAssetName: string, entityGroupName: string, userData?: object): HideEntityCompleteEventArgs;
    clear(): void;
}
declare class AttachEntitySuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "entity.attach.success";
    get id(): string;
    entityId: number;
    parentEntityId: number;
    userData?: object;
    static create(entityId: number, parentEntityId: number, userData?: object): AttachEntitySuccessEventArgs;
    clear(): void;
}
declare class DetachEntitySuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "entity.detach.success";
    get id(): string;
    entityId: number;
    parentEntityId: number;
    userData?: object;
    static create(entityId: number, parentEntityId: number, userData?: object): DetachEntitySuccessEventArgs;
    clear(): void;
}

/** 实体生命周期状态（对应 Unity 原版 EntityStatus 枚举） */
declare enum EntityStatus {
    Unknown = 0,
    WillInit = 1,
    Inited = 2,
    WillShow = 3,
    Showed = 4,
    WillHide = 5,
    Hidden = 6,
    WillRecycle = 7,
    Recycled = 8
}
interface IEntityGroup {
    readonly name: string;
    readonly autoReleaseInterval: number;
    readonly capacity: number;
    readonly expireTime: number;
    readonly priority: number;
    /** 当前分组内已显示的实体数量 */
    readonly entityCount: number;
    /** 按 entityId 判断分组内是否有该实体 */
    hasEntity(entityId: number): boolean;
    /** 按资源名判断分组内是否有该类型的实体 */
    hasEntityByAssetName(entityAssetName: string): boolean;
    /** 按 entityId 取分组内实体的原始实例（引擎层转换为 EntityLogic） */
    getEntityInstance(entityId: number): object | null;
    /** 按资源名取分组内第一个匹配实例 */
    getEntityInstanceByAssetName(entityAssetName: string): object | null;
    /** 按资源名取分组内所有匹配实例 */
    getEntityInstances(entityAssetName: string): object[];
    /** 取分组内所有已显示实体的实例 */
    getAllEntityInstances(): object[];
}
interface IEntityManager {
    readonly entityCount: number;
    readonly entityGroupCount: number;
    addEntityGroup(groupName: string, autoReleaseInterval?: number, capacity?: number, expireTime?: number, priority?: number): boolean;
    hasEntityGroup(groupName: string): boolean;
    getEntityGroup(groupName: string): IEntityGroup | null;
    getAllEntityGroups(): IEntityGroup[];
    hasEntity(entityId: number): boolean;
    hasEntityByAssetName(entityAssetName: string): boolean;
    isLoadingEntity(entityId: number): boolean;
    isValidEntity(entityId: number): boolean;
    getEntityStatus(entityId: number): EntityStatus;
    getEntityInstance(entityId: number): object | null;
    getEntityInstances(entityAssetName: string): object[];
    getAllLoadedEntityInstances(): object[];
    getAllLoadingEntityIds(): number[];
    getParentEntityInstance(entityId: number): object | null;
    getChildEntityCount(parentEntityId: number): number;
    getChildEntityInstance(parentEntityId: number): object | null;
    getChildEntityInstances(parentEntityId: number): object[];
    showEntity(entityId: number, entityAssetName: string, bundleName: string, groupName: string, priority?: number, userData?: object): void;
    /** 隐藏实体；若实体正在加载中则立即取消该次加载 */
    hideEntity(entityId: number, userData?: object): void;
    hideAllLoadedEntities(userData?: object): void;
    hideAllLoadingEntities(userData?: object): void;
    hideAllEntities(userData?: object): void;
    attachEntity(entityId: number, parentEntityId: number, userData?: object): void;
    detachEntity(entityId: number, userData?: object): void;
    detachChildEntities(parentEntityId: number, userData?: object): void;
}

interface IEntityInfo {
    readonly entityId: number;
    readonly entityAssetName: string;
    readonly entityGroupName: string;
    userData?: object;
}
interface IEntityHelper {
    /** 注册分组根节点，引擎层据此将实体挂载到对应分组子节点 */
    setGroupRoot(groupName: string, groupRoot: object): void;
    /** 实例化实体 Prefab（首次创建） */
    instantiateEntity(entityAsset: object): object;
    /** 首次创建：挂载节点、调用 onInit + onShow */
    createEntity(entityInstance: object, entityInfo: IEntityInfo): void;
    /** 每帧驱动实体逻辑 */
    onUpdateEntity(entityInstance: object, elapseSeconds: number, realElapseSeconds: number): void;
    /**
     * 彻底销毁实体实例。
     * @param isShutdown true 表示框架关闭时批量销毁，onHide 收到该标记可做区分。
     */
    releaseEntity(entityAsset: object, entityInstance: object, userData?: object, isShutdown?: boolean): void;
    /**
     * 回收至对象池：调用 onHide(false) 并令节点隐藏（不销毁）。
     */
    recycleEntity(entityInstance: object, userData?: object): void;
    /**
     * 从对象池复用：重新激活节点、更新数据、调用 onShow（不调用 onInit）。
     */
    reactivateEntity(entityInstance: object, entityInfo: IEntityInfo): void;
    /** 从实体实例中取回逻辑组件对象 */
    getEntityLogic(entityInstance: object): object | null;
    /** 实体被附加到父实体时调用（含 Node 重挂载） */
    onAttachEntity(entityInstance: object, parentEntityInstance: object, userData?: object): void;
    /** 实体从父实体脱离时调用（含 Node 归还分组根节点） */
    onDetachEntity(entityInstance: object, parentEntityInstance: object | null, userData?: object): void;
}

type LoadSuccessCallback<T> = (asset: T, duration: number, userData?: object) => void;
type LoadFailureCallback = (assetName: string, errorMsg: string, userData?: object) => void;
type LoadProgressCallback = (loadedCount: number, totalCount: number) => void;
type LoadSceneSuccessCallback = (sceneAssetName: string, duration: number, userData?: object) => void;
type LoadSceneFailureCallback = (sceneAssetName: string, errorMsg: string, userData?: object) => void;
type UnloadSceneSuccessCallback = (sceneAssetName: string, userData?: object) => void;
type UnloadSceneFailureCallback = (sceneAssetName: string, userData?: object) => void;
/** 资源存在状态（对应 Unity HasAssetResult 枚举） */
declare enum HasAssetResult {
    /** 资源不存在 */
    NotExist = 0,
    /** 资源已在 Bundle 缓存中（可直接获取） */
    Loaded = 1,
    /** 资源所属 Bundle 已加载，但资源本身尚未加载 */
    InBundle = 2,
    /** Bundle 未加载，资源无法访问 */
    BundleNotLoaded = 3
}
/** 资源组接口，对应原版 IResourceGroup */
interface IResourceGroup {
    readonly name: string;
    readonly totalCount: number;
    readonly readyCount: number;
    readonly totalLength: number;
    readonly readyLength: number;
    /** [0, 1] 进度 */
    readonly progress: number;
    readonly isComplete: boolean;
    hasResourceInGroup(resourceName: string): boolean;
}
/** 热更新状态快照 */
interface ResourceUpdateStatus {
    /** 待更新资源数 */
    waitingCount: number;
    /** 候选资源数（已检查需更新） */
    candidateCount: number;
    /** 更新失败重试次数上限 */
    updateRetryCount: number;
    /** 当前更新的资源组名 */
    updatingResourceGroupName: string;
}
interface IResourceManager {
    /** 对象池自动释放间隔（秒） */
    assetAutoReleaseInterval: number;
    /** 对象池容量上限 */
    assetCapacity: number;
    /** 对象池过期时间（秒） */
    assetExpireTime: number;
    /** 更新失败最大重试次数 */
    updateRetryCount: number;
    /** 当前等待加载的任务数 */
    readonly loadWaitingTaskCount: number;
    /** 单个资源更新开始 */
    onResourceUpdateStart: EventHandler | null;
    /** 单个资源更新进度变化 */
    onResourceUpdateChanged: EventHandler | null;
    /** 单个资源更新成功 */
    onResourceUpdateSuccess: EventHandler | null;
    /** 单个资源更新失败 */
    onResourceUpdateFailure: EventHandler | null;
    /** 全部资源更新完毕 */
    onResourceUpdateAllComplete: EventHandler | null;
    /** 资源校验开始 */
    onResourceVerifyStart: EventHandler | null;
    /** 单个资源校验成功 */
    onResourceVerifySuccess: EventHandler | null;
    /** 单个资源校验失败 */
    onResourceVerifyFailure: EventHandler | null;
    /** 资源包应用开始 */
    onResourceApplyStart: EventHandler | null;
    /** 单个资源应用成功 */
    onResourceApplySuccess: EventHandler | null;
    /** 单个资源应用失败 */
    onResourceApplyFailure: EventHandler | null;
    /** 加载 Bundle（异步） */
    loadBundle(bundleName: string, onSuccess?: () => void, onFailure?: LoadFailureCallback): void;
    /** 卸载 Bundle */
    unloadBundle(bundleName: string): void;
    /** 回调风格加载 */
    loadAsset<T>(bundleName: string, assetPath: string, assetType: new (...args: any[]) => T, onSuccess: LoadSuccessCallback<T>, onFailure?: LoadFailureCallback, userData?: object): void;
    /** Promise 风格加载 */
    loadAssetAsync<T>(bundleName: string, assetPath: string, assetType: new (...args: any[]) => T, userData?: object): Promise<T>;
    /** 批量加载（同一 bundle 下多个路径） */
    loadAssets<T>(bundleName: string, assetPaths: string[], assetType: new (...args: any[]) => T, onProgress?: LoadProgressCallback, onSuccess?: LoadSuccessCallback<T[]>, onFailure?: LoadFailureCallback, userData?: object): void;
    /** 按目录批量加载（对应 Cocos bundle.loadDir） */
    loadDir<T>(bundleName: string, dir: string, assetType: new (...args: any[]) => T, onProgress?: LoadProgressCallback, onSuccess?: LoadSuccessCallback<T[]>, onFailure?: LoadFailureCallback, userData?: object): void;
    /** 卸载资源（减引用计数） */
    unloadAsset(asset: object): void;
    /** 释放 Bundle 内所有未被引用的资产 */
    unloadUnusedAssets(bundleName: string): void;
    /** 强制释放所有未被引用的资产（跨 Bundle） */
    forceUnloadUnusedAssets(): void;
    /** 检查资源是否存在及其状态 */
    hasAsset(bundleName: string, assetPath: string): HasAssetResult;
    /** 加载场景 */
    loadScene(sceneAssetName: string, onSuccess?: LoadSceneSuccessCallback, onFailure?: LoadSceneFailureCallback, userData?: object): void;
    /** 卸载场景 */
    unloadScene(sceneAssetName: string, onSuccess?: UnloadSceneSuccessCallback, onFailure?: UnloadSceneFailureCallback, userData?: object): void;
    /** 是否存在指定资源组 */
    hasResourceGroup(groupName: string): boolean;
    /** 获取指定资源组 */
    getResourceGroup(groupName: string): IResourceGroup | null;
    /** 获取所有资源组 */
    getAllResourceGroups(): IResourceGroup[];
    /** 检查热更新（返回是否有需要更新的资源） */
    checkUpdate(manifestUrl: string): Promise<boolean>;
    /** 执行热更新 */
    startUpdate(onComplete?: (success: boolean) => void): void;
    /** 停止热更新 */
    stopUpdate(): void;
    /** 获取热更新状态 */
    getUpdateStatus(): ResourceUpdateStatus;
}

declare class EntityManager extends GameFrameworkModule implements IEntityManager {
    private _entityHelper;
    private _resourceManager;
    private _groups;
    private _entities;
    private _pool;
    private _groupTimers;
    private _cancelledIds;
    onShowEntitySuccess: ((entityId: number, entityAssetName: string, groupName: string, instance: object, duration: number, userData?: object) => void) | null;
    onShowEntityFailure: ((entityId: number, entityAssetName: string, groupName: string, errorMessage: string, userData?: object) => void) | null;
    onHideEntityComplete: ((entityId: number, entityAssetName: string, groupName: string, userData?: object) => void) | null;
    onAttachEntitySuccess: ((entityId: number, parentEntityId: number, userData?: object) => void) | null;
    onDetachEntitySuccess: ((entityId: number, parentEntityId: number, userData?: object) => void) | null;
    get priority(): number;
    get entityCount(): number;
    get entityGroupCount(): number;
    setHelper(helper: IEntityHelper): void;
    setResourceManager(rm: IResourceManager): void;
    addEntityGroup(groupName: string, autoReleaseInterval?: number, capacity?: number, expireTime?: number, priority?: number): boolean;
    hasEntityGroup(groupName: string): boolean;
    getEntityGroup(groupName: string): IEntityGroup | null;
    getAllEntityGroups(): IEntityGroup[];
    hasEntity(entityId: number): boolean;
    hasEntityByAssetName(entityAssetName: string): boolean;
    isLoadingEntity(entityId: number): boolean;
    isValidEntity(entityId: number): boolean;
    getEntityStatus(entityId: number): EntityStatus;
    getEntityInstance(entityId: number): object | null;
    getEntityInstances(entityAssetName: string): object[];
    getAllLoadedEntityInstances(): object[];
    getAllLoadingEntityIds(): number[];
    getParentEntityInstance(entityId: number): object | null;
    getChildEntityCount(parentEntityId: number): number;
    getChildEntityInstance(parentEntityId: number): object | null;
    getChildEntityInstances(parentEntityId: number): object[];
    showEntity(entityId: number, entityAssetName: string, bundleName: string, groupName: string, priority?: number, userData?: object): void;
    private _onLoadSuccess;
    private _onLoadFailure;
    hideEntity(entityId: number, userData?: object): void;
    hideAllLoadedEntities(userData?: object): void;
    hideAllLoadingEntities(userData?: object): void;
    hideAllEntities(userData?: object): void;
    attachEntity(entityId: number, parentEntityId: number, userData?: object): void;
    detachEntity(entityId: number, userData?: object): void;
    detachChildEntities(parentEntityId: number, userData?: object): void;
    update(elapseSeconds: number, realElapseSeconds: number): void;
    shutdown(): void;
    private _acquireFromPool;
    private _returnToPool;
    private _releaseExpiredPoolEntries;
}

/**
 * 实体接口，对应原版 IEntity。
 * 引擎层的 EntityLogic Component 实现此接口。
 */
interface IEntity {
    /** 实体编号 */
    readonly entityId: number;
    /** 实体资源名称 */
    readonly entityAssetName: string;
    /** 所属实体组 */
    readonly entityGroup: IEntityGroup;
    /** 实体逻辑对象（引擎层 EntityLogic 实例） */
    readonly entityLogic: object | null;
    /** 初始化实体 */
    onInit(entityId: number, entityAssetName: string, entityGroup: IEntityGroup, isNewInstance: boolean, userData?: object): void;
    /** 显示实体 */
    onShow(userData?: object): void;
    /** 隐藏实体 */
    onHide(isShutdown: boolean, userData?: object): void;
    /** 挂载到父实体时回调 */
    onAttached(parentEntity: IEntity, userData?: object): void;
    /** 从父实体卸载时回调 */
    onDetached(parentEntity: IEntity, userData?: object): void;
    /** 子实体挂载到本实体时回调 */
    onAttachChild(childEntity: IEntity, userData?: object): void;
    /** 子实体从本实体卸载时回调 */
    onDetachChild(childEntity: IEntity, userData?: object): void;
    /** 回池时回调 */
    onRecycle(): void;
    /** 实体轮询 */
    onUpdate(elapseSeconds: number, realElapseSeconds: number): void;
}

/**
 * 实体组辅助接口，对应原版 IEntityGroupHelper。
 * 负责实体分组的引擎层挂载管理。
 */
interface IEntityGroupHelper {
    /**
     * 创建实体组的根节点（引擎层对象）。
     * @param entityGroupName 分组名称
     */
    createEntityGroupRoot(entityGroupName: string): object;
}

declare class EventManager extends GameFrameworkModule implements IEventManager {
    private readonly _mode;
    private _handlers;
    private _deferredQueue;
    private _processingQueue;
    private _defaultHandler;
    /**
     * 派发过程中记录各事件参数对象的下一个待调用索引。
     * 用于在处理函数内安全地 subscribe / unsubscribe，避免漏调或重复调用。
     */
    private _cachedIndices;
    constructor(mode?: EventPoolMode);
    /** 对应原版 EventManager，优先级为 7 */
    get priority(): number;
    get eventHandlerCount(): number;
    /** 当前待派发的延迟事件数量（对应原版 EventPool.EventCount） */
    get eventCount(): number;
    /** 已注册的事件类型数量 */
    get registeredEventCount(): number;
    count(eventId: string): number;
    check(eventId: string, handler: EventHandler): boolean;
    subscribe(eventId: string, handler: EventHandler, priority?: number): void;
    unsubscribe(eventId: string, handler: EventHandler): void;
    unsubscribeAll(eventId: string): void;
    hasSubscriber(eventId: string, handler?: EventHandler): boolean;
    fire(sender: object, e: BaseEventArgs): void;
    fireNow(sender: object, e: BaseEventArgs): void;
    clear(): void;
    setDefaultHandler(handler: EventHandler | null): void;
    update(_elapseSeconds: number, _realElapseSeconds: number): void;
    shutdown(): void;
    private _handleEvent;
}

/** 游戏逻辑事件基类，对应原版 GameFramework.Event.GameEventArgs */
declare abstract class GameEventArgs extends BaseEventArgs {
}

/** 文件系统中单个文件的基本信息。 */
interface FileInfo {
    readonly name: string;
    readonly offset: number;
    readonly length: number;
    readonly isValid: boolean;
}
declare function makeFileInfo(name: string, offset: number, length: number): FileInfo;
declare const INVALID_FILE_INFO: FileInfo;

/** 文件系统访问权限。 */
declare enum FileSystemAccess {
    Unspecified = 0,
    Read = 1,
    Write = 2,
    ReadWrite = 3
}

/**
 * 文件系统流抽象基类。
 *
 * 平台辅助器负责实例化具体子类（Web 用 IndexedDB / File API，Android 用 AssetManager 等）。
 * FileSystem 核心只依赖此接口读写底层字节流。
 */
declare abstract class FileSystemStream {
    abstract get position(): number;
    abstract set position(value: number);
    abstract get length(): number;
    abstract setLength(length: number): void;
    abstract seek(offset: number, origin: SeekOrigin): number;
    abstract readByte(): number;
    /** 从当前位置读取最多 count 字节到 buffer[offset..] 并返回实际读到的字节数。 */
    abstract read(buffer: Uint8Array, offset: number, count: number): number;
    abstract writeByte(value: number): void;
    abstract write(buffer: Uint8Array, offset: number, count: number): void;
    abstract flush(): void;
    abstract close(): void;
    /** 将 count 字节从当前流拷贝到目标流，返回实际拷贝字节数。 */
    copyTo(dst: FileSystemStream, count: number): number;
}
declare enum SeekOrigin {
    Begin = 0,
    Current = 1,
    End = 2
}

/**
 * 文件系统接口。
 *
 * 每个文件系统对应磁盘/持久化存储中的一个物理文件，内部使用块（Block）管理多个逻辑文件。
 */
interface IFileSystem {
    readonly fullPath: string;
    readonly access: FileSystemAccess;
    readonly fileCount: number;
    readonly maxFileCount: number;
    hasFile(name: string): boolean;
    getFileInfo(name: string): FileInfo;
    getAllFileInfos(): FileInfo[];
    readFile(name: string): Uint8Array | null;
    readFileToBuffer(name: string, buffer: Uint8Array, startIndex?: number, length?: number): number;
    readFileSegment(name: string, offset: number, length: number): Uint8Array | null;
    readFileSegmentToBuffer(name: string, offset: number, buffer: Uint8Array, startIndex?: number, length?: number): number;
    writeFile(name: string, buffer: Uint8Array, startIndex?: number, length?: number): boolean;
    renameFile(oldName: string, newName: string): boolean;
    deleteFile(name: string): boolean;
}

declare class FileSystem implements IFileSystem {
    private readonly _fullPath;
    private readonly _access;
    private readonly _stream;
    private readonly _encryptKey;
    private _maxFileCount;
    private _maxBlockCount;
    /** blockIndex → BlockData */
    private readonly _blocks;
    /** filename → blockIndex */
    private readonly _fileMap;
    /** 按 length 分组的空闲块索引 */
    private readonly _freeBlocks;
    /** blockIndex → filename（反向查询） */
    private readonly _stringMap;
    private _freeStringSlots;
    private constructor();
    static create(fullPath: string, access: FileSystemAccess, stream: FileSystemStream, maxFileCount: number, maxBlockCount: number): FileSystem;
    static load(fullPath: string, access: FileSystemAccess, stream: FileSystemStream): FileSystem;
    get fullPath(): string;
    get access(): FileSystemAccess;
    get fileCount(): number;
    get maxFileCount(): number;
    hasFile(name: string): boolean;
    getFileInfo(name: string): FileInfo;
    getAllFileInfos(): FileInfo[];
    readFile(name: string): Uint8Array | null;
    readFileToBuffer(name: string, buffer: Uint8Array, startIndex?: number, length?: number): number;
    readFileSegment(name: string, offset: number, length: number): Uint8Array | null;
    readFileSegmentToBuffer(name: string, offset: number, buffer: Uint8Array, startIndex?: number, length?: number): number;
    writeFile(name: string, buffer: Uint8Array, startIndex?: number, length?: number): boolean;
    renameFile(oldName: string, newName: string): boolean;
    deleteFile(name: string): boolean;
    shutdown(): void;
    private _assertWritable;
    private _clusterOffset;
    private _readBlockData;
    private _overwriteBlock;
    private _allocateAndWrite;
    private _findFreeBlock;
    private _addFreeBlock;
    private _removeFreeBlock;
    private _nextFreeCluster;
    private _usedStringCount;
    private _writeHeader;
    private _writeBlockRecord;
    private _writeStringRecord;
    private _loadBlocks;
}

/**
 * 文件系统辅助器接口。
 *
 * 负责根据路径和访问模式创建底层流，实现平台解耦。
 */
interface IFileSystemHelper {
    /**
     * 创建文件系统底层流。
     * @param fullPath  文件系统物理路径
     * @param access    访问权限
     * @param createNew 是否强制新建（true = 覆盖已有文件）
     */
    createFileSystemStream(fullPath: string, access: FileSystemAccess, createNew: boolean): FileSystemStream;
}

/**
 * 文件系统管理器接口。
 */
interface IFileSystemManager {
    readonly count: number;
    setFileSystemHelper(helper: IFileSystemHelper): void;
    hasFileSystem(fullPath: string): boolean;
    getFileSystem(fullPath: string): IFileSystem | null;
    createFileSystem(fullPath: string, access: FileSystemAccess, maxFileCount: number, maxBlockCount: number): IFileSystem;
    loadFileSystem(fullPath: string, access: FileSystemAccess): IFileSystem;
    destroyFileSystem(fileSystem: IFileSystem, deletePhysicalFile: boolean): void;
    getAllFileSystems(): IFileSystem[];
}

/**
 * 文件系统管理器。
 *
 * 管理多个并行开放的虚拟文件系统实例，每个实例对应存储中的一个物理文件。
 * 通过 setFileSystemHelper() 注入平台相关的流实现。
 */
declare class FileSystemManager extends GameFrameworkModule implements IFileSystemManager {
    private _helper;
    private readonly _fileSystems;
    get priority(): number;
    get count(): number;
    setFileSystemHelper(helper: IFileSystemHelper): void;
    hasFileSystem(fullPath: string): boolean;
    getFileSystem(fullPath: string): IFileSystem | null;
    createFileSystem(fullPath: string, access: FileSystemAccess, maxFileCount: number, maxBlockCount: number): IFileSystem;
    loadFileSystem(fullPath: string, access: FileSystemAccess): IFileSystem;
    destroyFileSystem(fileSystem: IFileSystem, deletePhysicalFile: boolean): void;
    getAllFileSystems(): IFileSystem[];
    update(_elapseSeconds: number, _realElapseSeconds: number): void;
    shutdown(): void;
    private _assertHelper;
}

declare abstract class FsmState<T extends object> {
    onInit(fsm: IFsm<T>): void;
    onEnter(fsm: IFsm<T>): void;
    onUpdate(fsm: IFsm<T>, elapseSeconds: number, realElapseSeconds: number): void;
    onLeave(fsm: IFsm<T>, isShutdown: boolean): void;
    onDestroy(fsm: IFsm<T>): void;
    protected changeState<TState extends FsmState<T>>(fsm: IFsm<T>, ctor: new (...args: any[]) => TState): void;
}

interface IFsm<T extends object> {
    readonly name: string;
    readonly fullName: string;
    readonly owner: T;
    readonly ownerType: Function;
    readonly stateCount: number;
    readonly isRunning: boolean;
    readonly isDestroyed: boolean;
    readonly currentState: FsmState<T> | null;
    readonly currentStateTime: number;
    start<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): void;
    hasState<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): boolean;
    getState<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): TState | null;
    getAllStates(): FsmState<T>[];
    changeState<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): void;
    hasData(name: string): boolean;
    setData<TData>(name: string, data: TData): void;
    getData<TData>(name: string): TData | undefined;
    removeData(name: string): boolean;
}

declare class Fsm<T extends object> implements IFsm<T> {
    private _name;
    private _owner;
    private _states;
    private _data;
    private _currentState;
    private _currentStateTime;
    private _isRunning;
    private _isDestroyed;
    constructor(name: string, owner: T, states: FsmState<T>[]);
    get name(): string;
    get fullName(): string;
    get owner(): T;
    get ownerType(): Function;
    get stateCount(): number;
    get isRunning(): boolean;
    get isDestroyed(): boolean;
    get currentState(): FsmState<T> | null;
    get currentStateTime(): number;
    start<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): void;
    hasState<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): boolean;
    getState<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): TState | null;
    getAllStates(): FsmState<T>[];
    changeState<TState extends FsmState<T>>(ctor: new (...args: any[]) => TState): void;
    hasData(name: string): boolean;
    setData<TData>(name: string, data: TData): void;
    getData<TData>(name: string): TData | undefined;
    removeData(name: string): boolean;
    update(elapseSeconds: number, realElapseSeconds: number): void;
    shutdown(): void;
}

interface IFsmManager {
    readonly fsmCount: number;
    hasFsm<T extends object>(ownerCtor: new (...args: any[]) => T, name?: string): boolean;
    getFsm<T extends object>(ownerCtor: new (...args: any[]) => T, name?: string): IFsm<T> | null;
    getAllFsms(): IFsm<any>[];
    createFsm<T extends object>(name: string, owner: T, states: FsmState<T>[]): IFsm<T>;
    destroyFsm<T extends object>(ownerCtor: new (...args: any[]) => T, name?: string): boolean;
    destroyFsmByInstance<T extends object>(fsm: IFsm<T>): boolean;
}

declare class FsmManager extends GameFrameworkModule implements IFsmManager {
    private _fsms;
    get priority(): number;
    get fsmCount(): number;
    hasFsm<T extends object>(ownerCtor: new (...args: any[]) => T, name?: string): boolean;
    getFsm<T extends object>(ownerCtor: new (...args: any[]) => T, name?: string): IFsm<T> | null;
    getAllFsms(): IFsm<any>[];
    createFsm<T extends object>(name: string, owner: T, states: FsmState<T>[]): IFsm<T>;
    destroyFsm<T extends object>(ownerCtor: new (...args: any[]) => T, name?: string): boolean;
    destroyFsmByInstance<T extends object>(fsm: IFsm<T>): boolean;
    update(elapseSeconds: number, realElapseSeconds: number): void;
    shutdown(): void;
}

interface ILocalizationManager {
    /** 当前已绑定的本地化辅助器，未设置时为 null。 */
    readonly helper: ILocalizationHelper | null;
    /** 设置本地化辅助器。 */
    setHelper(helper: ILocalizationHelper): void;
    language: string;
    readonly dictionaryCount: number;
    /** Load a flat key→value dictionary (JSON object or array of {key, value}). */
    loadDictionary(data: Record<string, string> | Array<{
        key: string;
        value: string;
    }>): void;
    /** Clear all loaded strings. */
    clearDictionary(): void;
    hasString(key: string): boolean;
    getString(key: string, defaultValue?: string): string;
    /** sprintf-style formatting: {0}, {1} placeholders. */
    format(key: string, ...args: (string | number)[]): string;
}

/**
 * 本地化辅助器接口。
 *
 * 负责将原始数据（文本字符串或字节数组）解析为键值对并写入本地化管理器。
 * 通过替换辅助器实现可以支持不同的字典格式（JSON、Tab 分隔、二进制等）。
 */
interface ILocalizationHelper {
    /** 获取系统语言标签（如 'zh-CN'、'en-US'）。 */
    readonly systemLanguage: string;
    /**
     * 解析文本格式的字典数据，将键值对写入本地化管理器。
     * @param localizationManager 目标本地化管理器
     * @param dictionaryString    原始文本内容
     * @param userData            透传用户数据
     */
    parseData(localizationManager: ILocalizationManager, dictionaryString: string, userData?: any): boolean;
    /**
     * 解析二进制格式的字典数据，将键值对写入本地化管理器。
     * @param localizationManager 目标本地化管理器
     * @param dictionaryBytes     原始字节数据
     * @param userData            透传用户数据
     */
    parseDataFromBytes(localizationManager: ILocalizationManager, dictionaryBytes: ArrayBuffer, userData?: any): boolean;
    /**
     * 释放字典资产。
     * @param localizationManager 拥有该资产的本地化管理器
     * @param dictionaryAsset     待释放资产对象
     */
    releaseDataAsset(localizationManager: ILocalizationManager, dictionaryAsset: object): void;
}

declare class LocalizationManager extends GameFrameworkModule implements ILocalizationManager {
    private _dictionary;
    private _language;
    private _helper;
    get priority(): number;
    get language(): string;
    set language(value: string);
    get dictionaryCount(): number;
    get helper(): ILocalizationHelper | null;
    setHelper(helper: ILocalizationHelper): void;
    loadDictionary(data: Record<string, string> | Array<{
        key: string;
        value: string;
    }>): void;
    clearDictionary(): void;
    hasString(key: string): boolean;
    getString(key: string, defaultValue?: string): string;
    format(key: string, ...args: (string | number)[]): string;
    update(_e: number, _r: number): void;
    shutdown(): void;
}

/** 网络地址族，对应原版 AddressFamily 枚举 */
declare enum AddressFamily {
    /** 未指定 */
    Unknown = 0,
    /** IPv4 地址 */
    IPv4 = 2,
    /** IPv6 地址 */
    IPv6 = 23
}

/** 网络消息包基类，对应原版 GameFramework.Network.Packet */
declare abstract class Packet extends BaseEventArgs {
}

/** 网络频道接口，对应原版 INetworkChannel */
interface INetworkChannel {
    /** 频道名称 */
    readonly name: string;
    /** 是否已连接 */
    readonly connected: boolean;
    /** 已发送但未收到回执的消息包数量 */
    readonly sendPacketCount: number;
    /** 累计已发送消息包数量 */
    readonly sentPacketCount: number;
    /** 已接收但尚未处理的消息包数量 */
    readonly receivePacketCount: number;
    /** 累计已接收消息包数量 */
    readonly receivedPacketCount: number;
    /** 收到任意消息包时是否重置心跳计时 */
    resetHeartBeatElapseSecondsWhenReceivePacket: boolean;
    /** 丢失心跳次数 */
    readonly missHeartBeatCount: number;
    /** 心跳间隔（秒） */
    heartBeatInterval: number;
    /** 当前心跳计时（秒） */
    readonly heartBeatElapseSeconds: number;
    /** 连接到远端 */
    connect(url: string, userData?: object): void;
    /** 关闭频道 */
    close(): void;
    /** 发送消息包 */
    send<T extends Packet>(packet: T): boolean;
}

/** 消息包头接口，对应原版 IPacketHeader */
interface IPacketHeader {
    /** 消息包 ID */
    readonly id: number;
    /** 消息包体长度（字节） */
    readonly packetLength: number;
    /** 消息包头是否有效 */
    readonly isValid: boolean;
}

/** 网络频道辅助器接口，对应原版 INetworkChannelHelper */
interface INetworkChannelHelper {
    /** 消息包头长度 */
    readonly packetHeaderLength: number;
    /** 初始化网络频道辅助器 */
    initialize(networkChannel: INetworkChannel): void;
    /** 关闭并清理网络频道辅助器 */
    shutdown(): void;
    /** 准备进行连接 */
    prepareForConnecting(): void;
    /** 发送心跳消息包，返回是否发送成功 */
    sendHeartBeat(): boolean;
    /** 序列化消息包，返回序列化后的字节数据 */
    serialize<T extends Packet>(packet: T): Uint8Array | null;
    /** 反序列化消息包头 */
    deserializePacketHeader(data: Uint8Array): {
        header: IPacketHeader | null;
        customErrorData?: object;
    };
    /** 反序列化消息包 */
    deserializePacket(packetHeader: IPacketHeader, data: Uint8Array): {
        packet: Packet | null;
        customErrorData?: object;
    };
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
interface IHttpRequestParams {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: string | object;
    timeout?: number;
}
interface IHttpResponse {
    statusCode: number;
    headers: Record<string, string>;
    data: string;
}
type HttpSuccessCallback = (response: IHttpResponse, userData?: object) => void;
type HttpFailureCallback = (url: string, errorMessage: string, userData?: object) => void;
interface INetworkManager {
    /** 网络频道数量 */
    readonly networkChannelCount: number;
    /** 是否存在指定网络频道 */
    hasNetworkChannel(name: string): boolean;
    /** 获取指定网络频道 */
    getNetworkChannel(name: string): INetworkChannel | null;
    /** 获取所有网络频道 */
    getAllNetworkChannels(): INetworkChannel[];
    /**
     * 创建网络频道（WebSocket）。
     * @param name 频道名称
     * @param helper 频道辅助器（可选，传入自定义辅助器以实现心跳/序列化）
     */
    createNetworkChannel(name: string, helper?: INetworkChannelHelper): INetworkChannel;
    /** 销毁网络频道，返回是否成功 */
    destroyNetworkChannel(name: string): boolean;
    /** 向指定频道发送消息包 */
    sendPacket<T extends Packet>(channelName: string, packet: T): boolean;
    sendRequest(url: string, params?: IHttpRequestParams, onSuccess?: HttpSuccessCallback, onFailure?: HttpFailureCallback, userData?: object): void;
    sendRequestAsync(url: string, params?: IHttpRequestParams): Promise<IHttpResponse>;
}

/** 消息包处理器接口，对应原版 IPacketHandler */
interface IPacketHandler {
    /** 处理器关联的消息包 ID */
    readonly id: number;
    /**
     * 处理消息包。
     * @param header 已解析的消息包头
     * @param body 消息体字节数据
     */
    handle(header: IPacketHeader, body: Uint8Array): Packet | null;
}

/** 网络错误码，对应原版 NetworkErrorCode 枚举 */
declare enum NetworkErrorCode {
    /** 未知错误 */
    Unknown = 0,
    /** 地址解析失败 */
    AddressError = 1,
    /** 连接失败 */
    ConnectError = 2,
    /** 发送失败 */
    SendError = 3,
    /** 接收失败 */
    ReceiveError = 4,
    /** 消息包头错误 */
    PacketHeaderError = 5,
    /** 消息包体错误 */
    PacketError = 6,
    /** 序列化错误 */
    SerializeError = 7,
    /** 反序列化错误 */
    DeserializeError = 8,
    /** 心跳超时断开 */
    HeartBeatTimeout = 9,
    /** 自定义错误 */
    CustomError = 10
}

/** 网络连接成功事件 */
declare class NetworkConnectedEventArgs extends BaseEventArgs {
    static readonly eventId = "network.connected";
    get id(): string;
    channelName: string;
    userData?: object;
    static create(channelName: string, userData?: object): NetworkConnectedEventArgs;
    clear(): void;
}
/** 网络连接关闭事件 */
declare class NetworkClosedEventArgs extends BaseEventArgs {
    static readonly eventId = "network.closed";
    get id(): string;
    channelName: string;
    code: number;
    reason: string;
    static create(channelName: string, code: number, reason: string): NetworkClosedEventArgs;
    clear(): void;
}
/** 心跳包丢失事件 */
declare class NetworkMissHeartBeatEventArgs extends BaseEventArgs {
    static readonly eventId = "network.missHeartBeat";
    get id(): string;
    channelName: string;
    missCount: number;
    static create(channelName: string, missCount: number): NetworkMissHeartBeatEventArgs;
    clear(): void;
}
/** 网络错误事件 */
declare class NetworkErrorEventArgs extends BaseEventArgs {
    static readonly eventId = "network.error";
    get id(): string;
    channelName: string;
    errorMessage: string;
    static create(channelName: string, errorMessage: string): NetworkErrorEventArgs;
    clear(): void;
}
/** 用户自定义网络错误事件 */
declare class NetworkCustomErrorEventArgs extends BaseEventArgs {
    static readonly eventId = "network.customError";
    get id(): string;
    channelName: string;
    customErrorData?: object;
    static create(channelName: string, customErrorData?: object): NetworkCustomErrorEventArgs;
    clear(): void;
}

type NetworkEventCallback = (sender: object, e: NetworkConnectedEventArgs | NetworkClosedEventArgs | NetworkMissHeartBeatEventArgs | NetworkErrorEventArgs | NetworkCustomErrorEventArgs) => void;
declare class NetworkManager extends GameFrameworkModule implements INetworkManager {
    private _channels;
    /** 网络事件回调，由 NetworkComponent 注入后统一分发到 EventManager */
    onNetworkConnected?: NetworkEventCallback;
    onNetworkClosed?: NetworkEventCallback;
    onNetworkMissHeartBeat?: NetworkEventCallback;
    onNetworkError?: NetworkEventCallback;
    onNetworkCustomError?: NetworkEventCallback;
    get priority(): number;
    get networkChannelCount(): number;
    hasNetworkChannel(name: string): boolean;
    getNetworkChannel(name: string): INetworkChannel | null;
    getAllNetworkChannels(): INetworkChannel[];
    createNetworkChannel(name: string, helper?: INetworkChannelHelper): INetworkChannel;
    destroyNetworkChannel(name: string): boolean;
    sendPacket<T extends Packet>(channelName: string, packet: T): boolean;
    sendRequest(url: string, params?: IHttpRequestParams, onSuccess?: HttpSuccessCallback, onFailure?: HttpFailureCallback, userData?: object): void;
    sendRequestAsync(url: string, params?: IHttpRequestParams): Promise<IHttpResponse>;
    update(elapseSeconds: number, _realElapseSeconds: number): void;
    shutdown(): void;
}

/** 网络服务类型，对应原版 ServiceType 枚举 */
declare enum ServiceType {
    /** TCP 服务 */
    Tcp = 0,
    /** 同步接收 TCP 服务 */
    TcpWithSyncReceive = 1,
    /** WebSocket 服务 */
    WebSocket = 2
}

declare abstract class ObjectBase {
    private _name;
    private _target;
    private _locked;
    private _priority;
    private _lastUseTime;
    get name(): string;
    get target(): any;
    get locked(): boolean;
    set locked(value: boolean);
    get priority(): number;
    set priority(value: number);
    get lastUseTime(): number;
    /** 自定义是否可释放标志，子类可覆盖以阻止特定对象被自动释放 */
    get customCanReleaseFlag(): boolean;
    protected initialize(target: any): void;
    protected initialize(name: string, target: any): void;
    protected initialize(name: string, target: any, locked: boolean): void;
    protected initialize(name: string, target: any, priority: number): void;
    protected initialize(name: string, target: any, locked: boolean, priority: number): void;
    /** 由 ObjectPool 内部更新最后使用时间 */
    _updateLastUseTime(): void;
    clear(): void;
    onSpawn(): void;
    onUnspawn(): void;
    abstract release(isShutdown: boolean): void;
}

declare class ObjectInfo {
    private readonly _name;
    private readonly _locked;
    private readonly _customCanReleaseFlag;
    private readonly _priority;
    private readonly _lastUseTime;
    private readonly _spawnCount;
    constructor(name: string, locked: boolean, customCanReleaseFlag: boolean, priority: number, lastUseTime: number, spawnCount: number);
    get name(): string;
    get locked(): boolean;
    get customCanReleaseFlag(): boolean;
    get priority(): number;
    get lastUseTime(): number;
    get isInUse(): boolean;
    get spawnCount(): number;
}

type ReleaseObjectFilterCallback<T extends ObjectBase> = (candidateObjects: T[], toReleaseCount: number, expireTime: number) => T[];
interface IObjectPool<T extends ObjectBase> {
    readonly name: string;
    readonly fullName: string;
    readonly objectType: new (...args: any[]) => T;
    readonly count: number;
    readonly canReleaseCount: number;
    readonly allowMultiSpawn: boolean;
    autoReleaseInterval: number;
    capacity: number;
    expireTime: number;
    priority: number;
    register(obj: T, spawned: boolean): void;
    canSpawn(): boolean;
    canSpawn(name: string): boolean;
    spawn(): T | null;
    spawn(name: string): T | null;
    unspawn(obj: T): void;
    unspawn(target: object): void;
    setLocked(obj: T, locked: boolean): void;
    setLocked(target: object, locked: boolean): void;
    setPriority(obj: T, priority: number): void;
    setPriority(target: object, priority: number): void;
    releaseObject(obj: T): boolean;
    releaseObject(target: object): boolean;
    release(): void;
    release(toReleaseCount: number): void;
    release(releaseObjectFilterCallback: ReleaseObjectFilterCallback<T>): void;
    release(toReleaseCount: number, releaseObjectFilterCallback: ReleaseObjectFilterCallback<T>): void;
    releaseAllUnused(): void;
    getAllObjectInfos(): ObjectInfo[];
}

interface IObjectPoolManager {
    readonly count: number;
    hasObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T): boolean;
    hasObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name: string): boolean;
    getObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T): IObjectPool<T> | null;
    getObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name: string): IObjectPool<T> | null;
    getAllObjectPools(): IObjectPool<any>[];
    getAllObjectPools(sort: boolean): IObjectPool<any>[];
    createSingleSpawnObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name?: string, autoReleaseInterval?: number, capacity?: number, expireTime?: number, priority?: number): IObjectPool<T>;
    createMultiSpawnObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name?: string, autoReleaseInterval?: number, capacity?: number, expireTime?: number, priority?: number): IObjectPool<T>;
    destroyObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name?: string): boolean;
    release(): void;
    releaseAllUnused(): void;
}

declare class ObjectPool<T extends ObjectBase> implements IObjectPool<T> {
    private _name;
    private _objectType;
    private _allowMultiSpawn;
    private _items;
    private _capacity;
    private _expireTime;
    private _priority;
    private _autoReleaseInterval;
    private _autoReleaseTimer;
    constructor(name: string, objectType: new (...args: any[]) => T, allowMultiSpawn?: boolean, autoReleaseInterval?: number, capacity?: number, expireTime?: number, priority?: number);
    get name(): string;
    get fullName(): string;
    get objectType(): new (...args: any[]) => T;
    get count(): number;
    get allowMultiSpawn(): boolean;
    get canReleaseCount(): number;
    get autoReleaseInterval(): number;
    set autoReleaseInterval(v: number);
    get capacity(): number;
    set capacity(v: number);
    get expireTime(): number;
    set expireTime(v: number);
    get priority(): number;
    set priority(v: number);
    register(obj: T, spawned: boolean): void;
    canSpawn(): boolean;
    canSpawn(name: string): boolean;
    spawn(): T | null;
    spawn(name: string): T | null;
    unspawn(obj: T): void;
    unspawn(target: object): void;
    setLocked(obj: T, locked: boolean): void;
    setLocked(target: object, locked: boolean): void;
    setPriority(obj: T, priority: number): void;
    setPriority(target: object, priority: number): void;
    releaseObject(obj: T): boolean;
    releaseObject(target: object): boolean;
    release(): void;
    release(toReleaseCount: number): void;
    release(releaseObjectFilterCallback: ReleaseObjectFilterCallback<T>): void;
    release(toReleaseCount: number, releaseObjectFilterCallback: ReleaseObjectFilterCallback<T>): void;
    releaseAllUnused(): void;
    getAllObjectInfos(): ObjectInfo[];
    update(elapseSeconds: number, _realElapseSeconds: number): void;
    shutdown(): void;
    private _findItem;
    private _defaultReleaseFilter;
}

declare class ObjectPoolManager extends GameFrameworkModule implements IObjectPoolManager {
    private _pools;
    get priority(): number;
    get count(): number;
    private _makeKey;
    hasObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name?: string): boolean;
    getObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name?: string): IObjectPool<T> | null;
    getAllObjectPools(): IObjectPool<any>[];
    getAllObjectPools(sort: boolean): IObjectPool<any>[];
    createSingleSpawnObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name?: string, autoReleaseInterval?: number, capacity?: number, expireTime?: number, priority?: number): IObjectPool<T>;
    createMultiSpawnObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name?: string, autoReleaseInterval?: number, capacity?: number, expireTime?: number, priority?: number): IObjectPool<T>;
    private _createObjectPool;
    destroyObjectPool<T extends ObjectBase>(objectType: new (...args: any[]) => T, name?: string): boolean;
    release(): void;
    releaseAllUnused(): void;
    update(elapseSeconds: number, realElapseSeconds: number): void;
    shutdown(): void;
}

declare abstract class ProcedureBase extends FsmState<IProcedureManager> {
}

interface IProcedureManager {
    readonly currentProcedure: ProcedureBase | null;
    readonly currentProcedureTime: number;
    startProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): void;
    startProcedureByType(procedureType: Function): void;
    hasProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): boolean;
    hasProcedureByType(procedureType: Function): boolean;
    getProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): T | null;
    getProcedureByType(procedureType: Function): ProcedureBase | null;
}

declare class ProcedureManager extends GameFrameworkModule implements IProcedureManager {
    private _procedureFsm;
    get priority(): number;
    get currentProcedure(): ProcedureBase | null;
    get currentProcedureTime(): number;
    initialize(fsmManager: IFsmManager, procedures: ProcedureBase[]): void;
    startProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): void;
    startProcedureByType(procedureType: Function): void;
    hasProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): boolean;
    hasProcedureByType(procedureType: Function): boolean;
    getProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): T | null;
    getProcedureByType(procedureType: Function): ProcedureBase | null;
    update(elapseSeconds: number, realElapseSeconds: number): void;
    shutdown(): void;
}

declare class ReferencePoolInfo {
    readonly type: Function;
    readonly unusedReferenceCount: number;
    readonly usingReferenceCount: number;
    readonly acquireReferenceCount: number;
    readonly releaseReferenceCount: number;
    readonly addReferenceCount: number;
    readonly removeReferenceCount: number;
    constructor(type: Function, unusedReferenceCount: number, usingReferenceCount: number, acquireReferenceCount: number, releaseReferenceCount: number, addReferenceCount: number, removeReferenceCount: number);
}

declare class ReferencePool {
    private static _collections;
    private static _enableStrictCheck;
    static get enableStrictCheck(): boolean;
    static set enableStrictCheck(value: boolean);
    static get count(): number;
    static getAllReferencePoolInfos(): ReferencePoolInfo[];
    static acquire<T extends IReference>(ctor: new () => T): T;
    static release<T extends IReference>(ref: T): void;
    /** Pre-warms the pool with `count` instances. */
    static add<T extends IReference>(ctor: new () => T, count: number): void;
    /** Removes up to `count` unused instances from the pool. */
    static remove<T extends IReference>(ctor: new () => T, count: number): void;
    /** Removes all unused instances of this type from the pool. */
    static removeAll<T extends IReference>(ctor: new () => T): void;
    /** Clears all pools for every type. */
    static clearAll(): void;
    private static _internalCheckReferenceType;
    private static _getOrCreate;
}

declare class ResourceUpdateStartEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.update.start";
    get id(): string;
    name: string;
    downloadPath: string;
    downloadUri: string;
    currentLength: number;
    compressedLength: number;
    length: number;
    static create(name: string, downloadPath: string, downloadUri: string, currentLength: number, compressedLength: number, length: number): ResourceUpdateStartEventArgs;
    clear(): void;
}
declare class ResourceUpdateChangedEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.update.changed";
    get id(): string;
    name: string;
    downloadPath: string;
    downloadUri: string;
    currentLength: number;
    compressedLength: number;
    length: number;
    static create(name: string, downloadPath: string, downloadUri: string, currentLength: number, compressedLength: number, length: number): ResourceUpdateChangedEventArgs;
    clear(): void;
}
declare class ResourceUpdateSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.update.success";
    get id(): string;
    name: string;
    downloadPath: string;
    downloadUri: string;
    length: number;
    compressedLength: number;
    static create(name: string, downloadPath: string, downloadUri: string, length: number, compressedLength: number): ResourceUpdateSuccessEventArgs;
    clear(): void;
}
declare class ResourceUpdateFailureEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.update.failure";
    get id(): string;
    name: string;
    downloadUri: string;
    retryCount: number;
    totalRetryCount: number;
    errorMessage: string;
    static create(name: string, downloadUri: string, retryCount: number, totalRetryCount: number, errorMessage: string): ResourceUpdateFailureEventArgs;
    clear(): void;
}
declare class ResourceUpdateAllCompleteEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.update.allComplete";
    get id(): string;
    static create(): ResourceUpdateAllCompleteEventArgs;
    clear(): void;
}
declare class ResourceLoadSceneSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.scene.loadSuccess";
    get id(): string;
    sceneAssetName: string;
    duration: number;
    userData?: object;
    static create(sceneAssetName: string, duration: number, userData?: object): ResourceLoadSceneSuccessEventArgs;
    clear(): void;
}
declare class ResourceLoadSceneFailureEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.scene.loadFailure";
    get id(): string;
    sceneAssetName: string;
    errorMessage: string;
    userData?: object;
    static create(sceneAssetName: string, errorMessage: string, userData?: object): ResourceLoadSceneFailureEventArgs;
    clear(): void;
}
declare class ResourceUnloadSceneSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.scene.unloadSuccess";
    get id(): string;
    sceneAssetName: string;
    userData?: object;
    static create(sceneAssetName: string, userData?: object): ResourceUnloadSceneSuccessEventArgs;
    clear(): void;
}
declare class ResourceUnloadSceneFailureEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.scene.unloadFailure";
    get id(): string;
    sceneAssetName: string;
    userData?: object;
    static create(sceneAssetName: string, userData?: object): ResourceUnloadSceneFailureEventArgs;
    clear(): void;
}
declare class ResourceVerifyStartEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.verify.start";
    get id(): string;
    count: number;
    totalLength: number;
    static create(count: number, totalLength: number): ResourceVerifyStartEventArgs;
    clear(): void;
}
declare class ResourceVerifySuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.verify.success";
    get id(): string;
    name: string;
    length: number;
    static create(name: string, length: number): ResourceVerifySuccessEventArgs;
    clear(): void;
}
declare class ResourceVerifyFailureEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.verify.failure";
    get id(): string;
    name: string;
    static create(name: string): ResourceVerifyFailureEventArgs;
    clear(): void;
}
declare class ResourceApplyStartEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.apply.start";
    get id(): string;
    resourcePackPath: string;
    count: number;
    totalCompressedLength: number;
    totalLength: number;
    static create(resourcePackPath: string, count: number, totalCompressedLength: number, totalLength: number): ResourceApplyStartEventArgs;
    clear(): void;
}
declare class ResourceApplySuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.apply.success";
    get id(): string;
    name: string;
    applyPath: string;
    resourcePackPath: string;
    compressedLength: number;
    length: number;
    static create(name: string, applyPath: string, resourcePackPath: string, compressedLength: number, length: number): ResourceApplySuccessEventArgs;
    clear(): void;
}
declare class ResourceApplyFailureEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.apply.failure";
    get id(): string;
    name: string;
    resourcePackPath: string;
    errorMessage: string;
    static create(name: string, resourcePackPath: string, errorMessage: string): ResourceApplyFailureEventArgs;
    clear(): void;
}
declare class LoadAssetSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.asset.loadSuccess";
    get id(): string;
    assetName: string;
    asset: object;
    duration: number;
    userData?: object;
    static create(assetName: string, asset: object, duration: number, userData?: object): LoadAssetSuccessEventArgs;
    clear(): void;
}
declare class LoadAssetFailureEventArgs extends BaseEventArgs {
    static readonly eventId = "resource.asset.loadFailure";
    get id(): string;
    assetName: string;
    errorMessage: string;
    userData?: object;
    static create(assetName: string, errorMessage: string, userData?: object): LoadAssetFailureEventArgs;
    clear(): void;
}

interface ISceneManager {
    readonly loadedSceneCount: number;
    readonly activeScene: string;
    hasScene(sceneName: string): boolean;
    loadScene(sceneName: string, priority?: number, onLoaded?: SceneLoadedCallback, onFailure?: SceneFailureCallback, userData?: object): void;
    unloadScene(sceneName: string, onUnloaded?: SceneUnloadedCallback, userData?: object): void;
    sceneIsLoaded(sceneName: string): boolean;
    sceneIsLoading(sceneName: string): boolean;
    sceneIsUnloading(sceneName: string): boolean;
    getLoadedSceneNames(): string[];
    getLoadingSceneNames(): string[];
    getUnloadingSceneNames(): string[];
    setSceneOrder(sceneName: string, sceneOrder: number): void;
    getSceneOrder(sceneName: string): number;
}
type SceneLoadedCallback = (sceneName: string, duration: number, userData?: object) => void;
type SceneUnloadedCallback = (sceneName: string, userData?: object) => void;
type SceneFailureCallback = (sceneName: string, errorMessage: string, userData?: object) => void;

declare class LoadSceneSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "scene.load.success";
    get id(): string;
    sceneName: string;
    duration: number;
    userData?: object;
    static create(sceneName: string, duration: number, userData?: object): LoadSceneSuccessEventArgs;
    clear(): void;
}
declare class LoadSceneFailureEventArgs extends BaseEventArgs {
    static readonly eventId = "scene.load.failure";
    get id(): string;
    sceneName: string;
    errorMessage: string;
    userData?: object;
    static create(sceneName: string, errorMessage: string, userData?: object): LoadSceneFailureEventArgs;
    clear(): void;
}
declare class LoadSceneUpdateEventArgs extends BaseEventArgs {
    static readonly eventId = "scene.load.update";
    get id(): string;
    sceneName: string;
    progress: number;
    userData?: object;
    static create(sceneName: string, progress: number, userData?: object): LoadSceneUpdateEventArgs;
    clear(): void;
}
declare class UnloadSceneSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "scene.unload.success";
    get id(): string;
    sceneName: string;
    userData?: object;
    static create(sceneName: string, userData?: object): UnloadSceneSuccessEventArgs;
    clear(): void;
}
declare class UnloadSceneFailureEventArgs extends BaseEventArgs {
    static readonly eventId = "scene.unload.failure";
    get id(): string;
    sceneName: string;
    userData?: object;
    static create(sceneName: string, userData?: object): UnloadSceneFailureEventArgs;
    clear(): void;
}
declare class ActiveSceneChangedEventArgs extends BaseEventArgs {
    static readonly eventId = "scene.active.changed";
    get id(): string;
    lastActiveScene: string;
    activeScene: string;
    static create(lastActiveScene: string, activeScene: string): ActiveSceneChangedEventArgs;
    clear(): void;
}

declare abstract class SceneManager extends GameFrameworkModule implements ISceneManager {
    private _loadedScenes;
    private _loadingScenes;
    private _unloadingScenes;
    private _sceneOrder;
    private _activeScene;
    private _eventManager;
    get priority(): number;
    get loadedSceneCount(): number;
    get activeScene(): string;
    setEventManager(eventManager: IEventManager): void;
    hasScene(sceneName: string): boolean;
    loadScene(sceneName: string, priority?: number, onLoaded?: SceneLoadedCallback, onFailure?: SceneFailureCallback, userData?: object): void;
    unloadScene(sceneName: string, onUnloaded?: SceneUnloadedCallback, userData?: object): void;
    setSceneOrder(sceneName: string, sceneOrder: number): void;
    getSceneOrder(sceneName: string): number;
    sceneIsLoaded(sceneName: string): boolean;
    sceneIsLoading(sceneName: string): boolean;
    sceneIsUnloading(sceneName: string): boolean;
    getLoadedSceneNames(): string[];
    getLoadingSceneNames(): string[];
    getUnloadingSceneNames(): string[];
    protected _refreshSceneOrder(): void;
    /**
     * @param onProgress progress < 1 为进度回调，=== 1 为成功回调
     */
    protected abstract _doLoadScene(sceneName: string, priority: number, onProgress: (name: string, progress: number) => void, onFailure: (name: string, msg: string) => void): void;
    protected abstract _doUnloadScene(sceneName: string, onSuccess: (name: string) => void, onFailure: (name: string) => void): void;
    protected _doSetActiveScene(_sceneName: string): void;
    update(_e: number, _r: number): void;
    shutdown(): void;
}

interface ISettingHelper {
    readonly count: number;
    load(): boolean;
    save(): boolean;
    getAllSettingNames(): string[];
    hasKey(settingName: string): boolean;
    removeKey(settingName: string): boolean;
    removeAllSettings(): void;
    getBool(settingName: string, defaultValue?: boolean): boolean;
    setBool(settingName: string, value: boolean): void;
    getInt(settingName: string, defaultValue?: number): number;
    setInt(settingName: string, value: number): void;
    getFloat(settingName: string, defaultValue?: number): number;
    setFloat(settingName: string, value: number): void;
    getString(settingName: string, defaultValue?: string): string;
    setString(settingName: string, value: string): void;
    getObject<T>(settingName: string, defaultValue?: T | null): T | null;
    setObject<T>(settingName: string, obj: T): void;
}

interface ISettingManager {
    readonly count: number;
    setSettingHelper(settingHelper: ISettingHelper): void;
    load(): boolean;
    save(): boolean;
    getAllSettingNames(): string[];
    hasKey(settingName: string): boolean;
    removeKey(settingName: string): boolean;
    removeAllSettings(): void;
    getBool(settingName: string, defaultValue?: boolean): boolean;
    setBool(settingName: string, value: boolean): void;
    getInt(settingName: string, defaultValue?: number): number;
    setInt(settingName: string, value: number): void;
    getFloat(settingName: string, defaultValue?: number): number;
    setFloat(settingName: string, value: number): void;
    getString(settingName: string, defaultValue?: string): string;
    setString(settingName: string, value: string): void;
    getObject<T>(settingName: string, defaultValue?: T | null): T | null;
    setObject<T>(settingName: string, obj: T): void;
}

declare class SettingManager extends GameFrameworkModule implements ISettingManager {
    private _helper;
    get priority(): number;
    get count(): number;
    setSettingHelper(settingHelper: ISettingHelper): void;
    load(): boolean;
    save(): boolean;
    getAllSettingNames(): string[];
    hasKey(settingName: string): boolean;
    removeKey(settingName: string): boolean;
    removeAllSettings(): void;
    getBool(settingName: string, defaultValue?: boolean): boolean;
    setBool(settingName: string, value: boolean): void;
    getInt(settingName: string, defaultValue?: number): number;
    setInt(settingName: string, value: number): void;
    getFloat(settingName: string, defaultValue?: number): number;
    setFloat(settingName: string, value: number): void;
    getString(settingName: string, defaultValue?: string): string;
    setString(settingName: string, value: string): void;
    getObject<T>(settingName: string, defaultValue?: T | null): T | null;
    setObject<T>(settingName: string, obj: T): void;
    update(_elapseSeconds: number, _realElapseSeconds: number): void;
    shutdown(): void;
    private _checkHelper;
    private _checkName;
}

/**
 * 声音辅助器接口。
 *
 * 负责释放不再使用的声音资源。
 */
interface ISoundHelper {
    /** 释放声音资源。 */
    releaseSoundAsset(soundAsset: object): void;
}

declare class PlaySoundParams implements IReference {
    private _referenced;
    time: number;
    muteInSoundGroup: boolean;
    loop: boolean;
    priority: number;
    volumeInSoundGroup: number;
    fadeInSeconds: number;
    pitch: number;
    panStereo: number;
    spatialBlend: number;
    maxDistance: number;
    dopplerLevel: number;
    get referenced(): boolean;
    static create(): PlaySoundParams;
    clear(): void;
}

declare class PlaySoundSuccessEventArgs extends BaseEventArgs {
    static readonly EVENT_ID = "Sound.PlaySoundSuccess";
    get id(): string;
    serialId: number;
    soundAssetName: string;
    soundAgent: ISoundAgent | null;
    duration: number;
    userData: object | null;
    static create(serialId: number, soundAssetName: string, soundAgent: ISoundAgent, duration: number, userData: object | null): PlaySoundSuccessEventArgs;
    clear(): void;
}

declare enum PlaySoundErrorCode {
    Unknown = 0,
    SoundGroupNotExist = 1,
    SoundGroupHasNoAgent = 2,
    LoadAssetFailure = 3,
    IgnoredDueToLowPriority = 4,
    SetSoundAssetFailure = 5
}

declare class PlaySoundFailureEventArgs extends BaseEventArgs {
    static readonly EVENT_ID = "Sound.PlaySoundFailure";
    get id(): string;
    serialId: number;
    soundAssetName: string;
    soundGroupName: string;
    playSoundParams: PlaySoundParams | null;
    errorCode: PlaySoundErrorCode;
    errorMessage: string;
    userData: object | null;
    static create(serialId: number, soundAssetName: string, soundGroupName: string, playSoundParams: PlaySoundParams | null, errorCode: PlaySoundErrorCode, errorMessage: string, userData: object | null): PlaySoundFailureEventArgs;
    clear(): void;
}

declare class PlaySoundUpdateEventArgs extends BaseEventArgs {
    static readonly EVENT_ID = "Sound.PlaySoundUpdate";
    get id(): string;
    serialId: number;
    soundAssetName: string;
    soundGroupName: string;
    playSoundParams: PlaySoundParams | null;
    progress: number;
    userData: object | null;
    static create(serialId: number, soundAssetName: string, soundGroupName: string, playSoundParams: PlaySoundParams | null, progress: number, userData: object | null): PlaySoundUpdateEventArgs;
    clear(): void;
}

declare class PlaySoundDependencyAssetEventArgs extends BaseEventArgs {
    static readonly EVENT_ID = "Sound.PlaySoundDependencyAsset";
    get id(): string;
    serialId: number;
    soundAssetName: string;
    soundGroupName: string;
    playSoundParams: PlaySoundParams | null;
    dependencyAssetName: string;
    loadedCount: number;
    totalCount: number;
    userData: object | null;
    static create(serialId: number, soundAssetName: string, soundGroupName: string, playSoundParams: PlaySoundParams | null, dependencyAssetName: string, loadedCount: number, totalCount: number, userData: object | null): PlaySoundDependencyAssetEventArgs;
    clear(): void;
}

interface ISoundAgent {
    readonly soundGroup: ISoundGroup;
    readonly serialId: number;
    readonly isPlaying: boolean;
    readonly length: number;
    time: number;
    readonly mute: boolean;
    muteInSoundGroup: boolean;
    loop: boolean;
    priority: number;
    readonly volume: number;
    volumeInSoundGroup: number;
    pitch: number;
    panStereo: number;
    spatialBlend: number;
    maxDistance: number;
    dopplerLevel: number;
    play(fadeInSeconds?: number): void;
    stop(fadeOutSeconds?: number): void;
    pause(fadeOutSeconds?: number): void;
    resume(fadeInSeconds?: number): void;
    reset(): void;
}
interface ISoundGroup {
    readonly name: string;
    readonly soundAgentCount: number;
    avoidBeingReplacedBySamePriority: boolean;
    mute: boolean;
    volume: number;
    stopAllLoadedSounds(fadeOutSeconds?: number): void;
}
type PlaySoundSuccessHandler = (args: PlaySoundSuccessEventArgs) => void;
type PlaySoundFailureHandler = (args: PlaySoundFailureEventArgs) => void;
type PlaySoundUpdateHandler = (args: PlaySoundUpdateEventArgs) => void;
type PlaySoundDependencyAssetHandler = (args: PlaySoundDependencyAssetEventArgs) => void;
interface ISoundManager {
    readonly soundGroupCount: number;
    onPlaySoundSuccess: PlaySoundSuccessHandler | null;
    onPlaySoundFailure: PlaySoundFailureHandler | null;
    onPlaySoundUpdate: PlaySoundUpdateHandler | null;
    onPlaySoundDependencyAsset: PlaySoundDependencyAssetHandler | null;
    addSoundGroup(groupName: string, avoidBeingReplacedBySamePriority?: boolean, mute?: boolean, volume?: number, agentCount?: number): boolean;
    hasSoundGroup(groupName: string): boolean;
    getSoundGroup(groupName: string): ISoundGroup | null;
    getAllSoundGroups(): ISoundGroup[];
    getAllLoadingSoundSerialIds(): number[];
    isLoadingSound(serialId: number): boolean;
    playSound(soundAssetName: string, bundleName: string, groupName: string, params?: PlaySoundParams, userData?: object): number;
    stopSound(serialId: number, fadeOutSeconds?: number): boolean;
    stopAllLoadedSounds(fadeOutSeconds?: number): void;
    stopAllLoadingSounds(): void;
    pauseSound(serialId: number, fadeOutSeconds?: number): void;
    resumeSound(serialId: number, fadeInSeconds?: number): void;
    isMuted(groupName: string): boolean;
    setMuted(groupName: string, mute: boolean): void;
    getVolume(groupName: string): number;
    setVolume(groupName: string, volume: number): void;
}

declare class SoundAgent implements ISoundAgent {
    readonly soundGroup: SoundGroup;
    private _serialId;
    private _soundAsset;
    private _muteInSoundGroup;
    private _volumeInSoundGroup;
    private _priority;
    private _loop;
    private _pitch;
    private _panStereo;
    private _spatialBlend;
    private _maxDistance;
    private _dopplerLevel;
    private _setSoundAssetTime;
    constructor(soundGroup: SoundGroup);
    get serialId(): number;
    get soundAsset(): object | null;
    get isPlaying(): boolean;
    get length(): number;
    get time(): number;
    set time(v: number);
    get mute(): boolean;
    get muteInSoundGroup(): boolean;
    set muteInSoundGroup(v: boolean);
    get loop(): boolean;
    set loop(v: boolean);
    get priority(): number;
    set priority(v: number);
    get volume(): number;
    get volumeInSoundGroup(): number;
    set volumeInSoundGroup(v: number);
    get pitch(): number;
    set pitch(v: number);
    get panStereo(): number;
    set panStereo(v: number);
    get spatialBlend(): number;
    set spatialBlend(v: number);
    get maxDistance(): number;
    set maxDistance(v: number);
    get dopplerLevel(): number;
    set dopplerLevel(v: number);
    get setSoundAssetTime(): number;
    play(fadeInSeconds?: number): void;
    stop(fadeOutSeconds?: number): void;
    pause(fadeOutSeconds?: number): void;
    resume(fadeInSeconds?: number): void;
    reset(): void;
    setSoundAsset(serialId: number, asset: object, params: PlaySoundParams): boolean;
    refreshMute(): void;
    refreshVolume(): void;
    private _refreshMute;
    private _refreshVolume;
    protected _doIsPlaying(): boolean;
    protected _doGetLength(): number;
    protected _doGetTime(): number;
    protected _doSetTime(_t: number): void;
    protected _doSetLoop(_v: boolean): void;
    protected _doSetMute(_v: boolean): void;
    protected _doSetVolume(_v: number): void;
    protected _doSetPitch(_v: number): void;
    protected _doSetPanStereo(_v: number): void;
    protected _doSetSpatialBlend(_v: number): void;
    protected _doSetMaxDistance(_v: number): void;
    protected _doSetDopplerLevel(_v: number): void;
    protected _doPlay(_fadeInSeconds: number): void;
    protected _doStop(_fadeOutSeconds: number): void;
    protected _doPause(_fadeOutSeconds: number): void;
    protected _doResume(_fadeInSeconds: number): void;
    protected _doReset(): void;
    protected _doSetSoundAsset(_asset: object, _params: PlaySoundParams): boolean;
}
declare class SoundGroup implements ISoundGroup {
    readonly name: string;
    readonly agents: SoundAgent[];
    private _avoidBeingReplacedBySamePriority;
    private _mute;
    private _volume;
    constructor(name: string, avoidBeingReplacedBySamePriority: boolean, mute: boolean, volume: number);
    get soundAgentCount(): number;
    get avoidBeingReplacedBySamePriority(): boolean;
    set avoidBeingReplacedBySamePriority(v: boolean);
    get mute(): boolean;
    set mute(v: boolean);
    get volume(): number;
    set volume(v: number);
    playSound(serialId: number, soundAsset: object, params: PlaySoundParams): {
        agent: SoundAgent | null;
        errorCode: PlaySoundErrorCode | null;
    };
    stopSound(serialId: number, fadeOutSeconds: number): boolean;
    pauseSound(serialId: number, fadeOutSeconds: number): boolean;
    resumeSound(serialId: number, fadeInSeconds: number): boolean;
    stopAllLoadedSounds(fadeOutSeconds?: number): void;
}
declare abstract class SoundManager extends GameFrameworkModule implements ISoundManager {
    protected _resourceManager: IResourceManager | null;
    protected _soundHelper: ISoundHelper | null;
    private _groups;
    private _soundsBeingLoaded;
    private _soundsToReleaseOnLoad;
    private _serialId;
    private _pendingLoadInfo;
    onPlaySoundSuccess: ((args: PlaySoundSuccessEventArgs) => void) | null;
    onPlaySoundFailure: ((args: PlaySoundFailureEventArgs) => void) | null;
    onPlaySoundUpdate: ((args: PlaySoundUpdateEventArgs) => void) | null;
    onPlaySoundDependencyAsset: ((args: PlaySoundDependencyAssetEventArgs) => void) | null;
    get priority(): number;
    get soundGroupCount(): number;
    setResourceManager(rm: IResourceManager): void;
    setSoundHelper(helper: ISoundHelper): void;
    addSoundGroup(groupName: string, avoidBeingReplacedBySamePriority?: boolean, mute?: boolean, volume?: number, agentCount?: number): boolean;
    hasSoundGroup(groupName: string): boolean;
    getSoundGroup(groupName: string): ISoundGroup | null;
    getAllSoundGroups(): ISoundGroup[];
    getAllLoadingSoundSerialIds(): number[];
    isLoadingSound(serialId: number): boolean;
    playSound(soundAssetName: string, bundleName: string, groupName: string, params?: PlaySoundParams, userData?: object): number;
    private _onLoadSuccess;
    private _onLoadFailure;
    private _cleanupPendingInfo;
    stopSound(serialId: number, fadeOutSeconds?: number): boolean;
    stopAllLoadedSounds(fadeOutSeconds?: number): void;
    stopAllLoadingSounds(): void;
    pauseSound(serialId: number, fadeOutSeconds?: number): void;
    resumeSound(serialId: number, fadeInSeconds?: number): void;
    isMuted(groupName: string): boolean;
    setMuted(groupName: string, mute: boolean): void;
    getVolume(groupName: string): number;
    setVolume(groupName: string, volume: number): void;
    protected abstract _createSoundAgent(group: SoundGroup): SoundAgent;
    protected _createSoundGroup(): new (name: string, avoidBeingReplacedBySamePriority: boolean, mute: boolean, volume: number) => SoundGroup;
    update(_e: number, _r: number): void;
    shutdown(): void;
}

interface IUIFormInfo {
    readonly serialId: number;
    readonly uiFormAssetName: string;
    readonly uiGroup: IUIGroup;
    readonly isPaused: boolean;
    readonly isCovered: boolean;
    readonly uiFormInstance: object | null;
}
interface IUIGroup {
    readonly name: string;
    depth: number;
    pause: boolean;
    readonly uiFormCount: number;
    readonly currentUIForm: IUIFormInfo | null;
    hasUIForm(serialId: number): boolean;
    hasUIFormByAsset(uiFormAssetName: string): boolean;
    getUIForm(serialId: number): IUIFormInfo | null;
    getUIFormByAsset(uiFormAssetName: string): IUIFormInfo | null;
    getUIForms(uiFormAssetName: string): IUIFormInfo[];
    getAllUIForms(): IUIFormInfo[];
}

/**
 * UI 窗体接口，对应原版 IUIForm。
 * 引擎层的 UIFormLogic Component 实现此接口。
 */
interface IUIForm {
    /** 序列号，由 UIManager 分配 */
    readonly serialId: number;
    /** 资源名称 */
    readonly uiFormAssetName: string;
    /** 所属 UI 组 */
    readonly uiGroup: IUIGroup;
    /** 深度（渲染层级） */
    readonly depthInUIGroup: number;
    /** 是否暂停被遮挡的 UI */
    readonly pauseCoveredUIForm: boolean;
    /** 初始化 UI 窗体 */
    onInit(serialId: number, uiFormAssetName: string, uiGroup: IUIGroup, pauseCoveredUIForm: boolean, isNewInstance: boolean, userData?: object): void;
    /** 打开 UI 窗体 */
    onOpen(userData?: object): void;
    /** 关闭 UI 窗体 */
    onClose(isShutdown: boolean, userData?: object): void;
    /** 暂停 UI 窗体（被其他 UI 遮盖时） */
    onPause(): void;
    /** 恢复 UI 窗体（遮盖解除时） */
    onResume(): void;
    /** 遮挡 UI 窗体（不是暂停，仅视觉遮挡） */
    onCover(): void;
    /** 解除遮挡 */
    onReveal(): void;
    /** 聚焦 UI 窗体 */
    onRefocus(userData?: object): void;
    /** UI 窗体轮询 */
    onUpdate(elapseSeconds: number, realElapseSeconds: number): void;
    /** UI 窗体深度变化时回调 */
    onDepthChanged(uiGroupDepth: number, depthInUIGroup: number): void;
    /** 回池时回调 */
    onRecycle(): void;
}

interface IUIFormHelper {
    instantiateUIForm(uiFormAsset: object): object;
    createUIForm(uiFormInstance: object, uiGroup: IUIGroup, userData?: object): void;
    onOpenUIForm(serialId: number, uiFormInstance: object, uiGroup: IUIGroup, pauseCoveredUIForm: boolean, depthInUIGroup: number, isNewInstance: boolean, userData?: object): void;
    onCloseUIForm(uiFormInstance: object, isShutdown: boolean, userData?: object): void;
    onRecycleUIForm(uiFormInstance: object): void;
    onReuseUIForm(uiFormInstance: object): void;
    onPauseUIForm(uiFormInstance: object): void;
    onResumeUIForm(uiFormInstance: object): void;
    onCoverUIForm?(uiFormInstance: object): void;
    onRevealUIForm?(uiFormInstance: object): void;
    onRefocusUIForm?(uiFormInstance: object, userData?: object): void;
    onDepthChangedUIForm?(uiFormInstance: object, uiGroupDepth: number, depthInUIGroup: number): void;
    onUpdateUIForm(uiFormInstance: object, elapseSeconds: number, realElapseSeconds: number): void;
    releaseUIForm(uiFormAsset: object, uiFormInstance: object): void;
}

/**
 * UI 组辅助接口，对应原版 IUIGroupHelper。
 * 负责管理一组 UI 的渲染深度与可见性。
 */
interface IUIGroupHelper {
    /** 设置 UI 组深度 */
    setDepth(uiGroup: IUIGroup, depth: number): void;
}

interface IUIManager {
    readonly uiGroupCount: number;
    readonly currentSerialId: number;
    instanceCapacity: number;
    instanceExpireTime: number;
    instanceAutoReleaseInterval: number;
    instancePriority: number;
    addUIGroup(groupName: string, depth?: number): boolean;
    hasUIGroup(groupName: string): boolean;
    getUIGroup(groupName: string): IUIGroup | null;
    getAllUIGroups(): IUIGroup[];
    removeUIGroup(groupName: string): boolean;
    openUIForm(uiFormAssetName: string, bundleName: string, groupName: string, pauseCoveredUIForm?: boolean, userData?: object): number;
    closeUIForm(serialId: number, userData?: object): void;
    closeUIFormByInstance(uiFormInstance: object, userData?: object): void;
    closeAllLoadedUIForms(userData?: object): void;
    closeAllLoadingUIForms(): void;
    hasUIForm(serialId: number): boolean;
    hasUIFormByAsset(uiFormAssetName: string): boolean;
    getUIForm(serialId: number): object | null;
    getUIFormByAsset(uiFormAssetName: string): object | null;
    getUIFormsByAsset(uiFormAssetName: string): object[];
    getAllLoadedUIForms(): object[];
    getAllLoadingUIFormSerialIds(): number[];
    isLoadingUIForm(serialId: number): boolean;
    isLoadingUIFormByAsset(uiFormAssetName: string): boolean;
    isValidUIForm(uiFormInstance: object): boolean;
    refocusUIForm(uiFormInstance: object, userData?: object): void;
    setUIFormInstanceLocked(uiFormInstance: object, locked: boolean): void;
    setUIFormInstancePriority(uiFormInstance: object, priority: number): void;
}

declare class OpenUIFormSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "ui.open.success";
    get id(): string;
    serialId: number;
    uiFormAssetName: string;
    uiGroupName: string;
    pauseCoveredUIForm: boolean;
    duration: number;
    userData?: object;
    static create(serialId: number, uiFormAssetName: string, uiGroupName: string, pauseCoveredUIForm: boolean, duration: number, userData?: object): OpenUIFormSuccessEventArgs;
    clear(): void;
}
declare class OpenUIFormFailureEventArgs extends BaseEventArgs {
    static readonly eventId = "ui.open.failure";
    get id(): string;
    serialId: number;
    uiFormAssetName: string;
    uiGroupName: string;
    pauseCoveredUIForm: boolean;
    errorMessage: string;
    userData?: object;
    static create(serialId: number, uiFormAssetName: string, uiGroupName: string, pauseCoveredUIForm: boolean, errorMessage: string, userData?: object): OpenUIFormFailureEventArgs;
    clear(): void;
}
declare class CloseUIFormCompleteEventArgs extends BaseEventArgs {
    static readonly eventId = "ui.close.complete";
    get id(): string;
    serialId: number;
    uiFormAssetName: string;
    uiGroupName: string;
    userData?: object;
    static create(serialId: number, uiFormAssetName: string, uiGroupName: string, userData?: object): CloseUIFormCompleteEventArgs;
    clear(): void;
}
declare class OpenUIFormUpdateEventArgs extends BaseEventArgs {
    static readonly eventId = "ui.open.update";
    get id(): string;
    serialId: number;
    uiFormAssetName: string;
    uiGroupName: string;
    pauseCoveredUIForm: boolean;
    progress: number;
    userData?: object;
    static create(serialId: number, uiFormAssetName: string, uiGroupName: string, pauseCoveredUIForm: boolean, progress: number, userData?: object): OpenUIFormUpdateEventArgs;
    clear(): void;
}
declare class OpenUIFormDependencyAssetEventArgs extends BaseEventArgs {
    static readonly eventId = "ui.open.dependency";
    get id(): string;
    serialId: number;
    uiFormAssetName: string;
    uiGroupName: string;
    pauseCoveredUIForm: boolean;
    dependencyAssetName: string;
    loadedCount: number;
    totalCount: number;
    userData?: object;
    static create(serialId: number, uiFormAssetName: string, uiGroupName: string, pauseCoveredUIForm: boolean, dependencyAssetName: string, loadedCount: number, totalCount: number, userData?: object): OpenUIFormDependencyAssetEventArgs;
    clear(): void;
}

declare class UIManager extends GameFrameworkModule implements IUIManager {
    private _uiFormHelper;
    private _resourceManager;
    private _groups;
    private _forms;
    private _serialId;
    private _pool;
    private _autoReleaseTimer;
    private _instanceCapacity;
    private _instanceExpireTime;
    private _instanceAutoReleaseInterval;
    private _instancePriority;
    private _cancelledIds;
    onOpenUIFormSuccess: ((serialId: number, uiFormAssetName: string, uiGroupName: string, pauseCoveredUIForm: boolean, duration: number, userData?: object) => void) | null;
    onOpenUIFormFailure: ((serialId: number, uiFormAssetName: string, uiGroupName: string, pauseCoveredUIForm: boolean, errorMessage: string, userData?: object) => void) | null;
    onCloseUIFormComplete: ((serialId: number, uiFormAssetName: string, uiGroupName: string, userData?: object) => void) | null;
    get priority(): number;
    get uiGroupCount(): number;
    get currentSerialId(): number;
    get instanceCapacity(): number;
    set instanceCapacity(v: number);
    get instanceExpireTime(): number;
    set instanceExpireTime(v: number);
    get instanceAutoReleaseInterval(): number;
    set instanceAutoReleaseInterval(v: number);
    get instancePriority(): number;
    set instancePriority(v: number);
    setHelper(helper: IUIFormHelper): void;
    setResourceManager(rm: IResourceManager): void;
    addUIGroup(groupName: string, depth?: number): boolean;
    hasUIGroup(groupName: string): boolean;
    getUIGroup(groupName: string): IUIGroup | null;
    getAllUIGroups(): IUIGroup[];
    removeUIGroup(groupName: string): boolean;
    openUIForm(uiFormAssetName: string, bundleName: string, groupName: string, pauseCoveredUIForm?: boolean, userData?: object): number;
    private _onLoadSuccess;
    private _onLoadFailure;
    private _activateForm;
    closeUIForm(serialId: number, userData?: object): void;
    closeUIFormByInstance(uiFormInstance: object, userData?: object): void;
    private _internalClose;
    closeAllLoadedUIForms(userData?: object): void;
    closeAllLoadingUIForms(): void;
    private _notifyGroupDepthChanged;
    hasUIForm(serialId: number): boolean;
    hasUIFormByAsset(uiFormAssetName: string): boolean;
    getUIForm(serialId: number): object | null;
    getUIFormByAsset(uiFormAssetName: string): object | null;
    getUIFormsByAsset(uiFormAssetName: string): object[];
    getAllLoadedUIForms(): object[];
    getAllLoadingUIFormSerialIds(): number[];
    isLoadingUIForm(serialId: number): boolean;
    isLoadingUIFormByAsset(uiFormAssetName: string): boolean;
    isValidUIForm(uiFormInstance: object): boolean;
    refocusUIForm(uiFormInstance: object, userData?: object): void;
    setUIFormInstanceLocked(uiFormInstance: object, locked: boolean): void;
    setUIFormInstancePriority(uiFormInstance: object, priority: number): void;
    private _acquireFromPool;
    private _returnToPool;
    private _releaseExpiredPoolEntries;
    update(elapseSeconds: number, realElapseSeconds: number): void;
    shutdown(): void;
}

/**
 * Extensions for reading/writing 7-bit encoded integers and encrypted strings,
 * ported from UnityGameFramework BinaryExtension.cs.
 *
 * These operate on a raw byte buffer with a position cursor rather than BinaryReader/Writer,
 * which doesn't exist in JavaScript.
 */
declare class BinaryExtension {
    /** Read a 7-bit encoded variable-length Int32 from buf at pos; advances pos. */
    static read7BitEncodedInt32(buf: Uint8Array, pos: {
        value: number;
    }): number;
    /** Write a 7-bit encoded variable-length Int32 into buf at pos; advances pos. */
    static write7BitEncodedInt32(buf: Uint8Array, pos: {
        value: number;
    }, value: number): void;
    /** Read a 7-bit encoded variable-length UInt32. */
    static read7BitEncodedUint32(buf: Uint8Array, pos: {
        value: number;
    }): number;
    /** Write a 7-bit encoded variable-length UInt32. */
    static write7BitEncodedUint32(buf: Uint8Array, pos: {
        value: number;
    }, value: number): void;
    /**
     * Read an encrypted string from buf at pos using the given XOR key.
     * Format: [7-bit encoded length][XOR-encrypted UTF-8 bytes]
     */
    static readEncryptedString(buf: Uint8Array, pos: {
        value: number;
    }, key: Uint8Array): string | null;
    /**
     * Write an encrypted string into buf at pos using the given XOR key.
     * Format: [7-bit encoded length][XOR-encrypted UTF-8 bytes]
     */
    static writeEncryptedString(buf: Uint8Array, pos: {
        value: number;
    }, value: string | null, key: Uint8Array): void;
}

/**
 * String utility extensions, ported from UnityGameFramework StringExtension.cs.
 */
declare class StringExtension {
    /**
     * Reads the next line from a string starting at position.
     * Advances pos.value past the line terminator.
     * Returns null when there are no more characters.
     */
    static readLine(str: string, pos: {
        value: number;
    }): string | null;
}

/** 压缩辅助接口，对应原版 Utility.Compression.ICompressionHelper */
interface ICompressionHelper {
    /**
     * 压缩数据。
     * @param bytes 待压缩的原始字节
     * @returns 压缩后的字节，失败时返回 null
     */
    compress(bytes: Uint8Array): Uint8Array | null;
    /**
     * 解压数据。
     * @param bytes 待解压的压缩字节
     * @returns 解压后的字节，失败时返回 null
     */
    decompress(bytes: Uint8Array): Uint8Array | null;
}
declare class UtilityCompression {
    private static _helper;
    static setCompressionHelper(helper: ICompressionHelper): void;
    /**
     * 压缩数据。需先调用 setCompressionHelper 注入具体实现。
     */
    static compress(bytes: Uint8Array): Uint8Array;
    /**
     * 解压数据。需先调用 setCompressionHelper 注入具体实现。
     */
    static decompress(bytes: Uint8Array): Uint8Array;
    /** 当前是否已注入压缩辅助器 */
    static get hasHelper(): boolean;
}

/**
 * Byte-level type conversion utilities.
 * Uses DataView for correct endianness handling.
 */
declare class UtilityConverter {
    private static readonly _view;
    static get isLittleEndian(): boolean;
    static getBytesFromBool(value: boolean): Uint8Array;
    static getBytesFromInt16(value: number): Uint8Array;
    static getBytesFromUint16(value: number): Uint8Array;
    static getBytesFromInt32(value: number): Uint8Array;
    static getBytesFromUint32(value: number): Uint8Array;
    static getBytesFromFloat32(value: number): Uint8Array;
    static getBytesFromFloat64(value: number): Uint8Array;
    static getBytesFromString(value: string): Uint8Array;
    static getBool(data: Uint8Array, offset?: number): boolean;
    static getInt16(data: Uint8Array, offset?: number): number;
    static getUint16(data: Uint8Array, offset?: number): number;
    static getInt32(data: Uint8Array, offset?: number): number;
    static getUint32(data: Uint8Array, offset?: number): number;
    static getFloat32(data: Uint8Array, offset?: number): number;
    static getFloat64(data: Uint8Array, offset?: number): number;
    static getString(data: Uint8Array, offset?: number, length?: number): string;
}

declare class UtilityEncryption {
    private static readonly _quickXorMaxLength;
    /** XOR the first min(length, 220) bytes of data with key (in-place). */
    static getQuickXorBytes(data: Uint8Array, key: Uint8Array): void;
    /** XOR each byte of data with the corresponding cycled key byte (in-place). */
    static getSelfXorBytes(data: Uint8Array, key: Uint8Array): void;
    /** XOR all bytes of data with the full key cycled, returns a new Uint8Array. */
    static getXorBytes(data: Uint8Array, key: Uint8Array, offset?: number, length?: number): Uint8Array;
}

interface IJsonHelper {
    toJson(obj: object): string;
    toObject<T>(json: string): T;
    toObjectOfType(type: new (...args: any[]) => any, json: string): any;
}
declare class UtilityJson {
    private static _helper;
    static setJsonHelper(helper: IJsonHelper): void;
    static toJson(obj: object): string;
    static toObject<T>(json: string): T;
    static toObjectOfType<T>(type: new (...args: any[]) => T, json: string): T;
}

declare class UtilityPath {
    /** Normalizes backslashes to forward slashes. */
    static getRegularPath(path: string): string;
    /** Converts a local path to a remote URL (adds file:/// prefix if not already a URL). */
    static getRemotePath(path: string): string;
    /** Joins path segments, normalizing slashes. */
    static combine(...segments: string[]): string;
    /** Returns the directory part of a path (everything before the last '/'). */
    static getDirectoryName(path: string): string;
    /** Returns the filename including extension. */
    static getFileName(path: string): string;
    /** Returns the filename without extension. */
    static getFileNameWithoutExtension(path: string): string;
    /** Returns the file extension including the leading dot (e.g. ".png"). */
    static getExtension(path: string): string;
}

/**
 * Seeded pseudorandom number generator using a linear congruential algorithm,
 * matching the original GameFramework Utility.Random behavior.
 */
declare class UtilityRandom {
    private static _seed;
    static setSeed(seed: number): void;
    /** Returns a non-negative pseudorandom integer. */
    static getRandom(): number;
    /** Returns a pseudorandom integer in [0, maxValue). */
    static getRandomMax(maxValue: number): number;
    /** Returns a pseudorandom integer in [minValue, maxValue). */
    static getRandomRange(minValue: number, maxValue: number): number;
    /** Returns a pseudorandom float in [0.0, 1.0). */
    static getRandomDouble(): number;
    /** Fills the given Uint8Array with pseudorandom bytes. */
    static getRandomBytes(result: Uint8Array): void;
}

interface ITextHelper {
    format(format: string, ...args: any[]): string;
}
declare class UtilityText {
    private static _helper;
    static setTextHelper(helper: ITextHelper): void;
    static format(fmt: string, ...args: any[]): string;
    static format1<T0>(fmt: string, a0: T0): string;
    static format2<T0, T1>(fmt: string, a0: T0, a1: T1): string;
    static format3<T0, T1, T2>(fmt: string, a0: T0, a1: T1, a2: T2): string;
    static format4<T0, T1, T2, T3>(fmt: string, a0: T0, a1: T1, a2: T2, a3: T3): string;
    static format5<T0, T1, T2, T3, T4>(fmt: string, a0: T0, a1: T1, a2: T2, a3: T3, a4: T4): string;
    static format6<T0, T1, T2, T3, T4, T5>(fmt: string, a0: T0, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5): string;
    static format7<T0, T1, T2, T3, T4, T5, T6>(fmt: string, a0: T0, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): string;
    static format8<T0, T1, T2, T3, T4, T5, T6, T7>(fmt: string, a0: T0, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7): string;
}

declare class UtilityVerifier {
    private static readonly _crc32Table;
    private static _buffer;
    private static _buildTable;
    static getCrc32(data: Uint8Array, offset?: number, length?: number): number;
    static getCrc32FromStream(getBytes: (buf: Uint8Array) => number, xorKey?: Uint8Array): number;
    static getCrc32Bytes(crc32: number): Uint8Array;
}

declare const Utility: {
    Verifier: typeof UtilityVerifier;
    Encryption: typeof UtilityEncryption;
    Random: typeof UtilityRandom;
    Json: typeof UtilityJson;
    Text: typeof UtilityText;
    Converter: typeof UtilityConverter;
    Path: typeof UtilityPath;
    Compression: typeof UtilityCompression;
};

/**
 * 泛型变量基类，对应原版 Variable<T>。
 * 所有 VarXxx 类型均继承此类，配合 ReferencePool 使用。
 */
declare abstract class Variable<T> implements IReference {
    protected _value: T;
    get value(): T;
    set value(v: T);
    abstract clear(): void;
}
declare class VarBoolean extends Variable<boolean> {
    static create(value: boolean): VarBoolean;
    clear(): void;
}
declare class VarInt8 extends Variable<number> {
    static create(value: number): VarInt8;
    clear(): void;
}
declare class VarUInt8 extends Variable<number> {
    static create(value: number): VarUInt8;
    clear(): void;
}
declare class VarInt16 extends Variable<number> {
    static create(value: number): VarInt16;
    clear(): void;
}
declare class VarUInt16 extends Variable<number> {
    static create(value: number): VarUInt16;
    clear(): void;
}
declare class VarInt32 extends Variable<number> {
    static create(value: number): VarInt32;
    clear(): void;
}
declare class VarUInt32 extends Variable<number> {
    static create(value: number): VarUInt32;
    clear(): void;
}
/** 对应 C# long（64位整数），TS 中使用 number（精度有限），大数请用 VarBigInt */
declare class VarInt64 extends Variable<number> {
    static create(value: number): VarInt64;
    clear(): void;
}
/** 对应 C# ulong。ES2015 不支持 bigint，使用 number 存储（超过 2^53 精度有限）。 */
declare class VarUInt64 extends Variable<number> {
    static create(value: number): VarUInt64;
    clear(): void;
}
declare class VarFloat extends Variable<number> {
    static create(value: number): VarFloat;
    clear(): void;
}
declare class VarDouble extends Variable<number> {
    static create(value: number): VarDouble;
    clear(): void;
}
declare class VarChar extends Variable<string> {
    static create(value: string): VarChar;
    clear(): void;
}
declare class VarString extends Variable<string> {
    static create(value: string): VarString;
    clear(): void;
}
declare class VarByteArray extends Variable<Uint8Array> {
    static create(value: Uint8Array): VarByteArray;
    clear(): void;
}
declare class VarCharArray extends Variable<string[]> {
    static create(value: string[]): VarCharArray;
    clear(): void;
}
declare class VarDateTime extends Variable<Date> {
    static create(value: Date): VarDateTime;
    clear(): void;
}
/** 通用对象变量，对应 C# VarObject */
declare class VarObject extends Variable<object | null> {
    static create(value: object | null): VarObject;
    clear(): void;
}
/** 对应 C# VarVector2，存储 {x, y} */
declare class VarVec2 extends Variable<{
    x: number;
    y: number;
}> {
    static create(x: number, y: number): VarVec2;
    clear(): void;
}
/** 对应 C# VarVector3，存储 {x, y, z} */
declare class VarVec3 extends Variable<{
    x: number;
    y: number;
    z: number;
}> {
    static create(x: number, y: number, z: number): VarVec3;
    clear(): void;
}
/** 对应 C# VarVector4，存储 {x, y, z, w} */
declare class VarVec4 extends Variable<{
    x: number;
    y: number;
    z: number;
    w: number;
}> {
    static create(x: number, y: number, z: number, w: number): VarVec4;
    clear(): void;
}
/** 对应 C# VarQuaternion，存储 {x, y, z, w} */
declare class VarQuat extends Variable<{
    x: number;
    y: number;
    z: number;
    w: number;
}> {
    static create(x: number, y: number, z: number, w: number): VarQuat;
    clear(): void;
}
/** 对应 C# VarColor，存储 {r, g, b, a}（0-255） */
declare class VarColor extends Variable<{
    r: number;
    g: number;
    b: number;
    a: number;
}> {
    static create(r: number, g: number, b: number, a?: number): VarColor;
    clear(): void;
}
/** 对应 C# VarRect，存储 {x, y, width, height} */
declare class VarRect extends Variable<{
    x: number;
    y: number;
    width: number;
    height: number;
}> {
    static create(x: number, y: number, width: number, height: number): VarRect;
    clear(): void;
}

interface IWebRequestInfo {
    readonly serialId: number;
    readonly webRequestUri: string;
    readonly tag: string;
    readonly priority: number;
    readonly userData?: object;
}
interface IWebRequestParams {
    /** POST 数据，不传则为 GET 请求 */
    postData?: ArrayBuffer | string;
    /** 自定义请求头 */
    headers?: Record<string, string>;
    tag?: string;
    priority?: number;
    userData?: object;
}
interface IWebRequestManager {
    /** 并发请求代理总数 */
    readonly totalAgentCount: number;
    /** 空闲代理数 */
    readonly freeAgentCount: number;
    /** 工作中代理数 */
    readonly workingAgentCount: number;
    /** 等待中任务数 */
    readonly waitingTaskCount: number;
    /** 超时时长（秒） */
    timeout: number;
    addWebRequest(webRequestUri: string, params?: IWebRequestParams): number;
    removeWebRequest(serialId: number): boolean;
    removeWebRequests(tag: string): number;
    removeAllWebRequests(): number;
    getWebRequestInfo(serialId: number): IWebRequestInfo | null;
    getWebRequestInfosByTag(tag: string): IWebRequestInfo[];
    getAllWebRequestInfos(): IWebRequestInfo[];
}

declare class WebRequestStartEventArgs extends BaseEventArgs {
    static readonly eventId = "webRequest.start";
    get id(): string;
    serialId: number;
    webRequestUri: string;
    userData?: object;
    static create(serialId: number, webRequestUri: string, userData?: object): WebRequestStartEventArgs;
    clear(): void;
}
declare class WebRequestSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = "webRequest.success";
    get id(): string;
    serialId: number;
    webRequestUri: string;
    /** 响应体，GET 请求为 ArrayBuffer，也可能是文本 */
    responseData: ArrayBuffer;
    userData?: object;
    static create(serialId: number, webRequestUri: string, responseData: ArrayBuffer, userData?: object): WebRequestSuccessEventArgs;
    clear(): void;
}
declare class WebRequestFailureEventArgs extends BaseEventArgs {
    static readonly eventId = "webRequest.failure";
    get id(): string;
    serialId: number;
    webRequestUri: string;
    errorMessage: string;
    userData?: object;
    static create(serialId: number, webRequestUri: string, errorMessage: string, userData?: object): WebRequestFailureEventArgs;
    clear(): void;
}

declare enum WebRequestTaskStatus {
    Todo = 0,
    Doing = 1,
    Done = 2,
    Error = 3
}
declare class WebRequestTask implements IWebRequestInfo {
    private static _serial;
    readonly serialId: number;
    readonly webRequestUri: string;
    readonly postData: ArrayBuffer | string | null;
    readonly headers: Record<string, string>;
    readonly tag: string;
    readonly priority: number;
    readonly userData?: object;
    status: WebRequestTaskStatus;
    constructor(webRequestUri: string, postData: ArrayBuffer | string | null, headers: Record<string, string>, tag: string, priority: number, userData?: object);
}
declare abstract class WebRequestManager extends GameFrameworkModule implements IWebRequestManager {
    protected _eventManager: IEventManager | null;
    private _waitingTasks;
    private _workingTasks;
    private _timeout;
    private _maxConcurrent;
    get priority(): number;
    get timeout(): number;
    set timeout(value: number);
    get maxConcurrent(): number;
    set maxConcurrent(value: number);
    get totalAgentCount(): number;
    get freeAgentCount(): number;
    get workingAgentCount(): number;
    get waitingTaskCount(): number;
    setEventManager(eventManager: IEventManager): void;
    addWebRequest(webRequestUri: string, params?: IWebRequestParams): number;
    removeWebRequest(serialId: number): boolean;
    removeWebRequests(tag: string): number;
    removeAllWebRequests(): number;
    getWebRequestInfo(serialId: number): IWebRequestInfo | null;
    getWebRequestInfosByTag(tag: string): IWebRequestInfo[];
    getAllWebRequestInfos(): IWebRequestInfo[];
    update(_elapseSeconds: number, _realElapseSeconds: number): void;
    shutdown(): void;
    protected _onWebRequestStart(serialId: number): void;
    protected _onWebRequestSuccess(serialId: number, responseData: ArrayBuffer): void;
    protected _onWebRequestFailure(serialId: number, errorMessage: string): void;
    private _enqueue;
    private _scheduleNext;
    protected abstract _doWebRequest(task: WebRequestTask): void;
    protected abstract _doCancelWebRequest(serialId: number): void;
}

export { ActiveSceneChangedEventArgs, AddressFamily, AttachEntitySuccessEventArgs, BaseEventArgs, BinaryExtension, CloseUIFormCompleteEventArgs, ConfigManager, DataNode, DataNodeManager, DataTable, DataTableManager, DetachEntitySuccessEventArgs, DownloadFailureEventArgs, DownloadManager, DownloadStartEventArgs, DownloadSuccessEventArgs, DownloadTask, DownloadTaskStatus, DownloadUpdateEventArgs, EntityManager, EntityStatus, EventManager, EventPoolMode, FileSystem, FileSystemAccess, FileSystemManager, FileSystemStream, Fsm, FsmManager, FsmState, GameEventArgs, GameFrameworkEntry, GameFrameworkError, GameFrameworkLinkedList, GameFrameworkLinkedListRange, GameFrameworkLog, GameFrameworkLogLevel, GameFrameworkModule, GameFrameworkMultiDictionary, HasAssetResult, HideEntityCompleteEventArgs, INVALID_FILE_INFO, LinkedListNode, LoadAssetFailureEventArgs, LoadAssetSuccessEventArgs, LoadSceneFailureEventArgs, LoadSceneSuccessEventArgs, LoadSceneUpdateEventArgs, LocalizationManager, MODULE_ID, NetworkClosedEventArgs, NetworkConnectedEventArgs, NetworkCustomErrorEventArgs, NetworkErrorCode, NetworkErrorEventArgs, NetworkManager, NetworkMissHeartBeatEventArgs, ObjectBase, ObjectInfo, ObjectPool, ObjectPoolManager, OpenUIFormDependencyAssetEventArgs, OpenUIFormFailureEventArgs, OpenUIFormSuccessEventArgs, OpenUIFormUpdateEventArgs, Packet, PlaySoundDependencyAssetEventArgs, PlaySoundErrorCode, PlaySoundFailureEventArgs, PlaySoundParams, PlaySoundSuccessEventArgs, PlaySoundUpdateEventArgs, ProcedureBase, ProcedureManager, ReferencePool, ReferencePoolInfo, ResourceApplyFailureEventArgs, ResourceApplyStartEventArgs, ResourceApplySuccessEventArgs, ResourceLoadSceneFailureEventArgs, ResourceLoadSceneSuccessEventArgs, ResourceUnloadSceneFailureEventArgs, ResourceUnloadSceneSuccessEventArgs, ResourceUpdateAllCompleteEventArgs, ResourceUpdateChangedEventArgs, ResourceUpdateFailureEventArgs, ResourceUpdateStartEventArgs, ResourceUpdateSuccessEventArgs, ResourceVerifyFailureEventArgs, ResourceVerifyStartEventArgs, ResourceVerifySuccessEventArgs, SceneManager, SeekOrigin, ServiceType, SettingManager, ShowEntityFailureEventArgs, ShowEntitySuccessEventArgs, SoundAgent, SoundGroup, SoundManager, StartTaskStatus, StringExtension, TaskBase, TaskInfo, TaskPool, TaskStatus, UIManager, UnloadSceneFailureEventArgs, UnloadSceneSuccessEventArgs, Utility, UtilityCompression, UtilityConverter, UtilityEncryption, UtilityJson, UtilityPath, UtilityRandom, UtilityText, UtilityVerifier, VarBoolean, VarByteArray, VarChar, VarCharArray, VarColor, VarDateTime, VarDouble, VarFloat, VarInt16, VarInt32, VarInt64, VarInt8, VarObject, VarQuat, VarRect, VarString, VarUInt16, VarUInt32, VarUInt64, VarUInt8, VarVec2, VarVec3, VarVec4, Variable, WebRequestFailureEventArgs, WebRequestManager, WebRequestStartEventArgs, WebRequestSuccessEventArgs, WebRequestTask, WebRequestTaskStatus, makeFileInfo };
export type { EventHandler, FileInfo, HttpFailureCallback, HttpMethod, HttpSuccessCallback, ICompressionHelper, IConfigHelper, IConfigManager, IDataNode, IDataNodeManager, IDataRow, IDataTable, IDataTableHelper, IDataTableManager, IDownloadAgentHelper, IDownloadInfo, IDownloadManager, IDownloadParams, IEntity, IEntityGroup, IEntityGroupHelper, IEntityHelper, IEntityInfo, IEntityManager, IEventManager, IFileSystem, IFileSystemHelper, IFileSystemManager, IFsm, IFsmManager, IHttpRequestParams, IHttpResponse, IJsonHelper, ILocalizationHelper, ILocalizationManager, ILogHelper, INetworkChannel, INetworkChannelHelper, INetworkManager, IObjectPool, IObjectPoolManager, IPacketHandler, IPacketHeader, IProcedureManager, IReference, IResourceGroup, IResourceManager, ISceneManager, ISettingHelper, ISettingManager, ISoundAgent, ISoundGroup, ISoundHelper, ISoundManager, ITaskAgent, ITextHelper, IUIForm, IUIFormHelper, IUIFormInfo, IUIGroup, IUIGroupHelper, IUIManager, IWebRequestInfo, IWebRequestManager, IWebRequestParams, LoadFailureCallback, LoadProgressCallback, LoadSceneFailureCallback, LoadSceneSuccessCallback, LoadSuccessCallback, ModuleId, PlaySoundDependencyAssetHandler, PlaySoundFailureHandler, PlaySoundSuccessHandler, PlaySoundUpdateHandler, ReleaseObjectFilterCallback, ResourceUpdateStatus, SceneFailureCallback, SceneLoadedCallback, SceneUnloadedCallback, UnloadSceneFailureCallback, UnloadSceneSuccessCallback };
