import { _decorator } from 'cc';
import { IConfigManager } from '../../GameFramework/Config/IConfigManager';
import { ConfigHelperBase } from './ConfigHelperBase';
import { HelperRegistry } from '../Utility/HelperRegistry';

const { ccclass } = _decorator;

/**
 * 默认配置解析器。
 *
 * 支持两种格式的文本配置文件：
 *   1. Tab 分隔（4列）：Id\tName\tType\tValue，以 # 开头的行为注释。
 *   2. 简单 Key=Value，每行一条，以 # 开头的行为注释。
 *
 * 解析后通过 configManager.addConfig(name, value) 写入配置管理器。
 */
@ccclass('DefaultConfigHelper')
export class DefaultConfigHelper extends ConfigHelperBase {
    private _configManager: IConfigManager | null = null;

    setConfigManager(manager: IConfigManager): void {
        this._configManager = manager;
    }

    parseData(configString: string, _userData?: any): boolean {
        if (!this._configManager) return false;

        const lines = configString.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const tabs = trimmed.split('\t');
            if (tabs.length >= 4) {
                // Tab 分隔格式：Id\tName\tType\tValue
                const name = tabs[1].trim();
                const value = tabs[3].trim();
                if (name) {
                    this._configManager.addConfig(name, value);
                }
            } else {
                // Key=Value 格式
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx > 0) {
                    const name = trimmed.substring(0, eqIdx).trim();
                    const value = trimmed.substring(eqIdx + 1).trim();
                    if (name) {
                        this._configManager.addConfig(name, value);
                    }
                }
            }
        }
        return true;
    }
}

HelperRegistry.register('DefaultConfigHelper', DefaultConfigHelper);
