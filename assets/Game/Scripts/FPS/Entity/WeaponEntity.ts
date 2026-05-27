import { _decorator, Camera, EventKeyboard, EventMouse, Input, input, KeyCode, Node } from 'cc';
import { EntityLogic } from 'db://assets/CocosGameFramework/Entity/EntityLogic';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { DRWeapon } from 'db://assets/Game/Scripts/DataTable/DRWeapon';
import { WeaponAmmoChangedEventArgs } from 'db://assets/Game/Scripts/FPS/Event/WeaponEventArgs';
import { FireContext, FireCallbacks } from 'db://assets/Game/Scripts/FPS/Weapon/FireContext';
import { IFireBehavior } from 'db://assets/Game/Scripts/FPS/Weapon/IFireBehavior';
import { HitscanFireBehavior } from 'db://assets/Game/Scripts/FPS/Weapon/FireBehaviors/HitscanFireBehavior';
import { ProjectileFireBehavior } from 'db://assets/Game/Scripts/FPS/Weapon/FireBehaviors/ProjectileFireBehavior';
import { BeamFireBehavior } from 'db://assets/Game/Scripts/FPS/Weapon/FireBehaviors/BeamFireBehavior';
import { ChargedFireBehavior } from 'db://assets/Game/Scripts/FPS/Weapon/FireBehaviors/ChargedFireBehavior';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';

const { ccclass, property } = _decorator;

const FireBehaviorType = {
    Hitscan:    0,
    Projectile: 1,
    Beam:       2,
    Charged:    3,
} as const;

export const FireMode = {
    SemiAuto: 0,
    FullAuto:  1,
} as const;

export interface WeaponEntityData {
    drWeaponId:    number;
    ownerEntityId: number;
    cameraNode:    Camera;
}

@ccclass('WeaponEntity')
export class WeaponEntity extends EntityLogic {

    @property(Node)
    muzzlePoint: Node = null!;

    // ---- 从 DRWeapon 读取的静态配置 ----
    private _drWeaponId   = 0;
    private _fireMode: number = FireMode.SemiAuto;
    private _fireRate     = 10;
    private _clipSize     = 30;
    private _maxAmmo      = 90;
    private _reloadTime   = 2;

    // ---- 运行时状态 ----
    private _ownerEntityId = 0;
    private _cameraNode: Camera | null = null;
    private _fireBehavior: IFireBehavior | null = null;
    private _fireCtx: FireContext | null = null;

    private _currentClip  = 0;
    private _reserveAmmo  = 0;
    private _fireCooldown = 0;
    private _isReloading  = false;
    private _reloadTimer  = 0;
    private _triggerHeld  = false;

    // ---- 生命周期 ----

    protected onInit(_userData?: object): void {}

    onShow(userData?: object): void {
        const data = userData as WeaponEntityData;
        this._ownerEntityId = data.ownerEntityId;
        this._cameraNode    = data.cameraNode;
        this._drWeaponId    = data.drWeaponId;

        const row = this._loadConfig(data.drWeaponId);
        this._fireBehavior = row ? this._createBehavior(row) : new HitscanFireBehavior();
        this._fireCtx      = this._buildCtx(row);

        this._currentClip  = this._clipSize;
        this._reserveAmmo  = this._maxAmmo;
        this._fireCooldown = 0;
        this._isReloading  = false;
        this._reloadTimer  = 0;
        this._triggerHeld  = false;

        this._registerInput();
        this._broadcastAmmo();
    }

    onHide(_isShutdown: boolean, _userData?: object): void {
        this._fireBehavior?.onDispose?.();
        this._fireBehavior = null;
        this._unregisterInput();
    }

    onUpdate(dt: number, _rdt: number): void {
        if (!this._fireBehavior || !this._fireCtx) return;

        // 换弹
        if (this._isReloading) {
            this._reloadTimer -= dt;
            if (this._reloadTimer <= 0) this._finishReload();
            return;
        }

        // 冷却
        if (this._fireCooldown > 0) this._fireCooldown -= dt;

        if (this._fireBehavior.manualTrigger) {
            // 光束 / 蓄力：转发给行为
            if (this._triggerHeld) {
                this._fireBehavior.onTriggerHeld?.(this._fireCtx, dt);
            }
        } else {
            // 普通自动：持续扣动
            if (this._triggerHeld && this._fireMode === FireMode.FullAuto) {
                this._tryFire();
            }
        }
    }

    // ---- 配置 ----

    private _loadConfig(drId: number): DRWeapon | null {
        const row = GameEntry.DataTable.getDataTable(DRWeapon)?.getDataRow(drId);
        if (!row) {
            GameFrameworkLog.warning('[WeaponEntity] DRWeapon row {0} not found.', drId);
            return null;
        }
        this._fireMode   = row.FireMode;
        this._fireRate   = row.FireRate;
        this._clipSize   = row.ClipSize;
        this._maxAmmo    = row.MaxAmmo;
        this._reloadTime = row.ReloadTime;
        return row;
    }

