var WWType;
(function (WWType) {
    WWType[WWType["Head"] = 0] = "Head";
    WWType[WWType["Tail"] = 1] = "Tail";
    WWType[WWType["Wire"] = 2] = "Wire";
    WWType[WWType["None"] = 3] = "None";
})(WWType || (WWType = {}));
var WHITE = "#FFFFFF";
var YELLOW = "#FFFF00";
var RED = "#FF0000";
var GREEN = "#0000FF";
var BLUE = "#0000FF";
var CYAN = "#00FFFF";
var ORANGE = "#FFA500";
var BLACK = "#000000";
var WireWorld = /** @class */ (function () {
    function WireWorld(x, y) {
        var _this = this;
        this.grid = [];
        this.grid2 = [];
        this.reset = function () {
            var size = parseInt(_this.sizeSelector.value);
            var scale = parseInt(_this.scaleSelector.value);
            _this.scale = scale;
            _this.size = size;
            _this.image = new ImageData(_this.size, _this.size);
            _this.canvas.width = size;
            _this.canvas.height = size;
            _this.canvas.style.width = (size * _this.scale).toString() + "px";
            _this.canvas.style.height = (size * _this.scale).toString() + "px";
            _this.grid = new Array(size * size);
            _this.grid2 = new Array(size * size);
            _this.drawType = WWType.Wire;
            _this.painting = false;
            _this.clearWorld();
        };
        this.pressEventHandler = function (e) {
            var mouseX = e.changedTouches ?
                e.changedTouches[0].pageX :
                e.pageX;
            var mouseY = e.changedTouches ?
                e.changedTouches[0].pageY :
                e.pageY;
            mouseX -= Math.floor(_this.canvas.offsetLeft);
            mouseY -= Math.floor(_this.canvas.offsetTop);
            mouseX /= _this.scale;
            mouseY /= _this.scale;
            console.log("x:" + mouseX + "  y:" + mouseY);
            _this.painting = true;
            _this.addTypeToGrid(_this.grid, _this.drawType, Math.floor(mouseX), Math.floor(mouseY));
            _this.render();
        };
        this.dragEventHandler = function (e) {
            var mouseX = e.changedTouches ?
                e.changedTouches[0].pageX :
                e.pageX;
            var mouseY = e.changedTouches ?
                e.changedTouches[0].pageY :
                e.pageY;
            mouseX -= _this.canvas.offsetLeft;
            mouseY -= _this.canvas.offsetTop;
            mouseX /= _this.scale;
            mouseY /= _this.scale;
            if (_this.painting) {
                _this.addTypeToGrid(_this.grid, _this.drawType, Math.floor(mouseX), Math.floor(mouseY));
                _this.render();
            }
            e.preventDefault();
        };
        this.releaseEventHandler = function (e) {
            _this.painting = false;
            _this.render();
        };
        this.getTypeFromGrid = function (grid, x, y) {
            return grid[y * _this.size + x];
        };
        this.render = function () {
            for (var i = 0; i < _this.size * _this.size; ++i) {
                var color = _this.hexToRgb(_this.getColor(_this.grid[i]));
                _this.image.data[i * 4 + 0] = color.r;
                _this.image.data[i * 4 + 1] = color.g;
                _this.image.data[i * 4 + 2] = color.b;
                _this.image.data[i * 4 + 3] = 255;
            }
            _this.context.putImageData(_this.image, 0, 0);
        };
        this.update = function () {
            for (var y = 0; y < _this.size; ++y) {
                for (var x = 0; x < _this.size; ++x) {
                    var type = _this.getTypeFromGrid(_this.grid, x, y);
                    switch (type) {
                        case WWType.None:
                            _this.addTypeToGrid(_this.grid2, WWType.None, x, y);
                            break;
                        case WWType.Tail:
                            _this.addTypeToGrid(_this.grid2, WWType.Wire, x, y);
                            break;
                        case WWType.Head:
                            _this.addTypeToGrid(_this.grid2, WWType.Tail, x, y);
                            break;
                        case WWType.Wire:
                            var count = 0;
                            if (_this.getTypeFromGrid(_this.grid, x - 1, y - 1) == WWType.Head) {
                                count++;
                            }
                            if (_this.getTypeFromGrid(_this.grid, x - 0, y - 1) == WWType.Head) {
                                count++;
                            }
                            if (_this.getTypeFromGrid(_this.grid, x + 1, y - 1) == WWType.Head) {
                                count++;
                            }
                            if (_this.getTypeFromGrid(_this.grid, x - 1, y - 0) == WWType.Head) {
                                count++;
                            }
                            if (_this.getTypeFromGrid(_this.grid, x + 1, y - 0) == WWType.Head) {
                                count++;
                            }
                            if (_this.getTypeFromGrid(_this.grid, x - 1, y + 1) == WWType.Head) {
                                count++;
                            }
                            if (_this.getTypeFromGrid(_this.grid, x - 0, y + 1) == WWType.Head) {
                                count++;
                            }
                            if (_this.getTypeFromGrid(_this.grid, x + 1, y + 1) == WWType.Head) {
                                count++;
                            }
                            if (count == 1 || count == 2) {
                                _this.addTypeToGrid(_this.grid2, WWType.Head, x, y);
                            }
                            else {
                                _this.addTypeToGrid(_this.grid2, WWType.Wire, x, y);
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
            _this.grid = _this.grid2.slice(0, _this.size * _this.size);
            _this.render();
        };
        var canvas = document.getElementById("world");
        var context = canvas.getContext("2d");
        this.scaleSelector = document.getElementById("scale");
        this.sizeSelector = document.getElementById("size");
        context.imageSmoothingEnabled = false;
        context.imageSmoothingQuality = "low";
        this.canvas = canvas;
        this.context = context;
        this.reset();
        this.createUserEvents();
    }
    WireWorld.prototype.createUserEvents = function () {
        var _this = this;
        var canvas = this.canvas;
        canvas.addEventListener("mousedown", this.pressEventHandler);
        canvas.addEventListener("mouseup", this.releaseEventHandler);
        canvas.addEventListener("mousemove", this.dragEventHandler);
        canvas.addEventListener("mouseout", this.releaseEventHandler);
        canvas.addEventListener("touchstart", this.pressEventHandler);
        canvas.addEventListener("touchend", this.releaseEventHandler);
        canvas.addEventListener("touchmove", this.dragEventHandler);
        canvas.addEventListener("touchcancel", this.releaseEventHandler);
        document.getElementById("dthead").addEventListener("click", function () { _this.setDrawType(WWType.Head); });
        document.getElementById("dttail").addEventListener("click", function () { _this.setDrawType(WWType.Tail); });
        document.getElementById("dtwire").addEventListener("click", function () { _this.setDrawType(WWType.Wire); });
        document.getElementById("dtnone").addEventListener("click", function () { _this.setDrawType(WWType.None); });
        document.getElementById("clear").addEventListener("click", function () { _this.clearWorld(); });
        document.getElementById("update").addEventListener("click", function () { _this.update(); });
        this.scaleSelector.addEventListener("change", this.reset);
        this.sizeSelector.addEventListener("change", this.reset);
    };
    WireWorld.prototype.setDrawType = function (type) {
        this.drawType = type;
    };
    WireWorld.prototype.clearWorld = function () {
        for (var i = 0; i < this.size * this.size; ++i) {
            this.grid[i] = WWType.None;
            this.grid2[i] = WWType.None;
        }
        this.render();
    };
    WireWorld.prototype.addTypeToGrid = function (grid, type, x, y) {
        grid[y * this.size + x] = type;
    };
    WireWorld.prototype.hexToRgb = function (hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        } : null;
    };
    WireWorld.prototype.getColor = function (type) {
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
    };
    return WireWorld;
}());
new WireWorld(25, 25);
//# sourceMappingURL=ww.js.map