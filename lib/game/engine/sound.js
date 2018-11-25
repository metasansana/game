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
var resident_1 = require("@quenk/potoo/lib/actor/resident");
exports.PLAY = 'play';
/**
 * Sound acts as a sound server for the game.
 */
var Sound = /** @class */ (function (_super) {
    __extends(Sound, _super);
    function Sound(resource, system) {
        var _this = _super.call(this, system) || this;
        _this.resource = resource;
        _this.system = system;
        _this.receive = [
            new resident_1.Case(exports.PLAY, function () {
                _this
                    .resource
                    .play()
                    .catch(function (e) { return console.error(_this.self() + ": " + e.message); });
            })
        ];
        return _this;
    }
    Sound.prototype.run = function () { };
    return Sound;
}(resident_1.Immutable));
exports.Sound = Sound;
//# sourceMappingURL=sound.js.map