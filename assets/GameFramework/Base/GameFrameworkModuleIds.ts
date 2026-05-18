export const MODULE_ID = {
    EVENT:        'GameFramework.IEventManager',
    FSM:          'GameFramework.IFsmManager',
    PROCEDURE:    'GameFramework.IProcedureManager',
    SETTING:      'GameFramework.ISettingManager',
    DATATABLE:    'GameFramework.IDataTableManager',
    RESOURCE:     'GameFramework.IResourceManager',
    OBJPOOL:      'GameFramework.IObjectPoolManager',
    UI:           'GameFramework.IUIManager',
    ENTITY:       'GameFramework.IEntityManager',
    SOUND:        'GameFramework.ISoundManager',
    SCENE:        'GameFramework.ISceneManager',
    NETWORK:      'GameFramework.INetworkManager',
    LOCALIZATION: 'GameFramework.ILocalizationManager',
    DOWNLOAD:     'GameFramework.IDownloadManager',
} as const;

export type ModuleId = typeof MODULE_ID[keyof typeof MODULE_ID];
