import { _decorator, Component, Node } from 'cc';
import { GameEntry } from './Base/GameEntry';
const { ccclass, property } = _decorator;

@ccclass('test')
export class test extends Component {
    start() {
        GameEntry.Entity.extensionMethod();

        this.node.emit('test', 'hello world');
    }

    update(deltaTime: number) {
        
    }
}


