import { ITestCase, ITestItem } from '../TestCase';
import { ReferencePool } from 'db://assets/GameFramework/ReferencePool/ReferencePool';
import { IReference } from 'db://assets/GameFramework/ReferencePool/IReference';
import { GameEntry } from '../../Base/GameEntry';

class _TestRef implements IReference {
    value: number = 0;
    clear(): void { this.value = 0; }
}

export class ReferencePoolTestCase implements ITestCase {
    readonly name = 'ReferencePool 系统';

    readonly items: ITestItem[] = [
        {
            label: 'Acquire 获取实例',
            run: async () => {
                const ref = ReferencePool.acquire(_TestRef);
                if (!ref) throw new Error('acquire 返回 null');
                if (!(ref instanceof _TestRef)) throw new Error('类型不匹配');
                ReferencePool.release(ref);
            },
        },
        {
            label: 'Release 后可重复利用',
            run: async () => {
                const ref1 = ReferencePool.acquire(_TestRef);
                ref1.value = 99;
                ReferencePool.release(ref1);
                const ref2 = ReferencePool.acquire(_TestRef);
                if (ref2.value !== 0) throw new Error(`clear() 未执行，value=${ref2.value}`);
                ReferencePool.release(ref2);
            },
        },
        {
            label: 'ReferencePoolComponent 统计信息',
            run: async () => {
                if (!GameEntry.ReferencePool) throw new Error('ReferencePoolComponent 未初始化');
                const infos = GameEntry.ReferencePool.getAllReferencePoolInfos();
                if (!Array.isArray(infos)) throw new Error('getAllReferencePoolInfos 返回非数组');
            },
        },
    ];
}
