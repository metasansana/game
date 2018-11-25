"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Orientation of an Avatar.
 *
 * Tracks the blocks in a Region that are used to display
 * an Avatar's orientation.
 *
 * Can only be nort,east,south or west.
 */
var Orientation = /** @class */ (function () {
    function Orientation(point, states) {
        this.point = point;
        this.states = states;
    }
    /**
     * current provides the current Orientation.
     */
    Orientation.prototype.current = function () {
        return this.states[this.point];
    };
    /**
     * next provides the next Orientation
     */
    Orientation.prototype.next = function () {
        if (this.point === (this.states.length - 1))
            this.point = 0;
        else
            this.point++;
        return this.states[this.point];
    };
    /**
     * head provides the cell with the avatar's head.
     */
    Orientation.prototype.head = function () {
        var curr = this.current();
        switch (this.point) {
            case 0:
                return curr[0];
                break;
            case 1:
                return curr[3];
                break;
            case 2:
                return curr[5];
                break;
            case 3:
                return curr[2];
                break;
        }
    };
    return Orientation;
}());
exports.Orientation = Orientation;
//# sourceMappingURL=orientation.js.map