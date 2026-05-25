export interface ITestItem {
    readonly label: string;
    run(): Promise<void>;
}

export interface ITestCase {
    readonly name: string;
    readonly items: ITestItem[];
}

export type TestStatus = 'idle' | 'running' | 'pass' | 'fail';

export interface ITestResult {
    caseName: string;
    itemLabel: string;
    status: TestStatus;
    error?: string;
}
