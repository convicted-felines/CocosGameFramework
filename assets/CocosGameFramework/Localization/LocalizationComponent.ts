import { _decorator, Enum } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { LocalizationManager } from '../../GameFramework/Localization/LocalizationManager';
import { DefaultLocalizationHelper } from './DefaultLocalizationHelper';
import { LocalizationHelperBase } from './LocalizationHelperBase';
import { HelperRegistry } from '../Utility/HelperRegistry';
import { LocalizationHelperType } from './LocalizationHelperType';
import { BaseComponent } from '../Base/BaseComponent';
import { LanguageTag, LanguageType } from '../Base/LanguageType';

const { ccclass, property } = _decorator;

@ccclass('LocalizationComponent')
export class LocalizationComponent extends GameFrameworkComponent {
    @property({ type: Enum(LocalizationHelperType), tooltip: '本地化辅助器类型' })
    localizationHelperType: LocalizationHelperType = LocalizationHelperType.DefaultLocalizationHelper;

    private _manager!: LocalizationManager;

    get manager(): LocalizationManager { return this._manager; }

    // 对应原版 Awake：只创建并注册 Manager，不触碰任何跨组件依赖
    onLoad(): void {
        super.onLoad();
        this._manager = new LocalizationManager();
        GameFrameworkEntry.registerModule(MODULE_ID.LOCALIZATION, this._manager);
    }

    // 对应原版 Start：此时所有组件的 onLoad 已完成，可以安全访问 BaseComponent
    start(): void {
        const helper = HelperRegistry.createHelper(
            this.node,
            LocalizationHelperType[this.localizationHelperType],
            DefaultLocalizationHelper,
        ) as LocalizationHelperBase;
        this._manager.setHelper(helper);

        const base = GameFrameworkComponent.getComponent(BaseComponent);
        const editorLang = base?.editorLanguage ?? LanguageType.SystemLanguage;
        this._manager.language = editorLang === LanguageType.SystemLanguage
            ? helper.systemLanguage
            : (LanguageTag[editorLang] ?? helper.systemLanguage);
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
