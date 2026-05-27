import { ProcedureBase } from 'db://assets/GameFramework/Procedure/ProcedureBase';
import { IFsm } from 'db://assets/GameFramework/FSM/IFsm';
import { ProcedureManager } from 'db://assets/GameFramework/Procedure/ProcedureManager';
import { ProcedureChangeScene } from 'db://assets/Game/Scripts/Procedure/ProcedureChangeScene';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';
import { PlayerEntity, PlayerEntityData } from 'db://assets/Game/Scripts/FPS/Entity/PlayerEntity';
import { WeaponEntityData } from 'db://assets/Game/Scripts/FPS/Entity/WeaponEntity';
import { ShowEntitySuccessEventArgs } from 'db://assets/GameFramework/Entity/EntityEventArgs';
import { BaseEventArgs } from 'db://assets/GameFramework/Event/BaseEventArgs';
import { DRPlayer } from 'db://assets/Game/Scripts/DataTable/DRPlayer';

const ENTITY_ID_PLAYER = 1001;
const ENTITY_ID_WEAPON = 1002;

const DR_PLAYER_ID = 1;
const PLAYER_ENTITY_GROUP = 'Player';
const WEAPON_ENTITY_GROUP = 'Weapon';

export class ProcedureFPS extends ProcedureBase {
    private _gotoMenu      = false;
    private _weaponSpawned = false;

    onEnter(_fsm: IFsm<ProcedureManager>): void {
        this._gotoMenu      = false;
        this._weaponSpawned = false;
        GameFrameworkLog.info('[ProcedureFPS] FPS game started.');

        GameEntry.Event.subscribe(ShowEntitySuccessEventArgs.eventId, this._onEntityShown, this);

        const playerData: PlayerEntityData = { drPlayerId: DR_PLAYER_ID };
        GameEntry.Entity.showEntity(
            ENTITY_ID_PLAYER,
            'FPS/Prefabs/Player',
            'resources',
            PLAYER_ENTITY_GROUP,
            0,
            playerData,
        );
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        if (!this._gotoMenu) return;
        fsm.setData('NextSceneName', 'Menu');
        this.changeState(fsm, ProcedureChangeScene);
    }

    onLeave(_fsm: IFsm<ProcedureManager>, _isShutdown: boolean): void {
        GameEntry.Event.unsubscribe(ShowEntitySuccessEventArgs.eventId, this._onEntityShown);
        GameEntry.Entity.hideAllEntitiesInGroup(PLAYER_ENTITY_GROUP);
        GameEntry.Entity.hideAllEntitiesInGroup(WEAPON_ENTITY_GROUP);
    }

    private _onEntityShown(_sender: object, e: BaseEventArgs): void {
        const args = e as ShowEntitySuccessEventArgs;
        if (args.entityId !== ENTITY_ID_PLAYER || this._weaponSpawned) return;
        this._weaponSpawned = true;

        const player = GameEntry.Entity.getEntity(ENTITY_ID_PLAYER) as PlayerEntity | null;
        if (!player) return;

        const drPlayer = GameEntry.DataTable.getDataTable(DRPlayer)?.getDataRow(DR_PLAYER_ID);
        const defaultWeaponId = drPlayer?.DefaultWeaponId ?? 1;

        const weaponData: WeaponEntityData = {
            drWeaponId:    defaultWeaponId,
            ownerEntityId: ENTITY_ID_PLAYER,
            cameraNode:    player.cameraNode,
        };

        GameEntry.Entity.showEntity(
            ENTITY_ID_WEAPON,
            `FPS/Prefabs/Weapon_${defaultWeaponId}`,
            'resources',
            WEAPON_ENTITY_GROUP,
            0,
            weaponData,
        );

        player.setCurrentWeapon(ENTITY_ID_WEAPON);
    }

    /** 游戏结束或玩家主动退出时调用 */
    exitToMenu(): void {
        this._gotoMenu = true;
    }
}
