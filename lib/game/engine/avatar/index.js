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
var future_1 = require("@quenk/noni/lib/control/monad/future");
var function_1 = require("@quenk/noni/lib/data/function");
var point_1 = require("../point");
var __1 = require("../");
var orientation_1 = require("./orientation");
var sound_1 = require("../sound");
var controller_1 = require("../../controller");
/**
 * Reload message.
 */
var Reload = /** @class */ (function () {
    function Reload() {
    }
    return Reload;
}());
exports.Reload = Reload;
/**
 * Die message.
 */
var Die = /** @class */ (function () {
    function Die() {
    }
    return Die;
}());
exports.Die = Die;
/**
 * Avatar controls the rendering of an avatar on screen.
 *
 * This works by turning various arrays of blocks on and off
 *
 * North [1,3,4,5,6,8]
 * 0  1  2
 *___###___
 *#########
 *###___###
 * 6  7  8
 *
 *East [0,1,4,5,6,7]
 * 0  1  2
 *######___
 *___######
 *######___
 * 6  7  8
 *
 *South [0,2,3,4,5,7]
 * 0  1  2
 *###___###
 *#########
 *___###___
 * 6  7  8
 *
 *West [1,2,3,4,7,8]
 * 0  1  2
 *___######
 *######___
 *___######
 * 6  7  8
 */
var Avatar = /** @class */ (function (_super) {
    __extends(Avatar, _super);
    function Avatar(region, step, controller, system) {
        var _this = _super.call(this, system) || this;
        _this.region = region;
        _this.step = step;
        _this.controller = controller;
        _this.system = system;
        _this.orientation = new orientation_1.Orientation(0, [
            [1, 3, 4, 5, 6, 8],
            [0, 1, 4, 5, 6, 7],
            [0, 2, 3, 4, 5, 7],
            [1, 2, 3, 4, 7, 8]
        ]);
        _this.doTurn = function () {
            erase(_this);
            drawNext(_this);
            _this.tell('sounds/turn', sound_1.PLAY);
            _this.select(_this.hunting);
        };
        _this.doAdvance = function () {
            var _a = _this, region = _a.region, step = _a.step;
            var orient = region.select(_this.orientation.current());
            region.erase();
            point_1.seek(_this.orientation.point, step, region);
            orient.draw();
            _this.tell('sounds/advance', sound_1.PLAY);
            _this.select(_this.hunting);
        };
        _this.doFire = function () {
            var head = _this.region.blockAt(_this.orientation.head());
            _this.tell('engine', new __1.ShotGen(head.x, head.y, _this.orientation.point, _this.self()));
            _this.tell('sounds/fire', sound_1.PLAY);
            _this.select(_this.firing);
        };
        _this.doDie = function () {
            var time = 500;
            delay(time, function () { return drawNext(_this); })
                .chain(function () { return delay(time, function () { return drawNext(_this); }); })
                .chain(function () { return delay(time, function () { return drawNext(_this); }); })
                .chain(function () { return delay(time, function () { return drawNext(_this); }); })
                .chain(function () { return delay(time, function () { return erase(_this); }); })
                .fork(function_1.noop, function_1.noop);
            _this.tell('engine', new controller_1.Disable(_this.self()));
        };
        _this.doReload = function () {
            return _this.select(_this.hunting);
        };
        _this.hunting = [
            new resident_1.Case(controller_1.Turn, _this.doTurn),
            new resident_1.Case(controller_1.Advance, _this.doAdvance),
            new resident_1.Case(controller_1.Fire, _this.doFire),
            new resident_1.Case(Die, _this.doDie)
        ];
        _this.firing = [
            new resident_1.Case(controller_1.Turn, _this.doTurn),
            new resident_1.Case(controller_1.Advance, _this.doAdvance),
            new resident_1.Case(Reload, _this.doReload),
            new resident_1.Case(Die, _this.doDie)
        ];
        _this.receive = _this.hunting;
        return _this;
    }
    Avatar.prototype.run = function () {
        drawNext(this);
    };
    return Avatar;
}(resident_1.Mutable));
exports.Avatar = Avatar;
var drawNext = function (a) {
    return a.region.select(a.orientation.next()).draw();
};
var erase = function (a) {
    return a.region.select(a.orientation.current()).erase();
};
var delay = function (n, f) {
    return new future_1.Run(function (s) {
        setTimeout(function () { return s.onSuccess(f()); }, n);
        return function () { };
    });
};
//# sourceMappingURL=index.js.map