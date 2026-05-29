class GameFrameworkError extends Error {
    constructor(message) {
        super(`[GameFramework] ${message}`);
        this.name = 'GameFrameworkError';
    }
}

class GameFrameworkEntry {
    // 获取已注册的模块；若未注册则抛出，避免返回无 Helper 的裸实例。
    // 所有模块由各 XxxComponent.onLoad() 通过 registerModule() 注册，
    // 确保在 GameEntry.start() 之前完成。
    static getModule(ctor, moduleId) {
        const m = this._moduleMap.get(moduleId);
        if (!m) {
            throw new GameFrameworkError(`Module [${moduleId}] is not registered. ` +
                `Make sure the corresponding XxxComponent is attached to the scene and its onLoad() has run.`);
        }
        return m;
    }
    // 注册外部已创建的实例（引擎层注入具体实现）
    static registerModule(moduleId, module) {
        if (this._moduleMap.has(moduleId)) {
            throw new GameFrameworkError(`Module [${moduleId}] is already registered.`);
        }
        this._moduleMap.set(moduleId, module);
        this._insertModuleSorted(module);
    }
    // 每帧由 GameEntry Component 驱动
    static update(elapseSeconds, realElapseSeconds) {
        let node = this._head;
        while (node) {
            node.module.update(elapseSeconds, realElapseSeconds);
            node = node.next;
        }
    }
    // 倒序 Shutdown（与 update 顺序相反，低优先级先销毁）
    static shutdown() {
        const modules = [];
        let node = this._head;
        while (node) {
            modules.push(node.module);
            node = node.next;
        }
        for (let i = modules.length - 1; i >= 0; i--) {
            modules[i].shutdown();
        }
        this._moduleMap.clear();
        this._head = null;
    }
    static hasModule(moduleId) {
        return this._moduleMap.has(moduleId);
    }
    // 按 priority 降序插入（高 priority 在链表前面，先 update）
    static _insertModuleSorted(module) {
        const newNode = { module, prev: null, next: null };
        if (!this._head || module.priority >= this._head.module.priority) {
            newNode.next = this._head;
            if (this._head) {
                this._head.prev = newNode;
            }
            this._head = newNode;
            return;
        }
        let cur = this._head;
        while (cur.next && cur.next.module.priority > module.priority) {
            cur = cur.next;
        }
        newNode.next = cur.next;
        newNode.prev = cur;
        if (cur.next) {
            cur.next.prev = newNode;
        }
        cur.next = newNode;
    }
}
GameFrameworkEntry._moduleMap = new Map();
GameFrameworkEntry._head = null;

class GameFrameworkModule {
    get priority() {
        return 0;
    }
}

const MODULE_ID = {
    EVENT: 'GameFramework.IEventManager',
    FSM: 'GameFramework.IFsmManager',
    PROCEDURE: 'GameFramework.IProcedureManager',
    SETTING: 'GameFramework.ISettingManager',
    CONFIG: 'GameFramework.IConfigManager',
    DATATABLE: 'GameFramework.IDataTableManager',
    RESOURCE: 'GameFramework.IResourceManager',
    OBJPOOL: 'GameFramework.IObjectPoolManager',
    UI: 'GameFramework.IUIManager',
    ENTITY: 'GameFramework.IEntityManager',
    SOUND: 'GameFramework.ISoundManager',
    SCENE: 'GameFramework.ISceneManager',
    NETWORK: 'GameFramework.INetworkManager',
    LOCALIZATION: 'GameFramework.ILocalizationManager',
    DOWNLOAD: 'GameFramework.IDownloadManager',
    WEBREQUEST: 'GameFramework.IWebRequestManager',
    DATANODE: 'GameFramework.IDataNodeManager',
    FILESYSTEM: 'GameFramework.IFileSystemManager',
};

class LinkedListNode {
    constructor(value) {
        this.prev = null;
        this.next = null;
        this.value = value;
    }
}
class GameFrameworkLinkedList {
    constructor() {
        this._head = null;
        this._tail = null;
        this._count = 0;
        this._cachedNodes = [];
    }
    get count() { return this._count; }
    get first() { return this._head; }
    get last() { return this._tail; }
    get cachedNodeCount() { return this._cachedNodes.length; }
    acquireNode(value) {
        const node = this._cachedNodes.pop();
        if (node) {
            node.value = value;
            node.prev = null;
            node.next = null;
            return node;
        }
        return new LinkedListNode(value);
    }
    releaseNode(node) {
        node.value = undefined;
        node.prev = null;
        node.next = null;
        this._cachedNodes.push(node);
    }
    addFirst(value) {
        const node = this.acquireNode(value);
        node.next = this._head;
        if (this._head)
            this._head.prev = node;
        this._head = node;
        if (!this._tail)
            this._tail = node;
        this._count++;
        return node;
    }
    addLast(value) {
        const node = this.acquireNode(value);
        node.prev = this._tail;
        if (this._tail)
            this._tail.next = node;
        this._tail = node;
        if (!this._head)
            this._head = node;
        this._count++;
        return node;
    }
    addBefore(refNode, value) {
        const node = this.acquireNode(value);
        node.next = refNode;
        node.prev = refNode.prev;
        if (refNode.prev)
            refNode.prev.next = node;
        else
            this._head = node;
        refNode.prev = node;
        this._count++;
        return node;
    }
    addAfter(refNode, value) {
        const node = this.acquireNode(value);
        node.prev = refNode;
        node.next = refNode.next;
        if (refNode.next)
            refNode.next.prev = node;
        else
            this._tail = node;
        refNode.next = node;
        this._count++;
        return node;
    }
    remove(node) {
        if (node.prev)
            node.prev.next = node.next;
        else
            this._head = node.next;
        if (node.next)
            node.next.prev = node.prev;
        else
            this._tail = node.prev;
        this._count--;
        this.releaseNode(node);
    }
    removeFirst() {
        if (this._head)
            this.remove(this._head);
    }
    removeLast() {
        if (this._tail)
            this.remove(this._tail);
    }
    find(value) {
        let node = this._head;
        while (node) {
            if (node.value === value)
                return node;
            node = node.next;
        }
        return null;
    }
    contains(value) {
        return this.find(value) !== null;
    }
    clear() {
        let node = this._head;
        while (node) {
            const next = node.next;
            this.releaseNode(node);
            node = next;
        }
        this._head = null;
        this._tail = null;
        this._count = 0;
    }
    clearCachedNodes() {
        this._cachedNodes.length = 0;
    }
    [Symbol.iterator]() {
        let current = this._head;
        return {
            next() {
                if (current) {
                    const value = current.value;
                    current = current.next;
                    return { value, done: false };
                }
                return { value: undefined, done: true };
            },
        };
    }
}

/**
 * 表示链表中 [first, terminal) 区间的一段连续节点。
 * terminal 为哨兵节点，自身不存储有效数据。
 */
class GameFrameworkLinkedListRange {
    constructor(first, terminal) {
        if (!first || !terminal || first === terminal) {
            throw new GameFrameworkError('Range is invalid.');
        }
        this.first = first;
        this.terminal = terminal;
    }
    get isValid() {
        return this.first !== null && this.terminal !== null && this.first !== this.terminal;
    }
    get count() {
        let count = 0;
        let cur = this.first;
        while (cur !== null && cur !== this.terminal) {
            count++;
            cur = cur.next;
        }
        return count;
    }
    contains(value) {
        let cur = this.first;
        while (cur !== null && cur !== this.terminal) {
            if (cur.value === value)
                return true;
            cur = cur.next;
        }
        return false;
    }
    [Symbol.iterator]() {
        const terminal = this.terminal;
        let cur = this.first;
        return {
            next() {
                if (cur !== null && cur !== terminal) {
                    const value = cur.value;
                    cur = cur.next;
                    return { value, done: false };
                }
                return { value: undefined, done: true };
            },
        };
    }
}

/**
 * 一键多值字典。每个键对应链表中连续的一段节点（不含尾哨兵）。
 * 内部维护一条共享链表，各键的数据段之间用独立的哨兵节点分隔。
 */
class GameFrameworkMultiDictionary {
    constructor() {
        this._linkedList = new GameFrameworkLinkedList();
        // 每个键存储 { dataFirst, terminal } — dataFirst 可随删除而更新
        this._map = new Map();
    }
    get count() { return this._map.size; }
    containsKey(key) {
        return this._map.has(key);
    }
    contains(key, value) {
        const entry = this._map.get(key);
        if (!entry || !entry.dataFirst)
            return false;
        let cur = entry.dataFirst;
        while (cur !== null && cur !== entry.terminal) {
            if (cur.value === value)
                return true;
            cur = cur.next;
        }
        return false;
    }
    /** 获取 key 对应的范围快照（不存在或为空时返回 undefined）。 */
    get(key) {
        const entry = this._map.get(key);
        if (!entry || !entry.dataFirst)
            return undefined;
        return new GameFrameworkLinkedListRange(entry.dataFirst, entry.terminal);
    }
    add(key, value) {
        const entry = this._map.get(key);
        if (entry) {
            const node = this._linkedList.addBefore(entry.terminal, value);
            // 若之前无数据节点，dataFirst 指向新节点
            if (!entry.dataFirst)
                entry.dataFirst = node;
        }
        else {
            const terminal = this._linkedList.addLast(value);
            // terminal 是哨兵，不存值；先占位，再在它前面插入真实数据
            // 实际: 先加 terminal 哨兵（空），再在它前插入数据节点
            const dataNode = this._linkedList.addBefore(terminal, value);
            this._map.set(key, { dataFirst: dataNode, terminal });
        }
    }
    remove(key, value) {
        const entry = this._map.get(key);
        if (!entry || !entry.dataFirst)
            return false;
        let cur = entry.dataFirst;
        while (cur !== null && cur !== entry.terminal) {
            if (cur.value === value) {
                const isFirst = cur === entry.dataFirst;
                const next = cur.next;
                this._linkedList.remove(cur);
                if (isFirst) {
                    // 更新 dataFirst；若移除后紧邻 terminal，则该键无数据
                    entry.dataFirst = (next !== entry.terminal) ? next : null;
                }
                return true;
            }
            cur = cur.next;
        }
        return false;
    }
    removeAll(key) {
        const entry = this._map.get(key);
        if (!entry)
            return false;
        let cur = entry.dataFirst;
        while (cur !== null && cur !== entry.terminal) {
            const next = cur.next;
            this._linkedList.remove(cur);
            cur = next;
        }
        this._linkedList.remove(entry.terminal);
        this._map.delete(key);
        return true;
    }
    clear() {
        this._map.clear();
        this._linkedList.clear();
    }
    [Symbol.iterator]() {
        const entries = [];
        this._map.forEach((entry, key) => {
            if (entry.dataFirst) {
                entries.push([key, new GameFrameworkLinkedListRange(entry.dataFirst, entry.terminal)]);
            }
        });
        return entries[Symbol.iterator]();
    }
}

var GameFrameworkLogLevel;
(function (GameFrameworkLogLevel) {
    GameFrameworkLogLevel[GameFrameworkLogLevel["Debug"] = 0] = "Debug";
    GameFrameworkLogLevel[GameFrameworkLogLevel["Info"] = 1] = "Info";
    GameFrameworkLogLevel[GameFrameworkLogLevel["Warning"] = 2] = "Warning";
    GameFrameworkLogLevel[GameFrameworkLogLevel["Error"] = 3] = "Error";
    GameFrameworkLogLevel[GameFrameworkLogLevel["Fatal"] = 4] = "Fatal";
})(GameFrameworkLogLevel || (GameFrameworkLogLevel = {}));

class GameFrameworkLog {
    static setLogHelper(logHelper) {
        this._logHelper = logHelper;
    }
    static setLogLevel(level) {
        this._logLevel = level;
    }
    static getLogLevel() {
        return this._logLevel;
    }
    static debug(tagOrMsg, ...rest) {
        this._emit(GameFrameworkLogLevel.Debug, tagOrMsg, rest);
    }
    static info(tagOrMsg, ...rest) {
        this._emit(GameFrameworkLogLevel.Info, tagOrMsg, rest);
    }
    static warning(tagOrMsg, ...rest) {
        this._emit(GameFrameworkLogLevel.Warning, tagOrMsg, rest);
    }
    static error(tagOrMsg, ...rest) {
        this._emit(GameFrameworkLogLevel.Error, tagOrMsg, rest);
    }
    static fatal(tagOrMsg, ...rest) {
        this._emit(GameFrameworkLogLevel.Fatal, tagOrMsg, rest);
    }
    // ---- Internal ----
    static _emit(level, tagOrMsg, rest) {
        if (!this._logHelper || level < this._logLevel) {
            return;
        }
        let tag = '';
        let message;
        if (rest.length === 0) {
            // debug(message)
            message = String(tagOrMsg);
        }
        else if (rest.length === 1 && typeof tagOrMsg === 'string' && !tagOrMsg.includes('{0}')) {
            // debug(tag, message)
            tag = tagOrMsg;
            message = String(rest[0]);
        }
        else {
            // debug(format, ...args)  — {0} {1} ... substitution
            message = GameFrameworkLog._format(String(tagOrMsg), rest);
        }
        this._logHelper.log(level, tag, message);
    }
    /** 简单的 {0} {1} ... 占位符替换。 */
    static _format(format, args) {
        return format.replace(/\{(\d+)\}/g, (_, i) => {
            const idx = Number(i);
            return idx < args.length ? String(args[idx]) : `{${i}}`;
        });
    }
}
GameFrameworkLog._logHelper = null;
GameFrameworkLog._logLevel = GameFrameworkLogLevel.Debug;

var StartTaskStatus;
(function (StartTaskStatus) {
    /** 任务可立即完成，代理可立即释放。 */
    StartTaskStatus[StartTaskStatus["Done"] = 0] = "Done";
    /** 任务正在进行，代理继续持有。 */
    StartTaskStatus[StartTaskStatus["CanResume"] = 1] = "CanResume";
    /** 任务需等待其他任务完成后再处理。 */
    StartTaskStatus[StartTaskStatus["HasToWait"] = 2] = "HasToWait";
    /** 发生未知错误，任务和代理均释放。 */
    StartTaskStatus[StartTaskStatus["UnknownError"] = 3] = "UnknownError";
})(StartTaskStatus || (StartTaskStatus = {}));

var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["Todo"] = 0] = "Todo";
    TaskStatus[TaskStatus["Doing"] = 1] = "Doing";
    TaskStatus[TaskStatus["Done"] = 2] = "Done";
})(TaskStatus || (TaskStatus = {}));

let _nextSerialId = 0;
class TaskBase {
    constructor() {
        this._serialId = 0;
        this._tag = '';
        this._priority = 0;
        this._userData = null;
        this.status = TaskStatus.Todo;
    }
    get serialId() { return this._serialId; }
    get tag() { return this._tag; }
    get priority() { return this._priority; }
    get userData() { return this._userData; }
    get done() { return this.status === TaskStatus.Done; }
    get description() { return null; }
    initialize(tag, priority, userData) {
        this._serialId = ++_nextSerialId;
        this._tag = tag;
        this._priority = priority;
        this._userData = userData;
        this.status = TaskStatus.Todo;
    }
    clear() {
        this._serialId = 0;
        this._tag = '';
        this._priority = 0;
        this._userData = null;
        this.status = TaskStatus.Todo;
    }
}
TaskBase.DEFAULT_PRIORITY = 0;

class TaskInfo {
    constructor(serialId, tag, priority, userData, status, description) {
        this._isValid = true;
        this._serialId = serialId;
        this._tag = tag;
        this._priority = priority;
        this._userData = userData;
        this._status = status;
        this._description = description;
    }
    get isValid() { return this._isValid; }
    get serialId() {
        if (!this._isValid)
            throw new GameFrameworkError('Data is invalid.');
        return this._serialId;
    }
    get tag() {
        if (!this._isValid)
            throw new GameFrameworkError('Data is invalid.');
        return this._tag;
    }
    get priority() {
        if (!this._isValid)
            throw new GameFrameworkError('Data is invalid.');
        return this._priority;
    }
    get userData() {
        if (!this._isValid)
            throw new GameFrameworkError('Data is invalid.');
        return this._userData;
    }
    get status() {
        if (!this._isValid)
            throw new GameFrameworkError('Data is invalid.');
        return this._status;
    }
    get description() {
        if (!this._isValid)
            throw new GameFrameworkError('Data is invalid.');
        return this._description;
    }
}

