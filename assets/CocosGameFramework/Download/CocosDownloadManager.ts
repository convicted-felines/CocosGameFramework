import { Node } from 'cc';
import { DownloadManager } from '../../GameFramework/Download/DownloadManager';
import { HelperRegistry } from '../Base/HelperRegistry';
import { DefaultDownloadAgentHelper } from './DefaultDownloadAgentHelper';
import { DownloadAgentHelperBase } from './DownloadAgentHelperBase';

export class CocosDownloadManager extends DownloadManager {
    /**
     * 根据辅助器类型名和数量，在指定父节点下创建辅助器实例并注入管理器。
     * 由 DownloadComponent.onLoad() 调用。
     */
    createAndAddHelpers(parent: Node, helperTypeName: string, count: number): void {
        for (let i = 0; i < count; i++) {
            const helper = HelperRegistry.createHelper(
                parent,
                helperTypeName,
                DefaultDownloadAgentHelper,
            ) as DownloadAgentHelperBase;
            this.addDownloadAgentHelper(helper);
        }
    }
}
