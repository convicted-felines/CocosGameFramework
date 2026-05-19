export const enum ShutdownType {
    /** 仅关闭框架，不影响场景和进程。 */
    None    = 0,
    /** 关闭框架后重新加载当前场景。 */
    Restart = 1,
    /** 关闭框架后退出应用程序。 */
    Quit    = 2,
}