class TaskPool {
    constructor() {
        this._freeAgents = [];
        this._workingAgents = new GameFrameworkLinkedList();
        this._waitingTasks = new GameFrameworkLinkedList();
        this._paused = false;
    }
    get paused() { return this._paused; }
    set paused(value) { this._paused = value; }
    get totalAgentCount() { return this._freeAgents.length + this._workingAgents.count; }
    get freeAgentCount() { return this._freeAgents.length; }
    get workingAgentCount() { return this._workingAgents.count; }
    get waitingTaskCount() { return this._waitingTasks.count; }
    addAgent(agent) {
        agent.initialize();
        this._freeAgents.push(agent);
    }
    addTask(task) {
        // 按优先级降序插入：优先级相同则排在后面（稳定）
        let node = this._waitingTasks.last;
        while (node !== null && task.priority > node.value.priority) {
            node = node.prev;
        }
        if (node === null) {
            this._waitingTasks.addFirst(task);
        }
        else {
            this._waitingTasks.addAfter(node, task);
        }
    }
    update(elapseSeconds, realElapseSeconds) {
        if (this._paused)
            return;
        this._processWorkingAgents(elapseSeconds, realElapseSeconds);
        this._processWaitingTasks(elapseSeconds, realElapseSeconds);
    }
    removeTask(serialId) {
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
    removeTasks(tag) {
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
    removeAllTasks() {
        this._waitingTasks.clear();
        let agentNode = this._workingAgents.first;
        while (agentNode) {
            agentNode.value.reset();
            this._freeAgents.push(agentNode.value);
            agentNode = agentNode.next;
        }
        this._workingAgents.clear();
    }
    getTaskInfos() {
        const infos = [];
        let agentNode = this._workingAgents.first;
        while (agentNode) {
            const t = agentNode.value.task;
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
    shutdown() {
        this.removeAllTasks();
        while (this._freeAgents.length > 0) {
            this._freeAgents.pop().shutdown();
        }
        this._workingAgents.clear();
    }
    _processWorkingAgents(elapseSeconds, realElapseSeconds) {
        let node = this._workingAgents.first;
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
    _processWaitingTasks(_elapseSeconds, _realElapseSeconds) {
        let taskNode = this._waitingTasks.first;
        while (taskNode && this._freeAgents.length > 0) {
            const agent = this._freeAgents.pop();
            const task = taskNode.value;
            const nextTaskNode = taskNode.next;
            const status = agent.start(task);
            // 是否将代理移入工作列表
            if (status === StartTaskStatus.CanResume) {
                this._workingAgents.addLast(agent);
            }
            else {
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

class ConfigManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._helper = null;
        this._configs = new Map();
    }
    get priority() { return 68; }
    get count() { return this._configs.size; }
    setConfigHelper(helper) {
        if (!helper) {
            throw new GameFrameworkError('Config helper is invalid.');
        }
        this._helper = helper;
    }
    parseData(configString, userData) {
        if (!this._helper) {
            throw new GameFrameworkError('Config helper is invalid.');
        }
        return this._helper.parseData(configString, userData);
    }
    hasConfig(configName) {
        this._checkName(configName);
        return this._configs.has(configName);
    }
    addConfig(configName, configValue) {
        this._checkName(configName);
        if (this._configs.has(configName)) {
            return false;
        }
        this._configs.set(configName, configValue);
        return true;
    }
    removeConfig(configName) {
        this._checkName(configName);
        return this._configs.delete(configName);
    }
    removeAllConfigs() {
        this._configs.clear();
    }
    getBool(configName, defaultValue = false) {
        this._checkName(configName);
        const raw = this._configs.get(configName);
        if (raw === undefined)
            return defaultValue;
        const lower = raw.trim().toLowerCase();
        if (lower === 'true' || lower === '1')
            return true;
        if (lower === 'false' || lower === '0')
            return false;
        return defaultValue;
    }
    getInt(configName, defaultValue = 0) {
        this._checkName(configName);
        const raw = this._configs.get(configName);
        if (raw === undefined)
            return defaultValue;
        const v = parseInt(raw, 10);
        return isNaN(v) ? defaultValue : v;
    }
    getFloat(configName, defaultValue = 0) {
        this._checkName(configName);
        const raw = this._configs.get(configName);
        if (raw === undefined)
            return defaultValue;
        const v = parseFloat(raw);
        return isNaN(v) ? defaultValue : v;
    }
    getString(configName, defaultValue = '') {
        this._checkName(configName);
        return this._configs.get(configName) ?? defaultValue;
    }
    update(_elapseSeconds, _realElapseSeconds) { }
    shutdown() {
        this._configs.clear();
    }
    _checkName(configName) {
        if (!configName) {
            throw new GameFrameworkError('Config name is invalid.');
        }
    }
}

class DataNode {
    constructor() {
        this._name = '';
        this._data = null;
        this._parent = null;
        this._children = [];
    }
    get name() { return this._name; }
    get fullName() {
        if (this._parent === null)
            return this._name;
        return `${this._parent.fullName}.${this._name}`;
    }
    get parent() { return this._parent; }
    get childCount() { return this._children.length; }
    static create(name, parent) {
        const node = new DataNode();
        node._name = name;
        node._parent = parent;
        return node;
    }
    getData() {
        return this._data;
    }
    setData(data) {
        this._data = data;
    }
    hasChild(indexOrName) {
        return this.getChild(indexOrName) !== null;
    }
    getChild(indexOrName) {
        if (typeof indexOrName === 'number') {
            const i = indexOrName;
            return (i >= 0 && i < this._children.length) ? this._children[i] : null;
        }
        for (const child of this._children) {
            if (child._name === indexOrName)
                return child;
        }
        return null;
    }
    getOrAddChild(name) {
        const existing = this.getChild(name);
        if (existing !== null)
            return existing;
        const child = DataNode.create(name, this);
        this._children.push(child);
        return child;
    }
    getAllChildren() {
        return this._children.slice();
    }
    removeChild(indexOrName) {
        if (typeof indexOrName === 'number') {
            const i = indexOrName;
            if (i >= 0 && i < this._children.length) {
                this._children[i].clear();
                this._children.splice(i, 1);
            }
        }
        else {
            const idx = this._children.findIndex(c => c._name === indexOrName);
            if (idx >= 0) {
                this._children[idx].clear();
                this._children.splice(idx, 1);
            }
        }
    }
    clear() {
        this._data = null;
        for (const child of this._children) {
            child.clear();
        }
        this._children.length = 0;
    }
    toDataString() {
        return this._data !== null ? String(this._data) : '';
    }
    toString() {
        return `[DataNode] ${this.fullName} = ${this.toDataString()} (children: ${this._children.length})`;
    }
}

const PATH_SPLIT = /[./\\]+/;
const ROOT_NAME = '<Root>';
class DataNodeManager extends GameFrameworkModule {
    get priority() { return 40; }
    constructor() {
        super();
        this._root = DataNode.create(ROOT_NAME, null);
    }
    get root() { return this._root; }
    getData(path, fromNode) {
        const node = this.getNode(path, fromNode);
        return node ? node.getData() : null;
    }
    setData(path, data, fromNode) {
        this.getOrAddNode(path, fromNode).setData(data);
    }
    getNode(path, fromNode) {
        const parts = this._splitPath(path);
        if (parts.length === 0)
            return fromNode ?? this._root;
        let current = fromNode ?? this._root;
        for (const part of parts) {
            const child = current.getChild(part);
            if (child === null)
                return null;
            current = child;
        }
        return current;
    }
    getOrAddNode(path, fromNode) {
        const parts = this._splitPath(path);
        let current = fromNode ?? this._root;
        for (const part of parts) {
            current = current.getOrAddChild(part);
        }
        return current;
    }
    removeNode(path, fromNode) {
        const parts = this._splitPath(path);
        if (parts.length === 0)
            return;
        const parentParts = parts.slice(0, -1);
        const childName = parts[parts.length - 1];
        let parent = fromNode ?? this._root;
        for (const part of parentParts) {
            parent = parent.getChild(part);
            if (parent === null)
                return;
        }
        parent.removeChild(childName);
    }
    clear() {
        this._root.clear();
    }
    update(_elapseSeconds, _realElapseSeconds) { }
    shutdown() {
        this._root.clear();
    }
    _splitPath(path) {
        if (!path)
            return [];
        return path.split(PATH_SPLIT).filter(p => p.length > 0);
    }
}

class DataTable {
    constructor(name, rowType) {
        this._rows = new Map();
        this._minIdDataRow = null;
        this._maxIdDataRow = null;
        this._name = name;
        this._rowType = rowType;
    }
    get name() { return this._name; }
    get count() { return this._rows.size; }
    get minIdDataRow() { return this._minIdDataRow; }
    get maxIdDataRow() { return this._maxIdDataRow; }
    // ---- 查询 ----
    hasDataRow(idOrCondition) {
        if (typeof idOrCondition === 'number') {
            return this._rows.has(idOrCondition);
        }
        for (const row of this._rows.values()) {
            if (idOrCondition(row))
                return true;
        }
        return false;
    }
    getDataRow(idOrCondition) {
        if (typeof idOrCondition === 'number') {
            return this._rows.get(idOrCondition) ?? null;
        }
        for (const row of this._rows.values()) {
            if (idOrCondition(row))
                return row;
        }
        return null;
    }
    getDataRows(condition) {
        const results = [];
        this.getDataRowsInto(condition, results);
        return results;
    }
    getDataRowsInto(condition, results) {
        results.length = 0;
        for (const row of this._rows.values()) {
            if (condition(row))
                results.push(row);
        }
    }
    getDataRowsSorted(comparison) {
        const results = [];
        this.getDataRowsSortedInto(comparison, results);
        return results;
    }
    getDataRowsSortedInto(comparison, results) {
        results.length = 0;
        for (const row of this._rows.values())
            results.push(row);
        results.sort(comparison);
    }
    getDataRowsFiltered(condition, comparison) {
        const results = [];
        this.getDataRowsFilteredInto(condition, comparison, results);
        return results;
    }
    getDataRowsFilteredInto(condition, comparison, results) {
        results.length = 0;
        for (const row of this._rows.values()) {
            if (condition(row))
                results.push(row);
        }
        results.sort(comparison);
    }
    getAllDataRows() {
        return Array.from(this._rows.values());
    }
    getAllDataRowsInto(results) {
        results.length = 0;
        for (const row of this._rows.values())
            results.push(row);
    }
    // ---- 逐行写入 ----
    addDataRow(dataRowString, userData) {
        const row = new this._rowType();
        if (!row.parseDataRow(dataRowString, userData)) {
            console.warn(`[DataTable] ${this._name}: failed to parse row: ${dataRowString}`);
            return false;
        }
        if (this._rows.has(row.id)) {
            throw new GameFrameworkError(`DataRow id [${row.id}] already exists in DataTable [${this._name}].`);
        }
        this._rows.set(row.id, row);
        this._updateMinMax(row);
        return true;
    }
    removeDataRow(id) {
        if (!this._rows.delete(id))
            return false;
        if ((this._minIdDataRow !== null && this._minIdDataRow.id === id) ||
            (this._maxIdDataRow !== null && this._maxIdDataRow.id === id)) {
            this._recalcMinMax();
        }
        return true;
    }
    removeAllDataRows() {
        this._rows.clear();
        this._minIdDataRow = null;
        this._maxIdDataRow = null;
    }
    // ---- 批量解析 ----
    parseData(dataTableString, userData) {
        let pos = 0;
        while (pos < dataTableString.length) {
            const nl = dataTableString.indexOf('\n', pos);
            const end = nl === -1 ? dataTableString.length : nl;
            const line = dataTableString.substring(pos, end).replace(/[\r\s]+$/, '');
            pos = end + 1;
            if (line.length === 0 || line.charAt(0) === '#')
                continue;
            if (!this.addDataRow(line, userData))
                return false;
        }
        return true;
    }
    // ---- Iterator ----
    [Symbol.iterator]() {
        return this._rows.values();
    }
    // ---- Internal ----
    _updateMinMax(row) {
        if (this._minIdDataRow === null || row.id < this._minIdDataRow.id)
            this._minIdDataRow = row;
        if (this._maxIdDataRow === null || row.id > this._maxIdDataRow.id)
            this._maxIdDataRow = row;
    }
    _recalcMinMax() {
        this._minIdDataRow = null;
        this._maxIdDataRow = null;
        for (const row of this._rows.values())
            this._updateMinMax(row);
    }
    shutdown() {
        this.removeAllDataRows();
    }
}

// TypeScript 版的 TypeNamePair：以构造函数 + 名称组合为 key
function makeKey(rowType, name) {
    return `${rowType.name}|${name}`;
}
class DataTableManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._tables = new Map();
    }
    get priority() { return 65; }
    get count() { return this._tables.size; }
    // ---- 查询是否存在 ----
    hasDataTable(rowType, name = '') {
        return this._tables.has(makeKey(rowType, name));
    }
    // ---- 获取 ----
    getDataTable(rowType, name = '') {
        return this._tables.get(makeKey(rowType, name)) ?? null;
    }
    getAllDataTables() {
        return Array.from(this._tables.values());
    }
    // ---- 创建 ----
    createDataTable(rowType, name = '') {
        const key = makeKey(rowType, name);
        if (this._tables.has(key)) {
            throw new GameFrameworkError(`DataTable [${key}] already exists.`);
        }
        const table = new DataTable(name || rowType.name, rowType);
        this._tables.set(key, table);
        return table;
    }
    destroyDataTable(rowTypeOrTable, name = '') {
        let key;
        if (typeof rowTypeOrTable === 'function') {
            key = makeKey(rowTypeOrTable, name);
        }
        else {
            for (const [k, v] of this._tables) {
                if (v === rowTypeOrTable) {
                    key = k;
                    break;
                }
            }
        }
        if (key === undefined)
            return false;
        const table = this._tables.get(key);
        if (!table)
            return false;
        table.shutdown();
        return this._tables.delete(key);
    }
    // ---- Module lifecycle ----
    update(_e, _r) { }
    shutdown() {
        for (const table of this._tables.values())
            table.shutdown();
        this._tables.clear();
    }
}

class BaseEventArgs {
}

class ReferencePoolInfo {
    constructor(type, unusedReferenceCount, usingReferenceCount, acquireReferenceCount, releaseReferenceCount, addReferenceCount, removeReferenceCount) {
        this.type = type;
        this.unusedReferenceCount = unusedReferenceCount;
        this.usingReferenceCount = usingReferenceCount;
        this.acquireReferenceCount = acquireReferenceCount;
        this.releaseReferenceCount = releaseReferenceCount;
        this.addReferenceCount = addReferenceCount;
        this.removeReferenceCount = removeReferenceCount;
    }
}

class ReferenceCollection {
    constructor(ctor, getStrictCheck) {
        this._pool = [];
        this.usingReferenceCount = 0;
        this.acquireReferenceCount = 0;
        this.releaseReferenceCount = 0;
        this.addReferenceCount = 0;
        this.removeReferenceCount = 0;
        this._ctor = ctor;
        this._getStrictCheck = getStrictCheck;
    }
    get unusedReferenceCount() {
        return this._pool.length;
    }
    acquire() {
        this.usingReferenceCount++;
        this.acquireReferenceCount++;
        if (this._pool.length > 0) {
            return this._pool.pop();
        }
        this.addReferenceCount++;
        return new this._ctor();
    }
    release(ref) {
        ref.clear();
        if (this._getStrictCheck() && this._pool.indexOf(ref) >= 0) {
            throw new Error(`[ReferencePool] Reference '${this._ctor.name}' is already in the pool (double release).`);
        }
        this._pool.push(ref);
        this.releaseReferenceCount++;
        this.usingReferenceCount--;
    }
    add(count) {
        this.addReferenceCount += count;
        for (let i = 0; i < count; i++) {
            this._pool.push(new this._ctor());
        }
    }
    remove(count) {
        const actual = Math.min(count, this._pool.length);
        this.removeReferenceCount += actual;
        this._pool.splice(this._pool.length - actual, actual);
    }
    removeAll() {
        this.removeReferenceCount += this._pool.length;
        this._pool.length = 0;
    }
    getInfo(type) {
        return new ReferencePoolInfo(type, this.unusedReferenceCount, this.usingReferenceCount, this.acquireReferenceCount, this.releaseReferenceCount, this.addReferenceCount, this.removeReferenceCount);
    }
}
class ReferencePool {
    static get enableStrictCheck() {
        return this._enableStrictCheck;
    }
    static set enableStrictCheck(value) {
        this._enableStrictCheck = value;
    }
    static get count() {
        return this._collections.size;
    }
    static getAllReferencePoolInfos() {
        const infos = [];
        this._collections.forEach((col, type) => {
            infos.push(col.getInfo(type));
        });
        return infos;
    }
    static acquire(ctor) {
        if (this._enableStrictCheck) {
            this._internalCheckReferenceType(ctor);
        }
        return this._getOrCreate(ctor).acquire();
    }
    static release(ref) {
        const ctor = ref.constructor;
        if (this._enableStrictCheck) {
            this._internalCheckReferenceType(ctor);
        }
        this._getOrCreate(ctor).release(ref);
    }
    /** Pre-warms the pool with `count` instances. */
    static add(ctor, count) {
        if (this._enableStrictCheck) {
            this._internalCheckReferenceType(ctor);
        }
        this._getOrCreate(ctor).add(count);
    }
    /** Removes up to `count` unused instances from the pool. */
    static remove(ctor, count) {
        this._getOrCreate(ctor).remove(count);
    }
    /** Removes all unused instances of this type from the pool. */
    static removeAll(ctor) {
        const col = this._collections.get(ctor);
        if (col) {
            col.removeAll();
        }
    }
    /** Clears all pools for every type. */
    static clearAll() {
        this._collections.forEach(c => c.removeAll());
        this._collections.clear();
    }
    static _internalCheckReferenceType(ctor) {
        if (!ctor || typeof ctor !== 'function') {
            throw new Error(`[ReferencePool] Reference type is invalid.`);
        }
    }
    static _getOrCreate(ctor) {
        if (!this._collections.has(ctor)) {
            this._collections.set(ctor, new ReferenceCollection(ctor, () => this._enableStrictCheck));
        }
        return this._collections.get(ctor);
    }
}
ReferencePool._collections = new Map();
ReferencePool._enableStrictCheck = false;

class DownloadStartEventArgs extends BaseEventArgs {
    get id() { return DownloadStartEventArgs.eventId; }
    static create(serialId, downloadPath, downloadUri, currentLength, userData) {
        const e = ReferencePool.acquire(DownloadStartEventArgs);
        e.serialId = serialId;
        e.downloadPath = downloadPath;
        e.downloadUri = downloadUri;
        e.currentLength = currentLength;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.downloadPath = '';
        this.downloadUri = '';
        this.currentLength = 0;
        this.userData = undefined;
    }
}
DownloadStartEventArgs.eventId = 'download.start';
class DownloadUpdateEventArgs extends BaseEventArgs {
    get id() { return DownloadUpdateEventArgs.eventId; }
    static create(serialId, downloadPath, downloadUri, currentLength, userData) {
        const e = ReferencePool.acquire(DownloadUpdateEventArgs);
        e.serialId = serialId;
        e.downloadPath = downloadPath;
        e.downloadUri = downloadUri;
        e.currentLength = currentLength;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.downloadPath = '';
        this.downloadUri = '';
        this.currentLength = 0;
        this.userData = undefined;
    }
}
DownloadUpdateEventArgs.eventId = 'download.update';
class DownloadSuccessEventArgs extends BaseEventArgs {
    get id() { return DownloadSuccessEventArgs.eventId; }
    static create(serialId, downloadPath, downloadUri, currentLength, data, userData) {
        const e = ReferencePool.acquire(DownloadSuccessEventArgs);
        e.serialId = serialId;
        e.downloadPath = downloadPath;
        e.downloadUri = downloadUri;
        e.currentLength = currentLength;
        e.data = data;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.downloadPath = '';
        this.downloadUri = '';
        this.currentLength = 0;
        this.data = new ArrayBuffer(0);
        this.userData = undefined;
    }
}
DownloadSuccessEventArgs.eventId = 'download.success';
class DownloadFailureEventArgs extends BaseEventArgs {
    get id() { return DownloadFailureEventArgs.eventId; }
    static create(serialId, downloadPath, downloadUri, errorMessage, userData) {
        const e = ReferencePool.acquire(DownloadFailureEventArgs);
        e.serialId = serialId;
        e.downloadPath = downloadPath;
        e.downloadUri = downloadUri;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.downloadPath = '';
        this.downloadUri = '';
        this.errorMessage = '';
        this.userData = undefined;
    }
}
DownloadFailureEventArgs.eventId = 'download.failure';

var DownloadTaskStatus;
(function (DownloadTaskStatus) {
    DownloadTaskStatus[DownloadTaskStatus["Todo"] = 0] = "Todo";
    DownloadTaskStatus[DownloadTaskStatus["Doing"] = 1] = "Doing";
    DownloadTaskStatus[DownloadTaskStatus["Done"] = 2] = "Done";
    DownloadTaskStatus[DownloadTaskStatus["Error"] = 3] = "Error";
})(DownloadTaskStatus || (DownloadTaskStatus = {}));
class DownloadTask {
    constructor(downloadPath, downloadUri, tag, priority, fromPosition, userData) {
        this.status = DownloadTaskStatus.Todo;
        this.downloadedLength = 0;
        this.serialId = ++DownloadTask._serial;
        this.downloadPath = downloadPath;
        this.downloadUri = downloadUri;
        this.tag = tag;
        this.priority = priority;
        this.fromPosition = fromPosition;
        this.userData = userData;
    }
}
DownloadTask._serial = 0;
/** 下载速度统计器 */
class DownloadCounter {
    constructor(windowSeconds = 3) {
        this._samples = [];
        this.currentSpeed = 0;
        this._windowSeconds = windowSeconds;
    }
    recordBytes(bytes, nowSeconds) {
        this._samples.push({ time: nowSeconds, bytes });
    }
    update(nowSeconds) {
        const cutoff = nowSeconds - this._windowSeconds;
        while (this._samples.length > 0 && this._samples[0].time < cutoff) {
            this._samples.shift();
        }
        const total = this._samples.reduce((s, n) => s + n.bytes, 0);
        this.currentSpeed = this._windowSeconds > 0 ? total / this._windowSeconds : 0;
    }
    reset() {
        this._samples = [];
        this.currentSpeed = 0;
    }
}
class DownloadManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._eventManager = null;
        this._waitingTasks = [];
        this._workingTasks = new Map();
        /** serialId → 正在使用的辅助器实例 */
        this._workingHelpers = new Map();
        /** 空闲辅助器池（由 addDownloadAgentHelper 注入） */
        this._freeHelpers = [];
        this._paused = false;
        this._timeout = 30;
        /** 分块写盘阈值（字节），0 = 下载完成后一次性写入 */
        this._flushSize = 0;
        this._counter = new DownloadCounter();
        this._elapsedSeconds = 0;
    }
    get priority() { return 25; }
    get paused() { return this._paused; }
    set paused(value) { this._paused = value; }
    get timeout() { return this._timeout; }
    set timeout(value) { this._timeout = value > 0 ? value : 30; }
    get flushSize() { return this._flushSize; }
    set flushSize(value) { this._flushSize = value >= 0 ? value : 0; }
    get totalAgentCount() { return this._freeHelpers.length + this._workingHelpers.size; }
    get freeAgentCount() { return this._freeHelpers.length; }
    get workingAgentCount() { return this._workingHelpers.size; }
    get waitingTaskCount() { return this._waitingTasks.length; }
    get currentSpeed() { return this._counter.currentSpeed; }
    setEventManager(eventManager) {
        this._eventManager = eventManager;
    }
    /** 注入一个辅助器实例（由 CocosDownloadManager 根据编辑器配置创建并注入） */
    addDownloadAgentHelper(helper) {
        this._freeHelpers.push(helper);
    }
    addDownload(downloadPath, downloadUri, params = {}) {
        if (!downloadPath)
            throw new Error('downloadPath is invalid.');
        if (!downloadUri)
            throw new Error('downloadUri is invalid.');
        const task = new DownloadTask(downloadPath, downloadUri, params.tag ?? '', params.priority ?? 0, params.fromPosition ?? 0, params.userData);
        this._enqueue(task);
        this._scheduleNext();
        return task.serialId;
    }
    removeDownload(serialId) {
        const waiting = this._waitingTasks.findIndex(t => t.serialId === serialId);
        if (waiting >= 0) {
            this._waitingTasks.splice(waiting, 1);
            return true;
        }
        const helper = this._workingHelpers.get(serialId);
        if (helper) {
            helper.cancel();
            this._workingHelpers.delete(serialId);
            this._freeHelpers.push(helper);
            this._workingTasks.delete(serialId);
            return true;
        }
        return false;
    }
    removeDownloads(tag) {
        let count = 0;
        this._waitingTasks = this._waitingTasks.filter(t => {
            if (t.tag === tag) {
                count++;
                return false;
            }
            return true;
        });
        this._workingTasks.forEach((task, id) => {
            if (task.tag === tag) {
                const helper = this._workingHelpers.get(id);
                if (helper) {
                    helper.cancel();
                    this._workingHelpers.delete(id);
                    this._freeHelpers.push(helper);
                }
                this._workingTasks.delete(id);
                count++;
            }
        });
        return count;
    }
    removeAllDownloads() {
        this._waitingTasks = [];
        this._workingHelpers.forEach((helper, id) => {
            helper.cancel();
            this._freeHelpers.push(helper);
            this._workingTasks.delete(id);
        });
        this._workingHelpers.clear();
        this._workingTasks.clear();
    }
    getDownloadInfo(serialId) {
        const working = this._workingTasks.get(serialId);
        if (working)
            return working;
        return this._waitingTasks.find(t => t.serialId === serialId) ?? null;
    }
    getDownloadInfosByTag(tag) {
        const result = [];
        this._waitingTasks.forEach(t => { if (t.tag === tag)
            result.push(t); });
        this._workingTasks.forEach(t => { if (t.tag === tag)
            result.push(t); });
        return result;
    }
    getAllDownloadInfos() {
        const result = [...this._waitingTasks];
        this._workingTasks.forEach(t => result.push(t));
        return result;
    }
    update(elapseSeconds, _realElapseSeconds) {
        this._elapsedSeconds += elapseSeconds;
        this._counter.update(this._elapsedSeconds);
        if (!this._paused) {
            this._scheduleNext();
        }
    }
    shutdown() {
        this.removeAllDownloads();
        this._counter.reset();
    }
    // ── internals ────────────────────────────────────────────────────────────
    _enqueue(task) {
        let i = this._waitingTasks.length;
        while (i > 0 && this._waitingTasks[i - 1].priority < task.priority) {
            i--;
        }
        this._waitingTasks.splice(i, 0, task);
    }
    _scheduleNext() {
        while (!this._paused && this._freeHelpers.length > 0 && this._waitingTasks.length > 0) {
            const task = this._waitingTasks.shift();
            const helper = this._freeHelpers.pop();
            this._workingTasks.set(task.serialId, task);
            this._workingHelpers.set(task.serialId, helper);
            this._startTask(task, helper);
        }
    }
    _startTask(task, helper) {
        let lastFlushed = 0;
        helper.download(task.downloadUri, task.fromPosition, this._timeout, () => {
            // onStart
            task.status = DownloadTaskStatus.Doing;
            if (this._eventManager) {
                this._eventManager.fire(this, DownloadStartEventArgs.create(task.serialId, task.downloadPath, task.downloadUri, task.fromPosition, task.userData));
            }
        }, (deltaBytes, currentLength) => {
            // onProgress
            task.downloadedLength = currentLength;
            this._counter.recordBytes(deltaBytes, this._elapsedSeconds);
            if (this._eventManager) {
                this._eventManager.fire(this, DownloadUpdateEventArgs.create(task.serialId, task.downloadPath, task.downloadUri, task.fromPosition + currentLength, task.userData));
            }
            // flushSize 阈值检测
            if (this._flushSize > 0 && currentLength - lastFlushed >= this._flushSize) {
                lastFlushed = currentLength;
            }
        }, (data) => {
            // onSuccess
            task.status = DownloadTaskStatus.Done;
            task.downloadedLength = data.byteLength;
            this._workingTasks.delete(task.serialId);
            this._workingHelpers.delete(task.serialId);
            this._freeHelpers.push(helper);
            if (this._eventManager) {
                this._eventManager.fire(this, DownloadSuccessEventArgs.create(task.serialId, task.downloadPath, task.downloadUri, task.fromPosition + data.byteLength, data, task.userData));
            }
            this._scheduleNext();
        }, (errorMessage) => {
            // onFailure
            task.status = DownloadTaskStatus.Error;
            this._workingTasks.delete(task.serialId);
            this._workingHelpers.delete(task.serialId);
            this._freeHelpers.push(helper);
            if (this._eventManager) {
                this._eventManager.fire(this, DownloadFailureEventArgs.create(task.serialId, task.downloadPath, task.downloadUri, errorMessage, task.userData));
            }
            this._scheduleNext();
        });
    }
}

class ShowEntitySuccessEventArgs extends BaseEventArgs {
    get id() { return ShowEntitySuccessEventArgs.eventId; }
    static create(entityId, entityAssetName, entityGroupName, duration, userData) {
        const e = ReferencePool.acquire(ShowEntitySuccessEventArgs);
        e.entityId = entityId;
        e.entityAssetName = entityAssetName;
        e.entityGroupName = entityGroupName;
        e.duration = duration;
        e.userData = userData;
        return e;
    }
    clear() {
        this.entityId = 0;
        this.entityAssetName = '';
        this.entityGroupName = '';
        this.duration = 0;
        this.userData = undefined;
    }
}
ShowEntitySuccessEventArgs.eventId = 'entity.show.success';
class ShowEntityFailureEventArgs extends BaseEventArgs {
    get id() { return ShowEntityFailureEventArgs.eventId; }
    static create(entityId, entityAssetName, entityGroupName, errorMessage, userData) {
        const e = ReferencePool.acquire(ShowEntityFailureEventArgs);
        e.entityId = entityId;
        e.entityAssetName = entityAssetName;
        e.entityGroupName = entityGroupName;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }
    clear() {
        this.entityId = 0;
        this.entityAssetName = '';
        this.entityGroupName = '';
        this.errorMessage = '';
        this.userData = undefined;
    }
}
ShowEntityFailureEventArgs.eventId = 'entity.show.failure';
class HideEntityCompleteEventArgs extends BaseEventArgs {
    get id() { return HideEntityCompleteEventArgs.eventId; }
    static create(entityId, entityAssetName, entityGroupName, userData) {
        const e = ReferencePool.acquire(HideEntityCompleteEventArgs);
        e.entityId = entityId;
        e.entityAssetName = entityAssetName;
        e.entityGroupName = entityGroupName;
        e.userData = userData;
        return e;
    }
    clear() {
        this.entityId = 0;
        this.entityAssetName = '';
        this.entityGroupName = '';
        this.userData = undefined;
    }
}
HideEntityCompleteEventArgs.eventId = 'entity.hide.complete';
class AttachEntitySuccessEventArgs extends BaseEventArgs {
    get id() { return AttachEntitySuccessEventArgs.eventId; }
    static create(entityId, parentEntityId, userData) {
        const e = ReferencePool.acquire(AttachEntitySuccessEventArgs);
        e.entityId = entityId;
        e.parentEntityId = parentEntityId;
        e.userData = userData;
        return e;
    }
    clear() {
        this.entityId = 0;
        this.parentEntityId = 0;
        this.userData = undefined;
    }
}
AttachEntitySuccessEventArgs.eventId = 'entity.attach.success';
class DetachEntitySuccessEventArgs extends BaseEventArgs {
    get id() { return DetachEntitySuccessEventArgs.eventId; }
    static create(entityId, parentEntityId, userData) {
        const e = ReferencePool.acquire(DetachEntitySuccessEventArgs);
        e.entityId = entityId;
        e.parentEntityId = parentEntityId;
        e.userData = userData;
        return e;
    }
    clear() {
        this.entityId = 0;
        this.parentEntityId = 0;
        this.userData = undefined;
    }
}
DetachEntitySuccessEventArgs.eventId = 'entity.detach.success';

/** 实体生命周期状态（对应 Unity 原版 EntityStatus 枚举） */
var EntityStatus;
(function (EntityStatus) {
    EntityStatus[EntityStatus["Unknown"] = 0] = "Unknown";
    EntityStatus[EntityStatus["WillInit"] = 1] = "WillInit";
    EntityStatus[EntityStatus["Inited"] = 2] = "Inited";
    EntityStatus[EntityStatus["WillShow"] = 3] = "WillShow";
    EntityStatus[EntityStatus["Showed"] = 4] = "Showed";
    EntityStatus[EntityStatus["WillHide"] = 5] = "WillHide";
    EntityStatus[EntityStatus["Hidden"] = 6] = "Hidden";
    EntityStatus[EntityStatus["WillRecycle"] = 7] = "WillRecycle";
    EntityStatus[EntityStatus["Recycled"] = 8] = "Recycled";
})(EntityStatus || (EntityStatus = {}));

class EntityGroup {
    constructor(name, autoReleaseInterval, capacity, expireTime, priority) {
        this._records = new Map();
        this.name = name;
        this.autoReleaseInterval = autoReleaseInterval;
        this.capacity = capacity;
        this.expireTime = expireTime;
        this.priority = priority;
    }
    get entityCount() { return this._records.size; }
    // ---- 框架内部维护（EntityManager 调用） ----
    _addEntity(entityId, instance, assetName) {
        this._records.set(entityId, { instance, assetName });
    }
    _removeEntity(entityId) {
        this._records.delete(entityId);
    }
    // ---- IEntityGroup 查询 ----
    hasEntity(entityId) {
        return this._records.has(entityId);
    }
    hasEntityByAssetName(entityAssetName) {
        for (const r of this._records.values()) {
            if (r.assetName === entityAssetName)
                return true;
        }
        return false;
    }
    getEntityInstance(entityId) {
        return this._records.get(entityId)?.instance ?? null;
    }
    getEntityInstanceByAssetName(entityAssetName) {
        for (const r of this._records.values()) {
            if (r.assetName === entityAssetName)
                return r.instance;
        }
        return null;
    }
    getEntityInstances(entityAssetName) {
        const result = [];
        this._records.forEach(r => { if (r.assetName === entityAssetName)
            result.push(r.instance); });
        return result;
    }
    getAllEntityInstances() {
        return Array.from(this._records.values()).map(r => r.instance);
    }
    _clear() { this._records.clear(); }
}
// ================================================================
// EntityManager
// ================================================================
class EntityManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._entityHelper = null;
        this._resourceManager = null;
        this._groups = new Map();
        this._entities = new Map();
        // 对象池：groupName → assetName → 空闲实例列表
        this._pool = new Map();
        // 每个分组的自动释放计时器（秒）
        this._groupTimers = new Map();
        // 加载中途被取消的实体 ID（_onLoadSuccess 收到时直接跳过）
        this._cancelledIds = new Set();
        // 事件回调 — 由引擎层(EntityComponent)绑定
        this.onShowEntitySuccess = null;
        this.onShowEntityFailure = null;
        this.onHideEntityComplete = null;
        this.onAttachEntitySuccess = null;
        this.onDetachEntitySuccess = null;
    }
    get priority() { return 40; }
    get entityCount() {
        let n = 0;
        this._entities.forEach(e => {
            if (e.status === EntityStatus.Showed)
                n++;
        });
        return n;
    }
    get entityGroupCount() { return this._groups.size; }
    setHelper(helper) { this._entityHelper = helper; }
    setResourceManager(rm) { this._resourceManager = rm; }
    // ================================================================
    // 分组管理
    // ================================================================
    addEntityGroup(groupName, autoReleaseInterval = 60, capacity = 16, expireTime = 60, priority = 0) {
        if (this._groups.has(groupName))
            return false;
        this._groups.set(groupName, new EntityGroup(groupName, autoReleaseInterval, capacity, expireTime, priority));
        this._pool.set(groupName, new Map());
        this._groupTimers.set(groupName, 0);
        return true;
    }
    hasEntityGroup(groupName) { return this._groups.has(groupName); }
    getEntityGroup(groupName) {
        return this._groups.get(groupName) ?? null;
    }
    getAllEntityGroups() {
        return Array.from(this._groups.values());
    }
    // ================================================================
    // 实体状态查询
    // ================================================================
    hasEntity(entityId) {
        return this._entities.get(entityId)?.status === EntityStatus.Showed;
    }
    hasEntityByAssetName(entityAssetName) {
        for (const data of this._entities.values()) {
            if (data.status === EntityStatus.Showed && data.entityAssetName === entityAssetName)
                return true;
        }
        return false;
    }
    isLoadingEntity(entityId) {
        const s = this._entities.get(entityId)?.status;
        return s === EntityStatus.WillInit || s === EntityStatus.WillShow;
    }
    isValidEntity(entityId) {
        return this._entities.get(entityId)?.status === EntityStatus.Showed;
    }
    getEntityStatus(entityId) {
        return this._entities.get(entityId)?.status ?? EntityStatus.Unknown;
    }
    // ================================================================
    // 实体实例查询
    // ================================================================
    getEntityInstance(entityId) {
        const data = this._entities.get(entityId);
        return data?.status === EntityStatus.Showed ? data.instance : null;
    }
    getEntityInstances(entityAssetName) {
        const result = [];
        this._entities.forEach(data => {
            if (data.status === EntityStatus.Showed && data.entityAssetName === entityAssetName && data.instance) {
                result.push(data.instance);
            }
        });
        return result;
    }
    getAllLoadedEntityInstances() {
        const result = [];
        this._entities.forEach(data => {
            if (data.status === EntityStatus.Showed && data.instance)
                result.push(data.instance);
        });
        return result;
    }
    getAllLoadingEntityIds() {
        const result = [];
        this._entities.forEach((data, id) => {
            if (data.status === EntityStatus.WillInit || data.status === EntityStatus.WillShow)
                result.push(id);
        });
        return result;
    }
    // ================================================================
    // 父子关系查询
    // ================================================================
    getParentEntityInstance(entityId) {
        const data = this._entities.get(entityId);
        if (!data || data.parentEntityId < 0)
            return null;
        return this.getEntityInstance(data.parentEntityId);
    }
    getChildEntityCount(parentEntityId) {
        return this._entities.get(parentEntityId)?.childEntityIds.size ?? 0;
    }
    getChildEntityInstance(parentEntityId) {
        const parent = this._entities.get(parentEntityId);
        if (!parent)
            return null;
        const firstId = parent.childEntityIds.values().next().value;
        return firstId !== undefined ? this.getEntityInstance(firstId) : null;
    }
    getChildEntityInstances(parentEntityId) {
        const parent = this._entities.get(parentEntityId);
        if (!parent)
            return [];
        const result = [];
        parent.childEntityIds.forEach(id => {
            const inst = this.getEntityInstance(id);
            if (inst)
                result.push(inst);
        });
        return result;
    }
    // ================================================================
    // 实体生命周期 — showEntity（优先命中对象池）
    // ================================================================
    showEntity(entityId, entityAssetName, bundleName, groupName, priority = 0, userData) {
        if (!this._entityHelper)
            throw new GameFrameworkError('EntityHelper is not set.');
        if (!this._resourceManager)
            throw new GameFrameworkError('ResourceManager is not set.');
        if (!this._groups.has(groupName))
            throw new GameFrameworkError(`EntityGroup '${groupName}' does not exist.`);
        if (this._entities.has(entityId))
            throw new GameFrameworkError(`Entity '${entityId}' already exists.`);
        const data = {
            entityId, entityAssetName, bundleName, groupName,
            priority, userData, instance: null,
            status: EntityStatus.WillInit,
            parentEntityId: -1, childEntityIds: new Set(),
            loadStartTime: Date.now(),
        };
        this._entities.set(entityId, data);
        // 优先从对象池取复用实例
        const pooled = this._acquireFromPool(groupName, entityAssetName);
        if (pooled) {
            data.status = EntityStatus.WillShow;
            data.instance = pooled.instance;
            const info = { entityId, entityAssetName, entityGroupName: groupName, userData };
            this._entityHelper.reactivateEntity(pooled.instance, info);
            data.status = EntityStatus.Showed;
            this._groups.get(groupName)._addEntity(entityId, pooled.instance, entityAssetName);
            this.onShowEntitySuccess?.(entityId, entityAssetName, groupName, pooled.instance, 0, userData);
            return;
        }
        // 池未命中 → 从资源加载
        this._resourceManager.loadAsset(bundleName, entityAssetName, Object, (asset) => this._onLoadSuccess(entityId, asset), (_name, msg) => this._onLoadFailure(entityId, entityAssetName, msg));
    }
    _onLoadSuccess(entityId, asset) {
        // 加载期间被取消
        if (this._cancelledIds.has(entityId)) {
            this._cancelledIds.delete(entityId);
            return;
        }
        const data = this._entities.get(entityId);
        if (!data || !this._entityHelper)
            return;
        const duration = (Date.now() - data.loadStartTime) / 1000;
        data.status = EntityStatus.WillShow;
        const instance = this._entityHelper.instantiateEntity(asset);
        data.instance = instance;
        data.status = EntityStatus.Inited;
        const info = {
            entityId,
            entityAssetName: data.entityAssetName,
            entityGroupName: data.groupName,
            userData: data.userData,
        };
        this._entityHelper.createEntity(instance, info);
        data.status = EntityStatus.Showed;
        this._groups.get(data.groupName)?._addEntity(entityId, instance, data.entityAssetName);
        this.onShowEntitySuccess?.(entityId, data.entityAssetName, data.groupName, instance, duration, data.userData);
    }
    _onLoadFailure(entityId, assetName, msg) {
        if (this._cancelledIds.has(entityId)) {
            this._cancelledIds.delete(entityId);
            return;
        }
        const data = this._entities.get(entityId);
        if (!data)
            return;
        const { groupName, userData } = data;
        this._entities.delete(entityId);
        if (this.onShowEntityFailure) {
            this.onShowEntityFailure(entityId, assetName, groupName, msg, userData);
        }
        else {
            console.error(`[EntityManager] Show entity '${assetName}' failed: ${msg}`);
        }
    }
    // ================================================================
    // 实体生命周期 — hideEntity
    // ================================================================
    hideEntity(entityId, userData) {
        const data = this._entities.get(entityId);
        if (!data)
            return;
        // 正在加载中：取消该次加载，不需要等待加载完成
        if (data.status === EntityStatus.WillInit || data.status === EntityStatus.WillShow) {
            this._cancelledIds.add(entityId);
            this._entities.delete(entityId);
            this.onHideEntityComplete?.(entityId, data.entityAssetName, data.groupName, userData);
            return;
        }
        if (!this._entityHelper || data.status !== EntityStatus.Showed)
            return;
        data.status = EntityStatus.WillHide;
        // 先断开父子关系
        if (data.parentEntityId >= 0)
            this.detachEntity(entityId, userData);
        if (data.childEntityIds.size > 0)
            this.detachChildEntities(entityId, userData);
        const { entityAssetName, groupName } = data;
        const inst = data.instance;
        data.status = EntityStatus.Hidden;
        this._groups.get(groupName)?._removeEntity(entityId);
        this._entities.delete(entityId);
        // 尝试回池；池满则销毁
        data.status = EntityStatus.WillRecycle;
        if (this._returnToPool(groupName, entityAssetName, inst)) {
            this._entityHelper.recycleEntity(inst, userData);
        }
        else {
            this._entityHelper.releaseEntity(null, inst, userData, false);
        }
        this.onHideEntityComplete?.(entityId, entityAssetName, groupName, userData);
    }
    hideAllLoadedEntities(userData) {
        const ids = [];
        this._entities.forEach((data, id) => { if (data.status === EntityStatus.Showed)
            ids.push(id); });
        for (const id of ids)
            this.hideEntity(id, userData);
    }
    hideAllLoadingEntities(userData) {
        const loading = [];
        this._entities.forEach((data, id) => {
            if (data.status === EntityStatus.WillInit || data.status === EntityStatus.WillShow) {
                loading.push(data);
                this._cancelledIds.add(id);
                this._entities.delete(id);
            }
        });
        for (const data of loading) {
            this.onHideEntityComplete?.(data.entityId, data.entityAssetName, data.groupName, userData);
        }
    }
    hideAllEntities(userData) {
        this.hideAllLoadedEntities(userData);
        this.hideAllLoadingEntities(userData);
    }
    // ================================================================
    // 父子挂载
    // ================================================================
    attachEntity(entityId, parentEntityId, userData) {
        const child = this._entities.get(entityId);
        const parent = this._entities.get(parentEntityId);
        if (!child || !parent || child.status !== EntityStatus.Showed || parent.status !== EntityStatus.Showed || !this._entityHelper)
            return;
        if (child.parentEntityId >= 0)
            this.detachEntity(entityId, userData);
        child.parentEntityId = parentEntityId;
        parent.childEntityIds.add(entityId);
        this._entityHelper.onAttachEntity(child.instance, parent.instance, userData);
        this.onAttachEntitySuccess?.(entityId, parentEntityId, userData);
    }
    detachEntity(entityId, userData) {
        const data = this._entities.get(entityId);
        if (!data || data.parentEntityId < 0)
            return;
        const parentId = data.parentEntityId;
        const parent = this._entities.get(parentId);
        parent?.childEntityIds.delete(entityId);
        data.parentEntityId = -1;
        if (this._entityHelper && data.instance) {
            this._entityHelper.onDetachEntity(data.instance, parent?.instance ?? null, userData);
        }
        this.onDetachEntitySuccess?.(entityId, parentId, userData);
    }
    detachChildEntities(parentEntityId, userData) {
        const parent = this._entities.get(parentEntityId);
        if (!parent)
            return;
        const childIds = Array.from(parent.childEntityIds);
        for (const id of childIds)
            this.detachEntity(id, userData);
    }
    // ================================================================
    // 每帧更新：驱动实体 + 对象池过期扫描
    // ================================================================
    update(elapseSeconds, realElapseSeconds) {
        if (!this._entityHelper)
            return;
        // 驱动活跃实体
        this._entities.forEach(data => {
            if (data.status === EntityStatus.Showed && data.instance) {
                this._entityHelper.onUpdateEntity(data.instance, elapseSeconds, realElapseSeconds);
            }
        });
        // 对象池过期扫描（每组独立计时）
        this._groups.forEach((group, groupName) => {
            const elapsed = (this._groupTimers.get(groupName) ?? 0) + elapseSeconds;
            if (elapsed >= group.autoReleaseInterval) {
                this._groupTimers.set(groupName, 0);
                this._releaseExpiredPoolEntries(groupName, group.expireTime);
            }
            else {
                this._groupTimers.set(groupName, elapsed);
            }
        });
    }
    // ================================================================
    // 关闭：销毁全部活跃实体 + 池内实体（isShutdown=true）
    // ================================================================
    shutdown() {
        if (!this._entityHelper)
            return;
        this._entities.forEach(data => {
            if (data.status === EntityStatus.Showed && data.instance) {
                this._entityHelper.releaseEntity(null, data.instance, undefined, true);
            }
        });
        this._entities.clear();
        this._pool.forEach(groupPool => {
            groupPool.forEach(entries => {
                entries.forEach(entry => {
                    this._entityHelper.releaseEntity(null, entry.instance, undefined, true);
                });
            });
        });
        this._pool.clear();
        this._groupTimers.clear();
        this._cancelledIds.clear();
        this._groups.forEach(g => g._clear());
        this._groups.clear();
        this._entityHelper = null;
        this._resourceManager = null;
    }
    // ================================================================
    // 对象池内部工具
    // ================================================================
    _acquireFromPool(groupName, assetName) {
        const groupPool = this._pool.get(groupName);
        if (!groupPool)
            return null;
        const entries = groupPool.get(assetName);
        if (!entries || entries.length === 0)
            return null;
        return entries.shift();
    }
    _returnToPool(groupName, assetName, instance) {
        const group = this._groups.get(groupName);
        const groupPool = this._pool.get(groupName);
        if (!group || !groupPool)
            return false;
        let total = 0;
        groupPool.forEach(entries => { total += entries.length; });
        if (total >= group.capacity)
            return false;
        let entries = groupPool.get(assetName);
        if (!entries) {
            entries = [];
            groupPool.set(assetName, entries);
        }
        entries.push({ instance, lastUseTime: Date.now() });
        return true;
    }
    _releaseExpiredPoolEntries(groupName, expireTime) {
        const groupPool = this._pool.get(groupName);
        if (!groupPool || !this._entityHelper)
            return;
        const now = Date.now();
        groupPool.forEach(entries => {
            for (let i = entries.length - 1; i >= 0; i--) {
                if ((now - entries[i].lastUseTime) / 1000 >= expireTime) {
                    const [expired] = entries.splice(i, 1);
                    this._entityHelper.releaseEntity(null, expired.instance, undefined, false);
                }
            }
        });
    }
}

/** 事件池模式，可按位组合 */
var EventPoolMode;
(function (EventPoolMode) {
    EventPoolMode[EventPoolMode["Default"] = 0] = "Default";
    EventPoolMode[EventPoolMode["AllowNoHandler"] = 1] = "AllowNoHandler";
    EventPoolMode[EventPoolMode["AllowMultiHandler"] = 2] = "AllowMultiHandler";
    EventPoolMode[EventPoolMode["AllowDuplicateHandler"] = 4] = "AllowDuplicateHandler";
})(EventPoolMode || (EventPoolMode = {}));

class EventManager extends GameFrameworkModule {
    constructor(mode = EventPoolMode.AllowNoHandler | EventPoolMode.AllowMultiHandler) {
        super();
        this._handlers = new Map();
        this._deferredQueue = [];
        this._processingQueue = [];
        this._defaultHandler = null;
        /**
         * 派发过程中记录各事件参数对象的下一个待调用索引。
         * 用于在处理函数内安全地 subscribe / unsubscribe，避免漏调或重复调用。
         */
        this._cachedIndices = new Map();
        this._mode = mode;
    }
    /** 对应原版 EventManager，优先级为 7 */
    get priority() { return 7; }
    get eventHandlerCount() {
        let count = 0;
        this._handlers.forEach(list => (count += list.length));
        return count;
    }
    /** 当前待派发的延迟事件数量（对应原版 EventPool.EventCount） */
    get eventCount() {
        return this._deferredQueue.length;
    }
    /** 已注册的事件类型数量 */
    get registeredEventCount() {
        return this._handlers.size;
    }
    count(eventId) {
        return this._handlers.get(eventId)?.length ?? 0;
    }
    check(eventId, handler) {
        if (!handler)
            throw new GameFrameworkError('Event handler is invalid.');
        return this._handlers.get(eventId)?.some(n => n.handler === handler) ?? false;
    }
    subscribe(eventId, handler, priority = 0) {
        if (!handler)
            throw new GameFrameworkError('Event handler is invalid.');
        let list = this._handlers.get(eventId);
        if (!list) {
            list = [];
            this._handlers.set(eventId, list);
        }
        else if ((this._mode & EventPoolMode.AllowMultiHandler) === 0) {
            throw new GameFrameworkError(`Event [${eventId}] not allow multi handler.`);
        }
        else if ((this._mode & EventPoolMode.AllowDuplicateHandler) === 0 && this.check(eventId, handler)) {
            throw new GameFrameworkError(`Event [${eventId}] not allow duplicate handler.`);
        }
        const node = { handler, priority };
        let insertIdx = list.length;
        for (let i = 0; i < list.length; i++) {
            if (priority > list[i].priority) {
                insertIdx = i;
                break;
            }
        }
        list.splice(insertIdx, 0, node);
        // 若正在派发该事件，插入点在已处理位置之前时需右移缓存索引，防止重复调用
        for (const [e, nextIdx] of this._cachedIndices) {
            if (e.id === eventId && nextIdx > insertIdx) {
                this._cachedIndices.set(e, nextIdx + 1);
            }
        }
    }
    unsubscribe(eventId, handler) {
        if (!handler)
            throw new GameFrameworkError('Event handler is invalid.');
        const list = this._handlers.get(eventId);
        if (!list) {
            throw new GameFrameworkError(`Event [${eventId}] not exists specified handler.`);
        }
        const idx = list.findIndex(n => n.handler === handler);
        if (idx < 0) {
            throw new GameFrameworkError(`Event [${eventId}] not exists specified handler.`);
        }
        // 若正在派发该事件，移除点在待调用范围内时需左移缓存索引，防止跳过处理函数
        for (const [e, nextIdx] of this._cachedIndices) {
            if (e.id === eventId && nextIdx > idx) {
                this._cachedIndices.set(e, nextIdx - 1);
            }
        }
        list.splice(idx, 1);
    }
    unsubscribeAll(eventId) {
        const list = this._handlers.get(eventId);
        if (list) {
            // 清空数组内容，正在进行的派发循环会因 list.length === 0 而立即退出
            list.length = 0;
        }
        this._handlers.delete(eventId);
    }
    hasSubscriber(eventId, handler) {
        const list = this._handlers.get(eventId);
        if (!list || list.length === 0)
            return false;
        if (handler === undefined)
            return true;
        return list.some(n => n.handler === handler);
    }
    fire(sender, e) {
        if (!e)
            throw new GameFrameworkError('Event is invalid.');
        this._deferredQueue.push({ sender, e });
    }
    fireNow(sender, e) {
        if (!e)
            throw new GameFrameworkError('Event is invalid.');
        this._handleEvent(sender, e);
    }
    clear() {
        for (const { e } of this._deferredQueue) {
            ReferencePool.release(e);
        }
        this._deferredQueue.length = 0;
    }
    setDefaultHandler(handler) {
        this._defaultHandler = handler;
    }
    update(_elapseSeconds, _realElapseSeconds) {
        // 交换队列，避免派发期间新入队的事件被本帧处理
        const tmp = this._processingQueue;
        this._processingQueue = this._deferredQueue;
        this._deferredQueue = tmp;
        for (const { sender, e } of this._processingQueue) {
            this._handleEvent(sender, e);
        }
        this._processingQueue.length = 0;
    }
    shutdown() {
        this.clear();
        this._handlers.clear();
        this._processingQueue.length = 0;
        this._cachedIndices.clear();
        this._defaultHandler = null;
    }
    _handleEvent(sender, e) {
        const list = this._handlers.get(e.id);
        let noHandlerException = false;
        if (list && list.length > 0) {
            // 使用 cachedIndices 在派发期间安全地支持 subscribe / unsubscribe
            let i = 0;
            this._cachedIndices.set(e, 0);
            while (i < list.length) {
                this._cachedIndices.set(e, i + 1);
                list[i].handler(sender, e);
                i = this._cachedIndices.get(e);
            }
            this._cachedIndices.delete(e);
        }
        else if (this._defaultHandler) {
            this._defaultHandler(sender, e);
        }
        else if ((this._mode & EventPoolMode.AllowNoHandler) === 0) {
            noHandlerException = true;
        }
        ReferencePool.release(e);
        if (noHandlerException) {
            throw new GameFrameworkError(`Event [${e.id}] not allow no handler.`);
        }
    }
}

/** 游戏逻辑事件基类，对应原版 GameFramework.Event.GameEventArgs */
class GameEventArgs extends BaseEventArgs {
}

function makeFileInfo(name, offset, length) {
    return { name, offset, length, isValid: true };
}
const INVALID_FILE_INFO = { name: '', offset: 0, length: 0, isValid: false };

/** 文件系统访问权限。 */
var FileSystemAccess;
(function (FileSystemAccess) {
    FileSystemAccess[FileSystemAccess["Unspecified"] = 0] = "Unspecified";
    FileSystemAccess[FileSystemAccess["Read"] = 1] = "Read";
    FileSystemAccess[FileSystemAccess["Write"] = 2] = "Write";
    FileSystemAccess[FileSystemAccess["ReadWrite"] = 3] = "ReadWrite";
})(FileSystemAccess || (FileSystemAccess = {}));

// ---- 内部常量 ----
const CLUSTER_SIZE = 4096;
const HEADER_MAGIC = [0x47, 0x46, 0x46]; // 'G','F','F'
const HEADER_VERSION = 1;
// Header 布局（字节）
// [0-2]  magic(3) [3] version(1) [4-7] encryptKey(4)
// [8-11] maxFileCount(int32) [12-15] maxBlockCount(int32) [16-19] blockCount(int32)
const HEADER_SIZE = 20;
const BLOCK_RECORD_SIZE = 12; // stringIndex(4) + clusterIndex(4) + length(4)
const STRING_RECORD_SIZE = 256; // 1 len byte + 255 data bytes
// ---- 主实现 ----
class FileSystem {
    constructor(fullPath, access, stream, encryptKey, maxFileCount, maxBlockCount) {
        /** blockIndex → BlockData */
        this._blocks = [];
        /** filename → blockIndex */
        this._fileMap = new Map();
        /** 按 length 分组的空闲块索引 */
        this._freeBlocks = new Map();
        /** blockIndex → filename（反向查询） */
        this._stringMap = new Map();
        this._freeStringSlots = [];
        this._fullPath = fullPath;
        this._access = access;
        this._stream = stream;
        this._encryptKey = encryptKey;
        this._maxFileCount = maxFileCount;
        this._maxBlockCount = maxBlockCount;
    }
    // ---- 工厂方法 ----
    static create(fullPath, access, stream, maxFileCount, maxBlockCount) {
        if (access === FileSystemAccess.Read) {
            throw new Error(`[FileSystem] Cannot create a read-only file system: ${fullPath}`);
        }
        if (maxFileCount <= 0 || maxBlockCount < maxFileCount) {
            throw new Error(`[FileSystem] Invalid maxFileCount(${maxFileCount}) or maxBlockCount(${maxBlockCount}).`);
        }
        const key = new Uint8Array(4);
        crypto.getRandomValues(key);
        const fs = new FileSystem(fullPath, access, stream, key, maxFileCount, maxBlockCount);
        fs._writeHeader(0);
        return fs;
    }
    static load(fullPath, access, stream) {
        stream.position = 0;
        const headerBuf = new Uint8Array(HEADER_SIZE);
        stream.read(headerBuf, 0, HEADER_SIZE);
        // 校验魔数
        if (headerBuf[0] !== HEADER_MAGIC[0] || headerBuf[1] !== HEADER_MAGIC[1] || headerBuf[2] !== HEADER_MAGIC[2]) {
            throw new Error(`[FileSystem] Invalid file system: ${fullPath}`);
        }
        if (headerBuf[3] !== HEADER_VERSION) {
            throw new Error(`[FileSystem] Unsupported version ${headerBuf[3]}: ${fullPath}`);
        }
        const key = headerBuf.slice(4, 8);
        const view = new DataView(headerBuf.buffer);
        const maxFileCount = view.getInt32(8, true);
        const maxBlockCount = view.getInt32(12, true);
        const blockCount = view.getInt32(16, true);
        const fs = new FileSystem(fullPath, access, stream, key, maxFileCount, maxBlockCount);
        fs._loadBlocks(blockCount);
        return fs;
    }
    // ---- IFileSystem ----
    get fullPath() { return this._fullPath; }
    get access() { return this._access; }
    get fileCount() { return this._fileMap.size; }
    get maxFileCount() { return this._maxFileCount; }
    hasFile(name) {
        return this._fileMap.has(name);
    }
    getFileInfo(name) {
        const bi = this._fileMap.get(name);
        if (bi === undefined)
            return INVALID_FILE_INFO;
        const block = this._blocks[bi];
        const offset = this._clusterOffset(block.clusterIndex) + HEADER_SIZE;
        return makeFileInfo(name, offset, block.length);
    }
    getAllFileInfos() {
        const result = [];
        this._fileMap.forEach((bi, name) => {
            const block = this._blocks[bi];
            result.push(makeFileInfo(name, this._clusterOffset(block.clusterIndex) + HEADER_SIZE, block.length));
        });
        return result;
    }
    readFile(name) {
        const bi = this._fileMap.get(name);
        if (bi === undefined)
            return null;
        const block = this._blocks[bi];
        const buf = new Uint8Array(block.length);
        this._readBlockData(block, buf, 0, block.length);
        return buf;
    }
    readFileToBuffer(name, buffer, startIndex = 0, length) {
        const bi = this._fileMap.get(name);
        if (bi === undefined)
            return 0;
        const block = this._blocks[bi];
        const toRead = Math.min(length ?? block.length, block.length, buffer.length - startIndex);
        return this._readBlockData(block, buffer, startIndex, toRead);
    }
    readFileSegment(name, offset, length) {
        const bi = this._fileMap.get(name);
        if (bi === undefined)
            return null;
        const block = this._blocks[bi];
        const safeOffset = Math.min(offset, block.length);
        const safeLen = Math.min(length, block.length - safeOffset);
        const buf = new Uint8Array(safeLen);
        this._readBlockData(block, buf, 0, safeLen, safeOffset);
        return buf;
    }
    readFileSegmentToBuffer(name, offset, buffer, startIndex = 0, length) {
        const bi = this._fileMap.get(name);
        if (bi === undefined)
            return 0;
        const block = this._blocks[bi];
        const safeOffset = Math.min(offset, block.length);
        const maxLen = block.length - safeOffset;
        const toRead = Math.min(length ?? maxLen, maxLen, buffer.length - startIndex);
        return this._readBlockData(block, buffer, startIndex, toRead, safeOffset);
    }
    writeFile(name, buffer, startIndex = 0, length) {
        this._assertWritable();
        if (!name)
            throw new Error('[FileSystem] File name is empty.');
        const dataLen = length ?? (buffer.length - startIndex);
        const existing = this._fileMap.get(name);
        if (existing !== undefined) {
            return this._overwriteBlock(existing, buffer, startIndex, dataLen);
        }
        if (this._fileMap.size >= this._maxFileCount) {
            console.warn(`[FileSystem] Max file count reached (${this._maxFileCount}).`);
            return false;
        }
        return this._allocateAndWrite(name, buffer, startIndex, dataLen);
    }
    renameFile(oldName, newName) {
        this._assertWritable();
        if (!oldName || !newName)
            return false;
        const bi = this._fileMap.get(oldName);
        if (bi === undefined)
            return false;
        if (this._fileMap.has(newName))
            return false;
        this._fileMap.delete(oldName);
        this._fileMap.set(newName, bi);
        this._stringMap.set(bi, newName);
        this._writeStringRecord(bi, newName);
        return true;
    }
    deleteFile(name) {
        this._assertWritable();
        const bi = this._fileMap.get(name);
        if (bi === undefined)
            return false;
        const block = this._blocks[bi];
        this._fileMap.delete(name);
        this._stringMap.delete(bi);
        this._freeStringSlots.push(block.stringIndex);
        block.stringIndex = -1;
        this._addFreeBlock(bi, block.length);
        this._writeBlockRecord(bi);
        this._writeHeader(this._blocks.filter(b => b.stringIndex >= 0).length);
        return true;
    }
    shutdown() {
        this._stream.flush();
        this._stream.close();
    }
    // ---- 内部实现 ----
    _assertWritable() {
        if (this._access === FileSystemAccess.Read) {
            throw new Error('[FileSystem] File system is read-only.');
        }
    }
    _clusterOffset(clusterIndex) {
        return HEADER_SIZE
            + this._maxBlockCount * BLOCK_RECORD_SIZE
            + this._maxFileCount * STRING_RECORD_SIZE
            + clusterIndex * CLUSTER_SIZE;
    }
    _readBlockData(block, out, outOffset, count, blockOffset = 0) {
        const pos = this._clusterOffset(block.clusterIndex) + blockOffset;
        this._stream.position = pos;
        return this._stream.read(out, outOffset, count);
    }
    _overwriteBlock(bi, buf, startIndex, dataLen) {
        const block = this._blocks[bi];
        const neededClusters = Math.ceil(dataLen / CLUSTER_SIZE);
        const currentClusters = Math.ceil(block.length / CLUSTER_SIZE);
        if (neededClusters > currentClusters) {
            // 需要更多空间：释放旧块，重新分配
            this._addFreeBlock(bi, block.length);
            block.stringIndex = -1; // 暂时标记为空闲
            return this._allocateAndWrite(this._stringMap.get(bi) ?? '', buf, startIndex, dataLen);
        }
        // 原地覆写
        block.length = dataLen;
        this._stream.position = this._clusterOffset(block.clusterIndex);
        this._stream.write(buf, startIndex, dataLen);
        this._writeBlockRecord(bi);
        return true;
    }
    _allocateAndWrite(name, buf, startIndex, dataLen) {
        const clusterCount = Math.ceil(dataLen / CLUSTER_SIZE) || 1;
        const clusterBytes = clusterCount * CLUSTER_SIZE;
        // 尝试找足够大的空闲块
        let freeBi = this._findFreeBlock(clusterBytes);
        let clusterIndex;
        if (freeBi >= 0) {
            clusterIndex = this._blocks[freeBi].clusterIndex;
            this._removeFreeBlock(freeBi, this._blocks[freeBi].length);
        }
        else {
            // 追加到末尾
            clusterIndex = this._nextFreeCluster();
            freeBi = this._blocks.length;
            this._blocks.push({ stringIndex: -1, clusterIndex, length: 0 });
        }
        if (freeBi >= this._maxBlockCount) {
            console.warn('[FileSystem] Max block count reached.');
            return false;
        }
        // 分配字符串槽
        const stringIndex = this._freeStringSlots.pop() ?? this._usedStringCount();
        if (stringIndex >= this._maxFileCount) {
            console.warn('[FileSystem] Max string slot reached.');
            return false;
        }
        const block = this._blocks[freeBi];
        block.stringIndex = stringIndex;
        block.clusterIndex = clusterIndex;
        block.length = dataLen;
        this._fileMap.set(name, freeBi);
        this._stringMap.set(freeBi, name);
        // 写入数据
        this._stream.position = this._clusterOffset(clusterIndex);
        this._stream.write(buf, startIndex, dataLen);
        // 更新元数据
        this._writeBlockRecord(freeBi);
        this._writeStringRecord(freeBi, name);
        this._writeHeader(this._fileMap.size);
        return true;
    }
    _findFreeBlock(minBytes) {
        let bestBi = -1;
        let bestSize = Infinity;
        this._freeBlocks.forEach((list, size) => {
            if (size >= minBytes && size < bestSize && list.length > 0) {
                bestSize = size;
                bestBi = list[list.length - 1];
            }
        });
        return bestBi;
    }
    _addFreeBlock(bi, length) {
        if (!this._freeBlocks.has(length))
            this._freeBlocks.set(length, []);
        this._freeBlocks.get(length).push(bi);
    }
    _removeFreeBlock(bi, length) {
        const list = this._freeBlocks.get(length);
        if (!list)
            return;
        const idx = list.lastIndexOf(bi);
        if (idx >= 0)
            list.splice(idx, 1);
    }
    _nextFreeCluster() {
        let max = 0;
        for (const b of this._blocks) {
            const end = b.clusterIndex + Math.ceil((b.length || 1) / CLUSTER_SIZE);
            if (end > max)
                max = end;
        }
        return max;
    }
    _usedStringCount() {
        let max = -1;
        this._blocks.forEach(b => { if (b.stringIndex > max)
            max = b.stringIndex; });
        return max + 1;
    }
    // ---- 序列化 / 反序列化 ----
    _writeHeader(blockCount) {
        this._stream.position = 0;
        const buf = new Uint8Array(HEADER_SIZE);
        const view = new DataView(buf.buffer);
        buf[0] = HEADER_MAGIC[0];
        buf[1] = HEADER_MAGIC[1];
        buf[2] = HEADER_MAGIC[2];
        buf[3] = HEADER_VERSION;
        buf.set(this._encryptKey, 4);
        view.setInt32(8, this._maxFileCount, true);
        view.setInt32(12, this._maxBlockCount, true);
        view.setInt32(16, blockCount, true);
        this._stream.write(buf, 0, HEADER_SIZE);
    }
    _writeBlockRecord(bi) {
        const offset = HEADER_SIZE + bi * BLOCK_RECORD_SIZE;
        this._stream.position = offset;
        const buf = new Uint8Array(BLOCK_RECORD_SIZE);
        const view = new DataView(buf.buffer);
        const b = this._blocks[bi];
        view.setInt32(0, b.stringIndex, true);
        view.setInt32(4, b.clusterIndex, true);
        view.setInt32(8, b.length, true);
        this._stream.write(buf, 0, BLOCK_RECORD_SIZE);
    }
    _writeStringRecord(bi, name) {
        const block = this._blocks[bi];
        const si = block.stringIndex;
        const offset = HEADER_SIZE + this._maxBlockCount * BLOCK_RECORD_SIZE + si * STRING_RECORD_SIZE;
        this._stream.position = offset;
        const encoded = new TextEncoder().encode(name).slice(0, 255);
        const rec = new Uint8Array(STRING_RECORD_SIZE);
        rec[0] = encoded.length;
        for (let i = 0; i < encoded.length; i++) {
            rec[1 + i] = encoded[i] ^ this._encryptKey[i % 4];
        }
        this._stream.write(rec, 0, STRING_RECORD_SIZE);
    }
    _loadBlocks(blockCount) {
        const blockAreaOffset = HEADER_SIZE;
        const stringAreaOffset = HEADER_SIZE + this._maxBlockCount * BLOCK_RECORD_SIZE;
        // 读取所有块记录
        this._stream.position = blockAreaOffset;
        const blockBuf = new Uint8Array(blockCount * BLOCK_RECORD_SIZE);
        this._stream.read(blockBuf, 0, blockBuf.length);
        const blockView = new DataView(blockBuf.buffer);
        for (let i = 0; i < blockCount; i++) {
            const base = i * BLOCK_RECORD_SIZE;
            this._blocks.push({
                stringIndex: blockView.getInt32(base + 0, true),
                clusterIndex: blockView.getInt32(base + 4, true),
                length: blockView.getInt32(base + 8, true),
            });
        }
        // 读取字符串记录并建立映射
        this._stream.position = stringAreaOffset;
        const strBuf = new Uint8Array(this._maxFileCount * STRING_RECORD_SIZE);
        this._stream.read(strBuf, 0, strBuf.length);
        for (let i = 0; i < blockCount; i++) {
            const b = this._blocks[i];
            if (b.stringIndex < 0) {
                this._addFreeBlock(i, b.length);
                continue;
            }
            const strBase = b.stringIndex * STRING_RECORD_SIZE;
            const nameLen = strBuf[strBase];
            const decoded = new Uint8Array(nameLen);
            for (let j = 0; j < nameLen; j++) {
                decoded[j] = strBuf[strBase + 1 + j] ^ this._encryptKey[j % 4];
            }
            const name = new TextDecoder().decode(decoded);
            this._fileMap.set(name, i);
            this._stringMap.set(i, name);
        }
    }
}

/**
 * 文件系统管理器。
 *
 * 管理多个并行开放的虚拟文件系统实例，每个实例对应存储中的一个物理文件。
 * 通过 setFileSystemHelper() 注入平台相关的流实现。
 */
class FileSystemManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._helper = null;
        this._fileSystems = new Map();
    }
    get priority() { return 0; }
    get count() { return this._fileSystems.size; }
    setFileSystemHelper(helper) {
        this._helper = helper;
    }
    hasFileSystem(fullPath) {
        return this._fileSystems.has(fullPath);
    }
    getFileSystem(fullPath) {
        return this._fileSystems.get(fullPath) ?? null;
    }
    createFileSystem(fullPath, access, maxFileCount, maxBlockCount) {
        this._assertHelper();
        if (access === FileSystemAccess.Unspecified) {
            throw new GameFrameworkError('[FileSystemManager] Access cannot be Unspecified.');
        }
        if (this._fileSystems.has(fullPath)) {
            throw new GameFrameworkError(`[FileSystemManager] File system already exists: ${fullPath}`);
        }
        const stream = this._helper.createFileSystemStream(fullPath, access, true);
        const fs = FileSystem.create(fullPath, access, stream, maxFileCount, maxBlockCount);
        this._fileSystems.set(fullPath, fs);
        return fs;
    }
    loadFileSystem(fullPath, access) {
        this._assertHelper();
        if (access === FileSystemAccess.Unspecified) {
            throw new GameFrameworkError('[FileSystemManager] Access cannot be Unspecified.');
        }
        if (this._fileSystems.has(fullPath)) {
            throw new GameFrameworkError(`[FileSystemManager] File system already open: ${fullPath}`);
        }
        const stream = this._helper.createFileSystemStream(fullPath, access, false);
        const fs = FileSystem.load(fullPath, access, stream);
        this._fileSystems.set(fullPath, fs);
        return fs;
    }
    destroyFileSystem(fileSystem, deletePhysicalFile) {
        const fs = this._fileSystems.get(fileSystem.fullPath);
        if (!fs)
            return;
        fs.shutdown();
        this._fileSystems.delete(fileSystem.fullPath);
        if (deletePhysicalFile) {
            console.warn(`[FileSystemManager] Physical file deletion for '${fileSystem.fullPath}' must be handled by the platform helper.`);
        }
    }
    getAllFileSystems() {
        return [...this._fileSystems.values()];
    }
    // ---- GameFrameworkModule 生命周期 ----
    update(_elapseSeconds, _realElapseSeconds) { }
    shutdown() {
        this._fileSystems.forEach(fs => fs.shutdown());
        this._fileSystems.clear();
        this._helper = null;
    }
    _assertHelper() {
        if (!this._helper) {
            throw new GameFrameworkError('[FileSystemManager] File system helper is not set.');
        }
    }
}

