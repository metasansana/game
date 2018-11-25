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
var engine_1 = require("./engine");
/**
 * Turn message.
 */
var Turn = /** @class */ (function () {
    function Turn(actor) {
        this.actor = actor;
    }
    return Turn;
}());
exports.Turn = Turn;
/**
 * Advance message.
 */
var Advance = /** @class */ (function () {
    function Advance(actor) {
        this.actor = actor;
    }
    return Advance;
}());
exports.Advance = Advance;
/**
 * Fire message.
 */
var Fire = /** @class */ (function () {
    function Fire(actor) {
        this.actor = actor;
    }
    return Fire;
}());
exports.Fire = Fire;
/**
 * Disable message.
 */
var Disable = /** @class */ (function () {
    function Disable(actor) {
        this.actor = actor;
    }
    return Disable;
}());
exports.Disable = Disable;
/**
 * Controller allows the user to move the character on screen.
 */
var Controller = /** @class */ (function (_super) {
    __extends(Controller, _super);
    function Controller(buttons, system) {
        var _this = _super.call(this, system) || this;
        _this.buttons = buttons;
        _this.system = system;
        _this.receive = [];
        _this.advance = function () { return _this.tell('engine', new Advance(_this.self())); };
        _this.turn = function () { return _this.tell('engine', new Turn(_this.self())); };
        _this.fire = function () { _this.tell('engine', new Fire(_this.self())); };
        _this.send = function (m) {
            _this.tell('engine', m);
            _this.select(_this.enabled);
        };
        _this.handleDisable = function () { return _this.select(_this.disabled); };
        _this.disabled = [];
        _this.enabled = [
            new resident_1.Case(Advance, _this.send),
            new resident_1.Case(Turn, _this.send),
            new resident_1.Case(Fire, _this.send),
            new resident_1.Case(Disable, _this.handleDisable)
        ];
        return _this;
    }
    /**
     * run method.
     *
     * This will install the hooks for the button actions
     * and instruct the engine to spawn a new avatar.
     */
    Controller.prototype.run = function () {
        this.buttons[0].addEventListener('click', this.advance);
        this.buttons[1].addEventListener('click', this.turn);
        this.buttons[2].addEventListener('click', this.fire);
        this.tell('engine', new engine_1.Regen(this.self()));
        this.select(this.enabled);
    };
    return Controller;
}(resident_1.Mutable));
exports.Controller = Controller;
//# sourceMappingURL=controller.js.map