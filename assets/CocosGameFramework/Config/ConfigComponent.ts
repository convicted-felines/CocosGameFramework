import { _decorator, Enum } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { ConfigManager } from '../../GameFramework/Config/ConfigManager';
import { ConfigHelperBase } from './ConfigHelperBase';
import { DefaultConfigHelper } from './DefaultConfigHelper';
import { IEventManager } from '../../GameFramework/Event/IEventManager';
import { IResourceManager } from '../../GameFramework/Resource/IResourceManager';
import { LoadConfigSuccessEventArgs, LoadConfigFailureEventArgs } from './ConfigEventArgs';
import { HelperRegistry } from '../Utility/HelperRegistry';
import { ConfigHelperType } from './ConfigHelperType';

const { ccclass, property } = _decorator;

@ccclass('ConfigComponent')
export class ConfigComponent extends GameFrameworkComponent {
    @property({ type: Enum(ConfigHelperType), tooltip: '配置辅助器类型' })
    configHelperType: ConfigHelperType = ConfigHelperType.DefaultConfigHelper;

    private _manager!: ConfigManager;
    private _helper!: ConfigHelperBase;

    get manager(): ConfigManager { return this._manager; }
    get count(): number { return this._manager.count; }

    onLoad(): void {
        super.onLoad();
        this._helper = HelperRegistry.createHelper(this.node, ConfigHelperType[this.configHelperType], DefaultConfigHelper);
        this._manager = new ConfigManager();
        this._helper.setConfigManager(this._manager);
        this._manager.setConfigHelper(this._helper);
        GameFrameworkEntry.registerModule(MODULE_ID.CONFIG, this._manager);
    }

    /**
     * 从资源管理器异步加载并解析配置文件。
     * 结果通过 EventManager 广播 LoadConfigSuccessEventArgs / LoadConfigFailureEventArgs。
     */
    loadConfig(configAssetName: string, bundleName: string, userData?: any): void {
        if (!GameFrameworkEntry.hasModule(MODULE_ID.RESOURCE)) {
            console.error('[ConfigComponent] ResourceManager not found.');
            return;
        }

        const resourceManager = GameFrameworkEntry.getModule(null as any, MODULE_ID.RESOURCE) as unknown as IResourceManager;
        const startTime = Date.now();

        resourceManager.loadAsset<any>(
            bundleName,
            configAssetName,
            null as any,
            (asset: any, _duration: number) => {
                const text: string | null = typeof asset === 'string' ? asset
                    : (asset && asset.text) ? asset.text
                    : null;

                if (text === null) {
                    const err = `Asset [${configAssetName}] is not a text asset.`;
                    console.warn(`[ConfigComponent] ${err}`);
                    this._fireFailure(configAssetName, err, userData);
                    return;
                }

                this._manager.parseData(text, userData);

                if (GameFrameworkEntry.hasModule(MODULE_ID.EVENT)) {
                    const duration = (Date.now() - startTime) / 1000;
                    const eventManager = GameFrameworkEntry.getModule(null as any, MODULE_ID.EVENT) as unknown as IEventManager;
                    eventManager.fire(this, LoadConfigSuccessEventArgs.create(configAssetName, duration, userData));
                }
            },
            (assetName: string, errorMsg: string) => {
                console.warn(`[ConfigComponent] Load config failure, asset '${assetName}', error: ${errorMsg}`);
                this._fireFailure(assetName, errorMsg, userData);
            }
        );
    }

    /**
     * 直接从字符串解析配置（不经过资源系统）。
     */
    parseData(configString: string, userData?: any): boolean {
        return this._manager.parseData(configString, userData);
    }

    hasConfig(configName: string): boolean { return this._manager.hasConfig(configName); }

    addConfig(configName: string, configValue: string): boolean { return this._manager.addConfig(configName, configValue); }
    removeConfig(configName: string): boolean { return this._manager.removeConfig(configName); }
    removeAllConfigs(): void { this._manager.removeAllConfigs(); }

    getBool(configName: string, defaultValue?: boolean): boolean { return this._manager.getBool(configName, defaultValue); }
    getInt(configName: string, defaultValue?: number): number { return this._manager.getInt(configName, defaultValue); }
    getFloat(configName: string, defaultValue?: number): number { return this._manager.getFloat(configName, defaultValue); }
    getString(configName: string, defaultValue?: string): string { return this._manager.getString(configName, defaultValue); }

    private _fireFailure(configAssetName: string, errorMsg: string, userData?: any): void {
        if (GameFrameworkEntry.hasModule(MODULE_ID.EVENT)) {
            const eventManager = GameFrameworkEntry.getModule(null as any, MODULE_ID.EVENT) as unknown as IEventManager;
            eventManager.fire(this, LoadConfigFailureEventArgs.create(configAssetName, errorMsg, userData));
        }
    }
}
