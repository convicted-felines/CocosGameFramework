import { Component, _decorator } from 'cc';
import { ISoundHelper } from '../../GameFramework/Sound/ISoundHelper';

const { ccclass } = _decorator;

/**
 * 声音辅助器基类。
 *
 * 继承此类并实现 releaseSoundAsset，即可自定义声音资源的释放逻辑。
 * 将具体实现组件挂载到场景节点后，在 SoundComponent 的 soundHelper 属性处拖入该节点。
 */
@ccclass('SoundHelperBase')
export abstract class SoundHelperBase extends Component implements ISoundHelper {
    abstract releaseSoundAsset(soundAsset: object): void;
}
