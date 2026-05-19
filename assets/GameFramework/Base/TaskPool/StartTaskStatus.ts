export const enum StartTaskStatus {
    /** 任务可立即完成，代理可立即释放。 */
    Done = 0,
    /** 任务正在进行，代理继续持有。 */
    CanResume,
    /** 任务需等待其他任务完成后再处理。 */
    HasToWait,
    /** 发生未知错误，任务和代理均释放。 */
    UnknownError,
}
