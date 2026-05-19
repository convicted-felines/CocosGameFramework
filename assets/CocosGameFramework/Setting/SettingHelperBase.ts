import { Component, _decorator } from 'cc';
import { ISettingHelper } from '../../GameFramework/Setting/ISettingHelper';

const { ccclass } = _decorator;

/**
 * 游戏设置辅助器基类。
 *
 * 继承此类并实现抽象方法，即可替换框架的持久化存储策略（如 localStorage、PlayerPrefs、云存档等）。
 * 将具体实现组件挂载到场景节点后，在 SettingComponent 的 settingHelper 属性处拖入该节点即可。
 */
@ccclass('SettingHelperBase')
export abstract class SettingHelperBase extends Component implements ISettingHelper {
    abstract get count(): number;

    abstract load(): boolean;

    abstract save(): boolean;

    abstract getAllSettingNames(): string[];

    abstract hasKey(settingName: string): boolean;

    abstract removeKey(settingName: string): boolean;

    abstract removeAllSettings(): void;

    abstract getBool(settingName: string, defaultValue?: boolean): boolean;

    abstract setBool(settingName: string, value: boolean): void;

    abstract getInt(settingName: string, defaultValue?: number): number;

    abstract setInt(settingName: string, value: number): void;

    abstract getFloat(settingName: string, defaultValue?: number): number;

    abstract setFloat(settingName: string, value: number): void;

    abstract getString(settingName: string, defaultValue?: string): string;

    abstract setString(settingName: string, value: string): void;

    abstract getObject<T>(settingName: string, defaultValue?: T | null): T | null;

    abstract setObject<T>(settingName: string, obj: T): void;
}
