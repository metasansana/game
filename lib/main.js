"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var potoo_1 = require("@quenk/potoo");
var grid_1 = require("./grid");
var engine_1 = require("./game/engine");
var controller_1 = require("./game/controller");
var sounds_1 = require("./game/sounds");
var s = potoo_1.system({ log: { level: 5 } });
var canvas = document.getElementById('screen');
var buttons = [
    document.getElementById('button-0'),
    document.getElementById('button-1'),
    document.getElementById('button-2')
];
window.system = s
    .spawn({
    id: 'engine',
    create: function (s) { return new engine_1.Engine(new grid_1.Grid(50, 50, canvas), s); }
})
    .spawn({
    id: 'p1',
    create: function (s) { return new controller_1.Controller(buttons, s); }
})
    .spawn({
    id: 'sounds',
    create: function (s) { return new sounds_1.Sounds(s); }
});
//# sourceMappingURL=main.js.map