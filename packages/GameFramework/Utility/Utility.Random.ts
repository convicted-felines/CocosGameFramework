/**
 * Seeded pseudorandom number generator using a linear congruential algorithm,
 * matching the original GameFramework Utility.Random behavior.
 */
export class UtilityRandom {
    private static _seed: number = Date.now() & 0x7FFFFFFF;

    static setSeed(seed: number): void {
        this._seed = seed & 0x7FFFFFFF;
    }

    /** Returns a non-negative pseudorandom integer. */
    static getRandom(): number {
        this._seed = (this._seed * 1664525 + 1013904223) & 0x7FFFFFFF;
        return this._seed;
    }

    /** Returns a pseudorandom integer in [0, maxValue). */
    static getRandomMax(maxValue: number): number {
        if (maxValue <= 0) throw new RangeError('[Utility.Random] maxValue must be positive.');
        return this.getRandom() % maxValue;
    }

    /** Returns a pseudorandom integer in [minValue, maxValue). */
    static getRandomRange(minValue: number, maxValue: number): number {
        if (maxValue <= minValue) throw new RangeError('[Utility.Random] maxValue must be greater than minValue.');
        return minValue + this.getRandom() % (maxValue - minValue);
    }

    /** Returns a pseudorandom float in [0.0, 1.0). */
    static getRandomDouble(): number {
        return this.getRandom() / 0x7FFFFFFF;
    }

    /** Fills the given Uint8Array with pseudorandom bytes. */
    static getRandomBytes(result: Uint8Array): void {
        for (let i = 0; i < result.length; i++) {
            result[i] = this.getRandom() & 0xFF;
        }
    }
}