/**
 * 文件系统流抽象基类。
 *
 * 平台辅助器负责实例化具体子类（Web 用 IndexedDB / File API，Android 用 AssetManager 等）。
 * FileSystem 核心只依赖此接口读写底层字节流。
 */
class FileSystemStream {
    /** 将 count 字节从当前流拷贝到目标流，返回实际拷贝字节数。 */
    copyTo(dst, count) {
        const buf = new Uint8Array(Math.min(count, 4096));
        let remaining = count;
        let total = 0;
        while (remaining > 0) {
            const toRead = Math.min(remaining, buf.length);
            const read = this.read(buf, 0, toRead);
            if (read <= 0)
                break;
            dst.write(buf, 0, read);
            remaining -= read;
            total += read;
        }
        return total;
    }
}
var SeekOrigin;
(function (SeekOrigin) {
    SeekOrigin[SeekOrigin["Begin"] = 0] = "Begin";
    SeekOrigin[SeekOrigin["Current"] = 1] = "Current";
    SeekOrigin[SeekOrigin["End"] = 2] = "End";
})(SeekOrigin || (SeekOrigin = {}));

class Fsm {
    constructor(name, owner, states) {
        this._states = new Map();
        this._data = new Map();
        this._currentState = null;
        this._currentStateTime = 0;
        this._isRunning = false;
        this._isDestroyed = false;
        this._name = name;
        this._owner = owner;
        for (const state of states) {
            const ctor = state.constructor;
            if (this._states.has(ctor)) {
                throw new GameFrameworkError(`FSM [${name}] already has state [${ctor.name}].`);
            }
            this._states.set(ctor, state);
            state.onInit(this);
        }
    }
    get name() { return this._name; }
    get fullName() { return `${this._owner.constructor.name}.${this._name}`; }
    get owner() { return this._owner; }
    get ownerType() { return this._owner.constructor; }
    get stateCount() { return this._states.size; }
    get isRunning() { return this._isRunning; }
    get isDestroyed() { return this._isDestroyed; }
    get currentState() { return this._currentState; }
    get currentStateTime() { return this._currentStateTime; }
    start(ctor) {
        if (this._isRunning) {
            throw new GameFrameworkError(`FSM [${this._name}] is already running.`);
        }
        const state = this._states.get(ctor);
        if (!state) {
            throw new GameFrameworkError(`FSM [${this._name}] has no state [${ctor.name}].`);
        }
        this._currentState = state;
        this._currentStateTime = 0;
        this._isRunning = true;
        state.onEnter(this);
    }
    hasState(ctor) {
        return this._states.has(ctor);
    }
    getState(ctor) {
        return this._states.get(ctor) ?? null;
    }
    getAllStates() {
        return Array.from(this._states.values());
    }
    changeState(ctor) {
        if (!this._isRunning) {
            throw new GameFrameworkError(`FSM [${this._name}] is not running.`);
        }
        const nextState = this._states.get(ctor);
        if (!nextState) {
            throw new GameFrameworkError(`FSM [${this._name}] has no state [${ctor.name}].`);
        }
        const prevState = this._currentState;
        // call onLeave before switching so the leaving state still sees itself as current
        prevState?.onLeave(this, false);
        this._currentState = nextState;
        this._currentStateTime = 0;
        nextState.onEnter(this);
    }
    hasData(name) {
        return this._data.has(name);
    }
    setData(name, data) {
        this._data.set(name, data);
    }
    getData(name) {
        return this._data.get(name);
    }
    removeData(name) {
        return this._data.delete(name);
    }
    update(elapseSeconds, realElapseSeconds) {
        if (!this._isRunning || !this._currentState)
            return;
        this._currentStateTime += elapseSeconds;
        this._currentState.onUpdate(this, elapseSeconds, realElapseSeconds);
    }
    shutdown() {
        if (this._currentState) {
            this._currentState.onLeave(this, true);
            this._currentState = null;
        }
        this._states.forEach(state => state.onDestroy(this));
        this._states.clear();
        this._data.clear();
        this._isRunning = false;
        this._isDestroyed = true;
    }
}

