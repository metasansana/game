"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Logger
 *
 * Conveinence logger, mostly for debugging.
 */
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger.info = function () {
        var msg = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            msg[_i] = arguments[_i];
        }
        if (window.ENABLE_LOGGER)
            console.info.apply(console, msg);
        return this;
    };
    Logger.warn = function () {
        var msg = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            msg[_i] = arguments[_i];
        }
        if (window.ENABLE_LOGGER)
            console.warn.apply(console, msg);
        return this;
    };
    return Logger;
}());
exports.Logger = Logger;
//# sourceMappingURL=log.js.map