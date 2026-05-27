// 仓库地址 https://github.com/convicted-felines/CocosGameFramework.git
// 此文件由工具自动生成，请勿手动修改。
// 生成时间：2026/5/26 11:00:45
// 数据表：Sound

import { IDataRow } from 'db://assets/GameFramework/DataTable/IDataRow';

/** 声音配置表 */
export class DRSound implements IDataRow {
    private _id: number = 0;

    get id(): number { return this._id; }

    /** 资源名称 */
    AssetName: string = '';
    /** 优先级（默认0，128最高，-128最低） */
    Priority: number = 0;
    /** 是否循环 */
    Loop: boolean = false;
    /** 音量（0~1） */
    Volume: number = 0;
    /** 声音空间混合量（0为2D，1为3D，中间值混合效果） */
    SpatialBlend: number = 0;
    /** 声音最大距离 */
    MaxDistance: number = 0;

    parseDataRow(dataRowString: string, _userData?: any): boolean {
        const cols = dataRowString.split('\t');
        let i = 0;
        i++; // 注释列
        this._id = +(cols[i++] || 0);
        i++; // 注释列
        this.AssetName = (cols[i++] || '').trim();
        this.Priority = +(cols[i++] || 0);
        this.Loop = (cols[i++] || '').trim().toLowerCase() === 'true' || (cols[i++] || '') === '1';
        this.Volume = +(cols[i++] || 0);
        this.SpatialBlend = +(cols[i++] || 0);
        this.MaxDistance = +(cols[i++] || 0);
        return true;
    }
}
