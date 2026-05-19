import { _decorator } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { LocalizationManager } from '../../GameFramework/Localization/LocalizationManager';

const { ccclass, property } = _decorator;

@ccclass('LocalizationComponent')
export class LocalizationComponent extends GameFrameworkComponent {
    /** 默认语言标签，如 'zh-CN'、'en-US' */
    @property({ tooltip: '默认语言标签（如 zh-CN、en-US）' })
    defaultLanguage: string = 'zh-CN';

    private _manager!: LocalizationManager;

    get manager(): LocalizationManager { return this._manager; }

    onLoad(): void {
        super.onLoad();
        this._manager = new LocalizationManager();
        this._manager.language = this.defaultLanguage;
        GameFrameworkEntry.registerModule(MODULE_ID.LOCALIZATION, this._manager);
    }

    get language(): string { return this._manager.language; }
    set language(value: string) { this._manager.language = value; }

    get dictionaryCount(): number { return this._manager.dictionaryCount; }

    loadDictionary(data: Record<string, string> | Array<{ key: string; value: string }>): void {
        this._manager.loadDictionary(data);
    }

    clearDictionary(): void {
        this._manager.clearDictionary();
    }

    hasString(key: string): boolean {
        return this._manager.hasString(key);
    }

    getString(key: string, defaultValue?: string): string {
        return this._manager.getString(key, defaultValue);
    }

    format(key: string, ...args: (string | number)[]): string {
        return this._manager.format(key, ...args);
    }
}
