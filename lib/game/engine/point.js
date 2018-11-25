"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * seek advances a Range by exactly one step unit along an Point axis.
 *
 * If moving the Range makes it out of bounds, we cancel.
 */
exports.seek = function (point, step, r) {
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
};
//# sourceMappingURL=point.js.map