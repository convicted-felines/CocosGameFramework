import { Node, Prefab, instantiate } from 'cc';
import { IEntityHelper, IEntityInfo } from '../../GameFramework/Entity/IEntityHelper';
import { EntityLogic } from './EntityLogic';

export class DefaultEntityHelper implements IEntityHelper {
    private _entityRoot: Node;

    constructor(entityRoot: Node) {
        this._entityRoot = entityRoot;
    }

    instantiateEntity(entityAsset: Prefab): Node {
        return instantiate(entityAsset);
    }

    createEntity(entityInstance: Node, entity: IEntityInfo): void {
        this._entityRoot.addChild(entityInstance);
        const logic = entityInstance.getComponent(EntityLogic);
        logic?.__init(entity);
        logic?.onShow(entity.userData);
    }

    onUpdateEntity(entityInstance: Node, elapseSeconds: number, realElapseSeconds: number): void {
        const logic = entityInstance.getComponent(EntityLogic);
        logic?.onUpdate(elapseSeconds, realElapseSeconds);
    }

    releaseEntity(_entityAsset: object, entityInstance: Node): void {
        const logic = entityInstance.getComponent(EntityLogic);
        logic?.onHide(false);
        entityInstance.destroy();
    }
}
