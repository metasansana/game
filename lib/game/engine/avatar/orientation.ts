import { Index } from '../../../grid';
import { Point } from '../point';

/**
 * Map is a list of visible block indicies used to display orientation.
 */
export type Map = Index[];

/**
 * Orientation of an Avatar.
 *
 * Tracks the blocks in a Region that are used to display
 * an Avatar's orientation.
 *
 * Can only be nort,east,south or west.
 */
export class Orientation {

    constructor(
        public point: Point,
        public states: [Map, Map, Map, Map]) { }

    /**
     * current provides the current Orientation.
     */
    current(): Map {

        return this.states[this.point];

    }

    /**
     * next provides the next Orientation
     */
    next(): Map {

        if (this.point === (this.states.length - 1))
            this.point = 0;
        else
            this.point++;

        return this.states[this.point];

    }

    /**
     * head provides the cell with the avatar's head.
     */
    head(): Index {

        let curr = this.current();

        switch (this.point) {

            case 0:
                return curr[0];
                break;

            case 1:
                return curr[3]
                break;

            case 2:
                return curr[5]
                break;

            case 3:
                return curr[2];
                break;

        }

    }

}
