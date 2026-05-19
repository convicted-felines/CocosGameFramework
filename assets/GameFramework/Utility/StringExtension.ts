/**
 * String utility extensions, ported from UnityGameFramework StringExtension.cs.
 */
export class StringExtension {
    /**
     * Reads the next line from a string starting at position.
     * Advances pos.value past the line terminator.
     * Returns null when there are no more characters.
     */
    static readLine(str: string, pos: { value: number }): string | null {
        if (pos.value >= str.length) return null;
        const start = pos.value;
        while (pos.value < str.length) {
            const ch = str[pos.value];
            if (ch === '\n') {
                const line = str.substring(start, pos.value);
                pos.value++;
                return line.endsWith('\r') ? line.slice(0, -1) : line;
            }
            if (ch === '\r') {
                const line = str.substring(start, pos.value);
                pos.value++;
                if (pos.value < str.length && str[pos.value] === '\n') pos.value++;
                return line;
            }
            pos.value++;
        }
        return str.substring(start, pos.value);
    }
}
