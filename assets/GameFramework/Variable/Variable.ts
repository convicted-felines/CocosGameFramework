import { IReference } from '../ReferencePool/IReference';
import { ReferencePool } from '../ReferencePool/ReferencePool';

/**
 * 泛型变量基类，对应原版 Variable<T>。
 * 所有 VarXxx 类型均继承此类，配合 ReferencePool 使用。
 */
export abstract class Variable<T> implements IReference {
    protected _value!: T;

    get value(): T { return this._value; }
    set value(v: T) { this._value = v; }

    abstract clear(): void;
}

// ─── 基础类型 ──────────────────────────────────────────────────────────────

export class VarBoolean extends Variable<boolean> {
    static create(value: boolean): VarBoolean {
        const v = ReferencePool.acquire(VarBoolean);
        v._value = value;
        return v;
    }
    clear(): void { this._value = false; }
}

export class VarInt8 extends Variable<number> {
    static create(value: number): VarInt8 {
        const v = ReferencePool.acquire(VarInt8);
        v._value = value;
        return v;
    }
    clear(): void { this._value = 0; }
}

export class VarUInt8 extends Variable<number> {
    static create(value: number): VarUInt8 {
        const v = ReferencePool.acquire(VarUInt8);
        v._value = value;
        return v;
    }
    clear(): void { this._value = 0; }
}

export class VarInt16 extends Variable<number> {
    static create(value: number): VarInt16 {
        const v = ReferencePool.acquire(VarInt16);
        v._value = value;
        return v;
    }
    clear(): void { this._value = 0; }
}

export class VarUInt16 extends Variable<number> {
    static create(value: number): VarUInt16 {
        const v = ReferencePool.acquire(VarUInt16);
        v._value = value;
        return v;
    }
    clear(): void { this._value = 0; }
}

export class VarInt32 extends Variable<number> {
    static create(value: number): VarInt32 {
        const v = ReferencePool.acquire(VarInt32);
        v._value = value;
        return v;
    }
    clear(): void { this._value = 0; }
}

export class VarUInt32 extends Variable<number> {
    static create(value: number): VarUInt32 {
        const v = ReferencePool.acquire(VarUInt32);
        v._value = value;
        return v;
    }
    clear(): void { this._value = 0; }
}

/** 对应 C# long（64位整数），TS 中使用 number（精度有限），大数请用 VarBigInt */
export class VarInt64 extends Variable<number> {
    static create(value: number): VarInt64 {
        const v = ReferencePool.acquire(VarInt64);
        v._value = value;
        return v;
    }
    clear(): void { this._value = 0; }
}

/** 对应 C# ulong。ES2015 不支持 bigint，使用 number 存储（超过 2^53 精度有限）。 */
export class VarUInt64 extends Variable<number> {
    static create(value: number): VarUInt64 {
        const v = ReferencePool.acquire(VarUInt64);
        v._value = value;
        return v;
    }
    clear(): void { this._value = 0; }
}

export class VarFloat extends Variable<number> {
    static create(value: number): VarFloat {
        const v = ReferencePool.acquire(VarFloat);
        v._value = value;
        return v;
    }
    clear(): void { this._value = 0; }
}

export class VarDouble extends Variable<number> {
    static create(value: number): VarDouble {
        const v = ReferencePool.acquire(VarDouble);
        v._value = value;
        return v;
    }
    clear(): void { this._value = 0; }
}

export class VarChar extends Variable<string> {
    static create(value: string): VarChar {
        const v = ReferencePool.acquire(VarChar);
        v._value = value;
        return v;
    }
    clear(): void { this._value = ''; }
}

export class VarString extends Variable<string> {
    static create(value: string): VarString {
        const v = ReferencePool.acquire(VarString);
        v._value = value;
        return v;
    }
    clear(): void { this._value = ''; }
}

export class VarByteArray extends Variable<Uint8Array> {
    static create(value: Uint8Array): VarByteArray {
        const v = ReferencePool.acquire(VarByteArray);
        v._value = value;
        return v;
    }
    clear(): void { this._value = new Uint8Array(0); }
}

export class VarCharArray extends Variable<string[]> {
    static create(value: string[]): VarCharArray {
        const v = ReferencePool.acquire(VarCharArray);
        v._value = value;
        return v;
    }
    clear(): void { this._value = []; }
}

export class VarDateTime extends Variable<Date> {
    static create(value: Date): VarDateTime {
        const v = ReferencePool.acquire(VarDateTime);
        v._value = value;
        return v;
    }
    clear(): void { this._value = new Date(0); }
}

/** 通用对象变量，对应 C# VarObject */
export class VarObject extends Variable<object | null> {
    static create(value: object | null): VarObject {
        const v = ReferencePool.acquire(VarObject);
        v._value = value;
        return v;
    }
    clear(): void { this._value = null; }
}

// ─── Cocos Creator 引擎类型（对应 Unity 特定 Var 类型）─────────────────────
// 注意：以下类型使用内联数值存储，避免在核心层 import 'cc'。
// 引擎层（CocosGameFramework）可直接 import 这些类并将 Cocos 类型赋给 .value。

/** 对应 C# VarVector2，存储 {x, y} */
export class VarVec2 extends Variable<{ x: number; y: number }> {
    static create(x: number, y: number): VarVec2 {
        const v = ReferencePool.acquire(VarVec2);
        v._value = { x, y };
        return v;
    }
    clear(): void { this._value = { x: 0, y: 0 }; }
}

/** 对应 C# VarVector3，存储 {x, y, z} */
export class VarVec3 extends Variable<{ x: number; y: number; z: number }> {
    static create(x: number, y: number, z: number): VarVec3 {
        const v = ReferencePool.acquire(VarVec3);
        v._value = { x, y, z };
        return v;
    }
    clear(): void { this._value = { x: 0, y: 0, z: 0 }; }
}

/** 对应 C# VarVector4，存储 {x, y, z, w} */
export class VarVec4 extends Variable<{ x: number; y: number; z: number; w: number }> {
    static create(x: number, y: number, z: number, w: number): VarVec4 {
        const v = ReferencePool.acquire(VarVec4);
        v._value = { x, y, z, w };
        return v;
    }
    clear(): void { this._value = { x: 0, y: 0, z: 0, w: 0 }; }
}

/** 对应 C# VarQuaternion，存储 {x, y, z, w} */
export class VarQuat extends Variable<{ x: number; y: number; z: number; w: number }> {
    static create(x: number, y: number, z: number, w: number): VarQuat {
        const v = ReferencePool.acquire(VarQuat);
        v._value = { x, y, z, w };
        return v;
    }
    clear(): void { this._value = { x: 0, y: 0, z: 0, w: 1 }; }
}

/** 对应 C# VarColor，存储 {r, g, b, a}（0-255） */
export class VarColor extends Variable<{ r: number; g: number; b: number; a: number }> {
    static create(r: number, g: number, b: number, a: number = 255): VarColor {
        const v = ReferencePool.acquire(VarColor);
        v._value = { r, g, b, a };
        return v;
    }
    clear(): void { this._value = { r: 0, g: 0, b: 0, a: 255 }; }
}

/** 对应 C# VarRect，存储 {x, y, width, height} */
export class VarRect extends Variable<{ x: number; y: number; width: number; height: number }> {
    static create(x: number, y: number, width: number, height: number): VarRect {
        const v = ReferencePool.acquire(VarRect);
        v._value = { x, y, width, height };
        return v;
    }
    clear(): void { this._value = { x: 0, y: 0, width: 0, height: 0 }; }
}
