import { GameFrameworkEntry, MODULE_ID, FsmManager, FsmState, IFsm } from '@game-studio/game-framework';
import { _decorator } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';






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
