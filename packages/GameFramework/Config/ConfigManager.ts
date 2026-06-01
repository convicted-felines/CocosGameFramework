import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { GameFrameworkError } from '../Base/GameFrameworkError';
import { IConfigManager } from './IConfigManager';
import { IConfigHelper } from './IConfigHelper';

export class ConfigManager extends GameFrameworkModule implements IConfigManager {
    private _helper: IConfigHelper | null = null;
    private readonly _configs: Map<string, string> = new Map();

    get priority(): number { return 68; }
    get count(): number { return this._configs.size; }

    setConfigHelper(helper: IConfigHelper): void {
        if (!helper) {
            throw new GameFrameworkError('Config helper is invalid.');
        }
        this._helper = helper;
    }

    parseData(configString: string, userData?: any): boolean {
        if (!this._helper) {
            throw new GameFrameworkError('Config helper is invalid.');
        }
        return this._helper.parseData(configString, userData);
    }

    hasConfig(configName: string): boolean {
        this._checkName(configName);
        return this._configs.has(configName);
    }

    addConfig(configName: string, configValue: string): boolean {
        this._checkName(configName);
        if (this._configs.has(configName)) {
            return false;
        }
        this._configs.set(configName, configValue);
        return true;
    }

    removeConfig(configName: string): boolean {
        this._checkName(configName);
        return this._configs.delete(configName);
    }

    removeAllConfigs(): void {
        this._configs.clear();
    }

    getBool(configName: string, defaultValue: boolean = false): boolean {
        this._checkName(configName);
        const raw = this._configs.get(configName);
        if (raw === undefined) return defaultValue;
        const lower = raw.trim().toLowerCase();
        if (lower === 'true' || lower === '1') return true;
        if (lower === 'false' || lower === '0') return false;
        return defaultValue;
    }

    getInt(configName: string, defaultValue: number = 0): number {
        this._checkName(configName);
        const raw = this._configs.get(configName);
        if (raw === undefined) return defaultValue;
        const v = parseInt(raw, 10);
        return isNaN(v) ? defaultValue : v;
    }

    getFloat(configName: string, defaultValue: number = 0): number {
        this._checkName(configName);
        const raw = this._configs.get(configName);
        if (raw === undefined) return defaultValue;
        const v = parseFloat(raw);
        return isNaN(v) ? defaultValue : v;
    }

    getString(configName: string, defaultValue: string = ''): string {
        this._checkName(configName);
        return this._configs.get(configName) ?? defaultValue;
    }

    update(_elapseSeconds: number, _realElapseSeconds: number): void {}

    shutdown(): void {
        this._configs.clear();
    }

    private _checkName(configName: string): void {
        if (!configName) {
            throw new GameFrameworkError('Config name is invalid.');
        }
    }
}
