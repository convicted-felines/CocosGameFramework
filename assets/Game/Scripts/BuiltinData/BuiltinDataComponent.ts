import { _decorator, JsonAsset, TextAsset } from 'cc';
import { GameFrameworkComponent } from 'db://assets/CocosGameFramework/Base/GameFrameworkComponent';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';
import { LocalizationManager } from 'db://assets/GameFramework/Localization/LocalizationManager';
import { ResourceMode } from 'db://assets/Game/Scripts/Definition/Constant';

const { ccclass, property } = _decorator;

export interface BuildInfo {
    gameVersion: string;
    internalResourceVersion: number;
    checkVersionUrl?: string;
}

@ccclass('BuiltinDataComponent')
export class BuiltinDataComponent extends GameFrameworkComponent {
    @property({ type: JsonAsset, tooltip: '构建信息 JSON（build-info.json）' })
    buildInfoAsset: JsonAsset | null = null;

    @property({ type: TextAsset, tooltip: '默认本地化字典（default-dictionary.xml/.json）' })
    defaultDictionaryAsset: TextAsset | null = null;

    /** 资源模式：Package=离线包, Updatable=热更新, 其他=编辑器/直接模式 */
    @property({ type: Number, tooltip: '0=Editor/直接, 1=Package(离线), 2=Updatable(热更新)' })
    resourceMode: ResourceMode = ResourceMode.Unspecified;

    private _buildInfo: BuildInfo | null = null;

    get buildInfo(): BuildInfo | null { return this._buildInfo; }

    /** 版本检查 URL（Updatable 模式下使用），从 buildInfo 读取 */
    get checkVersionUrl(): string { return this._buildInfo?.checkVersionUrl ?? ''; }

    initBuildInfo(): void {
        if (!this.buildInfoAsset?.json) {
            GameFrameworkLog.info('[BuiltinData] build-info.json not assigned.');
            return;
        }
        this._buildInfo = this.buildInfoAsset.json as BuildInfo;
        GameFrameworkLog.info(`[BuiltinData] v${this._buildInfo.gameVersion}, resVer=${this._buildInfo.internalResourceVersion}`);
    }

    initDefaultDictionary(localization: LocalizationManager): void {
        if (!this.defaultDictionaryAsset?.text) {
            GameFrameworkLog.info('[BuiltinData] Default dictionary not assigned.');
            return;
        }
        const helper = localization.helper;
        if (!helper) {
            GameFrameworkLog.warning('[BuiltinData] Localization helper not set.');
            return;
        }
        if (!helper.parseData(localization, this.defaultDictionaryAsset.text)) {
            GameFrameworkLog.warning('[BuiltinData] Parse default dictionary failure.');
        }
    }
}
