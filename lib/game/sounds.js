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
var sound_1 = require("./engine/sound");
exports.SOUNDS_FIRE = 'assets/audio/fire.wav';
exports.SOUNDS_ADVANCE = 'assets/audio/advance.flac';
exports.SOUNDS_TURN = 'assets/audio/turn.flac';
/**
 * Sounds actor.
 *
 * Serves as parent for all the audio assets.
 */
var Sounds = /** @class */ (function (_super) {
    __extends(Sounds, _super);
    function Sounds() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.receive = [];
        return _this;
    }
    Sounds.prototype.run = function () {
        this.spawn({
            id: 'fire',
            create: function (s) { return new sound_1.Sound(new Audio(exports.SOUNDS_FIRE), s); }
        });
        this.spawn({
            id: 'advance',
            create: function (s) { return new sound_1.Sound(new Audio(exports.SOUNDS_ADVANCE), s); }
        });
        this.spawn({
            id: 'turn',
            create: function (s) { return new sound_1.Sound(new Audio(exports.SOUNDS_TURN), s); }
        });
    };
    return Sounds;
}(resident_1.Immutable));
exports.Sounds = Sounds;
//# sourceMappingURL=sounds.js.map