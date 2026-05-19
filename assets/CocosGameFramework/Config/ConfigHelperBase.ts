import { Component, _decorator } from 'cc';
import { IConfigHelper } from '../../GameFramework/Config/IConfigHelper';
import { IConfigManager } from '../../GameFramework/Config/IConfigManager';

const { ccclass } = _decorator;

/**
 * 配置辅助器基类。
 *
 * 继承此类并实现抽象方法，即可替换框架的配置文件解析策略（如 JSON、CSV、XML 等）。
 * 将具体实现组件挂载到场景节点后，在 ConfigComponent 的 configHelper 属性处拖入该节点即可。
 */
@ccclass('ConfigHelperBase')
export abstract class ConfigHelperBase extends Component implements IConfigHelper {
    abstract setConfigManager(manager: IConfigManager): void;

    abstract parseData(configString: string, userData?: any): boolean;
}
