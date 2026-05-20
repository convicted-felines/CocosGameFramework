// 此文件由工具自动生成，请勿手动修改。
// 生成时间：2026/5/20 15:35:49
// 数据表：Aircraft

import { IDataRow } from '../../GameFramework/DataTable/IDataRow';

/** 飞机配置 */
export class DRAircraft implements IDataRow {
    private _id: number = 0;

    get id(): number { return this._id; }

    /** 名称 */
    Name: string = '';
    /** 最大血量 */
    MaxHP: number = 0;
    /** 推进器编号 */
    ThrusterId: number = 0;
    /** 武器0编号 */
    WeaponId0: number = 0;
    /** 武器1编号 */
    WeaponId1: number = 0;
    /** 护甲编号 */
    ArmorId: number = 0;

    parseDataRow(dataRowString: string, _userData?: any): boolean {
        const cols = dataRowString.split('\t');
        let i = 0;
        i++; // 注释列
        this._id = +(cols[i++] || 0);
        this.Name = (cols[i++] || '').trim();
        this.MaxHP = +(cols[i++] || 0);
        this.ThrusterId = +(cols[i++] || 0);
        this.WeaponId0 = +(cols[i++] || 0);
        this.WeaponId1 = +(cols[i++] || 0);
        this.ArmorId = +(cols[i++] || 0);
        return true;
    }
}
