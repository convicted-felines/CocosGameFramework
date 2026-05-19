import { AudioClip, AudioSource, Tween, _decorator, tween } from 'cc';
import { PlaySoundParams } from '../../GameFramework/Sound/PlaySoundParams';
import { SoundAgentHelperBase } from './SoundAgentHelperBase';

const { ccclass, requireComponent } = _decorator;

/**
 * 默认声音代理辅助器。
 *
 * 使用节点上的 AudioSource 组件实现播放控制，支持淡入/淡出。
 * 将此组件挂载在音频节点的子节点上可替换为自定义实现。
 */
@ccclass('DefaultSoundAgentHelper')
@requireComponent(AudioSource)
export class DefaultSoundAgentHelper extends SoundAgentHelperBase {
    private _audioSource!: AudioSource;
    private _fadeTween: Tween<{ v: number }> | null = null;
    private _volumeBeforePause: number = 1;

    onLoad(): void {
        this._audioSource = this.getComponent(AudioSource)!;
        this._audioSource.playOnAwake = false;
    }

    get isPlaying(): boolean { return this._audioSource.playing; }
    get length(): number { return this._audioSource.clip?.getDuration() ?? 0; }
    get time(): number { return this._audioSource.currentTime; }
    set time(value: number) { this._audioSource.currentTime = value; }

    get mute(): boolean { return this._audioSource.volume === 0; }
    set mute(value: boolean) {
        this._audioSource.volume = value ? 0 : this._volumeBeforePause;
    }

    get loop(): boolean { return this._audioSource.loop; }
    set loop(value: boolean) { this._audioSource.loop = value; }

    get volume(): number { return this._audioSource.volume; }
    set volume(value: number) { this._audioSource.volume = value; }

    get pitch(): number { return this._audioSource.playbackRate; }
    set pitch(value: number) { this._audioSource.playbackRate = value; }

    setSoundAsset(soundAsset: object, params: PlaySoundParams): boolean {
        const clip = soundAsset as AudioClip;
        if (!clip) return false;
        this._audioSource.clip = clip;
        this._audioSource.loop = params.loop;
        this._audioSource.playbackRate = params.pitch;
        if (params.time > 0) this._audioSource.currentTime = params.time;
        return true;
    }

    play(fadeInSeconds: number = 0): void {
        this._cancelFade();
        if (fadeInSeconds > 0) {
            this._audioSource.volume = 0;
            this._audioSource.play();
            this._fadeTo(this._volumeBeforePause, fadeInSeconds);
        } else {
            this._audioSource.volume = this._volumeBeforePause;
            this._audioSource.play();
        }
    }

    stop(fadeOutSeconds: number = 0): void {
        this._cancelFade();
        if (fadeOutSeconds > 0 && this._audioSource.playing) {
            this._fadeTo(0, fadeOutSeconds, () => this._audioSource.stop());
        } else {
            this._audioSource.stop();
        }
    }

    pause(fadeOutSeconds: number = 0): void {
        this._cancelFade();
        this._volumeBeforePause = this._audioSource.volume;
        if (fadeOutSeconds > 0 && this._audioSource.playing) {
            this._fadeTo(0, fadeOutSeconds, () => this._audioSource.pause());
        } else {
            this._audioSource.pause();
        }
    }

    resume(fadeInSeconds: number = 0): void {
        this._cancelFade();
        if (fadeInSeconds > 0) {
            this._audioSource.volume = 0;
            this._audioSource.play();
            this._fadeTo(this._volumeBeforePause, fadeInSeconds);
        } else {
            this._audioSource.volume = this._volumeBeforePause;
            this._audioSource.play();
        }
    }

    reset(): void {
        this._cancelFade();
        this._audioSource.stop();
        this._audioSource.clip = null;
        this._volumeBeforePause = 1;
    }

    private _fadeTo(targetVolume: number, duration: number, onComplete?: () => void): void {
        const proxy = { v: this._audioSource.volume };
        this._fadeTween = tween(proxy)
            .to(duration, { v: targetVolume }, {
                onUpdate: () => { this._audioSource.volume = proxy.v; },
            })
            .call(() => {
                onComplete?.();
                this._fadeTween = null;
            })
            .start();
    }

    private _cancelFade(): void {
        if (this._fadeTween) {
            this._fadeTween.stop();
            this._fadeTween = null;
        }
    }
}
