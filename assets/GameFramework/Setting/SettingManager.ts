import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { ISettingManager } from './ISettingManager';
import { ISettingHelper } from './ISettingHelper';

export class SettingManager extends GameFrameworkModule implements ISettingManager {
    private _helper: ISettingHelper | null = null;

    get priority(): number { return 70; }

    get count(): number {
        this._checkHelper();
        return this._helper!.count;
    }

    setSettingHelper(settingHelper: ISettingHelper): void {
        if (!settingHelper) {
            throw new GameFrameworkError('Setting helper is invalid.');
        }
        this._helper = settingHelper;
    }

    load(): boolean {
        this._checkHelper();
        return this._helper!.load();
    }

    save(): boolean {
        this._checkHelper();
        return this._helper!.save();
    }

    getAllSettingNames(): string[] {
        this._checkHelper();
        return this._helper!.getAllSettingNames();
    }

    hasKey(settingName: string): boolean {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper!.hasKey(settingName);
    }

    removeKey(settingName: string): boolean {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper!.removeKey(settingName);
    }

    removeAllSettings(): void {
        this._checkHelper();
        this._helper!.removeAllSettings();
    }

    getBool(settingName: string, defaultValue: boolean = false): boolean {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper!.getBool(settingName, defaultValue);
    }

    setBool(settingName: string, value: boolean): void {
        this._checkHelper();
        this._checkName(settingName);
        this._helper!.setBool(settingName, value);
    }

    getInt(settingName: string, defaultValue: number = 0): number {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper!.getInt(settingName, defaultValue);
    }

    setInt(settingName: string, value: number): void {
        this._checkHelper();
        this._checkName(settingName);
        this._helper!.setInt(settingName, value);
    }

    getFloat(settingName: string, defaultValue: number = 0): number {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper!.getFloat(settingName, defaultValue);
    }

    setFloat(settingName: string, value: number): void {
        this._checkHelper();
        this._checkName(settingName);
        this._helper!.setFloat(settingName, value);
    }

    getString(settingName: string, defaultValue: string = ''): string {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper!.getString(settingName, defaultValue);
    }

    setString(settingName: string, value: string): void {
        this._checkHelper();
        this._checkName(settingName);
        this._helper!.setString(settingName, value);
    }

    getObject<T>(settingName: string, defaultValue: T | null = null): T | null {
        this._checkHelper();
        this._checkName(settingName);
        return this._helper!.getObject<T>(settingName, defaultValue);
    }

    setObject<T>(settingName: string, obj: T): void {
        this._checkHelper();
        this._checkName(settingName);
        this._helper!.setObject<T>(settingName, obj);
    }

    update(_elapseSeconds: number, _realElapseSeconds: number): void {}

    shutdown(): void {
        if (this._helper) {
            this._helper.save();
        }
    }

    private _checkHelper(): void {
        if (!this._helper) {
            throw new GameFrameworkError('Setting helper is invalid.');
        }
    }

    private _checkName(settingName: string): void {
        if (!settingName) {
            throw new GameFrameworkError('Setting name is invalid.');
        }
    }
}
