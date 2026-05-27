import { _decorator, Button, Label, Node } from 'cc';
import { UIFormLogic } from 'db://assets/CocosGameFramework/UI/UIFormLogic';
import { GameEntry } from 'db://assets/Game/Scripts/Base/GameEntry';
import { ProcedureMenu } from 'db://assets/Game/Scripts/Procedure/ProcedureMenu';
import { GameFrameworkLog } from 'db://assets/GameFramework/Base/Log/GameFrameworkLog';

const { ccclass, property } = _decorator;

@ccclass('MenuForm')
export class MenuForm extends UIFormLogic {

    @property(Button)
    startButton: Button = null!;

    @property(Label)
    titleLabel: Label = null!;

    protected onInit(): void {
        this.startButton.node.on(Button.EventType.CLICK, this._onStartClicked, this);
    }

    onOpen(_userData?: object): void {
        GameFrameworkLog.info('[MenuForm] Opened.');
    }

    onClose(_isShutdown: boolean, _userData?: object): void {
        GameFrameworkLog.info('[MenuForm] Closed.');
    }

    private _onStartClicked(): void {
        const procedure = GameEntry.Procedure.getProcedure(ProcedureMenu);
        if (procedure) {
            (procedure as ProcedureMenu).startFPS();
        }
    }
}
