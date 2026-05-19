import { sys, _decorator } from 'cc';
import { SettingHelperBase } from './SettingHelperBase';

const { ccclass } = _decorator;

@ccclass('LocalStorageSettingHelper')
export class LocalStorageSettingHelper extends SettingHelperBase {
    private _storage: any = sys.localStorage;

    get count(): number {
        return this._storage.length ?? 0;
    }

    load(): boolean {
        return true;
    }

    save(): boolean {
        return true;
    }

    getAllSettingNames(): string[] {
        const names: string[] = [];
        const len: number = this._storage.length ?? 0;
        for (let i = 0; i < len; i++) {
            const key = this._storage.key(i);
            if (key !== null) {
                names.push(key);
            }
        }
        return names;
    }

    hasKey(settingName: string): boolean {
        return this._storage.getItem(settingName) !== null;
    }

    removeKey(settingName: string): boolean {
        if (!this.hasKey(settingName)) return false;
        this._storage.removeItem(settingName);
        return true;
    }

    removeAllSettings(): void {
        this._storage.clear();
    }

    getBool(settingName: string, defaultValue: boolean = false): boolean {
        const v: string | null = this._storage.getItem(settingName);
        if (v === null) return defaultValue;
        return v === 'true';
    }

    setBool(settingName: string, value: boolean): void {
        this._storage.setItem(settingName, value ? 'true' : 'false');
    }

    getInt(settingName: string, defaultValue: number = 0): number {
        const v: string | null = this._storage.getItem(settingName);
        if (v === null) return defaultValue;
        const parsed = parseInt(v, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    setInt(settingName: string, value: number): void {
        this._storage.setItem(settingName, String(Math.trunc(value)));
    }

    getFloat(settingName: string, defaultValue: number = 0): number {
        const v: string | null = this._storage.getItem(settingName);
        if (v === null) return defaultValue;
        const parsed = parseFloat(v);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    setFloat(settingName: string, value: number): void {
        this._storage.setItem(settingName, String(value));
    }

    getString(settingName: string, defaultValue: string = ''): string {
        return this._storage.getItem(settingName) ?? defaultValue;
    }

    setString(settingName: string, value: string): void {
        this._storage.setItem(settingName, value);
    }

    getObject<T>(settingName: string, defaultValue: T | null = null): T | null {
        const v: string | null = this._storage.getItem(settingName);
        if (v === null) return defaultValue;
        try {
            return JSON.parse(v) as T;
        } catch {
            return defaultValue;
        }
    }

    setObject<T>(settingName: string, obj: T): void {
        this._storage.setItem(settingName, JSON.stringify(obj));
    }
}
