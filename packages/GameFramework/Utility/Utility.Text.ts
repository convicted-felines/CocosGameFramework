export interface ITextHelper {
    format(format: string, ...args: any[]): string;
}

class DefaultTextHelper implements ITextHelper {
    format(fmt: string, ...args: any[]): string {
        return fmt.replace(/\{(\d+)\}/g, (_, idx) => {
            const i = Number(idx);
            return i < args.length ? String(args[i]) : `{${idx}}`;
        });
    }
}

export class UtilityText {
    private static _helper: ITextHelper = new DefaultTextHelper();

    static setTextHelper(helper: ITextHelper): void {
        this._helper = helper;
    }

    static format(fmt: string, ...args: any[]): string {
        if (!this._helper) throw new Error('[Utility.Text] Text helper is not set.');
        return this._helper.format(fmt, ...args);
    }

    // Typed overloads for up to 8 parameters (matching original C# generics pattern)
    static format1<T0>(fmt: string, a0: T0): string {
        return this.format(fmt, a0);
    }

    static format2<T0, T1>(fmt: string, a0: T0, a1: T1): string {
        return this.format(fmt, a0, a1);
    }

    static format3<T0, T1, T2>(fmt: string, a0: T0, a1: T1, a2: T2): string {
        return this.format(fmt, a0, a1, a2);
    }

    static format4<T0, T1, T2, T3>(fmt: string, a0: T0, a1: T1, a2: T2, a3: T3): string {
        return this.format(fmt, a0, a1, a2, a3);
    }

    static format5<T0, T1, T2, T3, T4>(fmt: string, a0: T0, a1: T1, a2: T2, a3: T3, a4: T4): string {
        return this.format(fmt, a0, a1, a2, a3, a4);
    }

    static format6<T0, T1, T2, T3, T4, T5>(fmt: string, a0: T0, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5): string {
        return this.format(fmt, a0, a1, a2, a3, a4, a5);
    }

    static format7<T0, T1, T2, T3, T4, T5, T6>(fmt: string, a0: T0, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): string {
        return this.format(fmt, a0, a1, a2, a3, a4, a5, a6);
    }

    static format8<T0, T1, T2, T3, T4, T5, T6, T7>(fmt: string, a0: T0, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7): string {
        return this.format(fmt, a0, a1, a2, a3, a4, a5, a6, a7);
    }
}
