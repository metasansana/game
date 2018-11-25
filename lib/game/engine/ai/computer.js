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
var controller_1 = require("../../controller");
var __1 = require("../");
/**
 *  Tick message.
 */
var Tick = /** @class */ (function () {
    function Tick() {
    }
    return Tick;
}());
exports.Tick = Tick;
/**
 * Computer actor.
 *
 * Generates input commands on behalf of a computer player.
 */
var Computer = /** @class */ (function (_super) {
    __extends(Computer, _super);
    function Computer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.actions = ['turn', 'advance', 'rest', 'rage'];
        _this.handleTick = function () {
            switch (pick(_this.actions)) {
                case 'turn':
                    _this.tell('engine', new controller_1.Turn(_this.self()));
                    break;
                case 'advance':
                    _this.tell('engine', new controller_1.Advance(_this.self()));
                    break;
                case 'fire':
                    _this.tell('engine', new controller_1.Fire(_this.self()));
                    break;
                case 'rage':
                    for (var i = 0; i <= random(10); i++)
                        _this.tell(_this.self(), new Tick());
                    break;
                default:
                    break;
            }
            _this.select(_this.running);
        };
        _this.running = [
            new resident_1.Case(Tick, _this.handleTick)
        ];
        _this.receive = [];
        return _this;
    }
    Computer.prototype.run = function () {
        this.tell('engine', new __1.Regen(this.self()));
        this.tell(this.self(), new Tick());
        this.select(this.running);
    };
    return Computer;
}(resident_1.Mutable));
exports.Computer = Computer;
var pick = function (list) {
    return list[Math.floor(Math.random() * list.length)];
};
var random = function (n) {
    return Math.floor(Math.random() * n) + 1;
};
//# sourceMappingURL=computer.js.map