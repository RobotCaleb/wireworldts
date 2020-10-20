enum WWType {
    Head = 0,
    Tail,
    Wire,
    None
}

type Color = "#FFFFFF" | "#FFFF00" | "#FF0000" | "#0000FF" | "#0000FF" | "#00FFFF" | "#000000" | "#FFA500";
const WHITE: Color = "#FFFFFF";
const YELLOW: Color = "#FFFF00";
const RED: Color = "#FF0000";
const GREEN: Color = "#0000FF";
const BLUE: Color = "#0000FF";
const CYAN: Color = "#00FFFF";
const ORANGE: Color = "#FFA500";
const BLACK: Color = "#000000";

class WireWorld {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    private scaleSelector: HTMLSelectElement;
    private sizeSelector: HTMLSelectElement;

    private drawType: WWType;
    private painting: boolean;

    private grid: WWType[] = [];
    private wire: WWType[] = [];

    private image: ImageData;

    private scale: number;
    private size: number;

    private lastUpdate: number;
    private frameTime: number;
    private animFrame: number;

    constructor(x: number, y: number) {
        let canvas = document.getElementById("world") as HTMLCanvasElement;
        let context = canvas.getContext("2d");

        this.scaleSelector = document.getElementById("scale") as HTMLSelectElement;
        this.sizeSelector = document.getElementById("size") as HTMLSelectElement;

        context.imageSmoothingEnabled = false;

        this.canvas = canvas;
        this.context = context;

        this.frameTime = 1000 / 15;
        this.lastUpdate = Date.now();

        this.initialize();

        this.createUserEvents();
    }

    private initialize = (skipArrays: boolean = false) => {
        let size = parseInt(this.sizeSelector.value);
        let scale = parseInt(this.scaleSelector.value);

        this.scale = scale;
        this.size = size;

        this.image = new ImageData(this.size, this.size);

        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.width = (size * this.scale).toString() + "px";
        this.canvas.style.height = (size * this.scale).toString() + "px";

        if (!skipArrays) {
            this.grid = new Array<WWType>(size * size);
            this.wire = new Array<WWType>(size * size);
            this.clearWorld();
        }

        this.drawType = WWType.Wire;
        (document.getElementById("dtwire") as HTMLInputElement).checked = true;
        this.painting = false;

        this.animFrame = 0;
    }

    private createUserEvents() {
        let canvas = this.canvas;
        canvas.addEventListener("mousedown", this.pressEventHandler);
        canvas.addEventListener("mouseup", this.releaseEventHandler);
        canvas.addEventListener("mousemove", this.dragEventHandler);
        canvas.addEventListener("mouseout", this.releaseEventHandler);

        canvas.addEventListener("touchstart", this.pressEventHandler);
        canvas.addEventListener("touchend", this.releaseEventHandler);
        canvas.addEventListener("touchmove", this.dragEventHandler);
        canvas.addEventListener("touchcancel", this.releaseEventHandler);

        document.getElementById("dthead").addEventListener("click", () => { this.setDrawType(WWType.Head); });
        document.getElementById("dttail").addEventListener("click", () => { this.setDrawType(WWType.Tail); });
        document.getElementById("dtwire").addEventListener("click", () => { this.setDrawType(WWType.Wire); });
        document.getElementById("dtnone").addEventListener("click", () => { this.setDrawType(WWType.None); });

        document.getElementById("step").addEventListener("click", () => { this.update(); });
        document.getElementById("run").addEventListener("click", () => { this.run(); });
        document.getElementById("pause").addEventListener("click", () => { this.pause(); });
        document.getElementById("reset").addEventListener("click", () => { this.reset(); });

        document.getElementById("clear").addEventListener("click", () => { this.clearWorld(); });

        document.getElementById("export").addEventListener("click", () => { this.exportWorld(); });
        document.getElementById("import").addEventListener("click", () => { this.importWorld(); });

        this.scaleSelector.addEventListener("change", () => { this.initialize(true); this.render(); });
        this.sizeSelector.addEventListener("change", () => { this.initialize(); this.render(); });
    }

    private setDrawType(type: WWType) {
        this.drawType = type;
    }

    private pressEventHandler = (e: MouseEvent | TouchEvent) => {
        let mouseX = (e as TouchEvent).changedTouches ?
            (e as TouchEvent).changedTouches[0].pageX :
            (e as MouseEvent).pageX;
        let mouseY = (e as TouchEvent).changedTouches ?
            (e as TouchEvent).changedTouches[0].pageY :
            (e as MouseEvent).pageY;
        mouseX -= Math.floor(this.canvas.offsetLeft);
        mouseY -= Math.floor(this.canvas.offsetTop);

        mouseX /= this.scale;
        mouseY /= this.scale;

        mouseX = Math.floor(mouseX);
        mouseY = Math.floor(mouseY);

        this.painting = true;
        if (this.drawType == WWType.Wire || this.drawType == WWType.None) {
            this.addTypeToGrid(this.wire, this.drawType, mouseX, mouseY);
        }
        this.addTypeToGrid(this.grid, this.drawType, mouseX, mouseY);
        this.render();
    }

