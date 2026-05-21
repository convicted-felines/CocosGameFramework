import { UIComponent } from 'db://assets/CocosGameFramework/UI/UIComponent';
import { UIFormLogic } from 'db://assets/CocosGameFramework/UI/UIFormLogic';

/**
 * UIComponent 的游戏层扩展 mixin。
 *
 * 用法：在 GameEntry 的扩展注册表中自动混入，注册后可通过
 * GameEntry.UI.xxx() 直接调用本类中定义的方法。
 *
 * 添加新方法时无需修改 UIComponent 或 GameEntry，直接在此类中声明即可。
 * 若需访问 UIComponent 内部成员，使用 (this as unknown as UIComponent)。
 */
export class UIExtension {

    // ---- 示例：按资源名关闭所有同名 UI ----

    closeAllUIFormsByAsset(uiFormAssetName: string, userData?: object): void {
        const self = this as unknown as UIComponent;
        for (const form of self.getUIFormsByAsset(uiFormAssetName)) {
            self.closeUIFormByLogic(form, userData);
        }
    }

    // ---- 示例：打开 UI 并返回 Promise（等待 onOpen 回调）----

    openUIFormAsync(
        uiFormAssetName: string,
        bundleName: string,
        groupName: string,
        pauseCovered = false,
        userData?: object,
    ): Promise<UIFormLogic> {
        const self = this as unknown as UIComponent;
        return new Promise((resolve, reject) => {
            const serialId = self.openUIForm(uiFormAssetName, bundleName, groupName, pauseCovered, {
                ...userData,
                _resolve: resolve,
                _reject: reject,
            });
            if (serialId < 0) {
                reject(new Error(`openUIFormAsync: failed to open "${uiFormAssetName}"`));
            }
        });
    }

    // ---- 在此添加更多游戏专属 UI 方法 ----
}
