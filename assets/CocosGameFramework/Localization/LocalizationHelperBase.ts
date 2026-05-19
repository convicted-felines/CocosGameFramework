import { Component, _decorator } from 'cc';
import { ILocalizationHelper } from '../../GameFramework/Localization/ILocalizationHelper';
import { ILocalizationManager } from '../../GameFramework/Localization/ILocalizationManager';

const { ccclass } = _decorator;

/**
 * 本地化辅助器基类。
 *
 * 继承此类并实现抽象方法，即可替换字典数据的解析策略（如 JSON、Tab 分隔、二进制等）。
 * 将具体实现组件挂载到场景节点后，在 LocalizationComponent 的 localizationHelper 属性处拖入该节点。
 */
@ccclass('LocalizationHelperBase')
export abstract class LocalizationHelperBase extends Component implements ILocalizationHelper {
    abstract get systemLanguage(): string;

    abstract parseData(localizationManager: ILocalizationManager, dictionaryString: string, userData?: any): boolean;

    abstract parseDataFromBytes(localizationManager: ILocalizationManager, dictionaryBytes: ArrayBuffer, userData?: any): boolean;

    abstract releaseDataAsset(localizationManager: ILocalizationManager, dictionaryAsset: object): void;
}
