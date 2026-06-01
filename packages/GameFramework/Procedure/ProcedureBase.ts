import { FsmState } from '../FSM/FsmState';
import { IProcedureManager } from './IProcedureManager';

export abstract class ProcedureBase extends FsmState<IProcedureManager> {}
