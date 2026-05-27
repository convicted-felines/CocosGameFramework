// 仓库地址 https://github.com/convicted-felines/CocosGameFramework.git
// 此文件由工具自动生成，请勿手动修改。
// 生成时间：2026/5/26 11:00:45
// 数据表：Player

import { IDataRow } from 'db://assets/GameFramework/DataTable/IDataRow';

/** 界面声音配置表 */
export class DRPlayer implements IDataRow {
    private _id: number = 0;

    get id(): number { return this._id; }

    /** 最大生命值 */
    MaxHp: number = 0;
    /** 行走速度（单位/秒） */
    MoveSpeed: number = 0;
    /** 冲刺倍率（Shift 键）；最终速度 = MoveSpeed × 该值 */
    SprintSpeedScale: number = 0;
    /** 跳跃初速度 */
    JumpSpeed: number = 0;
    /** 出生时持有的武器，对应后续 DRWeapon.id */
    DefaultWeaponId: number = 0;
    /** 最多同时携带的武器数量 */
    MaxWeaponSlots: number = 0;

    parseDataRow(dataRowString: string, _userData?: any): boolean {
        const cols = dataRowString.split('\t');
        let i = 0;
        i++; // 注释列
        this._id = +(cols[i++] || 0);
        i++; // 注释列
        this.MaxHp = +(cols[i++] || 0);
        this.MoveSpeed = +(cols[i++] || 0);
        this.SprintSpeedScale = +(cols[i++] || 0);
        this.JumpSpeed = +(cols[i++] || 0);
        this.DefaultWeaponId = +(cols[i++] || 0);
        this.MaxWeaponSlots = +(cols[i++] || 0);
        return true;
    }
}
