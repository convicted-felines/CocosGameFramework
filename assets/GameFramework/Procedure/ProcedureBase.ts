import { FsmState } from '../FSM/FsmState';
import { ProcedureManager } from './ProcedureManager';

export abstract class ProcedureBase extends FsmState<ProcedureManager> {}
