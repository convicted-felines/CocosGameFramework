import { _decorator, Component } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { FsmManager } from '../../GameFramework/FSM/FsmManager';
import { FsmState } from '../../GameFramework/FSM/FsmState';
import { IFsm } from '../../GameFramework/FSM/IFsm';

const { ccclass } = _decorator;

@ccclass('FsmComponent')
export class FsmComponent extends Component {
    private _manager!: FsmManager;

    get manager(): FsmManager { return this._manager; }

    onLoad(): void {
        this._manager = new FsmManager();
        GameFrameworkEntry.registerModule(MODULE_ID.FSM, this._manager);
    }

    get fsmCount(): number { return this._manager.fsmCount; }

    createFsm<T extends object>(name: string, owner: T, states: FsmState<T>[]): IFsm<T> {
        return this._manager.createFsm(name, owner, states);
    }

    destroyFsm<T extends object>(name: string): boolean {
        return this._manager.destroyFsm(name);
    }

    hasFsm(name: string): boolean {
        return this._manager.hasFsm(name);
    }

    getFsm<T extends object>(name: string): IFsm<T> | null {
        return this._manager.getFsm<T>(name);
    }
}
