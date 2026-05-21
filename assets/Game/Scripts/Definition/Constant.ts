/** 资源模式，对应 BuiltinDataComponent.resourceMode 编辑器属性。 */
export const enum ResourceMode {
    /** 编辑器模式或无热更，直接加载 resources Bundle */
    Unspecified = 0,
    /** 离线包模式：Bundle 随包发布，通过 ProcedureInitResources 初始化 */
    Package     = 1,
    /** 热更新模式：通过 ProcedureCheckVersion → ProcedureUpdateResources 流程 */
    Updatable   = 2,
}

/**
 * 资源加载优先级常量（数值越大越优先）。
 * 传入 ResourceComponent.loadAsset / loadBundle 的 priority 参数。
 */
export namespace Constant {
    export namespace AssetPriority {
        export const ConfigAsset    = 100;
        export const DataTableAsset = 100;
        export const DictionaryAsset= 100;
        export const FontAsset      = 50;
        export const UIFormAsset    = 50;
        export const SoundAsset     = 30;
        export const UISoundAsset   = 30;
        export const MusicAsset     = 20;
        export const SceneAsset     = 0;
    }

    /**
     * Setting 键名常量。
     * 使用 GameEntry.Setting.getXxx(Constant.Setting.Language) 读取。
     */
    export namespace Setting {
        export const Language        = 'Setting.Language';
        export const MusicMuted      = 'Setting.MusicMuted';
        export const MusicVolume     = 'Setting.MusicVolume';
        export const SoundMuted      = 'Setting.SoundMuted';
        export const SoundVolume     = 'Setting.SoundVolume';
        export const UISoundMuted    = 'Setting.UISoundMuted';
        export const UISoundVolume   = 'Setting.UISoundVolume';
        /** 通用模板：格式化为 Setting.{GroupName}Muted */
        export const SoundGroupMuted  = 'Setting.{0}Muted';
        /** 通用模板：格式化为 Setting.{GroupName}Volume */
        export const SoundGroupVolume = 'Setting.{0}Volume';
    }

    /**
     * 场景层名称常量。
     * 对应 Cocos Creator 场景中节点的 layer 属性，或 UIComponent 的 UI 组名称约定。
     */
    export namespace Layer {
        export const Default         = 'Default';
        export const UI              = 'UI';
        export const TargetableObject= 'Targetable Object';
    }
}
