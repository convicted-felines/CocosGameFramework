import { IEntityGroup } from './IEntityManager';

/**
 * 实体组辅助接口，对应原版 IEntityGroupHelper。
 * 负责实体分组的引擎层挂载管理。
 */
export interface IEntityGroupHelper {
    /**
     * 创建实体组的根节点（引擎层对象）。
     * @param entityGroupName 分组名称
     */
    createEntityGroupRoot(entityGroupName: string): object;
}
