import { Index } from '../../../grid';
import { Point } from '../point';
/**
 * Map is a list of visible block indicies used to display orientation.
 */
export declare type Map = Index[];
/**
 * Orientation of an Avatar.
 *
 * Tracks the blocks in a Region that are used to display
 * an Avatar's orientation.
 *
 * Can only be nort,east,south or west.
 */
export declare class Orientation {
    point: Point;
    states: [Map, Map, Map, Map];
    constructor(point: Point, states: [Map, Map, Map, Map]);
    /**
     * current provides the current Orientation.
     */
    current(): Map;
    /**
     * next provides the next Orientation
     */
    next(): Map;
    /**
     * head provides the cell with the avatar's head.
     */
    head(): Index;
}
