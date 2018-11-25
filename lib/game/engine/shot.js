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
var avatar_1 = require("./avatar");
var point_1 = require("./point");
/**
 * Tick message.
 */
var Tick = /** @class */ (function () {
    function Tick() {
    }
    return Tick;
}());
exports.Tick = Tick;
/**
 * Stop message.
 */
var Stop = /** @class */ (function () {
    function Stop() {
    }
    return Stop;
}());
exports.Stop = Stop;
/**
 * Shot actor.
 *
 * Represents a moving shot across an x or y point.
 */
var Shot = /** @class */ (function (_super) {
    __extends(Shot, _super);
    function Shot(block, step, point, ttl, avatar, system) {
        var _this = _super.call(this, system) || this;
        _this.block = block;
        _this.step = step;
        _this.point = point;
        _this.ttl = ttl;
        _this.avatar = avatar;
        _this.system = system;
        _this.doTick = function (ttl) { return function () {
            if (ttl > 0) {
                //avoid erasing the avatar head.
                if (ttl !== _this.ttl)
                    _this.block.erase();
                point_1.seek(_this.point, _this.step, _this.block);
                _this.block.draw();
                setTimeout(function () { return _this.tell(_this.self(), new Tick()); }, 10);
                _this.select(_this.ticking(ttl - 1));
            }
            else {
                _this.block.erase();
                _this.exit();
                _this.tell(_this.avatar, new avatar_1.Reload());
            }
        }; };
        _this.ticking = function (ttl) { return [
            new resident_1.Case(Tick, _this.doTick(ttl))
        ]; };
        _this.receive = [];
        return _this;
    }
    Shot.prototype.run = function () {
        this.tell(this.self(), new Tick());
        this.select(this.ticking(this.ttl));
    };
    return Shot;
}(resident_1.Mutable));
exports.Shot = Shot;
//# sourceMappingURL=shot.js.map