// 此文件由工具自动生成，请勿手动修改。
// 生成时间：2026/5/20 15:35:49
// 数据表：Weapon

import { IDataRow } from '../../GameFramework/DataTable/IDataRow';

/** 武器配置 */
export class DRWeapon implements IDataRow {
    private _id: number = 0;

    get id(): number { return this._id; }

    /** 攻击段数 */
    AttackSegmentCount: number = 0;
    /** 攻击力0 */
    Attack0: number = 0;
    /** 攻击力1 */
    Attack1: number = 0;
    /** 冷却时间 */
    CD: number = 0;

    parseDataRow(dataRowString: string, _userData?: any): boolean {
        const cols = dataRowString.split('\t');
        let i = 0;
        i++; // 注释列
        this._id = +(cols[i++] || 0);
        this.AttackSegmentCount = +(cols[i++] || 0);
        this.Attack0 = +(cols[i++] || 0);
        this.Attack1 = +(cols[i++] || 0);
        this.CD = +(cols[i++] || 0);
        return true;
    }
}
