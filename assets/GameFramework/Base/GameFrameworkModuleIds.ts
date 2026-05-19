export const MODULE_ID = {
    EVENT:        'GameFramework.IEventManager',
    FSM:          'GameFramework.IFsmManager',
    PROCEDURE:    'GameFramework.IProcedureManager',
    SETTING:      'GameFramework.ISettingManager',
    CONFIG:       'GameFramework.IConfigManager',
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
    WEBREQUEST:   'GameFramework.IWebRequestManager',
    DATANODE:     'GameFramework.IDataNodeManager',
    FILESYSTEM:   'GameFramework.IFileSystemManager',
} as const;

export type ModuleId = typeof MODULE_ID[keyof typeof MODULE_ID];
