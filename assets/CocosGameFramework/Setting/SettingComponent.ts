import { _decorator } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { SettingManager } from '../../GameFramework/Setting/SettingManager';
import { LocalStorageSettingHelper } from './LocalStorageSettingHelper';

const { ccclass } = _decorator;

@ccclass('SettingComponent')
export class SettingComponent extends GameFrameworkComponent {
    private _manager!: SettingManager;

    get manager(): SettingManager { return this._manager; }

    get count(): number { return this._manager.count; }

    onLoad(): void {
        super.onLoad();
        this._manager = new SettingManager();
        this._manager.setSettingHelper(new LocalStorageSettingHelper());
        GameFrameworkEntry.registerModule(MODULE_ID.SETTING, this._manager);
        this._manager.load();
    }

    save(): boolean { return this._manager.save(); }

    getAllSettingNames(): string[] { return this._manager.getAllSettingNames(); }

    hasKey(settingName: string): boolean { return this._manager.hasKey(settingName); }
    removeKey(settingName: string): boolean { return this._manager.removeKey(settingName); }
    removeAllSettings(): void { this._manager.removeAllSettings(); }

    getBool(settingName: string, defaultValue?: boolean): boolean { return this._manager.getBool(settingName, defaultValue); }
    setBool(settingName: string, value: boolean): void { this._manager.setBool(settingName, value); }

    getInt(settingName: string, defaultValue?: number): number { return this._manager.getInt(settingName, defaultValue); }
    setInt(settingName: string, value: number): void { this._manager.setInt(settingName, value); }

    getFloat(settingName: string, defaultValue?: number): number { return this._manager.getFloat(settingName, defaultValue); }
    setFloat(settingName: string, value: number): void { this._manager.setFloat(settingName, value); }

    getString(settingName: string, defaultValue?: string): string { return this._manager.getString(settingName, defaultValue); }
    setString(settingName: string, value: string): void { this._manager.setString(settingName, value); }

    getObject<T>(settingName: string, defaultValue?: T | null): T | null { return this._manager.getObject<T>(settingName, defaultValue); }
    setObject<T>(settingName: string, obj: T): void { this._manager.setObject<T>(settingName, obj); }
}
