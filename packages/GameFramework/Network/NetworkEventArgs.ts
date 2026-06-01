import { BaseEventArgs } from '../Event/BaseEventArgs';
import { ReferencePool } from '../ReferencePool/ReferencePool';

/** 网络连接成功事件 */
export class NetworkConnectedEventArgs extends BaseEventArgs {
    static readonly eventId = 'network.connected';
    get id(): string { return NetworkConnectedEventArgs.eventId; }

    channelName!: string;
    userData?: object;

    static create(channelName: string, userData?: object): NetworkConnectedEventArgs {
        const e = ReferencePool.acquire(NetworkConnectedEventArgs);
        e.channelName = channelName;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.channelName = '';
        this.userData = undefined;
    }
}

/** 网络连接关闭事件 */
export class NetworkClosedEventArgs extends BaseEventArgs {
    static readonly eventId = 'network.closed';
    get id(): string { return NetworkClosedEventArgs.eventId; }

    channelName!: string;
    code!: number;
    reason!: string;

    static create(channelName: string, code: number, reason: string): NetworkClosedEventArgs {
        const e = ReferencePool.acquire(NetworkClosedEventArgs);
        e.channelName = channelName;
        e.code = code;
        e.reason = reason;
        return e;
    }

    clear(): void {
        this.channelName = '';
        this.code = 0;
        this.reason = '';
    }
}

/** 心跳包丢失事件 */
export class NetworkMissHeartBeatEventArgs extends BaseEventArgs {
    static readonly eventId = 'network.missHeartBeat';
    get id(): string { return NetworkMissHeartBeatEventArgs.eventId; }

    channelName!: string;
    missCount!: number;

    static create(channelName: string, missCount: number): NetworkMissHeartBeatEventArgs {
        const e = ReferencePool.acquire(NetworkMissHeartBeatEventArgs);
        e.channelName = channelName;
        e.missCount = missCount;
        return e;
    }

    clear(): void {
        this.channelName = '';
        this.missCount = 0;
    }
}

/** 网络错误事件 */
export class NetworkErrorEventArgs extends BaseEventArgs {
    static readonly eventId = 'network.error';
    get id(): string { return NetworkErrorEventArgs.eventId; }

    channelName!: string;
    errorMessage!: string;

    static create(channelName: string, errorMessage: string): NetworkErrorEventArgs {
        const e = ReferencePool.acquire(NetworkErrorEventArgs);
        e.channelName = channelName;
        e.errorMessage = errorMessage;
        return e;
    }

    clear(): void {
        this.channelName = '';
        this.errorMessage = '';
    }
}

/** 用户自定义网络错误事件 */
export class NetworkCustomErrorEventArgs extends BaseEventArgs {
    static readonly eventId = 'network.customError';
    get id(): string { return NetworkCustomErrorEventArgs.eventId; }

    channelName!: string;
    customErrorData?: object;

    static create(channelName: string, customErrorData?: object): NetworkCustomErrorEventArgs {
        const e = ReferencePool.acquire(NetworkCustomErrorEventArgs);
        e.channelName = channelName;
        e.customErrorData = customErrorData;
        return e;
    }

    clear(): void {
        this.channelName = '';
        this.customErrorData = undefined;
    }
}
