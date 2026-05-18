import { _decorator, Component, Node } from 'cc';
import { GameFrameworkEntry } from '../../GameFramework/Base/GameFrameworkEntry';
import { MODULE_ID } from '../../GameFramework/Base/GameFrameworkModuleIds';
import { CocosDownloadManager } from './CocosDownloadManager';
import { IDownloadParams } from '../../GameFramework/Download/IDownloadManager';

const { ccclass, property } = _decorator;

@ccclass('DownloadComponent')
export class DownloadComponent extends Component {
    /** 下载默认超时时间（毫秒） */
    @property({ tooltip: '下载默认超时时间（毫秒）' })
    defaultTimeout: number = 30000;

    private _manager!: CocosDownloadManager;

    get manager(): CocosDownloadManager { return this._manager; }

    onLoad(): void {
        this._manager = new CocosDownloadManager();
        GameFrameworkEntry.registerModule(MODULE_ID.DOWNLOAD, this._manager);
    }

    get totalCount(): number { return this._manager.totalCount; }
    get pendingCount(): number { return this._manager.pendingCount; }

    addDownload(url: string, savePath: string, params?: IDownloadParams): number {
        return this._manager.addDownload(url, savePath, {
            timeout: this.defaultTimeout,
            ...params,
        });
    }

    removeDownload(serialId: number): boolean {
        return this._manager.removeDownload(serialId);
    }

    removeDownloadsByTag(tag: string): number {
        return this._manager.removeDownloadsByTag(tag);
    }
}