    private dragEventHandler = (e: MouseEvent | TouchEvent) => {
        let mouseX = (e as TouchEvent).changedTouches ?
            (e as TouchEvent).changedTouches[0].pageX :
            (e as MouseEvent).pageX;
        let mouseY = (e as TouchEvent).changedTouches ?
            (e as TouchEvent).changedTouches[0].pageY :
            (e as MouseEvent).pageY;
        mouseX -= this.canvas.offsetLeft;
        mouseY -= this.canvas.offsetTop;

        mouseX /= this.scale;
        mouseY /= this.scale;

        mouseX = Math.floor(mouseX);
        mouseY = Math.floor(mouseY);

        if (this.painting) {
            if (this.drawType == WWType.Wire || this.drawType == WWType.None) {
                this.addTypeToGrid(this.wire, this.drawType, mouseX, mouseY);
            }
            this.addTypeToGrid(this.grid, this.drawType, mouseX, mouseY);
            this.render();
        }

        e.preventDefault();
    }

    private releaseEventHandler = (e: MouseEvent | TouchEvent) => {
        this.painting = false;
        this.render();
    }

    private clearWorld() {
        for (let i: number = 0; i < this.size * this.size; ++i) {
            this.grid[i] = WWType.None;
            this.wire[i] = WWType.None;
        }
        this.render();
    }

    private reset = () => {
        this.pause();
        this.grid = this.wire.slice(0, this.size * this.size);
        this.render();
    }

    private addTypeToGrid(grid: WWType[], type: WWType, x: number, y: number) {
        grid[y * this.size + x] = type;
    }

    private getTypeFromGrid = (grid: WWType[], x: number, y: number) => {
        return grid[y * this.size + x];
    }

    private hexToRgb(hex: string) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        } : null;
    }

    private getColor(type: WWType): Color {
        switch (type) {
            case WWType.Wire:
                return ORANGE;
                break;
            case WWType.Head:
                return CYAN;
                break;
            case WWType.Tail:
                return BLUE;
                break;
            case WWType.None:
                return BLACK;
                break;
            default:
                break;
        }
    }

    private render = () => {
        for (let i: number = 0; i < this.size * this.size; ++i) {
            let color = this.hexToRgb(this.getColor(this.grid[i]));
            this.image.data[i * 4 + 0] = color.r;
            this.image.data[i * 4 + 1] = color.g;
            this.image.data[i * 4 + 2] = color.b;
            this.image.data[i * 4 + 3] = 255;
        }
        this.context.putImageData(this.image, 0, 0);
    }

    private run = () => {
        let now = Date.now();
        if (now - this.lastUpdate >= this.frameTime) {
            this.lastUpdate = now;
            this.update();
            this.animFrame = requestAnimationFrame(this.run);
            return;
        }
        this.animFrame = requestAnimationFrame(this.run);
    }

    private pause = () => {
        cancelAnimationFrame(this.animFrame);
    }

    private update = () => {
        let grid2 = new Array<WWType>(this.size * this.size);
        for (let y = 0; y < this.size; ++y) {
            for (let x = 0; x < this.size; ++x) {
                let type = this.getTypeFromGrid(this.grid, x, y);
                switch (type) {
                    case WWType.None:
                        this.addTypeToGrid(grid2, WWType.None, x, y);
                        break;
                    case WWType.Tail:
                        this.addTypeToGrid(grid2, WWType.Wire, x, y);
                        break;
                    case WWType.Head:
                        this.addTypeToGrid(grid2, WWType.Tail, x, y);
                        break;
                    case WWType.Wire:
                        let count = 0;
                        if (this.getTypeFromGrid(this.grid, x - 1, y - 1) == WWType.Head) { count++; }
                        if (this.getTypeFromGrid(this.grid, x - 0, y - 1) == WWType.Head) { count++; }
                        if (this.getTypeFromGrid(this.grid, x + 1, y - 1) == WWType.Head) { count++; }
                        if (this.getTypeFromGrid(this.grid, x - 1, y - 0) == WWType.Head) { count++; }
                        if (this.getTypeFromGrid(this.grid, x + 1, y - 0) == WWType.Head) { count++; }
                        if (this.getTypeFromGrid(this.grid, x - 1, y + 1) == WWType.Head) { count++; }
                        if (this.getTypeFromGrid(this.grid, x - 0, y + 1) == WWType.Head) { count++; }
                        if (this.getTypeFromGrid(this.grid, x + 1, y + 1) == WWType.Head) { count++; }
                        if (count == 1 || count == 2) {
                            this.addTypeToGrid(grid2, WWType.Head, x, y);
                        }
                        else {
                            this.addTypeToGrid(grid2, WWType.Wire, x, y);
                        }
                        break;
                    default:
                        break;
                }
            }
        }
        this.grid = grid2.slice(0, this.size * this.size);
        this.render();
    }

    private exportWorld = () => {
        let ex = {
            size: this.size,
            grid: this.grid.slice(0, this.size * this.size),
            wire: this.wire.slice(0, this.size * this.size),
        };

        let json = JSON.stringify(ex);
        (document.getElementById("textpad") as HTMLTextAreaElement).value = btoa(json);
    }

    private importWorld = () => {
        let json = atob((document.getElementById("textpad") as HTMLTextAreaElement).value);

        let ex = JSON.parse(json);
        let size = ex.size;
        let grid: WWType[] = ex.grid;
        let wire: WWType[] = ex.wire;

        this.grid = grid.slice(0, size * size);
        this.wire = wire.slice(0, size * size);
        this.size = size;
        for (let i = 0; i < this.sizeSelector.options.length; ++i) {
            if (this.sizeSelector.options.item(i).value == size) {
                this.sizeSelector.selectedIndex = i;
                break;
            }
        }
        this.initialize(true);
        this.render();
    }
}

new WireWorld(25, 25);
