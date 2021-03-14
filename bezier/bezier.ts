window.addEventListener("load", coldboot, false);

function coldboot() {
    const theCanvas = document.getElementById("canvasOne");
    if (!(theCanvas instanceof HTMLCanvasElement)) {
        return; // surrender!
    }
    const context = theCanvas.getContext("2d");
    const boss = new BezierCenter(context);

    const spinner = new Spinner(boss);
    spinner.tick();
    setInterval(Spinner.kick, 100, spinner); // Function.callが使えそうなんだが。

    theCanvas.addEventListener("mousedown", boss, false);
    theCanvas.addEventListener("mousemove", boss, false);
    theCanvas.addEventListener("mouseup", boss, false);
}

class Spinner {
    private t : number;
    constructor(private boss : BezierCenter) {
        this.t = 14;
    }
    public tick() : void {
        this.t = (this.t + 0.5) % 20;
        const tee = (this.t > 10) ? 20 - this.t : this.t;
        this.boss.draw(tee);
    }
    static kick(s : Spinner) { s.tick(); }
}

class MyPoint {
    constructor(private boss : BezierCenter, public x : number, public y : number, private label : string, private fs = "#000000") {}

    public draw() : void {
        const cxt = this.boss.context;
        cxt.fillStyle = this.fs;
        cxt.beginPath();
        cxt.arc(this.x, this.y, 3, 0, 2*Math.PI, false);
        cxt.closePath();
        cxt.fill();

        cxt.font = "12px serif";
        const w = cxt.measureText(this.label).width;
        cxt.fillText(this.label, this.x - w / 2, this.y - 15);
    }
    public cxtMoveTo() : void {
        this.boss.context.moveTo(this.x, this.y);
    }
    public cxtLineTo() : void {
        this.boss.context.lineTo(this.x, this.y);
    }
    public setInner(t : number, p0 : MyPoint, p1 : MyPoint) : void {
        this.x = MyPoint.inner(t, p0.x, p1.x);
        this.y = MyPoint.inner(t, p0.y, p1.y);
    }
    static inner(t : number, a : number, b : number) : number {
        return Math.floor((a * t + b * (10 - t)) / 10);
    }
    public isNear(mx : number, my : number) : boolean {
        const v = 25 > (Math.pow(this.x - mx,2) + Math.pow(this.y - my,2));
//        console.log(v);
        return v;
    }
}

class BezierCenter implements EventListenerObject {
    private ps : MyPoint[];
    private q0 : MyPoint;
    private q1 : MyPoint;
    private q2 : MyPoint;
    private r0 : MyPoint;
    private r1 : MyPoint;
    private be : MyPoint;
    private draggingPoint : MyPoint;
    constructor(public context : CanvasRenderingContext2D) {
        this.ps = new Array<MyPoint>();
        this.ps[0] = new MyPoint(this, 35, 220, "P0", "#0000ff");
        this.ps[1] = new MyPoint(this, 125, 40, "P1", "#0000ff");
        this.ps[2] = new MyPoint(this, 275, 75, "P2", "#0000ff");
        this.ps[3] = new MyPoint(this, 285, 200, "P3", "#0000ff");
        this.q0 = new MyPoint(this, 0, 0, "Q0");
        this.q1 = new MyPoint(this, 0, 0, "Q1");
        this.q2 = new MyPoint(this, 0, 0, "Q2");
        this.r0 = new MyPoint(this, 0, 0, "R0");
        this.r1 = new MyPoint(this, 0, 0, "R1");
        this.be = new MyPoint(this, 0, 0, "B", "#ff0000");
        this.draggingPoint = undefined;
    }
    draw(tee : number) : void {
        this.context.fillStyle = "#ffffdd";
        this.context.fillRect(0,0,400,300);
    
//        const tee = 5; // 本当はスライダーから現在の値を得る

        // 連動する点を移動
        this.q0.setInner(tee, this.ps[0], this.ps[1]);
        this.q1.setInner(tee, this.ps[1], this.ps[2]);
        this.q2.setInner(tee, this.ps[2], this.ps[3]);
        this.r0.setInner(tee, this.q0, this.q1);
        this.r1.setInner(tee, this.q1, this.q2);
        this.be.setInner(tee, this.r0, this.r1);

        // Canvas内蔵のベジェ曲線
        this.context.strokeStyle = "#009900";
        this.context.lineWidth = 1;
        this.context.beginPath();
        this.ps[0].cxtMoveTo();
        this.context.bezierCurveTo(this.ps[1].x, this.ps[1].y, this.ps[2].x, this.ps[2].y, this.ps[3].x, this.ps[3].y);
        this.context.stroke();

        // P0～P3を結ぶ直線、Q0～Q2、R0-R1も同時に
        this.context.strokeStyle = "#880088";
        this.context.lineWidth = 1;
        this.context.beginPath();
        this.ps[0].cxtMoveTo();
        this.ps.forEach(p => p.cxtLineTo());
        this.q0.cxtMoveTo();
        this.q1.cxtLineTo();
        this.q2.cxtLineTo();
        this.r0.cxtMoveTo();
        this.r1.cxtLineTo();
        this.context.stroke();

        this.ps.forEach(p => p.draw());
        this.q0.draw(); this.q1.draw(); this.q2.draw();
        this.r0.draw(); this.r1.draw(); this.be.draw();
    }

    public handleEvent(event : Event) : void {
        switch (event.type) {
            case "mousedown" : return this.handleMouseDown(<MouseEvent> event); // "return" for tail optimization
            case "mousemove" : return this.handleMouseMove(<MouseEvent> event);
            case "mouseup" :   return this.handleMouseUp(<MouseEvent> event);
            default : // I think I'm not registered to listen it...
        }
    }

    private handleMouseDown(event : MouseEvent) : void {
        this.draggingPoint = this.ps.find(p => p.isNear(event.offsetX, event.offsetY));
    }
    private handleMouseMove(event : MouseEvent) : void {
        if (this.draggingPoint instanceof MyPoint) {
            this.draggingPoint.x = event.offsetX;
            this.draggingPoint.y = event.offsetY;
        }
    }
    private handleMouseUp(event : MouseEvent) : void {
        this.draggingPoint = undefined;
    }
}