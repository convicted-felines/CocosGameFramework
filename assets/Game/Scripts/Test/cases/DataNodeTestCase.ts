import { ITestCase, ITestItem } from '../TestCase';
import { GameEntry } from '../../Base/GameEntry';

export class DataNodeTestCase implements ITestCase {
    readonly name = 'DataNode 系统';

    readonly items: ITestItem[] = [
        {
            label: 'Set / Get 基本数据',
            run: async () => {
                if (!GameEntry.DataNode) throw new Error('DataNodeComponent 未初始化');
                const path = '__test__.value';
                GameEntry.DataNode.setData<number>(path, 42);
                const v = GameEntry.DataNode.getData<number>(path);
                if (v !== 42) throw new Error(`期望 42，得到 ${v}`);
                GameEntry.DataNode.removeNode('__test__');
            },
        },
        {
            label: '层级路径访问',
            run: async () => {
                if (!GameEntry.DataNode) throw new Error('DataNodeComponent 未初始化');
                GameEntry.DataNode.setData<string>('__test__.a.b', 'deep');
                const v = GameEntry.DataNode.getData<string>('__test__.a.b');
                if (v !== 'deep') throw new Error(`期望 "deep"，得到 ${v}`);
                GameEntry.DataNode.removeNode('__test__');
            },
        },
        {
            label: '不存在路径返回 null',
            run: async () => {
                if (!GameEntry.DataNode) throw new Error('DataNodeComponent 未初始化');
                const v = GameEntry.DataNode.getData<number>('__nonexistent__.key');
                if (v !== null) throw new Error(`期望 null，得到 ${v}`);
            },
        },
    ];
}
