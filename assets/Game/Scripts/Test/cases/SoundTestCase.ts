import { ITestCase, ITestItem } from '../TestCase';
import { GameEntry } from '../../Base/GameEntry';

export class SoundTestCase implements ITestCase {
    readonly name = 'Sound 系统';

    readonly items: ITestItem[] = [
        {
            label: 'SoundComponent 已初始化',
            run: async () => {
                if (!GameEntry.Sound) throw new Error('SoundComponent 未初始化');
            },
        },
        {
            label: '音效分组数量 > 0',
            run: async () => {
                if (!GameEntry.Sound) throw new Error('SoundComponent 未初始化');
                const count = GameEntry.Sound.soundGroupCount;
                if (count <= 0) throw new Error(`期望分组数 > 0，实际为 ${count}`);
            },
        },
        {
            label: 'Music 分组音量 getter/setter',
            run: async () => {
                if (!GameEntry.Sound) throw new Error('SoundComponent 未初始化');
                if (!GameEntry.Sound.hasSoundGroup('Music')) throw new Error('Music 分组不存在');
                const original = GameEntry.Sound.getVolume('Music');
                GameEntry.Sound.setVolume('Music', 0.5);
                const after = GameEntry.Sound.getVolume('Music');
                GameEntry.Sound.setVolume('Music', original);
                if (Math.abs(after - 0.5) > 0.001) throw new Error(`setVolume 写入 0.5，getVolume 读到 ${after}`);
            },
        },
        {
            label: 'Sound 分组 Mute getter/setter',
            run: async () => {
                if (!GameEntry.Sound) throw new Error('SoundComponent 未初始化');
                if (!GameEntry.Sound.hasSoundGroup('Sound')) throw new Error('Sound 分组不存在');
                const original = GameEntry.Sound.isMuted('Sound');
                GameEntry.Sound.setMuted('Sound', true);
                if (!GameEntry.Sound.isMuted('Sound')) throw new Error('setMuted(true) 后 isMuted 返回 false');
                GameEntry.Sound.setMuted('Sound', original);
            },
        },
    ];
}
