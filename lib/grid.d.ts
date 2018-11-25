/**
 * Context is an alias for a ridculous class name.
 */
export declare type Context = CanvasRenderingContext2D;
/**
 * Coord or coordinate value.
 */
export declare type Coord = number;
/**
 * Offset is usually added to a coordinate.
 */
export declare type Offset = number;
/**
 * Index typed used to retrieve a block in a Range.
 */
export declare type Index = number;
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
export declare class Grid {
    xblocks: number;
    yblocks: number;
    canvas: HTMLCanvasElement;
    constructor(xblocks: number, yblocks: number, canvas: HTMLCanvasElement);
    /**
     * blockWidth is the number of pixels used for a block's height.
     */
    readonly blockWidth: number;
    /**
     * blockHeight is the number of pixles used for a block's height.
     */
    readonly blockHeight: number;
    /**
     *xpixels returns the number of pixels per row in the grid.
     */
    readonly xpixels: number;
    /**
      *ypixels returns the number of pixels per column in the grid.
      */
    readonly ypixels: number;
    /**
     * getRegion constructs a Region using the provided cordinates
     * and optional offsets.
     */
    getRegion(x: Coord, y: Coord, rows?: number, columns?: number): Region;
    /**
     * drawBlock a single block on the canvas at the specified location.
     */
    drawBlock(x: Coord, y: Coord): this;
    /**
     * eraseBlock a single block at the specified location.
     */
    eraseBlock(x: Coord, y: Coord): this;
    /**
     * checkBlock to see if it falls within the grid's range.
     */
    checkBlock(x: Coord, y: Coord): boolean;
}
/**
 * Block within the Grid system.
 *
 * This class allows a block to be manipulated as well as tracks
 * the state of the Block.
 */
export declare class Block implements Range {
    x: Coord;
    y: Coord;
    grid: Grid;
    constructor(x: Coord, y: Coord, grid: Grid);
    /**
     * isVisible indicates whether the block is currently drawn or not.
     */
    isVisible: boolean;
    draw(): Block;
    erase(): Block;
    move(x: number, y: number): Block;
    check(): boolean;
}
/**
 * Sample represents a non-contigous collection of blocks.
 */
export declare class Sample implements Range {
    blocks: Block[];
    constructor(blocks: Block[]);
    draw(): Range;
    erase(): Range;
    move(x: number, y: number): this;
    check(): boolean;
    /**
     * blockAt provides a block given its index.
     *
     * XXX: make this safe!
     */
    blockAt(n: number): Block;
}
/**
 * Region represents a collection of one or more blocks.
 *
 * This class allows for multiple blocks to be manipulated
 * via one class.
 */
export declare class Region extends Sample {
    x: Coord;
    y: Coord;
    rows: number;
    columns: number;
    blocks: Block[];
    constructor(x: Coord, y: Coord, rows: number, columns: number, blocks: Block[]);
    /**
     * reduce the blocks of this Region to a single value.
     */
    reduce<R>(init: R, f: (pre: R, b: Block, i: number) => R): R;
    /**
     * select a non-contingous range of blocks from this Region.
     *
     * Selection is based on left to right indicies of each Block.
     * If any indicies are invalid, they are ignored for now.
     */
    select(idx: number[]): Range;
}
/**
 * blocks calculates all the Blocks included in a region.
 */
export declare const blocks: (grid: Grid, originX: number, originY: number, rows: number, columns: number) => Block[];
