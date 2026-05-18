import { AudioClip, AudioSource, Node, find } from 'cc';
import { SoundManager } from '../../GameFramework/Sound/SoundManager';
import { IPlaySoundParams } from '../../GameFramework/Sound/ISoundManager';

interface CocosSoundInstance {
    audioSource: AudioSource;
    serialId: number;
}

export class CocosSoundManager extends SoundManager {
    private _audioNode: Node | null = null;
    private _instances: Map<number, CocosSoundInstance> = new Map();

    // 需要一个挂载 AudioSource 的节点
    setAudioNode(node: Node): void {
        this._audioNode = node;
    }

    protected _onLoadSuccess(serialId: number, asset: object, params?: IPlaySoundParams): void {
        super._onLoadSuccess(serialId, asset, params);
        if (!this._audioNode) return;

        const data = (this as any)._sounds.get(serialId);
        const groupMuted = data ? this.isMuted(data.groupName) : false;
        const groupVolume = data ? this.getVolume(data.groupName) : 1.0;

        const clip = asset as AudioClip;
        const audioSource = this._audioNode.addComponent(AudioSource);
        audioSource.clip = clip;
        audioSource.loop = params?.loop ?? false;
        // 组静音优先，否则取 params.volume 与组 volume 的乘积
        audioSource.volume = groupMuted ? 0 : (params?.volume ?? 1.0) * groupVolume;

        const startTime = params?.startTime ?? 0;
        if (startTime > 0) audioSource.currentTime = startTime;

        audioSource.play();
        this._instances.set(serialId, { audioSource, serialId });
    }

    protected _doStop(data: any): void {
        const inst = this._instances.get(data.serialId);
        if (inst) {
            inst.audioSource.stop();
            inst.audioSource.destroy();
            this._instances.delete(data.serialId);
        }
    }

    protected _doPause(data: any): void {
        this._instances.get(data.serialId)?.audioSource.pause();
    }

    protected _doResume(data: any): void {
        this._instances.get(data.serialId)?.audioSource.play();
    }

    protected _doSetMuted(data: any, mute: boolean): void {
        const inst = this._instances.get(data.serialId);
        if (inst) inst.audioSource.volume = mute ? 0 : this.getVolume(data.groupName);
    }

    protected _doSetVolume(data: any, volume: number): void {
        const inst = this._instances.get(data.serialId);
        if (inst && !this.isMuted(data.groupName)) inst.audioSource.volume = volume;
    }

    shutdown(): void {
        this._instances.forEach(inst => {
            inst.audioSource.stop();
            inst.audioSource.destroy();
        });
        this._instances.clear();
        super.shutdown();
    }
}
