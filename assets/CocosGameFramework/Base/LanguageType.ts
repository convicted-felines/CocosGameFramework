import { Enum } from 'cc';

export enum LanguageType {
    SystemLanguage     = 0,  // 跟随系统自动识别
    ChineseSimplified  = 1,  // zh-CN
    ChineseTraditional = 2,  // zh-TW
    English            = 3,  // en-US
    Japanese           = 4,  // ja-JP
    Korean             = 5,  // ko-KR
    French             = 6,  // fr-FR
    German             = 7,  // de-DE
    Spanish            = 8,  // es-ES
}

/** 枚举值 → BCP-47 语言标签（SystemLanguage 不在此表中，由 helper 动态获取）*/
export const LanguageTag: Partial<Record<LanguageType, string>> = {
    [LanguageType.ChineseSimplified]:  'zh-CN',
    [LanguageType.ChineseTraditional]: 'zh-TW',
    [LanguageType.English]:            'en-US',
    [LanguageType.Japanese]:           'ja-JP',
    [LanguageType.Korean]:             'ko-KR',
    [LanguageType.French]:             'fr-FR',
    [LanguageType.German]:             'de-DE',
    [LanguageType.Spanish]:            'es-ES',
};

Enum(LanguageType);
