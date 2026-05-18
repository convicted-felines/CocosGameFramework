import { _decorator, Component } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { DataTableManager } from '../../GameFramework/DataTable/DataTableManager';
import { IDataTable } from '../../GameFramework/DataTable/IDataTable';
import { IDataRow } from '../../GameFramework/DataTable/IDataRow';

const { ccclass } = _decorator;

@ccclass('DataTableComponent')
export class DataTableComponent extends Component {
    private _manager!: DataTableManager;

    get manager(): DataTableManager { return this._manager; }

    onLoad(): void {
        this._manager = new DataTableManager();
        GameFrameworkEntry.registerModule(MODULE_ID.DATATABLE, this._manager);
    }

    get dataTableCount(): number { return this._manager.count; }

    createDataTable<T extends IDataRow>(name: string, RowClass: new () => T): IDataTable<T> {
        return this._manager.createDataTable<T>(name, RowClass);
    }

    destroyDataTable(name: string): boolean {
        return this._manager.destroyDataTable(name);
    }

    hasDataTable(name: string): boolean {
        return this._manager.hasDataTable(name);
    }

    getDataTable<T extends IDataRow>(name: string): IDataTable<T> | null {
        return this._manager.getDataTable<T>(name);
    }
}
