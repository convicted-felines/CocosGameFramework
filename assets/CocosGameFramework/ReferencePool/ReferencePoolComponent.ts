import { _decorator, Component } from 'cc';
import { ReferencePool } from '../../GameFramework/ReferencePool/ReferencePool';
import { ReferencePoolInfo } from '../../GameFramework/ReferencePool/ReferencePoolInfo';

const { ccclass, property } = _decorator;

@ccclass('ReferencePoolComponent')
export class ReferencePoolComponent extends Component {
    @property({ tooltip: '启用严格检查（会降低性能，建议仅在开发时开启）' })
    private _enableStrictCheck: boolean = false;

    onLoad(): void {
        ReferencePool.enableStrictCheck = this._enableStrictCheck;
    }

    onDestroy(): void {
        ReferencePool.clearAll();
    }

    get enableStrictCheck(): boolean {
        return ReferencePool.enableStrictCheck;
    }

    set enableStrictCheck(value: boolean) {
        ReferencePool.enableStrictCheck = value;
    }

    get count(): number {
        return ReferencePool.count;
    }

    getAllReferencePoolInfos(): ReferencePoolInfo[] {
        return ReferencePool.getAllReferencePoolInfos();
    }

    clearAll(): void {
        ReferencePool.clearAll();
    }
}
