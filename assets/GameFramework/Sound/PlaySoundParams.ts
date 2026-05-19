import { IReference } from '../ReferencePool/IReference';
import { ReferencePool } from '../ReferencePool/ReferencePool';

export class PlaySoundParams implements IReference {
    private _referenced: boolean = false;

    time: number = 0;
    muteInSoundGroup: boolean = false;
    loop: boolean = false;
    priority: number = 0;
    volumeInSoundGroup: number = 1.0;
    fadeInSeconds: number = 0;
    pitch: number = 1.0;
    panStereo: number = 0;
    spatialBlend: number = 0;
    maxDistance: number = 100;
    dopplerLevel: number = 1.0;

    get referenced(): boolean { return this._referenced; }

    static create(): PlaySoundParams {
        const p = ReferencePool.acquire(PlaySoundParams);
        p._referenced = true;
        return p;
    }

    clear(): void {
        this._referenced = false;
        this.time = 0;
        this.muteInSoundGroup = false;
        this.loop = false;
        this.priority = 0;
        this.volumeInSoundGroup = 1.0;
        this.fadeInSeconds = 0;
        this.pitch = 1.0;
        this.panStereo = 0;
        this.spatialBlend = 0;
        this.maxDistance = 100;
        this.dopplerLevel = 1.0;
    }
}
