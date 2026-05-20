import { JsonAsset, TextAsset } from 'cc';
import { ProcedureBase } from '../../GameFramework/Procedure/ProcedureBase';
import { IFsm } from '../../GameFramework/FSM/IFsm';
import { ProcedureManager } from '../../GameFramework/Procedure/ProcedureManager';
import { ProcedureChangeScene } from './ProcedureChangeScene';
import { GameEntry } from '../Base/GameEntry';
import { GameFrameworkLog } from '../../GameFramework/Base/Log/GameFrameworkLog';

const DATA_TABLES = [
    'Aircraft', 'Armor', 'Asteroid', 'Entity',
    'Music', 'Scene', 'Sound', 'Thruster',
    'UIForm', 'UISound', 'Weapon',
];

const DICTIONARIES = ['Default'];

export class ProcedurePreload extends ProcedureBase {
    private _loadedFlag: Map<string, boolean> = new Map();

    onEnter(_fsm: IFsm<ProcedureManager>): void {
        this._loadedFlag.clear();

        GameEntry.Resource.loadBundle('resources',
            () => this._onBundleReady(),
            (_name, err) => {
                GameFrameworkLog.warning(`[ProcedurePreload] Bundle load failed: ${err}`);
                this._onBundleReady();
            }
        );
    }

    private _onBundleReady(): void {
        this._loadConfig('DefaultConfig');
        for (const name of DATA_TABLES) this._loadDataTable(name);
        for (const name of DICTIONARIES) this._loadDictionary(name);
    }

    onUpdate(fsm: IFsm<ProcedureManager>, _e: number, _r: number): void {
        if (this._loadedFlag.size === 0) return;

        for (const loaded of this._loadedFlag.values()) {
            if (!loaded) return;
        }

        GameFrameworkLog.info('[ProcedurePreload] All assets preloaded.');
        fsm.setData('NextSceneName', 'Menu');
        this.changeState(fsm, ProcedureChangeScene);
    }

    private _loadConfig(configName: string): void {
        const key = `Config:${configName}`;
        this._loadedFlag.set(key, false);
        GameEntry.Resource.loadAsset(
            'resources', `Config/${configName}`, JsonAsset,
            (_asset, _dur) => {
                GameFrameworkLog.info(`[ProcedurePreload] Config '${configName}' OK.`);
                this._loadedFlag.set(key, true);
            },
            (_name, err) => {
                GameFrameworkLog.warning(`[ProcedurePreload] Config '${configName}' failed: ${err}.`);
                this._loadedFlag.set(key, true);
            }
        );
    }

    private _loadDataTable(tableName: string): void {
        const key = `DataTable:${tableName}`;
        this._loadedFlag.set(key, false);
        GameEntry.Resource.loadAsset(
            'resources', `DataTables/${tableName}`, JsonAsset,
            (_asset, _dur) => {
                GameFrameworkLog.info(`[ProcedurePreload] DataTable '${tableName}' OK.`);
                this._loadedFlag.set(key, true);
            },
            (_name, err) => {
                GameFrameworkLog.warning(`[ProcedurePreload] DataTable '${tableName}' failed: ${err}.`);
                this._loadedFlag.set(key, true);
            }
        );
    }

    private _loadDictionary(dictName: string): void {
        const key = `Dict:${dictName}`;
        this._loadedFlag.set(key, false);
        GameEntry.Resource.loadAsset(
            'resources', `Localization/${dictName}`, TextAsset,
            (asset, _dur) => {
                GameFrameworkLog.info(`[ProcedurePreload] Dictionary '${dictName}' OK.`);
                const helper = GameEntry.Localization.helper;
                if (helper && asset.text) {
                    helper.parseData(GameEntry.Localization, asset.text);
                }
                this._loadedFlag.set(key, true);
            },
            (_name, err) => {
                GameFrameworkLog.warning(`[ProcedurePreload] Dictionary '${dictName}' failed: ${err}.`);
                this._loadedFlag.set(key, true);
            }
        );
    }
}
