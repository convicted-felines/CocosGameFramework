// 此文件由工具自动生成，请勿手动修改。
// 数据表：Bullet

import { IDataRow } from 'db://assets/GameFramework/DataTable/IDataRow';

/** 子弹/抛射物配置表 */
export class DRBullet implements IDataRow {
    private _id: number = 0;

    get id(): number { return this._id; }

    /** 子弹 Prefab 资源名 */
    AssetName: string = '';
    /** 飞行行为类型：0=直线 1=追踪 2=反弹 3=范围爆炸 */
    BehaviorType: number = 0;
    /** 飞行速度（单位/秒） */
    Speed: number = 0;
    /** 最长存活时间（秒），超时自动销毁 */
    Lifetime: number = 0;
    /** 伤害覆盖值，0 表示使用武器的 Damage 字段 */
    Damage: number = 0;
    /** 爆炸半径（BehaviorType=3 有效） */
    ExplosionRadius: number = 0;
    /** 追踪转向速度（BehaviorType=1 有效，度/秒） */
    HomingStrength: number = 0;
    /** 最大反弹次数（BehaviorType=2 有效） */
    BounceCount: number = 0;
    /** 飞行拖尾特效资源名（空字符串表示不播放） */
    TrailEffectAsset: string = '';
    /** 命中特效资源名（空字符串表示不播放） */
    HitEffectAsset: string = '';

    parseDataRow(dataRowString: string, _userData?: any): boolean {
        const cols = dataRowString.split('\t');
        let i = 0;
        i++; // 注释列
        this._id = +(cols[i++] || 0);
        i++; // 注释列
        this.AssetName        = (cols[i++] || '').trim();
        this.BehaviorType     = +(cols[i++] || 0);
        this.Speed            = +(cols[i++] || 0);
        this.Lifetime         = +(cols[i++] || 0);
        this.Damage           = +(cols[i++] || 0);
        this.ExplosionRadius  = +(cols[i++] || 0);
        this.HomingStrength   = +(cols[i++] || 0);
        this.BounceCount      = +(cols[i++] || 0);
        this.TrailEffectAsset = (cols[i++] || '').trim();
        this.HitEffectAsset   = (cols[i++] || '').trim();
        return this._id > 0;
    }
}