function makeFsmKey(ownerCtorName, name) {
    return name ? `${ownerCtorName}.${name}` : ownerCtorName;
}
class FsmManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._fsms = new Map();
    }
    get priority() { return 90; }
    get fsmCount() { return this._fsms.size; }
    hasFsm(ownerCtor, name = '') {
        return this._fsms.has(makeFsmKey(ownerCtor.name, name));
    }
    getFsm(ownerCtor, name = '') {
        return this._fsms.get(makeFsmKey(ownerCtor.name, name)) ?? null;
    }
    getAllFsms() {
        return Array.from(this._fsms.values());
    }
    createFsm(name, owner, states) {
        const key = makeFsmKey(owner.constructor.name, name);
        if (this._fsms.has(key)) {
            throw new GameFrameworkError(`FSM [${key}] already exists.`);
        }
        if (!states || states.length === 0) {
            throw new GameFrameworkError(`FSM [${key}] must have at least one state.`);
        }
        const fsm = new Fsm(name, owner, states);
        this._fsms.set(key, fsm);
        return fsm;
    }
    destroyFsm(ownerCtor, name = '') {
        const key = makeFsmKey(ownerCtor.name, name);
        const fsm = this._fsms.get(key);
        if (!fsm)
            return false;
        fsm.shutdown();
        this._fsms.delete(key);
        return true;
    }
    destroyFsmByInstance(fsm) {
        const key = makeFsmKey(fsm.ownerType.name, fsm.name);
        const existing = this._fsms.get(key);
        if (!existing)
            return false;
        existing.shutdown();
        this._fsms.delete(key);
        return true;
    }
    update(elapseSeconds, realElapseSeconds) {
        const fsms = Array.from(this._fsms.values());
        for (const fsm of fsms) {
            if (!fsm.isDestroyed) {
                fsm.update(elapseSeconds, realElapseSeconds);
            }
        }
    }
    shutdown() {
        this._fsms.forEach(fsm => fsm.shutdown());
        this._fsms.clear();
    }
}

class FsmState {
    onInit(fsm) { }
    onEnter(fsm) { }
    onUpdate(fsm, elapseSeconds, realElapseSeconds) { }
    onLeave(fsm, isShutdown) { }
    onDestroy(fsm) { }
    changeState(fsm, ctor) {
        if (!fsm) {
            throw new GameFrameworkError('FSM is invalid.');
        }
        if (!fsm.hasState(ctor)) {
            throw new GameFrameworkError(`State type '${ctor.name}' is invalid.`);
        }
        fsm.changeState(ctor);
    }
}

class LocalizationManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._dictionary = new Map();
        this._language = 'zh-CN';
        this._helper = null;
    }
    get priority() { return 68; }
    get language() { return this._language; }
    set language(value) { this._language = value; }
    get dictionaryCount() { return this._dictionary.size; }
    get helper() { return this._helper; }
    setHelper(helper) {
        this._helper = helper;
    }
    loadDictionary(data) {
        if (Array.isArray(data)) {
            for (const item of data) {
                this._dictionary.set(item.key, item.value);
            }
        }
        else {
            for (const key of Object.keys(data)) {
                this._dictionary.set(key, data[key]);
            }
        }
    }
    clearDictionary() {
        this._dictionary.clear();
    }
    hasString(key) {
        return this._dictionary.has(key);
    }
    getString(key, defaultValue = key) {
        return this._dictionary.get(key) ?? defaultValue;
    }
    format(key, ...args) {
        const template = this.getString(key);
        return template.replace(/\{(\d+)\}/g, (_, idx) => {
            const i = parseInt(idx, 10);
            return i < args.length ? String(args[i]) : `{${idx}}`;
        });
    }
    update(_e, _r) { }
    shutdown() {
        this._dictionary.clear();
    }
}

/** 网络地址族，对应原版 AddressFamily 枚举 */
var AddressFamily;
(function (AddressFamily) {
    /** 未指定 */
    AddressFamily[AddressFamily["Unknown"] = 0] = "Unknown";
    /** IPv4 地址 */
    AddressFamily[AddressFamily["IPv4"] = 2] = "IPv4";
    /** IPv6 地址 */
    AddressFamily[AddressFamily["IPv6"] = 23] = "IPv6";
})(AddressFamily || (AddressFamily = {}));

/** 网络错误码，对应原版 NetworkErrorCode 枚举 */
var NetworkErrorCode;
(function (NetworkErrorCode) {
    /** 未知错误 */
    NetworkErrorCode[NetworkErrorCode["Unknown"] = 0] = "Unknown";
    /** 地址解析失败 */
    NetworkErrorCode[NetworkErrorCode["AddressError"] = 1] = "AddressError";
    /** 连接失败 */
    NetworkErrorCode[NetworkErrorCode["ConnectError"] = 2] = "ConnectError";
    /** 发送失败 */
    NetworkErrorCode[NetworkErrorCode["SendError"] = 3] = "SendError";
    /** 接收失败 */
    NetworkErrorCode[NetworkErrorCode["ReceiveError"] = 4] = "ReceiveError";
    /** 消息包头错误 */
    NetworkErrorCode[NetworkErrorCode["PacketHeaderError"] = 5] = "PacketHeaderError";
    /** 消息包体错误 */
    NetworkErrorCode[NetworkErrorCode["PacketError"] = 6] = "PacketError";
    /** 序列化错误 */
    NetworkErrorCode[NetworkErrorCode["SerializeError"] = 7] = "SerializeError";
    /** 反序列化错误 */
    NetworkErrorCode[NetworkErrorCode["DeserializeError"] = 8] = "DeserializeError";
    /** 心跳超时断开 */
    NetworkErrorCode[NetworkErrorCode["HeartBeatTimeout"] = 9] = "HeartBeatTimeout";
    /** 自定义错误 */
    NetworkErrorCode[NetworkErrorCode["CustomError"] = 10] = "CustomError";
})(NetworkErrorCode || (NetworkErrorCode = {}));

/** 网络连接成功事件 */
class NetworkConnectedEventArgs extends BaseEventArgs {
    get id() { return NetworkConnectedEventArgs.eventId; }
    static create(channelName, userData) {
        const e = ReferencePool.acquire(NetworkConnectedEventArgs);
        e.channelName = channelName;
        e.userData = userData;
        return e;
    }
    clear() {
        this.channelName = '';
        this.userData = undefined;
    }
}
NetworkConnectedEventArgs.eventId = 'network.connected';
/** 网络连接关闭事件 */
class NetworkClosedEventArgs extends BaseEventArgs {
    get id() { return NetworkClosedEventArgs.eventId; }
    static create(channelName, code, reason) {
        const e = ReferencePool.acquire(NetworkClosedEventArgs);
        e.channelName = channelName;
        e.code = code;
        e.reason = reason;
        return e;
    }
    clear() {
        this.channelName = '';
        this.code = 0;
        this.reason = '';
    }
}
NetworkClosedEventArgs.eventId = 'network.closed';
/** 心跳包丢失事件 */
class NetworkMissHeartBeatEventArgs extends BaseEventArgs {
    get id() { return NetworkMissHeartBeatEventArgs.eventId; }
    static create(channelName, missCount) {
        const e = ReferencePool.acquire(NetworkMissHeartBeatEventArgs);
        e.channelName = channelName;
        e.missCount = missCount;
        return e;
    }
    clear() {
        this.channelName = '';
        this.missCount = 0;
    }
}
NetworkMissHeartBeatEventArgs.eventId = 'network.missHeartBeat';
/** 网络错误事件 */
class NetworkErrorEventArgs extends BaseEventArgs {
    get id() { return NetworkErrorEventArgs.eventId; }
    static create(channelName, errorMessage) {
        const e = ReferencePool.acquire(NetworkErrorEventArgs);
        e.channelName = channelName;
        e.errorMessage = errorMessage;
        return e;
    }
    clear() {
        this.channelName = '';
        this.errorMessage = '';
    }
}
NetworkErrorEventArgs.eventId = 'network.error';
/** 用户自定义网络错误事件 */
class NetworkCustomErrorEventArgs extends BaseEventArgs {
    get id() { return NetworkCustomErrorEventArgs.eventId; }
    static create(channelName, customErrorData) {
        const e = ReferencePool.acquire(NetworkCustomErrorEventArgs);
        e.channelName = channelName;
        e.customErrorData = customErrorData;
        return e;
    }
    clear() {
        this.channelName = '';
        this.customErrorData = undefined;
    }
}
NetworkCustomErrorEventArgs.eventId = 'network.customError';

const DEFAULT_HEARTBEAT_INTERVAL = 30;
/** WebSocket 网络频道实现 */
class NetworkChannel {
    constructor(name, helper) {
        this._ws = null;
        this._sendQueue = [];
        this._receiveQueue = [];
        this._sentPacketCount = 0;
        this._receivedPacketCount = 0;
        this._heartBeatInterval = DEFAULT_HEARTBEAT_INTERVAL;
        this._heartBeatElapseSeconds = 0;
        this._missHeartBeatCount = 0;
        this._resetHeartBeatOnReceive = true;
        this.name = name;
        this._helper = helper;
    }
    get connected() {
        return this._ws !== null && this._ws.readyState === WebSocket.OPEN;
    }
    get sendPacketCount() { return this._sendQueue.length; }
    get sentPacketCount() { return this._sentPacketCount; }
    get receivePacketCount() { return this._receiveQueue.length; }
    get receivedPacketCount() { return this._receivedPacketCount; }
    get resetHeartBeatElapseSecondsWhenReceivePacket() { return this._resetHeartBeatOnReceive; }
    set resetHeartBeatElapseSecondsWhenReceivePacket(value) { this._resetHeartBeatOnReceive = value; }
    get missHeartBeatCount() { return this._missHeartBeatCount; }
    get heartBeatInterval() { return this._heartBeatInterval; }
    set heartBeatInterval(value) { this._heartBeatInterval = value; }
    get heartBeatElapseSeconds() { return this._heartBeatElapseSeconds; }
    connect(url, userData) {
        if (this._ws) {
            this.close();
        }
        this._userData = userData;
        this._heartBeatElapseSeconds = 0;
        this._missHeartBeatCount = 0;
        this._sendQueue.length = 0;
        this._receiveQueue.length = 0;
        this._helper?.prepareForConnecting();
        this._ws = new WebSocket(url);
        this._ws.binaryType = 'arraybuffer';
        this._ws.onopen = () => {
            this.onConnected?.(this, this._userData);
        };
        this._ws.onmessage = (evt) => {
            this._receivedPacketCount++;
            if (this._resetHeartBeatOnReceive) {
                this._heartBeatElapseSeconds = 0;
            }
            if (this._helper) {
                const raw = new Uint8Array(evt.data);
                const headerResult = this._helper.deserializePacketHeader(raw.slice(0, this._helper.packetHeaderLength));
                if (!headerResult.header) {
                    if (headerResult.customErrorData !== undefined) {
                        this.onCustomError?.(this, headerResult.customErrorData);
                    }
                    return;
                }
                const bodyData = raw.slice(this._helper.packetHeaderLength);
                const packetResult = this._helper.deserializePacket(headerResult.header, bodyData);
                if (!packetResult.packet) {
                    if (packetResult.customErrorData !== undefined) {
                        this.onCustomError?.(this, packetResult.customErrorData);
                    }
                    return;
                }
                this._receiveQueue.push(packetResult.packet);
            }
        };
        this._ws.onclose = (evt) => {
            const code = evt.code;
            const reason = evt.reason;
            this._ws = null;
            this.onClosed?.(this, code, reason);
        };
        this._ws.onerror = () => {
            this.onError?.(this, `WebSocket error on channel [${this.name}]`);
        };
    }
    close() {
        if (!this._ws)
            return;
        const ws = this._ws;
        this._ws = null;
        this._sendQueue.length = 0;
        this._receiveQueue.length = 0;
        if (ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
            ws.close();
        }
    }
    send(packet) {
        if (!packet)
            throw new GameFrameworkError('Packet is invalid.');
        if (!this.connected)
            return false;
        if (this._helper) {
            const data = this._helper.serialize(packet);
            if (!data)
                return false;
            this._ws.send(data.buffer);
        }
        else {
            this._sendQueue.push(packet);
        }
        this._sentPacketCount++;
        return true;
    }
    /** 每帧由 NetworkManager 调用 */
    update(elapseSeconds) {
        if (!this.connected || this._heartBeatInterval <= 0)
            return;
        this._heartBeatElapseSeconds += elapseSeconds;
        if (this._heartBeatElapseSeconds >= this._heartBeatInterval) {
            this._heartBeatElapseSeconds = 0;
            this._missHeartBeatCount++;
            const sent = this._helper?.sendHeartBeat() ?? false;
            if (!sent) {
                this.onMissHeartBeat?.(this, this._missHeartBeatCount);
            }
        }
    }
}
class NetworkManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._channels = new Map();
    }
    get priority() { return 55; }
    get networkChannelCount() { return this._channels.size; }
    hasNetworkChannel(name) {
        return this._channels.has(name);
    }
    getNetworkChannel(name) {
        return this._channels.get(name) ?? null;
    }
    getAllNetworkChannels() {
        return Array.from(this._channels.values());
    }
    createNetworkChannel(name, helper) {
        if (this._channels.has(name)) {
            throw new GameFrameworkError(`Network channel [${name}] already exists.`);
        }
        const channel = new NetworkChannel(name, helper ?? null);
        channel.onConnected = (ch, userData) => {
            this.onNetworkConnected?.(this, NetworkConnectedEventArgs.create(ch.name, userData));
        };
        channel.onClosed = (ch, code, reason) => {
            this._channels.delete(ch.name);
            this.onNetworkClosed?.(this, NetworkClosedEventArgs.create(ch.name, code, reason));
        };
        channel.onMissHeartBeat = (ch, missCount) => {
            this.onNetworkMissHeartBeat?.(this, NetworkMissHeartBeatEventArgs.create(ch.name, missCount));
        };
        channel.onError = (ch, errorMessage) => {
            this.onNetworkError?.(this, NetworkErrorEventArgs.create(ch.name, errorMessage));
        };
        channel.onCustomError = (ch, customErrorData) => {
            this.onNetworkCustomError?.(this, NetworkCustomErrorEventArgs.create(ch.name, customErrorData));
        };
        this._channels.set(name, channel);
        return channel;
    }
    destroyNetworkChannel(name) {
        const channel = this._channels.get(name);
        if (!channel)
            return false;
        channel.close();
        this._channels.delete(name);
        return true;
    }
    sendPacket(channelName, packet) {
        const channel = this._channels.get(channelName);
        if (!channel)
            return false;
        return channel.send(packet);
    }
    // ── HTTP ──────────────────────────────────────────────────────────────
    sendRequest(url, params = {}, onSuccess, onFailure, userData) {
        this.sendRequestAsync(url, params).then(res => {
            onSuccess?.(res, userData);
        }).catch((err) => {
            onFailure?.(url, err.message, userData);
        });
    }
    async sendRequestAsync(url, params = {}) {
        const { method = 'GET', headers = {}, body, timeout = 10000 } = params;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        const init = { method, headers, signal: controller.signal };
        if (body !== undefined) {
            if (typeof body === 'string') {
                init.body = body;
            }
            else {
                init.body = JSON.stringify(body);
                init.headers['Content-Type'] =
                    init.headers['Content-Type'] ?? 'application/json';
            }
        }
        try {
            const response = await fetch(url, init);
            clearTimeout(timer);
            const data = await response.text();
            const respHeaders = {};
            response.headers.forEach((value, key) => { respHeaders[key] = value; });
            return { statusCode: response.status, headers: respHeaders, data };
        }
        catch (err) {
            clearTimeout(timer);
            throw err;
        }
    }
    update(elapseSeconds, _realElapseSeconds) {
        this._channels.forEach(ch => ch.update(elapseSeconds));
    }
    shutdown() {
        this._channels.forEach(ch => ch.close());
        this._channels.clear();
    }
}

