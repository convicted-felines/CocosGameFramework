// 仓库地址 https://github.com/convicted-felines/CocosGameFramework.git
// 此文件由工具自动生成，请勿手动修改。
// 生成时间：2026/5/22 18:03:59
// 数据表：Music

import { IDataRow } from 'db://assets/GameFramework/DataTable/IDataRow';

/** 音乐配置表 */
export class DRMusic implements IDataRow {
    private _id: number = 0;

    get id(): number { return this._id; }

    /** 资源名称 */
    AssetName: string = '';

    parseDataRow(dataRowString: string, _userData?: any): boolean {
        const cols = dataRowString.split('\t');
        let i = 0;
        i++; // 注释列
        this._id = +(cols[i++] || 0);
        i++; // 注释列
        this.AssetName = (cols[i++] || '').trim();
        return true;
    }
}
