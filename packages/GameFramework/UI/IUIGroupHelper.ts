import { IUIFormInfo, IUIGroup } from './IUIGroup';

/**
 * UI 组辅助接口，对应原版 IUIGroupHelper。
 * 负责管理一组 UI 的渲染深度与可见性。
 */
export interface IUIGroupHelper {
    /** 设置 UI 组深度 */
    setDepth(uiGroup: IUIGroup, depth: number): void;
}
