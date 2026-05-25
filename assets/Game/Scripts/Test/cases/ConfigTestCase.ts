import { ITestCase, ITestItem } from '../TestCase';
import { GameEntry } from '../../Base/GameEntry';

export class ConfigTestCase implements ITestCase {
    readonly name = 'Config 系统';

    readonly items: ITestItem[] = [
        {
            label: 'ConfigComponent 已初始化',
            run: async () => {
                if (!GameEntry.Config) throw new Error('ConfigComponent 未初始化');
            },
        },
        {
            label: '不存在的 key 返回默认值',
            run: async () => {
                if (!GameEntry.Config) throw new Error('ConfigComponent 未初始化');
                const val = GameEntry.Config.getString('__nonexistent_key__', 'default_val');
                if (val !== 'default_val') throw new Error(`期望 "default_val"，得到 "${val}"`);
            },
        },
        {
            label: 'addConfig / hasConfig / removeConfig',
            run: async () => {
                if (!GameEntry.Config) throw new Error('ConfigComponent 未初始化');
                const key = '__test_config_key__';
                GameEntry.Config.addConfig(key, '123');
                if (!GameEntry.Config.hasConfig(key)) throw new Error('addConfig 后 hasConfig 返回 false');
                const intVal = GameEntry.Config.getInt(key);
                if (intVal !== 123) throw new Error(`期望 123，得到 ${intVal}`);
                GameEntry.Config.removeConfig(key);
                if (GameEntry.Config.hasConfig(key)) throw new Error('removeConfig 后 hasConfig 仍返回 true');
            },
        },
    ];
}
