import { IReference } from '../ReferencePool/IReference';

export abstract class BaseEventArgs implements IReference {
    abstract get id(): string;
    abstract clear(): void;
}
