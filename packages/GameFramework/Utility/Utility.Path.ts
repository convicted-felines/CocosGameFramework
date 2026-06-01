export class UtilityPath {
    /** Normalizes backslashes to forward slashes. */
    static getRegularPath(path: string): string {
        if (!path) return path;
        return path.replace(/\\/g, '/');
    }

    /** Converts a local path to a remote URL (adds file:/// prefix if not already a URL). */
    static getRemotePath(path: string): string {
        if (!path) return path;
        const normalized = this.getRegularPath(path);
        if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(normalized)) return normalized;
        return 'file:///' + normalized.replace(/^\/+/, '');
    }

    /** Joins path segments, normalizing slashes. */
    static combine(...segments: string[]): string {
        return this.getRegularPath(segments.join('/').replace(/\/+/g, '/'));
    }

    /** Returns the directory part of a path (everything before the last '/'). */
    static getDirectoryName(path: string): string {
        const normalized = this.getRegularPath(path);
        const idx = normalized.lastIndexOf('/');
        return idx >= 0 ? normalized.substring(0, idx) : '';
    }

    /** Returns the filename including extension. */
    static getFileName(path: string): string {
        const normalized = this.getRegularPath(path);
        const idx = normalized.lastIndexOf('/');
        return idx >= 0 ? normalized.substring(idx + 1) : normalized;
    }

    /** Returns the filename without extension. */
    static getFileNameWithoutExtension(path: string): string {
        const name = this.getFileName(path);
        const dotIdx = name.lastIndexOf('.');
        return dotIdx > 0 ? name.substring(0, dotIdx) : name;
    }

    /** Returns the file extension including the leading dot (e.g. ".png"). */
    static getExtension(path: string): string {
        const name = this.getFileName(path);
        const dotIdx = name.lastIndexOf('.');
        return dotIdx >= 0 ? name.substring(dotIdx) : '';
    }
}
