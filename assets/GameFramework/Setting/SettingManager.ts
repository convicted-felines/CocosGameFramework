import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { ISettingManager } from './ISettingManager';
import { sys } from 'cc';

// Web 平台使用 localStorage，Native 平台使用 sys.localStorage（JSB 等效实现）
export class SettingManager extends GameFrameworkModule implements ISettingManager {
    private _storage: Storage = sys.localStorage as unknown as Storage;

    get priority(): number { return 70; }

    load(): void {
        // localStorage 无需显式 load，已持久化
    }

    save(): void {
        // localStorage 自动持久化，无需显式 save
    }

    hasKey(key: string): boolean {
        return this._storage.getItem(key) !== null;
    }

    removeKey(key: string): void {
        this._storage.removeItem(key);
    }

    getInt(key: string, defaultValue: number = 0): number {
        const v = this._storage.getItem(key);
        if (v === null) return defaultValue;
        const parsed = parseInt(v, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    getFloat(key: string, defaultValue: number = 0): number {
        const v = this._storage.getItem(key);
        if (v === null) return defaultValue;
        const parsed = parseFloat(v);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    getBool(key: string, defaultValue: boolean = false): boolean {
        const v = this._storage.getItem(key);
        if (v === null) return defaultValue;
        return v === 'true';
    }

    getString(key: string, defaultValue: string = ''): string {
        return this._storage.getItem(key) ?? defaultValue;
    }

    getObject<T>(key: string, defaultValue: T | null = null): T | null {
        const v = this._storage.getItem(key);
        if (v === null) return defaultValue;
        try {
            return JSON.parse(v) as T;
        } catch {
            return defaultValue;
        }
    }

    setInt(key: string, value: number): void {
        this._storage.setItem(key, String(Math.trunc(value)));
    }

    setFloat(key: string, value: number): void {
        this._storage.setItem(key, String(value));
    }

    setBool(key: string, value: boolean): void {
        this._storage.setItem(key, value ? 'true' : 'false');
    }

    setString(key: string, value: string): void {
        this._storage.setItem(key, value);
    }

    setObject<T>(key: string, value: T): void {
        this._storage.setItem(key, JSON.stringify(value));
    }

    update(_e: number, _r: number): void {}

    shutdown(): void {}
}
