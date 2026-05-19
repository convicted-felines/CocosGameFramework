import { ILocalizationHelper } from './ILocalizationHelper';

export interface ILocalizationManager {
    /** 当前已绑定的本地化辅助器，未设置时为 null。 */
    readonly helper: ILocalizationHelper | null;

    /** 设置本地化辅助器。 */
    setHelper(helper: ILocalizationHelper): void;
    language: string;

    readonly dictionaryCount: number;

    /** Load a flat key→value dictionary (JSON object or array of {key, value}). */
    loadDictionary(data: Record<string, string> | Array<{ key: string; value: string }>): void;

    /** Clear all loaded strings. */
    clearDictionary(): void;

    hasString(key: string): boolean;

    getString(key: string, defaultValue?: string): string;

    /** sprintf-style formatting: {0}, {1} placeholders. */
    format(key: string, ...args: (string | number)[]): string;
}
