import { Component, _decorator } from 'cc';

const { ccclass } = _decorator;

/**
 * 声音组辅助器基类。
 *
 * 管理同组内所有声音代理的共享属性（如输出音量组）。
 * 继承此类可接入自定义混音或分组管理策略。
 */
@ccclass('SoundGroupHelperBase')
export abstract class SoundGroupHelperBase extends Component {
    /** 当前声音组名称。由 SoundComponent 在创建时设置。 */
    groupName: string = '';
}
