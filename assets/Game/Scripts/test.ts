import { _decorator, Component, Node } from 'cc';
import { GameEntry } from './Base/GameEntry';
import { GameEventArgs } from '../../GameFramework/Event/GameEventArgs';
import { ReferencePool } from '../../GameFramework/ReferencePool/ReferencePool';
import { Log } from '../../CocosGameFramework/Utility/Log';
const { ccclass, property } = _decorator;

@ccclass('test')
export class test extends Component {
    start() {
        GameEntry.Entity.extensionMethod();

        this.node.emit('test', 'hello world');

        GameEntry.Event.subscribe(testEvent.EventId,this.listenEvent,this);
    }


    public oncilickevent(){
        console.log("click event");
        
        let event=ReferencePool.acquire(testEvent);
        event.eventName="aaaaaa";
        GameEntry.Event.fire(this, event);
    }

    private listenEvent(sender: object, e: GameEventArgs) {
        let event = e as testEvent;
        console.log(this.node.name);
        
        console.log(event.eventName);

        Log.info(event.eventName);

        Log.error(event.eventName);
        
    }


    update(deltaTime: number) {
        
    }
}


export class testEvent extends GameEventArgs{

    public static EventId: string = 'test';
    get id(): string {
        return testEvent.EventId;
    }
    clear(): void {
       
    }


    eventName:string="";
   
}

