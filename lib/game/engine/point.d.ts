import { Range } from '../../grid';
/**
 * Point (N,E,S,W)
 */
export declare type Point = 0 | 1 | 2 | 3;
/**
 * seek advances a Range by exactly one step unit along an Point axis.
 *
 * If moving the Range makes it out of bounds, we cancel.
 */
export declare const seek: (point: Point, step: number, r: Range) => void;
