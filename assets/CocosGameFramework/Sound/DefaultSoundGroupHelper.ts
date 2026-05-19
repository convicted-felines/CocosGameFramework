import { _decorator } from 'cc';
import { SoundGroupHelperBase } from './SoundGroupHelperBase';

const { ccclass } = _decorator;

/**
 * 默认声音组辅助器。
 *
 * 当前 Cocos Creator 不提供等价的 AudioMixerGroup，所有分组控制均通过
 * SoundGroup 的 volume / mute 属性直接作用于各 AudioSource，无需额外处理。
 * 若接入第三方混音插件，可继承 SoundGroupHelperBase 并替换本类。
 */
@ccclass('DefaultSoundGroupHelper')
export class DefaultSoundGroupHelper extends SoundGroupHelperBase {
}
