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
var address_1 = require("@quenk/potoo/lib/actor/address");
var avatar_1 = require("./avatar");
var controller_1 = require("../controller");
var shot_1 = require("./shot");
var sound_1 = require("./sound");
var ORIGIN_X = 1;
var ORIGIN_Y = 1;
var AVATAR_ROWS = 3;
var AVATAR_COLUMNS = 3;
/**
 * Regen indicates a new avatar should be
 * inserted to the grid on behalf of some actor.
 *
 * For now, avatars are always spawned at origin.
 */
var Regen = /** @class */ (function () {
    function Regen(actor) {
        this.actor = actor;
    }
    return Regen;
}());
exports.Regen = Regen;
/**
 * ShotGen message.
 */
var ShotGen = /** @class */ (function () {
    function ShotGen(originX, originY, point, avatar) {
        this.originX = originX;
        this.originY = originY;
        this.point = point;
        this.avatar = avatar;
    }
    return ShotGen;
}());
exports.ShotGen = ShotGen;
/**
 * Engine actor serving as display server.
 *
 * This actor receives commands from other actors and
 * outputs its results to the internal grid.
 */
var Engine = /** @class */ (function (_super) {
    __extends(Engine, _super);
    function Engine(grid, system) {
        var _this = _super.call(this, system) || this;
        _this.grid = grid;
        _this.system = system;
        /**
         * bridge from Controllers to Avatars.
         */
        _this.bridge = {};
        _this.regenerateAvatar = function (_a) {
            var actor = _a.actor;
            var id = address_1.getId(actor);
            _this.bridge[actor] = _this.spawn({
                id: id,
                create: function (s) { return new avatar_1.Avatar(_this.grid.getRegion(ORIGIN_X, ORIGIN_Y, AVATAR_ROWS, AVATAR_COLUMNS), _this.grid.blockWidth * 3, actor, s); }
            });
        };
        _this.sendTurn = function (t) {
            _this.tell(_this.bridge[t.actor], t);
            _this.tell('sounds/turn', sound_1.PLAY);
        };
        _this.sendAdvance = function (a) {
            _this.tell(_this.bridge[a.actor], a);
            _this.tell('sounds/advance', sound_1.PLAY);
        };
        _this.sendFire = function (a) {
            _this.tell(_this.bridge[a.actor], a);
            _this.tell('sounds/fire', sound_1.PLAY);
        };
        _this.spawnShot = function (_a) {
            var point = _a.point, originX = _a.originX, originY = _a.originY, avatar = _a.avatar;
            var id = "shot-" + address_1.getId(avatar);
            var ttl = 25;
            var rate = _this.grid.blockWidth * 2;
            switch (point) {
                case 0:
                    ttl = Math.ceil(originY / _this.grid.blockHeight);
                    break;
                case 1:
                    ttl = _this.grid.xblocks - Math.ceil((originX / _this.grid.blockWidth));
                    break;
                case 2:
                    ttl = _this.grid.yblocks - Math.ceil((originY / _this.grid.blockHeight));
                case 3:
                    ttl = Math.ceil(originX / _this.grid.blockWidth);
            }
            var blk = _this.grid.getRegion(originX, originY, 1, 1);
            _this.spawn({
                id: id,
                create: function (s) { return new shot_1.Shot(blk, rate, point, ttl, avatar, s); },
                restart: false
            });
        };
        _this.receive = [
            new resident_1.Case(controller_1.Turn, _this.sendTurn),
            new resident_1.Case(controller_1.Advance, _this.sendAdvance),
            new resident_1.Case(controller_1.Fire, _this.sendFire),
            new resident_1.Case(ShotGen, _this.spawnShot),
            new resident_1.Case(Regen, _this.regenerateAvatar)
        ];
        return _this;
    }
    Engine.prototype.run = function () { };
    return Engine;
}(resident_1.Immutable));
exports.Engine = Engine;
/*
const calcTTL = (grid: Grid, point: point) => {

  let ttl = 0;

  switch (point) {

      case 0:
          break;

  }

}*/
//# sourceMappingURL=index.js.map