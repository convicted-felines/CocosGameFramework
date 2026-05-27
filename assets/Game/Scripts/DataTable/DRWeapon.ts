// 此文件由工具自动生成，请勿手动修改。
// 数据表：Weapon

import { IDataRow } from 'db://assets/GameFramework/DataTable/IDataRow';

/** 武器配置表 */
export class DRWeapon implements IDataRow {
    private _id: number = 0;

    get id(): number { return this._id; }

    /** 武器名称 */
    Name: string = '';
    /** 武器 Prefab 资源名（Entity 加载用） */
    AssetName: string = '';
    /** 射击模式：0=半自动（单发），1=全自动（连发） */
    FireMode: number = 0;
    /** 开火行为类型：0=即时射线 1=抛射物 2=持续光束 3=蓄力释放 */
    FireBehaviorType: number = 0;
    /** 子弹配置 ID（对应 DRBullet.id，FireBehaviorType=1/3 有效） */
    BulletId: number = 0;
    /** 每次开火发射的子弹数（散弹枪填 >1） */
    BulletCount: number = 1;
    /** 散布半锥角（度），0 表示无散布 */
    SpreadAngle: number = 0;
    /** 每秒射速（全自动 / 光束模式有效） */
    FireRate: number = 0;
    /** 即时射线伤害 / 抛射物默认伤害（DRBullet.Damage=0 时使用） */
    Damage: number = 0;
    /** 即时射线最大射程 */
    Range: number = 0;
    /** 弹夹容量 */
    ClipSize: number = 0;
    /** 最大备弹数 */
    MaxAmmo: number = 0;
    /** 换弹时间（秒） */
    ReloadTime: number = 0;
    /** 射击时后坐力（垂直方向俯仰偏移量，度） */
    RecoilPitch: number = 0;
    /** 蓄力满充时间（秒），FireBehaviorType=3 有效 */
    ChargeTime: number = 0;
    /** 枪口特效资源名（空字符串表示不播放） */
    MuzzleEffectAsset: string = '';

    parseDataRow(dataRowString: string, _userData?: any): boolean {
        const cols = dataRowString.split('\t');
        let i = 0;
        i++; // 注释列
        this._id = +(cols[i++] || 0);
        i++; // 注释列
        this.Name              = (cols[i++] || '').trim();
        this.AssetName         = (cols[i++] || '').trim();
        this.FireMode          = +(cols[i++] || 0);
        this.FireBehaviorType  = +(cols[i++] || 0);
        this.BulletId          = +(cols[i++] || 0);
        this.BulletCount       = +(cols[i++] || 1);
        this.SpreadAngle       = +(cols[i++] || 0);
        this.FireRate          = +(cols[i++] || 0);
        this.Damage            = +(cols[i++] || 0);
        this.Range             = +(cols[i++] || 0);
        this.ClipSize          = +(cols[i++] || 0);
        this.MaxAmmo           = +(cols[i++] || 0);
        this.ReloadTime        = +(cols[i++] || 0);
        this.RecoilPitch       = +(cols[i++] || 0);
        this.ChargeTime        = +(cols[i++] || 0);
        this.MuzzleEffectAsset = (cols[i++] || '').trim();
        return this._id > 0;
    }
}
