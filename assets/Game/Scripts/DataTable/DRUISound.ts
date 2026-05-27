// 仓库地址 https://github.com/convicted-felines/CocosGameFramework.git
// 此文件由工具自动生成，请勿手动修改。
// 生成时间：2026/5/26 11:00:45
// 数据表：UISound

import { IDataRow } from 'db://assets/GameFramework/DataTable/IDataRow';

/** 界面声音配置表 */
export class DRUISound implements IDataRow {
    private _id: number = 0;

    get id(): number { return this._id; }

    /** 资源名称 */
    AssetName: string = '';
    /** 优先级（默认0，128最高，-128最低） */
    Priority: number = 0;
    /** 音量（0~1） */
    Volume: number = 0;

    parseDataRow(dataRowString: string, _userData?: any): boolean {
        const cols = dataRowString.split('\t');
        let i = 0;
        i++; // 注释列
        this._id = +(cols[i++] || 0);
        i++; // 注释列
        this.AssetName = (cols[i++] || '').trim();
        this.Priority = +(cols[i++] || 0);
        this.Volume = +(cols[i++] || 0);
        return true;
    }
}
