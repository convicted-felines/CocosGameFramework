import { EntityComponent } from 'db://assets/CocosGameFramework/Entity/EntityComponent';

/**
 * EntityComponent 的游戏层扩展 mixin。
 *
 * 用法：在 GameEntry 的扩展注册表中自动混入，注册后可通过
 * GameEntry.Entity.xxx() 直接调用本类中定义的方法。
 *
 * 添加新方法时无需修改 EntityComponent 或 GameEntry，直接在此类中声明即可。
 * 若需访问 EntityComponent 内部成员，使用 (this as unknown as EntityComponent)。
 */
export class EntityExtension {

    // ---- 示例：按分组批量隐藏 ----

    hideAllEntitiesInGroup(groupName: string, userData?: object): void {
        const self = this as unknown as EntityComponent;
        for (const entity of self.getAllEntitiesInGroup(groupName)) {
            self.hideEntity(entity, userData);
        }
    }

    // ---- 在此添加更多游戏专属实体方法 ----

    public extensionMethod(): void {
        console.log("Extension method called");
    }
}
