"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var log_1 = require("./log");
/**
 * Grid class
 *
 * A grid is an array of contingous blocks drawn to a canvas.
 *
 * @property xblocks - The number of blocks the grid has on its x axis.
 * @property yblocks - The number of blocks the grid has on its y access.
 */
var Grid = /** @class */ (function () {
    function Grid(xblocks, yblocks, canvas) {
        this.xblocks = xblocks;
        this.yblocks = yblocks;
        this.canvas = canvas;
    }
    Object.defineProperty(Grid.prototype, "blockWidth", {
        /**
         * blockWidth is the number of pixels used for a block's height.
         */
        get: function () {
            return this.canvas.width / this.xblocks;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "blockHeight", {
        /**
         * blockHeight is the number of pixles used for a block's height.
         */
        get: function () {
            return this.blockWidth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "xpixels", {
        /**
         *xpixels returns the number of pixels per row in the grid.
         */
        get: function () {
            return this.xblocks * this.blockWidth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "ypixels", {
        /**
          *ypixels returns the number of pixels per column in the grid.
          */
        get: function () {
            return this.yblocks * this.blockHeight;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * getRegion constructs a Region using the provided cordinates
     * and optional offsets.
     */
    Grid.prototype.getRegion = function (x, y, rows, columns) {
        if (rows === void 0) { rows = 1; }
        if (columns === void 0) { columns = 1; }
        return new Region(x, y, rows, columns, exports.blocks(this, x, y, rows, columns));
    };
    /**
     * drawBlock a single block on the canvas at the specified location.
     */
    Grid.prototype.drawBlock = function (x, y) {
        var c = this.canvas.getContext('2d');
        var actualX = roundUp(x, 1);
        var actualY = roundUp(y, 1);
        log_1.Logger.info("Grid: drawing new square at (x,y): " + actualX + ", " + actualY);
        c.fillStyle = '#00000';
        c.fillRect(x, y, this.blockWidth, this.blockHeight);
        return this;
    };
    /**
     * eraseBlock a single block at the specified location.
     */
    Grid.prototype.eraseBlock = function (x, y) {
        var c = this.canvas.getContext('2d');
        var actualX = roundUp(x, 1);
        var actualY = roundUp(y, 1);
        log_1.Logger.info("Grid: removing square at (x,y): " + actualX + ", " + actualY);
        c.clearRect(actualX, actualY, this.blockWidth, this.blockHeight);
        return this;
    };
    /**
     * checkBlock to see if it falls within the grid's range.
     */
    Grid.prototype.checkBlock = function (x, y) {
        if ((x < 1) || (y < 1))
            return false;
        else if ((x > this.xpixels) || (y > this.ypixels))
            return false;
        return true;
    };
    return Grid;
}());
exports.Grid = Grid;
/**
 * Block within the Grid system.
 *
 * This class allows a block to be manipulated as well as tracks
 * the state of the Block.
 */
var Block = /** @class */ (function () {
    function Block(x, y, grid) {
        this.x = x;
        this.y = y;
        this.grid = grid;
        /**
         * isVisible indicates whether the block is currently drawn or not.
         */
        this.isVisible = false;
    }
    Block.prototype.draw = function () {
        this.grid.drawBlock(this.x, this.y);
        this.isVisible = true;
        return this;
    };
    Block.prototype.erase = function () {
        this.grid.eraseBlock(this.x, this.y);
        this.isVisible = false;
        return this;
    };
    Block.prototype.move = function (x, y) {
        this.x = this.x + x;
        this.y = this.y + y;
        return this;
    };
    Block.prototype.check = function () {
        return this.grid.checkBlock(this.x, this.y);
    };
    return Block;
}());
exports.Block = Block;
/**
 * Sample represents a non-contigous collection of blocks.
 */
var Sample = /** @class */ (function () {
    function Sample(blocks) {
        this.blocks = blocks;
    }
    Sample.prototype.draw = function () {
        this.blocks.forEach(function (b) { return b.draw(); });
        return this;
    };
    Sample.prototype.erase = function () {
        this.blocks.forEach(function (b) { return b.erase(); });
        return this;
    };
    Sample.prototype.move = function (x, y) {
        this.blocks.forEach(function (b) { return b.move(x, y); });
        return this;
    };
    Sample.prototype.check = function () {
        return this.blocks.every(function (b) { return b.check(); });
    };
    /**
     * blockAt provides a block given its index.
     *
     * XXX: make this safe!
     */
    Sample.prototype.blockAt = function (n) {
        return this.blocks[n];
    };
    return Sample;
}());
exports.Sample = Sample;
/**
 * Region represents a collection of one or more blocks.
 *
 * This class allows for multiple blocks to be manipulated
 * via one class.
 */
var Region = /** @class */ (function (_super) {
    __extends(Region, _super);
    function Region(x, y, rows, columns, blocks) {
        var _this = _super.call(this, blocks) || this;
        _this.x = x;
        _this.y = y;
        _this.rows = rows;
        _this.columns = columns;
        _this.blocks = blocks;
        return _this;
    }
    /**
     * reduce the blocks of this Region to a single value.
     */
    Region.prototype.reduce = function (init, f) {
        return this.blocks.reduce(f, init);
    };
    /**
     * select a non-contingous range of blocks from this Region.
     *
     * Selection is based on left to right indicies of each Block.
     * If any indicies are invalid, they are ignored for now.
     */
    Region.prototype.select = function (idx) {
        var _this = this;
        return new Sample(idx.map(function (i) { return _this.blocks[i]; }).filter(function (b, i) {
            if (!b)
                log_1.Logger.warn("Region#select: ignoring unknown index \"" + i + "\". " +
                    ("Known indicies: 1-" + _this.blocks.length));
            return b;
        }));
    };
    return Region;
}(Sample));
exports.Region = Region;
var roundUp = function (n, to) {
    return n === 0 ? to : n;
};
/**
 * blocks calculates all the Blocks included in a region.
 */
exports.blocks = function (grid, originX, originY, rows, columns) {
    var list = [new Block(originX, originY, grid)];
    var xOffset = 1;
    var yOffset = 1;
    //first row
    while (xOffset < columns) {
        list.push(new Block(originX + (xOffset * grid.blockWidth), originY, grid));
        xOffset++;
    }
    //others
    while (yOffset < rows) {
        var actualY = originY + (yOffset * grid.blockHeight);
        xOffset = 1;
        list.push(new Block(originX, actualY, grid));
        while (xOffset < columns) {
            var actualX = originX + (xOffset * grid.blockWidth);
            list.push(new Block(actualX, actualY, grid));
            xOffset++;
        }
        yOffset++;
    }
    return list;
};
//# sourceMappingURL=grid.js.map