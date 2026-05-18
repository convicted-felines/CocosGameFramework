export interface ISettingManager {
    load(): void;
    save(): void;

    hasKey(key: string): boolean;
    removeKey(key: string): void;

    getInt(key: string, defaultValue?: number): number;
    getFloat(key: string, defaultValue?: number): number;
    getBool(key: string, defaultValue?: boolean): boolean;
    getString(key: string, defaultValue?: string): string;
    getObject<T>(key: string, defaultValue?: T): T | null;

    setInt(key: string, value: number): void;
    setFloat(key: string, value: number): void;
    setBool(key: string, value: boolean): void;
    setString(key: string, value: string): void;
    setObject<T>(key: string, value: T): void;
}
