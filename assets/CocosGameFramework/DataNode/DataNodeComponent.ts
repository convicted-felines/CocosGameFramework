import { GameFrameworkEntry, MODULE_ID, DataNodeManager, IDataNode } from '@game-studio/game-framework';
import { _decorator } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';





const { ccclass } = _decorator;

@ccclass('DataNodeComponent')
export class DataNodeComponent extends GameFrameworkComponent {
    private _manager!: DataNodeManager;

    get manager(): DataNodeManager { return this._manager; }
    get root(): IDataNode { return this._manager.root; }

    onLoad(): void {
        super.onLoad();
        this._manager = new DataNodeManager();
        GameFrameworkEntry.registerModule(MODULE_ID.DATANODE, this._manager);
    }

    getData<T>(path: string, fromNode?: IDataNode): T | null {
        return this._manager.getData<T>(path, fromNode);
    }

    setData<T>(path: string, data: T, fromNode?: IDataNode): void {
        this._manager.setData<T>(path, data, fromNode);
    }

    getNode(path: string, fromNode?: IDataNode): IDataNode | null {
        return this._manager.getNode(path, fromNode);
    }

    getOrAddNode(path: string, fromNode?: IDataNode): IDataNode {
        return this._manager.getOrAddNode(path, fromNode);
    }

    removeNode(path: string, fromNode?: IDataNode): void {
        this._manager.removeNode(path, fromNode);
    }

    clear(): void {
        this._manager.clear();
    }
}
