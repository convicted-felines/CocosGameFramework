import { _decorator } from 'cc';
import { GameEntry as GFGameEntry } from '../../CocosGameFramework/Base/GameEntry';
import { ProcedureBase } from '../../GameFramework/Procedure/ProcedureBase';
import { BuiltinDataComponent } from '../BuiltinData/BuiltinDataComponent';

import { ProcedureLaunch } from '../Procedure/ProcedureLaunch';
import { ProcedureSplash } from '../Procedure/ProcedureSplash';
import { ProcedureCheckVersion } from '../Procedure/ProcedureCheckVersion';
import { ProcedureUpdateVersion } from '../Procedure/ProcedureUpdateVersion';
import { ProcedureVerifyResources } from '../Procedure/ProcedureVerifyResources';
import { ProcedureCheckResources } from '../Procedure/ProcedureCheckResources';
import { ProcedureUpdateResources } from '../Procedure/ProcedureUpdateResources';
import { ProcedureInitResources } from '../Procedure/ProcedureInitResources';
import { ProcedurePreload } from '../Procedure/ProcedurePreload';
import { ProcedureChangeScene } from '../Procedure/ProcedureChangeScene';
import { ProcedureMenu } from '../Procedure/ProcedureMenu';
import { ProcedureMain } from '../Procedure/ProcedureMain';

const { ccclass } = _decorator;

@ccclass('GameEntry')
export class GameEntry extends GFGameEntry {

    protected override createProcedures(): ProcedureBase[] {
        return [
            new ProcedureLaunch(),
            new ProcedureSplash(),
            new ProcedureCheckVersion(),
            new ProcedureUpdateVersion(),
            new ProcedureVerifyResources(),
            new ProcedureCheckResources(),
            new ProcedureUpdateResources(),
            new ProcedureInitResources(),
            new ProcedurePreload(),
            new ProcedureChangeScene(),
            new ProcedureMenu(),
            new ProcedureMain(),
        ];
    }

    static get BuiltinData(): BuiltinDataComponent {
        return GFGameEntry.getComponent(BuiltinDataComponent)!;
    }
}
