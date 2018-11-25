import { Range } from '../../grid';

/**
 * Point (N,E,S,W)
 */
export type Point = 0 | 1 | 2 | 3;

/**
 * seek advances a Range by exactly one step unit along an Point axis.
 *
 * If moving the Range makes it out of bounds, we cancel.
 */
export const seek = (point: Point, step: number, r: Range) => {

    switch (point) {

        case 0:
            r.move(0, -step);
            if (!r.check())
                r.move(0, step);
            break;

        case 1:
            r.move(step, 0);
            if (!r.check())
                r.move(-step, 0);
            break;

        case 2:
            r.move(0, step);
            if (!r.check())
                r.move(0, -step);
            break;

        case 3:
            r.move(-step, 0);
        if (!r.check())
          r.move(step, 0);
            break;

        default:
            break;

    }

}
