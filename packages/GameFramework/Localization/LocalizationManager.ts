import { GameFrameworkModule } from '../Base/GameFrameworkModule';
import { ILocalizationHelper } from './ILocalizationHelper';
import { ILocalizationManager } from './ILocalizationManager';

export class LocalizationManager extends GameFrameworkModule implements ILocalizationManager {
    private _dictionary: Map<string, string> = new Map();
    private _language: string = 'zh-CN';
    private _helper: ILocalizationHelper | null = null;

    get priority(): number { return 68; }
    get language(): string { return this._language; }
    set language(value: string) { this._language = value; }
    get dictionaryCount(): number { return this._dictionary.size; }
    get helper(): ILocalizationHelper | null { return this._helper; }

    setHelper(helper: ILocalizationHelper): void {
        this._helper = helper;
    }

    loadDictionary(data: Record<string, string> | Array<{ key: string; value: string }>): void {
        if (Array.isArray(data)) {
            for (const item of data) {
                this._dictionary.set(item.key, item.value);
            }
        } else {
            for (const key of Object.keys(data)) {
                this._dictionary.set(key, data[key]);
            }
        }
    }

    clearDictionary(): void {
        this._dictionary.clear();
    }

    hasString(key: string): boolean {
        return this._dictionary.has(key);
    }

    getString(key: string, defaultValue: string = key): string {
        return this._dictionary.get(key) ?? defaultValue;
    }

    format(key: string, ...args: (string | number)[]): string {
        const template = this.getString(key);
        return template.replace(/\{(\d+)\}/g, (_, idx) => {
            const i = parseInt(idx, 10);
            return i < args.length ? String(args[i]) : `{${idx}}`;
        });
    }

    update(_e: number, _r: number): void {}

    shutdown(): void {
        this._dictionary.clear();
    }
}