/** 网络消息包基类，对应原版 GameFramework.Network.Packet */
class Packet extends BaseEventArgs {
}

/** 网络服务类型，对应原版 ServiceType 枚举 */
var ServiceType;
(function (ServiceType) {
    /** TCP 服务 */
    ServiceType[ServiceType["Tcp"] = 0] = "Tcp";
    /** 同步接收 TCP 服务 */
    ServiceType[ServiceType["TcpWithSyncReceive"] = 1] = "TcpWithSyncReceive";
    /** WebSocket 服务 */
    ServiceType[ServiceType["WebSocket"] = 2] = "WebSocket";
})(ServiceType || (ServiceType = {}));

class ObjectBase {
    constructor() {
        this._name = '';
        this._target = null;
        this._locked = false;
        this._priority = 0;
        this._lastUseTime = 0;
    }
    get name() { return this._name; }
    get target() { return this._target; }
    get locked() { return this._locked; }
    set locked(value) { this._locked = value; }
    get priority() { return this._priority; }
    set priority(value) { this._priority = value; }
    get lastUseTime() { return this._lastUseTime; }
    /** 自定义是否可释放标志，子类可覆盖以阻止特定对象被自动释放 */
    get customCanReleaseFlag() { return true; }
    initialize(nameOrTarget, target, lockedOrPriority, priority) {
        let name;
        let tgt;
        let locked = false;
        let prio = 0;
        if (typeof nameOrTarget !== 'string') {
            // initialize(target)
            name = '';
            tgt = nameOrTarget;
        }
        else if (target === undefined) {
            name = nameOrTarget;
            tgt = null;
        }
        else {
            name = nameOrTarget;
            tgt = target;
            if (typeof lockedOrPriority === 'boolean') {
                locked = lockedOrPriority;
                prio = priority ?? 0;
            }
            else if (typeof lockedOrPriority === 'number') {
                prio = lockedOrPriority;
            }
        }
        if (tgt == null) {
            throw new Error(`Target '${name}' is invalid.`);
        }
        this._name = name;
        this._target = tgt;
        this._locked = locked;
        this._priority = prio;
        this._lastUseTime = Date.now();
    }
    /** 由 ObjectPool 内部更新最后使用时间 */
    _updateLastUseTime() {
        this._lastUseTime = Date.now();
    }
    clear() {
        this._name = '';
        this._target = null;
        this._locked = false;
        this._priority = 0;
        this._lastUseTime = 0;
    }
    onSpawn() { }
    onUnspawn() { }
}

class ObjectInfo {
    constructor(name, locked, customCanReleaseFlag, priority, lastUseTime, spawnCount) {
        this._name = name;
        this._locked = locked;
        this._customCanReleaseFlag = customCanReleaseFlag;
        this._priority = priority;
        this._lastUseTime = lastUseTime;
        this._spawnCount = spawnCount;
    }
    get name() { return this._name; }
    get locked() { return this._locked; }
    get customCanReleaseFlag() { return this._customCanReleaseFlag; }
    get priority() { return this._priority; }
    get lastUseTime() { return this._lastUseTime; }
    get isInUse() { return this._spawnCount > 0; }
    get spawnCount() { return this._spawnCount; }
}

class ObjectPool {
    constructor(name, objectType, allowMultiSpawn = false, autoReleaseInterval = 60, capacity = Infinity, expireTime = 0, priority = 0) {
        this._items = [];
        this._autoReleaseTimer = 0;
        this._name = name;
        this._objectType = objectType;
        this._allowMultiSpawn = allowMultiSpawn;
        this._autoReleaseInterval = autoReleaseInterval;
        this._capacity = capacity;
        this._expireTime = expireTime;
        this._priority = priority;
    }
    get name() { return this._name; }
    get fullName() { return `${this._objectType.name}.${this._name}`; }
    get objectType() { return this._objectType; }
    get count() { return this._items.length; }
    get allowMultiSpawn() { return this._allowMultiSpawn; }
    get canReleaseCount() {
        return this._items.filter(i => i.spawnCount === 0 && !i.obj.locked && i.obj.customCanReleaseFlag).length;
    }
    get autoReleaseInterval() { return this._autoReleaseInterval; }
    set autoReleaseInterval(v) { this._autoReleaseInterval = v; }
    get capacity() { return this._capacity; }
    set capacity(v) {
        this._capacity = v;
        this.release();
    }
    get expireTime() { return this._expireTime; }
    set expireTime(v) {
        this._expireTime = v;
        this.release();
    }
    get priority() { return this._priority; }
    set priority(v) { this._priority = v; }
    register(obj, spawned) {
        if (obj == null) {
            throw new GameFrameworkError('Object is invalid.');
        }
        const item = { obj, spawnCount: spawned ? 1 : 0 };
        this._items.push(item);
        if (!spawned && this._items.length > this._capacity) {
            this.release();
        }
    }
    canSpawn(name) {
        if (name === undefined) {
            return this._items.some(i => (this._allowMultiSpawn || i.spawnCount === 0) && !i.obj.locked);
        }
        return this._items.some(i => i.obj.name === name && (this._allowMultiSpawn || i.spawnCount === 0) && !i.obj.locked);
    }
    spawn(name) {
        const n = name ?? '';
        const item = this._items.find(i => i.obj.name === n && (this._allowMultiSpawn || i.spawnCount === 0) && !i.obj.locked);
        if (!item)
            return null;
        item.spawnCount++;
        item.obj._updateLastUseTime();
        item.obj.onSpawn();
        return item.obj;
    }
    unspawn(objOrTarget) {
        const item = this._findItem(objOrTarget);
        if (!item) {
            throw new GameFrameworkError('Can not find target in object pool.');
        }
        item.obj.onUnspawn();
        item.obj._updateLastUseTime();
        item.spawnCount--;
        if (item.spawnCount < 0)
            item.spawnCount = 0;
        if (this._items.length > this._capacity) {
            this.release();
        }
    }
    setLocked(objOrTarget, locked) {
        const item = this._findItem(objOrTarget);
        if (!item) {
            throw new GameFrameworkError('Can not find target in object pool.');
        }
        item.obj.locked = locked;
    }
    setPriority(objOrTarget, priority) {
        const item = this._findItem(objOrTarget);
        if (!item) {
            throw new GameFrameworkError('Can not find target in object pool.');
        }
        item.obj.priority = priority;
    }
    releaseObject(objOrTarget) {
        const item = this._findItem(objOrTarget);
        if (!item || item.spawnCount > 0 || item.obj.locked || !item.obj.customCanReleaseFlag) {
            return false;
        }
        item.obj.release(false);
        this._items.splice(this._items.indexOf(item), 1);
        return true;
    }
    release(toReleaseCountOrFilter, releaseObjectFilterCallback) {
        let toReleaseCount;
        let filter;
        if (typeof toReleaseCountOrFilter === 'number') {
            toReleaseCount = toReleaseCountOrFilter;
            filter = releaseObjectFilterCallback ?? this._defaultReleaseFilter.bind(this);
        }
        else if (typeof toReleaseCountOrFilter === 'function') {
            toReleaseCount = this._items.length - this._capacity;
            filter = toReleaseCountOrFilter;
        }
        else {
            toReleaseCount = this._items.length - this._capacity;
            filter = this._defaultReleaseFilter.bind(this);
        }
        if (toReleaseCount <= 0)
            return;
        const candidates = this._items.filter(i => i.spawnCount === 0 && !i.obj.locked && i.obj.customCanReleaseFlag).map(i => i.obj);
        if (candidates.length === 0)
            return;
        const expireTime = this._expireTime > 0 ? Date.now() - this._expireTime * 1000 : 0;
        const toRelease = filter(candidates, toReleaseCount, expireTime);
        for (const obj of toRelease) {
            const idx = this._items.findIndex(i => i.obj === obj);
            if (idx >= 0) {
                obj.release(false);
                this._items.splice(idx, 1);
            }
        }
    }
    releaseAllUnused() {
        const now = Date.now();
        const expireMs = this._expireTime > 0 ? this._expireTime * 1000 : 0;
        const toRelease = this._items.filter(i => {
            if (i.spawnCount > 0 || i.obj.locked || !i.obj.customCanReleaseFlag)
                return false;
            if (expireMs > 0 && (now - i.obj.lastUseTime) < expireMs)
                return false;
            return true;
        });
        for (const item of toRelease) {
            item.obj.release(false);
            this._items.splice(this._items.indexOf(item), 1);
        }
    }
    getAllObjectInfos() {
        return this._items.map(i => new ObjectInfo(i.obj.name, i.obj.locked, i.obj.customCanReleaseFlag, i.obj.priority, i.obj.lastUseTime, i.spawnCount));
    }
    update(elapseSeconds, _realElapseSeconds) {
        this._autoReleaseTimer += elapseSeconds;
        if (this._autoReleaseTimer >= this._autoReleaseInterval) {
            this._autoReleaseTimer = 0;
            this.release();
        }
    }
    shutdown() {
        for (const item of this._items) {
            item.obj.release(true);
        }
        this._items.length = 0;
    }
    _findItem(objOrTarget) {
        if (objOrTarget instanceof ObjectBase) {
            return this._items.find(i => i.obj === objOrTarget);
        }
        return this._items.find(i => i.obj.target === objOrTarget);
    }
    _defaultReleaseFilter(candidates, toReleaseCount, expireTime) {
        const result = [];
        // 先收集过期的
        const expired = expireTime > 0 ? candidates.filter(o => o.lastUseTime <= expireTime) : [];
        for (const o of expired) {
            if (result.length >= toReleaseCount)
                break;
            result.push(o);
        }
        if (result.length >= toReleaseCount)
            return result;
        // 剩余按优先级升序、最后使用时间升序排序
        const remaining = candidates.filter(o => !result.includes(o));
        remaining.sort((a, b) => a.priority !== b.priority ? a.priority - b.priority : a.lastUseTime - b.lastUseTime);
        for (const o of remaining) {
            if (result.length >= toReleaseCount)
                break;
            result.push(o);
        }
        return result;
    }
}

class ObjectPoolManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._pools = new Map();
    }
    get priority() { return 55; }
    get count() { return this._pools.size; }
    _makeKey(objectType, name = '') {
        return `${objectType.name}.${name}`;
    }
    hasObjectPool(objectType, name = '') {
        return this._pools.has(this._makeKey(objectType, name));
    }
    getObjectPool(objectType, name = '') {
        return this._pools.get(this._makeKey(objectType, name)) ?? null;
    }
    getAllObjectPools(sort = false) {
        const pools = Array.from(this._pools.values());
        if (sort) {
            pools.sort((a, b) => b.priority - a.priority);
        }
        return pools;
    }
    createSingleSpawnObjectPool(objectType, name = '', autoReleaseInterval = 60, capacity = Infinity, expireTime = 0, priority = 0) {
        return this._createObjectPool(objectType, false, name, autoReleaseInterval, capacity, expireTime, priority);
    }
    createMultiSpawnObjectPool(objectType, name = '', autoReleaseInterval = 60, capacity = Infinity, expireTime = 0, priority = 0) {
        return this._createObjectPool(objectType, true, name, autoReleaseInterval, capacity, expireTime, priority);
    }
    _createObjectPool(objectType, allowMultiSpawn, name, autoReleaseInterval, capacity, expireTime, priority) {
        const key = this._makeKey(objectType, name);
        if (this._pools.has(key)) {
            throw new GameFrameworkError(`Object pool '${key}' already exists.`);
        }
        const pool = new ObjectPool(name, objectType, allowMultiSpawn, autoReleaseInterval, capacity, expireTime, priority);
        this._pools.set(key, pool);
        return pool;
    }
    destroyObjectPool(objectType, name = '') {
        const key = this._makeKey(objectType, name);
        const pool = this._pools.get(key);
        if (!pool)
            return false;
        pool.shutdown();
        this._pools.delete(key);
        return true;
    }
    release() {
        this._pools.forEach(pool => pool.release());
    }
    releaseAllUnused() {
        this._pools.forEach(pool => pool.releaseAllUnused());
    }
    update(elapseSeconds, realElapseSeconds) {
        this._pools.forEach(pool => pool.update(elapseSeconds, realElapseSeconds));
    }
    shutdown() {
        this._pools.forEach(pool => pool.shutdown());
        this._pools.clear();
    }
}

class ProcedureBase extends FsmState {
}

class ProcedureManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._procedureFsm = null;
    }
    get priority() { return -2; }
    get currentProcedure() {
        if (!this._procedureFsm)
            return null;
        return this._procedureFsm.currentState;
    }
    get currentProcedureTime() {
        return this._procedureFsm?.currentStateTime ?? 0;
    }
    initialize(fsmManager, procedures) {
        if (!fsmManager) {
            throw new GameFrameworkError('FSM manager is invalid.');
        }
        if (!procedures || procedures.length === 0) {
            throw new GameFrameworkError('Procedures is invalid.');
        }
        this._procedureFsm = fsmManager.createFsm('GameProcedure', this, procedures);
    }
    startProcedure(ctor) {
        if (!this._procedureFsm) {
            throw new GameFrameworkError('You must initialize procedure first.');
        }
        this._procedureFsm.start(ctor);
    }
    startProcedureByType(procedureType) {
        if (!this._procedureFsm) {
            throw new GameFrameworkError('You must initialize procedure first.');
        }
        const state = this._procedureFsm.getAllStates().find(s => s.constructor === procedureType);
        if (!state) {
            throw new GameFrameworkError(`Procedure type '${procedureType.name}' is invalid.`);
        }
        this._procedureFsm.changeState(state.constructor);
    }
    hasProcedure(ctor) {
        return this._procedureFsm?.hasState(ctor) ?? false;
    }
    hasProcedureByType(procedureType) {
        if (!this._procedureFsm)
            return false;
        return this._procedureFsm.getAllStates().some(s => s.constructor === procedureType);
    }
    getProcedure(ctor) {
        return this._procedureFsm?.getState(ctor) ?? null;
    }
    getProcedureByType(procedureType) {
        if (!this._procedureFsm)
            return null;
        return this._procedureFsm.getAllStates().find(s => s.constructor === procedureType) ?? null;
    }
    update(elapseSeconds, realElapseSeconds) { }
    shutdown() {
        this._procedureFsm = null;
    }
}

/** 资源存在状态（对应 Unity HasAssetResult 枚举） */
var HasAssetResult;
(function (HasAssetResult) {
    /** 资源不存在 */
    HasAssetResult[HasAssetResult["NotExist"] = 0] = "NotExist";
    /** 资源已在 Bundle 缓存中（可直接获取） */
    HasAssetResult[HasAssetResult["Loaded"] = 1] = "Loaded";
    /** 资源所属 Bundle 已加载，但资源本身尚未加载 */
    HasAssetResult[HasAssetResult["InBundle"] = 2] = "InBundle";
    /** Bundle 未加载，资源无法访问 */
    HasAssetResult[HasAssetResult["BundleNotLoaded"] = 3] = "BundleNotLoaded";
})(HasAssetResult || (HasAssetResult = {}));

// ─── 热更新事件 ──────────────────────────────────────────────────────────────
class ResourceUpdateStartEventArgs extends BaseEventArgs {
    get id() { return ResourceUpdateStartEventArgs.eventId; }
    static create(name, downloadPath, downloadUri, currentLength, compressedLength, length) {
        const e = ReferencePool.acquire(ResourceUpdateStartEventArgs);
        e.name = name;
        e.downloadPath = downloadPath;
        e.downloadUri = downloadUri;
        e.currentLength = currentLength;
        e.compressedLength = compressedLength;
        e.length = length;
        return e;
    }
    clear() {
        this.name = '';
        this.downloadPath = '';
        this.downloadUri = '';
        this.currentLength = 0;
        this.compressedLength = 0;
        this.length = 0;
    }
}
ResourceUpdateStartEventArgs.eventId = 'resource.update.start';
class ResourceUpdateChangedEventArgs extends BaseEventArgs {
    get id() { return ResourceUpdateChangedEventArgs.eventId; }
    static create(name, downloadPath, downloadUri, currentLength, compressedLength, length) {
        const e = ReferencePool.acquire(ResourceUpdateChangedEventArgs);
        e.name = name;
        e.downloadPath = downloadPath;
        e.downloadUri = downloadUri;
        e.currentLength = currentLength;
        e.compressedLength = compressedLength;
        e.length = length;
        return e;
    }
    clear() {
        this.name = '';
        this.downloadPath = '';
        this.downloadUri = '';
        this.currentLength = 0;
        this.compressedLength = 0;
        this.length = 0;
    }
}
ResourceUpdateChangedEventArgs.eventId = 'resource.update.changed';
class ResourceUpdateSuccessEventArgs extends BaseEventArgs {
    get id() { return ResourceUpdateSuccessEventArgs.eventId; }
    static create(name, downloadPath, downloadUri, length, compressedLength) {
        const e = ReferencePool.acquire(ResourceUpdateSuccessEventArgs);
        e.name = name;
        e.downloadPath = downloadPath;
        e.downloadUri = downloadUri;
        e.length = length;
        e.compressedLength = compressedLength;
        return e;
    }
    clear() {
        this.name = '';
        this.downloadPath = '';
        this.downloadUri = '';
        this.length = 0;
        this.compressedLength = 0;
    }
}
ResourceUpdateSuccessEventArgs.eventId = 'resource.update.success';
class ResourceUpdateFailureEventArgs extends BaseEventArgs {
    get id() { return ResourceUpdateFailureEventArgs.eventId; }
    static create(name, downloadUri, retryCount, totalRetryCount, errorMessage) {
        const e = ReferencePool.acquire(ResourceUpdateFailureEventArgs);
        e.name = name;
        e.downloadUri = downloadUri;
        e.retryCount = retryCount;
        e.totalRetryCount = totalRetryCount;
        e.errorMessage = errorMessage;
        return e;
    }
    clear() {
        this.name = '';
        this.downloadUri = '';
        this.retryCount = 0;
        this.totalRetryCount = 0;
        this.errorMessage = '';
    }
}
ResourceUpdateFailureEventArgs.eventId = 'resource.update.failure';
class ResourceUpdateAllCompleteEventArgs extends BaseEventArgs {
    get id() { return ResourceUpdateAllCompleteEventArgs.eventId; }
    static create() {
        return ReferencePool.acquire(ResourceUpdateAllCompleteEventArgs);
    }
    clear() { }
}
ResourceUpdateAllCompleteEventArgs.eventId = 'resource.update.allComplete';
// ─── 场景事件 ────────────────────────────────────────────────────────────────
class ResourceLoadSceneSuccessEventArgs extends BaseEventArgs {
    get id() { return ResourceLoadSceneSuccessEventArgs.eventId; }
    static create(sceneAssetName, duration, userData) {
        const e = ReferencePool.acquire(ResourceLoadSceneSuccessEventArgs);
        e.sceneAssetName = sceneAssetName;
        e.duration = duration;
        e.userData = userData;
        return e;
    }
    clear() { this.sceneAssetName = ''; this.duration = 0; this.userData = undefined; }
}
ResourceLoadSceneSuccessEventArgs.eventId = 'resource.scene.loadSuccess';
class ResourceLoadSceneFailureEventArgs extends BaseEventArgs {
    get id() { return ResourceLoadSceneFailureEventArgs.eventId; }
    static create(sceneAssetName, errorMessage, userData) {
        const e = ReferencePool.acquire(ResourceLoadSceneFailureEventArgs);
        e.sceneAssetName = sceneAssetName;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }
    clear() { this.sceneAssetName = ''; this.errorMessage = ''; this.userData = undefined; }
}
ResourceLoadSceneFailureEventArgs.eventId = 'resource.scene.loadFailure';
class ResourceUnloadSceneSuccessEventArgs extends BaseEventArgs {
    get id() { return ResourceUnloadSceneSuccessEventArgs.eventId; }
    static create(sceneAssetName, userData) {
        const e = ReferencePool.acquire(ResourceUnloadSceneSuccessEventArgs);
        e.sceneAssetName = sceneAssetName;
        e.userData = userData;
        return e;
    }
    clear() { this.sceneAssetName = ''; this.userData = undefined; }
}
ResourceUnloadSceneSuccessEventArgs.eventId = 'resource.scene.unloadSuccess';
class ResourceUnloadSceneFailureEventArgs extends BaseEventArgs {
    get id() { return ResourceUnloadSceneFailureEventArgs.eventId; }
    static create(sceneAssetName, userData) {
        const e = ReferencePool.acquire(ResourceUnloadSceneFailureEventArgs);
        e.sceneAssetName = sceneAssetName;
        e.userData = userData;
        return e;
    }
    clear() { this.sceneAssetName = ''; this.userData = undefined; }
}
ResourceUnloadSceneFailureEventArgs.eventId = 'resource.scene.unloadFailure';
// ─── Verify 校验事件 ─────────────────────────────────────────────────────────
class ResourceVerifyStartEventArgs extends BaseEventArgs {
    get id() { return ResourceVerifyStartEventArgs.eventId; }
    static create(count, totalLength) {
        const e = ReferencePool.acquire(ResourceVerifyStartEventArgs);
        e.count = count;
        e.totalLength = totalLength;
        return e;
    }
    clear() { this.count = 0; this.totalLength = 0; }
}
ResourceVerifyStartEventArgs.eventId = 'resource.verify.start';
class ResourceVerifySuccessEventArgs extends BaseEventArgs {
    get id() { return ResourceVerifySuccessEventArgs.eventId; }
    static create(name, length) {
        const e = ReferencePool.acquire(ResourceVerifySuccessEventArgs);
        e.name = name;
        e.length = length;
        return e;
    }
    clear() { this.name = ''; this.length = 0; }
}
ResourceVerifySuccessEventArgs.eventId = 'resource.verify.success';
class ResourceVerifyFailureEventArgs extends BaseEventArgs {
    get id() { return ResourceVerifyFailureEventArgs.eventId; }
    static create(name) {
        const e = ReferencePool.acquire(ResourceVerifyFailureEventArgs);
        e.name = name;
        return e;
    }
    clear() { this.name = ''; }
}
ResourceVerifyFailureEventArgs.eventId = 'resource.verify.failure';
// ─── Apply 应用事件 ───────────────────────────────────────────────────────────
class ResourceApplyStartEventArgs extends BaseEventArgs {
    get id() { return ResourceApplyStartEventArgs.eventId; }
    static create(resourcePackPath, count, totalCompressedLength, totalLength) {
        const e = ReferencePool.acquire(ResourceApplyStartEventArgs);
        e.resourcePackPath = resourcePackPath;
        e.count = count;
        e.totalCompressedLength = totalCompressedLength;
        e.totalLength = totalLength;
        return e;
    }
    clear() { this.resourcePackPath = ''; this.count = 0; this.totalCompressedLength = 0; this.totalLength = 0; }
}
ResourceApplyStartEventArgs.eventId = 'resource.apply.start';
class ResourceApplySuccessEventArgs extends BaseEventArgs {
    get id() { return ResourceApplySuccessEventArgs.eventId; }
    static create(name, applyPath, resourcePackPath, compressedLength, length) {
        const e = ReferencePool.acquire(ResourceApplySuccessEventArgs);
        e.name = name;
        e.applyPath = applyPath;
        e.resourcePackPath = resourcePackPath;
        e.compressedLength = compressedLength;
        e.length = length;
        return e;
    }
    clear() { this.name = ''; this.applyPath = ''; this.resourcePackPath = ''; this.compressedLength = 0; this.length = 0; }
}
ResourceApplySuccessEventArgs.eventId = 'resource.apply.success';
class ResourceApplyFailureEventArgs extends BaseEventArgs {
    get id() { return ResourceApplyFailureEventArgs.eventId; }
    static create(name, resourcePackPath, errorMessage) {
        const e = ReferencePool.acquire(ResourceApplyFailureEventArgs);
        e.name = name;
        e.resourcePackPath = resourcePackPath;
        e.errorMessage = errorMessage;
        return e;
    }
    clear() { this.name = ''; this.resourcePackPath = ''; this.errorMessage = ''; }
}
ResourceApplyFailureEventArgs.eventId = 'resource.apply.failure';
// ─── 资产加载事件 ────────────────────────────────────────────────────────────
class LoadAssetSuccessEventArgs extends BaseEventArgs {
    get id() { return LoadAssetSuccessEventArgs.eventId; }
    static create(assetName, asset, duration, userData) {
        const e = ReferencePool.acquire(LoadAssetSuccessEventArgs);
        e.assetName = assetName;
        e.asset = asset;
        e.duration = duration;
        e.userData = userData;
        return e;
    }
    clear() { this.assetName = ''; this.asset = {}; this.duration = 0; this.userData = undefined; }
}
LoadAssetSuccessEventArgs.eventId = 'resource.asset.loadSuccess';
class LoadAssetFailureEventArgs extends BaseEventArgs {
    get id() { return LoadAssetFailureEventArgs.eventId; }
    static create(assetName, errorMessage, userData) {
        const e = ReferencePool.acquire(LoadAssetFailureEventArgs);
        e.assetName = assetName;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }
    clear() { this.assetName = ''; this.errorMessage = ''; this.userData = undefined; }
}
LoadAssetFailureEventArgs.eventId = 'resource.asset.loadFailure';

class LoadSceneSuccessEventArgs extends BaseEventArgs {
    get id() { return LoadSceneSuccessEventArgs.eventId; }
    static create(sceneName, duration, userData) {
        const e = ReferencePool.acquire(LoadSceneSuccessEventArgs);
        e.sceneName = sceneName;
        e.duration = duration;
        e.userData = userData;
        return e;
    }
    clear() {
        this.sceneName = '';
        this.duration = 0;
        this.userData = undefined;
    }
}
LoadSceneSuccessEventArgs.eventId = 'scene.load.success';
class LoadSceneFailureEventArgs extends BaseEventArgs {
    get id() { return LoadSceneFailureEventArgs.eventId; }
    static create(sceneName, errorMessage, userData) {
        const e = ReferencePool.acquire(LoadSceneFailureEventArgs);
        e.sceneName = sceneName;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }
    clear() {
        this.sceneName = '';
        this.errorMessage = '';
        this.userData = undefined;
    }
}
LoadSceneFailureEventArgs.eventId = 'scene.load.failure';
class LoadSceneUpdateEventArgs extends BaseEventArgs {
    get id() { return LoadSceneUpdateEventArgs.eventId; }
    static create(sceneName, progress, userData) {
        const e = ReferencePool.acquire(LoadSceneUpdateEventArgs);
        e.sceneName = sceneName;
        e.progress = progress;
        e.userData = userData;
        return e;
    }
    clear() {
        this.sceneName = '';
        this.progress = 0;
        this.userData = undefined;
    }
}
LoadSceneUpdateEventArgs.eventId = 'scene.load.update';
class UnloadSceneSuccessEventArgs extends BaseEventArgs {
    get id() { return UnloadSceneSuccessEventArgs.eventId; }
    static create(sceneName, userData) {
        const e = ReferencePool.acquire(UnloadSceneSuccessEventArgs);
        e.sceneName = sceneName;
        e.userData = userData;
        return e;
    }
    clear() {
        this.sceneName = '';
        this.userData = undefined;
    }
}
UnloadSceneSuccessEventArgs.eventId = 'scene.unload.success';
class UnloadSceneFailureEventArgs extends BaseEventArgs {
    get id() { return UnloadSceneFailureEventArgs.eventId; }
    static create(sceneName, userData) {
        const e = ReferencePool.acquire(UnloadSceneFailureEventArgs);
        e.sceneName = sceneName;
        e.userData = userData;
        return e;
    }
    clear() {
        this.sceneName = '';
        this.userData = undefined;
    }
}
UnloadSceneFailureEventArgs.eventId = 'scene.unload.failure';
class ActiveSceneChangedEventArgs extends BaseEventArgs {
    get id() { return ActiveSceneChangedEventArgs.eventId; }
    static create(lastActiveScene, activeScene) {
        const e = ReferencePool.acquire(ActiveSceneChangedEventArgs);
        e.lastActiveScene = lastActiveScene;
        e.activeScene = activeScene;
        return e;
    }
    clear() {
        this.lastActiveScene = '';
        this.activeScene = '';
    }
}
ActiveSceneChangedEventArgs.eventId = 'scene.active.changed';

class SceneManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._loadedScenes = new Set();
        this._loadingScenes = new Set();
        this._unloadingScenes = new Set();
        this._sceneOrder = new Map();
        this._activeScene = '';
        this._eventManager = null;
    }
    get priority() { return 2; }
    get loadedSceneCount() { return this._loadedScenes.size; }
    get activeScene() { return this._activeScene; }
    setEventManager(eventManager) {
        this._eventManager = eventManager;
    }
    hasScene(sceneName) {
        return this._loadedScenes.has(sceneName)
            || this._loadingScenes.has(sceneName)
            || this._unloadingScenes.has(sceneName);
    }
    loadScene(sceneName, priority = 0, onLoaded, onFailure, userData) {
        if (this._loadingScenes.has(sceneName) || this._unloadingScenes.has(sceneName))
            return;
        this._loadingScenes.add(sceneName);
        this._sceneOrder.set(sceneName, 0);
        const startTime = Date.now();
        this._doLoadScene(sceneName, priority, (name, progress) => {
            if (progress < 1) {
                this._eventManager?.fire(this, LoadSceneUpdateEventArgs.create(name, progress, userData));
            }
            else {
                this._loadingScenes.delete(name);
                this._loadedScenes.add(name);
                this._refreshSceneOrder();
                const duration = (Date.now() - startTime) / 1000;
                onLoaded?.(name, duration, userData);
                this._eventManager?.fire(this, LoadSceneSuccessEventArgs.create(name, duration, userData));
            }
        }, (name, msg) => {
            this._loadingScenes.delete(name);
            this._sceneOrder.delete(name);
            onFailure?.(name, msg, userData);
            this._eventManager?.fire(this, LoadSceneFailureEventArgs.create(name, msg, userData));
        });
    }
    unloadScene(sceneName, onUnloaded, userData) {
        if (!this._loadedScenes.has(sceneName) || this._unloadingScenes.has(sceneName))
            return;
        this._unloadingScenes.add(sceneName);
        this._sceneOrder.delete(sceneName);
        this._doUnloadScene(sceneName, (name) => {
            this._unloadingScenes.delete(name);
            this._loadedScenes.delete(name);
            this._refreshSceneOrder();
            onUnloaded?.(name, userData);
            this._eventManager?.fire(this, UnloadSceneSuccessEventArgs.create(name, userData));
        }, (name) => {
            this._unloadingScenes.delete(name);
            this._eventManager?.fire(this, UnloadSceneFailureEventArgs.create(name, userData));
        });
    }
    setSceneOrder(sceneName, sceneOrder) {
        if (this._loadingScenes.has(sceneName)) {
            this._sceneOrder.set(sceneName, sceneOrder);
            return;
        }
        if (this._loadedScenes.has(sceneName)) {
            this._sceneOrder.set(sceneName, sceneOrder);
            this._refreshSceneOrder();
            return;
        }
    }
    getSceneOrder(sceneName) {
        return this._sceneOrder.get(sceneName) ?? 0;
    }
    sceneIsLoaded(sceneName) { return this._loadedScenes.has(sceneName); }
    sceneIsLoading(sceneName) { return this._loadingScenes.has(sceneName); }
    sceneIsUnloading(sceneName) { return this._unloadingScenes.has(sceneName); }
    getLoadedSceneNames() { return Array.from(this._loadedScenes); }
    getLoadingSceneNames() { return Array.from(this._loadingScenes); }
    getUnloadingSceneNames() { return Array.from(this._unloadingScenes); }
    _refreshSceneOrder() {
        let maxName = '';
        let maxOrder = -Infinity;
        for (const [name, order] of this._sceneOrder) {
            if (this._loadingScenes.has(name))
                continue;
            if (order > maxOrder) {
                maxOrder = order;
                maxName = name;
            }
        }
        const newActive = maxName;
        if (newActive !== this._activeScene) {
            const last = this._activeScene;
            this._activeScene = newActive;
            this._doSetActiveScene(newActive);
            this._eventManager?.fire(this, ActiveSceneChangedEventArgs.create(last, newActive));
        }
    }
    _doSetActiveScene(_sceneName) { }
    update(_e, _r) { }
    shutdown() {
        this._loadedScenes.clear();
        this._loadingScenes.clear();
        this._unloadingScenes.clear();
        this._sceneOrder.clear();
        this._activeScene = '';
        this._eventManager = null;
    }
}

class SettingManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._helper = null;
    }
    get priority() { return 70; }
    get count() {
        this._checkHelper();
        return this._helper.count;
    }
    setSettingHelper(settingHelper) {
        if (!settingHelper) {
            throw new GameFrameworkError('Setting helper is invalid.');
        }
        this._helper = settingHelper;
    }
    load() {
        this._checkHelper();
        return this._helper.load();
    }
    save() {
        this._checkHelper();
        return this._helper.save();
    }
    getAllSettingNames() {
        this._checkHelper();
        return this._helper.getAllSettingNames();
    }
    hasKey(settingName) {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper.hasKey(settingName);
    }
    removeKey(settingName) {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper.removeKey(settingName);
    }
    removeAllSettings() {
        this._checkHelper();
        this._helper.removeAllSettings();
    }
    getBool(settingName, defaultValue = false) {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper.getBool(settingName, defaultValue);
    }
    setBool(settingName, value) {
        this._checkHelper();
        this._checkName(settingName);
        this._helper.setBool(settingName, value);
    }
    getInt(settingName, defaultValue = 0) {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper.getInt(settingName, defaultValue);
    }
    setInt(settingName, value) {
        this._checkHelper();
        this._checkName(settingName);
        this._helper.setInt(settingName, value);
    }
    getFloat(settingName, defaultValue = 0) {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper.getFloat(settingName, defaultValue);
    }
    setFloat(settingName, value) {
        this._checkHelper();
        this._checkName(settingName);
        this._helper.setFloat(settingName, value);
    }
    getString(settingName, defaultValue = '') {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper.getString(settingName, defaultValue);
    }
    setString(settingName, value) {
        this._checkHelper();
        this._checkName(settingName);
        this._helper.setString(settingName, value);
    }
    getObject(settingName, defaultValue = null) {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper.getObject(settingName, defaultValue);
    }
    setObject(settingName, obj) {
        this._checkHelper();
        this._checkName(settingName);
        this._helper.setObject(settingName, obj);
    }
    update(_elapseSeconds, _realElapseSeconds) { }
    shutdown() {
        if (this._helper) {
            this._helper.save();
        }
    }
    _checkHelper() {
        if (!this._helper) {
            throw new GameFrameworkError('Setting helper is invalid.');
        }
    }
    _checkName(settingName) {
        if (!settingName) {
            throw new GameFrameworkError('Setting name is invalid.');
        }
    }
}

class PlaySoundDependencyAssetEventArgs extends BaseEventArgs {
    constructor() {
        super(...arguments);
        this.serialId = 0;
        this.soundAssetName = '';
        this.soundGroupName = '';
        this.playSoundParams = null;
        this.dependencyAssetName = '';
        this.loadedCount = 0;
        this.totalCount = 0;
        this.userData = null;
    }
    get id() { return PlaySoundDependencyAssetEventArgs.EVENT_ID; }
    static create(serialId, soundAssetName, soundGroupName, playSoundParams, dependencyAssetName, loadedCount, totalCount, userData) {
        const e = ReferencePool.acquire(PlaySoundDependencyAssetEventArgs);
        e.serialId = serialId;
        e.soundAssetName = soundAssetName;
        e.soundGroupName = soundGroupName;
        e.playSoundParams = playSoundParams;
        e.dependencyAssetName = dependencyAssetName;
        e.loadedCount = loadedCount;
        e.totalCount = totalCount;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.soundAssetName = '';
        this.soundGroupName = '';
        this.playSoundParams = null;
        this.dependencyAssetName = '';
        this.loadedCount = 0;
        this.totalCount = 0;
        this.userData = null;
    }
}
PlaySoundDependencyAssetEventArgs.EVENT_ID = 'Sound.PlaySoundDependencyAsset';

var PlaySoundErrorCode;
(function (PlaySoundErrorCode) {
    PlaySoundErrorCode[PlaySoundErrorCode["Unknown"] = 0] = "Unknown";
    PlaySoundErrorCode[PlaySoundErrorCode["SoundGroupNotExist"] = 1] = "SoundGroupNotExist";
    PlaySoundErrorCode[PlaySoundErrorCode["SoundGroupHasNoAgent"] = 2] = "SoundGroupHasNoAgent";
    PlaySoundErrorCode[PlaySoundErrorCode["LoadAssetFailure"] = 3] = "LoadAssetFailure";
    PlaySoundErrorCode[PlaySoundErrorCode["IgnoredDueToLowPriority"] = 4] = "IgnoredDueToLowPriority";
    PlaySoundErrorCode[PlaySoundErrorCode["SetSoundAssetFailure"] = 5] = "SetSoundAssetFailure";
})(PlaySoundErrorCode || (PlaySoundErrorCode = {}));

class PlaySoundFailureEventArgs extends BaseEventArgs {
    constructor() {
        super(...arguments);
        this.serialId = 0;
        this.soundAssetName = '';
        this.soundGroupName = '';
        this.playSoundParams = null;
        this.errorCode = PlaySoundErrorCode.Unknown;
        this.errorMessage = '';
        this.userData = null;
    }
    get id() { return PlaySoundFailureEventArgs.EVENT_ID; }
    static create(serialId, soundAssetName, soundGroupName, playSoundParams, errorCode, errorMessage, userData) {
        const e = ReferencePool.acquire(PlaySoundFailureEventArgs);
        e.serialId = serialId;
        e.soundAssetName = soundAssetName;
        e.soundGroupName = soundGroupName;
        e.playSoundParams = playSoundParams;
        e.errorCode = errorCode;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.soundAssetName = '';
        this.soundGroupName = '';
        this.playSoundParams = null;
        this.errorCode = PlaySoundErrorCode.Unknown;
        this.errorMessage = '';
        this.userData = null;
    }
}
PlaySoundFailureEventArgs.EVENT_ID = 'Sound.PlaySoundFailure';

class PlaySoundParams {
    constructor() {
        this._referenced = false;
        this.time = 0;
        this.muteInSoundGroup = false;
        this.loop = false;
        this.priority = 0;
        this.volumeInSoundGroup = 1.0;
        this.fadeInSeconds = 0;
        this.pitch = 1.0;
        this.panStereo = 0;
        this.spatialBlend = 0;
        this.maxDistance = 100;
        this.dopplerLevel = 1.0;
    }
    get referenced() { return this._referenced; }
    static create() {
        const p = ReferencePool.acquire(PlaySoundParams);
        p._referenced = true;
        return p;
    }
    clear() {
        this._referenced = false;
        this.time = 0;
        this.muteInSoundGroup = false;
        this.loop = false;
        this.priority = 0;
        this.volumeInSoundGroup = 1.0;
        this.fadeInSeconds = 0;
        this.pitch = 1.0;
        this.panStereo = 0;
        this.spatialBlend = 0;
        this.maxDistance = 100;
        this.dopplerLevel = 1.0;
    }
}

class PlaySoundSuccessEventArgs extends BaseEventArgs {
    constructor() {
        super(...arguments);
        this.serialId = 0;
        this.soundAssetName = '';
        this.soundAgent = null;
        this.duration = 0;
        this.userData = null;
    }
    get id() { return PlaySoundSuccessEventArgs.EVENT_ID; }
    static create(serialId, soundAssetName, soundAgent, duration, userData) {
        const e = ReferencePool.acquire(PlaySoundSuccessEventArgs);
        e.serialId = serialId;
        e.soundAssetName = soundAssetName;
        e.soundAgent = soundAgent;
        e.duration = duration;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.soundAssetName = '';
        this.soundAgent = null;
        this.duration = 0;
        this.userData = null;
    }
}
PlaySoundSuccessEventArgs.EVENT_ID = 'Sound.PlaySoundSuccess';

class PlaySoundUpdateEventArgs extends BaseEventArgs {
    constructor() {
        super(...arguments);
        this.serialId = 0;
        this.soundAssetName = '';
        this.soundGroupName = '';
        this.playSoundParams = null;
        this.progress = 0;
        this.userData = null;
    }
    get id() { return PlaySoundUpdateEventArgs.EVENT_ID; }
    static create(serialId, soundAssetName, soundGroupName, playSoundParams, progress, userData) {
        const e = ReferencePool.acquire(PlaySoundUpdateEventArgs);
        e.serialId = serialId;
        e.soundAssetName = soundAssetName;
        e.soundGroupName = soundGroupName;
        e.playSoundParams = playSoundParams;
        e.progress = progress;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.soundAssetName = '';
        this.soundGroupName = '';
        this.playSoundParams = null;
        this.progress = 0;
        this.userData = null;
    }
}
PlaySoundUpdateEventArgs.EVENT_ID = 'Sound.PlaySoundUpdate';

// ---------- PlaySoundInfo (pooled load-request token) ----------
class PlaySoundInfo {
    constructor() {
        this.serialId = 0;
        this.soundGroup = null;
        this.playSoundParams = null;
        this.userData = null;
    }
    static create(serialId, soundGroup, playSoundParams, userData) {
        const info = ReferencePool.acquire(PlaySoundInfo);
        info.serialId = serialId;
        info.soundGroup = soundGroup;
        info.playSoundParams = playSoundParams;
        info.userData = userData;
        return info;
    }
    clear() {
        this.serialId = 0;
        this.soundGroup = null;
        this.playSoundParams = null;
        this.userData = null;
    }
}
// ---------- SoundAgent ----------
class SoundAgent {
    constructor(soundGroup) {
        this._serialId = -1;
        this._soundAsset = null;
        this._muteInSoundGroup = false;
        this._volumeInSoundGroup = 1.0;
        this._priority = 0;
        this._loop = false;
        this._pitch = 1.0;
        this._panStereo = 0;
        this._spatialBlend = 0;
        this._maxDistance = 100;
        this._dopplerLevel = 1.0;
        this._setSoundAssetTime = -Infinity;
        this.soundGroup = soundGroup;
    }
    get serialId() { return this._serialId; }
    get soundAsset() { return this._soundAsset; }
    get isPlaying() { return this._doIsPlaying(); }
    get length() { return this._doGetLength(); }
    get time() { return this._doGetTime(); }
    set time(v) { this._doSetTime(v); }
    get mute() { return this.soundGroup.mute || this._muteInSoundGroup; }
    get muteInSoundGroup() { return this._muteInSoundGroup; }
    set muteInSoundGroup(v) {
        this._muteInSoundGroup = v;
        this._refreshMute();
    }
    get loop() { return this._loop; }
    set loop(v) {
        this._loop = v;
        this._doSetLoop(v);
    }
    get priority() { return this._priority; }
    set priority(v) { this._priority = v; }
    get volume() { return this.soundGroup.volume * this._volumeInSoundGroup; }
    get volumeInSoundGroup() { return this._volumeInSoundGroup; }
    set volumeInSoundGroup(v) {
        this._volumeInSoundGroup = v;
        this._refreshVolume();
    }
    get pitch() { return this._pitch; }
    set pitch(v) {
        this._pitch = v;
        this._doSetPitch(v);
    }
    get panStereo() { return this._panStereo; }
    set panStereo(v) {
        this._panStereo = v;
        this._doSetPanStereo(v);
    }
    get spatialBlend() { return this._spatialBlend; }
    set spatialBlend(v) {
        this._spatialBlend = v;
        this._doSetSpatialBlend(v);
    }
    get maxDistance() { return this._maxDistance; }
    set maxDistance(v) {
        this._maxDistance = v;
        this._doSetMaxDistance(v);
    }
    get dopplerLevel() { return this._dopplerLevel; }
    set dopplerLevel(v) {
        this._dopplerLevel = v;
        this._doSetDopplerLevel(v);
    }
    get setSoundAssetTime() { return this._setSoundAssetTime; }
    play(fadeInSeconds = 0) { this._doPlay(fadeInSeconds); }
    stop(fadeOutSeconds = 0) { this._doStop(fadeOutSeconds); }
    pause(fadeOutSeconds = 0) { this._doPause(fadeOutSeconds); }
    resume(fadeInSeconds = 0) { this._doResume(fadeInSeconds); }
    reset() {
        this._serialId = -1;
        this._soundAsset = null;
        this._setSoundAssetTime = -Infinity;
        this._muteInSoundGroup = false;
        this._volumeInSoundGroup = 1.0;
        this._priority = 0;
        this._loop = false;
        this._pitch = 1.0;
        this._panStereo = 0;
        this._spatialBlend = 0;
        this._maxDistance = 100;
        this._dopplerLevel = 1.0;
        this._doReset();
    }
    setSoundAsset(serialId, asset, params) {
        this.reset();
        this._serialId = serialId;
        this._soundAsset = asset;
        this._setSoundAssetTime = Date.now();
        this._muteInSoundGroup = params.muteInSoundGroup;
        this._volumeInSoundGroup = params.volumeInSoundGroup;
        this._priority = params.priority;
        this._loop = params.loop;
        this._pitch = params.pitch;
        this._panStereo = params.panStereo;
        this._spatialBlend = params.spatialBlend;
        this._maxDistance = params.maxDistance;
        this._dopplerLevel = params.dopplerLevel;
        return this._doSetSoundAsset(asset, params);
    }
    refreshMute() { this._refreshMute(); }
    refreshVolume() { this._refreshVolume(); }
    _refreshMute() { this._doSetMute(this.mute); }
    _refreshVolume() { this._doSetVolume(this.volume); }
    // ---------- hooks for engine layer ----------
    _doIsPlaying() { return false; }
    _doGetLength() { return 0; }
    _doGetTime() { return 0; }
    _doSetTime(_t) { }
    _doSetLoop(_v) { }
    _doSetMute(_v) { }
    _doSetVolume(_v) { }
    _doSetPitch(_v) { }
    _doSetPanStereo(_v) { }
    _doSetSpatialBlend(_v) { }
    _doSetMaxDistance(_v) { }
    _doSetDopplerLevel(_v) { }
    _doPlay(_fadeInSeconds) { }
    _doStop(_fadeOutSeconds) { }
    _doPause(_fadeOutSeconds) { }
    _doResume(_fadeInSeconds) { }
    _doReset() { }
    _doSetSoundAsset(_asset, _params) { return true; }
}
// ---------- SoundGroup ----------
class SoundGroup {
    constructor(name, avoidBeingReplacedBySamePriority, mute, volume) {
        this.agents = [];
        this.name = name;
        this._avoidBeingReplacedBySamePriority = avoidBeingReplacedBySamePriority;
        this._mute = mute;
        this._volume = volume;
    }
    get soundAgentCount() { return this.agents.length; }
    get avoidBeingReplacedBySamePriority() { return this._avoidBeingReplacedBySamePriority; }
    set avoidBeingReplacedBySamePriority(v) { this._avoidBeingReplacedBySamePriority = v; }
    get mute() { return this._mute; }
    set mute(v) {
        this._mute = v;
        for (const agent of this.agents)
            agent.refreshMute();
    }
    get volume() { return this._volume; }
    set volume(v) {
        this._volume = Math.max(0, Math.min(1, v));
        for (const agent of this.agents)
            agent.refreshVolume();
    }
    playSound(serialId, soundAsset, params) {
        let candidate = null;
        for (const agent of this.agents) {
            if (agent.serialId < 0) {
                candidate = agent;
                break;
            }
        }
        if (!candidate) {
            // Find lowest priority agent to replace
            let lowestPriority = params.priority;
            for (const agent of this.agents) {
                if (agent.priority < lowestPriority) {
                    lowestPriority = agent.priority;
                    candidate = agent;
                }
                else if (!this._avoidBeingReplacedBySamePriority &&
                    agent.priority === lowestPriority) {
                    if (!candidate || agent.setSoundAssetTime < candidate.setSoundAssetTime) {
                        candidate = agent;
                    }
                }
            }
            if (!candidate) {
                return { agent: null, errorCode: PlaySoundErrorCode.IgnoredDueToLowPriority };
            }
            candidate.stop(0);
        }
        if (!candidate.setSoundAsset(serialId, soundAsset, params)) {
            return { agent: null, errorCode: PlaySoundErrorCode.SetSoundAssetFailure };
        }
        candidate.play(params.fadeInSeconds);
        return { agent: candidate, errorCode: null };
    }
    stopSound(serialId, fadeOutSeconds) {
        for (const agent of this.agents) {
            if (agent.serialId === serialId) {
                agent.stop(fadeOutSeconds);
                agent.reset();
                return true;
            }
        }
        return false;
    }
    pauseSound(serialId, fadeOutSeconds) {
        for (const agent of this.agents) {
            if (agent.serialId === serialId) {
                agent.pause(fadeOutSeconds);
                return true;
            }
        }
        return false;
    }
    resumeSound(serialId, fadeInSeconds) {
        for (const agent of this.agents) {
            if (agent.serialId === serialId) {
                agent.resume(fadeInSeconds);
                return true;
            }
        }
        return false;
    }
    stopAllLoadedSounds(fadeOutSeconds = 0) {
        for (const agent of this.agents) {
            if (agent.serialId >= 0) {
                agent.stop(fadeOutSeconds);
                agent.reset();
            }
        }
    }
}
// ---------- SoundManager ----------
class SoundManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._resourceManager = null;
        this._soundHelper = null;
        this._groups = new Map();
        this._soundsBeingLoaded = new Set();
        this._soundsToReleaseOnLoad = new Set();
        this._serialId = 0;
        this._pendingLoadInfo = new Map();
        this.onPlaySoundSuccess = null;
        this.onPlaySoundFailure = null;
        this.onPlaySoundUpdate = null;
        this.onPlaySoundDependencyAsset = null;
    }
    get priority() { return 30; }
    get soundGroupCount() { return this._groups.size; }
    setResourceManager(rm) { this._resourceManager = rm; }
    setSoundHelper(helper) { this._soundHelper = helper; }
    addSoundGroup(groupName, avoidBeingReplacedBySamePriority = false, mute = false, volume = 1.0, agentCount = 1) {
        if (this._groups.has(groupName))
            return false;
        const group = new (this._createSoundGroup())(groupName, avoidBeingReplacedBySamePriority, mute, volume);
        for (let i = 0; i < agentCount; i++) {
            group.agents.push(this._createSoundAgent(group));
        }
        this._groups.set(groupName, group);
        return true;
    }
    hasSoundGroup(groupName) { return this._groups.has(groupName); }
    getSoundGroup(groupName) {
        return this._groups.get(groupName) ?? null;
    }
    getAllSoundGroups() {
        return Array.from(this._groups.values());
    }
    getAllLoadingSoundSerialIds() {
        return Array.from(this._soundsBeingLoaded);
    }
    isLoadingSound(serialId) {
        return this._soundsBeingLoaded.has(serialId);
    }
    playSound(soundAssetName, bundleName, groupName, params, userData) {
        if (!this._resourceManager) {
            throw new GameFrameworkError('ResourceManager is not set.');
        }
        const group = this._groups.get(groupName);
        if (!group) {
            throw new GameFrameworkError(`SoundGroup [${groupName}] not found.`);
        }
        if (group.agents.length === 0) {
            throw new GameFrameworkError(`SoundGroup [${groupName}] has no agent.`);
        }
        const serialId = ++this._serialId;
        const resolvedParams = params ?? PlaySoundParams.create();
        const info = PlaySoundInfo.create(serialId, group, resolvedParams, userData ?? null);
        this._soundsBeingLoaded.add(serialId);
        this._pendingLoadInfo.set(serialId, info);
        this._resourceManager.loadAsset(bundleName, soundAssetName, Object, (asset) => this._onLoadSuccess(serialId, soundAssetName, asset), (name, msg) => this._onLoadFailure(serialId, soundAssetName, groupName, name, msg));
        return serialId;
    }
    _onLoadSuccess(serialId, soundAssetName, asset) {
        if (this._soundsToReleaseOnLoad.has(serialId)) {
            this._soundsToReleaseOnLoad.delete(serialId);
            this._cleanupPendingInfo(serialId);
            return;
        }
        this._soundsBeingLoaded.delete(serialId);
        const info = this._pendingLoadInfo.get(serialId);
        if (!info || !info.soundGroup || !info.playSoundParams) {
            this._cleanupPendingInfo(serialId);
            return;
        }
        const startTime = Date.now();
        const { agent, errorCode } = info.soundGroup.playSound(serialId, asset, info.playSoundParams);
        if (!agent || errorCode !== null) {
            const code = errorCode ?? PlaySoundErrorCode.Unknown;
            const errMsg = `Play sound '${soundAssetName}' failed, error code: ${PlaySoundErrorCode[code]}.`;
            if (this.onPlaySoundFailure) {
                this.onPlaySoundFailure(PlaySoundFailureEventArgs.create(serialId, soundAssetName, info.soundGroup.name, info.playSoundParams, code, errMsg, info.userData));
            }
            this._cleanupPendingInfo(serialId);
            return;
        }
        const duration = (Date.now() - startTime) / 1000;
        if (this.onPlaySoundSuccess) {
            this.onPlaySoundSuccess(PlaySoundSuccessEventArgs.create(serialId, soundAssetName, agent, duration, info.userData));
        }
        this._cleanupPendingInfo(serialId);
    }
    _onLoadFailure(serialId, soundAssetName, groupName, _name, msg) {
        if (this._soundsToReleaseOnLoad.has(serialId)) {
            this._soundsToReleaseOnLoad.delete(serialId);
            this._cleanupPendingInfo(serialId);
            return;
        }
        this._soundsBeingLoaded.delete(serialId);
        const info = this._pendingLoadInfo.get(serialId);
        const errMsg = `Load sound '${soundAssetName}' failed: ${msg}`;
        if (this.onPlaySoundFailure) {
            this.onPlaySoundFailure(PlaySoundFailureEventArgs.create(serialId, soundAssetName, groupName, info?.playSoundParams ?? null, PlaySoundErrorCode.LoadAssetFailure, errMsg, info?.userData ?? null));
        }
        this._cleanupPendingInfo(serialId);
    }
    _cleanupPendingInfo(serialId) {
        const info = this._pendingLoadInfo.get(serialId);
        if (info) {
            if (info.playSoundParams?.referenced) {
                ReferencePool.release(info.playSoundParams);
            }
            ReferencePool.release(info);
            this._pendingLoadInfo.delete(serialId);
        }
    }
    stopSound(serialId, fadeOutSeconds = 0) {
        if (this._soundsBeingLoaded.has(serialId)) {
            this._soundsToReleaseOnLoad.add(serialId);
            this._soundsBeingLoaded.delete(serialId);
            return true;
        }
        for (const group of this._groups.values()) {
            for (const agent of group.agents) {
                if (agent.serialId === serialId) {
                    const asset = agent.soundAsset;
                    if (group.stopSound(serialId, fadeOutSeconds)) {
                        if (asset)
                            this._soundHelper?.releaseSoundAsset(asset);
                        return true;
                    }
                }
            }
        }
        return false;
    }
    stopAllLoadedSounds(fadeOutSeconds = 0) {
        for (const group of this._groups.values()) {
            const assets = group.agents
                .filter(a => a.serialId >= 0)
                .map(a => a.soundAsset);
            group.stopAllLoadedSounds(fadeOutSeconds);
            for (const asset of assets) {
                if (asset)
                    this._soundHelper?.releaseSoundAsset(asset);
            }
        }
    }
    stopAllLoadingSounds() {
        for (const id of this._soundsBeingLoaded) {
            this._soundsToReleaseOnLoad.add(id);
        }
    }
    pauseSound(serialId, fadeOutSeconds = 0) {
        for (const group of this._groups.values()) {
            if (group.pauseSound(serialId, fadeOutSeconds))
                return;
        }
        throw new GameFrameworkError(`Sound [${serialId}] not found.`);
    }
    resumeSound(serialId, fadeInSeconds = 0) {
        for (const group of this._groups.values()) {
            if (group.resumeSound(serialId, fadeInSeconds))
                return;
        }
        throw new GameFrameworkError(`Sound [${serialId}] not found.`);
    }
    isMuted(groupName) {
        return this._groups.get(groupName)?.mute ?? false;
    }
    setMuted(groupName, mute) {
        const g = this._groups.get(groupName);
        if (g)
            g.mute = mute;
    }
    getVolume(groupName) {
        return this._groups.get(groupName)?.volume ?? 1.0;
    }
    setVolume(groupName, volume) {
        const g = this._groups.get(groupName);
        if (g)
            g.volume = volume;
    }
    _createSoundGroup() {
        return SoundGroup;
    }
    update(_e, _r) { }
    shutdown() {
        this.stopAllLoadedSounds();
        this._groups.clear();
        this._soundsBeingLoaded.clear();
        this._soundsToReleaseOnLoad.clear();
        this._pendingLoadInfo.forEach((_, id) => this._cleanupPendingInfo(id));
        this._pendingLoadInfo.clear();
        this._resourceManager = null;
    }
}

