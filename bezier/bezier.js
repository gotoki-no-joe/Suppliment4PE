window.addEventListener("load", coldboot, false);
function coldboot() {
    var theCanvas = document.getElementById("canvasOne");
    if (!(theCanvas instanceof HTMLCanvasElement)) {
        return; // surrender!
    }
    var context = theCanvas.getContext("2d");
    var boss = new BezierCenter(context);
    var spinner = new Spinner(boss);
    spinner.tick();
    setInterval(Spinner.kick, 100, spinner); // Function.callが使えそうなんだが。
    theCanvas.addEventListener("mousedown", boss, false);
    theCanvas.addEventListener("mousemove", boss, false);
    theCanvas.addEventListener("mouseup", boss, false);
}
var Spinner = /** @class */ (function () {
    function Spinner(boss) {
        this.boss = boss;
        this.t = 14;
    }
    Spinner.prototype.tick = function () {
        this.t = (this.t + 0.5) % 20;
        var tee = (this.t > 10) ? 20 - this.t : this.t;
        this.boss.draw(tee);
    };
    Spinner.kick = function (s) { s.tick(); };
    return Spinner;
}());
var MyPoint = /** @class */ (function () {
    function MyPoint(boss, x, y, label, fs) {
        if (fs === void 0) { fs = "#000000"; }
        this.boss = boss;
        this.x = x;
        this.y = y;
        this.label = label;
        this.fs = fs;
    }
    MyPoint.prototype.draw = function () {
        var cxt = this.boss.context;
        cxt.fillStyle = this.fs;
        cxt.beginPath();
        cxt.arc(this.x, this.y, 3, 0, 2 * Math.PI, false);
        cxt.closePath();
        cxt.fill();
        cxt.font = "12px serif";
        var w = cxt.measureText(this.label).width;
        cxt.fillText(this.label, this.x - w / 2, this.y - 15);
    };
    MyPoint.prototype.cxtMoveTo = function () {
        this.boss.context.moveTo(this.x, this.y);
    };
    MyPoint.prototype.cxtLineTo = function () {
        this.boss.context.lineTo(this.x, this.y);
    };
    MyPoint.prototype.setInner = function (t, p0, p1) {
        this.x = MyPoint.inner(t, p0.x, p1.x);
        this.y = MyPoint.inner(t, p0.y, p1.y);
    };
    MyPoint.inner = function (t, a, b) {
        return Math.floor((a * t + b * (10 - t)) / 10);
    };
    MyPoint.prototype.isNear = function (mx, my) {
        var v = 25 > (Math.pow(this.x - mx, 2) + Math.pow(this.y - my, 2));
        //        console.log(v);
        return v;
    };
    return MyPoint;
}());
var BezierCenter = /** @class */ (function () {
    function BezierCenter(context) {
        this.context = context;
        this.ps = new Array();
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
    BezierCenter.prototype.draw = function (tee) {
        this.context.fillStyle = "#ffffdd";
        this.context.fillRect(0, 0, 400, 300);
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
        this.ps.forEach(function (p) { return p.cxtLineTo(); });
        this.q0.cxtMoveTo();
        this.q1.cxtLineTo();
        this.q2.cxtLineTo();
        this.r0.cxtMoveTo();
        this.r1.cxtLineTo();
        this.context.stroke();
        this.ps.forEach(function (p) { return p.draw(); });
        this.q0.draw();
        this.q1.draw();
        this.q2.draw();
        this.r0.draw();
        this.r1.draw();
        this.be.draw();
    };
    BezierCenter.prototype.handleEvent = function (event) {
        switch (event.type) {
            case "mousedown": return this.handleMouseDown(event); // "return" for tail optimization
            case "mousemove": return this.handleMouseMove(event);
            case "mouseup": return this.handleMouseUp(event);
            default: // I think I'm not registered to listen it...
        }
    };
    BezierCenter.prototype.handleMouseDown = function (event) {
        this.draggingPoint = this.ps.find(function (p) { return p.isNear(event.offsetX, event.offsetY); });
    };
    BezierCenter.prototype.handleMouseMove = function (event) {
        if (this.draggingPoint instanceof MyPoint) {
            this.draggingPoint.x = event.offsetX;
            this.draggingPoint.y = event.offsetY;
        }
    };
    BezierCenter.prototype.handleMouseUp = function (event) {
        this.draggingPoint = undefined;
    };
    return BezierCenter;
}());
