import { Logger } from './log';

/**
 * Context is an alias for a ridculous class name.
 */
export type Context = CanvasRenderingContext2D;

/**
 * Coord or coordinate value.
 */
export type Coord = number;

/**
 * Offset is usually added to a coordinate.
 */
export type Offset = number;

/**
 * Index typed used to retrieve a block in a Range.
 */
export type Index = number;

/**
 * Range represents a selection of one or more blocks in a grid.
 */
export interface Range {

    /**
     * draw the blocks in the Range.
       */
    draw(): Range;

    /**
     * erase the blocks in the Range.
     */
    erase(): Range;

    /**
     * move the blocks in the Range by the specified amounts on
     * the x/y axes.
     *
     * This does NOT erase or re-draw those blocks.
     */
    move(x: number, y: number): Range;

    /**
     * check if this Range is out of bounds.
     */
    check(): boolean;

}

/**
 * Grid class
 *
 * A grid is an array of contingous blocks drawn to a canvas.
 *
 * @property xblocks - The number of blocks the grid has on its x axis.
 * @property yblocks - The number of blocks the grid has on its y access.
 */
export class Grid {

    constructor(
        public xblocks: number,
        public yblocks: number,
        public canvas: HTMLCanvasElement) { }

    /**
     * blockWidth is the number of pixels used for a block's height.
     */
    get blockWidth(): number {

        return this.canvas.width / this.xblocks;

    }

    /**
     * blockHeight is the number of pixles used for a block's height.
     */
    get blockHeight(): number {

        return this.blockWidth;

    }

    /**
     *xpixels returns the number of pixels per row in the grid.
     */
    get xpixels(): number {

        return this.xblocks * this.blockWidth;

    }

    /**
      *ypixels returns the number of pixels per column in the grid.
      */
    get ypixels(): number {

        return this.yblocks * this.blockHeight;

    }

    /**
     * getRegion constructs a Region using the provided cordinates
     * and optional offsets.
     */
    getRegion(x: Coord, y: Coord, rows: number = 1, columns: number = 1): Region {

        return new Region(
            x,
            y,
            rows,
            columns,
            blocks(this, x, y, rows, columns));

    }

    /**
     * drawBlock a single block on the canvas at the specified location.
     */
    drawBlock(x: Coord, y: Coord) {

        let c = <Context>this.canvas.getContext('2d');
        let actualX = roundUp(x, 1);
        let actualY = roundUp(y, 1);

        Logger.info(`Grid: drawing new square at (x,y): ${actualX}, ${actualY}`);
        c.fillStyle = '#00000';
        c.fillRect(x, y, this.blockWidth, this.blockHeight);
        return this;

    }

    /**
     * eraseBlock a single block at the specified location.
     */
    eraseBlock(x: Coord, y: Coord) {

        let c = <Context>this.canvas.getContext('2d');
        let actualX = roundUp(x, 1);
        let actualY = roundUp(y, 1);

        Logger.info(`Grid: removing square at (x,y): ${actualX}, ${actualY}`);
        c.clearRect(actualX, actualY, this.blockWidth, this.blockHeight);

        return this;

    }

    /**
     * checkBlock to see if it falls within the grid's range.
     */
    checkBlock(x: Coord, y: Coord): boolean {

        if ((x < 1) || (y < 1))
            return false;
        else if ((x > this.xpixels) || (y > this.ypixels))
            return false;

        return true;

    }

}

/**
 * Block within the Grid system. 
 *
 * This class allows a block to be manipulated as well as tracks
 * the state of the Block.
 */
export class Block implements Range {

    constructor(public x: Coord, public y: Coord, public grid: Grid) { }

    /**
     * isVisible indicates whether the block is currently drawn or not.
     */
    isVisible = false;

    draw(): Block {

        this.grid.drawBlock(this.x, this.y);
        this.isVisible = true;
        return this;

    }

    erase(): Block {

        this.grid.eraseBlock(this.x, this.y);
        this.isVisible = false;
        return this;

    }

    move(x: number, y: number): Block {

            this.x = this.x + x;
            this.y = this.y + y;

        return this;

    }

    check() {

        return this.grid.checkBlock(this.x, this.y);

    }

}

/**
 * Sample represents a non-contigous collection of blocks.
 */
export class Sample implements Range {

    constructor(public blocks: Block[]) { }

    draw(): Range {

        this.blocks.forEach(b => b.draw());
        return this;

    }

    erase(): Range {

        this.blocks.forEach(b => b.erase());
        return this;

    }

    move(x: number, y: number): this {

        this.blocks.forEach(b => b.move(x, y));
        return this;

    }

    check() {

        return this.blocks.every(b => b.check());

    }

    /**
     * blockAt provides a block given its index.
     *
     * XXX: make this safe!
     */
    blockAt(n: number): Block {

        return this.blocks[n];

    }

}

/**
 * Region represents a collection of one or more blocks.
 *
 * This class allows for multiple blocks to be manipulated
 * via one class.
 */
export class Region extends Sample {

    constructor(
        public x: Coord,
        public y: Coord,
        public rows: number,
        public columns: number,
        public blocks: Block[]) { super(blocks); }

    /**
     * reduce the blocks of this Region to a single value.
     */
    reduce<R>(init: R, f: (pre: R, b: Block, i: number) => R): R {

        return this.blocks.reduce(f, init);

    }

    /**
     * select a non-contingous range of blocks from this Region.
     *
     * Selection is based on left to right indicies of each Block.
     * If any indicies are invalid, they are ignored for now.
     */
    select(idx: number[]): Range {

        return new Sample(idx.map(i => this.blocks[i]).filter((b, i) => {
            if (!b)
                Logger.warn(`Region#select: ignoring unknown index "${i}". ` +
                    `Known indicies: 1-${this.blocks.length}`);

            return b;

        }));

    }

}

const roundUp = (n: number, to: number): number =>
    n === 0 ? to : n;

/**
 * blocks calculates all the Blocks included in a region.
 */
export const blocks =
    (grid: Grid,
        originX: Coord,
        originY: Coord,
        rows: number,
        columns: number): Block[] => {

        let list: Block[] = [new Block(originX, originY, grid)];
        let xOffset = 1;
        let yOffset = 1;

        //first row
        while (xOffset < columns) {

            list.push(new Block(
                originX + (xOffset * grid.blockWidth),
                originY,
                grid));

            xOffset++;

        }

        //others
        while (yOffset < rows) {

            let actualY = originY + (yOffset * grid.blockHeight);

            xOffset = 1;
            list.push(new Block(originX, actualY, grid));

            while (xOffset < columns) {

                let actualX = originX + (xOffset * grid.blockWidth);

                list.push(new Block(actualX, actualY, grid));
                xOffset++;

            }

            yOffset++;

        }

        return list;

    }
