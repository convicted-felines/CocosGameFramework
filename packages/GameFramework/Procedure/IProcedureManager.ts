import { ProcedureBase } from './ProcedureBase';

export interface IProcedureManager {
    readonly currentProcedure: ProcedureBase | null;
    readonly currentProcedureTime: number;

    startProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): void;
    startProcedureByType(procedureType: Function): void;

    hasProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): boolean;
    hasProcedureByType(procedureType: Function): boolean;

    getProcedure<T extends ProcedureBase>(ctor: new (...args: any[]) => T): T | null;
    getProcedureByType(procedureType: Function): ProcedureBase | null;
}
