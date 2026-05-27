import { _decorator, Enum } from 'cc';
import { GameFrameworkComponent } from '../Base/GameFrameworkComponent';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { DataTableManager } from '../../GameFramework/DataTable/DataTableManager';
import { IDataTable } from '../../GameFramework/DataTable/IDataTable';
import { IDataRow } from '../../GameFramework/DataTable/IDataRow';
import { IEventManager } from '../../GameFramework/Event/IEventManager';
import { IResourceManager } from '../../GameFramework/Resource/IResourceManager';
import { LoadDataTableSuccessEventArgs, LoadDataTableFailureEventArgs } from './DataTableEventArgs';
import { DataTableHelperBase } from './DataTableHelperBase';
import { DefaultDataTableHelper } from './DefaultDataTableHelper';
import { HelperRegistry } from '../Utility/HelperRegistry';
import { DataTableHelperType } from './DataTableHelperType';

const { ccclass, property } = _decorator;

@ccclass('DataTableComponent')
export class DataTableComponent extends GameFrameworkComponent {
    @property({ type: Enum(DataTableHelperType), tooltip: '数据表辅助器类型' })
    dataTableHelperType: DataTableHelperType = DataTableHelperType.DefaultDataTableHelper;

    private _manager!: DataTableManager;
    private _helper!: DataTableHelperBase;
    private _eventManager: IEventManager | null = null;

    get manager(): DataTableManager { return this._manager; }

    onLoad(): void {
        super.onLoad();
        this._manager = new DataTableManager();
        GameFrameworkEntry.registerModule(MODULE_ID.DATATABLE, this._manager);
    }

    start(): void {
        this._helper = HelperRegistry.createHelper(this.node, DataTableHelperType[this.dataTableHelperType], DefaultDataTableHelper);
        if (GameFrameworkEntry.hasModule(MODULE_ID.EVENT)) {
            this._eventManager = GameFrameworkEntry.getModule(
                null as any,
                MODULE_ID.EVENT
            ) as unknown as IEventManager;
        }
    }

    // ---- 数量 ----

    get dataTableCount(): number { return this._manager.count; }

    // ---- 查询 ----

    hasDataTable<T extends IDataRow>(rowType: new () => T, name?: string): boolean {
        return this._manager.hasDataTable(rowType, name);
    }

    getDataTable<T extends IDataRow>(rowType: new () => T, name?: string): IDataTable<T> | null {
        return this._manager.getDataTable<T>(rowType, name);
    }

    getAllDataTables(): IDataTable<any>[] {
        return this._manager.getAllDataTables();
    }

    // ---- 创建 ----

    createDataTable<T extends IDataRow>(rowType: new () => T, name?: string): IDataTable<T> {
        return this._manager.createDataTable<T>(rowType, name);
    }

    // ---- 销毁 ----

    destroyDataTable<T extends IDataRow>(rowTypeOrTable: (new () => T) | IDataTable<T>, name?: string): boolean {
        if (typeof rowTypeOrTable === 'function') {
            return this._manager.destroyDataTable(rowTypeOrTable, name);
        }
        return this._manager.destroyDataTable(rowTypeOrTable);
    }

    // ---- 加载（异步，通过 ResourceManager 读取文本资产后解析） ----

    /**
     * 从资源管理器异步加载并解析一张数据表。
     * 加载结果通过 EventManager 广播 LoadDataTableSuccessEventArgs / LoadDataTableFailureEventArgs。
     */
    loadDataTable<T extends IDataRow>(
        rowType: new () => T,
        dataTableAssetName: string,
        bundleName: string,
        name?: string,
        userData?: any
    ): void {
        if (!GameFrameworkEntry.hasModule(MODULE_ID.RESOURCE)) {
            console.error('[DataTableComponent] ResourceManager not found.');
            return;
        }

        const resourceManager = GameFrameworkEntry.getModule(null as any, MODULE_ID.RESOURCE) as unknown as IResourceManager;
        const startTime = Date.now();

        resourceManager.loadAsset<any>(
            bundleName,
            dataTableAssetName,
            null as any,
            (asset: any, _duration: number) => {
                const text: string = typeof asset === 'string' ? asset
                    : (asset && asset.text) ? asset.text
                    : null;

                if (text === null) {
                    const err = `Asset [${dataTableAssetName}] is not a text asset.`;
                    console.warn(`[DataTableComponent] ${err}`);
                    if (this._eventManager) {
                        this._eventManager.fire(this, LoadDataTableFailureEventArgs.create(dataTableAssetName, err, userData));
                    }
                    return;
                }

                const table = this._manager.hasDataTable(rowType, name)
                    ? this._manager.getDataTable<T>(rowType, name)!
                    : this._manager.createDataTable<T>(rowType, name);

                if (this._helper) {
                    this._helper.parseData(table, text, userData);
                } else {
                    table.parseData(text, userData);
                }

                if (this._eventManager) {
                    const duration = (Date.now() - startTime) / 1000;
                    this._eventManager.fire(this, LoadDataTableSuccessEventArgs.create(dataTableAssetName, duration, userData));
                }
            },
            (assetName: string, errorMsg: string) => {
                console.warn(`[DataTableComponent] Load data table failure, asset name '${assetName}', error: ${errorMsg}`);
                if (this._eventManager) {
                    this._eventManager.fire(this, LoadDataTableFailureEventArgs.create(assetName, errorMsg, userData));
                }
            }
        );
    }
}
