import {
    _decorator, Component, Node, Label, Button, UITransform,
    Color, Vec3, ScrollView, Layout, Sprite, SpriteFrame,
    Graphics, view, director,
} from 'cc';
import { TestRunner } from './TestRunner';
import { ITestCase, TestStatus } from './TestCase';
import { EventTestCase } from './cases/EventTestCase';
import { DataTableTestCase } from './cases/DataTableTestCase';
import { ConfigTestCase } from './cases/ConfigTestCase';
import { DataNodeTestCase } from './cases/DataNodeTestCase';
import { ReferencePoolTestCase } from './cases/ReferencePoolTestCase';
import { SoundTestCase } from './cases/SoundTestCase';

const { ccclass, property } = _decorator;

const COLOR_BG        = new Color(20,  20,  20,  220);
const COLOR_HEADER    = new Color(40,  40,  60,  255);
const COLOR_BTN_IDLE  = new Color(60,  80,  120, 255);
const COLOR_BTN_RUN   = new Color(120, 80,  20,  255);
const COLOR_BTN_PASS  = new Color(30,  120, 60,  255);
const COLOR_BTN_FAIL  = new Color(150, 30,  30,  255);
const COLOR_BTN_ALL   = new Color(80,  50,  130, 255);
const COLOR_WHITE     = new Color(255, 255, 255, 255);

const PANEL_W  = 400;
const ITEM_H   = 36;
const CASE_H   = 42;
const PAD      = 8;

function makeNode(name: string, parent: Node): Node {
    const n = new Node(name);
    parent.addChild(n);
    return n;
}

function addUITransform(n: Node, w: number, h: number): UITransform {
    const ut = n.addComponent(UITransform);
    ut.setContentSize(w, h);
    return ut;
}

function addLabel(n: Node, text: string, size: number, color: Color = COLOR_WHITE, align: number = 0): Label {
    const lbl = n.addComponent(Label);
    lbl.string = text;
    lbl.fontSize = size;
    lbl.lineHeight = size + 4;
    lbl.color = color;
    lbl.overflow = Label.Overflow.CLAMP;
    lbl.horizontalAlign = align === 0 ? Label.HorizontalAlign.LEFT : Label.HorizontalAlign.CENTER;
    lbl.verticalAlign = Label.VerticalAlign.CENTER;
    return lbl;
}

function addSprite(n: Node, color: Color): Sprite {
    const sp = n.addComponent(Sprite);
    sp.type = Sprite.Type.SLICED;
    sp.color = color;
    return sp;
}

function statusColor(s: TestStatus): Color {
    if (s === 'pass')    return COLOR_BTN_PASS;
    if (s === 'fail')    return COLOR_BTN_FAIL;
    if (s === 'running') return COLOR_BTN_RUN;
    return COLOR_BTN_IDLE;
}

function statusIcon(s: TestStatus): string {
    if (s === 'pass')    return '✓';
    if (s === 'fail')    return '✗';
    if (s === 'running') return '…';
    return '○';
}

@ccclass('TestPanelComponent')
export class TestPanelComponent extends Component {

    @property({ tooltip: '是否启用测试面板（可在 Inspector 中关闭以不影响正式版本）' })
    enableTestPanel: boolean = true;

    @property({ tooltip: '启动后自动运行全部测试' })
    autoRunAll: boolean = false;

    private _runner!: TestRunner;
    private _panel: Node | null = null;
    private _itemLabels: Map<string, Label> = new Map();
    private _itemButtons: Map<string, Sprite> = new Map();
    private _caseButtons: Map<string, Sprite> = new Map();
    private _visible: boolean = true;

    protected start(): void {
        if (!this.enableTestPanel) return;

        this._runner = TestRunner.instance;
        this._runner.register(new EventTestCase());
        this._runner.register(new DataTableTestCase());
        this._runner.register(new ConfigTestCase());
        this._runner.register(new DataNodeTestCase());
        this._runner.register(new ReferencePoolTestCase());
        this._runner.register(new SoundTestCase());

        this._runner.setOnResultChange((result) => {
            this._refreshItem(result.caseName, result.itemLabel);
            this._refreshCase(result.caseName);
        });

        this._buildUI();

        if (this.autoRunAll) {
            this._runner.runAll();
        }
    }

