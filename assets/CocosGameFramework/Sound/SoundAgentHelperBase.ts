import { AudioClip, AudioSource, Component, _decorator } from 'cc';
import { PlaySoundParams } from '../../GameFramework/Sound/PlaySoundParams';

const { ccclass } = _decorator;

/**
 * 声音代理辅助器基类。
 *
 * 每个辅助器实例对应一个 AudioSource，驱动单个声音通道的播放控制。
 * 继承此类并重写各抽象方法，可自定义 AudioSource 的行为（如接入第三方音频引擎）。
 */
@ccclass('SoundAgentHelperBase')
export abstract class SoundAgentHelperBase extends Component {
    abstract get isPlaying(): boolean;
    abstract get length(): number;
    abstract get time(): number;
    abstract set time(value: number);

    abstract get mute(): boolean;
    abstract set mute(value: boolean);

    abstract get loop(): boolean;
    abstract set loop(value: boolean);

    abstract get volume(): number;
    abstract set volume(value: number);

    abstract get pitch(): number;
    abstract set pitch(value: number);

    /**
     * 设置声音资源并应用参数，返回是否成功。
     * @param soundAsset 加载完成的资源对象（AudioClip 等）
     * @param params 播放参数
     */
    abstract setSoundAsset(soundAsset: object, params: PlaySoundParams): boolean;

    abstract play(fadeInSeconds?: number): void;
    abstract stop(fadeOutSeconds?: number): void;
    abstract pause(fadeOutSeconds?: number): void;
    abstract resume(fadeInSeconds?: number): void;
    abstract reset(): void;
}
