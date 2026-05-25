import { ITestCase, ITestItem, ITestResult, TestStatus } from './TestCase';

export class TestRunner {
    private static _instance: TestRunner | null = null;

    static get instance(): TestRunner {
        if (!TestRunner._instance) {
            TestRunner._instance = new TestRunner();
        }
        return TestRunner._instance;
    }

    private _cases: ITestCase[] = [];
    private _results: Map<string, ITestResult> = new Map();
    private _onResultChange: ((result: ITestResult) => void) | null = null;

    private constructor() {}

    static reset(): void {
        TestRunner._instance = null;
    }

    register(testCase: ITestCase): void {
        if (this._cases.find(c => c.name === testCase.name)) return;
        this._cases.push(testCase);
        for (const item of testCase.items) {
            const key = this._key(testCase.name, item.label);
            this._results.set(key, { caseName: testCase.name, itemLabel: item.label, status: 'idle' });
        }
    }

    get cases(): readonly ITestCase[] { return this._cases; }

    getStatus(caseName: string, itemLabel: string): TestStatus {
        return this._results.get(this._key(caseName, itemLabel))?.status ?? 'idle';
    }

    setOnResultChange(cb: (result: ITestResult) => void): void {
        this._onResultChange = cb;
    }

    async runAll(): Promise<void> {
        for (const testCase of this._cases) {
            await this.runCase(testCase.name);
        }
    }

    async runCase(caseName: string): Promise<void> {
        const testCase = this._cases.find(c => c.name === caseName);
        if (!testCase) return;
        for (const item of testCase.items) {
            await this.runItem(caseName, item.label);
        }
    }

    async runItem(caseName: string, itemLabel: string): Promise<void> {
        const testCase = this._cases.find(c => c.name === caseName);
        if (!testCase) return;
        const item = testCase.items.find(i => i.label === itemLabel);
        if (!item) return;

        this._setResult(caseName, itemLabel, 'running');
        try {
            await item.run();
            this._setResult(caseName, itemLabel, 'pass');
            console.log(`[PASS] ${caseName} > ${itemLabel}`);
        } catch (err: any) {
            const msg: string = err?.message ?? String(err);
            this._setResult(caseName, itemLabel, 'fail', msg);
            console.error(`[FAIL] ${caseName} > ${itemLabel}: ${msg}`);
        }
    }

    private _setResult(caseName: string, itemLabel: string, status: TestStatus, error?: string): void {
        const key = this._key(caseName, itemLabel);
        const result: ITestResult = { caseName, itemLabel, status, error };
        this._results.set(key, result);
        this._onResultChange?.(result);
    }

    private _key(caseName: string, itemLabel: string): string {
        return `${caseName}::${itemLabel}`;
    }
}
