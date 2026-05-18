import { _decorator, Component } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { SettingManager } from '../../GameFramework/Setting/SettingManager';

const { ccclass } = _decorator;

@ccclass('SettingComponent')
export class SettingComponent extends Component {
    private _manager!: SettingManager;

    get manager(): SettingManager { return this._manager; }

    onLoad(): void {
        this._manager = new SettingManager();
        GameFrameworkEntry.registerModule(MODULE_ID.SETTING, this._manager);
    }

    load(): void { this._manager.load(); }
    save(): void { this._manager.save(); }

    hasKey(key: string): boolean { return this._manager.hasKey(key); }
    removeKey(key: string): void { this._manager.removeKey(key); }

    getInt(key: string, defaultValue?: number): number { return this._manager.getInt(key, defaultValue); }
    getFloat(key: string, defaultValue?: number): number { return this._manager.getFloat(key, defaultValue); }
    getBool(key: string, defaultValue?: boolean): boolean { return this._manager.getBool(key, defaultValue); }
    getString(key: string, defaultValue?: string): string { return this._manager.getString(key, defaultValue); }
    getObject<T>(key: string, defaultValue?: T): T | null { return this._manager.getObject<T>(key, defaultValue); }

    setInt(key: string, value: number): void { this._manager.setInt(key, value); }
    setFloat(key: string, value: number): void { this._manager.setFloat(key, value); }
    setBool(key: string, value: boolean): void { this._manager.setBool(key, value); }
    setString(key: string, value: string): void { this._manager.setString(key, value); }
    setObject<T>(key: string, value: T): void { this._manager.setObject<T>(key, value); }
}
