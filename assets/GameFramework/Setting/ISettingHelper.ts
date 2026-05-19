export interface ISettingHelper {
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
