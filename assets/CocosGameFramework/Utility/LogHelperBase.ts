import { Component, _decorator } from 'cc';
import { ILogHelper } from '../../GameFramework/Base/Log/ILogHelper';
import { GameFrameworkLogLevel } from '../../GameFramework/Base/Log/GameFrameworkLogLevel';

const { ccclass } = _decorator;

/**
 * 日志辅助器基类。
 *
 * 继承此类并实现 log() 方法，即可替换框架的日志输出策略（如写文件、上报服务器等）。
 * 新增辅助器时：
 *   1. 继承本类并实现 log()
 *   2. 在文件末尾调用 HelperRegistry.register('MyLogHelper', MyLogHelper)
 *   3. 在 LogHelperType 枚举中添加同名枚举项
 *   4. 在 BaseComponent Inspector 下拉中选择即可
 */
@ccclass('LogHelperBase')
export abstract class LogHelperBase extends Component implements ILogHelper {
    abstract log(level: GameFrameworkLogLevel, tag: string, message: string): void;
}
