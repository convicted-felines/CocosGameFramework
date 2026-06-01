import { IUIGroup } from './IUIGroup';

/**
 * UI 窗体接口，对应原版 IUIForm。
 * 引擎层的 UIFormLogic Component 实现此接口。
 */
export interface IUIForm {
    /** 序列号，由 UIManager 分配 */
    readonly serialId: number;
    /** 资源名称 */
    readonly uiFormAssetName: string;
    /** 所属 UI 组 */
    readonly uiGroup: IUIGroup;
    /** 深度（渲染层级） */
    readonly depthInUIGroup: number;
    /** 是否暂停被遮挡的 UI */
    readonly pauseCoveredUIForm: boolean;

    /** 初始化 UI 窗体 */
    onInit(serialId: number, uiFormAssetName: string, uiGroup: IUIGroup, pauseCoveredUIForm: boolean, isNewInstance: boolean, userData?: object): void;
    /** 打开 UI 窗体 */
    onOpen(userData?: object): void;
    /** 关闭 UI 窗体 */
    onClose(isShutdown: boolean, userData?: object): void;
    /** 暂停 UI 窗体（被其他 UI 遮盖时） */
    onPause(): void;
    /** 恢复 UI 窗体（遮盖解除时） */
    onResume(): void;
    /** 遮挡 UI 窗体（不是暂停，仅视觉遮挡） */
    onCover(): void;
    /** 解除遮挡 */
    onReveal(): void;
    /** 聚焦 UI 窗体 */
    onRefocus(userData?: object): void;
    /** UI 窗体轮询 */
    onUpdate(elapseSeconds: number, realElapseSeconds: number): void;
    /** UI 窗体深度变化时回调 */
    onDepthChanged(uiGroupDepth: number, depthInUIGroup: number): void;
    /** 回池时回调 */
    onRecycle(): void;
}
