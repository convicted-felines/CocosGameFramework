import { sys, _decorator } from 'cc';
import { ILocalizationManager } from '../../GameFramework/Localization/ILocalizationManager';
import { LocalizationHelperBase } from './LocalizationHelperBase';
import { HelperRegistry } from '../Base/HelperRegistry';

const { ccclass } = _decorator;

/**
 * 默认本地化辅助器。
 *
 * 支持三种文本格式（parseData）：
 *   1. JSON 对象：{ "key": "value", ... }
 *   2. JSON 数组：[{ "key": "k", "value": "v" }, ...]
 *   3. Tab 分隔文本：每行 <key>\t<value>，以 '#' 开头的行为注释行
 *
 * 支持二进制格式（parseDataFromBytes）：
 *   UTF-8 编码的 JSON 或 Tab 分隔文本。
 */
@ccclass('DefaultLocalizationHelper')
export class DefaultLocalizationHelper extends LocalizationHelperBase {
    /** 返回系统语言的 BCP-47 标签（如 'zh-CN'、'en-US'）。 */
    get systemLanguage(): string {
        return sys.languageCode ?? 'en';
    }

    parseData(localizationManager: ILocalizationManager, dictionaryString: string, userData?: any): boolean {
        const trimmed = dictionaryString.trim();

        if (trimmed.charAt(0) === '{' || trimmed.charAt(0) === '[') {
            return this._parseJson(localizationManager, trimmed);
        }

        return this._parseTsv(localizationManager, trimmed);
    }

    parseDataFromBytes(localizationManager: ILocalizationManager, dictionaryBytes: ArrayBuffer, userData?: any): boolean {
        const text = new TextDecoder('utf-8').decode(dictionaryBytes);
        return this.parseData(localizationManager, text, userData);
    }

    releaseDataAsset(_localizationManager: ILocalizationManager, _dictionaryAsset: object): void {
        // Cocos Creator 通过 ResourceManager.releaseAsset 统一释放，此处无需额外操作。
    }

    private _parseJson(manager: ILocalizationManager, json: string): boolean {
        let parsed: unknown;
        try {
            parsed = JSON.parse(json);
        } catch {
            return false;
        }

        if (Array.isArray(parsed)) {
            const data: Array<{ key: string; value: string }> = parsed as any;
            manager.loadDictionary(data);
        } else if (typeof parsed === 'object' && parsed !== null) {
            manager.loadDictionary(parsed as Record<string, string>);
        } else {
            return false;
        }

        return true;
    }

    private _parseTsv(manager: ILocalizationManager, text: string): boolean {
        const dict: Record<string, string> = {};
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.charAt(0) === '#') continue;

            const tabIndex = trimmed.indexOf('\t');
            if (tabIndex === -1) continue;

            const key = trimmed.substring(0, tabIndex).trim();
            const value = trimmed.substring(tabIndex + 1);
            if (key) dict[key] = value;
        }
        manager.loadDictionary(dict);
        return true;
    }
}

HelperRegistry.register('DefaultLocalizationHelper', DefaultLocalizationHelper);
