import { _decorator, Camera, CharacterController, Input, input, KeyCode, math, Quat, Vec2, Vec3 } from 'cc';
import { EntityLogic } from 'db://assets/CocosGameFramework/Entity/EntityLogic';
import { Log } from 'db://assets/CocosGameFramework/Utility/Log';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { DRPlayer } from 'db://assets/Game/Scripts/DataTable/DRPlayer';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';

const { ccclass, property } = _decorator;

export interface PlayerEntityData {
    /** 对应 DRPlayer.id */
    drPlayerId: number;
}

@ccclass('PlayerEntity')
export class PlayerEntity extends EntityLogic {

    @property(Camera)
    fpCamera: Camera = null!;

    @property(CharacterController)
    characterController: CharacterController = null!;

    // ---- 世界参数（后续接入世界配置表后替换）----
    @property
    gravity: number = 20;

    // ---- 视角参数（后续接入视角配置表后替换）----
    @property
    sensitivityH: number = 0.15;
    @property
    sensitivityV: number = 0.15;
    @property
    pitchMax: number = 80;
    @property
    pitchMin: number = 80;

    // ---- 运行时状态（从 DRPlayer 初始化）----
    private _maxHp       = 100;
    private _hp          = 100;
    private _moveSpeed   = 5;
    private _sprintScale = 1.6;
    private _jumpSpeed   = 8;

    private _pitch       = 0;
    private _verticalVel = 0;
    private _isGrounded  = false;
    private _isSprinting = false;
    private _isDead      = false;

    private _moveInput  = new Vec2();
    private _lookDelta  = new Vec2();

    // ---- 武器槽（WeaponEntity 注入）----
    private _currentWeaponEntityId = -1;

    // ---- 生命周期 ----

    protected onInit(_userData?: object): void {
        GameFrameworkLog.info('[PlayerEntity] Init.');
    }

    onShow(userData?: object): void {
        const data = userData as PlayerEntityData | undefined;
        this._loadConfig(data?.drPlayerId ?? 1);
        this._hp = this._maxHp;
        this._isDead = false;
        this._pitch = 0;
        this._verticalVel = 0;
        this._currentWeaponEntityId = -1;

        this._registerInput();

        GameEntry.DataNode.setData('Player/HP',    this._hp);
        GameEntry.DataNode.setData('Player/MaxHP', this._maxHp);

    }

    onHide(_isShutdown: boolean, _userData?: object): void {
        this._unregisterInput();
    }

    onUpdate(dt: number, _rdt: number): void {
        if (this._isDead) return;
        this._handleLook();
        this._handleMove(dt);
    }

    // ---- 配置读取 ----

    private _loadConfig(drId: number): void {
        const table = GameEntry.DataTable.getDataTable(DRPlayer);
        const row   = table?.getDataRow(drId);
        if (!row) {
            GameFrameworkLog.warning('[PlayerEntity] DRPlayer row {0} not found, using defaults.', drId);
            return;
        }
        this._maxHp       = row.MaxHp;
        this._moveSpeed   = row.MoveSpeed;
        this._sprintScale = row.SprintSpeedScale;
        this._jumpSpeed   = row.JumpSpeed;
    }

    // ---- 视角 ----

    private _handleLook(): void {
        if (this._lookDelta.equals(Vec2.ZERO)) return;

        const yaw = -this._lookDelta.x * this.sensitivityH;
        this.node.rotate(Quat.fromEuler(new Quat(), 0, yaw, 0));

        this._pitch = math.clamp(
            this._pitch - this._lookDelta.y * this.sensitivityV,
            -this.pitchMin,
            this.pitchMax,
        );
        this.fpCamera.node.setRotationFromEuler(this._pitch, 0, 0);

        this._lookDelta.set(0, 0);
    }

    // ---- 移动 ----

    private _handleMove(dt: number): void {
        const cc = this.characterController;
        this._isGrounded = cc.isGrounded;

        const speed = this._isSprinting
            ? this._moveSpeed * this._sprintScale
            : this._moveSpeed;

        const fwd   = new Vec3();
        const right = new Vec3();
        Vec3.transformQuat(fwd,   Vec3.FORWARD, this.node.worldRotation);
        Vec3.transformQuat(right, Vec3.RIGHT,   this.node.worldRotation);

        const moveDir = new Vec3();
        Vec3.scaleAndAdd(moveDir, moveDir, fwd,   -this._moveInput.y);
        Vec3.scaleAndAdd(moveDir, moveDir, right,   this._moveInput.x);
        if (!moveDir.equals(Vec3.ZERO)) moveDir.normalize();

        if (this._isGrounded && this._verticalVel < 0) {
            this._verticalVel = 0;
        }
        this._verticalVel -= this.gravity * dt;

        cc.move(new Vec3(
            moveDir.x * speed * dt,
            this._verticalVel * dt,
            moveDir.z * speed * dt,
        ));
    }

    // ---- 输入 ----

    private _registerInput(): void {
        input.on(Input.EventType.MOUSE_MOVE, this._onMouseMove, this);
        input.on(Input.EventType.KEY_DOWN,   this._onKeyDown,   this);
        input.on(Input.EventType.KEY_UP,     this._onKeyUp,     this);
    }

    private _unregisterInput(): void {
        input.off(Input.EventType.MOUSE_MOVE, this._onMouseMove, this);
        input.off(Input.EventType.KEY_DOWN,   this._onKeyDown,   this);
        input.off(Input.EventType.KEY_UP,     this._onKeyUp,     this);
    }

    private _onMouseMove(e: { movementX: number; movementY: number }): void {
        this._lookDelta.x += e.movementX;
        this._lookDelta.y += e.movementY;
    }

    private _onKeyDown(e: { keyCode: KeyCode }): void { this._applyKey(e.keyCode, true); }
    private _onKeyUp  (e: { keyCode: KeyCode }): void { this._applyKey(e.keyCode, false); }

    private _applyKey(key: KeyCode, pressed: boolean): void {
        switch (key) {
            case KeyCode.KEY_W: this._moveInput.y =  (pressed ? 1 : 0); break;
            case KeyCode.KEY_S: this._moveInput.y = -(pressed ? 1 : 0); break;
            case KeyCode.KEY_A: this._moveInput.x = -(pressed ? 1 : 0); break;
            case KeyCode.KEY_D: this._moveInput.x =  (pressed ? 1 : 0); break;
            case KeyCode.SHIFT_LEFT: this._isSprinting = pressed; break;
            case KeyCode.SPACE:
                if (pressed && this._isGrounded) this._verticalVel = this._jumpSpeed;
                break;
        }
    }

    // ---- 武器接口 ----

    get cameraNode(): Camera { return this.fpCamera; }

    /** 由武器系统调用，记录当前装备的武器实体 ID */
    setCurrentWeapon(entityId: number): void {
        this._currentWeaponEntityId = entityId;
    }

    get currentWeaponEntityId(): number { return this._currentWeaponEntityId; }

    // ---- 伤害 ----

    takeDamage(amount: number): void {
        if (this._isDead) return;
        this._hp = Math.max(0, this._hp - amount);
        GameEntry.DataNode.setData('Player/HP', this._hp);
        if (this._hp <= 0) this._onDead();
    }

    get hp(): number    { return this._hp; }
    get isDead(): boolean { return this._isDead; }

    private _onDead(): void {
        this._isDead = true;
        GameFrameworkLog.info('[PlayerEntity] Player dead.');
        // TODO: fire PlayerDieEventArgs
    }
}
