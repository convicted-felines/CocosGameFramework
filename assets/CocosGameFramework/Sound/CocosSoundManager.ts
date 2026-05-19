import { AudioClip, AudioSource, Node, tween, Tween } from 'cc';
import { SoundManager, SoundAgent, SoundGroup } from '../../GameFramework/Sound/SoundManager';
import { PlaySoundParams } from '../../GameFramework/Sound/PlaySoundParams';

// ---------- Cocos-specific SoundAgent ----------

class CocosSoundAgent extends SoundAgent {
    private _audioSource: AudioSource | null = null;
    private _fadeNode: Node | null = null;
    private _fadeTween: Tween<{ v: number }> | null = null;

    setAudioSource(source: AudioSource): void {
        this._audioSource = source;
        this._fadeNode = source.node;
    }

    protected _doIsPlaying(): boolean {
        return this._audioSource?.playing ?? false;
    }

    protected _doGetLength(): number {
        return this._audioSource?.clip?.getDuration() ?? 0;
    }

    protected _doGetTime(): number {
        return this._audioSource?.currentTime ?? 0;
    }

    protected _doSetTime(t: number): void {
        if (this._audioSource) this._audioSource.currentTime = t;
    }

    protected _doSetLoop(v: boolean): void {
        if (this._audioSource) this._audioSource.loop = v;
    }

    protected _doSetMute(v: boolean): void {
        if (this._audioSource) this._audioSource.volume = v ? 0 : this.volume;
    }

    protected _doSetVolume(v: number): void {
        if (this._audioSource && !this.mute) this._audioSource.volume = v;
    }

    protected _doSetPitch(v: number): void {
        if (this._audioSource) this._audioSource.playbackRate = v;
    }

    // panStereo, spatialBlend, maxDistance, dopplerLevel are Unity-specific;
    // Cocos AudioSource has no equivalent — stored for API completeness only.
    protected _doSetPanStereo(_v: number): void {}
    protected _doSetSpatialBlend(_v: number): void {}
    protected _doSetMaxDistance(_v: number): void {}
    protected _doSetDopplerLevel(_v: number): void {}

    protected _doPlay(fadeInSeconds: number): void {
        if (!this._audioSource) return;
        this._cancelFade();
        if (fadeInSeconds > 0) {
            this._audioSource.volume = 0;
            this._audioSource.play();
            this._fade(0, this.volume, fadeInSeconds);
        } else {
            this._audioSource.volume = this.mute ? 0 : this.volume;
            this._audioSource.play();
        }
    }

    protected _doStop(fadeOutSeconds: number): void {
        if (!this._audioSource) return;
        this._cancelFade();
        if (fadeOutSeconds > 0) {
            const targetVol = 0;
            this._fade(this._audioSource.volume, targetVol, fadeOutSeconds, () => {
                this._audioSource?.stop();
            });
        } else {
            this._audioSource.stop();
        }
    }

    protected _doPause(fadeOutSeconds: number): void {
        if (!this._audioSource) return;
        this._cancelFade();
        if (fadeOutSeconds > 0) {
            this._fade(this._audioSource.volume, 0, fadeOutSeconds, () => {
                this._audioSource?.pause();
            });
        } else {
            this._audioSource.pause();
        }
    }

    protected _doResume(fadeInSeconds: number): void {
        if (!this._audioSource) return;
        this._cancelFade();
        if (fadeInSeconds > 0) {
            this._audioSource.volume = 0;
            this._audioSource.play();
            this._fade(0, this.volume, fadeInSeconds);
        } else {
            this._audioSource.volume = this.mute ? 0 : this.volume;
            this._audioSource.play();
        }
    }

    protected _doReset(): void {
        this._cancelFade();
        if (this._audioSource) {
            this._audioSource.stop();
            this._audioSource.clip = null;
        }
    }

    protected _doSetSoundAsset(asset: object, params: PlaySoundParams): boolean {
        if (!this._audioSource) return false;
        const clip = asset as AudioClip;
        this._audioSource.clip = clip;
        this._audioSource.loop = params.loop;
        this._audioSource.playbackRate = params.pitch;
        if (params.time > 0) this._audioSource.currentTime = params.time;
        return true;
    }

    private _fade(
        from: number,
        to: number,
        duration: number,
        onComplete?: () => void
    ): void {
        const proxy = { v: from };
        if (this._audioSource) this._audioSource.volume = from;
        this._fadeTween = tween(proxy)
            .to(duration, { v: to }, {
                onUpdate: () => {
                    if (this._audioSource) this._audioSource.volume = proxy.v;
                },
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

// ---------- CocosSoundManager ----------

export class CocosSoundManager extends SoundManager {
    private _audioNode: Node | null = null;

    setAudioNode(node: Node): void {
        this._audioNode = node;
    }

    protected _createSoundAgent(group: SoundGroup): SoundAgent {
        const agent = new CocosSoundAgent(group);
        if (this._audioNode) {
            const source = this._audioNode.addComponent(AudioSource);
            agent.setAudioSource(source);
        }
        return agent;
    }

    shutdown(): void {
        // Destroy all AudioSource components before generic cleanup
        for (const group of (this as any)._groups.values() as IterableIterator<SoundGroup>) {
            for (const agent of group.agents) {
                const cocosAgent = agent as CocosSoundAgent;
                cocosAgent['_doReset']();
                const src = cocosAgent['_audioSource'] as AudioSource | null;
                if (src) src.destroy();
            }
        }
        super.shutdown();
    }
}
