/** 文件系统中单个文件的基本信息。 */
export interface FileInfo {
    readonly name: string;
    readonly offset: number;
    readonly length: number;
    readonly isValid: boolean;
}

export function makeFileInfo(name: string, offset: number, length: number): FileInfo {
    return { name, offset, length, isValid: true };
}

export const INVALID_FILE_INFO: FileInfo = { name: '', offset: 0, length: 0, isValid: false };