    private _buildUI(): void {
        const canvas = director.getScene()!.getChildByName('Canvas') ?? this.node.parent ?? this.node;
        const visSize = view.getVisibleSize();
        const panelH = this._calcPanelHeight();

        const panel = makeNode('TestPanel', canvas);
        this._panel = panel;
        addUITransform(panel, PANEL_W, panelH);
        addSprite(panel, COLOR_BG);
        panel.setPosition(
            new Vec3(visSize.width / 2 - PANEL_W / 2 - PAD, visSize.height / 2 - panelH / 2 - PAD, 0)
        );

        let yOffset = panelH / 2;

        // Header
        yOffset -= CASE_H / 2;
        const header = makeNode('Header', panel);
        addUITransform(header, PANEL_W, CASE_H);
        addSprite(header, COLOR_HEADER);
        header.setPosition(new Vec3(0, yOffset, 0));

        const titleNode = makeNode('Title', header);
        addUITransform(titleNode, PANEL_W - 120, CASE_H);
        addLabel(titleNode, ' 组件快速测试面板', 16);
        titleNode.setPosition(new Vec3(0, 0, 0));

        // Toggle visibility button
        this._makeBtn(header, '隐藏', PANEL_W / 2 - 30 - PAD, 0, 60, CASE_H - 8, COLOR_BTN_IDLE, () => {
            this._toggleVisibility();
        });

        // Run All button
        yOffset -= CASE_H / 2 + PAD + ITEM_H / 2;
        this._makeBtn(panel, '▶ 运行全部测试', 0, yOffset, PANEL_W - PAD * 2, ITEM_H, COLOR_BTN_ALL, () => {
            this._runner.runAll();
        });

        yOffset -= ITEM_H / 2 + PAD;

        // Divider
        yOffset -= 1;
        const div = makeNode('Divider', panel);
        addUITransform(div, PANEL_W, 2);
        addSprite(div, COLOR_HEADER);
        div.setPosition(new Vec3(0, yOffset, 0));
        yOffset -= 1 + PAD;

        // Test cases
        for (const testCase of this._runner.cases) {
            yOffset -= CASE_H / 2;

            // Case row background + Run Case button
            const caseRow = makeNode(`case_${testCase.name}`, panel);
            addUITransform(caseRow, PANEL_W, CASE_H);
            const caseBg = addSprite(caseRow, COLOR_HEADER);
            this._caseButtons.set(testCase.name, caseBg);
            caseRow.setPosition(new Vec3(0, yOffset, 0));

            // Case label
            const caseLbl = makeNode('CaseName', caseRow);
            addUITransform(caseLbl, PANEL_W - 100, CASE_H);
            addLabel(caseLbl, `▸ ${testCase.name}`, 14);
            caseLbl.setPosition(new Vec3(-PAD, 0, 0));

            // Run case button
            const caseRunner = testCase;
            this._makeBtn(caseRow, '运行', PANEL_W / 2 - 30 - PAD, 0, 60, CASE_H - 8, COLOR_BTN_IDLE, () => {
                this._runner.runCase(caseRunner.name);
            });

            yOffset -= CASE_H / 2 + PAD / 2;

            // Items
            for (const item of testCase.items) {
                yOffset -= ITEM_H / 2;

                const itemRow = makeNode(`item_${item.label}`, panel);
                addUITransform(itemRow, PANEL_W, ITEM_H);
                addSprite(itemRow, new Color(35, 35, 45, 200));
                itemRow.setPosition(new Vec3(0, yOffset, 0));

                // Status icon label
                const iconNode = makeNode('Icon', itemRow);
                addUITransform(iconNode, 28, ITEM_H);
                const iconLbl = addLabel(iconNode, statusIcon('idle'), 16, COLOR_WHITE, 1);
                iconNode.setPosition(new Vec3(-PANEL_W / 2 + 16, 0, 0));
                this._itemLabels.set(this._key(testCase.name, item.label), iconLbl);

                // Item status bg (colored sprite on the icon node)
                const itemSp = addSprite(iconNode, statusColor('idle'));
                this._itemButtons.set(this._key(testCase.name, item.label), itemSp);

                // Item label
                const lblNode = makeNode('ItemLabel', itemRow);
                addUITransform(lblNode, PANEL_W - 110, ITEM_H);
                addLabel(lblNode, item.label, 12);
                lblNode.setPosition(new Vec3(8, 0, 0));

                // Run single item button
                const itemRef = item;
                const caseName = testCase.name;
                this._makeBtn(itemRow, '▶', PANEL_W / 2 - 18 - PAD, 0, 36, ITEM_H - 8, COLOR_BTN_IDLE, () => {
                    this._runner.runItem(caseName, itemRef.label);
                });

                yOffset -= ITEM_H / 2 + PAD / 2;
            }

            yOffset -= PAD / 2;
        }
    }

    private _makeBtn(
        parent: Node, text: string,
        x: number, y: number, w: number, h: number,
        color: Color, onClick: () => void
    ): Node {
        const btn = makeNode(`btn_${text}`, parent);
        addUITransform(btn, w, h);
        addSprite(btn, color);
        btn.setPosition(new Vec3(x, y, 0));

        const lbl = makeNode('Label', btn);
        addUITransform(lbl, w, h);
        addLabel(lbl, text, 12, COLOR_WHITE, 1);

        const button = btn.addComponent(Button);
        button.target = btn;
        button.node.on(Button.EventType.CLICK, onClick);
        return btn;
    }

    private _calcPanelHeight(): number {
        let h = CASE_H + PAD + ITEM_H + PAD + 2 + PAD;
        for (const c of TestRunner.instance.cases) {
            h += CASE_H + PAD;
            for (const _ of c.items) {
                h += ITEM_H + PAD / 2;
            }
            h += PAD / 2;
        }
        return h + PAD;
    }

    private _key(caseName: string, itemLabel: string): string {
        return `${caseName}::${itemLabel}`;
    }

    private _refreshItem(caseName: string, itemLabel: string): void {
        const key = this._key(caseName, itemLabel);
        const status = this._runner.getStatus(caseName, itemLabel);
        const lbl = this._itemLabels.get(key);
        const sp  = this._itemButtons.get(key);
        if (lbl) lbl.string = statusIcon(status);
        if (sp)  sp.color = statusColor(status);
    }

    private _refreshCase(caseName: string): void {
        const tc = this._runner.cases.find(c => c.name === caseName);
        if (!tc) return;
        const statuses = tc.items.map(i => this._runner.getStatus(caseName, i.label));
        let agg: TestStatus = 'idle';
        if (statuses.some(s => s === 'fail'))    agg = 'fail';
        else if (statuses.some(s => s === 'running')) agg = 'running';
        else if (statuses.every(s => s === 'pass'))   agg = 'pass';
        else if (statuses.some(s => s === 'pass'))    agg = 'running';

        const sp = this._caseButtons.get(caseName);
        if (sp) sp.color = statusColor(agg);
    }

    private _toggleVisibility(): void {
        if (!this._panel) return;
        this._visible = !this._visible;
        for (const child of this._panel.children) {
            if (child.name !== 'Header') {
                child.active = this._visible;
            }
        }
    }
}