class OpenUIFormSuccessEventArgs extends BaseEventArgs {
    get id() { return OpenUIFormSuccessEventArgs.eventId; }
    static create(serialId, uiFormAssetName, uiGroupName, pauseCoveredUIForm, duration, userData) {
        const e = ReferencePool.acquire(OpenUIFormSuccessEventArgs);
        e.serialId = serialId;
        e.uiFormAssetName = uiFormAssetName;
        e.uiGroupName = uiGroupName;
        e.pauseCoveredUIForm = pauseCoveredUIForm;
        e.duration = duration;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.uiFormAssetName = '';
        this.uiGroupName = '';
        this.pauseCoveredUIForm = false;
        this.duration = 0;
        this.userData = undefined;
    }
}
OpenUIFormSuccessEventArgs.eventId = 'ui.open.success';
class OpenUIFormFailureEventArgs extends BaseEventArgs {
    get id() { return OpenUIFormFailureEventArgs.eventId; }
    static create(serialId, uiFormAssetName, uiGroupName, pauseCoveredUIForm, errorMessage, userData) {
        const e = ReferencePool.acquire(OpenUIFormFailureEventArgs);
        e.serialId = serialId;
        e.uiFormAssetName = uiFormAssetName;
        e.uiGroupName = uiGroupName;
        e.pauseCoveredUIForm = pauseCoveredUIForm;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.uiFormAssetName = '';
        this.uiGroupName = '';
        this.pauseCoveredUIForm = false;
        this.errorMessage = '';
        this.userData = undefined;
    }
}
OpenUIFormFailureEventArgs.eventId = 'ui.open.failure';
class CloseUIFormCompleteEventArgs extends BaseEventArgs {
    get id() { return CloseUIFormCompleteEventArgs.eventId; }
    static create(serialId, uiFormAssetName, uiGroupName, userData) {
        const e = ReferencePool.acquire(CloseUIFormCompleteEventArgs);
        e.serialId = serialId;
        e.uiFormAssetName = uiFormAssetName;
        e.uiGroupName = uiGroupName;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.uiFormAssetName = '';
        this.uiGroupName = '';
        this.userData = undefined;
    }
}
CloseUIFormCompleteEventArgs.eventId = 'ui.close.complete';
class OpenUIFormUpdateEventArgs extends BaseEventArgs {
    get id() { return OpenUIFormUpdateEventArgs.eventId; }
    static create(serialId, uiFormAssetName, uiGroupName, pauseCoveredUIForm, progress, userData) {
        const e = ReferencePool.acquire(OpenUIFormUpdateEventArgs);
        e.serialId = serialId;
        e.uiFormAssetName = uiFormAssetName;
        e.uiGroupName = uiGroupName;
        e.pauseCoveredUIForm = pauseCoveredUIForm;
        e.progress = progress;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.uiFormAssetName = '';
        this.uiGroupName = '';
        this.pauseCoveredUIForm = false;
        this.progress = 0;
        this.userData = undefined;
    }
}
OpenUIFormUpdateEventArgs.eventId = 'ui.open.update';
class OpenUIFormDependencyAssetEventArgs extends BaseEventArgs {
    get id() { return OpenUIFormDependencyAssetEventArgs.eventId; }
    static create(serialId, uiFormAssetName, uiGroupName, pauseCoveredUIForm, dependencyAssetName, loadedCount, totalCount, userData) {
        const e = ReferencePool.acquire(OpenUIFormDependencyAssetEventArgs);
        e.serialId = serialId;
        e.uiFormAssetName = uiFormAssetName;
        e.uiGroupName = uiGroupName;
        e.pauseCoveredUIForm = pauseCoveredUIForm;
        e.dependencyAssetName = dependencyAssetName;
        e.loadedCount = loadedCount;
        e.totalCount = totalCount;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.uiFormAssetName = '';
        this.uiGroupName = '';
        this.pauseCoveredUIForm = false;
        this.dependencyAssetName = '';
        this.loadedCount = 0;
        this.totalCount = 0;
        this.userData = undefined;
    }
}
OpenUIFormDependencyAssetEventArgs.eventId = 'ui.open.dependency';

// ================================================================
// UIGroup 内部数据（同时实现 IUIGroup）
// ================================================================
class UIGroupData {
    constructor(name, depth) {
        this.pause = false;
        this.forms = [];
        this.name = name;
        this.depth = depth;
    }
    get uiFormCount() { return this.forms.length; }
    get currentUIForm() {
        return this.forms.length > 0 ? this.forms[this.forms.length - 1] : null;
    }
    hasUIForm(serialId) {
        return this.forms.some(f => f.serialId === serialId && f.isOpen);
    }
    hasUIFormByAsset(uiFormAssetName) {
        return this.forms.some(f => f.uiFormAssetName === uiFormAssetName && f.isOpen);
    }
    getUIForm(serialId) {
        return this.forms.find(f => f.serialId === serialId && f.isOpen) ?? null;
    }
    getUIFormByAsset(uiFormAssetName) {
        return this.forms.find(f => f.uiFormAssetName === uiFormAssetName && f.isOpen) ?? null;
    }
    getUIForms(uiFormAssetName) {
        return this.forms.filter(f => f.uiFormAssetName === uiFormAssetName && f.isOpen);
    }
    getAllUIForms() {
        return this.forms.filter(f => f.isOpen);
    }
}
// ================================================================
// UIManager
// ================================================================
class UIManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._uiFormHelper = null;
        this._resourceManager = null;
        this._groups = new Map();
        this._forms = new Map();
        this._serialId = 0;
        // 对象池：assetName → 空闲实例列表
        this._pool = new Map();
        this._autoReleaseTimer = 0;
        // 池配置
        this._instanceCapacity = 16;
        this._instanceExpireTime = 60;
        this._instanceAutoReleaseInterval = 60;
        this._instancePriority = 0;
        this._cancelledIds = new Set();
        // 事件回调 — 由 UIComponent 绑定
        this.onOpenUIFormSuccess = null;
        this.onOpenUIFormFailure = null;
        this.onCloseUIFormComplete = null;
    }
    get priority() { return 50; }
    get uiGroupCount() { return this._groups.size; }
    get currentSerialId() { return this._serialId; }
    // ---- 配置 ----
    get instanceCapacity() { return this._instanceCapacity; }
    set instanceCapacity(v) { this._instanceCapacity = v; }
    get instanceExpireTime() { return this._instanceExpireTime; }
    set instanceExpireTime(v) { this._instanceExpireTime = v; }
    get instanceAutoReleaseInterval() { return this._instanceAutoReleaseInterval; }
    set instanceAutoReleaseInterval(v) { this._instanceAutoReleaseInterval = v; }
    get instancePriority() { return this._instancePriority; }
    set instancePriority(v) { this._instancePriority = v; }
    setHelper(helper) { this._uiFormHelper = helper; }
    setResourceManager(rm) { this._resourceManager = rm; }
    // ---- UIGroup ----
    addUIGroup(groupName, depth = 0) {
        if (this._groups.has(groupName))
            return false;
        this._groups.set(groupName, new UIGroupData(groupName, depth));
        return true;
    }
    hasUIGroup(groupName) { return this._groups.has(groupName); }
    getUIGroup(groupName) { return this._groups.get(groupName) ?? null; }
    getAllUIGroups() { return Array.from(this._groups.values()); }
    removeUIGroup(groupName) {
        const group = this._groups.get(groupName);
        if (!group)
            return false;
        if (group.forms.length > 0)
            throw new GameFrameworkError(`UIGroup [${groupName}] still has open forms.`);
        return this._groups.delete(groupName);
    }
    // ---- Open ----
    openUIForm(uiFormAssetName, bundleName, groupName, pauseCoveredUIForm = false, userData) {
        if (!this._uiFormHelper)
            throw new GameFrameworkError('UIFormHelper is not set.');
        if (!this._resourceManager)
            throw new GameFrameworkError('ResourceManager is not set.');
        if (!this._groups.has(groupName))
            throw new GameFrameworkError(`UIGroup [${groupName}] not found.`);
        const serialId = ++this._serialId;
        const groupRef = () => this._groups.get(groupName);
        const data = {
            serialId,
            uiFormAssetName,
            bundleName,
            groupName,
            pauseCoveredUIForm,
            userData,
            instance: null,
            isLoading: true,
            isOpen: false,
            isPaused: false,
            isCovered: false,
            isNewInstance: true,
            loadStartTime: Date.now(),
            get uiGroup() { return groupRef(); },
            get uiFormInstance() { return data.instance; },
        };
        this._forms.set(serialId, data);
        const poolEntry = this._acquireFromPool(uiFormAssetName);
        if (poolEntry) {
            data.isLoading = false;
            data.isNewInstance = false;
            data.instance = poolEntry.instance;
            this._uiFormHelper.onReuseUIForm(poolEntry.instance);
            this._activateForm(data);
            return serialId;
        }
        this._resourceManager.loadAsset(bundleName, uiFormAssetName, Object, (asset) => this._onLoadSuccess(serialId, asset), (_name, msg) => this._onLoadFailure(serialId, uiFormAssetName, msg));
        return serialId;
    }
    _onLoadSuccess(serialId, asset) {
        if (this._cancelledIds.has(serialId)) {
            this._cancelledIds.delete(serialId);
            return;
        }
        const data = this._forms.get(serialId);
        if (!data || !this._uiFormHelper)
            return;
        data.isLoading = false;
        data.instance = this._uiFormHelper.instantiateUIForm(asset);
        this._activateForm(data);
    }
    _onLoadFailure(serialId, assetName, errorMsg) {
        if (this._cancelledIds.has(serialId)) {
            this._cancelledIds.delete(serialId);
            return;
        }
        const data = this._forms.get(serialId);
        if (!data)
            return;
        console.error(`[UIManager] Open UI [${assetName}] failed: ${errorMsg}`);
        this.onOpenUIFormFailure?.(serialId, assetName, data.groupName, data.pauseCoveredUIForm, errorMsg, data.userData);
        this._forms.delete(serialId);
    }
    _activateForm(data) {
        const group = this._groups.get(data.groupName);
        const depthInUIGroup = group.forms.length;
        this._uiFormHelper.createUIForm(data.instance, group, data.userData);
        // 暂停 / 遮挡当前顶层
        if (group.forms.length > 0) {
            const prevTop = group.forms[group.forms.length - 1];
            if (!prevTop.isCovered) {
                prevTop.isCovered = true;
                if (prevTop.instance)
                    this._uiFormHelper.onCoverUIForm?.(prevTop.instance);
            }
            if (data.pauseCoveredUIForm && !prevTop.isPaused && prevTop.instance) {
                this._uiFormHelper.onPauseUIForm(prevTop.instance);
                prevTop.isPaused = true;
            }
        }
        group.forms.push(data);
        data.isOpen = true;
        this._uiFormHelper.onOpenUIForm(data.serialId, data.instance, group, data.pauseCoveredUIForm, depthInUIGroup, data.isNewInstance, data.userData);
        const duration = (Date.now() - data.loadStartTime) / 1000;
        this.onOpenUIFormSuccess?.(data.serialId, data.uiFormAssetName, data.groupName, data.pauseCoveredUIForm, duration, data.userData);
    }
    // ---- Close ----
    closeUIForm(serialId, userData) {
        const data = this._forms.get(serialId);
        if (!data)
            return;
        if (data.isLoading) {
            this._cancelledIds.add(serialId);
            this._forms.delete(serialId);
            return;
        }
        if (!data.isOpen || !this._uiFormHelper)
            return;
        this._internalClose(data, false, userData);
    }
    closeUIFormByInstance(uiFormInstance, userData) {
        const data = Array.from(this._forms.values()).find(f => f.instance === uiFormInstance);
        if (!data || !data.isOpen || !this._uiFormHelper)
            return;
        this._internalClose(data, false, userData);
    }
    _internalClose(data, isShutdown, userData) {
        const group = this._groups.get(data.groupName);
        if (group) {
            const idx = group.forms.indexOf(data);
            if (idx >= 0) {
                group.forms.splice(idx, 1);
                // 恢复被该 UI 暂停的界面
                if (data.pauseCoveredUIForm && group.forms.length > 0) {
                    const newTop = group.forms[group.forms.length - 1];
                    if (newTop.isPaused && newTop.instance) {
                        this._uiFormHelper.onResumeUIForm(newTop.instance);
                        newTop.isPaused = false;
                    }
                }
                // 更新新顶层遮挡状态
                if (group.forms.length > 0) {
                    const newTop = group.forms[group.forms.length - 1];
                    if (newTop.isCovered) {
                        newTop.isCovered = false;
                        if (newTop.instance)
                            this._uiFormHelper.onRevealUIForm?.(newTop.instance);
                    }
                }
                // 通知剩余界面深度变化
                this._notifyGroupDepthChanged(group);
            }
        }
        this._uiFormHelper.onCloseUIForm(data.instance, isShutdown, userData);
        if (this._returnToPool(data.uiFormAssetName, data.instance)) {
            this._uiFormHelper.onRecycleUIForm(data.instance);
        }
        else {
            this._uiFormHelper.releaseUIForm(null, data.instance);
        }
        const { serialId, uiFormAssetName, groupName } = data;
        this._forms.delete(data.serialId);
        if (!isShutdown) {
            this.onCloseUIFormComplete?.(serialId, uiFormAssetName, groupName, userData);
        }
    }
    closeAllLoadedUIForms(userData) {
        const loaded = Array.from(this._forms.values()).filter(f => f.isOpen);
        for (const f of loaded)
            this._internalClose(f, false, userData);
    }
    closeAllLoadingUIForms() {
        const loading = Array.from(this._forms.values()).filter(f => f.isLoading);
        for (const f of loading) {
            this._cancelledIds.add(f.serialId);
            this._forms.delete(f.serialId);
        }
    }
    // ---- 深度变化通知 ----
    _notifyGroupDepthChanged(group) {
        if (!this._uiFormHelper?.onDepthChangedUIForm)
            return;
        group.forms.forEach((f, i) => {
            if (f.instance) {
                this._uiFormHelper.onDepthChangedUIForm(f.instance, group.depth, i);
            }
        });
    }
    // ---- Query ----
    hasUIForm(serialId) { return this._forms.has(serialId); }
    hasUIFormByAsset(uiFormAssetName) {
        return Array.from(this._forms.values()).some(f => f.uiFormAssetName === uiFormAssetName);
    }
    getUIForm(serialId) { return this._forms.get(serialId)?.instance ?? null; }
    getUIFormByAsset(uiFormAssetName) {
        return Array.from(this._forms.values()).find(f => f.uiFormAssetName === uiFormAssetName && f.isOpen)?.instance ?? null;
    }
    getUIFormsByAsset(uiFormAssetName) {
        return Array.from(this._forms.values())
            .filter(f => f.uiFormAssetName === uiFormAssetName && f.isOpen && f.instance)
            .map(f => f.instance);
    }
    getAllLoadedUIForms() {
        return Array.from(this._forms.values())
            .filter(f => f.isOpen && f.instance)
            .map(f => f.instance);
    }
    getAllLoadingUIFormSerialIds() {
        return Array.from(this._forms.values()).filter(f => f.isLoading).map(f => f.serialId);
    }
    isLoadingUIForm(serialId) { return this._forms.get(serialId)?.isLoading ?? false; }
    isLoadingUIFormByAsset(uiFormAssetName) {
        return Array.from(this._forms.values()).some(f => f.uiFormAssetName === uiFormAssetName && f.isLoading);
    }
    isValidUIForm(uiFormInstance) {
        return Array.from(this._forms.values()).some(f => f.instance === uiFormInstance && f.isOpen);
    }
    // ---- Refocus ----
    refocusUIForm(uiFormInstance, userData) {
        if (!this._uiFormHelper)
            return;
        const data = Array.from(this._forms.values()).find(f => f.instance === uiFormInstance && f.isOpen);
        if (!data)
            return;
        const group = this._groups.get(data.groupName);
        if (!group)
            return;
        const idx = group.forms.indexOf(data);
        if (idx < 0 || idx === group.forms.length - 1) {
            // 已在顶层，只触发 refocus 回调
            this._uiFormHelper.onRefocusUIForm?.(uiFormInstance, userData);
            return;
        }
        const currentTop = group.forms[group.forms.length - 1];
        if (!currentTop.isCovered) {
            currentTop.isCovered = true;
            if (currentTop.instance)
                this._uiFormHelper.onCoverUIForm?.(currentTop.instance);
        }
        if (data.pauseCoveredUIForm && !currentTop.isPaused && currentTop.instance) {
            this._uiFormHelper.onPauseUIForm(currentTop.instance);
            currentTop.isPaused = true;
        }
        group.forms.splice(idx, 1);
        group.forms.push(data);
        if (data.isCovered) {
            data.isCovered = false;
            if (data.instance)
                this._uiFormHelper.onRevealUIForm?.(data.instance);
        }
        if (data.isPaused && data.instance) {
            this._uiFormHelper.onResumeUIForm(data.instance);
            data.isPaused = false;
        }
        this._notifyGroupDepthChanged(group);
        this._uiFormHelper.onRefocusUIForm?.(uiFormInstance, userData);
    }
    // ---- 池操作 ----
    setUIFormInstanceLocked(uiFormInstance, locked) {
        this._pool.forEach(entries => {
            const e = entries.find(x => x.instance === uiFormInstance);
            if (e)
                e.locked = locked;
        });
    }
    setUIFormInstancePriority(uiFormInstance, priority) {
        this._pool.forEach(entries => {
            const e = entries.find(x => x.instance === uiFormInstance);
            if (e)
                e.priority = priority;
        });
    }
    _acquireFromPool(assetName) {
        const entries = this._pool.get(assetName);
        if (!entries || entries.length === 0)
            return null;
        let bestIdx = -1;
        let bestPriority = -Infinity;
        for (let i = 0; i < entries.length; i++) {
            if (!entries[i].locked && entries[i].priority >= bestPriority) {
                bestPriority = entries[i].priority;
                bestIdx = i;
            }
        }
        if (bestIdx < 0)
            return null;
        return entries.splice(bestIdx, 1)[0];
    }
    _returnToPool(assetName, instance) {
        let total = 0;
        this._pool.forEach(entries => { total += entries.length; });
        if (total >= this._instanceCapacity)
            return false;
        let entries = this._pool.get(assetName);
        if (!entries) {
            entries = [];
            this._pool.set(assetName, entries);
        }
        entries.push({ instance, lastUseTime: Date.now(), locked: false, priority: this._instancePriority });
        return true;
    }
    _releaseExpiredPoolEntries() {
        if (this._instanceExpireTime <= 0 || !this._uiFormHelper)
            return;
        const now = Date.now();
        const expireMs = this._instanceExpireTime * 1000;
        this._pool.forEach(entries => {
            for (let i = entries.length - 1; i >= 0; i--) {
                const e = entries[i];
                if (!e.locked && (now - e.lastUseTime) >= expireMs) {
                    this._uiFormHelper.releaseUIForm(null, e.instance);
                    entries.splice(i, 1);
                }
            }
        });
    }
    // ---- Lifecycle ----
    update(elapseSeconds, realElapseSeconds) {
        if (!this._uiFormHelper)
            return;
        this._forms.forEach(data => {
            if (data.isOpen && !data.isPaused && data.instance) {
                this._uiFormHelper.onUpdateUIForm(data.instance, elapseSeconds, realElapseSeconds);
            }
        });
        this._autoReleaseTimer += elapseSeconds;
        if (this._autoReleaseTimer >= this._instanceAutoReleaseInterval) {
            this._autoReleaseTimer = 0;
            this._releaseExpiredPoolEntries();
        }
    }
    shutdown() {
        // 关闭所有已打开的界面（isShutdown=true）
        const loaded = Array.from(this._forms.values()).filter(f => f.isOpen);
        for (const f of loaded)
            this._internalClose(f, true, undefined);
        this.closeAllLoadingUIForms();
        // 销毁池内剩余实例
        if (this._uiFormHelper) {
            this._pool.forEach(entries => {
                entries.forEach(e => this._uiFormHelper.releaseUIForm(null, e.instance));
            });
        }
        this._pool.clear();
        this._groups.clear();
        this._cancelledIds.clear();
        this._uiFormHelper = null;
        this._resourceManager = null;
    }
}

/**
 * Extensions for reading/writing 7-bit encoded integers and encrypted strings,
 * ported from UnityGameFramework BinaryExtension.cs.
 *
 * These operate on a raw byte buffer with a position cursor rather than BinaryReader/Writer,
 * which doesn't exist in JavaScript.
 */
class BinaryExtension {
    /** Read a 7-bit encoded variable-length Int32 from buf at pos; advances pos. */
    static read7BitEncodedInt32(buf, pos) {
        let result = 0;
        let shift = 0;
        let b;
        do {
            if (shift >= 35)
                throw new RangeError('[BinaryExtension] Bad 7-bit encoded Int32.');
            b = buf[pos.value++];
            result |= (b & 0x7F) << shift;
            shift += 7;
        } while (b & 0x80);
        return result | 0;
    }
    /** Write a 7-bit encoded variable-length Int32 into buf at pos; advances pos. */
    static write7BitEncodedInt32(buf, pos, value) {
        let v = value >>> 0;
        while (v >= 0x80) {
            buf[pos.value++] = (v & 0x7F) | 0x80;
            v >>>= 7;
        }
        buf[pos.value++] = v;
    }
    /** Read a 7-bit encoded variable-length UInt32. */
    static read7BitEncodedUint32(buf, pos) {
        let result = 0;
        let shift = 0;
        let b;
        do {
            if (shift >= 35)
                throw new RangeError('[BinaryExtension] Bad 7-bit encoded Uint32.');
            b = buf[pos.value++];
            result = (result | ((b & 0x7F) << shift)) >>> 0;
            shift += 7;
        } while (b & 0x80);
        return result;
    }
    /** Write a 7-bit encoded variable-length UInt32. */
    static write7BitEncodedUint32(buf, pos, value) {
        let v = value >>> 0;
        while (v >= 0x80) {
            buf[pos.value++] = (v & 0x7F) | 0x80;
            v >>>= 7;
        }
        buf[pos.value++] = v;
    }
    /**
     * Read an encrypted string from buf at pos using the given XOR key.
     * Format: [7-bit encoded length][XOR-encrypted UTF-8 bytes]
     */
    static readEncryptedString(buf, pos, key) {
        const length = this.read7BitEncodedInt32(buf, pos);
        if (length < 0)
            return null;
        if (length === 0)
            return '';
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = buf[pos.value + i] ^ key[i % key.length];
        }
        pos.value += length;
        return new TextDecoder().decode(bytes);
    }
    /**
     * Write an encrypted string into buf at pos using the given XOR key.
     * Format: [7-bit encoded length][XOR-encrypted UTF-8 bytes]
     */
    static writeEncryptedString(buf, pos, value, key) {
        if (value === null) {
            this.write7BitEncodedInt32(buf, pos, -1);
            return;
        }
        const bytes = new TextEncoder().encode(value);
        this.write7BitEncodedInt32(buf, pos, bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            buf[pos.value++] = bytes[i] ^ key[i % key.length];
        }
    }
}

/**
 * String utility extensions, ported from UnityGameFramework StringExtension.cs.
 */
class StringExtension {
    /**
     * Reads the next line from a string starting at position.
     * Advances pos.value past the line terminator.
     * Returns null when there are no more characters.
     */
    static readLine(str, pos) {
        if (pos.value >= str.length)
            return null;
        const start = pos.value;
        while (pos.value < str.length) {
            const ch = str[pos.value];
            if (ch === '\n') {
                const line = str.substring(start, pos.value);
                pos.value++;
                return line.endsWith('\r') ? line.slice(0, -1) : line;
            }
            if (ch === '\r') {
                const line = str.substring(start, pos.value);
                pos.value++;
                if (pos.value < str.length && str[pos.value] === '\n')
                    pos.value++;
                return line;
            }
            pos.value++;
        }
        return str.substring(start, pos.value);
    }
}

class UtilityCompression {
    static setCompressionHelper(helper) {
        this._helper = helper;
    }
    /**
     * 压缩数据。需先调用 setCompressionHelper 注入具体实现。
     */
    static compress(bytes) {
        if (!this._helper)
            throw new Error('[Utility.Compression] Compression helper is not set.');
        const result = this._helper.compress(bytes);
        if (!result)
            throw new Error('[Utility.Compression] Compress failed.');
        return result;
    }
    /**
     * 解压数据。需先调用 setCompressionHelper 注入具体实现。
     */
    static decompress(bytes) {
        if (!this._helper)
            throw new Error('[Utility.Compression] Compression helper is not set.');
        const result = this._helper.decompress(bytes);
        if (!result)
            throw new Error('[Utility.Compression] Decompress failed.');
        return result;
    }
    /** 当前是否已注入压缩辅助器 */
    static get hasHelper() {
        return this._helper !== null;
    }
}
UtilityCompression._helper = null;