    private _createBehavior(row: DRWeapon): IFireBehavior {
        switch (row.FireBehaviorType) {
            case FireBehaviorType.Projectile: return new ProjectileFireBehavior();
            case FireBehaviorType.Beam:       return new BeamFireBehavior();
            case FireBehaviorType.Charged:    return new ChargedFireBehavior(row.ChargeTime);
            default:                          return new HitscanFireBehavior();
        }
    }

    private _buildCtx(row: DRWeapon | null): FireContext {
        const callbacks: FireCallbacks = {
            consumeAmmo: (count = 1) => {
                if (this._currentClip < count) { this._startReload(); return false; }
                this._currentClip -= count;
                return true;
            },
            triggerReload:  () => this._startReload(),
            broadcastAmmo:  () => this._broadcastAmmo(),
        };
        return {
            camera:        this._cameraNode!,
            muzzle:        this.muzzlePoint,
            ownerEntityId: this._ownerEntityId,
            damage:        row?.Damage        ?? 20,
            range:         row?.Range         ?? 100,
            bulletId:      row?.BulletId      ?? 0,
            bulletCount:   row?.BulletCount   ?? 1,
            spreadAngle:   row?.SpreadAngle   ?? 0,
            chargeTime:    row?.ChargeTime    ?? 1,
            callbacks,
        };
    }

    // ---- 开火 ----

    private _tryFire(): void {
        if (!this._fireBehavior || !this._fireCtx) return;
        if (this._fireCooldown > 0 || this._isReloading) return;
        if (this._currentClip <= 0) { this._startReload(); return; }

        this._currentClip--;
        this._fireCooldown = this._fireRate > 0 ? 1 / this._fireRate : 0;
        this._fireBehavior.fire(this._fireCtx);
        this._broadcastAmmo();
    }

    // ---- 换弹 ----

    private _startReload(): void {
        if (this._isReloading || this._reserveAmmo <= 0 || this._currentClip >= this._clipSize) return;
        this._isReloading = true;
        this._reloadTimer = this._reloadTime;
        GameFrameworkLog.info('[WeaponEntity] Reloading...');
    }

    private _finishReload(): void {
        const supply       = Math.min(this._clipSize - this._currentClip, this._reserveAmmo);
        this._currentClip += supply;
        this._reserveAmmo -= supply;
        this._isReloading  = false;
        this._broadcastAmmo();
        GameFrameworkLog.info('[WeaponEntity] Reload done. Clip:{0} Reserve:{1}', this._currentClip, this._reserveAmmo);
    }

    private _broadcastAmmo(): void {
        GameEntry.Event.fire(this, WeaponAmmoChangedEventArgs.create(this._currentClip, this._reserveAmmo));
        GameEntry.DataNode.setData('Player/ClipAmmo',    this._currentClip);
        GameEntry.DataNode.setData('Player/ReserveAmmo', this._reserveAmmo);
    }

    // ---- 输入 ----

    private _registerInput(): void {
        input.on(Input.EventType.MOUSE_DOWN, this._onMouseDown, this);
        input.on(Input.EventType.MOUSE_UP,   this._onMouseUp,   this);
        input.on(Input.EventType.KEY_DOWN,   this._onKeyDown,   this);
    }

    private _unregisterInput(): void {
        input.off(Input.EventType.MOUSE_DOWN, this._onMouseDown, this);
        input.off(Input.EventType.MOUSE_UP,   this._onMouseUp,   this);
        input.off(Input.EventType.KEY_DOWN,   this._onKeyDown,   this);
    }

    private _onMouseDown(e: EventMouse): void {
        if (e.getButton() !== 0) return;
        this._triggerHeld = true;
        if (!this._fireBehavior || !this._fireCtx) return;

        if (this._fireBehavior.manualTrigger) {
            this._fireBehavior.onTriggerDown?.(this._fireCtx);
        } else if (this._fireMode === FireMode.SemiAuto) {
            this._tryFire();
        }
    }

    private _onMouseUp(e: EventMouse): void {
        if (e.getButton() !== 0) return;
        this._triggerHeld = false;
        if (this._fireBehavior?.manualTrigger && this._fireCtx) {
            this._fireBehavior.onTriggerUp?.(this._fireCtx);
        }
    }

    private _onKeyDown(e: EventKeyboard): void {
        if (e.keyCode === KeyCode.KEY_R) this._startReload();
    }

    // ---- 公开接口 ----

    get drWeaponId(): number   { return this._drWeaponId; }
    get currentClip(): number  { return this._currentClip; }
    get reserveAmmo(): number  { return this._reserveAmmo; }
    get isReloading(): boolean { return this._isReloading; }
}
