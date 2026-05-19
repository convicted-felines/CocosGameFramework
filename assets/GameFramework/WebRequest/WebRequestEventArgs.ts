import { BaseEventArgs } from '../Event/BaseEventArgs';
import { ReferencePool } from '../ReferencePool/ReferencePool';

export class WebRequestStartEventArgs extends BaseEventArgs {
    static readonly eventId = 'webRequest.start';
    get id(): string { return WebRequestStartEventArgs.eventId; }

    serialId!: number;
    webRequestUri!: string;
    userData?: object;

    static create(serialId: number, webRequestUri: string, userData?: object): WebRequestStartEventArgs {
        const e = ReferencePool.acquire(WebRequestStartEventArgs);
        e.serialId = serialId;
        e.webRequestUri = webRequestUri;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.webRequestUri = '';
        this.userData = undefined;
    }
}

export class WebRequestSuccessEventArgs extends BaseEventArgs {
    static readonly eventId = 'webRequest.success';
    get id(): string { return WebRequestSuccessEventArgs.eventId; }

    serialId!: number;
    webRequestUri!: string;
    /** 响应体，GET 请求为 ArrayBuffer，也可能是文本 */
    responseData!: ArrayBuffer;
    userData?: object;

    static create(serialId: number, webRequestUri: string, responseData: ArrayBuffer, userData?: object): WebRequestSuccessEventArgs {
        const e = ReferencePool.acquire(WebRequestSuccessEventArgs);
        e.serialId = serialId;
        e.webRequestUri = webRequestUri;
        e.responseData = responseData;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.webRequestUri = '';
        this.responseData = new ArrayBuffer(0);
        this.userData = undefined;
    }
}

export class WebRequestFailureEventArgs extends BaseEventArgs {
    static readonly eventId = 'webRequest.failure';
    get id(): string { return WebRequestFailureEventArgs.eventId; }

    serialId!: number;
    webRequestUri!: string;
    errorMessage!: string;
    userData?: object;

    static create(serialId: number, webRequestUri: string, errorMessage: string, userData?: object): WebRequestFailureEventArgs {
        const e = ReferencePool.acquire(WebRequestFailureEventArgs);
        e.serialId = serialId;
        e.webRequestUri = webRequestUri;
        e.errorMessage = errorMessage;
        e.userData = userData;
        return e;
    }

    clear(): void {
        this.serialId = 0;
        this.webRequestUri = '';
        this.errorMessage = '';
        this.userData = undefined;
    }
}