/**
 * Byte-level type conversion utilities.
 * Uses DataView for correct endianness handling.
 */
class UtilityConverter {
    static get isLittleEndian() {
        const buf = new Uint16Array([1]);
        return new Uint8Array(buf.buffer)[0] === 1;
    }
    // ---- Encode (value → bytes) ----
    static getBytesFromBool(value) {
        return new Uint8Array([value ? 1 : 0]);
    }
    static getBytesFromInt16(value) {
        this._view.setInt16(0, value, true);
        return new Uint8Array(this._view.buffer.slice(0, 2));
    }
    static getBytesFromUint16(value) {
        this._view.setUint16(0, value, true);
        return new Uint8Array(this._view.buffer.slice(0, 2));
    }
    static getBytesFromInt32(value) {
        this._view.setInt32(0, value, true);
        return new Uint8Array(this._view.buffer.slice(0, 4));
    }
    static getBytesFromUint32(value) {
        this._view.setUint32(0, value, true);
        return new Uint8Array(this._view.buffer.slice(0, 4));
    }
    static getBytesFromFloat32(value) {
        this._view.setFloat32(0, value, true);
        return new Uint8Array(this._view.buffer.slice(0, 4));
    }
    static getBytesFromFloat64(value) {
        this._view.setFloat64(0, value, true);
        return new Uint8Array(this._view.buffer.slice(0, 8));
    }
    static getBytesFromString(value) {
        const encoder = new TextEncoder();
        return encoder.encode(value);
    }
    // ---- Decode (bytes → value) ----
    static getBool(data, offset = 0) {
        return data[offset] !== 0;
    }
    static getInt16(data, offset = 0) {
        return (data[offset] | (data[offset + 1] << 8)) << 16 >> 16;
    }
    static getUint16(data, offset = 0) {
        return (data[offset] | (data[offset + 1] << 8)) & 0xFFFF;
    }
    static getInt32(data, offset = 0) {
        return (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24));
    }
    static getUint32(data, offset = 0) {
        return this.getInt32(data, offset) >>> 0;
    }
    static getFloat32(data, offset = 0) {
        const view = new DataView(data.buffer, data.byteOffset + offset, 4);
        return view.getFloat32(0, true);
    }
    static getFloat64(data, offset = 0) {
        const view = new DataView(data.buffer, data.byteOffset + offset, 8);
        return view.getFloat64(0, true);
    }
    static getString(data, offset = 0, length = -1) {
        const slice = length < 0 ? data.subarray(offset) : data.subarray(offset, offset + length);
        return new TextDecoder().decode(slice);
    }
}
UtilityConverter._view = new DataView(new ArrayBuffer(8));

class UtilityEncryption {
    /** XOR the first min(length, 220) bytes of data with key (in-place). */
    static getQuickXorBytes(data, key) {
        const len = Math.min(data.length, key.length, this._quickXorMaxLength);
        for (let i = 0; i < len; i++) {
            data[i] ^= key[i];
        }
    }
    /** XOR each byte of data with the corresponding cycled key byte (in-place). */
    static getSelfXorBytes(data, key) {
        if (key.length === 0)
            return;
        for (let i = 0; i < data.length; i++) {
            data[i] ^= key[i % key.length];
        }
    }
    /** XOR all bytes of data with the full key cycled, returns a new Uint8Array. */
    static getXorBytes(data, key, offset = 0, length = -1) {
        if (length < 0)
            length = data.length - offset;
        const result = new Uint8Array(length);
        if (key.length === 0) {
            result.set(data.subarray(offset, offset + length));
            return result;
        }
        for (let i = 0; i < length; i++) {
            result[i] = data[offset + i] ^ key[i % key.length];
        }
        return result;
    }
}
UtilityEncryption._quickXorMaxLength = 220;

class DefaultJsonHelper {
    toJson(obj) {
        return JSON.stringify(obj);
    }
    toObject(json) {
        return JSON.parse(json);
    }
    toObjectOfType(_type, json) {
        return JSON.parse(json);
    }
}
class UtilityJson {
    static setJsonHelper(helper) {
        this._helper = helper;
    }
    static toJson(obj) {
        if (!this._helper)
            throw new Error('[Utility.Json] JSON helper is not set.');
        return this._helper.toJson(obj);
    }
    static toObject(json) {
        if (!this._helper)
            throw new Error('[Utility.Json] JSON helper is not set.');
        return this._helper.toObject(json);
    }
    static toObjectOfType(type, json) {
        if (!this._helper)
            throw new Error('[Utility.Json] JSON helper is not set.');
        return this._helper.toObjectOfType(type, json);
    }
}
UtilityJson._helper = new DefaultJsonHelper();

class UtilityPath {
    /** Normalizes backslashes to forward slashes. */
    static getRegularPath(path) {
        if (!path)
            return path;
        return path.replace(/\\/g, '/');
    }
    /** Converts a local path to a remote URL (adds file:/// prefix if not already a URL). */
    static getRemotePath(path) {
        if (!path)
            return path;
        const normalized = this.getRegularPath(path);
        if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(normalized))
            return normalized;
        return 'file:///' + normalized.replace(/^\/+/, '');
    }
    /** Joins path segments, normalizing slashes. */
    static combine(...segments) {
        return this.getRegularPath(segments.join('/').replace(/\/+/g, '/'));
    }
    /** Returns the directory part of a path (everything before the last '/'). */
    static getDirectoryName(path) {
        const normalized = this.getRegularPath(path);
        const idx = normalized.lastIndexOf('/');
        return idx >= 0 ? normalized.substring(0, idx) : '';
    }
    /** Returns the filename including extension. */
    static getFileName(path) {
        const normalized = this.getRegularPath(path);
        const idx = normalized.lastIndexOf('/');
        return idx >= 0 ? normalized.substring(idx + 1) : normalized;
    }
    /** Returns the filename without extension. */
    static getFileNameWithoutExtension(path) {
        const name = this.getFileName(path);
        const dotIdx = name.lastIndexOf('.');
        return dotIdx > 0 ? name.substring(0, dotIdx) : name;
    }
    /** Returns the file extension including the leading dot (e.g. ".png"). */
    static getExtension(path) {
        const name = this.getFileName(path);
        const dotIdx = name.lastIndexOf('.');
        return dotIdx >= 0 ? name.substring(dotIdx) : '';
    }
}

/**
 * Seeded pseudorandom number generator using a linear congruential algorithm,
 * matching the original GameFramework Utility.Random behavior.
 */
class UtilityRandom {
    static setSeed(seed) {
        this._seed = seed & 0x7FFFFFFF;
    }
    /** Returns a non-negative pseudorandom integer. */
    static getRandom() {
        this._seed = (this._seed * 1664525 + 1013904223) & 0x7FFFFFFF;
        return this._seed;
    }
    /** Returns a pseudorandom integer in [0, maxValue). */
    static getRandomMax(maxValue) {
        if (maxValue <= 0)
            throw new RangeError('[Utility.Random] maxValue must be positive.');
        return this.getRandom() % maxValue;
    }
    /** Returns a pseudorandom integer in [minValue, maxValue). */
    static getRandomRange(minValue, maxValue) {
        if (maxValue <= minValue)
            throw new RangeError('[Utility.Random] maxValue must be greater than minValue.');
        return minValue + this.getRandom() % (maxValue - minValue);
    }
    /** Returns a pseudorandom float in [0.0, 1.0). */
    static getRandomDouble() {
        return this.getRandom() / 0x7FFFFFFF;
    }
    /** Fills the given Uint8Array with pseudorandom bytes. */
    static getRandomBytes(result) {
        for (let i = 0; i < result.length; i++) {
            result[i] = this.getRandom() & 0xFF;
        }
    }
}
UtilityRandom._seed = Date.now() & 0x7FFFFFFF;

class DefaultTextHelper {
    format(fmt, ...args) {
        return fmt.replace(/\{(\d+)\}/g, (_, idx) => {
            const i = Number(idx);
            return i < args.length ? String(args[i]) : `{${idx}}`;
        });
    }
}
class UtilityText {
    static setTextHelper(helper) {
        this._helper = helper;
    }
    static format(fmt, ...args) {
        if (!this._helper)
            throw new Error('[Utility.Text] Text helper is not set.');
        return this._helper.format(fmt, ...args);
    }
    // Typed overloads for up to 8 parameters (matching original C# generics pattern)
    static format1(fmt, a0) {
        return this.format(fmt, a0);
    }
    static format2(fmt, a0, a1) {
        return this.format(fmt, a0, a1);
    }
    static format3(fmt, a0, a1, a2) {
        return this.format(fmt, a0, a1, a2);
    }
    static format4(fmt, a0, a1, a2, a3) {
        return this.format(fmt, a0, a1, a2, a3);
    }
    static format5(fmt, a0, a1, a2, a3, a4) {
        return this.format(fmt, a0, a1, a2, a3, a4);
    }
    static format6(fmt, a0, a1, a2, a3, a4, a5) {
        return this.format(fmt, a0, a1, a2, a3, a4, a5);
    }
    static format7(fmt, a0, a1, a2, a3, a4, a5, a6) {
        return this.format(fmt, a0, a1, a2, a3, a4, a5, a6);
    }
    static format8(fmt, a0, a1, a2, a3, a4, a5, a6, a7) {
        return this.format(fmt, a0, a1, a2, a3, a4, a5, a6, a7);
    }
}
UtilityText._helper = new DefaultTextHelper();

class UtilityVerifier {
    static _buildTable(polynomial) {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (polynomial ^ (c >>> 1)) : (c >>> 1);
            }
            table[i] = c;
        }
        return table;
    }
    static getCrc32(data, offset = 0, length = -1) {
        if (length < 0)
            length = data.length - offset;
        let crc = 0xFFFFFFFF;
        const table = this._crc32Table;
        for (let i = offset; i < offset + length; i++) {
            crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
        }
        return ((crc ^ 0xFFFFFFFF) >>> 0);
    }
    static getCrc32FromStream(getBytes, xorKey) {
        let crc = 0xFFFFFFFF;
        const table = this._crc32Table;
        let read;
        while ((read = getBytes(this._buffer)) > 0) {
            for (let i = 0; i < read; i++) {
                const byte = xorKey ? (this._buffer[i] ^ xorKey[i % xorKey.length]) : this._buffer[i];
                crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
            }
        }
        return ((crc ^ 0xFFFFFFFF) >>> 0);
    }
    static getCrc32Bytes(crc32) {
        const result = new Uint8Array(4);
        result[0] = (crc32 >>> 24) & 0xFF;
        result[1] = (crc32 >>> 16) & 0xFF;
        result[2] = (crc32 >>> 8) & 0xFF;
        result[3] = crc32 & 0xFF;
        return result;
    }
}
UtilityVerifier._crc32Table = UtilityVerifier._buildTable(0xEDB88320);
UtilityVerifier._buffer = new Uint8Array(4096);

const Utility = {
    Verifier: UtilityVerifier,
    Encryption: UtilityEncryption,
    Random: UtilityRandom,
    Json: UtilityJson,
    Text: UtilityText,
    Converter: UtilityConverter,
    Path: UtilityPath,
    Compression: UtilityCompression,
};

/**
 * 泛型变量基类，对应原版 Variable<T>。
 * 所有 VarXxx 类型均继承此类，配合 ReferencePool 使用。
 */
class Variable {
    get value() { return this._value; }
    set value(v) { this._value = v; }
}
// ─── 基础类型 ──────────────────────────────────────────────────────────────
class VarBoolean extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarBoolean);
        v._value = value;
        return v;
    }
    clear() { this._value = false; }
}
class VarInt8 extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarInt8);
        v._value = value;
        return v;
    }
    clear() { this._value = 0; }
}
class VarUInt8 extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarUInt8);
        v._value = value;
        return v;
    }
    clear() { this._value = 0; }
}
class VarInt16 extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarInt16);
        v._value = value;
        return v;
    }
    clear() { this._value = 0; }
}
class VarUInt16 extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarUInt16);
        v._value = value;
        return v;
    }
    clear() { this._value = 0; }
}
class VarInt32 extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarInt32);
        v._value = value;
        return v;
    }
    clear() { this._value = 0; }
}
class VarUInt32 extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarUInt32);
        v._value = value;
        return v;
    }
    clear() { this._value = 0; }
}
/** 对应 C# long（64位整数），TS 中使用 number（精度有限），大数请用 VarBigInt */
class VarInt64 extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarInt64);
        v._value = value;
        return v;
    }
    clear() { this._value = 0; }
}
/** 对应 C# ulong。ES2015 不支持 bigint，使用 number 存储（超过 2^53 精度有限）。 */
class VarUInt64 extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarUInt64);
        v._value = value;
        return v;
    }
    clear() { this._value = 0; }
}
class VarFloat extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarFloat);
        v._value = value;
        return v;
    }
    clear() { this._value = 0; }
}
class VarDouble extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarDouble);
        v._value = value;
        return v;
    }
    clear() { this._value = 0; }
}
class VarChar extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarChar);
        v._value = value;
        return v;
    }
    clear() { this._value = ''; }
}
class VarString extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarString);
        v._value = value;
        return v;
    }
    clear() { this._value = ''; }
}
class VarByteArray extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarByteArray);
        v._value = value;
        return v;
    }
    clear() { this._value = new Uint8Array(0); }
}
class VarCharArray extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarCharArray);
        v._value = value;
        return v;
    }
    clear() { this._value = []; }
}
class VarDateTime extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarDateTime);
        v._value = value;
        return v;
    }
    clear() { this._value = new Date(0); }
}
/** 通用对象变量，对应 C# VarObject */
class VarObject extends Variable {
    static create(value) {
        const v = ReferencePool.acquire(VarObject);
        v._value = value;
        return v;
    }
    clear() { this._value = null; }
}
// ─── Cocos Creator 引擎类型（对应 Unity 特定 Var 类型）─────────────────────
// 注意：以下类型使用内联数值存储，避免在核心层 import 'cc'。
// 引擎层（CocosGameFramework）可直接 import 这些类并将 Cocos 类型赋给 .value。
/** 对应 C# VarVector2，存储 {x, y} */
class VarVec2 extends Variable {
    static create(x, y) {
        const v = ReferencePool.acquire(VarVec2);
        v._value = { x, y };
        return v;
    }
    clear() { this._value = { x: 0, y: 0 }; }
}
/** 对应 C# VarVector3，存储 {x, y, z} */
class VarVec3 extends Variable {
    static create(x, y, z) {
        const v = ReferencePool.acquire(VarVec3);
        v._value = { x, y, z };
        return v;
    }
    clear() { this._value = { x: 0, y: 0, z: 0 }; }
}
/** 对应 C# VarVector4，存储 {x, y, z, w} */
class VarVec4 extends Variable {
    static create(x, y, z, w) {
        const v = ReferencePool.acquire(VarVec4);
        v._value = { x, y, z, w };
        return v;
    }
    clear() { this._value = { x: 0, y: 0, z: 0, w: 0 }; }
}
/** 对应 C# VarQuaternion，存储 {x, y, z, w} */
class VarQuat extends Variable {
    static create(x, y, z, w) {
        const v = ReferencePool.acquire(VarQuat);
        v._value = { x, y, z, w };
        return v;
    }
    clear() { this._value = { x: 0, y: 0, z: 0, w: 1 }; }
}
/** 对应 C# VarColor，存储 {r, g, b, a}（0-255） */
class VarColor extends Variable {
    static create(r, g, b, a = 255) {
        const v = ReferencePool.acquire(VarColor);
        v._value = { r, g, b, a };
        return v;
    }
    clear() { this._value = { r: 0, g: 0, b: 0, a: 255 }; }
}
/** 对应 C# VarRect，存储 {x, y, width, height} */
class VarRect extends Variable {
    static create(x, y, width, height) {
        const v = ReferencePool.acquire(VarRect);
        v._value = { x, y, width, height };
        return v;
    }
    clear() { this._value = { x: 0, y: 0, width: 0, height: 0 }; }
}

class WebRequestStartEventArgs extends BaseEventArgs {
    get id() { return WebRequestStartEventArgs.eventId; }
    static create(serialId, webRequestUri, userData) {
        const e = ReferencePool.acquire(WebRequestStartEventArgs);
        e.serialId = serialId;
        e.webRequestUri = webRequestUri;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.webRequestUri = '';
        this.userData = undefined;
    }
}
WebRequestStartEventArgs.eventId = 'webRequest.start';
class WebRequestSuccessEventArgs extends BaseEventArgs {
    get id() { return WebRequestSuccessEventArgs.eventId; }
    static create(serialId, webRequestUri, responseData, userData) {
        const e = ReferencePool.acquire(WebRequestSuccessEventArgs);
        e.serialId = serialId;
        e.webRequestUri = webRequestUri;
        e.responseData = responseData;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.webRequestUri = '';
        this.responseData = new ArrayBuffer(0);
        this.userData = undefined;
    }
}
WebRequestSuccessEventArgs.eventId = 'webRequest.success';
class WebRequestFailureEventArgs extends BaseEventArgs {
    get id() { return WebRequestFailureEventArgs.eventId; }
    static create(serialId, webRequestUri, errorMessage, userData) {
        const e = ReferencePool.acquire(WebRequestFailureEventArgs);
        e.serialId = serialId;
        e.webRequestUri = webRequestUri;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }
    clear() {
        this.serialId = 0;
        this.webRequestUri = '';
        this.errorMessage = '';
        this.userData = undefined;
    }
}
WebRequestFailureEventArgs.eventId = 'webRequest.failure';

var WebRequestTaskStatus;
(function (WebRequestTaskStatus) {
    WebRequestTaskStatus[WebRequestTaskStatus["Todo"] = 0] = "Todo";
    WebRequestTaskStatus[WebRequestTaskStatus["Doing"] = 1] = "Doing";
    WebRequestTaskStatus[WebRequestTaskStatus["Done"] = 2] = "Done";
    WebRequestTaskStatus[WebRequestTaskStatus["Error"] = 3] = "Error";
})(WebRequestTaskStatus || (WebRequestTaskStatus = {}));
class WebRequestTask {
    constructor(webRequestUri, postData, headers, tag, priority, userData) {
        this.status = WebRequestTaskStatus.Todo;
        this.serialId = ++WebRequestTask._serial;
        this.webRequestUri = webRequestUri;
        this.postData = postData;
        this.headers = headers;
        this.tag = tag;
        this.priority = priority;
        this.userData = userData;
    }
}
WebRequestTask._serial = 0;
class WebRequestManager extends GameFrameworkModule {
    constructor() {
        super(...arguments);
        this._eventManager = null;
        this._waitingTasks = [];
        this._workingTasks = new Map();
        this._timeout = 30;
        this._maxConcurrent = 1;
    }
    get priority() { return 24; }
    get timeout() { return this._timeout; }
    set timeout(value) { this._timeout = value > 0 ? value : 30; }
    get maxConcurrent() { return this._maxConcurrent; }
    set maxConcurrent(value) { this._maxConcurrent = value > 0 ? value : 1; }
    get totalAgentCount() { return this._maxConcurrent; }
    get freeAgentCount() { return Math.max(0, this._maxConcurrent - this._workingTasks.size); }
    get workingAgentCount() { return this._workingTasks.size; }
    get waitingTaskCount() { return this._waitingTasks.length; }
    setEventManager(eventManager) {
        this._eventManager = eventManager;
    }
    addWebRequest(webRequestUri, params = {}) {
        if (!webRequestUri)
            throw new Error('webRequestUri is invalid.');
        const task = new WebRequestTask(webRequestUri, params.postData ?? null, params.headers ?? {}, params.tag ?? '', params.priority ?? 0, params.userData);
        this._enqueue(task);
        this._scheduleNext();
        return task.serialId;
    }
    removeWebRequest(serialId) {
        const waitingIdx = this._waitingTasks.findIndex(t => t.serialId === serialId);
        if (waitingIdx >= 0) {
            this._waitingTasks.splice(waitingIdx, 1);
            return true;
        }
        if (this._workingTasks.has(serialId)) {
            this._doCancelWebRequest(serialId);
            this._workingTasks.delete(serialId);
            return true;
        }
        return false;
    }
    removeWebRequests(tag) {
        let count = 0;
        this._waitingTasks = this._waitingTasks.filter(t => {
            if (t.tag === tag) {
                count++;
                return false;
            }
            return true;
        });
        this._workingTasks.forEach((task, id) => {
            if (task.tag === tag) {
                this._doCancelWebRequest(id);
                this._workingTasks.delete(id);
                count++;
            }
        });
        return count;
    }
    removeAllWebRequests() {
        const count = this._waitingTasks.length + this._workingTasks.size;
        this._waitingTasks = [];
        this._workingTasks.forEach((_, id) => this._doCancelWebRequest(id));
        this._workingTasks.clear();
        return count;
    }
    getWebRequestInfo(serialId) {
        const working = this._workingTasks.get(serialId);
        if (working)
            return working;
        return this._waitingTasks.find(t => t.serialId === serialId) ?? null;
    }
    getWebRequestInfosByTag(tag) {
        const result = [];
        this._waitingTasks.forEach(t => { if (t.tag === tag)
            result.push(t); });
        this._workingTasks.forEach(t => { if (t.tag === tag)
            result.push(t); });
        return result;
    }
    getAllWebRequestInfos() {
        const result = [...this._waitingTasks];
        this._workingTasks.forEach(t => result.push(t));
        return result;
    }
    update(_elapseSeconds, _realElapseSeconds) {
        this._scheduleNext();
    }
    shutdown() {
        this.removeAllWebRequests();
    }
    // ── called by concrete implementations ──────────────────────────────────
    _onWebRequestStart(serialId) {
        const task = this._workingTasks.get(serialId);
        if (!task)
            return;
        task.status = WebRequestTaskStatus.Doing;
        if (this._eventManager) {
            this._eventManager.fire(this, WebRequestStartEventArgs.create(task.serialId, task.webRequestUri, task.userData));
        }
    }
    _onWebRequestSuccess(serialId, responseData) {
        const task = this._workingTasks.get(serialId);
        if (!task)
            return;
        task.status = WebRequestTaskStatus.Done;
        this._workingTasks.delete(serialId);
        if (this._eventManager) {
            this._eventManager.fire(this, WebRequestSuccessEventArgs.create(task.serialId, task.webRequestUri, responseData, task.userData));
        }
        this._scheduleNext();
    }
    _onWebRequestFailure(serialId, errorMessage) {
        const task = this._workingTasks.get(serialId);
        if (!task)
            return;
        task.status = WebRequestTaskStatus.Error;
        this._workingTasks.delete(serialId);
        if (this._eventManager) {
            this._eventManager.fire(this, WebRequestFailureEventArgs.create(task.serialId, task.webRequestUri, errorMessage, task.userData));
        }
        this._scheduleNext();
    }
    // ── internals ────────────────────────────────────────────────────────────
    _enqueue(task) {
        let i = this._waitingTasks.length;
        while (i > 0 && this._waitingTasks[i - 1].priority < task.priority) {
            i--;
        }
        this._waitingTasks.splice(i, 0, task);
    }
    _scheduleNext() {
        while (this._workingTasks.size < this._maxConcurrent && this._waitingTasks.length > 0) {
            const task = this._waitingTasks.shift();
            this._workingTasks.set(task.serialId, task);
            this._doWebRequest(task);
        }
    }
}

export { ActiveSceneChangedEventArgs, AddressFamily, AttachEntitySuccessEventArgs, BaseEventArgs, BinaryExtension, CloseUIFormCompleteEventArgs, ConfigManager, DataNode, DataNodeManager, DataTable, DataTableManager, DetachEntitySuccessEventArgs, DownloadFailureEventArgs, DownloadManager, DownloadStartEventArgs, DownloadSuccessEventArgs, DownloadTask, DownloadTaskStatus, DownloadUpdateEventArgs, EntityManager, EntityStatus, EventManager, EventPoolMode, FileSystem, FileSystemAccess, FileSystemManager, FileSystemStream, Fsm, FsmManager, FsmState, GameEventArgs, GameFrameworkEntry, GameFrameworkError, GameFrameworkLinkedList, GameFrameworkLinkedListRange, GameFrameworkLog, GameFrameworkLogLevel, GameFrameworkModule, GameFrameworkMultiDictionary, HasAssetResult, HideEntityCompleteEventArgs, INVALID_FILE_INFO, LinkedListNode, LoadAssetFailureEventArgs, LoadAssetSuccessEventArgs, LoadSceneFailureEventArgs, LoadSceneSuccessEventArgs, LoadSceneUpdateEventArgs, LocalizationManager, MODULE_ID, NetworkClosedEventArgs, NetworkConnectedEventArgs, NetworkCustomErrorEventArgs, NetworkErrorCode, NetworkErrorEventArgs, NetworkManager, NetworkMissHeartBeatEventArgs, ObjectBase, ObjectInfo, ObjectPool, ObjectPoolManager, OpenUIFormDependencyAssetEventArgs, OpenUIFormFailureEventArgs, OpenUIFormSuccessEventArgs, OpenUIFormUpdateEventArgs, Packet, PlaySoundDependencyAssetEventArgs, PlaySoundErrorCode, PlaySoundFailureEventArgs, PlaySoundParams, PlaySoundSuccessEventArgs, PlaySoundUpdateEventArgs, ProcedureBase, ProcedureManager, ReferencePool, ReferencePoolInfo, ResourceApplyFailureEventArgs, ResourceApplyStartEventArgs, ResourceApplySuccessEventArgs, ResourceLoadSceneFailureEventArgs, ResourceLoadSceneSuccessEventArgs, ResourceUnloadSceneFailureEventArgs, ResourceUnloadSceneSuccessEventArgs, ResourceUpdateAllCompleteEventArgs, ResourceUpdateChangedEventArgs, ResourceUpdateFailureEventArgs, ResourceUpdateStartEventArgs, ResourceUpdateSuccessEventArgs, ResourceVerifyFailureEventArgs, ResourceVerifyStartEventArgs, ResourceVerifySuccessEventArgs, SceneManager, SeekOrigin, ServiceType, SettingManager, ShowEntityFailureEventArgs, ShowEntitySuccessEventArgs, SoundAgent, SoundGroup, SoundManager, StartTaskStatus, StringExtension, TaskBase, TaskInfo, TaskPool, TaskStatus, UIManager, UnloadSceneFailureEventArgs, UnloadSceneSuccessEventArgs, Utility, UtilityCompression, UtilityConverter, UtilityEncryption, UtilityJson, UtilityPath, UtilityRandom, UtilityText, UtilityVerifier, VarBoolean, VarByteArray, VarChar, VarCharArray, VarColor, VarDateTime, VarDouble, VarFloat, VarInt16, VarInt32, VarInt64, VarInt8, VarObject, VarQuat, VarRect, VarString, VarUInt16, VarUInt32, VarUInt64, VarUInt8, VarVec2, VarVec3, VarVec4, Variable, WebRequestFailureEventArgs, WebRequestManager, WebRequestStartEventArgs, WebRequestSuccessEventArgs, WebRequestTask, WebRequestTaskStatus, makeFileInfo };
