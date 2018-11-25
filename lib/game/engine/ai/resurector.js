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
var computer_1 = require("./computer");
/**
 * Spawn message.
 */
var Spawn = /** @class */ (function () {
    function Spawn() {
    }
    return Spawn;
}());
exports.Spawn = Spawn;
/**
 * Resume message.
 */
var Resume = /** @class */ (function () {
    function Resume() {
    }
    return Resume;
}());
exports.Resume = Resume;
/**
 * Resurector spawns new ai avatars occasionally.
 */
var Resurector = /** @class */ (function (_super) {
    __extends(Resurector, _super);
    function Resurector(duration, limit, system) {
        var _this = _super.call(this, system) || this;
        _this.duration = duration;
        _this.limit = limit;
        _this.system = system;
        _this.count = 0;
        _this.receive = [];
        _this.handleSpawn = function (id) { return function () {
            if (_this.count === _this.limit) {
                _this.select(_this.resting(id));
            }
            else {
                _this.count = _this.count + 1;
                _this.spawn({
                    id: "computer-" + id,
                    create: function (s) { return new computer_1.Computer(s); }
                });
                _this.select(_this.spawning(id + 1));
                schedule(_this);
            }
        }; };
        _this.handleResume = function (id) { return function () {
            schedule(_this);
            _this.select(_this.spawning(id));
        }; };
        _this.spawning = function (id) { return [
            new resident_1.Case(Spawn, _this.handleSpawn(id))
        ]; };
        _this.resting = function (id) { return [
            new resident_1.Case(Resume, _this.handleResume(id))
        ]; };
        return _this;
    }
    Resurector.prototype.run = function () {
        //    this.select(this.spawning(0));
        //schedule(this);
    };
    return Resurector;
}(resident_1.Mutable));
exports.Resurector = Resurector;
var schedule = function (r) {
    return setTimeout(function () { return r.tell(r.self(), new Spawn); }, r.duration);
};
//const random = (n: number) =>
//  Math.floor(Math.random() * n) + 1000;
//# sourceMappingURL=resurector.js.map