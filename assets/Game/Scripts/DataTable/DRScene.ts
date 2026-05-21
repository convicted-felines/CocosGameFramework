// 此文件由工具自动生成，请勿手动修改。
// 生成时间：2026/5/20 15:35:49
// 数据表：Scene

import { IDataRow } from 'db://assets/GameFramework/DataTable/IDataRow';

/** 场景配置 */
export class DRScene implements IDataRow {
    private _id: number = 0;

    get id(): number { return this._id; }

    /** 资源名称 */
    AssetName: string = '';
    /** 背景音乐编号 */
    BackgroundMusicId: number = 0;

    parseDataRow(dataRowString: string, _userData?: any): boolean {
        const cols = dataRowString.split('\t');
        let i = 0;
        i++; // 注释列
        this._id = +(cols[i++] || 0);
        this.AssetName = (cols[i++] || '').trim();
        this.BackgroundMusicId = +(cols[i++] || 0);
        return true;
    }
}
