import { ProcedureBase } from './ProcedureBase';

export interface IProcedureManager {
    readonly currentProcedure: ProcedureBase | null;
    readonly currentProcedureTime: number;

    initialize(procedures: ProcedureBase[]): void;
    startProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): void;
    hasProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): boolean;
    getProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): T | null;
}
