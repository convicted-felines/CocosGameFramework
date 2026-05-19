import { _decorator } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { FsmManager } from '../../GameFramework/FSM/FsmManager';
import { FsmState } from '../../GameFramework/FSM/FsmState';
import { IFsm } from '../../GameFramework/FSM/IFsm';

const { ccclass } = _decorator;

@ccclass('FsmComponent')
export class FsmComponent extends GameFrameworkComponent {
    private _manager!: FsmManager;

    get manager(): FsmManager { return this._manager; }

    onLoad(): void {
        super.onLoad();
        this._manager = new FsmManager();
        GameFrameworkEntry.registerModule(MODULE_ID.FSM, this._manager);
    }

    get fsmCount(): number { return this._manager.fsmCount; }

    createFsm<T extends object>(name: string, owner: T, states: FsmState<T>[]): IFsm<T> {
        return this._manager.createFsm(name, owner, states);
    }

    hasFsm<T extends object>(ownerCtor: new (...args: any[]) => T, name: string = ''): boolean {
        return this._manager.hasFsm(ownerCtor, name);
    }

    getFsm<T extends object>(ownerCtor: new (...args: any[]) => T, name: string = ''): IFsm<T> | null {
        return this._manager.getFsm<T>(ownerCtor, name);
    }

    getAllFsms(): IFsm<any>[] {
        return this._manager.getAllFsms();
    }

    destroyFsm<T extends object>(ownerCtor: new (...args: any[]) => T, name: string = ''): boolean {
        return this._manager.destroyFsm(ownerCtor, name);
    }

    destroyFsmByInstance<T extends object>(fsm: IFsm<T>): boolean {
        return this._manager.destroyFsmByInstance(fsm);
    }
}
