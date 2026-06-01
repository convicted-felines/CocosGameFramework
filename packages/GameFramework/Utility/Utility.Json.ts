export interface IJsonHelper {
    toJson(obj: object): string;
    toObject<T>(json: string): T;
    toObjectOfType(type: new (...args: any[]) => any, json: string): any;
}

class DefaultJsonHelper implements IJsonHelper {
    toJson(obj: object): string {
        return JSON.stringify(obj);
    }

    toObject<T>(json: string): T {
        return JSON.parse(json) as T;
    }

    toObjectOfType(_type: new (...args: any[]) => any, json: string): any {
        return JSON.parse(json);
    }
}

export class UtilityJson {
    private static _helper: IJsonHelper = new DefaultJsonHelper();

    static setJsonHelper(helper: IJsonHelper): void {
        this._helper = helper;
    }

    static toJson(obj: object): string {
        if (!this._helper) throw new Error('[Utility.Json] JSON helper is not set.');
        return this._helper.toJson(obj);
    }

    static toObject<T>(json: string): T {
        if (!this._helper) throw new Error('[Utility.Json] JSON helper is not set.');
        return this._helper.toObject<T>(json);
    }

    static toObjectOfType<T>(type: new (...args: any[]) => T, json: string): T {
        if (!this._helper) throw new Error('[Utility.Json] JSON helper is not set.');
        return this._helper.toObjectOfType(type, json) as T;
    }
}
