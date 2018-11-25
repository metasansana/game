(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./engine":4,"@quenk/potoo/lib/actor/resident":24}],2:[function(require,module,exports){
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

},{"../":4,"../../controller":1,"../point":5,"../sound":7,"./orientation":3,"@quenk/noni/lib/control/monad/future":13,"@quenk/noni/lib/data/function":17,"@quenk/potoo/lib/actor/resident":24}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Orientation of an Avatar.
 *
 * Tracks the blocks in a Region that are used to display
 * an Avatar's orientation.
 *
 * Can only be nort,east,south or west.
 */
var Orientation = /** @class */ (function () {
    function Orientation(point, states) {
        this.point = point;
        this.states = states;
    }
    /**
     * current provides the current Orientation.
     */
    Orientation.prototype.current = function () {
        return this.states[this.point];
    };
    /**
     * next provides the next Orientation
     */
    Orientation.prototype.next = function () {
        if (this.point === (this.states.length - 1))
            this.point = 0;
        else
            this.point++;
        return this.states[this.point];
    };
    /**
     * head provides the cell with the avatar's head.
     */
    Orientation.prototype.head = function () {
        var curr = this.current();
        switch (this.point) {
            case 0:
                return curr[0];
                break;
            case 1:
                return curr[3];
                break;
            case 2:
                return curr[5];
                break;
            case 3:
                return curr[2];
                break;
        }
    };
    return Orientation;
}());
exports.Orientation = Orientation;

},{}],4:[function(require,module,exports){
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

},{"../controller":1,"./avatar":2,"./shot":6,"./sound":7,"@quenk/potoo/lib/actor/address":22,"@quenk/potoo/lib/actor/resident":24}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * seek advances a Range by exactly one step unit along an Point axis.
 *
 * If moving the Range makes it out of bounds, we cancel.
 */
exports.seek = function (point, step, r) {
    switch (point) {
        case 0:
            r.move(0, -step);
            if (!r.check())
                r.move(0, step);
            break;
        case 1:
            r.move(step, 0);
            if (!r.check())
                r.move(-step, 0);
            break;
        case 2:
            r.move(0, step);
            if (!r.check())
                r.move(0, -step);
            break;
        case 3:
            r.move(-step, 0);
            if (!r.check())
                r.move(step, 0);
            break;
        default:
            break;
    }
};

},{}],6:[function(require,module,exports){
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

},{"./avatar":2,"./point":5,"@quenk/potoo/lib/actor/resident":24}],7:[function(require,module,exports){
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

},{"@quenk/potoo/lib/actor/resident":24}],8:[function(require,module,exports){
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

},{"./engine/sound":7,"@quenk/potoo/lib/actor/resident":24}],9:[function(require,module,exports){
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
var log_1 = require("./log");
/**
 * Grid class
 *
 * A grid is an array of contingous blocks drawn to a canvas.
 *
 * @property xblocks - The number of blocks the grid has on its x axis.
 * @property yblocks - The number of blocks the grid has on its y access.
 */
var Grid = /** @class */ (function () {
    function Grid(xblocks, yblocks, canvas) {
        this.xblocks = xblocks;
        this.yblocks = yblocks;
        this.canvas = canvas;
    }
    Object.defineProperty(Grid.prototype, "blockWidth", {
        /**
         * blockWidth is the number of pixels used for a block's height.
         */
        get: function () {
            return this.canvas.width / this.xblocks;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "blockHeight", {
        /**
         * blockHeight is the number of pixles used for a block's height.
         */
        get: function () {
            return this.blockWidth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "xpixels", {
        /**
         *xpixels returns the number of pixels per row in the grid.
         */
        get: function () {
            return this.xblocks * this.blockWidth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "ypixels", {
        /**
          *ypixels returns the number of pixels per column in the grid.
          */
        get: function () {
            return this.yblocks * this.blockHeight;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * getRegion constructs a Region using the provided cordinates
     * and optional offsets.
     */
    Grid.prototype.getRegion = function (x, y, rows, columns) {
        if (rows === void 0) { rows = 1; }
        if (columns === void 0) { columns = 1; }
        return new Region(x, y, rows, columns, exports.blocks(this, x, y, rows, columns));
    };
    /**
     * drawBlock a single block on the canvas at the specified location.
     */
    Grid.prototype.drawBlock = function (x, y) {
        var c = this.canvas.getContext('2d');
        var actualX = roundUp(x, 1);
        var actualY = roundUp(y, 1);
        log_1.Logger.info("Grid: drawing new square at (x,y): " + actualX + ", " + actualY);
        c.fillStyle = '#00000';
        c.fillRect(x, y, this.blockWidth, this.blockHeight);
        return this;
    };
    /**
     * eraseBlock a single block at the specified location.
     */
    Grid.prototype.eraseBlock = function (x, y) {
        var c = this.canvas.getContext('2d');
        var actualX = roundUp(x, 1);
        var actualY = roundUp(y, 1);
        log_1.Logger.info("Grid: removing square at (x,y): " + actualX + ", " + actualY);
        c.clearRect(actualX, actualY, this.blockWidth, this.blockHeight);
        return this;
    };
    /**
     * checkBlock to see if it falls within the grid's range.
     */
    Grid.prototype.checkBlock = function (x, y) {
        if ((x < 1) || (y < 1))
            return false;
        else if ((x > this.xpixels) || (y > this.ypixels))
            return false;
        return true;
    };
    return Grid;
}());
exports.Grid = Grid;
/**
 * Block within the Grid system.
 *
 * This class allows a block to be manipulated as well as tracks
 * the state of the Block.
 */
var Block = /** @class */ (function () {
    function Block(x, y, grid) {
        this.x = x;
        this.y = y;
        this.grid = grid;
        /**
         * isVisible indicates whether the block is currently drawn or not.
         */
        this.isVisible = false;
    }
    Block.prototype.draw = function () {
        this.grid.drawBlock(this.x, this.y);
        this.isVisible = true;
        return this;
    };
    Block.prototype.erase = function () {
        this.grid.eraseBlock(this.x, this.y);
        this.isVisible = false;
        return this;
    };
    Block.prototype.move = function (x, y) {
        this.x = this.x + x;
        this.y = this.y + y;
        return this;
    };
    Block.prototype.check = function () {
        return this.grid.checkBlock(this.x, this.y);
    };
    return Block;
}());
exports.Block = Block;
/**
 * Sample represents a non-contigous collection of blocks.
 */
var Sample = /** @class */ (function () {
    function Sample(blocks) {
        this.blocks = blocks;
    }
    Sample.prototype.draw = function () {
        this.blocks.forEach(function (b) { return b.draw(); });
        return this;
    };
    Sample.prototype.erase = function () {
        this.blocks.forEach(function (b) { return b.erase(); });
        return this;
    };
    Sample.prototype.move = function (x, y) {
        this.blocks.forEach(function (b) { return b.move(x, y); });
        return this;
    };
    Sample.prototype.check = function () {
        return this.blocks.every(function (b) { return b.check(); });
    };
    /**
     * blockAt provides a block given its index.
     *
     * XXX: make this safe!
     */
    Sample.prototype.blockAt = function (n) {
        return this.blocks[n];
    };
    return Sample;
}());
exports.Sample = Sample;
/**
 * Region represents a collection of one or more blocks.
 *
 * This class allows for multiple blocks to be manipulated
 * via one class.
 */
var Region = /** @class */ (function (_super) {
    __extends(Region, _super);
    function Region(x, y, rows, columns, blocks) {
        var _this = _super.call(this, blocks) || this;
        _this.x = x;
        _this.y = y;
        _this.rows = rows;
        _this.columns = columns;
        _this.blocks = blocks;
        return _this;
    }
    /**
     * reduce the blocks of this Region to a single value.
     */
    Region.prototype.reduce = function (init, f) {
        return this.blocks.reduce(f, init);
    };
    /**
     * select a non-contingous range of blocks from this Region.
     *
     * Selection is based on left to right indicies of each Block.
     * If any indicies are invalid, they are ignored for now.
     */
    Region.prototype.select = function (idx) {
        var _this = this;
        return new Sample(idx.map(function (i) { return _this.blocks[i]; }).filter(function (b, i) {
            if (!b)
                log_1.Logger.warn("Region#select: ignoring unknown index \"" + i + "\". " +
                    ("Known indicies: 1-" + _this.blocks.length));
            return b;
        }));
    };
    return Region;
}(Sample));
exports.Region = Region;
var roundUp = function (n, to) {
    return n === 0 ? to : n;
};
/**
 * blocks calculates all the Blocks included in a region.
 */
exports.blocks = function (grid, originX, originY, rows, columns) {
    var list = [new Block(originX, originY, grid)];
    var xOffset = 1;
    var yOffset = 1;
    //first row
    while (xOffset < columns) {
        list.push(new Block(originX + (xOffset * grid.blockWidth), originY, grid));
        xOffset++;
    }
    //others
    while (yOffset < rows) {
        var actualY = originY + (yOffset * grid.blockHeight);
        xOffset = 1;
        list.push(new Block(originX, actualY, grid));
        while (xOffset < columns) {
            var actualX = originX + (xOffset * grid.blockWidth);
            list.push(new Block(actualX, actualY, grid));
            xOffset++;
        }
        yOffset++;
    }
    return list;
};

},{"./log":10}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var potoo_1 = require("@quenk/potoo");
var grid_1 = require("./grid");
var engine_1 = require("./game/engine");
var controller_1 = require("./game/controller");
var sounds_1 = require("./game/sounds");
var s = potoo_1.system({ log: { level: 8 } });
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

},{"./game/controller":1,"./game/engine":4,"./game/sounds":8,"./grid":9,"@quenk/potoo":44}],12:[function(require,module,exports){
"use strict";
/**
 * This module provides functions and types to make dealing with ES errors
 * easier.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/** imports */
var either_1 = require("../data/either");
/**
 * convert an Err to an Error.
 */
exports.convert = function (e) {
    return (e instanceof Error) ? e : new Error(e.message);
};
/**
 * raise the supplied Error.
 *
 * This function exists to maintain a functional style in situations where
 * you may actually want to throw an error.
 */
exports.raise = function (e) {
    if (e instanceof Error) {
        throw e;
    }
    else {
        throw new Error(e.message);
    }
};
/**
 * attempt a synchronous computation that may throw an exception.
 */
exports.attempt = function (f) {
    try {
        return either_1.right(f());
    }
    catch (e) {
        return either_1.left(e);
    }
};

},{"../data/either":16}],13:[function(require,module,exports){
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
var timer_1 = require("../timer");
var function_1 = require("../../data/function");
var error_1 = require("../error");
var Future = /** @class */ (function () {
    function Future() {
    }
    Future.prototype.of = function (a) {
        return new Pure(a);
    };
    Future.prototype.map = function (f) {
        return new Bind(this, function (value) { return new Pure(f(value)); });
    };
    Future.prototype.ap = function (ft) {
        return new Bind(this, function (value) { return ft.map(function (f) { return f(value); }); });
    };
    Future.prototype.chain = function (f) {
        return new Bind(this, f);
    };
    Future.prototype.catch = function (f) {
        return new Catch(this, f);
    };
    Future.prototype.finally = function (f) {
        return new Finally(this, f);
    };
    Future.prototype.fork = function (onError, onSuccess) {
        var c = new Compute(undefined, onError, onSuccess, [this], [], []);
        c.run();
        return c;
    };
    return Future;
}());
exports.Future = Future;
/**
 * Pure constructor.
 */
var Pure = /** @class */ (function (_super) {
    __extends(Pure, _super);
    function Pure(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Pure.prototype.map = function (f) {
        return new Pure(f(this.value));
    };
    Pure.prototype.ap = function (ft) {
        var _this = this;
        return ft.map(function (f) { return f(_this.value); });
    };
    return Pure;
}(Future));
exports.Pure = Pure;
/**
 * Raise constructor.
 */
var Raise = /** @class */ (function (_super) {
    __extends(Raise, _super);
    function Raise(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Raise.prototype.map = function (_) {
        return new Raise(this.value);
    };
    Raise.prototype.ap = function (_) {
        return new Raise(this.value);
    };
    Raise.prototype.chain = function (_) {
        return new Raise(this.value);
    };
    return Raise;
}(Future));
exports.Raise = Raise;
/**
 * Bind constructor.
 * @private
 */
var Bind = /** @class */ (function (_super) {
    __extends(Bind, _super);
    function Bind(future, func) {
        var _this = _super.call(this) || this;
        _this.future = future;
        _this.func = func;
        return _this;
    }
    return Bind;
}(Future));
exports.Bind = Bind;
/**
 * Step constructor.
 * @private
 */
var Step = /** @class */ (function (_super) {
    __extends(Step, _super);
    function Step(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    return Step;
}(Future));
exports.Step = Step;
/**
 * Catch constructor.
 * @private
 */
var Catch = /** @class */ (function (_super) {
    __extends(Catch, _super);
    function Catch(future, func) {
        var _this = _super.call(this) || this;
        _this.future = future;
        _this.func = func;
        return _this;
    }
    return Catch;
}(Future));
exports.Catch = Catch;
/**
 * Finally constructor.
 * @private
 */
var Finally = /** @class */ (function (_super) {
    __extends(Finally, _super);
    function Finally(future, func) {
        var _this = _super.call(this) || this;
        _this.future = future;
        _this.func = func;
        return _this;
    }
    return Finally;
}(Future));
exports.Finally = Finally;
/**
 * Run constructor.
 * @private
 */
var Run = /** @class */ (function (_super) {
    __extends(Run, _super);
    function Run(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    return Run;
}(Future));
exports.Run = Run;
/**
 * Compute represents the workload of a forked Future.
 *
 * Results are computed sequentially and ends with either a value,
 * error or prematurely via the abort method.
 */
var Compute = /** @class */ (function () {
    function Compute(value, exitError, exitSuccess, stack, handlers, finalizers) {
        this.value = value;
        this.exitError = exitError;
        this.exitSuccess = exitSuccess;
        this.stack = stack;
        this.handlers = handlers;
        this.finalizers = finalizers;
        this.canceller = function_1.noop;
        this.running = false;
    }
    /**
     * onError handler.
     *
     * This method will a 'Raise' instruction at the top of the stack
     * and continue execution.
     */
    Compute.prototype.onError = function (e) {
        if (this.running === false)
            return;
        this.stack.push(new Raise(e));
        this.running = false;
        this.run();
    };
    /**
     * onSuccess handler.
     *
     * Stores the resulting value and continues the execution.
     */
    Compute.prototype.onSuccess = function (value) {
        if (this.running === false)
            return;
        this.value = value;
        this.running = false;
        this.run();
    };
    /**
     * abort this Compute.
     *
     * Aborting a Compute will immediately clear its stack
     * and invoke the canceller for the currently executing Future.
     */
    Compute.prototype.abort = function () {
        this.stack = [];
        this.exitError = function_1.noop;
        this.exitSuccess = function_1.noop;
        this.running = false;
        this.canceller();
        this.canceller = function_1.noop;
    };
    /**
     * run this Compute.
     */
    Compute.prototype.run = function () {
        while (this.stack.length > 0) {
            var next = this.stack.pop();
            if (next instanceof Pure) {
                this.value = next.value;
            }
            else if (next instanceof Bind) {
                this.stack.push(new Step(next.func));
                this.stack.push(next.future);
            }
            else if (next instanceof Step) {
                this.stack.push(next.value(this.value));
            }
            else if (next instanceof Catch) {
                this.handlers.push(next.func);
                this.stack.push(next.future);
            }
            else if (next instanceof Finally) {
                this.finalizers.push(next.func);
                this.stack.push(new Step(next.func));
                this.stack.push(next.future);
            }
            else if (next instanceof Raise) {
                this.stack = []; //clear the stack;
                if (this.finalizers.length > 0)
                    this.stack.push(new Step(this.finalizers.pop()));
                if (this.handlers.length > 0)
                    this.stack.push(this.handlers.pop()(error_1.convert(next.value)));
                if (this.stack.length === 0)
                    return this.exitError(error_1.convert(next.value)); //end on unhandled error
            }
            else if (next instanceof Run) {
                this.running = true;
                this.canceller = next.value(this);
                return; //short-circuit and continue in a new call-stack
            }
        }
        this.running = false;
        this.exitSuccess(this.value);
    };
    return Compute;
}());
exports.Compute = Compute;
/**
 * pure wraps a synchronous value in a Future.
 */
exports.pure = function (a) { return new Pure(a); };
/**
 * raise wraps an Error in a Future.
 *
 * This future will be considered a failure.
 */
exports.raise = function (e) { return new Raise(e); };
/**
 * attempt a syncronous task, trapping any thrown errors in the Future.
 */
exports.attempt = function (f) { return new Run(function (s) {
    timer_1.tick(function () { try {
        s.onSuccess(f());
    }
    catch (e) {
        s.onError(e);
    } });
    return function_1.noop;
}); };
/**
 * delay a task by running it in the "next tick" without attempting
 * to trap any thrown errors.
 */
exports.delay = function (f) { return new Run(function (s) {
    timer_1.tick(function () { return s.onSuccess(f()); });
    return function_1.noop;
}); };
/**
 * fromAbortable takes an Aborter and a node style async function and
 * produces a Future.
 *
 * Note: The function used here is not called in the "next tick".
 */
exports.fromAbortable = function (abort) { return function (f) { return new Run(function (s) {
    f(function (err, a) { return (err != null) ? s.onError(err) : s.onSuccess(a); });
    return abort;
}); }; };
/**
 * fromCallback produces a Future from a node style async function.
 *
 * Note: The function used here is not called in the "next tick".
 */
exports.fromCallback = function (f) { return exports.fromAbortable(function_1.noop)(f); };
var Tag = /** @class */ (function () {
    function Tag(index, value) {
        this.index = index;
        this.value = value;
    }
    return Tag;
}());
/**
 * parallel runs a list of Futures in parallel failing if any
 * fail and succeeding with a list of successful values.
 */
exports.parallel = function (list) { return new Run(function (s) {
    var done = [];
    var comps = list.reduce(function (p, f, index) {
        p.push(f
            .map(function (value) { return new Tag(index, value); })
            .fork(function (e) { abortAll(p); s.onError(e); }, function (t) {
            done.push(t);
            if (done.length === list.length)
                s.onSuccess(done.sort(function (a, b) { return a.index - b.index; })
                    .map(function (t) { return t.value; }));
        }));
        return p;
    }, []);
    if (comps.length === 0)
        s.onSuccess([]);
    return function () { abortAll(comps); };
}); };
/**
 * race given a list of Futures, will return a Future that is settled by
 * the first error or success to occur.
 */
exports.race = function (list) { return new Run(function (s) {
    var comps = list
        .reduce(function (p, f, index) {
        p.push(f
            .map(function (value) { return new Tag(index, value); })
            .fork(function (e) { abortAll(p); s.onError(e); }, function (t) { abortExcept(p, t.index); s.onSuccess(t.value); }));
        return p;
    }, []);
    if (comps.length === 0)
        s.onError(new Error("race(): Cannot race an empty list!"));
    return function () { abortAll(comps); };
}); };
var abortAll = function (comps) { return timer_1.tick(function () { return comps.map(function (c) { return c.abort(); }); }); };
var abortExcept = function (comps, index) {
    return timer_1.tick(function () { return comps.map(function (c, i) { return (i !== index) ? c.abort() : undefined; }); });
};
/**
 * toPromise transforms a Future into a Promise.
 *
 * This function depends on the global promise constructor and
 * will fail if the enviornment does not provide one.
 */
exports.toPromise = function (ft) { return new Promise(function (yes, no) {
    return ft.fork(no, yes);
}); };
/**
 * fromExcept converts an Except to a Future.
 */
exports.fromExcept = function (e) {
    return e.fold(function (e) { return exports.raise(e); }, function (a) { return exports.pure(a); });
};

},{"../../data/function":17,"../error":12,"../timer":14}],14:[function(require,module,exports){
(function (process){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * tick runs a function in the "next tick" using process.nextTick in node
 * or setTimeout(f, 0) elsewhere.
 */
exports.tick = function (f) { return (typeof window == 'undefined') ?
    setTimeout(f, 0) :
    process.nextTick(f); };

}).call(this,require('_process'))

},{"_process":45}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The array module provides helper functions
 * for working with JS arrays.
 */
var record_1 = require("./record");
/**
 * head returns the item at index 0 of an array
 */
exports.head = function (list) { return list[0]; };
/**
 * tail returns the last item in an array
 */
exports.tail = function (list) { return list[list.length - 1]; };
/**
 * empty indicates whether an array is empty or not.
 */
exports.empty = function (list) { return (list.length === 0); };
/**
 * contains indicates whether an element exists in an array.
 */
exports.contains = function (list) { return function (a) { return (list.indexOf(a) > -1); }; };
/**
 * map is a curried version of the Array#map method.
 */
exports.map = function (list) { return function (f) { return list.map(f); }; };
/**
 * concat concatenates an element to an array without destructuring
 * the element if itself is an array.
 */
exports.concat = function (list) { return function (a) { return list.concat([a]); }; };
/**
 * partition an array into two using a partitioning function.
 *
 * The first array contains values that return true and the second false.
 */
exports.partition = function (list) { return function (f) { return exports.empty(list) ?
    [[], []] :
    list.reduce(function (_a, c, i) {
        var yes = _a[0], no = _a[1];
        return (f(c, i, list) ?
            [exports.concat(yes)(c), no] :
            [yes, exports.concat(no)(c)]);
    }, [[], []]); }; };
/**
 * group the properties of a Record into another Record using a grouping
 * function.
 */
exports.group = function (list) { return function (f) {
    return list.reduce(function (p, c, i) {
        var _a;
        var g = f(c, i, list);
        return record_1.merge(p, (_a = {},
            _a[g] = Array.isArray(p[g]) ?
                exports.concat(p[g])(c) : [c],
            _a));
    }, {});
}; };

},{"./record":19}],16:[function(require,module,exports){
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
var maybe_1 = require("./maybe");
/**
 * Either represents a value that may be one of two types.
 *
 * An Either is either a Left or Right. Mapping and related functions over the
 * Left side returns the value unchanged. When the value is Right
 * functions are applied as normal.
 *
 * The Either concept is often used to accomodate error handling but there
 * are other places it may come in handy.
 */
var Either = /** @class */ (function () {
    function Either() {
    }
    Either.prototype.of = function (value) {
        return new Right(value);
    };
    return Either;
}());
exports.Either = Either;
/**
 * Left side of the Either implementation.
 */
var Left = /** @class */ (function (_super) {
    __extends(Left, _super);
    function Left(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Left.prototype.map = function (_) {
        return new Left(this.value);
    };
    Left.prototype.lmap = function (f) {
        return new Left(f(this.value));
    };
    Left.prototype.bimap = function (f, _) {
        return new Left(f(this.value));
    };
    Left.prototype.alt = function (a) {
        return a;
    };
    Left.prototype.chain = function (_) {
        return new Left(this.value);
    };
    Left.prototype.ap = function (_) {
        return new Left(this.value);
    };
    Left.prototype.extend = function (_) {
        return new Left(this.value);
    };
    Left.prototype.fold = function (f, _) {
        return f(this.value);
    };
    Left.prototype.eq = function (m) {
        return ((m instanceof Left) && (m.value === this.value));
    };
    Left.prototype.orElse = function (f) {
        return f(this.value);
    };
    Left.prototype.orRight = function (f) {
        return new Right(f(this.value));
    };
    Left.prototype.takeLeft = function () {
        return this.value;
    };
    Left.prototype.takeRight = function () {
        throw new TypeError("Not right!");
    };
    Left.prototype.toMaybe = function () {
        return maybe_1.nothing();
    };
    return Left;
}(Either));
exports.Left = Left;
/**
 * Right side implementation.
 */
var Right = /** @class */ (function (_super) {
    __extends(Right, _super);
    function Right(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Right.prototype.map = function (f) {
        return new Right(f(this.value));
    };
    Right.prototype.lmap = function (_) {
        return new Right(this.value);
    };
    Right.prototype.bimap = function (_, g) {
        return new Right(g(this.value));
    };
    Right.prototype.alt = function (_) {
        return this;
    };
    Right.prototype.chain = function (f) {
        return f(this.value);
    };
    Right.prototype.ap = function (e) {
        var _this = this;
        return e.map(function (f) { return f(_this.value); });
    };
    Right.prototype.extend = function (f) {
        return new Right(f(this));
    };
    Right.prototype.eq = function (m) {
        return ((m instanceof Right) && (m.value === this.value));
    };
    Right.prototype.fold = function (_, g) {
        return g(this.value);
    };
    Right.prototype.orElse = function (_) {
        return this;
    };
    Right.prototype.orRight = function (_) {
        return this;
    };
    Right.prototype.takeLeft = function () {
        throw new TypeError("Not left!");
    };
    Right.prototype.takeRight = function () {
        return this.value;
    };
    Right.prototype.toMaybe = function () {
        return maybe_1.just(this.value);
    };
    return Right;
}(Either));
exports.Right = Right;
/**
 * left constructor helper.
 */
exports.left = function (a) { return new Left(a); };
/**
 * right constructor helper.
 */
exports.right = function (b) { return new Right(b); };
/**
 * fromBoolean constructs an Either using a boolean value.
 */
exports.fromBoolean = function (b) {
    return b ? exports.right(true) : exports.left(false);
};
/**
 * either given two functions, first for Left, second for Right, will return
 * the result of applying the appropriate function to an Either's internal value.
 */
exports.either = function (f) { return function (g) { return function (e) {
    return (e instanceof Right) ? g(e.takeRight()) : f(e.takeLeft());
}; }; };

},{"./maybe":18}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * compose two functions into one.
 */
exports.compose = function (f, g) { return function (a) { return g(f(a)); }; };
/**
 * compose3 functions into one.
 */
exports.compose3 = function (f, g, h) { return function (a) { return h(g(f(a))); }; };
/**
 * compose4 functions into one.
 */
exports.compose4 = function (f, g, h, i) {
    return function (a) { return i(h(g(f(a)))); };
};
/**
 * compose5 functions into one.
 */
exports.compose5 = function (f, g, h, i, j) { return function (a) { return j(i(h(g(f(a))))); }; };
/**
 * cons given two values, ignore the second and always return the first.
 */
exports.cons = function (a) { return function (_) { return a; }; };
/**
 * flip the order of arguments to a curried function that takes 2 arguments.
 */
exports.flip = function (f) { return function (b) { return function (a) { return (f(a)(b)); }; }; };
/**
 * identity function.
 */
exports.identity = function (a) { return a; };
exports.id = exports.identity;
/**
 * curry an ES function that accepts 2 parameters.
 */
exports.curry = function (f) { return function (a) { return function (b) { return f(a, b); }; }; };
/**
 * curry3 curries an ES function that accepts 3 parameters.
 */
exports.curry3 = function (f) { return function (a) { return function (b) { return function (c) { return f(a, b, c); }; }; }; };
/**
 * curry4 curries an ES function that accepts 4 parameters.
 */
exports.curry4 = function (f) {
    return function (a) { return function (b) { return function (c) { return function (d) { return f(a, b, c, d); }; }; }; };
};
/**
 * curry5 curries an ES function that accepts 5 parameters.
 */
exports.curry5 = function (f) {
    return function (a) { return function (b) { return function (c) { return function (d) { return function (e) { return f(a, b, c, d, e); }; }; }; }; };
};
/**
 * noop function
 */
exports.noop = function () { };

},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Nothing represents the absence of a usable value.
 */
var Nothing = /** @class */ (function () {
    function Nothing() {
    }
    /**
     * map simply returns a Nothing<A>
     */
    Nothing.prototype.map = function (_) {
        return new Nothing();
    };
    /**
     * ap allows for a function wrapped in a Just to apply
     * to value present in this Just.
     */
    Nothing.prototype.ap = function (_) {
        return new Nothing();
    };
    /**
     * of wraps a value in a Just.
     */
    Nothing.prototype.of = function (a) {
        return new Just(a);
    };
    /**
     * chain simply returns a Nothing<A>.
     */
    Nothing.prototype.chain = function (_) {
        return new Nothing();
    };
    /**
     * alt will prefer whatever Maybe instance provided.
     */
    Nothing.prototype.alt = function (a) {
        return a;
    };
    /**
     * empty provides a default Maybe.
     * Maybe.empty() = new Nothing()
     */
    Nothing.prototype.empty = function () {
        return new Nothing();
    };
    /**
     * extend returns a Nothing<A>.
     */
    Nothing.prototype.extend = function (_) {
        return new Nothing();
    };
    /**
     * eq returns true if compared to another Nothing instance.
     */
    Nothing.prototype.eq = function (m) {
        return m instanceof Nothing;
    };
    /**
     * orJust converts a Nothing<A> to a Just
     * using the value from the provided function.
     */
    Nothing.prototype.orJust = function (f) {
        return new Just(f());
    };
    /**
     * orElse allows an alternative Maybe value
     * to be provided since this one is Nothing<A>.
     */
    Nothing.prototype.orElse = function (f) {
        return f();
    };
    /**
     * get throws an error because there
     * is nothing here to get.
     */
    Nothing.prototype.get = function () {
        throw new TypeError('Cannot get a value from Nothing!');
    };
    return Nothing;
}());
exports.Nothing = Nothing;
/**
 * Just represents the presence of a usable value.
 */
var Just = /** @class */ (function () {
    function Just(value) {
        this.value = value;
    }
    /**
     * map over the value present in the Just.
     */
    Just.prototype.map = function (f) {
        return new Just(f(this.value));
    };
    /**
     * ap allows for a function wrapped in a Just to apply
     * to value present in this Just.
     */
    Just.prototype.ap = function (mb) {
        var _this = this;
        return mb.map(function (f) { return f(_this.value); });
    };
    /**
     * of wraps a value in a Just.
     */
    Just.prototype.of = function (a) {
        return new Just(a);
    };
    /**
     * chain allows the sequencing of functions that return a Maybe.
     */
    Just.prototype.chain = function (f) {
        return f(this.value);
    };
    /**
     * alt will prefer the first Just encountered (this).
     */
    Just.prototype.alt = function (_) {
        return this;
    };
    /**
     * empty provides a default Maybe.
     * Maybe.empty() = new Nothing()
     */
    Just.prototype.empty = function () {
        return new Nothing();
    };
    /**
     * extend allows sequencing of Maybes with
     * functions that unwrap into non Maybe types.
     */
    Just.prototype.extend = function (f) {
        return new Just(f(this));
    };
    /**
     * eq tests the value of two Justs.
     */
    Just.prototype.eq = function (m) {
        return ((m instanceof Just) && (m.value === this.value));
    };
    /**
     * orJust returns this Just.
     */
    Just.prototype.orJust = function (_) {
        return this;
    };
    /**
     * orElse returns this Just
     */
    Just.prototype.orElse = function (_) {
        return this;
    };
    /**
     * get the value of this Just.
     */
    Just.prototype.get = function () {
        return this.value;
    };
    return Just;
}());
exports.Just = Just;
/**
 * of
 */
exports.of = function (a) { return new Just(a); };
/**
 * nothing convenience constructor
 */
exports.nothing = function () { return new Nothing(); };
/**
 * just convenience constructor
 */
exports.just = function (a) { return new Just(a); };
/**
 * fromNullable constructs a Maybe from a value that may be null.
 */
exports.fromNullable = function (a) { return a == null ?
    new Nothing() : new Just(a); };
/**
 * fromArray checks an array to see if it's empty
 *
 * Returns [[Nothing]] if it is, [[Just]] otherwise.
 */
exports.fromArray = function (a) {
    return (a.length === 0) ? new Nothing() : new Just(a);
};
/**
 * fromObject uses Object.keys to turn see if an object
 * has any own properties.
 */
exports.fromObject = function (o) {
    return Object.keys(o).length === 0 ? new Nothing() : new Just(o);
};
/**
 * fromString constructs Nothing<A> if the string is empty or Just<A> otherwise.
 */
exports.fromString = function (s) {
    return (s === '') ? new Nothing() : new Just(s);
};
/**
 * fromBoolean constructs Nothing if b is false, Just<A> otherwise
 */
exports.fromBoolean = function (b) {
    return (b === false) ? new Nothing() : new Just(b);
};
/**
 * fromNumber constructs Nothing if n is 0 Just<A> otherwise.
 */
exports.fromNumber = function (n) {
    return (n === 0) ? new Nothing() : new Just(n);
};
/**
 * fromNaN constructs Nothing if a value is not a number or
 * Just<A> otherwise.
 */
exports.fromNaN = function (n) {
    return isNaN(n) ? new Nothing() : new Just(n);
};

},{}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The record module provides functions for treating ES objects as records.
 *
 * Some of the functions provided here are inherently unsafe (tsc will not
 * be able track integrity and may result in runtime errors if not used carefully.
 */
var type_1 = require("../data/type");
var array_1 = require("./array");
/**
 * isRecord tests whether a value is a record.
 *
 * This is a typeof check that excludes arrays.
 *
 * Unsafe.
 */
exports.isRecord = function (value) {
    return (typeof value === 'object') && (!Array.isArray(value));
};
/**
 * keys produces a list of property names from a Record.
 */
exports.keys = function (value) { return Object.keys(value); };
/**
 * map over a Record's properties producing a new record.
 *
 * The order of keys processed is not guaranteed.
 */
exports.map = function (o, f) {
    return exports.keys(o).reduce(function (p, k) {
        var _a;
        return exports.merge(p, (_a = {}, _a[k] = f(o[k], k, o), _a));
    }, {});
};
/**
 * reduce a Record's keys to a single value.
 *
 * The initial value (accum) must be supplied to avoid errors when
 * there are no properites on the Record.
 * The order of keys processed is not guaranteed.
 */
exports.reduce = function (o, accum, f) {
    return exports.keys(o).reduce(function (p, k) { return f(p, o[k], k); }, accum);
};
/**
 * merge two objects into one.
 *
 * The return value's type is the product of the two types supplied.
 * This function may be unsafe.
 */
exports.merge = function (left, right) { return Object.assign({}, left, right); };
/**
 * merge3 merges 3 records into one.
 */
exports.merge3 = function (r, s, t) { return Object.assign({}, r, s, t); };
/**
 * merge4 merges 4 records into one.
 */
exports.merge4 = function (r, s, t, u) { return Object.assign({}, r, s, t, u); };
/**
 * merge5 merges 5 records into one.
 */
exports.merge5 = function (r, s, t, u, v) {
    return Object.assign({}, r, s, t, u, v);
};
/**
 * rmerge merges 2 records recursively.
 *
 * This function may be unsafe.
 */
exports.rmerge = function (left, right) {
    return exports.reduce(right, left, deepMerge);
};
/**
 * rmerge3 merges 3 records recursively.
 */
exports.rmerge3 = function (r, s, t) {
    return [s, t]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
/**
 * rmerge4 merges 4 records recursively.
 */
exports.rmerge4 = function (r, s, t, u) {
    return [s, t, u]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
/**
 * rmerge5 merges 5 records recursively.
 */
exports.rmerge5 = function (r, s, t, u, v) {
    return [s, t, u, v]
        .reduce(function (p, c) {
        return exports.reduce(c, (p), deepMerge);
    }, r);
};
var deepMerge = function (pre, curr, key) {
    var _a, _b;
    return exports.isRecord(curr) ?
        exports.merge(pre, (_a = {},
            _a[key] = exports.isRecord(pre[key]) ?
                exports.rmerge(pre[key], curr) :
                curr,
            _a)) :
        exports.merge(pre, (_b = {}, _b[key] = curr, _b));
};
/**
 * exclude removes the specified properties from a Record.
 */
exports.exclude = function (o, keys) {
    var list = Array.isArray(keys) ? keys : [keys];
    return exports.reduce(o, {}, function (p, c, k) {
        var _a;
        return list.indexOf(k) > -1 ? p : exports.merge(p, (_a = {}, _a[k] = c, _a));
    });
};
/**
 * flatten an object into a map of key value pairs.
 *
 * The keys are the paths on the objects where the value would have been
 * found.
 *
 * Note: This function does not give special treatment to properties
 * with dots in them.
 */
exports.flatten = function (r) {
    return (flatImpl('')({})(r));
};
var flatImpl = function (pfix) { return function (prev) { return function (r) {
    return exports.reduce(r, prev, function (p, c, k) {
        var _a;
        return type_1.isObject(c) ?
            (flatImpl(prefix(pfix, k))(p)(c)) :
            exports.merge(p, (_a = {}, _a[prefix(pfix, k)] = c, _a));
    });
}; }; };
var prefix = function (pfix, key) { return (pfix === '') ?
    key : pfix + "." + key; };
/**
 * partition a Record into two sub-records using a separating function.
 *
 * This function produces an array where the first element is a record
 * of passing values and the second the failing values.
 */
exports.partition = function (r) { return function (f) {
    return exports.reduce(r, [{}, {}], function (_a, c, k) {
        var yes = _a[0], no = _a[1];
        var _b, _c;
        return f(c, k, r) ?
            [exports.merge(yes, (_b = {}, _b[k] = c, _b)), no] :
            [yes, exports.merge(no, (_c = {}, _c[k] = c, _c))];
    });
}; };
/**
 * group the properties of a Record into another Record using a grouping
 * function.
 */
exports.group = function (r) { return function (f) {
    return exports.reduce(r, {}, function (p, c, k) {
        var _a, _b, _c;
        var g = f(c, k, r);
        return exports.merge(p, (_a = {},
            _a[g] = exports.isRecord(p[g]) ?
                exports.merge(p[g], (_b = {}, _b[k] = c, _b)) : (_c = {}, _c[k] = c, _c),
            _a));
    });
}; };
/**
 * values returns a shallow array of the values of a record.
 */
exports.values = function (r) {
    return exports.reduce(r, [], function (p, c) { return array_1.concat(p)(c); });
};
/**
 * contains indicates whether a Record has a given key.
 */
exports.contains = function (r, key) {
    return Object.hasOwnProperty.call(r, key);
};

},{"../data/type":21,"./array":15}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * startsWith polyfill.
 */
exports.startsWith = function (str, search, pos) {
    if (pos === void 0) { pos = 0; }
    return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
};
/**
 * endsWith polyfill.
 */
exports.endsWith = function (str, search, this_len) {
    if (this_len === void 0) { this_len = str.length; }
    return (this_len === undefined || this_len > str.length) ?
        this_len = str.length :
        str.substring(this_len - search.length, this_len) === search;
};
/**
 * contains uses String#indexOf to determine if a substring occurs
 * in a string.
 */
exports.contains = function (str, match) { return (str.indexOf(match) > -1); };

},{}],21:[function(require,module,exports){
"use strict";
/**
 * test provides basic type tests common when working with ECMAScript.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var prims = ['string', 'number', 'boolean'];
/**
 * Any is a class used to represent typescript's "any" type.
 */
var Any = /** @class */ (function () {
    function Any() {
    }
    return Any;
}());
exports.Any = Any;
/**
 * isObject test.
 *
 * Does not consider an Array an object.
 */
exports.isObject = function (value) {
    return (typeof value === 'object') && (!exports.isArray(value));
};
/**
 * isArray test.
 */
exports.isArray = Array.isArray;
/**
 * isString test.
 */
exports.isString = function (value) { return typeof value === 'string'; };
/**
 * isNumber test.
 */
exports.isNumber = function (value) {
    return (typeof value === 'number') && (!isNaN(value));
};
/**
 * isBoolean test.
 */
exports.isBoolean = function (value) { return typeof value === 'boolean'; };
/**
 * isFunction test.
 */
exports.isFunction = function (value) { return typeof value === 'function'; };
/**
 * isPrim test.
 */
exports.isPrim = function (value) {
    return !(exports.isObject(value) ||
        exports.isArray(value) ||
        exports.isFunction(value));
};
/**
 * is performs a typeof of check on a type.
 */
exports.is = function (expected) { return function (value) { return typeof (value) === expected; }; };
/**
 * test whether a value conforms to some pattern.
 *
 * This function is made available mainly for a crude pattern matching
 * machinery that works as followss:
 * string   -> Matches on the value of the string.
 * number   -> Matches on the value of the number.
 * boolean  -> Matches on the value of the boolean.
 * object   -> Each key of the object is matched on the value, all must match.
 * function -> Treated as a constructor and results in an instanceof check or
 *             for String,Number and Boolean, this uses the typeof check. If
 *             the function is RegExp then we uses the RegExp.test function
 *             instead.
 */
exports.test = function (value, t) {
    return ((prims.indexOf(typeof t) > -1) && (value === t)) ?
        true :
        ((typeof t === 'function') &&
            (((t === String) && (typeof value === 'string')) ||
                ((t === Number) && (typeof value === 'number')) ||
                ((t === Boolean) && (typeof value === 'boolean')) ||
                ((t === Array) && (Array.isArray(value))) ||
                (t === Any) ||
                (value instanceof t))) ?
            true :
            ((t instanceof RegExp) && ((typeof value === 'string') && t.test(value))) ?
                true :
                ((typeof t === 'object') && (typeof value === 'object')) ?
                    Object
                        .keys(t)
                        .every(function (k) { return value.hasOwnProperty(k) ?
                        exports.test(value[k], t[k]) : false; }) :
                    false;
};
/**
 * show the type of a value.
 *
 * Note: This may crash if the value is an
 * object literal with recursive references.
 */
exports.show = function (value) {
    if (typeof value === 'object') {
        if (Array.isArray(value))
            return "[" + value.map(exports.show) + "]";
        else if (value.constructor !== Object)
            return (value.constructor.name || value.constructor);
        else
            return JSON.stringify(value);
    }
    else {
        return '' + value;
    }
};

},{}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var array_1 = require("@quenk/noni/lib/data/array");
exports.SEPERATOR = '/';
exports.ADDRESS_DISCARD = '?';
exports.ADDRESS_SYSTEM = '$';
exports.ADDRESS_EMPTY = '';
exports.ADDRESS_RESTRICTED = [
    exports.ADDRESS_DISCARD,
    exports.ADDRESS_SYSTEM,
    exports.SEPERATOR
];
/**
 * isRestricted indicates whether an actor id is restricted or not.
 */
exports.isRestricted = function (id) {
    return ((exports.ADDRESS_RESTRICTED.some(function (a) { return id.indexOf(a) > -1; })) && (id !== exports.SEPERATOR));
};
/**
 * make a child address given its id and parent address.
 */
exports.make = function (parent, id) {
    return ((parent === exports.SEPERATOR) || (parent === exports.ADDRESS_EMPTY)) ?
        "" + parent + id :
        (parent === exports.ADDRESS_SYSTEM) ?
            id :
            "" + parent + exports.SEPERATOR + id;
};
/**
 * getParent computes the parent of an Address.
 */
exports.getParent = function (addr) {
    if (((addr === exports.ADDRESS_SYSTEM) ||
        (addr === exports.ADDRESS_EMPTY) ||
        (addr === exports.ADDRESS_DISCARD) || (addr === exports.SEPERATOR))) {
        return exports.ADDRESS_SYSTEM;
    }
    else {
        var b4 = addr.split(exports.SEPERATOR);
        if ((b4.length === 2) && (b4[0] === '')) {
            return exports.SEPERATOR;
        }
        else {
            var a = b4
                .reverse()
                .slice(1)
                .reverse()
                .join(exports.SEPERATOR);
            return a === exports.ADDRESS_EMPTY ? exports.ADDRESS_SYSTEM : a;
        }
    }
};
/**
 * getId provides the id part of an actor address.
 */
exports.getId = function (addr) {
    return ((addr === exports.ADDRESS_SYSTEM) ||
        (addr === exports.ADDRESS_DISCARD) ||
        (addr === exports.ADDRESS_EMPTY) ||
        (addr === exports.SEPERATOR)) ?
        addr :
        array_1.tail(addr.split(exports.SEPERATOR));
};

},{"@quenk/noni/lib/data/array":15}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Envelope for messages.
 *
 * Used to internally keep track of message sources and destintations.
 */
var Envelope = /** @class */ (function () {
    function Envelope(to, from, message) {
        this.to = to;
        this.from = from;
        this.message = message;
    }
    return Envelope;
}());
exports.Envelope = Envelope;

},{}],24:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var type_1 = require("@quenk/noni/lib/data/type");
var either_1 = require("@quenk/noni/lib/data/either");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var function_1 = require("@quenk/noni/lib/data/function");
var address_1 = require("./address");
var spawn_1 = require("./system/op/spawn");
var tell_1 = require("./system/op/tell");
var kill_1 = require("./system/op/kill");
var drop_1 = require("./system/op/drop");
var receive_1 = require("./system/op/receive");
var system_1 = require("./system");
/**
 * Case allows for the selective matching of patterns
 * for processing messages
 */
var Case = /** @class */ (function () {
    function Case(pattern, handler) {
        this.pattern = pattern;
        this.handler = handler;
    }
    /**
     * match checks if the supplied type satisfies this Case
     */
    Case.prototype.match = function (m) {
        if (type_1.test(m, this.pattern)) {
            this.handler(m);
            return true;
        }
        else {
            return false;
        }
    };
    return Case;
}());
exports.Case = Case;
/**
 * AbstractCase is provided for situations where
 * it is better to extend the Case class instead of creating
 * new instances.
 */
var AbstractCase = /** @class */ (function (_super) {
    __extends(AbstractCase, _super);
    function AbstractCase(pattern) {
        var _this = _super.call(this, pattern, function (m) { return _this.apply(m); }) || this;
        _this.pattern = pattern;
        return _this;
    }
    return AbstractCase;
}(Case));
exports.AbstractCase = AbstractCase;
/**
 * AbstractResident impleemntation.
 */
var AbstractResident = /** @class */ (function () {
    function AbstractResident(system) {
        var _this = this;
        this.system = system;
        this.ref = function (addr) { return function (m) { return _this.tell(addr, m); }; };
        this.self = function () { return _this.system.identify(_this); };
    }
    AbstractResident.prototype.accept = function (_a) {
        var to = _a.to, from = _a.from, message = _a.message;
        this.system.exec(new drop_1.Drop(to, from, message));
        return this;
    };
    AbstractResident.prototype.spawn = function (t) {
        this.system.exec(new spawn_1.Spawn(this, t));
        return address_1.isRestricted(t.id) ?
            address_1.ADDRESS_DISCARD :
            address_1.make(this.self(), t.id);
    };
    AbstractResident.prototype.tell = function (ref, m) {
        this.system.exec(new tell_1.Tell(ref, this.self(), m));
        return this;
    };
    AbstractResident.prototype.kill = function (addr) {
        this.system.exec(new kill_1.Kill(this, addr));
        return this;
    };
    AbstractResident.prototype.exit = function () {
        this.kill(this.self());
    };
    AbstractResident.prototype.stop = function () {
        this.system = new system_1.NullSystem();
    };
    return AbstractResident;
}());
exports.AbstractResident = AbstractResident;
/**
 * Immutable actors do not change their behaviour after receiving
 * a message.
 *
 * Once the receive property is provided, all messages will be
 * filtered by it.
 */
var Immutable = /** @class */ (function (_super) {
    __extends(Immutable, _super);
    function Immutable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Immutable.prototype.init = function (c) {
        c.behaviour.push(ibehaviour(this));
        c.mailbox = maybe_1.just([]);
        c.flags.immutable = true;
        c.flags.buffered = true;
        return c;
    };
    /**
     * select noop.
     */
    Immutable.prototype.select = function (_) {
        return this;
    };
    return Immutable;
}(AbstractResident));
exports.Immutable = Immutable;
/**
 * Mutable actors can change their behaviour after message processing.
 */
var Mutable = /** @class */ (function (_super) {
    __extends(Mutable, _super);
    function Mutable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Mutable.prototype.init = function (c) {
        if (this.receive.length > 0)
            c.behaviour = [mbehaviour(this.receive)];
        c.mailbox = maybe_1.just([]);
        c.flags.immutable = false;
        c.flags.buffered = true;
        return c;
    };
    /**
     * select allows for selectively receiving messages based on Case classes.
     */
    Mutable.prototype.select = function (cases) {
        this.system.exec(new receive_1.Receive(this.self(), false, mbehaviour(cases)));
        return this;
    };
    return Mutable;
}(AbstractResident));
exports.Mutable = Mutable;
var mbehaviour = function (cases) { return function (m) {
    return either_1.fromBoolean(cases.some(function (c) { return c.match(m); }))
        .lmap(function () { return m; })
        .map(function_1.noop);
}; };
var ibehaviour = function (i) { return function (m) {
    return either_1.fromBoolean(i.receive.some(function (c) { return c.match(m); }))
        .lmap(function () { return m; })
        .map(function_1.noop);
}; };

},{"./address":22,"./system":27,"./system/op/drop":30,"./system/op/kill":32,"./system/op/receive":35,"./system/op/spawn":38,"./system/op/tell":40,"@quenk/noni/lib/data/either":16,"@quenk/noni/lib/data/function":17,"@quenk/noni/lib/data/maybe":18,"@quenk/noni/lib/data/type":21}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("./log");
exports.defaults = function () { return ({
    log: {
        level: log.WARN,
        logger: console
    }
}); };

},{"./log":28}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * SystemError
 */
var SystemError = /** @class */ (function () {
    function SystemError(message) {
        this.message = message;
    }
    return SystemError;
}());
exports.SystemError = SystemError;

},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("../address");
var drop_1 = require("./op/drop");
var op_1 = require("./op");
var state_1 = require("./state");
/**
 * AbstractSystem
 *
 * Implemnation of a System and Executor that spawns
 * various general purpose actors.
 */
var AbstractSystem = /** @class */ (function () {
    function AbstractSystem(configuration) {
        if (configuration === void 0) { configuration = {}; }
        this.configuration = configuration;
        this.stack = [];
        this.running = false;
    }
    AbstractSystem.prototype.exec = function (code) {
        this.stack.push(code);
        this.run();
        return this;
    };
    AbstractSystem.prototype.identify = function (actor) {
        return state_1.getAddress(this.state, actor)
            .orJust(function () { return address_1.ADDRESS_DISCARD; })
            .get();
    };
    AbstractSystem.prototype.init = function (c) {
        return c;
    };
    AbstractSystem.prototype.accept = function (_a) {
        var to = _a.to, from = _a.from, message = _a.message;
        return this.exec(new drop_1.Drop(to, from, message));
    };
    AbstractSystem.prototype.stop = function () { };
    AbstractSystem.prototype.run = function () {
        var policy = (this.configuration.log || {});
        if (this.running)
            return;
        this.running = true;
        while (this.stack.length > 0)
            op_1.log(policy.level || 0, policy.logger || console, this.stack.pop()).exec(this);
        this.running = false;
    };
    return AbstractSystem;
}());
exports.AbstractSystem = AbstractSystem;
/**
 * NullSystem is used by stopped actors to avoid side-effect caused
 * communication.
 */
var NullSystem = /** @class */ (function () {
    function NullSystem() {
    }
    NullSystem.prototype.init = function (c) {
        return c;
    };
    NullSystem.prototype.accept = function (_) {
        return this;
    };
    NullSystem.prototype.stop = function () {
        throw new Error('The system has been stopped!');
    };
    NullSystem.prototype.identify = function (_) {
        return address_1.ADDRESS_DISCARD;
    };
    NullSystem.prototype.exec = function (_) {
        return this;
    };
    NullSystem.prototype.run = function () { };
    return NullSystem;
}());
exports.NullSystem = NullSystem;

},{"../address":22,"./op":31,"./op/drop":30,"./state":42}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * DEBUG log level.
 */
exports.DEBUG = 7;
/**
 * INFO log level.
 */
exports.INFO = 6;
/**
 * WARN log level.
 */
exports.WARN = 5;
/**
 * ERROR log level.
 */
exports.ERROR = 1;

},{}],29:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("../log");
var function_1 = require("@quenk/noni/lib/data/function");
var state_1 = require("../state");
var read_1 = require("./read");
var _1 = require("./");
/**
 * Check instruction.
 */
var Check = /** @class */ (function (_super) {
    __extends(Check, _super);
    function Check(address) {
        var _this = _super.call(this) || this;
        _this.address = address;
        _this.code = _1.OP_CHECK;
        _this.level = log.INFO;
        return _this;
    }
    Check.prototype.exec = function (s) {
        return exports.execCheck(s, this);
    };
    return Check;
}(_1.Op));
exports.Check = Check;
/**
 * execCheck
 *
 * Peeks at the actors mailbox for new messages and
 * schedules a Read if for the oldest one.
 */
exports.execCheck = function (s, _a) {
    var address = _a.address;
    return state_1.getBehaviour(s.state, address)
        .chain(function () { return state_1.getMessage(s.state, address); })
        .map(function (e) { return s.exec(new read_1.Read(address, e)); })
        .map(function_1.noop)
        .orJust(function_1.noop)
        .get();
};

},{"../log":28,"../state":42,"./":31,"./read":34,"@quenk/noni/lib/data/function":17}],30:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("../log");
var _1 = require("./");
/**
 * Drop instruction.
 */
var Drop = /** @class */ (function (_super) {
    __extends(Drop, _super);
    function Drop(to, from, message) {
        var _this = _super.call(this) || this;
        _this.to = to;
        _this.from = from;
        _this.message = message;
        _this.code = _1.OP_DROP;
        _this.level = log.WARN;
        return _this;
    }
    Drop.prototype.exec = function (_) { };
    return Drop;
}(_1.Op));
exports.Drop = Drop;

},{"../log":28,"./":31}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logging = require("../log");
//Op codes.
exports.OP_RAISE = 0x64;
exports.OP_STOP = 0x0;
exports.OP_RUN = 0x1;
exports.OP_SPAWN = 0x2;
exports.OP_RESTART = 0x3;
exports.OP_TELL = 0x4;
exports.OP_DROP = 0x5;
exports.OP_RECEIVE = 0x6;
exports.OP_CHECK = 0x7;
exports.OP_READ = 0x8;
exports.OP_KILL = 0x9;
exports.OP_FLAGS = 0xa;
exports.OP_FORWARD = 0xb;
exports.OP_TRANSFER = 0xc;
/**
 * Op is an instruction executed by a System/Executor.
 */
var Op = /** @class */ (function () {
    function Op() {
    }
    return Op;
}());
exports.Op = Op;
/**
 * log an Op to the Executor's logger.
 */
exports.log = function (level, logger, o) {
    if (o.level <= level)
        switch (o.level) {
            case logging.INFO:
                logger.info(o);
                break;
            case logging.WARN:
                logger.warn(o);
                break;
            case logging.ERROR:
                logger.error(o);
                break;
            default:
                logger.log(o);
                break;
        }
    return o;
};

},{"../log":28}],32:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("../log");
var string_1 = require("@quenk/noni/lib/data/string");
var function_1 = require("@quenk/noni/lib/data/function");
var state_1 = require("../state");
var stop_1 = require("./stop");
var raise_1 = require("./raise");
var error_1 = require("../error");
var _1 = require("./");
var IllegalKillSignal = /** @class */ (function (_super) {
    __extends(IllegalKillSignal, _super);
    function IllegalKillSignal(child, parent) {
        var _this = _super.call(this, "The actor at address \"" + parent + "\" can not kill \"" + child + "\"!") || this;
        _this.child = child;
        _this.parent = parent;
        return _this;
    }
    return IllegalKillSignal;
}(error_1.SystemError));
exports.IllegalKillSignal = IllegalKillSignal;
/**
 * Kill instruction.
 */
var Kill = /** @class */ (function (_super) {
    __extends(Kill, _super);
    function Kill(actor, child) {
        var _this = _super.call(this) || this;
        _this.actor = actor;
        _this.child = child;
        _this.code = _1.OP_KILL;
        _this.level = log.WARN;
        return _this;
    }
    Kill.prototype.exec = function (s) {
        exports.execKill(s, this);
    };
    return Kill;
}(_1.Op));
exports.Kill = Kill;
/**
 * execKill
 *
 * Verify the target child is somewhere in the hierachy of the requesting
 * actor before killing it.
 */
exports.execKill = function (s, _a) {
    var child = _a.child, actor = _a.actor;
    return state_1.getAddress(s.state, actor)
        .map(function (addr) {
        return s.exec(string_1.startsWith(child, addr) ?
            new stop_1.Stop(child) :
            new raise_1.Raise(new IllegalKillSignal(addr, child), addr, addr));
    })
        .orJust(function_1.noop)
        .get();
};

},{"../error":26,"../log":28,"../state":42,"./":31,"./raise":33,"./stop":39,"@quenk/noni/lib/data/function":17,"@quenk/noni/lib/data/string":20}],33:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("../log");
var template = require("../../template");
var function_1 = require("@quenk/noni/lib/data/function");
var address_1 = require("../../address");
var state_1 = require("../state");
var restart_1 = require("./restart");
var stop_1 = require("./stop");
var _1 = require("./");
/**
 * Raise instruction.
 */
var Raise = /** @class */ (function (_super) {
    __extends(Raise, _super);
    function Raise(error, src, dest) {
        var _this = _super.call(this) || this;
        _this.error = error;
        _this.src = src;
        _this.dest = dest;
        _this.code = _1.OP_RAISE;
        _this.level = log.ERROR;
        return _this;
    }
    /**
     * exec Raise
     */
    Raise.prototype.exec = function (s) {
        return exports.execRaise(s, this);
    };
    return Raise;
}(_1.Op));
exports.Raise = Raise;
/**
 * execRaise
 *
 * If the actor template came with a trap we apply it to determine
 * what action to take, one of:
 * 1. Elevate the error to the parent actor.
 * 2. Ignore the error.
 * 3. Restart the actor.
 * 4. Stop the actor completely.
 *
 * If no trap is provided we do 1. until we hit the system actor.
 */
exports.execRaise = function (s, _a) {
    var error = _a.error, src = _a.src, dest = _a.dest;
    return state_1.getTemplate(s.state, dest)
        .map(function (t) {
        if (t.trap != null) {
            switch (t.trap(error)) {
                case template.ACTION_RAISE:
                    s.exec(new Raise(error, src, address_1.getParent(dest)));
                    break;
                case template.ACTION_IGNORE:
                    break;
                case template.ACTION_RESTART:
                    s.exec(new restart_1.Restart(src));
                    break;
                case template.ACTION_STOP:
                    s.exec(new stop_1.Stop(src));
                    break;
                default:
                    break; //ignore
            }
        }
        else {
            s.exec(new Raise(error, src, address_1.getParent(dest)));
        }
    })
        .map(function_1.noop)
        .orJust(function_1.noop)
        .get();
};

},{"../../address":22,"../../template":43,"../log":28,"../state":42,"./":31,"./restart":36,"./stop":39,"@quenk/noni/lib/data/function":17}],34:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("../log");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var function_1 = require("@quenk/noni/lib/data/function");
var state_1 = require("../state");
var drop_1 = require("./drop");
var _1 = require("./");
/**
 * Read instruction.
 */
var Read = /** @class */ (function (_super) {
    __extends(Read, _super);
    function Read(address, envelope) {
        var _this = _super.call(this) || this;
        _this.address = address;
        _this.envelope = envelope;
        _this.code = _1.OP_READ;
        _this.level = log.INFO;
        return _this;
    }
    Read.prototype.exec = function (s) {
        return exports.execRead(s, this);
    };
    return Read;
}(_1.Op));
exports.Read = Read;
/**
 * execRead
 *
 * Applies the actor behaviour in the "next tick" if a
 * receive is pending.
 */
exports.execRead = function (s, _a) {
    var address = _a.address, envelope = _a.envelope;
    return state_1.get(s.state, address)
        .chain(consume(s, envelope))
        .orJust(function_1.noop)
        .map(function_1.noop)
        .get();
};
var consume = function (s, e) { return function (f) {
    return maybe_1.fromArray(f.behaviour)
        .map(function (_a) {
        var b = _a[0];
        return b;
    })
        .chain(function (b) {
        return b(e.message)
            .map(function () {
            if (!f.flags.immutable)
                f.behaviour.shift();
        })
            .orRight(function () {
            s.exec(new drop_1.Drop(e.to, e.from, e.message));
        })
            .toMaybe();
    });
}; };

},{"../log":28,"../state":42,"./":31,"./drop":30,"@quenk/noni/lib/data/function":17,"@quenk/noni/lib/data/maybe":18}],35:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("../log");
var function_1 = require("@quenk/noni/lib/data/function");
var state_1 = require("../state");
var check_1 = require("./check");
var _1 = require("./");
/**
 * Receive instruction.
 */
var Receive = /** @class */ (function (_super) {
    __extends(Receive, _super);
    function Receive(address, immutable, behaviour) {
        var _this = _super.call(this) || this;
        _this.address = address;
        _this.immutable = immutable;
        _this.behaviour = behaviour;
        _this.code = _1.OP_RECEIVE;
        _this.level = log.INFO;
        return _this;
    }
    Receive.prototype.exec = function (s) {
        return exports.execReceive(s, this);
    };
    return Receive;
}(_1.Op));
exports.Receive = Receive;
/**
 * execReceive
 *
 * Currently only one pending receive is allowed at a time.
 */
exports.execReceive = function (s, _a) {
    var address = _a.address, behaviour = _a.behaviour;
    return state_1.get(s.state, address)
        .map(function (f) {
        return f
            .behaviour
            .push(behaviour);
    })
        .map(function () { return s.exec(new check_1.Check(address)); })
        .map(function_1.noop)
        .orJust(function_1.noop)
        .get();
};

},{"../log":28,"../state":42,"./":31,"./check":29,"@quenk/noni/lib/data/function":17}],36:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("../log");
var function_1 = require("@quenk/noni/lib/data/function");
var state_1 = require("../state");
var run_1 = require("./run");
var tell_1 = require("./tell");
var _1 = require("./");
/**
 * Restart instruction.
 */
var Restart = /** @class */ (function (_super) {
    __extends(Restart, _super);
    function Restart(address) {
        var _this = _super.call(this) || this;
        _this.address = address;
        _this.code = _1.OP_RESTART;
        _this.level = log.INFO;
        return _this;
    }
    Restart.prototype.exec = function (s) {
        return exports.execRestart(s, this);
    };
    return Restart;
}(_1.Op));
exports.Restart = Restart;
/**
 * execRestart
 *
 * Retains the actor's mailbox and stops the current instance.
 * It is then restart by creating a new instance and invoking its
 * run method.
 */
exports.execRestart = function (s, op) {
    return state_1.get(s.state, op.address)
        .map(doRestart(s, op))
        .orJust(function_1.noop)
        .get();
};
var doRestart = function (s, _a) {
    var address = _a.address;
    return function (f) {
        f.actor.stop();
        s.state = state_1.put(s.state, address, s.allocate(f.template));
        s.exec(new run_1.Run(address, 'restart', f.template.delay || 0, function () { return state_1.runInstance(s.state, address); }));
        f
            .mailbox
            .map(function (m) { return m.map(function (e) { return s.exec(new tell_1.Tell(e.to, e.from, e.message)); }); });
    };
};

},{"../log":28,"../state":42,"./":31,"./run":37,"./tell":40,"@quenk/noni/lib/data/function":17}],37:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("../log");
var timer_1 = require("@quenk/noni/lib/control/timer");
var _1 = require("./");
/**
 * Run instruction.
 */
var Run = /** @class */ (function (_super) {
    __extends(Run, _super);
    function Run(tag, actor, delay, func) {
        var _this = _super.call(this) || this;
        _this.tag = tag;
        _this.actor = actor;
        _this.delay = delay;
        _this.func = func;
        _this.code = _1.OP_RUN;
        _this.level = log.INFO;
        return _this;
    }
    Run.prototype.exec = function (_) {
        return exports.execRun(this);
    };
    return Run;
}(_1.Op));
exports.Run = Run;
/**
 * execRun
 *
 * Runs a side-effectfull function in the "next-tick" or after
 * the duration provided.
 */
exports.execRun = function (_a) {
    var func = _a.func, delay = _a.delay;
    if (delay === 0)
        timer_1.tick(func);
    else
        setTimeout(func, delay);
};

},{"../log":28,"./":31,"@quenk/noni/lib/control/timer":14}],38:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("../log");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var function_1 = require("@quenk/noni/lib/data/function");
var state_1 = require("../state");
var address_1 = require("../../address");
var error_1 = require("../error");
var raise_1 = require("./raise");
var run_1 = require("./run");
var _1 = require("./");
exports.RUN_START_TAG = 'start';
var InvalidIdError = /** @class */ (function (_super) {
    __extends(InvalidIdError, _super);
    function InvalidIdError(id) {
        var _this = _super.call(this, "Actor id \"" + id + "\" must not inclue \"$\", \"?\" or \"/\"!") || this;
        _this.id = id;
        return _this;
    }
    return InvalidIdError;
}(error_1.SystemError));
exports.InvalidIdError = InvalidIdError;
var DuplicateAddressError = /** @class */ (function (_super) {
    __extends(DuplicateAddressError, _super);
    function DuplicateAddressError(address) {
        var _this = _super.call(this, "Unable to spawn actor \"" + address + "\": Duplicate address!") || this;
        _this.address = address;
        return _this;
    }
    return DuplicateAddressError;
}(error_1.SystemError));
exports.DuplicateAddressError = DuplicateAddressError;
/**
 * Spawn instruction.
 */
var Spawn = /** @class */ (function (_super) {
    __extends(Spawn, _super);
    function Spawn(parent, template) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        _this.template = template;
        _this.code = _1.OP_SPAWN;
        _this.level = log.INFO;
        return _this;
    }
    Spawn.prototype.exec = function (s) {
        return exports.execSpawn(s, this);
    };
    return Spawn;
}(_1.Op));
exports.Spawn = Spawn;
/**
 * execSpawn instruction.
 *
 * Here we ensure the parent is still in the system then validate
 * the child id.
 *
 * If that is successfull we create and check for a duplicate id
 * then finally add the child to the system.
 */
exports.execSpawn = function (s, _a) {
    var parent = _a.parent, template = _a.template;
    return state_1.getAddress(s.state, parent)
        .chain(function (path) {
        return maybe_1.fromBoolean(!address_1.isRestricted(template.id))
            .orElse(raiseInvalidIdError(s, template.id, path))
            .map(function () { return template; })
            .chain(makeAddress(path))
            .chain(function (addr) {
            return checkAddress(s, addr)
                .orElse(raiseDuplicateAddressError(s, path, addr))
                .map(function_1.cons(addr))
                .chain(generate(s, template))
                .chain(spawnChildren(s, template))
                .map(function () { });
        });
    })
        .map(function_1.noop)
        .orJust(function_1.noop)
        .get();
};
var makeAddress = function (parent) { return function (template) {
    return maybe_1.fromString(address_1.make(parent, template.id));
}; };
var checkAddress = function (s, addr) {
    return maybe_1.fromBoolean(!state_1.exists(s.state, addr));
};
var generate = function (s, template) { return function (addr) {
    return maybe_1.fromNullable(s.allocate(template))
        .map(function (f) {
        s.state = state_1.put(s.state, addr, f);
        s.exec(new run_1.Run(exports.RUN_START_TAG, addr, template.delay || 0, function () { return state_1.runInstance(s.state, addr); }));
        return f.actor;
    });
}; };
var spawnChildren = function (s, t) { return function (parent) {
    return maybe_1.fromNullable(t.children)
        .map(function (children) { return children.forEach(function (c) { return s.exec(new Spawn(parent, c)); }); });
}; };
var raiseInvalidIdError = function (s, id, parent) { return function () {
    s.exec(new raise_1.Raise(new InvalidIdError(id), parent, parent));
    return maybe_1.nothing();
}; };
var raiseDuplicateAddressError = function (s, parent, addr) { return function () {
    s.exec(new raise_1.Raise(new DuplicateAddressError(addr), parent, parent));
    return maybe_1.nothing();
}; };

},{"../../address":22,"../error":26,"../log":28,"../state":42,"./":31,"./raise":33,"./run":37,"@quenk/noni/lib/data/function":17,"@quenk/noni/lib/data/maybe":18}],39:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("../log");
var record_1 = require("@quenk/noni/lib/data/record");
var function_1 = require("@quenk/noni/lib/data/function");
var state_1 = require("../state");
var restart_1 = require("./restart");
var _1 = require("./");
/**
 * Stop instruction.
 */
var Stop = /** @class */ (function (_super) {
    __extends(Stop, _super);
    function Stop(address) {
        var _this = _super.call(this) || this;
        _this.address = address;
        _this.code = _1.OP_STOP;
        _this.level = log.WARN;
        return _this;
    }
    Stop.prototype.exec = function (s) {
        return exports.execStop(s, this);
    };
    return Stop;
}(_1.Op));
exports.Stop = Stop;
/**
 * execStop
 *
 * If the template has the restart flag set,
 * the actor will be restarted instead.
 * Otherwised it is stopped and ejected from the system.
 */
exports.execStop = function (s, _a) {
    var address = _a.address;
    return state_1.get(s.state, address)
        .map(function (f) {
        record_1.map(state_1.getChildren(s.state, address), function (_, k) {
            return s.exec(new Stop(k));
        });
        if (f.template.restart) {
            s.exec(new restart_1.Restart(address));
        }
        else {
            f.actor.stop();
            s.state = state_1.remove(s.state, address);
        }
    })
        .orJust(function_1.noop)
        .get();
};

},{"../log":28,"../state":42,"./":31,"./restart":36,"@quenk/noni/lib/data/function":17,"@quenk/noni/lib/data/record":19}],40:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("../log");
var timer_1 = require("@quenk/noni/lib/control/timer");
var function_1 = require("@quenk/noni/lib/data/function");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var mailbox_1 = require("../../mailbox");
var state_1 = require("../state");
var check_1 = require("./check");
var transfer_1 = require("./transfer");
var drop_1 = require("./drop");
var _1 = require("./");
/**
 * Tell instruction.
 */
var Tell = /** @class */ (function (_super) {
    __extends(Tell, _super);
    function Tell(to, from, message) {
        var _this = _super.call(this) || this;
        _this.to = to;
        _this.from = from;
        _this.message = message;
        _this.code = _1.OP_TELL;
        _this.level = log.INFO;
        return _this;
    }
    Tell.prototype.exec = function (s) {
        return exports.execTell(s, this);
    };
    return Tell;
}(_1.Op));
exports.Tell = Tell;
/**
 * execTell
 *
 * If there is a router registered for the "to" address, the message
 * is transfered.
 *
 * Otherwise provided, the actor exists, we put the message in it's
 * mailbox and issue a Check.
 *
 * The message is dropped otherwise.
 */
exports.execTell = function (s, op) {
    return state_1.getRouter(s.state, op.to)
        .map(runTransfer(s, op))
        .orElse(runTell(s, op))
        .orElse(invokeDropHook(s, op))
        .orJust(justDrop(s, op))
        .map(function_1.noop)
        .get();
};
var runTransfer = function (s, _a) {
    var to = _a.to, from = _a.from, message = _a.message;
    return function (r) {
        return s.exec(new transfer_1.Transfer(to, from, r, message));
    };
};
var runTell = function (s, op) { return function () {
    return state_1.get(s.state, op.to).chain(doTell(s, op));
}; };
var doTell = function (s, op) { return function (f) {
    return f
        .mailbox
        .map(doTellMailbox(s, op))
        .orJust(function () { return f.actor.accept(toEnvelope(op)); });
}; };
var doTellMailbox = function (s, _a) {
    var to = _a.to, from = _a.from, message = _a.message;
    return function (m) {
        return timer_1.tick(function () {
            m.push(new mailbox_1.Envelope(to, from, message));
            s.exec(new check_1.Check(to));
        });
    };
};
var invokeDropHook = function (s, op) { return function () {
    return maybe_1.fromNullable(s.configuration.hooks)
        .chain(function (h) { return maybe_1.fromNullable(h.drop); })
        .map(function (f) { return f(toEnvelope(op)); });
}; };
var justDrop = function (s, _a) {
    var to = _a.to, from = _a.from, message = _a.message;
    return function () {
        return s.exec(new drop_1.Drop(to, from, message));
    };
};
var toEnvelope = function (_a) {
    var to = _a.to, from = _a.from, message = _a.message;
    return new mailbox_1.Envelope(to, from, message);
};

},{"../../mailbox":23,"../log":28,"../state":42,"./":31,"./check":29,"./drop":30,"./transfer":41,"@quenk/noni/lib/control/timer":14,"@quenk/noni/lib/data/function":17,"@quenk/noni/lib/data/maybe":18}],41:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var log = require("../log");
var function_1 = require("@quenk/noni/lib/data/function");
var mailbox_1 = require("../../mailbox");
var state_1 = require("../state");
var drop_1 = require("./drop");
var _1 = require("./");
/**
 * Transfer instruction.
 */
var Transfer = /** @class */ (function (_super) {
    __extends(Transfer, _super);
    function Transfer(to, from, router, message) {
        var _this = _super.call(this) || this;
        _this.to = to;
        _this.from = from;
        _this.router = router;
        _this.message = message;
        _this.code = _1.OP_TRANSFER;
        _this.level = log.DEBUG;
        return _this;
    }
    Transfer.prototype.exec = function (s) {
        return exports.execTransfer(s, this);
    };
    return Transfer;
}(_1.Op));
exports.Transfer = Transfer;
/**
 * execTransfer
 *
 * Peeks at the actors mailbox for new messages and
 * schedules a Read if for the oldest one.
 */
exports.execTransfer = function (s, _a) {
    var router = _a.router, to = _a.to, from = _a.from, message = _a.message;
    return state_1.getInstance(s.state, router)
        .map(function (a) { return a.accept(new mailbox_1.Envelope(to, from, message)); })
        .orJust(function () { return s.exec(new drop_1.Drop(to, from, message)); })
        .map(function_1.noop)
        .get();
};

},{"../../mailbox":23,"../log":28,"../state":42,"./":31,"./drop":30,"@quenk/noni/lib/data/function":17}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var record_1 = require("@quenk/noni/lib/data/record");
var string_1 = require("@quenk/noni/lib/data/string");
var address_1 = require("../address");
/**
 * exists tests whether an address exists in the State.
 */
exports.exists = function (s, addr) {
    return record_1.contains(s.contexts, addr);
};
/**
 * get a Context using an Address.
 */
exports.get = function (s, addr) {
    return maybe_1.fromNullable(s.contexts[addr]);
};
/**
 * getAddress attempts to retrieve the address of an Actor instance.
 */
exports.getAddress = function (s, actor) {
    return record_1.reduce(s.contexts, maybe_1.nothing(), function (p, c, k) { return c.actor === actor ?
        maybe_1.fromString(k) : p; });
};
/**
 * getInstance attempts to retrieve an actor given its address.
 */
exports.getInstance = function (s, addr) {
    return record_1.reduce(s.contexts, maybe_1.nothing(), function (p, c, k) { return k === addr ?
        maybe_1.fromNullable(c.actor) : p; });
};
/**
 * getTemplate attempts to retrieve the template for an
 * actor given an address.
 */
exports.getTemplate = function (s, addr) {
    return exports.get(s, addr).map(function (f) { return f.template; });
};
/**
 * getMessage attempts to retrieve the next message
 * from an actors mailbox.
 *
 * If sucessfull, the message will be removed.
 */
exports.getMessage = function (s, addr) {
    return exports.get(s, addr)
        .chain(function (f) { return f.mailbox; })
        .chain(function (m) { return maybe_1.fromArray(m); })
        .map(function (m) { return m.shift(); });
};
/**
 * getBehaviour attempts to retrieve the behaviour for an
 * actor given an address.
 */
exports.getBehaviour = function (s, addr) {
    return exports.get(s, addr)
        .chain(function (f) { return maybe_1.fromArray(f.behaviour); })
        .map(function (b) { return b[0]; });
};
/**
 * getChildren returns the child contexts for an address.
 */
exports.getChildren = function (s, addr) {
    return (addr === address_1.ADDRESS_SYSTEM) ?
        s.contexts :
        record_1.partition(s.contexts)(function (_, key) {
            return (string_1.startsWith(key, addr) && key !== addr);
        })[0];
};
/**
 * getParent context using an Address.
 */
exports.getParent = function (s, addr) {
    return maybe_1.fromNullable(s.contexts[address_1.getParent(addr)]);
};
/**
 * getRouter will attempt to provide the
 * routing actor for an Address.
 *
 * The value returned depends on whether the given
 * address begins with any of the installed router's address.
 */
exports.getRouter = function (s, addr) {
    return record_1.reduce(s.routes, maybe_1.nothing(), function (p, k) {
        return string_1.startsWith(addr, k) ? maybe_1.just(k) : p;
    });
};
/**
 * put a new Context in the State.
 */
exports.put = function (s, addr, context) {
    s.contexts[addr] = context;
    return s;
};
/**
 * putRoute adds a route to the routing table.
 */
exports.putRoute = function (s, from, to) {
    s.routes[from] = to;
    return s;
};
/**
 * remove an actor entry.
 */
exports.remove = function (s, addr) {
    delete s.contexts[addr];
    return s;
};
/**
 * runInstance attempts to invoke the run code of an actor instance.
 */
exports.runInstance = function (s, addr) {
    exports.getInstance(s, addr).map(function (a) { return a.run(); });
};

},{"../address":22,"@quenk/noni/lib/data/maybe":18,"@quenk/noni/lib/data/record":19,"@quenk/noni/lib/data/string":20}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTION_RAISE = -0x1;
exports.ACTION_IGNORE = 0x0;
exports.ACTION_RESTART = 0x1;
exports.ACTION_STOP = 0x2;

},{}],44:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var config = require("./actor/system/configuration");
var address = require("./actor/address");
var record_1 = require("@quenk/noni/lib/data/record");
var maybe_1 = require("@quenk/noni/lib/data/maybe");
var spawn_1 = require("./actor/system/op/spawn");
var drop_1 = require("./actor/system/op/drop");
var system_1 = require("./actor/system");
/**
 * @private
 */
var SysT = /** @class */ (function () {
    function SysT() {
        this.id = address.ADDRESS_SYSTEM;
        this.create = function () { throw new Error('Illegal attempt to restart system!'); };
        this.trap = function (e) {
            if (e instanceof Error) {
                throw e;
            }
            else {
                throw new Error(e.message);
            }
        };
    }
    return SysT;
}());
/**
 * ActorSystem
 *
 * Implemnation of a System and Executor that spawns
 * various general purpose actors.
 */
var ActorSystem = /** @class */ (function (_super) {
    __extends(ActorSystem, _super);
    function ActorSystem() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            contexts: {
                $: newContext(_this, new SysT())
            },
            routes: {}
        };
        _this.running = false;
        return _this;
    }
    ActorSystem.prototype.accept = function (_a) {
        var to = _a.to, from = _a.from, message = _a.message;
        return this.exec(new drop_1.Drop(to, from, message));
    };
    ActorSystem.prototype.allocate = function (t) {
        var act = t.create(this);
        return act.init(newContext(act, t));
    };
    /**
     * spawn a new actor from a template.
     */
    ActorSystem.prototype.spawn = function (t) {
        this.exec(new spawn_1.Spawn(this, t));
        return this;
    };
    return ActorSystem;
}(system_1.AbstractSystem));
exports.ActorSystem = ActorSystem;
/**
 * system creates a new actor system using the optionally passed
 * configuration.
 */
exports.system = function (conf) {
    return new ActorSystem(record_1.rmerge(config.defaults(), conf));
};
var newContext = function (actor, template) { return ({
    mailbox: maybe_1.nothing(),
    actor: actor,
    behaviour: [],
    flags: { immutable: false, buffered: false },
    template: template
}); };

},{"./actor/address":22,"./actor/system":27,"./actor/system/configuration":25,"./actor/system/op/drop":30,"./actor/system/op/spawn":38,"@quenk/noni/lib/data/maybe":18,"@quenk/noni/lib/data/record":19}],45:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvZ2FtZS9jb250cm9sbGVyLmpzIiwibGliL2dhbWUvZW5naW5lL2F2YXRhci9pbmRleC5qcyIsImxpYi9nYW1lL2VuZ2luZS9hdmF0YXIvb3JpZW50YXRpb24uanMiLCJsaWIvZ2FtZS9lbmdpbmUvaW5kZXguanMiLCJsaWIvZ2FtZS9lbmdpbmUvcG9pbnQuanMiLCJsaWIvZ2FtZS9lbmdpbmUvc2hvdC5qcyIsImxpYi9nYW1lL2VuZ2luZS9zb3VuZC5qcyIsImxpYi9nYW1lL3NvdW5kcy5qcyIsImxpYi9ncmlkLmpzIiwibGliL2xvZy5qcyIsImxpYi9tYWluLmpzIiwibm9kZV9tb2R1bGVzL0BxdWVuay9ub25pL2xpYi9jb250cm9sL2Vycm9yLmpzIiwibm9kZV9tb2R1bGVzL0BxdWVuay9ub25pL2xpYi9jb250cm9sL21vbmFkL2Z1dHVyZS5qcyIsIm5vZGVfbW9kdWxlcy9AcXVlbmsvbm9uaS9saWIvY29udHJvbC90aW1lci5qcyIsIm5vZGVfbW9kdWxlcy9AcXVlbmsvbm9uaS9saWIvZGF0YS9hcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9AcXVlbmsvbm9uaS9saWIvZGF0YS9laXRoZXIuanMiLCJub2RlX21vZHVsZXMvQHF1ZW5rL25vbmkvbGliL2RhdGEvZnVuY3Rpb24uanMiLCJub2RlX21vZHVsZXMvQHF1ZW5rL25vbmkvbGliL2RhdGEvbWF5YmUuanMiLCJub2RlX21vZHVsZXMvQHF1ZW5rL25vbmkvbGliL2RhdGEvcmVjb3JkLmpzIiwibm9kZV9tb2R1bGVzL0BxdWVuay9ub25pL2xpYi9kYXRhL3N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9AcXVlbmsvbm9uaS9saWIvZGF0YS90eXBlLmpzIiwibm9kZV9tb2R1bGVzL0BxdWVuay9wb3Rvby9saWIvYWN0b3IvYWRkcmVzcy5qcyIsIm5vZGVfbW9kdWxlcy9AcXVlbmsvcG90b28vbGliL2FjdG9yL21haWxib3guanMiLCJub2RlX21vZHVsZXMvQHF1ZW5rL3BvdG9vL2xpYi9hY3Rvci9yZXNpZGVudC5qcyIsIm5vZGVfbW9kdWxlcy9AcXVlbmsvcG90b28vbGliL2FjdG9yL3N5c3RlbS9jb25maWd1cmF0aW9uLmpzIiwibm9kZV9tb2R1bGVzL0BxdWVuay9wb3Rvby9saWIvYWN0b3Ivc3lzdGVtL2Vycm9yLmpzIiwibm9kZV9tb2R1bGVzL0BxdWVuay9wb3Rvby9saWIvYWN0b3Ivc3lzdGVtL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BxdWVuay9wb3Rvby9saWIvYWN0b3Ivc3lzdGVtL2xvZy5qcyIsIm5vZGVfbW9kdWxlcy9AcXVlbmsvcG90b28vbGliL2FjdG9yL3N5c3RlbS9vcC9jaGVjay5qcyIsIm5vZGVfbW9kdWxlcy9AcXVlbmsvcG90b28vbGliL2FjdG9yL3N5c3RlbS9vcC9kcm9wLmpzIiwibm9kZV9tb2R1bGVzL0BxdWVuay9wb3Rvby9saWIvYWN0b3Ivc3lzdGVtL29wL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BxdWVuay9wb3Rvby9saWIvYWN0b3Ivc3lzdGVtL29wL2tpbGwuanMiLCJub2RlX21vZHVsZXMvQHF1ZW5rL3BvdG9vL2xpYi9hY3Rvci9zeXN0ZW0vb3AvcmFpc2UuanMiLCJub2RlX21vZHVsZXMvQHF1ZW5rL3BvdG9vL2xpYi9hY3Rvci9zeXN0ZW0vb3AvcmVhZC5qcyIsIm5vZGVfbW9kdWxlcy9AcXVlbmsvcG90b28vbGliL2FjdG9yL3N5c3RlbS9vcC9yZWNlaXZlLmpzIiwibm9kZV9tb2R1bGVzL0BxdWVuay9wb3Rvby9saWIvYWN0b3Ivc3lzdGVtL29wL3Jlc3RhcnQuanMiLCJub2RlX21vZHVsZXMvQHF1ZW5rL3BvdG9vL2xpYi9hY3Rvci9zeXN0ZW0vb3AvcnVuLmpzIiwibm9kZV9tb2R1bGVzL0BxdWVuay9wb3Rvby9saWIvYWN0b3Ivc3lzdGVtL29wL3NwYXduLmpzIiwibm9kZV9tb2R1bGVzL0BxdWVuay9wb3Rvby9saWIvYWN0b3Ivc3lzdGVtL29wL3N0b3AuanMiLCJub2RlX21vZHVsZXMvQHF1ZW5rL3BvdG9vL2xpYi9hY3Rvci9zeXN0ZW0vb3AvdGVsbC5qcyIsIm5vZGVfbW9kdWxlcy9AcXVlbmsvcG90b28vbGliL2FjdG9yL3N5c3RlbS9vcC90cmFuc2Zlci5qcyIsIm5vZGVfbW9kdWxlcy9AcXVlbmsvcG90b28vbGliL2FjdG9yL3N5c3RlbS9zdGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9AcXVlbmsvcG90b28vbGliL2FjdG9yL3RlbXBsYXRlLmpzIiwibm9kZV9tb2R1bGVzL0BxdWVuay9wb3Rvby9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciByZXNpZGVudF8xID0gcmVxdWlyZShcIkBxdWVuay9wb3Rvby9saWIvYWN0b3IvcmVzaWRlbnRcIik7XG52YXIgZW5naW5lXzEgPSByZXF1aXJlKFwiLi9lbmdpbmVcIik7XG4vKipcbiAqIFR1cm4gbWVzc2FnZS5cbiAqL1xudmFyIFR1cm4gPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVHVybihhY3Rvcikge1xuICAgICAgICB0aGlzLmFjdG9yID0gYWN0b3I7XG4gICAgfVxuICAgIHJldHVybiBUdXJuO1xufSgpKTtcbmV4cG9ydHMuVHVybiA9IFR1cm47XG4vKipcbiAqIEFkdmFuY2UgbWVzc2FnZS5cbiAqL1xudmFyIEFkdmFuY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQWR2YW5jZShhY3Rvcikge1xuICAgICAgICB0aGlzLmFjdG9yID0gYWN0b3I7XG4gICAgfVxuICAgIHJldHVybiBBZHZhbmNlO1xufSgpKTtcbmV4cG9ydHMuQWR2YW5jZSA9IEFkdmFuY2U7XG4vKipcbiAqIEZpcmUgbWVzc2FnZS5cbiAqL1xudmFyIEZpcmUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmlyZShhY3Rvcikge1xuICAgICAgICB0aGlzLmFjdG9yID0gYWN0b3I7XG4gICAgfVxuICAgIHJldHVybiBGaXJlO1xufSgpKTtcbmV4cG9ydHMuRmlyZSA9IEZpcmU7XG4vKipcbiAqIERpc2FibGUgbWVzc2FnZS5cbiAqL1xudmFyIERpc2FibGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRGlzYWJsZShhY3Rvcikge1xuICAgICAgICB0aGlzLmFjdG9yID0gYWN0b3I7XG4gICAgfVxuICAgIHJldHVybiBEaXNhYmxlO1xufSgpKTtcbmV4cG9ydHMuRGlzYWJsZSA9IERpc2FibGU7XG4vKipcbiAqIENvbnRyb2xsZXIgYWxsb3dzIHRoZSB1c2VyIHRvIG1vdmUgdGhlIGNoYXJhY3RlciBvbiBzY3JlZW4uXG4gKi9cbnZhciBDb250cm9sbGVyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhDb250cm9sbGVyLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIENvbnRyb2xsZXIoYnV0dG9ucywgc3lzdGVtKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIHN5c3RlbSkgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuYnV0dG9ucyA9IGJ1dHRvbnM7XG4gICAgICAgIF90aGlzLnN5c3RlbSA9IHN5c3RlbTtcbiAgICAgICAgX3RoaXMucmVjZWl2ZSA9IFtdO1xuICAgICAgICBfdGhpcy5hZHZhbmNlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMudGVsbCgnZW5naW5lJywgbmV3IEFkdmFuY2UoX3RoaXMuc2VsZigpKSk7IH07XG4gICAgICAgIF90aGlzLnR1cm4gPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy50ZWxsKCdlbmdpbmUnLCBuZXcgVHVybihfdGhpcy5zZWxmKCkpKTsgfTtcbiAgICAgICAgX3RoaXMuZmlyZSA9IGZ1bmN0aW9uICgpIHsgX3RoaXMudGVsbCgnZW5naW5lJywgbmV3IEZpcmUoX3RoaXMuc2VsZigpKSk7IH07XG4gICAgICAgIF90aGlzLnNlbmQgPSBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgX3RoaXMudGVsbCgnZW5naW5lJywgbSk7XG4gICAgICAgICAgICBfdGhpcy5zZWxlY3QoX3RoaXMuZW5hYmxlZCk7XG4gICAgICAgIH07XG4gICAgICAgIF90aGlzLmhhbmRsZURpc2FibGUgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5zZWxlY3QoX3RoaXMuZGlzYWJsZWQpOyB9O1xuICAgICAgICBfdGhpcy5kaXNhYmxlZCA9IFtdO1xuICAgICAgICBfdGhpcy5lbmFibGVkID0gW1xuICAgICAgICAgICAgbmV3IHJlc2lkZW50XzEuQ2FzZShBZHZhbmNlLCBfdGhpcy5zZW5kKSxcbiAgICAgICAgICAgIG5ldyByZXNpZGVudF8xLkNhc2UoVHVybiwgX3RoaXMuc2VuZCksXG4gICAgICAgICAgICBuZXcgcmVzaWRlbnRfMS5DYXNlKEZpcmUsIF90aGlzLnNlbmQpLFxuICAgICAgICAgICAgbmV3IHJlc2lkZW50XzEuQ2FzZShEaXNhYmxlLCBfdGhpcy5oYW5kbGVEaXNhYmxlKVxuICAgICAgICBdO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIHJ1biBtZXRob2QuXG4gICAgICpcbiAgICAgKiBUaGlzIHdpbGwgaW5zdGFsbCB0aGUgaG9va3MgZm9yIHRoZSBidXR0b24gYWN0aW9uc1xuICAgICAqIGFuZCBpbnN0cnVjdCB0aGUgZW5naW5lIHRvIHNwYXduIGEgbmV3IGF2YXRhci5cbiAgICAgKi9cbiAgICBDb250cm9sbGVyLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuYnV0dG9uc1swXS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuYWR2YW5jZSk7XG4gICAgICAgIHRoaXMuYnV0dG9uc1sxXS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudHVybik7XG4gICAgICAgIHRoaXMuYnV0dG9uc1syXS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuZmlyZSk7XG4gICAgICAgIHRoaXMudGVsbCgnZW5naW5lJywgbmV3IGVuZ2luZV8xLlJlZ2VuKHRoaXMuc2VsZigpKSk7XG4gICAgICAgIHRoaXMuc2VsZWN0KHRoaXMuZW5hYmxlZCk7XG4gICAgfTtcbiAgICByZXR1cm4gQ29udHJvbGxlcjtcbn0ocmVzaWRlbnRfMS5NdXRhYmxlKSk7XG5leHBvcnRzLkNvbnRyb2xsZXIgPSBDb250cm9sbGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y29udHJvbGxlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgICAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcmVzaWRlbnRfMSA9IHJlcXVpcmUoXCJAcXVlbmsvcG90b28vbGliL2FjdG9yL3Jlc2lkZW50XCIpO1xudmFyIGZ1dHVyZV8xID0gcmVxdWlyZShcIkBxdWVuay9ub25pL2xpYi9jb250cm9sL21vbmFkL2Z1dHVyZVwiKTtcbnZhciBmdW5jdGlvbl8xID0gcmVxdWlyZShcIkBxdWVuay9ub25pL2xpYi9kYXRhL2Z1bmN0aW9uXCIpO1xudmFyIHBvaW50XzEgPSByZXF1aXJlKFwiLi4vcG9pbnRcIik7XG52YXIgX18xID0gcmVxdWlyZShcIi4uL1wiKTtcbnZhciBvcmllbnRhdGlvbl8xID0gcmVxdWlyZShcIi4vb3JpZW50YXRpb25cIik7XG52YXIgc291bmRfMSA9IHJlcXVpcmUoXCIuLi9zb3VuZFwiKTtcbnZhciBjb250cm9sbGVyXzEgPSByZXF1aXJlKFwiLi4vLi4vY29udHJvbGxlclwiKTtcbi8qKlxuICogUmVsb2FkIG1lc3NhZ2UuXG4gKi9cbnZhciBSZWxvYWQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVsb2FkKCkge1xuICAgIH1cbiAgICByZXR1cm4gUmVsb2FkO1xufSgpKTtcbmV4cG9ydHMuUmVsb2FkID0gUmVsb2FkO1xuLyoqXG4gKiBEaWUgbWVzc2FnZS5cbiAqL1xudmFyIERpZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBEaWUoKSB7XG4gICAgfVxuICAgIHJldHVybiBEaWU7XG59KCkpO1xuZXhwb3J0cy5EaWUgPSBEaWU7XG4vKipcbiAqIEF2YXRhciBjb250cm9scyB0aGUgcmVuZGVyaW5nIG9mIGFuIGF2YXRhciBvbiBzY3JlZW4uXG4gKlxuICogVGhpcyB3b3JrcyBieSB0dXJuaW5nIHZhcmlvdXMgYXJyYXlzIG9mIGJsb2NrcyBvbiBhbmQgb2ZmXG4gKlxuICogTm9ydGggWzEsMyw0LDUsNiw4XVxuICogMCAgMSAgMlxuICpfX18jIyNfX19cbiAqIyMjIyMjIyMjXG4gKiMjI19fXyMjI1xuICogNiAgNyAgOFxuICpcbiAqRWFzdCBbMCwxLDQsNSw2LDddXG4gKiAwICAxICAyXG4gKiMjIyMjI19fX1xuICpfX18jIyMjIyNcbiAqIyMjIyMjX19fXG4gKiA2ICA3ICA4XG4gKlxuICpTb3V0aCBbMCwyLDMsNCw1LDddXG4gKiAwICAxICAyXG4gKiMjI19fXyMjI1xuICojIyMjIyMjIyNcbiAqX19fIyMjX19fXG4gKiA2ICA3ICA4XG4gKlxuICpXZXN0IFsxLDIsMyw0LDcsOF1cbiAqIDAgIDEgIDJcbiAqX19fIyMjIyMjXG4gKiMjIyMjI19fX1xuICpfX18jIyMjIyNcbiAqIDYgIDcgIDhcbiAqL1xudmFyIEF2YXRhciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoQXZhdGFyLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEF2YXRhcihyZWdpb24sIHN0ZXAsIGNvbnRyb2xsZXIsIHN5c3RlbSkge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBzeXN0ZW0pIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLnJlZ2lvbiA9IHJlZ2lvbjtcbiAgICAgICAgX3RoaXMuc3RlcCA9IHN0ZXA7XG4gICAgICAgIF90aGlzLmNvbnRyb2xsZXIgPSBjb250cm9sbGVyO1xuICAgICAgICBfdGhpcy5zeXN0ZW0gPSBzeXN0ZW07XG4gICAgICAgIF90aGlzLm9yaWVudGF0aW9uID0gbmV3IG9yaWVudGF0aW9uXzEuT3JpZW50YXRpb24oMCwgW1xuICAgICAgICAgICAgWzEsIDMsIDQsIDUsIDYsIDhdLFxuICAgICAgICAgICAgWzAsIDEsIDQsIDUsIDYsIDddLFxuICAgICAgICAgICAgWzAsIDIsIDMsIDQsIDUsIDddLFxuICAgICAgICAgICAgWzEsIDIsIDMsIDQsIDcsIDhdXG4gICAgICAgIF0pO1xuICAgICAgICBfdGhpcy5kb1R1cm4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBlcmFzZShfdGhpcyk7XG4gICAgICAgICAgICBkcmF3TmV4dChfdGhpcyk7XG4gICAgICAgICAgICBfdGhpcy50ZWxsKCdzb3VuZHMvdHVybicsIHNvdW5kXzEuUExBWSk7XG4gICAgICAgICAgICBfdGhpcy5zZWxlY3QoX3RoaXMuaHVudGluZyk7XG4gICAgICAgIH07XG4gICAgICAgIF90aGlzLmRvQWR2YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBfYSA9IF90aGlzLCByZWdpb24gPSBfYS5yZWdpb24sIHN0ZXAgPSBfYS5zdGVwO1xuICAgICAgICAgICAgdmFyIG9yaWVudCA9IHJlZ2lvbi5zZWxlY3QoX3RoaXMub3JpZW50YXRpb24uY3VycmVudCgpKTtcbiAgICAgICAgICAgIHJlZ2lvbi5lcmFzZSgpO1xuICAgICAgICAgICAgcG9pbnRfMS5zZWVrKF90aGlzLm9yaWVudGF0aW9uLnBvaW50LCBzdGVwLCByZWdpb24pO1xuICAgICAgICAgICAgb3JpZW50LmRyYXcoKTtcbiAgICAgICAgICAgIF90aGlzLnRlbGwoJ3NvdW5kcy9hZHZhbmNlJywgc291bmRfMS5QTEFZKTtcbiAgICAgICAgICAgIF90aGlzLnNlbGVjdChfdGhpcy5odW50aW5nKTtcbiAgICAgICAgfTtcbiAgICAgICAgX3RoaXMuZG9GaXJlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGhlYWQgPSBfdGhpcy5yZWdpb24uYmxvY2tBdChfdGhpcy5vcmllbnRhdGlvbi5oZWFkKCkpO1xuICAgICAgICAgICAgX3RoaXMudGVsbCgnZW5naW5lJywgbmV3IF9fMS5TaG90R2VuKGhlYWQueCwgaGVhZC55LCBfdGhpcy5vcmllbnRhdGlvbi5wb2ludCwgX3RoaXMuc2VsZigpKSk7XG4gICAgICAgICAgICBfdGhpcy50ZWxsKCdzb3VuZHMvZmlyZScsIHNvdW5kXzEuUExBWSk7XG4gICAgICAgICAgICBfdGhpcy5zZWxlY3QoX3RoaXMuZmlyaW5nKTtcbiAgICAgICAgfTtcbiAgICAgICAgX3RoaXMuZG9EaWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdGltZSA9IDUwMDtcbiAgICAgICAgICAgIGRlbGF5KHRpbWUsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGRyYXdOZXh0KF90aGlzKTsgfSlcbiAgICAgICAgICAgICAgICAuY2hhaW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gZGVsYXkodGltZSwgZnVuY3Rpb24gKCkgeyByZXR1cm4gZHJhd05leHQoX3RoaXMpOyB9KTsgfSlcbiAgICAgICAgICAgICAgICAuY2hhaW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gZGVsYXkodGltZSwgZnVuY3Rpb24gKCkgeyByZXR1cm4gZHJhd05leHQoX3RoaXMpOyB9KTsgfSlcbiAgICAgICAgICAgICAgICAuY2hhaW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gZGVsYXkodGltZSwgZnVuY3Rpb24gKCkgeyByZXR1cm4gZHJhd05leHQoX3RoaXMpOyB9KTsgfSlcbiAgICAgICAgICAgICAgICAuY2hhaW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gZGVsYXkodGltZSwgZnVuY3Rpb24gKCkgeyByZXR1cm4gZXJhc2UoX3RoaXMpOyB9KTsgfSlcbiAgICAgICAgICAgICAgICAuZm9yayhmdW5jdGlvbl8xLm5vb3AsIGZ1bmN0aW9uXzEubm9vcCk7XG4gICAgICAgICAgICBfdGhpcy50ZWxsKCdlbmdpbmUnLCBuZXcgY29udHJvbGxlcl8xLkRpc2FibGUoX3RoaXMuc2VsZigpKSk7XG4gICAgICAgIH07XG4gICAgICAgIF90aGlzLmRvUmVsb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLnNlbGVjdChfdGhpcy5odW50aW5nKTtcbiAgICAgICAgfTtcbiAgICAgICAgX3RoaXMuaHVudGluZyA9IFtcbiAgICAgICAgICAgIG5ldyByZXNpZGVudF8xLkNhc2UoY29udHJvbGxlcl8xLlR1cm4sIF90aGlzLmRvVHVybiksXG4gICAgICAgICAgICBuZXcgcmVzaWRlbnRfMS5DYXNlKGNvbnRyb2xsZXJfMS5BZHZhbmNlLCBfdGhpcy5kb0FkdmFuY2UpLFxuICAgICAgICAgICAgbmV3IHJlc2lkZW50XzEuQ2FzZShjb250cm9sbGVyXzEuRmlyZSwgX3RoaXMuZG9GaXJlKSxcbiAgICAgICAgICAgIG5ldyByZXNpZGVudF8xLkNhc2UoRGllLCBfdGhpcy5kb0RpZSlcbiAgICAgICAgXTtcbiAgICAgICAgX3RoaXMuZmlyaW5nID0gW1xuICAgICAgICAgICAgbmV3IHJlc2lkZW50XzEuQ2FzZShjb250cm9sbGVyXzEuVHVybiwgX3RoaXMuZG9UdXJuKSxcbiAgICAgICAgICAgIG5ldyByZXNpZGVudF8xLkNhc2UoY29udHJvbGxlcl8xLkFkdmFuY2UsIF90aGlzLmRvQWR2YW5jZSksXG4gICAgICAgICAgICBuZXcgcmVzaWRlbnRfMS5DYXNlKFJlbG9hZCwgX3RoaXMuZG9SZWxvYWQpLFxuICAgICAgICAgICAgbmV3IHJlc2lkZW50XzEuQ2FzZShEaWUsIF90aGlzLmRvRGllKVxuICAgICAgICBdO1xuICAgICAgICBfdGhpcy5yZWNlaXZlID0gX3RoaXMuaHVudGluZztcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBBdmF0YXIucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZHJhd05leHQodGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gQXZhdGFyO1xufShyZXNpZGVudF8xLk11dGFibGUpKTtcbmV4cG9ydHMuQXZhdGFyID0gQXZhdGFyO1xudmFyIGRyYXdOZXh0ID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gYS5yZWdpb24uc2VsZWN0KGEub3JpZW50YXRpb24ubmV4dCgpKS5kcmF3KCk7XG59O1xudmFyIGVyYXNlID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gYS5yZWdpb24uc2VsZWN0KGEub3JpZW50YXRpb24uY3VycmVudCgpKS5lcmFzZSgpO1xufTtcbnZhciBkZWxheSA9IGZ1bmN0aW9uIChuLCBmKSB7XG4gICAgcmV0dXJuIG5ldyBmdXR1cmVfMS5SdW4oZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IHJldHVybiBzLm9uU3VjY2VzcyhmKCkpOyB9LCBuKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHsgfTtcbiAgICB9KTtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogT3JpZW50YXRpb24gb2YgYW4gQXZhdGFyLlxuICpcbiAqIFRyYWNrcyB0aGUgYmxvY2tzIGluIGEgUmVnaW9uIHRoYXQgYXJlIHVzZWQgdG8gZGlzcGxheVxuICogYW4gQXZhdGFyJ3Mgb3JpZW50YXRpb24uXG4gKlxuICogQ2FuIG9ubHkgYmUgbm9ydCxlYXN0LHNvdXRoIG9yIHdlc3QuXG4gKi9cbnZhciBPcmllbnRhdGlvbiA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBPcmllbnRhdGlvbihwb2ludCwgc3RhdGVzKSB7XG4gICAgICAgIHRoaXMucG9pbnQgPSBwb2ludDtcbiAgICAgICAgdGhpcy5zdGF0ZXMgPSBzdGF0ZXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIGN1cnJlbnQgcHJvdmlkZXMgdGhlIGN1cnJlbnQgT3JpZW50YXRpb24uXG4gICAgICovXG4gICAgT3JpZW50YXRpb24ucHJvdG90eXBlLmN1cnJlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlc1t0aGlzLnBvaW50XTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIG5leHQgcHJvdmlkZXMgdGhlIG5leHQgT3JpZW50YXRpb25cbiAgICAgKi9cbiAgICBPcmllbnRhdGlvbi5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMucG9pbnQgPT09ICh0aGlzLnN0YXRlcy5sZW5ndGggLSAxKSlcbiAgICAgICAgICAgIHRoaXMucG9pbnQgPSAwO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLnBvaW50Kys7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlc1t0aGlzLnBvaW50XTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIGhlYWQgcHJvdmlkZXMgdGhlIGNlbGwgd2l0aCB0aGUgYXZhdGFyJ3MgaGVhZC5cbiAgICAgKi9cbiAgICBPcmllbnRhdGlvbi5wcm90b3R5cGUuaGVhZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGN1cnIgPSB0aGlzLmN1cnJlbnQoKTtcbiAgICAgICAgc3dpdGNoICh0aGlzLnBvaW50KSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJbMF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJbM107XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJbNV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJbMl07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBPcmllbnRhdGlvbjtcbn0oKSk7XG5leHBvcnRzLk9yaWVudGF0aW9uID0gT3JpZW50YXRpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1vcmllbnRhdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgICAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcmVzaWRlbnRfMSA9IHJlcXVpcmUoXCJAcXVlbmsvcG90b28vbGliL2FjdG9yL3Jlc2lkZW50XCIpO1xudmFyIGFkZHJlc3NfMSA9IHJlcXVpcmUoXCJAcXVlbmsvcG90b28vbGliL2FjdG9yL2FkZHJlc3NcIik7XG52YXIgYXZhdGFyXzEgPSByZXF1aXJlKFwiLi9hdmF0YXJcIik7XG52YXIgY29udHJvbGxlcl8xID0gcmVxdWlyZShcIi4uL2NvbnRyb2xsZXJcIik7XG52YXIgc2hvdF8xID0gcmVxdWlyZShcIi4vc2hvdFwiKTtcbnZhciBzb3VuZF8xID0gcmVxdWlyZShcIi4vc291bmRcIik7XG52YXIgT1JJR0lOX1ggPSAxO1xudmFyIE9SSUdJTl9ZID0gMTtcbnZhciBBVkFUQVJfUk9XUyA9IDM7XG52YXIgQVZBVEFSX0NPTFVNTlMgPSAzO1xuLyoqXG4gKiBSZWdlbiBpbmRpY2F0ZXMgYSBuZXcgYXZhdGFyIHNob3VsZCBiZVxuICogaW5zZXJ0ZWQgdG8gdGhlIGdyaWQgb24gYmVoYWxmIG9mIHNvbWUgYWN0b3IuXG4gKlxuICogRm9yIG5vdywgYXZhdGFycyBhcmUgYWx3YXlzIHNwYXduZWQgYXQgb3JpZ2luLlxuICovXG52YXIgUmVnZW4gPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVnZW4oYWN0b3IpIHtcbiAgICAgICAgdGhpcy5hY3RvciA9IGFjdG9yO1xuICAgIH1cbiAgICByZXR1cm4gUmVnZW47XG59KCkpO1xuZXhwb3J0cy5SZWdlbiA9IFJlZ2VuO1xuLyoqXG4gKiBTaG90R2VuIG1lc3NhZ2UuXG4gKi9cbnZhciBTaG90R2VuID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNob3RHZW4ob3JpZ2luWCwgb3JpZ2luWSwgcG9pbnQsIGF2YXRhcikge1xuICAgICAgICB0aGlzLm9yaWdpblggPSBvcmlnaW5YO1xuICAgICAgICB0aGlzLm9yaWdpblkgPSBvcmlnaW5ZO1xuICAgICAgICB0aGlzLnBvaW50ID0gcG9pbnQ7XG4gICAgICAgIHRoaXMuYXZhdGFyID0gYXZhdGFyO1xuICAgIH1cbiAgICByZXR1cm4gU2hvdEdlbjtcbn0oKSk7XG5leHBvcnRzLlNob3RHZW4gPSBTaG90R2VuO1xuLyoqXG4gKiBFbmdpbmUgYWN0b3Igc2VydmluZyBhcyBkaXNwbGF5IHNlcnZlci5cbiAqXG4gKiBUaGlzIGFjdG9yIHJlY2VpdmVzIGNvbW1hbmRzIGZyb20gb3RoZXIgYWN0b3JzIGFuZFxuICogb3V0cHV0cyBpdHMgcmVzdWx0cyB0byB0aGUgaW50ZXJuYWwgZ3JpZC5cbiAqL1xudmFyIEVuZ2luZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRW5naW5lLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEVuZ2luZShncmlkLCBzeXN0ZW0pIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgc3lzdGVtKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5ncmlkID0gZ3JpZDtcbiAgICAgICAgX3RoaXMuc3lzdGVtID0gc3lzdGVtO1xuICAgICAgICAvKipcbiAgICAgICAgICogYnJpZGdlIGZyb20gQ29udHJvbGxlcnMgdG8gQXZhdGFycy5cbiAgICAgICAgICovXG4gICAgICAgIF90aGlzLmJyaWRnZSA9IHt9O1xuICAgICAgICBfdGhpcy5yZWdlbmVyYXRlQXZhdGFyID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICB2YXIgYWN0b3IgPSBfYS5hY3RvcjtcbiAgICAgICAgICAgIHZhciBpZCA9IGFkZHJlc3NfMS5nZXRJZChhY3Rvcik7XG4gICAgICAgICAgICBfdGhpcy5icmlkZ2VbYWN0b3JdID0gX3RoaXMuc3Bhd24oe1xuICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChzKSB7IHJldHVybiBuZXcgYXZhdGFyXzEuQXZhdGFyKF90aGlzLmdyaWQuZ2V0UmVnaW9uKE9SSUdJTl9YLCBPUklHSU5fWSwgQVZBVEFSX1JPV1MsIEFWQVRBUl9DT0xVTU5TKSwgX3RoaXMuZ3JpZC5ibG9ja1dpZHRoICogMywgYWN0b3IsIHMpOyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgX3RoaXMuc2VuZFR1cm4gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgX3RoaXMudGVsbChfdGhpcy5icmlkZ2VbdC5hY3Rvcl0sIHQpO1xuICAgICAgICAgICAgX3RoaXMudGVsbCgnc291bmRzL3R1cm4nLCBzb3VuZF8xLlBMQVkpO1xuICAgICAgICB9O1xuICAgICAgICBfdGhpcy5zZW5kQWR2YW5jZSA9IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICBfdGhpcy50ZWxsKF90aGlzLmJyaWRnZVthLmFjdG9yXSwgYSk7XG4gICAgICAgICAgICBfdGhpcy50ZWxsKCdzb3VuZHMvYWR2YW5jZScsIHNvdW5kXzEuUExBWSk7XG4gICAgICAgIH07XG4gICAgICAgIF90aGlzLnNlbmRGaXJlID0gZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgIF90aGlzLnRlbGwoX3RoaXMuYnJpZGdlW2EuYWN0b3JdLCBhKTtcbiAgICAgICAgICAgIF90aGlzLnRlbGwoJ3NvdW5kcy9maXJlJywgc291bmRfMS5QTEFZKTtcbiAgICAgICAgfTtcbiAgICAgICAgX3RoaXMuc3Bhd25TaG90ID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICB2YXIgcG9pbnQgPSBfYS5wb2ludCwgb3JpZ2luWCA9IF9hLm9yaWdpblgsIG9yaWdpblkgPSBfYS5vcmlnaW5ZLCBhdmF0YXIgPSBfYS5hdmF0YXI7XG4gICAgICAgICAgICB2YXIgaWQgPSBcInNob3QtXCIgKyBhZGRyZXNzXzEuZ2V0SWQoYXZhdGFyKTtcbiAgICAgICAgICAgIHZhciB0dGwgPSAyNTtcbiAgICAgICAgICAgIHZhciByYXRlID0gX3RoaXMuZ3JpZC5ibG9ja1dpZHRoICogMjtcbiAgICAgICAgICAgIHN3aXRjaCAocG9pbnQpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgIHR0bCA9IE1hdGguY2VpbChvcmlnaW5ZIC8gX3RoaXMuZ3JpZC5ibG9ja0hlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgdHRsID0gX3RoaXMuZ3JpZC54YmxvY2tzIC0gTWF0aC5jZWlsKChvcmlnaW5YIC8gX3RoaXMuZ3JpZC5ibG9ja1dpZHRoKSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgdHRsID0gX3RoaXMuZ3JpZC55YmxvY2tzIC0gTWF0aC5jZWlsKChvcmlnaW5ZIC8gX3RoaXMuZ3JpZC5ibG9ja0hlaWdodCkpO1xuICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgICAgdHRsID0gTWF0aC5jZWlsKG9yaWdpblggLyBfdGhpcy5ncmlkLmJsb2NrV2lkdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGJsayA9IF90aGlzLmdyaWQuZ2V0UmVnaW9uKG9yaWdpblgsIG9yaWdpblksIDEsIDEpO1xuICAgICAgICAgICAgX3RoaXMuc3Bhd24oe1xuICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChzKSB7IHJldHVybiBuZXcgc2hvdF8xLlNob3QoYmxrLCByYXRlLCBwb2ludCwgdHRsLCBhdmF0YXIsIHMpOyB9LFxuICAgICAgICAgICAgICAgIHJlc3RhcnQ6IGZhbHNlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgX3RoaXMucmVjZWl2ZSA9IFtcbiAgICAgICAgICAgIG5ldyByZXNpZGVudF8xLkNhc2UoY29udHJvbGxlcl8xLlR1cm4sIF90aGlzLnNlbmRUdXJuKSxcbiAgICAgICAgICAgIG5ldyByZXNpZGVudF8xLkNhc2UoY29udHJvbGxlcl8xLkFkdmFuY2UsIF90aGlzLnNlbmRBZHZhbmNlKSxcbiAgICAgICAgICAgIG5ldyByZXNpZGVudF8xLkNhc2UoY29udHJvbGxlcl8xLkZpcmUsIF90aGlzLnNlbmRGaXJlKSxcbiAgICAgICAgICAgIG5ldyByZXNpZGVudF8xLkNhc2UoU2hvdEdlbiwgX3RoaXMuc3Bhd25TaG90KSxcbiAgICAgICAgICAgIG5ldyByZXNpZGVudF8xLkNhc2UoUmVnZW4sIF90aGlzLnJlZ2VuZXJhdGVBdmF0YXIpXG4gICAgICAgIF07XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgRW5naW5lLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgcmV0dXJuIEVuZ2luZTtcbn0ocmVzaWRlbnRfMS5JbW11dGFibGUpKTtcbmV4cG9ydHMuRW5naW5lID0gRW5naW5lO1xuLypcbmNvbnN0IGNhbGNUVEwgPSAoZ3JpZDogR3JpZCwgcG9pbnQ6IHBvaW50KSA9PiB7XG5cbiAgbGV0IHR0bCA9IDA7XG5cbiAgc3dpdGNoIChwb2ludCkge1xuXG4gICAgICBjYXNlIDA6XG4gICAgICAgICAgYnJlYWs7XG5cbiAgfVxuXG59Ki9cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBzZWVrIGFkdmFuY2VzIGEgUmFuZ2UgYnkgZXhhY3RseSBvbmUgc3RlcCB1bml0IGFsb25nIGFuIFBvaW50IGF4aXMuXG4gKlxuICogSWYgbW92aW5nIHRoZSBSYW5nZSBtYWtlcyBpdCBvdXQgb2YgYm91bmRzLCB3ZSBjYW5jZWwuXG4gKi9cbmV4cG9ydHMuc2VlayA9IGZ1bmN0aW9uIChwb2ludCwgc3RlcCwgcikge1xuICAgIHN3aXRjaCAocG9pbnQpIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgci5tb3ZlKDAsIC1zdGVwKTtcbiAgICAgICAgICAgIGlmICghci5jaGVjaygpKVxuICAgICAgICAgICAgICAgIHIubW92ZSgwLCBzdGVwKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICByLm1vdmUoc3RlcCwgMCk7XG4gICAgICAgICAgICBpZiAoIXIuY2hlY2soKSlcbiAgICAgICAgICAgICAgICByLm1vdmUoLXN0ZXAsIDApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHIubW92ZSgwLCBzdGVwKTtcbiAgICAgICAgICAgIGlmICghci5jaGVjaygpKVxuICAgICAgICAgICAgICAgIHIubW92ZSgwLCAtc3RlcCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgci5tb3ZlKC1zdGVwLCAwKTtcbiAgICAgICAgICAgIGlmICghci5jaGVjaygpKVxuICAgICAgICAgICAgICAgIHIubW92ZShzdGVwLCAwKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBvaW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciByZXNpZGVudF8xID0gcmVxdWlyZShcIkBxdWVuay9wb3Rvby9saWIvYWN0b3IvcmVzaWRlbnRcIik7XG52YXIgYXZhdGFyXzEgPSByZXF1aXJlKFwiLi9hdmF0YXJcIik7XG52YXIgcG9pbnRfMSA9IHJlcXVpcmUoXCIuL3BvaW50XCIpO1xuLyoqXG4gKiBUaWNrIG1lc3NhZ2UuXG4gKi9cbnZhciBUaWNrID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFRpY2soKSB7XG4gICAgfVxuICAgIHJldHVybiBUaWNrO1xufSgpKTtcbmV4cG9ydHMuVGljayA9IFRpY2s7XG4vKipcbiAqIFN0b3AgbWVzc2FnZS5cbiAqL1xudmFyIFN0b3AgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3RvcCgpIHtcbiAgICB9XG4gICAgcmV0dXJuIFN0b3A7XG59KCkpO1xuZXhwb3J0cy5TdG9wID0gU3RvcDtcbi8qKlxuICogU2hvdCBhY3Rvci5cbiAqXG4gKiBSZXByZXNlbnRzIGEgbW92aW5nIHNob3QgYWNyb3NzIGFuIHggb3IgeSBwb2ludC5cbiAqL1xudmFyIFNob3QgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFNob3QsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gU2hvdChibG9jaywgc3RlcCwgcG9pbnQsIHR0bCwgYXZhdGFyLCBzeXN0ZW0pIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgc3lzdGVtKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5ibG9jayA9IGJsb2NrO1xuICAgICAgICBfdGhpcy5zdGVwID0gc3RlcDtcbiAgICAgICAgX3RoaXMucG9pbnQgPSBwb2ludDtcbiAgICAgICAgX3RoaXMudHRsID0gdHRsO1xuICAgICAgICBfdGhpcy5hdmF0YXIgPSBhdmF0YXI7XG4gICAgICAgIF90aGlzLnN5c3RlbSA9IHN5c3RlbTtcbiAgICAgICAgX3RoaXMuZG9UaWNrID0gZnVuY3Rpb24gKHR0bCkgeyByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHR0bCA+IDApIHtcbiAgICAgICAgICAgICAgICAvL2F2b2lkIGVyYXNpbmcgdGhlIGF2YXRhciBoZWFkLlxuICAgICAgICAgICAgICAgIGlmICh0dGwgIT09IF90aGlzLnR0bClcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuYmxvY2suZXJhc2UoKTtcbiAgICAgICAgICAgICAgICBwb2ludF8xLnNlZWsoX3RoaXMucG9pbnQsIF90aGlzLnN0ZXAsIF90aGlzLmJsb2NrKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5ibG9jay5kcmF3KCk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy50ZWxsKF90aGlzLnNlbGYoKSwgbmV3IFRpY2soKSk7IH0sIDEwKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5zZWxlY3QoX3RoaXMudGlja2luZyh0dGwgLSAxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5ibG9jay5lcmFzZSgpO1xuICAgICAgICAgICAgICAgIF90aGlzLmV4aXQoKTtcbiAgICAgICAgICAgICAgICBfdGhpcy50ZWxsKF90aGlzLmF2YXRhciwgbmV3IGF2YXRhcl8xLlJlbG9hZCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTsgfTtcbiAgICAgICAgX3RoaXMudGlja2luZyA9IGZ1bmN0aW9uICh0dGwpIHsgcmV0dXJuIFtcbiAgICAgICAgICAgIG5ldyByZXNpZGVudF8xLkNhc2UoVGljaywgX3RoaXMuZG9UaWNrKHR0bCkpXG4gICAgICAgIF07IH07XG4gICAgICAgIF90aGlzLnJlY2VpdmUgPSBbXTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBTaG90LnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGVsbCh0aGlzLnNlbGYoKSwgbmV3IFRpY2soKSk7XG4gICAgICAgIHRoaXMuc2VsZWN0KHRoaXMudGlja2luZyh0aGlzLnR0bCkpO1xuICAgIH07XG4gICAgcmV0dXJuIFNob3Q7XG59KHJlc2lkZW50XzEuTXV0YWJsZSkpO1xuZXhwb3J0cy5TaG90ID0gU2hvdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNob3QuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICAgICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHJlc2lkZW50XzEgPSByZXF1aXJlKFwiQHF1ZW5rL3BvdG9vL2xpYi9hY3Rvci9yZXNpZGVudFwiKTtcbmV4cG9ydHMuUExBWSA9ICdwbGF5Jztcbi8qKlxuICogU291bmQgYWN0cyBhcyBhIHNvdW5kIHNlcnZlciBmb3IgdGhlIGdhbWUuXG4gKi9cbnZhciBTb3VuZCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoU291bmQsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gU291bmQocmVzb3VyY2UsIHN5c3RlbSkge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBzeXN0ZW0pIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLnJlc291cmNlID0gcmVzb3VyY2U7XG4gICAgICAgIF90aGlzLnN5c3RlbSA9IHN5c3RlbTtcbiAgICAgICAgX3RoaXMucmVjZWl2ZSA9IFtcbiAgICAgICAgICAgIG5ldyByZXNpZGVudF8xLkNhc2UoZXhwb3J0cy5QTEFZLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3RoaXNcbiAgICAgICAgICAgICAgICAgICAgLnJlc291cmNlXG4gICAgICAgICAgICAgICAgICAgIC5wbGF5KClcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlKSB7IHJldHVybiBjb25zb2xlLmVycm9yKF90aGlzLnNlbGYoKSArIFwiOiBcIiArIGUubWVzc2FnZSk7IH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgXTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBTb3VuZC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgIHJldHVybiBTb3VuZDtcbn0ocmVzaWRlbnRfMS5JbW11dGFibGUpKTtcbmV4cG9ydHMuU291bmQgPSBTb3VuZDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNvdW5kLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciByZXNpZGVudF8xID0gcmVxdWlyZShcIkBxdWVuay9wb3Rvby9saWIvYWN0b3IvcmVzaWRlbnRcIik7XG52YXIgc291bmRfMSA9IHJlcXVpcmUoXCIuL2VuZ2luZS9zb3VuZFwiKTtcbmV4cG9ydHMuU09VTkRTX0ZJUkUgPSAnYXNzZXRzL2F1ZGlvL2ZpcmUud2F2JztcbmV4cG9ydHMuU09VTkRTX0FEVkFOQ0UgPSAnYXNzZXRzL2F1ZGlvL2FkdmFuY2UuZmxhYyc7XG5leHBvcnRzLlNPVU5EU19UVVJOID0gJ2Fzc2V0cy9hdWRpby90dXJuLmZsYWMnO1xuLyoqXG4gKiBTb3VuZHMgYWN0b3IuXG4gKlxuICogU2VydmVzIGFzIHBhcmVudCBmb3IgYWxsIHRoZSBhdWRpbyBhc3NldHMuXG4gKi9cbnZhciBTb3VuZHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFNvdW5kcywgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBTb3VuZHMoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlciAhPT0gbnVsbCAmJiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5yZWNlaXZlID0gW107XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgU291bmRzLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc3Bhd24oe1xuICAgICAgICAgICAgaWQ6ICdmaXJlJyxcbiAgICAgICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKHMpIHsgcmV0dXJuIG5ldyBzb3VuZF8xLlNvdW5kKG5ldyBBdWRpbyhleHBvcnRzLlNPVU5EU19GSVJFKSwgcyk7IH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc3Bhd24oe1xuICAgICAgICAgICAgaWQ6ICdhZHZhbmNlJyxcbiAgICAgICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKHMpIHsgcmV0dXJuIG5ldyBzb3VuZF8xLlNvdW5kKG5ldyBBdWRpbyhleHBvcnRzLlNPVU5EU19BRFZBTkNFKSwgcyk7IH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc3Bhd24oe1xuICAgICAgICAgICAgaWQ6ICd0dXJuJyxcbiAgICAgICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKHMpIHsgcmV0dXJuIG5ldyBzb3VuZF8xLlNvdW5kKG5ldyBBdWRpbyhleHBvcnRzLlNPVU5EU19UVVJOKSwgcyk7IH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gU291bmRzO1xufShyZXNpZGVudF8xLkltbXV0YWJsZSkpO1xuZXhwb3J0cy5Tb3VuZHMgPSBTb3VuZHM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zb3VuZHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICAgICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGxvZ18xID0gcmVxdWlyZShcIi4vbG9nXCIpO1xuLyoqXG4gKiBHcmlkIGNsYXNzXG4gKlxuICogQSBncmlkIGlzIGFuIGFycmF5IG9mIGNvbnRpbmdvdXMgYmxvY2tzIGRyYXduIHRvIGEgY2FudmFzLlxuICpcbiAqIEBwcm9wZXJ0eSB4YmxvY2tzIC0gVGhlIG51bWJlciBvZiBibG9ja3MgdGhlIGdyaWQgaGFzIG9uIGl0cyB4IGF4aXMuXG4gKiBAcHJvcGVydHkgeWJsb2NrcyAtIFRoZSBudW1iZXIgb2YgYmxvY2tzIHRoZSBncmlkIGhhcyBvbiBpdHMgeSBhY2Nlc3MuXG4gKi9cbnZhciBHcmlkID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEdyaWQoeGJsb2NrcywgeWJsb2NrcywgY2FudmFzKSB7XG4gICAgICAgIHRoaXMueGJsb2NrcyA9IHhibG9ja3M7XG4gICAgICAgIHRoaXMueWJsb2NrcyA9IHlibG9ja3M7XG4gICAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoR3JpZC5wcm90b3R5cGUsIFwiYmxvY2tXaWR0aFwiLCB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBibG9ja1dpZHRoIGlzIHRoZSBudW1iZXIgb2YgcGl4ZWxzIHVzZWQgZm9yIGEgYmxvY2sncyBoZWlnaHQuXG4gICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMueGJsb2NrcztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEdyaWQucHJvdG90eXBlLCBcImJsb2NrSGVpZ2h0XCIsIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIGJsb2NrSGVpZ2h0IGlzIHRoZSBudW1iZXIgb2YgcGl4bGVzIHVzZWQgZm9yIGEgYmxvY2sncyBoZWlnaHQuXG4gICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJsb2NrV2lkdGg7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShHcmlkLnByb3RvdHlwZSwgXCJ4cGl4ZWxzXCIsIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqeHBpeGVscyByZXR1cm5zIHRoZSBudW1iZXIgb2YgcGl4ZWxzIHBlciByb3cgaW4gdGhlIGdyaWQuXG4gICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhibG9ja3MgKiB0aGlzLmJsb2NrV2lkdGg7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShHcmlkLnByb3RvdHlwZSwgXCJ5cGl4ZWxzXCIsIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAgKnlwaXhlbHMgcmV0dXJucyB0aGUgbnVtYmVyIG9mIHBpeGVscyBwZXIgY29sdW1uIGluIHRoZSBncmlkLlxuICAgICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMueWJsb2NrcyAqIHRoaXMuYmxvY2tIZWlnaHQ7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIGdldFJlZ2lvbiBjb25zdHJ1Y3RzIGEgUmVnaW9uIHVzaW5nIHRoZSBwcm92aWRlZCBjb3JkaW5hdGVzXG4gICAgICogYW5kIG9wdGlvbmFsIG9mZnNldHMuXG4gICAgICovXG4gICAgR3JpZC5wcm90b3R5cGUuZ2V0UmVnaW9uID0gZnVuY3Rpb24gKHgsIHksIHJvd3MsIGNvbHVtbnMpIHtcbiAgICAgICAgaWYgKHJvd3MgPT09IHZvaWQgMCkgeyByb3dzID0gMTsgfVxuICAgICAgICBpZiAoY29sdW1ucyA9PT0gdm9pZCAwKSB7IGNvbHVtbnMgPSAxOyB9XG4gICAgICAgIHJldHVybiBuZXcgUmVnaW9uKHgsIHksIHJvd3MsIGNvbHVtbnMsIGV4cG9ydHMuYmxvY2tzKHRoaXMsIHgsIHksIHJvd3MsIGNvbHVtbnMpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIGRyYXdCbG9jayBhIHNpbmdsZSBibG9jayBvbiB0aGUgY2FudmFzIGF0IHRoZSBzcGVjaWZpZWQgbG9jYXRpb24uXG4gICAgICovXG4gICAgR3JpZC5wcm90b3R5cGUuZHJhd0Jsb2NrID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgdmFyIGMgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB2YXIgYWN0dWFsWCA9IHJvdW5kVXAoeCwgMSk7XG4gICAgICAgIHZhciBhY3R1YWxZID0gcm91bmRVcCh5LCAxKTtcbiAgICAgICAgbG9nXzEuTG9nZ2VyLmluZm8oXCJHcmlkOiBkcmF3aW5nIG5ldyBzcXVhcmUgYXQgKHgseSk6IFwiICsgYWN0dWFsWCArIFwiLCBcIiArIGFjdHVhbFkpO1xuICAgICAgICBjLmZpbGxTdHlsZSA9ICcjMDAwMDAnO1xuICAgICAgICBjLmZpbGxSZWN0KHgsIHksIHRoaXMuYmxvY2tXaWR0aCwgdGhpcy5ibG9ja0hlaWdodCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogZXJhc2VCbG9jayBhIHNpbmdsZSBibG9jayBhdCB0aGUgc3BlY2lmaWVkIGxvY2F0aW9uLlxuICAgICAqL1xuICAgIEdyaWQucHJvdG90eXBlLmVyYXNlQmxvY2sgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICB2YXIgYyA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHZhciBhY3R1YWxYID0gcm91bmRVcCh4LCAxKTtcbiAgICAgICAgdmFyIGFjdHVhbFkgPSByb3VuZFVwKHksIDEpO1xuICAgICAgICBsb2dfMS5Mb2dnZXIuaW5mbyhcIkdyaWQ6IHJlbW92aW5nIHNxdWFyZSBhdCAoeCx5KTogXCIgKyBhY3R1YWxYICsgXCIsIFwiICsgYWN0dWFsWSk7XG4gICAgICAgIGMuY2xlYXJSZWN0KGFjdHVhbFgsIGFjdHVhbFksIHRoaXMuYmxvY2tXaWR0aCwgdGhpcy5ibG9ja0hlaWdodCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogY2hlY2tCbG9jayB0byBzZWUgaWYgaXQgZmFsbHMgd2l0aGluIHRoZSBncmlkJ3MgcmFuZ2UuXG4gICAgICovXG4gICAgR3JpZC5wcm90b3R5cGUuY2hlY2tCbG9jayA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIGlmICgoeCA8IDEpIHx8ICh5IDwgMSkpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGVsc2UgaWYgKCh4ID4gdGhpcy54cGl4ZWxzKSB8fCAoeSA+IHRoaXMueXBpeGVscykpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgcmV0dXJuIEdyaWQ7XG59KCkpO1xuZXhwb3J0cy5HcmlkID0gR3JpZDtcbi8qKlxuICogQmxvY2sgd2l0aGluIHRoZSBHcmlkIHN5c3RlbS5cbiAqXG4gKiBUaGlzIGNsYXNzIGFsbG93cyBhIGJsb2NrIHRvIGJlIG1hbmlwdWxhdGVkIGFzIHdlbGwgYXMgdHJhY2tzXG4gKiB0aGUgc3RhdGUgb2YgdGhlIEJsb2NrLlxuICovXG52YXIgQmxvY2sgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQmxvY2soeCwgeSwgZ3JpZCkge1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xuICAgICAgICAvKipcbiAgICAgICAgICogaXNWaXNpYmxlIGluZGljYXRlcyB3aGV0aGVyIHRoZSBibG9jayBpcyBjdXJyZW50bHkgZHJhd24gb3Igbm90LlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc1Zpc2libGUgPSBmYWxzZTtcbiAgICB9XG4gICAgQmxvY2sucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZ3JpZC5kcmF3QmxvY2sodGhpcy54LCB0aGlzLnkpO1xuICAgICAgICB0aGlzLmlzVmlzaWJsZSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLmVyYXNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmdyaWQuZXJhc2VCbG9jayh0aGlzLngsIHRoaXMueSk7XG4gICAgICAgIHRoaXMuaXNWaXNpYmxlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLm1vdmUgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICB0aGlzLnggPSB0aGlzLnggKyB4O1xuICAgICAgICB0aGlzLnkgPSB0aGlzLnkgKyB5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5jaGVja0Jsb2NrKHRoaXMueCwgdGhpcy55KTtcbiAgICB9O1xuICAgIHJldHVybiBCbG9jaztcbn0oKSk7XG5leHBvcnRzLkJsb2NrID0gQmxvY2s7XG4vKipcbiAqIFNhbXBsZSByZXByZXNlbnRzIGEgbm9uLWNvbnRpZ291cyBjb2xsZWN0aW9uIG9mIGJsb2Nrcy5cbiAqL1xudmFyIFNhbXBsZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTYW1wbGUoYmxvY2tzKSB7XG4gICAgICAgIHRoaXMuYmxvY2tzID0gYmxvY2tzO1xuICAgIH1cbiAgICBTYW1wbGUucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuYmxvY2tzLmZvckVhY2goZnVuY3Rpb24gKGIpIHsgcmV0dXJuIGIuZHJhdygpOyB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTYW1wbGUucHJvdG90eXBlLmVyYXNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uIChiKSB7IHJldHVybiBiLmVyYXNlKCk7IH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNhbXBsZS5wcm90b3R5cGUubW92ZSA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHRoaXMuYmxvY2tzLmZvckVhY2goZnVuY3Rpb24gKGIpIHsgcmV0dXJuIGIubW92ZSh4LCB5KTsgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU2FtcGxlLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2tzLmV2ZXJ5KGZ1bmN0aW9uIChiKSB7IHJldHVybiBiLmNoZWNrKCk7IH0pO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogYmxvY2tBdCBwcm92aWRlcyBhIGJsb2NrIGdpdmVuIGl0cyBpbmRleC5cbiAgICAgKlxuICAgICAqIFhYWDogbWFrZSB0aGlzIHNhZmUhXG4gICAgICovXG4gICAgU2FtcGxlLnByb3RvdHlwZS5ibG9ja0F0ID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2tzW25dO1xuICAgIH07XG4gICAgcmV0dXJuIFNhbXBsZTtcbn0oKSk7XG5leHBvcnRzLlNhbXBsZSA9IFNhbXBsZTtcbi8qKlxuICogUmVnaW9uIHJlcHJlc2VudHMgYSBjb2xsZWN0aW9uIG9mIG9uZSBvciBtb3JlIGJsb2Nrcy5cbiAqXG4gKiBUaGlzIGNsYXNzIGFsbG93cyBmb3IgbXVsdGlwbGUgYmxvY2tzIHRvIGJlIG1hbmlwdWxhdGVkXG4gKiB2aWEgb25lIGNsYXNzLlxuICovXG52YXIgUmVnaW9uID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSZWdpb24sIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gUmVnaW9uKHgsIHksIHJvd3MsIGNvbHVtbnMsIGJsb2Nrcykge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBibG9ja3MpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLnggPSB4O1xuICAgICAgICBfdGhpcy55ID0geTtcbiAgICAgICAgX3RoaXMucm93cyA9IHJvd3M7XG4gICAgICAgIF90aGlzLmNvbHVtbnMgPSBjb2x1bW5zO1xuICAgICAgICBfdGhpcy5ibG9ja3MgPSBibG9ja3M7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogcmVkdWNlIHRoZSBibG9ja3Mgb2YgdGhpcyBSZWdpb24gdG8gYSBzaW5nbGUgdmFsdWUuXG4gICAgICovXG4gICAgUmVnaW9uLnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAoaW5pdCwgZikge1xuICAgICAgICByZXR1cm4gdGhpcy5ibG9ja3MucmVkdWNlKGYsIGluaXQpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogc2VsZWN0IGEgbm9uLWNvbnRpbmdvdXMgcmFuZ2Ugb2YgYmxvY2tzIGZyb20gdGhpcyBSZWdpb24uXG4gICAgICpcbiAgICAgKiBTZWxlY3Rpb24gaXMgYmFzZWQgb24gbGVmdCB0byByaWdodCBpbmRpY2llcyBvZiBlYWNoIEJsb2NrLlxuICAgICAqIElmIGFueSBpbmRpY2llcyBhcmUgaW52YWxpZCwgdGhleSBhcmUgaWdub3JlZCBmb3Igbm93LlxuICAgICAqL1xuICAgIFJlZ2lvbi5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKGlkeCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gbmV3IFNhbXBsZShpZHgubWFwKGZ1bmN0aW9uIChpKSB7IHJldHVybiBfdGhpcy5ibG9ja3NbaV07IH0pLmZpbHRlcihmdW5jdGlvbiAoYiwgaSkge1xuICAgICAgICAgICAgaWYgKCFiKVxuICAgICAgICAgICAgICAgIGxvZ18xLkxvZ2dlci53YXJuKFwiUmVnaW9uI3NlbGVjdDogaWdub3JpbmcgdW5rbm93biBpbmRleCBcXFwiXCIgKyBpICsgXCJcXFwiLiBcIiArXG4gICAgICAgICAgICAgICAgICAgIChcIktub3duIGluZGljaWVzOiAxLVwiICsgX3RoaXMuYmxvY2tzLmxlbmd0aCkpO1xuICAgICAgICAgICAgcmV0dXJuIGI7XG4gICAgICAgIH0pKTtcbiAgICB9O1xuICAgIHJldHVybiBSZWdpb247XG59KFNhbXBsZSkpO1xuZXhwb3J0cy5SZWdpb24gPSBSZWdpb247XG52YXIgcm91bmRVcCA9IGZ1bmN0aW9uIChuLCB0bykge1xuICAgIHJldHVybiBuID09PSAwID8gdG8gOiBuO1xufTtcbi8qKlxuICogYmxvY2tzIGNhbGN1bGF0ZXMgYWxsIHRoZSBCbG9ja3MgaW5jbHVkZWQgaW4gYSByZWdpb24uXG4gKi9cbmV4cG9ydHMuYmxvY2tzID0gZnVuY3Rpb24gKGdyaWQsIG9yaWdpblgsIG9yaWdpblksIHJvd3MsIGNvbHVtbnMpIHtcbiAgICB2YXIgbGlzdCA9IFtuZXcgQmxvY2sob3JpZ2luWCwgb3JpZ2luWSwgZ3JpZCldO1xuICAgIHZhciB4T2Zmc2V0ID0gMTtcbiAgICB2YXIgeU9mZnNldCA9IDE7XG4gICAgLy9maXJzdCByb3dcbiAgICB3aGlsZSAoeE9mZnNldCA8IGNvbHVtbnMpIHtcbiAgICAgICAgbGlzdC5wdXNoKG5ldyBCbG9jayhvcmlnaW5YICsgKHhPZmZzZXQgKiBncmlkLmJsb2NrV2lkdGgpLCBvcmlnaW5ZLCBncmlkKSk7XG4gICAgICAgIHhPZmZzZXQrKztcbiAgICB9XG4gICAgLy9vdGhlcnNcbiAgICB3aGlsZSAoeU9mZnNldCA8IHJvd3MpIHtcbiAgICAgICAgdmFyIGFjdHVhbFkgPSBvcmlnaW5ZICsgKHlPZmZzZXQgKiBncmlkLmJsb2NrSGVpZ2h0KTtcbiAgICAgICAgeE9mZnNldCA9IDE7XG4gICAgICAgIGxpc3QucHVzaChuZXcgQmxvY2sob3JpZ2luWCwgYWN0dWFsWSwgZ3JpZCkpO1xuICAgICAgICB3aGlsZSAoeE9mZnNldCA8IGNvbHVtbnMpIHtcbiAgICAgICAgICAgIHZhciBhY3R1YWxYID0gb3JpZ2luWCArICh4T2Zmc2V0ICogZ3JpZC5ibG9ja1dpZHRoKTtcbiAgICAgICAgICAgIGxpc3QucHVzaChuZXcgQmxvY2soYWN0dWFsWCwgYWN0dWFsWSwgZ3JpZCkpO1xuICAgICAgICAgICAgeE9mZnNldCsrO1xuICAgICAgICB9XG4gICAgICAgIHlPZmZzZXQrKztcbiAgICB9XG4gICAgcmV0dXJuIGxpc3Q7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Z3JpZC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogTG9nZ2VyXG4gKlxuICogQ29udmVpbmVuY2UgbG9nZ2VyLCBtb3N0bHkgZm9yIGRlYnVnZ2luZy5cbiAqL1xudmFyIExvZ2dlciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMb2dnZXIoKSB7XG4gICAgfVxuICAgIExvZ2dlci5pbmZvID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbXNnID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBtc2dbX2ldID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAod2luZG93LkVOQUJMRV9MT0dHRVIpXG4gICAgICAgICAgICBjb25zb2xlLmluZm8uYXBwbHkoY29uc29sZSwgbXNnKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMb2dnZXIud2FybiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1zZyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgbXNnW19pXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHdpbmRvdy5FTkFCTEVfTE9HR0VSKVxuICAgICAgICAgICAgY29uc29sZS53YXJuLmFwcGx5KGNvbnNvbGUsIG1zZyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIExvZ2dlcjtcbn0oKSk7XG5leHBvcnRzLkxvZ2dlciA9IExvZ2dlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWxvZy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBwb3Rvb18xID0gcmVxdWlyZShcIkBxdWVuay9wb3Rvb1wiKTtcbnZhciBncmlkXzEgPSByZXF1aXJlKFwiLi9ncmlkXCIpO1xudmFyIGVuZ2luZV8xID0gcmVxdWlyZShcIi4vZ2FtZS9lbmdpbmVcIik7XG52YXIgY29udHJvbGxlcl8xID0gcmVxdWlyZShcIi4vZ2FtZS9jb250cm9sbGVyXCIpO1xudmFyIHNvdW5kc18xID0gcmVxdWlyZShcIi4vZ2FtZS9zb3VuZHNcIik7XG52YXIgcyA9IHBvdG9vXzEuc3lzdGVtKHsgbG9nOiB7IGxldmVsOiA4IH0gfSk7XG52YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjcmVlbicpO1xudmFyIGJ1dHRvbnMgPSBbXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J1dHRvbi0wJyksXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J1dHRvbi0xJyksXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J1dHRvbi0yJylcbl07XG53aW5kb3cuc3lzdGVtID0gc1xuICAgIC5zcGF3bih7XG4gICAgaWQ6ICdlbmdpbmUnLFxuICAgIGNyZWF0ZTogZnVuY3Rpb24gKHMpIHsgcmV0dXJuIG5ldyBlbmdpbmVfMS5FbmdpbmUobmV3IGdyaWRfMS5HcmlkKDUwLCA1MCwgY2FudmFzKSwgcyk7IH1cbn0pXG4gICAgLnNwYXduKHtcbiAgICBpZDogJ3AxJyxcbiAgICBjcmVhdGU6IGZ1bmN0aW9uIChzKSB7IHJldHVybiBuZXcgY29udHJvbGxlcl8xLkNvbnRyb2xsZXIoYnV0dG9ucywgcyk7IH1cbn0pXG4gICAgLnNwYXduKHtcbiAgICBpZDogJ3NvdW5kcycsXG4gICAgY3JlYXRlOiBmdW5jdGlvbiAocykgeyByZXR1cm4gbmV3IHNvdW5kc18xLlNvdW5kcyhzKTsgfVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYWluLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiBUaGlzIG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgYW5kIHR5cGVzIHRvIG1ha2UgZGVhbGluZyB3aXRoIEVTIGVycm9yc1xuICogZWFzaWVyLlxuICovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKiogaW1wb3J0cyAqL1xudmFyIGVpdGhlcl8xID0gcmVxdWlyZShcIi4uL2RhdGEvZWl0aGVyXCIpO1xuLyoqXG4gKiBjb252ZXJ0IGFuIEVyciB0byBhbiBFcnJvci5cbiAqL1xuZXhwb3J0cy5jb252ZXJ0ID0gZnVuY3Rpb24gKGUpIHtcbiAgICByZXR1cm4gKGUgaW5zdGFuY2VvZiBFcnJvcikgPyBlIDogbmV3IEVycm9yKGUubWVzc2FnZSk7XG59O1xuLyoqXG4gKiByYWlzZSB0aGUgc3VwcGxpZWQgRXJyb3IuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBleGlzdHMgdG8gbWFpbnRhaW4gYSBmdW5jdGlvbmFsIHN0eWxlIGluIHNpdHVhdGlvbnMgd2hlcmVcbiAqIHlvdSBtYXkgYWN0dWFsbHkgd2FudCB0byB0aHJvdyBhbiBlcnJvci5cbiAqL1xuZXhwb3J0cy5yYWlzZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGUubWVzc2FnZSk7XG4gICAgfVxufTtcbi8qKlxuICogYXR0ZW1wdCBhIHN5bmNocm9ub3VzIGNvbXB1dGF0aW9uIHRoYXQgbWF5IHRocm93IGFuIGV4Y2VwdGlvbi5cbiAqL1xuZXhwb3J0cy5hdHRlbXB0ID0gZnVuY3Rpb24gKGYpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gZWl0aGVyXzEucmlnaHQoZigpKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGVpdGhlcl8xLmxlZnQoZSk7XG4gICAgfVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVycm9yLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0aW1lcl8xID0gcmVxdWlyZShcIi4uL3RpbWVyXCIpO1xudmFyIGZ1bmN0aW9uXzEgPSByZXF1aXJlKFwiLi4vLi4vZGF0YS9mdW5jdGlvblwiKTtcbnZhciBlcnJvcl8xID0gcmVxdWlyZShcIi4uL2Vycm9yXCIpO1xudmFyIEZ1dHVyZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGdXR1cmUoKSB7XG4gICAgfVxuICAgIEZ1dHVyZS5wcm90b3R5cGUub2YgPSBmdW5jdGlvbiAoYSkge1xuICAgICAgICByZXR1cm4gbmV3IFB1cmUoYSk7XG4gICAgfTtcbiAgICBGdXR1cmUucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBuZXcgQmluZCh0aGlzLCBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIG5ldyBQdXJlKGYodmFsdWUpKTsgfSk7XG4gICAgfTtcbiAgICBGdXR1cmUucHJvdG90eXBlLmFwID0gZnVuY3Rpb24gKGZ0KSB7XG4gICAgICAgIHJldHVybiBuZXcgQmluZCh0aGlzLCBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIGZ0Lm1hcChmdW5jdGlvbiAoZikgeyByZXR1cm4gZih2YWx1ZSk7IH0pOyB9KTtcbiAgICB9O1xuICAgIEZ1dHVyZS5wcm90b3R5cGUuY2hhaW4gPSBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gbmV3IEJpbmQodGhpcywgZik7XG4gICAgfTtcbiAgICBGdXR1cmUucHJvdG90eXBlLmNhdGNoID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDYXRjaCh0aGlzLCBmKTtcbiAgICB9O1xuICAgIEZ1dHVyZS5wcm90b3R5cGUuZmluYWxseSA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBuZXcgRmluYWxseSh0aGlzLCBmKTtcbiAgICB9O1xuICAgIEZ1dHVyZS5wcm90b3R5cGUuZm9yayA9IGZ1bmN0aW9uIChvbkVycm9yLCBvblN1Y2Nlc3MpIHtcbiAgICAgICAgdmFyIGMgPSBuZXcgQ29tcHV0ZSh1bmRlZmluZWQsIG9uRXJyb3IsIG9uU3VjY2VzcywgW3RoaXNdLCBbXSwgW10pO1xuICAgICAgICBjLnJ1bigpO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9O1xuICAgIHJldHVybiBGdXR1cmU7XG59KCkpO1xuZXhwb3J0cy5GdXR1cmUgPSBGdXR1cmU7XG4vKipcbiAqIFB1cmUgY29uc3RydWN0b3IuXG4gKi9cbnZhciBQdXJlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhQdXJlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFB1cmUodmFsdWUpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBQdXJlLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gbmV3IFB1cmUoZih0aGlzLnZhbHVlKSk7XG4gICAgfTtcbiAgICBQdXJlLnByb3RvdHlwZS5hcCA9IGZ1bmN0aW9uIChmdCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gZnQubWFwKGZ1bmN0aW9uIChmKSB7IHJldHVybiBmKF90aGlzLnZhbHVlKTsgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gUHVyZTtcbn0oRnV0dXJlKSk7XG5leHBvcnRzLlB1cmUgPSBQdXJlO1xuLyoqXG4gKiBSYWlzZSBjb25zdHJ1Y3Rvci5cbiAqL1xudmFyIFJhaXNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSYWlzZSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBSYWlzZSh2YWx1ZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFJhaXNlLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAoXykge1xuICAgICAgICByZXR1cm4gbmV3IFJhaXNlKHRoaXMudmFsdWUpO1xuICAgIH07XG4gICAgUmFpc2UucHJvdG90eXBlLmFwID0gZnVuY3Rpb24gKF8pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSYWlzZSh0aGlzLnZhbHVlKTtcbiAgICB9O1xuICAgIFJhaXNlLnByb3RvdHlwZS5jaGFpbiA9IGZ1bmN0aW9uIChfKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmFpc2UodGhpcy52YWx1ZSk7XG4gICAgfTtcbiAgICByZXR1cm4gUmFpc2U7XG59KEZ1dHVyZSkpO1xuZXhwb3J0cy5SYWlzZSA9IFJhaXNlO1xuLyoqXG4gKiBCaW5kIGNvbnN0cnVjdG9yLlxuICogQHByaXZhdGVcbiAqL1xudmFyIEJpbmQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEJpbmQsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gQmluZChmdXR1cmUsIGZ1bmMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuZnV0dXJlID0gZnV0dXJlO1xuICAgICAgICBfdGhpcy5mdW5jID0gZnVuYztcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICByZXR1cm4gQmluZDtcbn0oRnV0dXJlKSk7XG5leHBvcnRzLkJpbmQgPSBCaW5kO1xuLyoqXG4gKiBTdGVwIGNvbnN0cnVjdG9yLlxuICogQHByaXZhdGVcbiAqL1xudmFyIFN0ZXAgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFN0ZXAsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gU3RlcCh2YWx1ZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIHJldHVybiBTdGVwO1xufShGdXR1cmUpKTtcbmV4cG9ydHMuU3RlcCA9IFN0ZXA7XG4vKipcbiAqIENhdGNoIGNvbnN0cnVjdG9yLlxuICogQHByaXZhdGVcbiAqL1xudmFyIENhdGNoID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhDYXRjaCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBDYXRjaChmdXR1cmUsIGZ1bmMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuZnV0dXJlID0gZnV0dXJlO1xuICAgICAgICBfdGhpcy5mdW5jID0gZnVuYztcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICByZXR1cm4gQ2F0Y2g7XG59KEZ1dHVyZSkpO1xuZXhwb3J0cy5DYXRjaCA9IENhdGNoO1xuLyoqXG4gKiBGaW5hbGx5IGNvbnN0cnVjdG9yLlxuICogQHByaXZhdGVcbiAqL1xudmFyIEZpbmFsbHkgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEZpbmFsbHksIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRmluYWxseShmdXR1cmUsIGZ1bmMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuZnV0dXJlID0gZnV0dXJlO1xuICAgICAgICBfdGhpcy5mdW5jID0gZnVuYztcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICByZXR1cm4gRmluYWxseTtcbn0oRnV0dXJlKSk7XG5leHBvcnRzLkZpbmFsbHkgPSBGaW5hbGx5O1xuLyoqXG4gKiBSdW4gY29uc3RydWN0b3IuXG4gKiBAcHJpdmF0ZVxuICovXG52YXIgUnVuID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSdW4sIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gUnVuKHZhbHVlKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIFJ1bjtcbn0oRnV0dXJlKSk7XG5leHBvcnRzLlJ1biA9IFJ1bjtcbi8qKlxuICogQ29tcHV0ZSByZXByZXNlbnRzIHRoZSB3b3JrbG9hZCBvZiBhIGZvcmtlZCBGdXR1cmUuXG4gKlxuICogUmVzdWx0cyBhcmUgY29tcHV0ZWQgc2VxdWVudGlhbGx5IGFuZCBlbmRzIHdpdGggZWl0aGVyIGEgdmFsdWUsXG4gKiBlcnJvciBvciBwcmVtYXR1cmVseSB2aWEgdGhlIGFib3J0IG1ldGhvZC5cbiAqL1xudmFyIENvbXB1dGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29tcHV0ZSh2YWx1ZSwgZXhpdEVycm9yLCBleGl0U3VjY2Vzcywgc3RhY2ssIGhhbmRsZXJzLCBmaW5hbGl6ZXJzKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5leGl0RXJyb3IgPSBleGl0RXJyb3I7XG4gICAgICAgIHRoaXMuZXhpdFN1Y2Nlc3MgPSBleGl0U3VjY2VzcztcbiAgICAgICAgdGhpcy5zdGFjayA9IHN0YWNrO1xuICAgICAgICB0aGlzLmhhbmRsZXJzID0gaGFuZGxlcnM7XG4gICAgICAgIHRoaXMuZmluYWxpemVycyA9IGZpbmFsaXplcnM7XG4gICAgICAgIHRoaXMuY2FuY2VsbGVyID0gZnVuY3Rpb25fMS5ub29wO1xuICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogb25FcnJvciBoYW5kbGVyLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2Qgd2lsbCBhICdSYWlzZScgaW5zdHJ1Y3Rpb24gYXQgdGhlIHRvcCBvZiB0aGUgc3RhY2tcbiAgICAgKiBhbmQgY29udGludWUgZXhlY3V0aW9uLlxuICAgICAqL1xuICAgIENvbXB1dGUucHJvdG90eXBlLm9uRXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAodGhpcy5ydW5uaW5nID09PSBmYWxzZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5zdGFjay5wdXNoKG5ldyBSYWlzZShlKSk7XG4gICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJ1bigpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogb25TdWNjZXNzIGhhbmRsZXIuXG4gICAgICpcbiAgICAgKiBTdG9yZXMgdGhlIHJlc3VsdGluZyB2YWx1ZSBhbmQgY29udGludWVzIHRoZSBleGVjdXRpb24uXG4gICAgICovXG4gICAgQ29tcHV0ZS5wcm90b3R5cGUub25TdWNjZXNzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLnJ1bm5pbmcgPT09IGZhbHNlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJ1bigpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogYWJvcnQgdGhpcyBDb21wdXRlLlxuICAgICAqXG4gICAgICogQWJvcnRpbmcgYSBDb21wdXRlIHdpbGwgaW1tZWRpYXRlbHkgY2xlYXIgaXRzIHN0YWNrXG4gICAgICogYW5kIGludm9rZSB0aGUgY2FuY2VsbGVyIGZvciB0aGUgY3VycmVudGx5IGV4ZWN1dGluZyBGdXR1cmUuXG4gICAgICovXG4gICAgQ29tcHV0ZS5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc3RhY2sgPSBbXTtcbiAgICAgICAgdGhpcy5leGl0RXJyb3IgPSBmdW5jdGlvbl8xLm5vb3A7XG4gICAgICAgIHRoaXMuZXhpdFN1Y2Nlc3MgPSBmdW5jdGlvbl8xLm5vb3A7XG4gICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNhbmNlbGxlcigpO1xuICAgICAgICB0aGlzLmNhbmNlbGxlciA9IGZ1bmN0aW9uXzEubm9vcDtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIHJ1biB0aGlzIENvbXB1dGUuXG4gICAgICovXG4gICAgQ29tcHV0ZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB3aGlsZSAodGhpcy5zdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IHRoaXMuc3RhY2sucG9wKCk7XG4gICAgICAgICAgICBpZiAobmV4dCBpbnN0YW5jZW9mIFB1cmUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gbmV4dC52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5leHQgaW5zdGFuY2VvZiBCaW5kKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFjay5wdXNoKG5ldyBTdGVwKG5leHQuZnVuYykpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhY2sucHVzaChuZXh0LmZ1dHVyZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChuZXh0IGluc3RhbmNlb2YgU3RlcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhY2sucHVzaChuZXh0LnZhbHVlKHRoaXMudmFsdWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5leHQgaW5zdGFuY2VvZiBDYXRjaCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlcnMucHVzaChuZXh0LmZ1bmMpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhY2sucHVzaChuZXh0LmZ1dHVyZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChuZXh0IGluc3RhbmNlb2YgRmluYWxseSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmluYWxpemVycy5wdXNoKG5leHQuZnVuYyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFjay5wdXNoKG5ldyBTdGVwKG5leHQuZnVuYykpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhY2sucHVzaChuZXh0LmZ1dHVyZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChuZXh0IGluc3RhbmNlb2YgUmFpc2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YWNrID0gW107IC8vY2xlYXIgdGhlIHN0YWNrO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpbmFsaXplcnMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFjay5wdXNoKG5ldyBTdGVwKHRoaXMuZmluYWxpemVycy5wb3AoKSkpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhbmRsZXJzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhY2sucHVzaCh0aGlzLmhhbmRsZXJzLnBvcCgpKGVycm9yXzEuY29udmVydChuZXh0LnZhbHVlKSkpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YWNrLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhpdEVycm9yKGVycm9yXzEuY29udmVydChuZXh0LnZhbHVlKSk7IC8vZW5kIG9uIHVuaGFuZGxlZCBlcnJvclxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV4dCBpbnN0YW5jZW9mIFJ1bikge1xuICAgICAgICAgICAgICAgIHRoaXMucnVubmluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW5jZWxsZXIgPSBuZXh0LnZhbHVlKHRoaXMpO1xuICAgICAgICAgICAgICAgIHJldHVybjsgLy9zaG9ydC1jaXJjdWl0IGFuZCBjb250aW51ZSBpbiBhIG5ldyBjYWxsLXN0YWNrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZXhpdFN1Y2Nlc3ModGhpcy52YWx1ZSk7XG4gICAgfTtcbiAgICByZXR1cm4gQ29tcHV0ZTtcbn0oKSk7XG5leHBvcnRzLkNvbXB1dGUgPSBDb21wdXRlO1xuLyoqXG4gKiBwdXJlIHdyYXBzIGEgc3luY2hyb25vdXMgdmFsdWUgaW4gYSBGdXR1cmUuXG4gKi9cbmV4cG9ydHMucHVyZSA9IGZ1bmN0aW9uIChhKSB7IHJldHVybiBuZXcgUHVyZShhKTsgfTtcbi8qKlxuICogcmFpc2Ugd3JhcHMgYW4gRXJyb3IgaW4gYSBGdXR1cmUuXG4gKlxuICogVGhpcyBmdXR1cmUgd2lsbCBiZSBjb25zaWRlcmVkIGEgZmFpbHVyZS5cbiAqL1xuZXhwb3J0cy5yYWlzZSA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBuZXcgUmFpc2UoZSk7IH07XG4vKipcbiAqIGF0dGVtcHQgYSBzeW5jcm9ub3VzIHRhc2ssIHRyYXBwaW5nIGFueSB0aHJvd24gZXJyb3JzIGluIHRoZSBGdXR1cmUuXG4gKi9cbmV4cG9ydHMuYXR0ZW1wdCA9IGZ1bmN0aW9uIChmKSB7IHJldHVybiBuZXcgUnVuKGZ1bmN0aW9uIChzKSB7XG4gICAgdGltZXJfMS50aWNrKGZ1bmN0aW9uICgpIHsgdHJ5IHtcbiAgICAgICAgcy5vblN1Y2Nlc3MoZigpKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgcy5vbkVycm9yKGUpO1xuICAgIH0gfSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uXzEubm9vcDtcbn0pOyB9O1xuLyoqXG4gKiBkZWxheSBhIHRhc2sgYnkgcnVubmluZyBpdCBpbiB0aGUgXCJuZXh0IHRpY2tcIiB3aXRob3V0IGF0dGVtcHRpbmdcbiAqIHRvIHRyYXAgYW55IHRocm93biBlcnJvcnMuXG4gKi9cbmV4cG9ydHMuZGVsYXkgPSBmdW5jdGlvbiAoZikgeyByZXR1cm4gbmV3IFJ1bihmdW5jdGlvbiAocykge1xuICAgIHRpbWVyXzEudGljayhmdW5jdGlvbiAoKSB7IHJldHVybiBzLm9uU3VjY2VzcyhmKCkpOyB9KTtcbiAgICByZXR1cm4gZnVuY3Rpb25fMS5ub29wO1xufSk7IH07XG4vKipcbiAqIGZyb21BYm9ydGFibGUgdGFrZXMgYW4gQWJvcnRlciBhbmQgYSBub2RlIHN0eWxlIGFzeW5jIGZ1bmN0aW9uIGFuZFxuICogcHJvZHVjZXMgYSBGdXR1cmUuXG4gKlxuICogTm90ZTogVGhlIGZ1bmN0aW9uIHVzZWQgaGVyZSBpcyBub3QgY2FsbGVkIGluIHRoZSBcIm5leHQgdGlja1wiLlxuICovXG5leHBvcnRzLmZyb21BYm9ydGFibGUgPSBmdW5jdGlvbiAoYWJvcnQpIHsgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiBuZXcgUnVuKGZ1bmN0aW9uIChzKSB7XG4gICAgZihmdW5jdGlvbiAoZXJyLCBhKSB7IHJldHVybiAoZXJyICE9IG51bGwpID8gcy5vbkVycm9yKGVycikgOiBzLm9uU3VjY2VzcyhhKTsgfSk7XG4gICAgcmV0dXJuIGFib3J0O1xufSk7IH07IH07XG4vKipcbiAqIGZyb21DYWxsYmFjayBwcm9kdWNlcyBhIEZ1dHVyZSBmcm9tIGEgbm9kZSBzdHlsZSBhc3luYyBmdW5jdGlvbi5cbiAqXG4gKiBOb3RlOiBUaGUgZnVuY3Rpb24gdXNlZCBoZXJlIGlzIG5vdCBjYWxsZWQgaW4gdGhlIFwibmV4dCB0aWNrXCIuXG4gKi9cbmV4cG9ydHMuZnJvbUNhbGxiYWNrID0gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIGV4cG9ydHMuZnJvbUFib3J0YWJsZShmdW5jdGlvbl8xLm5vb3ApKGYpOyB9O1xudmFyIFRhZyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBUYWcoaW5kZXgsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gVGFnO1xufSgpKTtcbi8qKlxuICogcGFyYWxsZWwgcnVucyBhIGxpc3Qgb2YgRnV0dXJlcyBpbiBwYXJhbGxlbCBmYWlsaW5nIGlmIGFueVxuICogZmFpbCBhbmQgc3VjY2VlZGluZyB3aXRoIGEgbGlzdCBvZiBzdWNjZXNzZnVsIHZhbHVlcy5cbiAqL1xuZXhwb3J0cy5wYXJhbGxlbCA9IGZ1bmN0aW9uIChsaXN0KSB7IHJldHVybiBuZXcgUnVuKGZ1bmN0aW9uIChzKSB7XG4gICAgdmFyIGRvbmUgPSBbXTtcbiAgICB2YXIgY29tcHMgPSBsaXN0LnJlZHVjZShmdW5jdGlvbiAocCwgZiwgaW5kZXgpIHtcbiAgICAgICAgcC5wdXNoKGZcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiBuZXcgVGFnKGluZGV4LCB2YWx1ZSk7IH0pXG4gICAgICAgICAgICAuZm9yayhmdW5jdGlvbiAoZSkgeyBhYm9ydEFsbChwKTsgcy5vbkVycm9yKGUpOyB9LCBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgZG9uZS5wdXNoKHQpO1xuICAgICAgICAgICAgaWYgKGRvbmUubGVuZ3RoID09PSBsaXN0Lmxlbmd0aClcbiAgICAgICAgICAgICAgICBzLm9uU3VjY2Vzcyhkb25lLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEuaW5kZXggLSBiLmluZGV4OyB9KVxuICAgICAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uICh0KSB7IHJldHVybiB0LnZhbHVlOyB9KSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfSwgW10pO1xuICAgIGlmIChjb21wcy5sZW5ndGggPT09IDApXG4gICAgICAgIHMub25TdWNjZXNzKFtdKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkgeyBhYm9ydEFsbChjb21wcyk7IH07XG59KTsgfTtcbi8qKlxuICogcmFjZSBnaXZlbiBhIGxpc3Qgb2YgRnV0dXJlcywgd2lsbCByZXR1cm4gYSBGdXR1cmUgdGhhdCBpcyBzZXR0bGVkIGJ5XG4gKiB0aGUgZmlyc3QgZXJyb3Igb3Igc3VjY2VzcyB0byBvY2N1ci5cbiAqL1xuZXhwb3J0cy5yYWNlID0gZnVuY3Rpb24gKGxpc3QpIHsgcmV0dXJuIG5ldyBSdW4oZnVuY3Rpb24gKHMpIHtcbiAgICB2YXIgY29tcHMgPSBsaXN0XG4gICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24gKHAsIGYsIGluZGV4KSB7XG4gICAgICAgIHAucHVzaChmXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gbmV3IFRhZyhpbmRleCwgdmFsdWUpOyB9KVxuICAgICAgICAgICAgLmZvcmsoZnVuY3Rpb24gKGUpIHsgYWJvcnRBbGwocCk7IHMub25FcnJvcihlKTsgfSwgZnVuY3Rpb24gKHQpIHsgYWJvcnRFeGNlcHQocCwgdC5pbmRleCk7IHMub25TdWNjZXNzKHQudmFsdWUpOyB9KSk7XG4gICAgICAgIHJldHVybiBwO1xuICAgIH0sIFtdKTtcbiAgICBpZiAoY29tcHMubGVuZ3RoID09PSAwKVxuICAgICAgICBzLm9uRXJyb3IobmV3IEVycm9yKFwicmFjZSgpOiBDYW5ub3QgcmFjZSBhbiBlbXB0eSBsaXN0IVwiKSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHsgYWJvcnRBbGwoY29tcHMpOyB9O1xufSk7IH07XG52YXIgYWJvcnRBbGwgPSBmdW5jdGlvbiAoY29tcHMpIHsgcmV0dXJuIHRpbWVyXzEudGljayhmdW5jdGlvbiAoKSB7IHJldHVybiBjb21wcy5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuYWJvcnQoKTsgfSk7IH0pOyB9O1xudmFyIGFib3J0RXhjZXB0ID0gZnVuY3Rpb24gKGNvbXBzLCBpbmRleCkge1xuICAgIHJldHVybiB0aW1lcl8xLnRpY2soZnVuY3Rpb24gKCkgeyByZXR1cm4gY29tcHMubWFwKGZ1bmN0aW9uIChjLCBpKSB7IHJldHVybiAoaSAhPT0gaW5kZXgpID8gYy5hYm9ydCgpIDogdW5kZWZpbmVkOyB9KTsgfSk7XG59O1xuLyoqXG4gKiB0b1Byb21pc2UgdHJhbnNmb3JtcyBhIEZ1dHVyZSBpbnRvIGEgUHJvbWlzZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGRlcGVuZHMgb24gdGhlIGdsb2JhbCBwcm9taXNlIGNvbnN0cnVjdG9yIGFuZFxuICogd2lsbCBmYWlsIGlmIHRoZSBlbnZpb3JubWVudCBkb2VzIG5vdCBwcm92aWRlIG9uZS5cbiAqL1xuZXhwb3J0cy50b1Byb21pc2UgPSBmdW5jdGlvbiAoZnQpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uICh5ZXMsIG5vKSB7XG4gICAgcmV0dXJuIGZ0LmZvcmsobm8sIHllcyk7XG59KTsgfTtcbi8qKlxuICogZnJvbUV4Y2VwdCBjb252ZXJ0cyBhbiBFeGNlcHQgdG8gYSBGdXR1cmUuXG4gKi9cbmV4cG9ydHMuZnJvbUV4Y2VwdCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgcmV0dXJuIGUuZm9sZChmdW5jdGlvbiAoZSkgeyByZXR1cm4gZXhwb3J0cy5yYWlzZShlKTsgfSwgZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGV4cG9ydHMucHVyZShhKTsgfSk7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZnV0dXJlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiB0aWNrIHJ1bnMgYSBmdW5jdGlvbiBpbiB0aGUgXCJuZXh0IHRpY2tcIiB1c2luZyBwcm9jZXNzLm5leHRUaWNrIGluIG5vZGVcbiAqIG9yIHNldFRpbWVvdXQoZiwgMCkgZWxzZXdoZXJlLlxuICovXG5leHBvcnRzLnRpY2sgPSBmdW5jdGlvbiAoZikgeyByZXR1cm4gKHR5cGVvZiB3aW5kb3cgPT0gJ3VuZGVmaW5lZCcpID9cbiAgICBzZXRUaW1lb3V0KGYsIDApIDpcbiAgICBwcm9jZXNzLm5leHRUaWNrKGYpOyB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGltZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIFRoZSBhcnJheSBtb2R1bGUgcHJvdmlkZXMgaGVscGVyIGZ1bmN0aW9uc1xuICogZm9yIHdvcmtpbmcgd2l0aCBKUyBhcnJheXMuXG4gKi9cbnZhciByZWNvcmRfMSA9IHJlcXVpcmUoXCIuL3JlY29yZFwiKTtcbi8qKlxuICogaGVhZCByZXR1cm5zIHRoZSBpdGVtIGF0IGluZGV4IDAgb2YgYW4gYXJyYXlcbiAqL1xuZXhwb3J0cy5oZWFkID0gZnVuY3Rpb24gKGxpc3QpIHsgcmV0dXJuIGxpc3RbMF07IH07XG4vKipcbiAqIHRhaWwgcmV0dXJucyB0aGUgbGFzdCBpdGVtIGluIGFuIGFycmF5XG4gKi9cbmV4cG9ydHMudGFpbCA9IGZ1bmN0aW9uIChsaXN0KSB7IHJldHVybiBsaXN0W2xpc3QubGVuZ3RoIC0gMV07IH07XG4vKipcbiAqIGVtcHR5IGluZGljYXRlcyB3aGV0aGVyIGFuIGFycmF5IGlzIGVtcHR5IG9yIG5vdC5cbiAqL1xuZXhwb3J0cy5lbXB0eSA9IGZ1bmN0aW9uIChsaXN0KSB7IHJldHVybiAobGlzdC5sZW5ndGggPT09IDApOyB9O1xuLyoqXG4gKiBjb250YWlucyBpbmRpY2F0ZXMgd2hldGhlciBhbiBlbGVtZW50IGV4aXN0cyBpbiBhbiBhcnJheS5cbiAqL1xuZXhwb3J0cy5jb250YWlucyA9IGZ1bmN0aW9uIChsaXN0KSB7IHJldHVybiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gKGxpc3QuaW5kZXhPZihhKSA+IC0xKTsgfTsgfTtcbi8qKlxuICogbWFwIGlzIGEgY3VycmllZCB2ZXJzaW9uIG9mIHRoZSBBcnJheSNtYXAgbWV0aG9kLlxuICovXG5leHBvcnRzLm1hcCA9IGZ1bmN0aW9uIChsaXN0KSB7IHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gbGlzdC5tYXAoZik7IH07IH07XG4vKipcbiAqIGNvbmNhdCBjb25jYXRlbmF0ZXMgYW4gZWxlbWVudCB0byBhbiBhcnJheSB3aXRob3V0IGRlc3RydWN0dXJpbmdcbiAqIHRoZSBlbGVtZW50IGlmIGl0c2VsZiBpcyBhbiBhcnJheS5cbiAqL1xuZXhwb3J0cy5jb25jYXQgPSBmdW5jdGlvbiAobGlzdCkgeyByZXR1cm4gZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGxpc3QuY29uY2F0KFthXSk7IH07IH07XG4vKipcbiAqIHBhcnRpdGlvbiBhbiBhcnJheSBpbnRvIHR3byB1c2luZyBhIHBhcnRpdGlvbmluZyBmdW5jdGlvbi5cbiAqXG4gKiBUaGUgZmlyc3QgYXJyYXkgY29udGFpbnMgdmFsdWVzIHRoYXQgcmV0dXJuIHRydWUgYW5kIHRoZSBzZWNvbmQgZmFsc2UuXG4gKi9cbmV4cG9ydHMucGFydGl0aW9uID0gZnVuY3Rpb24gKGxpc3QpIHsgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiBleHBvcnRzLmVtcHR5KGxpc3QpID9cbiAgICBbW10sIFtdXSA6XG4gICAgbGlzdC5yZWR1Y2UoZnVuY3Rpb24gKF9hLCBjLCBpKSB7XG4gICAgICAgIHZhciB5ZXMgPSBfYVswXSwgbm8gPSBfYVsxXTtcbiAgICAgICAgcmV0dXJuIChmKGMsIGksIGxpc3QpID9cbiAgICAgICAgICAgIFtleHBvcnRzLmNvbmNhdCh5ZXMpKGMpLCBub10gOlxuICAgICAgICAgICAgW3llcywgZXhwb3J0cy5jb25jYXQobm8pKGMpXSk7XG4gICAgfSwgW1tdLCBbXV0pOyB9OyB9O1xuLyoqXG4gKiBncm91cCB0aGUgcHJvcGVydGllcyBvZiBhIFJlY29yZCBpbnRvIGFub3RoZXIgUmVjb3JkIHVzaW5nIGEgZ3JvdXBpbmdcbiAqIGZ1bmN0aW9uLlxuICovXG5leHBvcnRzLmdyb3VwID0gZnVuY3Rpb24gKGxpc3QpIHsgcmV0dXJuIGZ1bmN0aW9uIChmKSB7XG4gICAgcmV0dXJuIGxpc3QucmVkdWNlKGZ1bmN0aW9uIChwLCBjLCBpKSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgdmFyIGcgPSBmKGMsIGksIGxpc3QpO1xuICAgICAgICByZXR1cm4gcmVjb3JkXzEubWVyZ2UocCwgKF9hID0ge30sXG4gICAgICAgICAgICBfYVtnXSA9IEFycmF5LmlzQXJyYXkocFtnXSkgP1xuICAgICAgICAgICAgICAgIGV4cG9ydHMuY29uY2F0KHBbZ10pKGMpIDogW2NdLFxuICAgICAgICAgICAgX2EpKTtcbiAgICB9LCB7fSk7XG59OyB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXJyYXkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICAgICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIG1heWJlXzEgPSByZXF1aXJlKFwiLi9tYXliZVwiKTtcbi8qKlxuICogRWl0aGVyIHJlcHJlc2VudHMgYSB2YWx1ZSB0aGF0IG1heSBiZSBvbmUgb2YgdHdvIHR5cGVzLlxuICpcbiAqIEFuIEVpdGhlciBpcyBlaXRoZXIgYSBMZWZ0IG9yIFJpZ2h0LiBNYXBwaW5nIGFuZCByZWxhdGVkIGZ1bmN0aW9ucyBvdmVyIHRoZVxuICogTGVmdCBzaWRlIHJldHVybnMgdGhlIHZhbHVlIHVuY2hhbmdlZC4gV2hlbiB0aGUgdmFsdWUgaXMgUmlnaHRcbiAqIGZ1bmN0aW9ucyBhcmUgYXBwbGllZCBhcyBub3JtYWwuXG4gKlxuICogVGhlIEVpdGhlciBjb25jZXB0IGlzIG9mdGVuIHVzZWQgdG8gYWNjb21vZGF0ZSBlcnJvciBoYW5kbGluZyBidXQgdGhlcmVcbiAqIGFyZSBvdGhlciBwbGFjZXMgaXQgbWF5IGNvbWUgaW4gaGFuZHkuXG4gKi9cbnZhciBFaXRoZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRWl0aGVyKCkge1xuICAgIH1cbiAgICBFaXRoZXIucHJvdG90eXBlLm9mID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmlnaHQodmFsdWUpO1xuICAgIH07XG4gICAgcmV0dXJuIEVpdGhlcjtcbn0oKSk7XG5leHBvcnRzLkVpdGhlciA9IEVpdGhlcjtcbi8qKlxuICogTGVmdCBzaWRlIG9mIHRoZSBFaXRoZXIgaW1wbGVtZW50YXRpb24uXG4gKi9cbnZhciBMZWZ0ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhMZWZ0LCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIExlZnQodmFsdWUpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBMZWZ0LnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAoXykge1xuICAgICAgICByZXR1cm4gbmV3IExlZnQodGhpcy52YWx1ZSk7XG4gICAgfTtcbiAgICBMZWZ0LnByb3RvdHlwZS5sbWFwID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMZWZ0KGYodGhpcy52YWx1ZSkpO1xuICAgIH07XG4gICAgTGVmdC5wcm90b3R5cGUuYmltYXAgPSBmdW5jdGlvbiAoZiwgXykge1xuICAgICAgICByZXR1cm4gbmV3IExlZnQoZih0aGlzLnZhbHVlKSk7XG4gICAgfTtcbiAgICBMZWZ0LnByb3RvdHlwZS5hbHQgPSBmdW5jdGlvbiAoYSkge1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9O1xuICAgIExlZnQucHJvdG90eXBlLmNoYWluID0gZnVuY3Rpb24gKF8pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMZWZ0KHRoaXMudmFsdWUpO1xuICAgIH07XG4gICAgTGVmdC5wcm90b3R5cGUuYXAgPSBmdW5jdGlvbiAoXykge1xuICAgICAgICByZXR1cm4gbmV3IExlZnQodGhpcy52YWx1ZSk7XG4gICAgfTtcbiAgICBMZWZ0LnByb3RvdHlwZS5leHRlbmQgPSBmdW5jdGlvbiAoXykge1xuICAgICAgICByZXR1cm4gbmV3IExlZnQodGhpcy52YWx1ZSk7XG4gICAgfTtcbiAgICBMZWZ0LnByb3RvdHlwZS5mb2xkID0gZnVuY3Rpb24gKGYsIF8pIHtcbiAgICAgICAgcmV0dXJuIGYodGhpcy52YWx1ZSk7XG4gICAgfTtcbiAgICBMZWZ0LnByb3RvdHlwZS5lcSA9IGZ1bmN0aW9uIChtKSB7XG4gICAgICAgIHJldHVybiAoKG0gaW5zdGFuY2VvZiBMZWZ0KSAmJiAobS52YWx1ZSA9PT0gdGhpcy52YWx1ZSkpO1xuICAgIH07XG4gICAgTGVmdC5wcm90b3R5cGUub3JFbHNlID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYodGhpcy52YWx1ZSk7XG4gICAgfTtcbiAgICBMZWZ0LnByb3RvdHlwZS5vclJpZ2h0ID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSaWdodChmKHRoaXMudmFsdWUpKTtcbiAgICB9O1xuICAgIExlZnQucHJvdG90eXBlLnRha2VMZWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9O1xuICAgIExlZnQucHJvdG90eXBlLnRha2VSaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk5vdCByaWdodCFcIik7XG4gICAgfTtcbiAgICBMZWZ0LnByb3RvdHlwZS50b01heWJlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbWF5YmVfMS5ub3RoaW5nKCk7XG4gICAgfTtcbiAgICByZXR1cm4gTGVmdDtcbn0oRWl0aGVyKSk7XG5leHBvcnRzLkxlZnQgPSBMZWZ0O1xuLyoqXG4gKiBSaWdodCBzaWRlIGltcGxlbWVudGF0aW9uLlxuICovXG52YXIgUmlnaHQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFJpZ2h0LCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFJpZ2h0KHZhbHVlKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgUmlnaHQucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmlnaHQoZih0aGlzLnZhbHVlKSk7XG4gICAgfTtcbiAgICBSaWdodC5wcm90b3R5cGUubG1hcCA9IGZ1bmN0aW9uIChfKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmlnaHQodGhpcy52YWx1ZSk7XG4gICAgfTtcbiAgICBSaWdodC5wcm90b3R5cGUuYmltYXAgPSBmdW5jdGlvbiAoXywgZykge1xuICAgICAgICByZXR1cm4gbmV3IFJpZ2h0KGcodGhpcy52YWx1ZSkpO1xuICAgIH07XG4gICAgUmlnaHQucHJvdG90eXBlLmFsdCA9IGZ1bmN0aW9uIChfKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgUmlnaHQucHJvdG90eXBlLmNoYWluID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYodGhpcy52YWx1ZSk7XG4gICAgfTtcbiAgICBSaWdodC5wcm90b3R5cGUuYXAgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gZS5tYXAoZnVuY3Rpb24gKGYpIHsgcmV0dXJuIGYoX3RoaXMudmFsdWUpOyB9KTtcbiAgICB9O1xuICAgIFJpZ2h0LnByb3RvdHlwZS5leHRlbmQgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gbmV3IFJpZ2h0KGYodGhpcykpO1xuICAgIH07XG4gICAgUmlnaHQucHJvdG90eXBlLmVxID0gZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgcmV0dXJuICgobSBpbnN0YW5jZW9mIFJpZ2h0KSAmJiAobS52YWx1ZSA9PT0gdGhpcy52YWx1ZSkpO1xuICAgIH07XG4gICAgUmlnaHQucHJvdG90eXBlLmZvbGQgPSBmdW5jdGlvbiAoXywgZykge1xuICAgICAgICByZXR1cm4gZyh0aGlzLnZhbHVlKTtcbiAgICB9O1xuICAgIFJpZ2h0LnByb3RvdHlwZS5vckVsc2UgPSBmdW5jdGlvbiAoXykge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFJpZ2h0LnByb3RvdHlwZS5vclJpZ2h0ID0gZnVuY3Rpb24gKF8pIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBSaWdodC5wcm90b3R5cGUudGFrZUxlZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJOb3QgbGVmdCFcIik7XG4gICAgfTtcbiAgICBSaWdodC5wcm90b3R5cGUudGFrZVJpZ2h0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9O1xuICAgIFJpZ2h0LnByb3RvdHlwZS50b01heWJlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbWF5YmVfMS5qdXN0KHRoaXMudmFsdWUpO1xuICAgIH07XG4gICAgcmV0dXJuIFJpZ2h0O1xufShFaXRoZXIpKTtcbmV4cG9ydHMuUmlnaHQgPSBSaWdodDtcbi8qKlxuICogbGVmdCBjb25zdHJ1Y3RvciBoZWxwZXIuXG4gKi9cbmV4cG9ydHMubGVmdCA9IGZ1bmN0aW9uIChhKSB7IHJldHVybiBuZXcgTGVmdChhKTsgfTtcbi8qKlxuICogcmlnaHQgY29uc3RydWN0b3IgaGVscGVyLlxuICovXG5leHBvcnRzLnJpZ2h0ID0gZnVuY3Rpb24gKGIpIHsgcmV0dXJuIG5ldyBSaWdodChiKTsgfTtcbi8qKlxuICogZnJvbUJvb2xlYW4gY29uc3RydWN0cyBhbiBFaXRoZXIgdXNpbmcgYSBib29sZWFuIHZhbHVlLlxuICovXG5leHBvcnRzLmZyb21Cb29sZWFuID0gZnVuY3Rpb24gKGIpIHtcbiAgICByZXR1cm4gYiA/IGV4cG9ydHMucmlnaHQodHJ1ZSkgOiBleHBvcnRzLmxlZnQoZmFsc2UpO1xufTtcbi8qKlxuICogZWl0aGVyIGdpdmVuIHR3byBmdW5jdGlvbnMsIGZpcnN0IGZvciBMZWZ0LCBzZWNvbmQgZm9yIFJpZ2h0LCB3aWxsIHJldHVyblxuICogdGhlIHJlc3VsdCBvZiBhcHBseWluZyB0aGUgYXBwcm9wcmlhdGUgZnVuY3Rpb24gdG8gYW4gRWl0aGVyJ3MgaW50ZXJuYWwgdmFsdWUuXG4gKi9cbmV4cG9ydHMuZWl0aGVyID0gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIGZ1bmN0aW9uIChnKSB7IHJldHVybiBmdW5jdGlvbiAoZSkge1xuICAgIHJldHVybiAoZSBpbnN0YW5jZW9mIFJpZ2h0KSA/IGcoZS50YWtlUmlnaHQoKSkgOiBmKGUudGFrZUxlZnQoKSk7XG59OyB9OyB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZWl0aGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBjb21wb3NlIHR3byBmdW5jdGlvbnMgaW50byBvbmUuXG4gKi9cbmV4cG9ydHMuY29tcG9zZSA9IGZ1bmN0aW9uIChmLCBnKSB7IHJldHVybiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gZyhmKGEpKTsgfTsgfTtcbi8qKlxuICogY29tcG9zZTMgZnVuY3Rpb25zIGludG8gb25lLlxuICovXG5leHBvcnRzLmNvbXBvc2UzID0gZnVuY3Rpb24gKGYsIGcsIGgpIHsgcmV0dXJuIGZ1bmN0aW9uIChhKSB7IHJldHVybiBoKGcoZihhKSkpOyB9OyB9O1xuLyoqXG4gKiBjb21wb3NlNCBmdW5jdGlvbnMgaW50byBvbmUuXG4gKi9cbmV4cG9ydHMuY29tcG9zZTQgPSBmdW5jdGlvbiAoZiwgZywgaCwgaSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gaShoKGcoZihhKSkpKTsgfTtcbn07XG4vKipcbiAqIGNvbXBvc2U1IGZ1bmN0aW9ucyBpbnRvIG9uZS5cbiAqL1xuZXhwb3J0cy5jb21wb3NlNSA9IGZ1bmN0aW9uIChmLCBnLCBoLCBpLCBqKSB7IHJldHVybiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gaihpKGgoZyhmKGEpKSkpKTsgfTsgfTtcbi8qKlxuICogY29ucyBnaXZlbiB0d28gdmFsdWVzLCBpZ25vcmUgdGhlIHNlY29uZCBhbmQgYWx3YXlzIHJldHVybiB0aGUgZmlyc3QuXG4gKi9cbmV4cG9ydHMuY29ucyA9IGZ1bmN0aW9uIChhKSB7IHJldHVybiBmdW5jdGlvbiAoXykgeyByZXR1cm4gYTsgfTsgfTtcbi8qKlxuICogZmxpcCB0aGUgb3JkZXIgb2YgYXJndW1lbnRzIHRvIGEgY3VycmllZCBmdW5jdGlvbiB0aGF0IHRha2VzIDIgYXJndW1lbnRzLlxuICovXG5leHBvcnRzLmZsaXAgPSBmdW5jdGlvbiAoZikgeyByZXR1cm4gZnVuY3Rpb24gKGIpIHsgcmV0dXJuIGZ1bmN0aW9uIChhKSB7IHJldHVybiAoZihhKShiKSk7IH07IH07IH07XG4vKipcbiAqIGlkZW50aXR5IGZ1bmN0aW9uLlxuICovXG5leHBvcnRzLmlkZW50aXR5ID0gZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGE7IH07XG5leHBvcnRzLmlkID0gZXhwb3J0cy5pZGVudGl0eTtcbi8qKlxuICogY3VycnkgYW4gRVMgZnVuY3Rpb24gdGhhdCBhY2NlcHRzIDIgcGFyYW1ldGVycy5cbiAqL1xuZXhwb3J0cy5jdXJyeSA9IGZ1bmN0aW9uIChmKSB7IHJldHVybiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gZnVuY3Rpb24gKGIpIHsgcmV0dXJuIGYoYSwgYik7IH07IH07IH07XG4vKipcbiAqIGN1cnJ5MyBjdXJyaWVzIGFuIEVTIGZ1bmN0aW9uIHRoYXQgYWNjZXB0cyAzIHBhcmFtZXRlcnMuXG4gKi9cbmV4cG9ydHMuY3VycnkzID0gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIGZ1bmN0aW9uIChhKSB7IHJldHVybiBmdW5jdGlvbiAoYikgeyByZXR1cm4gZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGYoYSwgYiwgYyk7IH07IH07IH07IH07XG4vKipcbiAqIGN1cnJ5NCBjdXJyaWVzIGFuIEVTIGZ1bmN0aW9uIHRoYXQgYWNjZXB0cyA0IHBhcmFtZXRlcnMuXG4gKi9cbmV4cG9ydHMuY3Vycnk0ID0gZnVuY3Rpb24gKGYpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGZ1bmN0aW9uIChiKSB7IHJldHVybiBmdW5jdGlvbiAoYykgeyByZXR1cm4gZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGYoYSwgYiwgYywgZCk7IH07IH07IH07IH07XG59O1xuLyoqXG4gKiBjdXJyeTUgY3VycmllcyBhbiBFUyBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgNSBwYXJhbWV0ZXJzLlxuICovXG5leHBvcnRzLmN1cnJ5NSA9IGZ1bmN0aW9uIChmKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChhKSB7IHJldHVybiBmdW5jdGlvbiAoYikgeyByZXR1cm4gZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGZ1bmN0aW9uIChkKSB7IHJldHVybiBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZihhLCBiLCBjLCBkLCBlKTsgfTsgfTsgfTsgfTsgfTtcbn07XG4vKipcbiAqIG5vb3AgZnVuY3Rpb25cbiAqL1xuZXhwb3J0cy5ub29wID0gZnVuY3Rpb24gKCkgeyB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZnVuY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIE5vdGhpbmcgcmVwcmVzZW50cyB0aGUgYWJzZW5jZSBvZiBhIHVzYWJsZSB2YWx1ZS5cbiAqL1xudmFyIE5vdGhpbmcgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTm90aGluZygpIHtcbiAgICB9XG4gICAgLyoqXG4gICAgICogbWFwIHNpbXBseSByZXR1cm5zIGEgTm90aGluZzxBPlxuICAgICAqL1xuICAgIE5vdGhpbmcucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChfKSB7XG4gICAgICAgIHJldHVybiBuZXcgTm90aGluZygpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogYXAgYWxsb3dzIGZvciBhIGZ1bmN0aW9uIHdyYXBwZWQgaW4gYSBKdXN0IHRvIGFwcGx5XG4gICAgICogdG8gdmFsdWUgcHJlc2VudCBpbiB0aGlzIEp1c3QuXG4gICAgICovXG4gICAgTm90aGluZy5wcm90b3R5cGUuYXAgPSBmdW5jdGlvbiAoXykge1xuICAgICAgICByZXR1cm4gbmV3IE5vdGhpbmcoKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIG9mIHdyYXBzIGEgdmFsdWUgaW4gYSBKdXN0LlxuICAgICAqL1xuICAgIE5vdGhpbmcucHJvdG90eXBlLm9mID0gZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBKdXN0KGEpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogY2hhaW4gc2ltcGx5IHJldHVybnMgYSBOb3RoaW5nPEE+LlxuICAgICAqL1xuICAgIE5vdGhpbmcucHJvdG90eXBlLmNoYWluID0gZnVuY3Rpb24gKF8pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOb3RoaW5nKCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBhbHQgd2lsbCBwcmVmZXIgd2hhdGV2ZXIgTWF5YmUgaW5zdGFuY2UgcHJvdmlkZWQuXG4gICAgICovXG4gICAgTm90aGluZy5wcm90b3R5cGUuYWx0ID0gZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBlbXB0eSBwcm92aWRlcyBhIGRlZmF1bHQgTWF5YmUuXG4gICAgICogTWF5YmUuZW1wdHkoKSA9IG5ldyBOb3RoaW5nKClcbiAgICAgKi9cbiAgICBOb3RoaW5nLnByb3RvdHlwZS5lbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOb3RoaW5nKCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBleHRlbmQgcmV0dXJucyBhIE5vdGhpbmc8QT4uXG4gICAgICovXG4gICAgTm90aGluZy5wcm90b3R5cGUuZXh0ZW5kID0gZnVuY3Rpb24gKF8pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOb3RoaW5nKCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBlcSByZXR1cm5zIHRydWUgaWYgY29tcGFyZWQgdG8gYW5vdGhlciBOb3RoaW5nIGluc3RhbmNlLlxuICAgICAqL1xuICAgIE5vdGhpbmcucHJvdG90eXBlLmVxID0gZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgcmV0dXJuIG0gaW5zdGFuY2VvZiBOb3RoaW5nO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogb3JKdXN0IGNvbnZlcnRzIGEgTm90aGluZzxBPiB0byBhIEp1c3RcbiAgICAgKiB1c2luZyB0aGUgdmFsdWUgZnJvbSB0aGUgcHJvdmlkZWQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgTm90aGluZy5wcm90b3R5cGUub3JKdXN0ID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBKdXN0KGYoKSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBvckVsc2UgYWxsb3dzIGFuIGFsdGVybmF0aXZlIE1heWJlIHZhbHVlXG4gICAgICogdG8gYmUgcHJvdmlkZWQgc2luY2UgdGhpcyBvbmUgaXMgTm90aGluZzxBPi5cbiAgICAgKi9cbiAgICBOb3RoaW5nLnByb3RvdHlwZS5vckVsc2UgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZigpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogZ2V0IHRocm93cyBhbiBlcnJvciBiZWNhdXNlIHRoZXJlXG4gICAgICogaXMgbm90aGluZyBoZXJlIHRvIGdldC5cbiAgICAgKi9cbiAgICBOb3RoaW5nLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBnZXQgYSB2YWx1ZSBmcm9tIE5vdGhpbmchJyk7XG4gICAgfTtcbiAgICByZXR1cm4gTm90aGluZztcbn0oKSk7XG5leHBvcnRzLk5vdGhpbmcgPSBOb3RoaW5nO1xuLyoqXG4gKiBKdXN0IHJlcHJlc2VudHMgdGhlIHByZXNlbmNlIG9mIGEgdXNhYmxlIHZhbHVlLlxuICovXG52YXIgSnVzdCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBKdXN0KHZhbHVlKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogbWFwIG92ZXIgdGhlIHZhbHVlIHByZXNlbnQgaW4gdGhlIEp1c3QuXG4gICAgICovXG4gICAgSnVzdC5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBKdXN0KGYodGhpcy52YWx1ZSkpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogYXAgYWxsb3dzIGZvciBhIGZ1bmN0aW9uIHdyYXBwZWQgaW4gYSBKdXN0IHRvIGFwcGx5XG4gICAgICogdG8gdmFsdWUgcHJlc2VudCBpbiB0aGlzIEp1c3QuXG4gICAgICovXG4gICAgSnVzdC5wcm90b3R5cGUuYXAgPSBmdW5jdGlvbiAobWIpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIG1iLm1hcChmdW5jdGlvbiAoZikgeyByZXR1cm4gZihfdGhpcy52YWx1ZSk7IH0pO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogb2Ygd3JhcHMgYSB2YWx1ZSBpbiBhIEp1c3QuXG4gICAgICovXG4gICAgSnVzdC5wcm90b3R5cGUub2YgPSBmdW5jdGlvbiAoYSkge1xuICAgICAgICByZXR1cm4gbmV3IEp1c3QoYSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBjaGFpbiBhbGxvd3MgdGhlIHNlcXVlbmNpbmcgb2YgZnVuY3Rpb25zIHRoYXQgcmV0dXJuIGEgTWF5YmUuXG4gICAgICovXG4gICAgSnVzdC5wcm90b3R5cGUuY2hhaW4gPSBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZih0aGlzLnZhbHVlKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIGFsdCB3aWxsIHByZWZlciB0aGUgZmlyc3QgSnVzdCBlbmNvdW50ZXJlZCAodGhpcykuXG4gICAgICovXG4gICAgSnVzdC5wcm90b3R5cGUuYWx0ID0gZnVuY3Rpb24gKF8pIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBlbXB0eSBwcm92aWRlcyBhIGRlZmF1bHQgTWF5YmUuXG4gICAgICogTWF5YmUuZW1wdHkoKSA9IG5ldyBOb3RoaW5nKClcbiAgICAgKi9cbiAgICBKdXN0LnByb3RvdHlwZS5lbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOb3RoaW5nKCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBleHRlbmQgYWxsb3dzIHNlcXVlbmNpbmcgb2YgTWF5YmVzIHdpdGhcbiAgICAgKiBmdW5jdGlvbnMgdGhhdCB1bndyYXAgaW50byBub24gTWF5YmUgdHlwZXMuXG4gICAgICovXG4gICAgSnVzdC5wcm90b3R5cGUuZXh0ZW5kID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBKdXN0KGYodGhpcykpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogZXEgdGVzdHMgdGhlIHZhbHVlIG9mIHR3byBKdXN0cy5cbiAgICAgKi9cbiAgICBKdXN0LnByb3RvdHlwZS5lcSA9IGZ1bmN0aW9uIChtKSB7XG4gICAgICAgIHJldHVybiAoKG0gaW5zdGFuY2VvZiBKdXN0KSAmJiAobS52YWx1ZSA9PT0gdGhpcy52YWx1ZSkpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogb3JKdXN0IHJldHVybnMgdGhpcyBKdXN0LlxuICAgICAqL1xuICAgIEp1c3QucHJvdG90eXBlLm9ySnVzdCA9IGZ1bmN0aW9uIChfKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogb3JFbHNlIHJldHVybnMgdGhpcyBKdXN0XG4gICAgICovXG4gICAgSnVzdC5wcm90b3R5cGUub3JFbHNlID0gZnVuY3Rpb24gKF8pIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBnZXQgdGhlIHZhbHVlIG9mIHRoaXMgSnVzdC5cbiAgICAgKi9cbiAgICBKdXN0LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH07XG4gICAgcmV0dXJuIEp1c3Q7XG59KCkpO1xuZXhwb3J0cy5KdXN0ID0gSnVzdDtcbi8qKlxuICogb2ZcbiAqL1xuZXhwb3J0cy5vZiA9IGZ1bmN0aW9uIChhKSB7IHJldHVybiBuZXcgSnVzdChhKTsgfTtcbi8qKlxuICogbm90aGluZyBjb252ZW5pZW5jZSBjb25zdHJ1Y3RvclxuICovXG5leHBvcnRzLm5vdGhpbmcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgTm90aGluZygpOyB9O1xuLyoqXG4gKiBqdXN0IGNvbnZlbmllbmNlIGNvbnN0cnVjdG9yXG4gKi9cbmV4cG9ydHMuanVzdCA9IGZ1bmN0aW9uIChhKSB7IHJldHVybiBuZXcgSnVzdChhKTsgfTtcbi8qKlxuICogZnJvbU51bGxhYmxlIGNvbnN0cnVjdHMgYSBNYXliZSBmcm9tIGEgdmFsdWUgdGhhdCBtYXkgYmUgbnVsbC5cbiAqL1xuZXhwb3J0cy5mcm9tTnVsbGFibGUgPSBmdW5jdGlvbiAoYSkgeyByZXR1cm4gYSA9PSBudWxsID9cbiAgICBuZXcgTm90aGluZygpIDogbmV3IEp1c3QoYSk7IH07XG4vKipcbiAqIGZyb21BcnJheSBjaGVja3MgYW4gYXJyYXkgdG8gc2VlIGlmIGl0J3MgZW1wdHlcbiAqXG4gKiBSZXR1cm5zIFtbTm90aGluZ11dIGlmIGl0IGlzLCBbW0p1c3RdXSBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydHMuZnJvbUFycmF5ID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gKGEubGVuZ3RoID09PSAwKSA/IG5ldyBOb3RoaW5nKCkgOiBuZXcgSnVzdChhKTtcbn07XG4vKipcbiAqIGZyb21PYmplY3QgdXNlcyBPYmplY3Qua2V5cyB0byB0dXJuIHNlZSBpZiBhbiBvYmplY3RcbiAqIGhhcyBhbnkgb3duIHByb3BlcnRpZXMuXG4gKi9cbmV4cG9ydHMuZnJvbU9iamVjdCA9IGZ1bmN0aW9uIChvKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG8pLmxlbmd0aCA9PT0gMCA/IG5ldyBOb3RoaW5nKCkgOiBuZXcgSnVzdChvKTtcbn07XG4vKipcbiAqIGZyb21TdHJpbmcgY29uc3RydWN0cyBOb3RoaW5nPEE+IGlmIHRoZSBzdHJpbmcgaXMgZW1wdHkgb3IgSnVzdDxBPiBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydHMuZnJvbVN0cmluZyA9IGZ1bmN0aW9uIChzKSB7XG4gICAgcmV0dXJuIChzID09PSAnJykgPyBuZXcgTm90aGluZygpIDogbmV3IEp1c3Qocyk7XG59O1xuLyoqXG4gKiBmcm9tQm9vbGVhbiBjb25zdHJ1Y3RzIE5vdGhpbmcgaWYgYiBpcyBmYWxzZSwgSnVzdDxBPiBvdGhlcndpc2VcbiAqL1xuZXhwb3J0cy5mcm9tQm9vbGVhbiA9IGZ1bmN0aW9uIChiKSB7XG4gICAgcmV0dXJuIChiID09PSBmYWxzZSkgPyBuZXcgTm90aGluZygpIDogbmV3IEp1c3QoYik7XG59O1xuLyoqXG4gKiBmcm9tTnVtYmVyIGNvbnN0cnVjdHMgTm90aGluZyBpZiBuIGlzIDAgSnVzdDxBPiBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydHMuZnJvbU51bWJlciA9IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIChuID09PSAwKSA/IG5ldyBOb3RoaW5nKCkgOiBuZXcgSnVzdChuKTtcbn07XG4vKipcbiAqIGZyb21OYU4gY29uc3RydWN0cyBOb3RoaW5nIGlmIGEgdmFsdWUgaXMgbm90IGEgbnVtYmVyIG9yXG4gKiBKdXN0PEE+IG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0cy5mcm9tTmFOID0gZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gaXNOYU4obikgPyBuZXcgTm90aGluZygpIDogbmV3IEp1c3Qobik7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWF5YmUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIFRoZSByZWNvcmQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyBmb3IgdHJlYXRpbmcgRVMgb2JqZWN0cyBhcyByZWNvcmRzLlxuICpcbiAqIFNvbWUgb2YgdGhlIGZ1bmN0aW9ucyBwcm92aWRlZCBoZXJlIGFyZSBpbmhlcmVudGx5IHVuc2FmZSAodHNjIHdpbGwgbm90XG4gKiBiZSBhYmxlIHRyYWNrIGludGVncml0eSBhbmQgbWF5IHJlc3VsdCBpbiBydW50aW1lIGVycm9ycyBpZiBub3QgdXNlZCBjYXJlZnVsbHkuXG4gKi9cbnZhciB0eXBlXzEgPSByZXF1aXJlKFwiLi4vZGF0YS90eXBlXCIpO1xudmFyIGFycmF5XzEgPSByZXF1aXJlKFwiLi9hcnJheVwiKTtcbi8qKlxuICogaXNSZWNvcmQgdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIGEgcmVjb3JkLlxuICpcbiAqIFRoaXMgaXMgYSB0eXBlb2YgY2hlY2sgdGhhdCBleGNsdWRlcyBhcnJheXMuXG4gKlxuICogVW5zYWZlLlxuICovXG5leHBvcnRzLmlzUmVjb3JkID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSAmJiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKTtcbn07XG4vKipcbiAqIGtleXMgcHJvZHVjZXMgYSBsaXN0IG9mIHByb3BlcnR5IG5hbWVzIGZyb20gYSBSZWNvcmQuXG4gKi9cbmV4cG9ydHMua2V5cyA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gT2JqZWN0LmtleXModmFsdWUpOyB9O1xuLyoqXG4gKiBtYXAgb3ZlciBhIFJlY29yZCdzIHByb3BlcnRpZXMgcHJvZHVjaW5nIGEgbmV3IHJlY29yZC5cbiAqXG4gKiBUaGUgb3JkZXIgb2Yga2V5cyBwcm9jZXNzZWQgaXMgbm90IGd1YXJhbnRlZWQuXG4gKi9cbmV4cG9ydHMubWFwID0gZnVuY3Rpb24gKG8sIGYpIHtcbiAgICByZXR1cm4gZXhwb3J0cy5rZXlzKG8pLnJlZHVjZShmdW5jdGlvbiAocCwgaykge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIHJldHVybiBleHBvcnRzLm1lcmdlKHAsIChfYSA9IHt9LCBfYVtrXSA9IGYob1trXSwgaywgbyksIF9hKSk7XG4gICAgfSwge30pO1xufTtcbi8qKlxuICogcmVkdWNlIGEgUmVjb3JkJ3Mga2V5cyB0byBhIHNpbmdsZSB2YWx1ZS5cbiAqXG4gKiBUaGUgaW5pdGlhbCB2YWx1ZSAoYWNjdW0pIG11c3QgYmUgc3VwcGxpZWQgdG8gYXZvaWQgZXJyb3JzIHdoZW5cbiAqIHRoZXJlIGFyZSBubyBwcm9wZXJpdGVzIG9uIHRoZSBSZWNvcmQuXG4gKiBUaGUgb3JkZXIgb2Yga2V5cyBwcm9jZXNzZWQgaXMgbm90IGd1YXJhbnRlZWQuXG4gKi9cbmV4cG9ydHMucmVkdWNlID0gZnVuY3Rpb24gKG8sIGFjY3VtLCBmKSB7XG4gICAgcmV0dXJuIGV4cG9ydHMua2V5cyhvKS5yZWR1Y2UoZnVuY3Rpb24gKHAsIGspIHsgcmV0dXJuIGYocCwgb1trXSwgayk7IH0sIGFjY3VtKTtcbn07XG4vKipcbiAqIG1lcmdlIHR3byBvYmplY3RzIGludG8gb25lLlxuICpcbiAqIFRoZSByZXR1cm4gdmFsdWUncyB0eXBlIGlzIHRoZSBwcm9kdWN0IG9mIHRoZSB0d28gdHlwZXMgc3VwcGxpZWQuXG4gKiBUaGlzIGZ1bmN0aW9uIG1heSBiZSB1bnNhZmUuXG4gKi9cbmV4cG9ydHMubWVyZ2UgPSBmdW5jdGlvbiAobGVmdCwgcmlnaHQpIHsgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGxlZnQsIHJpZ2h0KTsgfTtcbi8qKlxuICogbWVyZ2UzIG1lcmdlcyAzIHJlY29yZHMgaW50byBvbmUuXG4gKi9cbmV4cG9ydHMubWVyZ2UzID0gZnVuY3Rpb24gKHIsIHMsIHQpIHsgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHIsIHMsIHQpOyB9O1xuLyoqXG4gKiBtZXJnZTQgbWVyZ2VzIDQgcmVjb3JkcyBpbnRvIG9uZS5cbiAqL1xuZXhwb3J0cy5tZXJnZTQgPSBmdW5jdGlvbiAociwgcywgdCwgdSkgeyByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgciwgcywgdCwgdSk7IH07XG4vKipcbiAqIG1lcmdlNSBtZXJnZXMgNSByZWNvcmRzIGludG8gb25lLlxuICovXG5leHBvcnRzLm1lcmdlNSA9IGZ1bmN0aW9uIChyLCBzLCB0LCB1LCB2KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHIsIHMsIHQsIHUsIHYpO1xufTtcbi8qKlxuICogcm1lcmdlIG1lcmdlcyAyIHJlY29yZHMgcmVjdXJzaXZlbHkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBtYXkgYmUgdW5zYWZlLlxuICovXG5leHBvcnRzLnJtZXJnZSA9IGZ1bmN0aW9uIChsZWZ0LCByaWdodCkge1xuICAgIHJldHVybiBleHBvcnRzLnJlZHVjZShyaWdodCwgbGVmdCwgZGVlcE1lcmdlKTtcbn07XG4vKipcbiAqIHJtZXJnZTMgbWVyZ2VzIDMgcmVjb3JkcyByZWN1cnNpdmVseS5cbiAqL1xuZXhwb3J0cy5ybWVyZ2UzID0gZnVuY3Rpb24gKHIsIHMsIHQpIHtcbiAgICByZXR1cm4gW3MsIHRdXG4gICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24gKHAsIGMpIHtcbiAgICAgICAgcmV0dXJuIGV4cG9ydHMucmVkdWNlKGMsIChwKSwgZGVlcE1lcmdlKTtcbiAgICB9LCByKTtcbn07XG4vKipcbiAqIHJtZXJnZTQgbWVyZ2VzIDQgcmVjb3JkcyByZWN1cnNpdmVseS5cbiAqL1xuZXhwb3J0cy5ybWVyZ2U0ID0gZnVuY3Rpb24gKHIsIHMsIHQsIHUpIHtcbiAgICByZXR1cm4gW3MsIHQsIHVdXG4gICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24gKHAsIGMpIHtcbiAgICAgICAgcmV0dXJuIGV4cG9ydHMucmVkdWNlKGMsIChwKSwgZGVlcE1lcmdlKTtcbiAgICB9LCByKTtcbn07XG4vKipcbiAqIHJtZXJnZTUgbWVyZ2VzIDUgcmVjb3JkcyByZWN1cnNpdmVseS5cbiAqL1xuZXhwb3J0cy5ybWVyZ2U1ID0gZnVuY3Rpb24gKHIsIHMsIHQsIHUsIHYpIHtcbiAgICByZXR1cm4gW3MsIHQsIHUsIHZdXG4gICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24gKHAsIGMpIHtcbiAgICAgICAgcmV0dXJuIGV4cG9ydHMucmVkdWNlKGMsIChwKSwgZGVlcE1lcmdlKTtcbiAgICB9LCByKTtcbn07XG52YXIgZGVlcE1lcmdlID0gZnVuY3Rpb24gKHByZSwgY3Vyciwga2V5KSB7XG4gICAgdmFyIF9hLCBfYjtcbiAgICByZXR1cm4gZXhwb3J0cy5pc1JlY29yZChjdXJyKSA/XG4gICAgICAgIGV4cG9ydHMubWVyZ2UocHJlLCAoX2EgPSB7fSxcbiAgICAgICAgICAgIF9hW2tleV0gPSBleHBvcnRzLmlzUmVjb3JkKHByZVtrZXldKSA/XG4gICAgICAgICAgICAgICAgZXhwb3J0cy5ybWVyZ2UocHJlW2tleV0sIGN1cnIpIDpcbiAgICAgICAgICAgICAgICBjdXJyLFxuICAgICAgICAgICAgX2EpKSA6XG4gICAgICAgIGV4cG9ydHMubWVyZ2UocHJlLCAoX2IgPSB7fSwgX2Jba2V5XSA9IGN1cnIsIF9iKSk7XG59O1xuLyoqXG4gKiBleGNsdWRlIHJlbW92ZXMgdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzIGZyb20gYSBSZWNvcmQuXG4gKi9cbmV4cG9ydHMuZXhjbHVkZSA9IGZ1bmN0aW9uIChvLCBrZXlzKSB7XG4gICAgdmFyIGxpc3QgPSBBcnJheS5pc0FycmF5KGtleXMpID8ga2V5cyA6IFtrZXlzXTtcbiAgICByZXR1cm4gZXhwb3J0cy5yZWR1Y2Uobywge30sIGZ1bmN0aW9uIChwLCBjLCBrKSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgcmV0dXJuIGxpc3QuaW5kZXhPZihrKSA+IC0xID8gcCA6IGV4cG9ydHMubWVyZ2UocCwgKF9hID0ge30sIF9hW2tdID0gYywgX2EpKTtcbiAgICB9KTtcbn07XG4vKipcbiAqIGZsYXR0ZW4gYW4gb2JqZWN0IGludG8gYSBtYXAgb2Yga2V5IHZhbHVlIHBhaXJzLlxuICpcbiAqIFRoZSBrZXlzIGFyZSB0aGUgcGF0aHMgb24gdGhlIG9iamVjdHMgd2hlcmUgdGhlIHZhbHVlIHdvdWxkIGhhdmUgYmVlblxuICogZm91bmQuXG4gKlxuICogTm90ZTogVGhpcyBmdW5jdGlvbiBkb2VzIG5vdCBnaXZlIHNwZWNpYWwgdHJlYXRtZW50IHRvIHByb3BlcnRpZXNcbiAqIHdpdGggZG90cyBpbiB0aGVtLlxuICovXG5leHBvcnRzLmZsYXR0ZW4gPSBmdW5jdGlvbiAocikge1xuICAgIHJldHVybiAoZmxhdEltcGwoJycpKHt9KShyKSk7XG59O1xudmFyIGZsYXRJbXBsID0gZnVuY3Rpb24gKHBmaXgpIHsgcmV0dXJuIGZ1bmN0aW9uIChwcmV2KSB7IHJldHVybiBmdW5jdGlvbiAocikge1xuICAgIHJldHVybiBleHBvcnRzLnJlZHVjZShyLCBwcmV2LCBmdW5jdGlvbiAocCwgYywgaykge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIHJldHVybiB0eXBlXzEuaXNPYmplY3QoYykgP1xuICAgICAgICAgICAgKGZsYXRJbXBsKHByZWZpeChwZml4LCBrKSkocCkoYykpIDpcbiAgICAgICAgICAgIGV4cG9ydHMubWVyZ2UocCwgKF9hID0ge30sIF9hW3ByZWZpeChwZml4LCBrKV0gPSBjLCBfYSkpO1xuICAgIH0pO1xufTsgfTsgfTtcbnZhciBwcmVmaXggPSBmdW5jdGlvbiAocGZpeCwga2V5KSB7IHJldHVybiAocGZpeCA9PT0gJycpID9cbiAgICBrZXkgOiBwZml4ICsgXCIuXCIgKyBrZXk7IH07XG4vKipcbiAqIHBhcnRpdGlvbiBhIFJlY29yZCBpbnRvIHR3byBzdWItcmVjb3JkcyB1c2luZyBhIHNlcGFyYXRpbmcgZnVuY3Rpb24uXG4gKlxuICogVGhpcyBmdW5jdGlvbiBwcm9kdWNlcyBhbiBhcnJheSB3aGVyZSB0aGUgZmlyc3QgZWxlbWVudCBpcyBhIHJlY29yZFxuICogb2YgcGFzc2luZyB2YWx1ZXMgYW5kIHRoZSBzZWNvbmQgdGhlIGZhaWxpbmcgdmFsdWVzLlxuICovXG5leHBvcnRzLnBhcnRpdGlvbiA9IGZ1bmN0aW9uIChyKSB7IHJldHVybiBmdW5jdGlvbiAoZikge1xuICAgIHJldHVybiBleHBvcnRzLnJlZHVjZShyLCBbe30sIHt9XSwgZnVuY3Rpb24gKF9hLCBjLCBrKSB7XG4gICAgICAgIHZhciB5ZXMgPSBfYVswXSwgbm8gPSBfYVsxXTtcbiAgICAgICAgdmFyIF9iLCBfYztcbiAgICAgICAgcmV0dXJuIGYoYywgaywgcikgP1xuICAgICAgICAgICAgW2V4cG9ydHMubWVyZ2UoeWVzLCAoX2IgPSB7fSwgX2Jba10gPSBjLCBfYikpLCBub10gOlxuICAgICAgICAgICAgW3llcywgZXhwb3J0cy5tZXJnZShubywgKF9jID0ge30sIF9jW2tdID0gYywgX2MpKV07XG4gICAgfSk7XG59OyB9O1xuLyoqXG4gKiBncm91cCB0aGUgcHJvcGVydGllcyBvZiBhIFJlY29yZCBpbnRvIGFub3RoZXIgUmVjb3JkIHVzaW5nIGEgZ3JvdXBpbmdcbiAqIGZ1bmN0aW9uLlxuICovXG5leHBvcnRzLmdyb3VwID0gZnVuY3Rpb24gKHIpIHsgcmV0dXJuIGZ1bmN0aW9uIChmKSB7XG4gICAgcmV0dXJuIGV4cG9ydHMucmVkdWNlKHIsIHt9LCBmdW5jdGlvbiAocCwgYywgaykge1xuICAgICAgICB2YXIgX2EsIF9iLCBfYztcbiAgICAgICAgdmFyIGcgPSBmKGMsIGssIHIpO1xuICAgICAgICByZXR1cm4gZXhwb3J0cy5tZXJnZShwLCAoX2EgPSB7fSxcbiAgICAgICAgICAgIF9hW2ddID0gZXhwb3J0cy5pc1JlY29yZChwW2ddKSA/XG4gICAgICAgICAgICAgICAgZXhwb3J0cy5tZXJnZShwW2ddLCAoX2IgPSB7fSwgX2Jba10gPSBjLCBfYikpIDogKF9jID0ge30sIF9jW2tdID0gYywgX2MpLFxuICAgICAgICAgICAgX2EpKTtcbiAgICB9KTtcbn07IH07XG4vKipcbiAqIHZhbHVlcyByZXR1cm5zIGEgc2hhbGxvdyBhcnJheSBvZiB0aGUgdmFsdWVzIG9mIGEgcmVjb3JkLlxuICovXG5leHBvcnRzLnZhbHVlcyA9IGZ1bmN0aW9uIChyKSB7XG4gICAgcmV0dXJuIGV4cG9ydHMucmVkdWNlKHIsIFtdLCBmdW5jdGlvbiAocCwgYykgeyByZXR1cm4gYXJyYXlfMS5jb25jYXQocCkoYyk7IH0pO1xufTtcbi8qKlxuICogY29udGFpbnMgaW5kaWNhdGVzIHdoZXRoZXIgYSBSZWNvcmQgaGFzIGEgZ2l2ZW4ga2V5LlxuICovXG5leHBvcnRzLmNvbnRhaW5zID0gZnVuY3Rpb24gKHIsIGtleSkge1xuICAgIHJldHVybiBPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChyLCBrZXkpO1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlY29yZC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogc3RhcnRzV2l0aCBwb2x5ZmlsbC5cbiAqL1xuZXhwb3J0cy5zdGFydHNXaXRoID0gZnVuY3Rpb24gKHN0ciwgc2VhcmNoLCBwb3MpIHtcbiAgICBpZiAocG9zID09PSB2b2lkIDApIHsgcG9zID0gMDsgfVxuICAgIHJldHVybiBzdHIuc3Vic3RyKCFwb3MgfHwgcG9zIDwgMCA/IDAgOiArcG9zLCBzZWFyY2gubGVuZ3RoKSA9PT0gc2VhcmNoO1xufTtcbi8qKlxuICogZW5kc1dpdGggcG9seWZpbGwuXG4gKi9cbmV4cG9ydHMuZW5kc1dpdGggPSBmdW5jdGlvbiAoc3RyLCBzZWFyY2gsIHRoaXNfbGVuKSB7XG4gICAgaWYgKHRoaXNfbGVuID09PSB2b2lkIDApIHsgdGhpc19sZW4gPSBzdHIubGVuZ3RoOyB9XG4gICAgcmV0dXJuICh0aGlzX2xlbiA9PT0gdW5kZWZpbmVkIHx8IHRoaXNfbGVuID4gc3RyLmxlbmd0aCkgP1xuICAgICAgICB0aGlzX2xlbiA9IHN0ci5sZW5ndGggOlxuICAgICAgICBzdHIuc3Vic3RyaW5nKHRoaXNfbGVuIC0gc2VhcmNoLmxlbmd0aCwgdGhpc19sZW4pID09PSBzZWFyY2g7XG59O1xuLyoqXG4gKiBjb250YWlucyB1c2VzIFN0cmluZyNpbmRleE9mIHRvIGRldGVybWluZSBpZiBhIHN1YnN0cmluZyBvY2N1cnNcbiAqIGluIGEgc3RyaW5nLlxuICovXG5leHBvcnRzLmNvbnRhaW5zID0gZnVuY3Rpb24gKHN0ciwgbWF0Y2gpIHsgcmV0dXJuIChzdHIuaW5kZXhPZihtYXRjaCkgPiAtMSk7IH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdHJpbmcuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKipcbiAqIHRlc3QgcHJvdmlkZXMgYmFzaWMgdHlwZSB0ZXN0cyBjb21tb24gd2hlbiB3b3JraW5nIHdpdGggRUNNQVNjcmlwdC5cbiAqL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHByaW1zID0gWydzdHJpbmcnLCAnbnVtYmVyJywgJ2Jvb2xlYW4nXTtcbi8qKlxuICogQW55IGlzIGEgY2xhc3MgdXNlZCB0byByZXByZXNlbnQgdHlwZXNjcmlwdCdzIFwiYW55XCIgdHlwZS5cbiAqL1xudmFyIEFueSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBbnkoKSB7XG4gICAgfVxuICAgIHJldHVybiBBbnk7XG59KCkpO1xuZXhwb3J0cy5BbnkgPSBBbnk7XG4vKipcbiAqIGlzT2JqZWN0IHRlc3QuXG4gKlxuICogRG9lcyBub3QgY29uc2lkZXIgYW4gQXJyYXkgYW4gb2JqZWN0LlxuICovXG5leHBvcnRzLmlzT2JqZWN0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSAmJiAoIWV4cG9ydHMuaXNBcnJheSh2YWx1ZSkpO1xufTtcbi8qKlxuICogaXNBcnJheSB0ZXN0LlxuICovXG5leHBvcnRzLmlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuLyoqXG4gKiBpc1N0cmluZyB0ZXN0LlxuICovXG5leHBvcnRzLmlzU3RyaW5nID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnOyB9O1xuLyoqXG4gKiBpc051bWJlciB0ZXN0LlxuICovXG5leHBvcnRzLmlzTnVtYmVyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSAmJiAoIWlzTmFOKHZhbHVlKSk7XG59O1xuLyoqXG4gKiBpc0Jvb2xlYW4gdGVzdC5cbiAqL1xuZXhwb3J0cy5pc0Jvb2xlYW4gPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nOyB9O1xuLyoqXG4gKiBpc0Z1bmN0aW9uIHRlc3QuXG4gKi9cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nOyB9O1xuLyoqXG4gKiBpc1ByaW0gdGVzdC5cbiAqL1xuZXhwb3J0cy5pc1ByaW0gPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gIShleHBvcnRzLmlzT2JqZWN0KHZhbHVlKSB8fFxuICAgICAgICBleHBvcnRzLmlzQXJyYXkodmFsdWUpIHx8XG4gICAgICAgIGV4cG9ydHMuaXNGdW5jdGlvbih2YWx1ZSkpO1xufTtcbi8qKlxuICogaXMgcGVyZm9ybXMgYSB0eXBlb2Ygb2YgY2hlY2sgb24gYSB0eXBlLlxuICovXG5leHBvcnRzLmlzID0gZnVuY3Rpb24gKGV4cGVjdGVkKSB7IHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHR5cGVvZiAodmFsdWUpID09PSBleHBlY3RlZDsgfTsgfTtcbi8qKlxuICogdGVzdCB3aGV0aGVyIGEgdmFsdWUgY29uZm9ybXMgdG8gc29tZSBwYXR0ZXJuLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgbWFkZSBhdmFpbGFibGUgbWFpbmx5IGZvciBhIGNydWRlIHBhdHRlcm4gbWF0Y2hpbmdcbiAqIG1hY2hpbmVyeSB0aGF0IHdvcmtzIGFzIGZvbGxvd3NzOlxuICogc3RyaW5nICAgLT4gTWF0Y2hlcyBvbiB0aGUgdmFsdWUgb2YgdGhlIHN0cmluZy5cbiAqIG51bWJlciAgIC0+IE1hdGNoZXMgb24gdGhlIHZhbHVlIG9mIHRoZSBudW1iZXIuXG4gKiBib29sZWFuICAtPiBNYXRjaGVzIG9uIHRoZSB2YWx1ZSBvZiB0aGUgYm9vbGVhbi5cbiAqIG9iamVjdCAgIC0+IEVhY2gga2V5IG9mIHRoZSBvYmplY3QgaXMgbWF0Y2hlZCBvbiB0aGUgdmFsdWUsIGFsbCBtdXN0IG1hdGNoLlxuICogZnVuY3Rpb24gLT4gVHJlYXRlZCBhcyBhIGNvbnN0cnVjdG9yIGFuZCByZXN1bHRzIGluIGFuIGluc3RhbmNlb2YgY2hlY2sgb3JcbiAqICAgICAgICAgICAgIGZvciBTdHJpbmcsTnVtYmVyIGFuZCBCb29sZWFuLCB0aGlzIHVzZXMgdGhlIHR5cGVvZiBjaGVjay4gSWZcbiAqICAgICAgICAgICAgIHRoZSBmdW5jdGlvbiBpcyBSZWdFeHAgdGhlbiB3ZSB1c2VzIHRoZSBSZWdFeHAudGVzdCBmdW5jdGlvblxuICogICAgICAgICAgICAgaW5zdGVhZC5cbiAqL1xuZXhwb3J0cy50ZXN0ID0gZnVuY3Rpb24gKHZhbHVlLCB0KSB7XG4gICAgcmV0dXJuICgocHJpbXMuaW5kZXhPZih0eXBlb2YgdCkgPiAtMSkgJiYgKHZhbHVlID09PSB0KSkgP1xuICAgICAgICB0cnVlIDpcbiAgICAgICAgKCh0eXBlb2YgdCA9PT0gJ2Z1bmN0aW9uJykgJiZcbiAgICAgICAgICAgICgoKHQgPT09IFN0cmluZykgJiYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpKSB8fFxuICAgICAgICAgICAgICAgICgodCA9PT0gTnVtYmVyKSAmJiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykpIHx8XG4gICAgICAgICAgICAgICAgKCh0ID09PSBCb29sZWFuKSAmJiAodHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpKSB8fFxuICAgICAgICAgICAgICAgICgodCA9PT0gQXJyYXkpICYmIChBcnJheS5pc0FycmF5KHZhbHVlKSkpIHx8XG4gICAgICAgICAgICAgICAgKHQgPT09IEFueSkgfHxcbiAgICAgICAgICAgICAgICAodmFsdWUgaW5zdGFuY2VvZiB0KSkpID9cbiAgICAgICAgICAgIHRydWUgOlxuICAgICAgICAgICAgKCh0IGluc3RhbmNlb2YgUmVnRXhwKSAmJiAoKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpICYmIHQudGVzdCh2YWx1ZSkpKSA/XG4gICAgICAgICAgICAgICAgdHJ1ZSA6XG4gICAgICAgICAgICAgICAgKCh0eXBlb2YgdCA9PT0gJ29iamVjdCcpICYmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSkgP1xuICAgICAgICAgICAgICAgICAgICBPYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC5rZXlzKHQpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZXZlcnkoZnVuY3Rpb24gKGspIHsgcmV0dXJuIHZhbHVlLmhhc093blByb3BlcnR5KGspID9cbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydHMudGVzdCh2YWx1ZVtrXSwgdFtrXSkgOiBmYWxzZTsgfSkgOlxuICAgICAgICAgICAgICAgICAgICBmYWxzZTtcbn07XG4vKipcbiAqIHNob3cgdGhlIHR5cGUgb2YgYSB2YWx1ZS5cbiAqXG4gKiBOb3RlOiBUaGlzIG1heSBjcmFzaCBpZiB0aGUgdmFsdWUgaXMgYW5cbiAqIG9iamVjdCBsaXRlcmFsIHdpdGggcmVjdXJzaXZlIHJlZmVyZW5jZXMuXG4gKi9cbmV4cG9ydHMuc2hvdyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSlcbiAgICAgICAgICAgIHJldHVybiBcIltcIiArIHZhbHVlLm1hcChleHBvcnRzLnNob3cpICsgXCJdXCI7XG4gICAgICAgIGVsc2UgaWYgKHZhbHVlLmNvbnN0cnVjdG9yICE9PSBPYmplY3QpXG4gICAgICAgICAgICByZXR1cm4gKHZhbHVlLmNvbnN0cnVjdG9yLm5hbWUgfHwgdmFsdWUuY29uc3RydWN0b3IpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuICcnICsgdmFsdWU7XG4gICAgfVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXR5cGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgYXJyYXlfMSA9IHJlcXVpcmUoXCJAcXVlbmsvbm9uaS9saWIvZGF0YS9hcnJheVwiKTtcbmV4cG9ydHMuU0VQRVJBVE9SID0gJy8nO1xuZXhwb3J0cy5BRERSRVNTX0RJU0NBUkQgPSAnPyc7XG5leHBvcnRzLkFERFJFU1NfU1lTVEVNID0gJyQnO1xuZXhwb3J0cy5BRERSRVNTX0VNUFRZID0gJyc7XG5leHBvcnRzLkFERFJFU1NfUkVTVFJJQ1RFRCA9IFtcbiAgICBleHBvcnRzLkFERFJFU1NfRElTQ0FSRCxcbiAgICBleHBvcnRzLkFERFJFU1NfU1lTVEVNLFxuICAgIGV4cG9ydHMuU0VQRVJBVE9SXG5dO1xuLyoqXG4gKiBpc1Jlc3RyaWN0ZWQgaW5kaWNhdGVzIHdoZXRoZXIgYW4gYWN0b3IgaWQgaXMgcmVzdHJpY3RlZCBvciBub3QuXG4gKi9cbmV4cG9ydHMuaXNSZXN0cmljdGVkID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgcmV0dXJuICgoZXhwb3J0cy5BRERSRVNTX1JFU1RSSUNURUQuc29tZShmdW5jdGlvbiAoYSkgeyByZXR1cm4gaWQuaW5kZXhPZihhKSA+IC0xOyB9KSkgJiYgKGlkICE9PSBleHBvcnRzLlNFUEVSQVRPUikpO1xufTtcbi8qKlxuICogbWFrZSBhIGNoaWxkIGFkZHJlc3MgZ2l2ZW4gaXRzIGlkIGFuZCBwYXJlbnQgYWRkcmVzcy5cbiAqL1xuZXhwb3J0cy5tYWtlID0gZnVuY3Rpb24gKHBhcmVudCwgaWQpIHtcbiAgICByZXR1cm4gKChwYXJlbnQgPT09IGV4cG9ydHMuU0VQRVJBVE9SKSB8fCAocGFyZW50ID09PSBleHBvcnRzLkFERFJFU1NfRU1QVFkpKSA/XG4gICAgICAgIFwiXCIgKyBwYXJlbnQgKyBpZCA6XG4gICAgICAgIChwYXJlbnQgPT09IGV4cG9ydHMuQUREUkVTU19TWVNURU0pID9cbiAgICAgICAgICAgIGlkIDpcbiAgICAgICAgICAgIFwiXCIgKyBwYXJlbnQgKyBleHBvcnRzLlNFUEVSQVRPUiArIGlkO1xufTtcbi8qKlxuICogZ2V0UGFyZW50IGNvbXB1dGVzIHRoZSBwYXJlbnQgb2YgYW4gQWRkcmVzcy5cbiAqL1xuZXhwb3J0cy5nZXRQYXJlbnQgPSBmdW5jdGlvbiAoYWRkcikge1xuICAgIGlmICgoKGFkZHIgPT09IGV4cG9ydHMuQUREUkVTU19TWVNURU0pIHx8XG4gICAgICAgIChhZGRyID09PSBleHBvcnRzLkFERFJFU1NfRU1QVFkpIHx8XG4gICAgICAgIChhZGRyID09PSBleHBvcnRzLkFERFJFU1NfRElTQ0FSRCkgfHwgKGFkZHIgPT09IGV4cG9ydHMuU0VQRVJBVE9SKSkpIHtcbiAgICAgICAgcmV0dXJuIGV4cG9ydHMuQUREUkVTU19TWVNURU07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgYjQgPSBhZGRyLnNwbGl0KGV4cG9ydHMuU0VQRVJBVE9SKTtcbiAgICAgICAgaWYgKChiNC5sZW5ndGggPT09IDIpICYmIChiNFswXSA9PT0gJycpKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhwb3J0cy5TRVBFUkFUT1I7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgYSA9IGI0XG4gICAgICAgICAgICAgICAgLnJldmVyc2UoKVxuICAgICAgICAgICAgICAgIC5zbGljZSgxKVxuICAgICAgICAgICAgICAgIC5yZXZlcnNlKClcbiAgICAgICAgICAgICAgICAuam9pbihleHBvcnRzLlNFUEVSQVRPUik7XG4gICAgICAgICAgICByZXR1cm4gYSA9PT0gZXhwb3J0cy5BRERSRVNTX0VNUFRZID8gZXhwb3J0cy5BRERSRVNTX1NZU1RFTSA6IGE7XG4gICAgICAgIH1cbiAgICB9XG59O1xuLyoqXG4gKiBnZXRJZCBwcm92aWRlcyB0aGUgaWQgcGFydCBvZiBhbiBhY3RvciBhZGRyZXNzLlxuICovXG5leHBvcnRzLmdldElkID0gZnVuY3Rpb24gKGFkZHIpIHtcbiAgICByZXR1cm4gKChhZGRyID09PSBleHBvcnRzLkFERFJFU1NfU1lTVEVNKSB8fFxuICAgICAgICAoYWRkciA9PT0gZXhwb3J0cy5BRERSRVNTX0RJU0NBUkQpIHx8XG4gICAgICAgIChhZGRyID09PSBleHBvcnRzLkFERFJFU1NfRU1QVFkpIHx8XG4gICAgICAgIChhZGRyID09PSBleHBvcnRzLlNFUEVSQVRPUikpID9cbiAgICAgICAgYWRkciA6XG4gICAgICAgIGFycmF5XzEudGFpbChhZGRyLnNwbGl0KGV4cG9ydHMuU0VQRVJBVE9SKSk7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRkcmVzcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogRW52ZWxvcGUgZm9yIG1lc3NhZ2VzLlxuICpcbiAqIFVzZWQgdG8gaW50ZXJuYWxseSBrZWVwIHRyYWNrIG9mIG1lc3NhZ2Ugc291cmNlcyBhbmQgZGVzdGludGF0aW9ucy5cbiAqL1xudmFyIEVudmVsb3BlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEVudmVsb3BlKHRvLCBmcm9tLCBtZXNzYWdlKSB7XG4gICAgICAgIHRoaXMudG8gPSB0bztcbiAgICAgICAgdGhpcy5mcm9tID0gZnJvbTtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICB9XG4gICAgcmV0dXJuIEVudmVsb3BlO1xufSgpKTtcbmV4cG9ydHMuRW52ZWxvcGUgPSBFbnZlbG9wZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1haWxib3guanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0eXBlXzEgPSByZXF1aXJlKFwiQHF1ZW5rL25vbmkvbGliL2RhdGEvdHlwZVwiKTtcbnZhciBlaXRoZXJfMSA9IHJlcXVpcmUoXCJAcXVlbmsvbm9uaS9saWIvZGF0YS9laXRoZXJcIik7XG52YXIgbWF5YmVfMSA9IHJlcXVpcmUoXCJAcXVlbmsvbm9uaS9saWIvZGF0YS9tYXliZVwiKTtcbnZhciBmdW5jdGlvbl8xID0gcmVxdWlyZShcIkBxdWVuay9ub25pL2xpYi9kYXRhL2Z1bmN0aW9uXCIpO1xudmFyIGFkZHJlc3NfMSA9IHJlcXVpcmUoXCIuL2FkZHJlc3NcIik7XG52YXIgc3Bhd25fMSA9IHJlcXVpcmUoXCIuL3N5c3RlbS9vcC9zcGF3blwiKTtcbnZhciB0ZWxsXzEgPSByZXF1aXJlKFwiLi9zeXN0ZW0vb3AvdGVsbFwiKTtcbnZhciBraWxsXzEgPSByZXF1aXJlKFwiLi9zeXN0ZW0vb3Ava2lsbFwiKTtcbnZhciBkcm9wXzEgPSByZXF1aXJlKFwiLi9zeXN0ZW0vb3AvZHJvcFwiKTtcbnZhciByZWNlaXZlXzEgPSByZXF1aXJlKFwiLi9zeXN0ZW0vb3AvcmVjZWl2ZVwiKTtcbnZhciBzeXN0ZW1fMSA9IHJlcXVpcmUoXCIuL3N5c3RlbVwiKTtcbi8qKlxuICogQ2FzZSBhbGxvd3MgZm9yIHRoZSBzZWxlY3RpdmUgbWF0Y2hpbmcgb2YgcGF0dGVybnNcbiAqIGZvciBwcm9jZXNzaW5nIG1lc3NhZ2VzXG4gKi9cbnZhciBDYXNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENhc2UocGF0dGVybiwgaGFuZGxlcikge1xuICAgICAgICB0aGlzLnBhdHRlcm4gPSBwYXR0ZXJuO1xuICAgICAgICB0aGlzLmhhbmRsZXIgPSBoYW5kbGVyO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBtYXRjaCBjaGVja3MgaWYgdGhlIHN1cHBsaWVkIHR5cGUgc2F0aXNmaWVzIHRoaXMgQ2FzZVxuICAgICAqL1xuICAgIENhc2UucHJvdG90eXBlLm1hdGNoID0gZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgaWYgKHR5cGVfMS50ZXN0KG0sIHRoaXMucGF0dGVybikpIHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlcihtKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gQ2FzZTtcbn0oKSk7XG5leHBvcnRzLkNhc2UgPSBDYXNlO1xuLyoqXG4gKiBBYnN0cmFjdENhc2UgaXMgcHJvdmlkZWQgZm9yIHNpdHVhdGlvbnMgd2hlcmVcbiAqIGl0IGlzIGJldHRlciB0byBleHRlbmQgdGhlIENhc2UgY2xhc3MgaW5zdGVhZCBvZiBjcmVhdGluZ1xuICogbmV3IGluc3RhbmNlcy5cbiAqL1xudmFyIEFic3RyYWN0Q2FzZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoQWJzdHJhY3RDYXNlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEFic3RyYWN0Q2FzZShwYXR0ZXJuKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIHBhdHRlcm4sIGZ1bmN0aW9uIChtKSB7IHJldHVybiBfdGhpcy5hcHBseShtKTsgfSkgfHwgdGhpcztcbiAgICAgICAgX3RoaXMucGF0dGVybiA9IHBhdHRlcm47XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIEFic3RyYWN0Q2FzZTtcbn0oQ2FzZSkpO1xuZXhwb3J0cy5BYnN0cmFjdENhc2UgPSBBYnN0cmFjdENhc2U7XG4vKipcbiAqIEFic3RyYWN0UmVzaWRlbnQgaW1wbGVlbW50YXRpb24uXG4gKi9cbnZhciBBYnN0cmFjdFJlc2lkZW50ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFic3RyYWN0UmVzaWRlbnQoc3lzdGVtKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuc3lzdGVtID0gc3lzdGVtO1xuICAgICAgICB0aGlzLnJlZiA9IGZ1bmN0aW9uIChhZGRyKSB7IHJldHVybiBmdW5jdGlvbiAobSkgeyByZXR1cm4gX3RoaXMudGVsbChhZGRyLCBtKTsgfTsgfTtcbiAgICAgICAgdGhpcy5zZWxmID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuc3lzdGVtLmlkZW50aWZ5KF90aGlzKTsgfTtcbiAgICB9XG4gICAgQWJzdHJhY3RSZXNpZGVudC5wcm90b3R5cGUuYWNjZXB0ID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciB0byA9IF9hLnRvLCBmcm9tID0gX2EuZnJvbSwgbWVzc2FnZSA9IF9hLm1lc3NhZ2U7XG4gICAgICAgIHRoaXMuc3lzdGVtLmV4ZWMobmV3IGRyb3BfMS5Ecm9wKHRvLCBmcm9tLCBtZXNzYWdlKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgQWJzdHJhY3RSZXNpZGVudC5wcm90b3R5cGUuc3Bhd24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB0aGlzLnN5c3RlbS5leGVjKG5ldyBzcGF3bl8xLlNwYXduKHRoaXMsIHQpKTtcbiAgICAgICAgcmV0dXJuIGFkZHJlc3NfMS5pc1Jlc3RyaWN0ZWQodC5pZCkgP1xuICAgICAgICAgICAgYWRkcmVzc18xLkFERFJFU1NfRElTQ0FSRCA6XG4gICAgICAgICAgICBhZGRyZXNzXzEubWFrZSh0aGlzLnNlbGYoKSwgdC5pZCk7XG4gICAgfTtcbiAgICBBYnN0cmFjdFJlc2lkZW50LnByb3RvdHlwZS50ZWxsID0gZnVuY3Rpb24gKHJlZiwgbSkge1xuICAgICAgICB0aGlzLnN5c3RlbS5leGVjKG5ldyB0ZWxsXzEuVGVsbChyZWYsIHRoaXMuc2VsZigpLCBtKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgQWJzdHJhY3RSZXNpZGVudC5wcm90b3R5cGUua2lsbCA9IGZ1bmN0aW9uIChhZGRyKSB7XG4gICAgICAgIHRoaXMuc3lzdGVtLmV4ZWMobmV3IGtpbGxfMS5LaWxsKHRoaXMsIGFkZHIpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBBYnN0cmFjdFJlc2lkZW50LnByb3RvdHlwZS5leGl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmtpbGwodGhpcy5zZWxmKCkpO1xuICAgIH07XG4gICAgQWJzdHJhY3RSZXNpZGVudC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zeXN0ZW0gPSBuZXcgc3lzdGVtXzEuTnVsbFN5c3RlbSgpO1xuICAgIH07XG4gICAgcmV0dXJuIEFic3RyYWN0UmVzaWRlbnQ7XG59KCkpO1xuZXhwb3J0cy5BYnN0cmFjdFJlc2lkZW50ID0gQWJzdHJhY3RSZXNpZGVudDtcbi8qKlxuICogSW1tdXRhYmxlIGFjdG9ycyBkbyBub3QgY2hhbmdlIHRoZWlyIGJlaGF2aW91ciBhZnRlciByZWNlaXZpbmdcbiAqIGEgbWVzc2FnZS5cbiAqXG4gKiBPbmNlIHRoZSByZWNlaXZlIHByb3BlcnR5IGlzIHByb3ZpZGVkLCBhbGwgbWVzc2FnZXMgd2lsbCBiZVxuICogZmlsdGVyZWQgYnkgaXQuXG4gKi9cbnZhciBJbW11dGFibGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEltbXV0YWJsZSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBJbW11dGFibGUoKSB7XG4gICAgICAgIHJldHVybiBfc3VwZXIgIT09IG51bGwgJiYgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgfHwgdGhpcztcbiAgICB9XG4gICAgSW1tdXRhYmxlLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgYy5iZWhhdmlvdXIucHVzaChpYmVoYXZpb3VyKHRoaXMpKTtcbiAgICAgICAgYy5tYWlsYm94ID0gbWF5YmVfMS5qdXN0KFtdKTtcbiAgICAgICAgYy5mbGFncy5pbW11dGFibGUgPSB0cnVlO1xuICAgICAgICBjLmZsYWdzLmJ1ZmZlcmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBzZWxlY3Qgbm9vcC5cbiAgICAgKi9cbiAgICBJbW11dGFibGUucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChfKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIEltbXV0YWJsZTtcbn0oQWJzdHJhY3RSZXNpZGVudCkpO1xuZXhwb3J0cy5JbW11dGFibGUgPSBJbW11dGFibGU7XG4vKipcbiAqIE11dGFibGUgYWN0b3JzIGNhbiBjaGFuZ2UgdGhlaXIgYmVoYXZpb3VyIGFmdGVyIG1lc3NhZ2UgcHJvY2Vzc2luZy5cbiAqL1xudmFyIE11dGFibGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKE11dGFibGUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gTXV0YWJsZSgpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlciAhPT0gbnVsbCAmJiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuICAgIH1cbiAgICBNdXRhYmxlLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgaWYgKHRoaXMucmVjZWl2ZS5sZW5ndGggPiAwKVxuICAgICAgICAgICAgYy5iZWhhdmlvdXIgPSBbbWJlaGF2aW91cih0aGlzLnJlY2VpdmUpXTtcbiAgICAgICAgYy5tYWlsYm94ID0gbWF5YmVfMS5qdXN0KFtdKTtcbiAgICAgICAgYy5mbGFncy5pbW11dGFibGUgPSBmYWxzZTtcbiAgICAgICAgYy5mbGFncy5idWZmZXJlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogc2VsZWN0IGFsbG93cyBmb3Igc2VsZWN0aXZlbHkgcmVjZWl2aW5nIG1lc3NhZ2VzIGJhc2VkIG9uIENhc2UgY2xhc3Nlcy5cbiAgICAgKi9cbiAgICBNdXRhYmxlLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoY2FzZXMpIHtcbiAgICAgICAgdGhpcy5zeXN0ZW0uZXhlYyhuZXcgcmVjZWl2ZV8xLlJlY2VpdmUodGhpcy5zZWxmKCksIGZhbHNlLCBtYmVoYXZpb3VyKGNhc2VzKSkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHJldHVybiBNdXRhYmxlO1xufShBYnN0cmFjdFJlc2lkZW50KSk7XG5leHBvcnRzLk11dGFibGUgPSBNdXRhYmxlO1xudmFyIG1iZWhhdmlvdXIgPSBmdW5jdGlvbiAoY2FzZXMpIHsgcmV0dXJuIGZ1bmN0aW9uIChtKSB7XG4gICAgcmV0dXJuIGVpdGhlcl8xLmZyb21Cb29sZWFuKGNhc2VzLnNvbWUoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMubWF0Y2gobSk7IH0pKVxuICAgICAgICAubG1hcChmdW5jdGlvbiAoKSB7IHJldHVybiBtOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uXzEubm9vcCk7XG59OyB9O1xudmFyIGliZWhhdmlvdXIgPSBmdW5jdGlvbiAoaSkgeyByZXR1cm4gZnVuY3Rpb24gKG0pIHtcbiAgICByZXR1cm4gZWl0aGVyXzEuZnJvbUJvb2xlYW4oaS5yZWNlaXZlLnNvbWUoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMubWF0Y2gobSk7IH0pKVxuICAgICAgICAubG1hcChmdW5jdGlvbiAoKSB7IHJldHVybiBtOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uXzEubm9vcCk7XG59OyB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cmVzaWRlbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbG9nID0gcmVxdWlyZShcIi4vbG9nXCIpO1xuZXhwb3J0cy5kZWZhdWx0cyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICh7XG4gICAgbG9nOiB7XG4gICAgICAgIGxldmVsOiBsb2cuV0FSTixcbiAgICAgICAgbG9nZ2VyOiBjb25zb2xlXG4gICAgfVxufSk7IH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb25maWd1cmF0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBTeXN0ZW1FcnJvclxuICovXG52YXIgU3lzdGVtRXJyb3IgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3lzdGVtRXJyb3IobWVzc2FnZSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIH1cbiAgICByZXR1cm4gU3lzdGVtRXJyb3I7XG59KCkpO1xuZXhwb3J0cy5TeXN0ZW1FcnJvciA9IFN5c3RlbUVycm9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZXJyb3IuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgYWRkcmVzc18xID0gcmVxdWlyZShcIi4uL2FkZHJlc3NcIik7XG52YXIgZHJvcF8xID0gcmVxdWlyZShcIi4vb3AvZHJvcFwiKTtcbnZhciBvcF8xID0gcmVxdWlyZShcIi4vb3BcIik7XG52YXIgc3RhdGVfMSA9IHJlcXVpcmUoXCIuL3N0YXRlXCIpO1xuLyoqXG4gKiBBYnN0cmFjdFN5c3RlbVxuICpcbiAqIEltcGxlbW5hdGlvbiBvZiBhIFN5c3RlbSBhbmQgRXhlY3V0b3IgdGhhdCBzcGF3bnNcbiAqIHZhcmlvdXMgZ2VuZXJhbCBwdXJwb3NlIGFjdG9ycy5cbiAqL1xudmFyIEFic3RyYWN0U3lzdGVtID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFic3RyYWN0U3lzdGVtKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT09IHZvaWQgMCkgeyBjb25maWd1cmF0aW9uID0ge307IH1cbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gY29uZmlndXJhdGlvbjtcbiAgICAgICAgdGhpcy5zdGFjayA9IFtdO1xuICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgQWJzdHJhY3RTeXN0ZW0ucHJvdG90eXBlLmV4ZWMgPSBmdW5jdGlvbiAoY29kZSkge1xuICAgICAgICB0aGlzLnN0YWNrLnB1c2goY29kZSk7XG4gICAgICAgIHRoaXMucnVuKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgQWJzdHJhY3RTeXN0ZW0ucHJvdG90eXBlLmlkZW50aWZ5ID0gZnVuY3Rpb24gKGFjdG9yKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZV8xLmdldEFkZHJlc3ModGhpcy5zdGF0ZSwgYWN0b3IpXG4gICAgICAgICAgICAub3JKdXN0KGZ1bmN0aW9uICgpIHsgcmV0dXJuIGFkZHJlc3NfMS5BRERSRVNTX0RJU0NBUkQ7IH0pXG4gICAgICAgICAgICAuZ2V0KCk7XG4gICAgfTtcbiAgICBBYnN0cmFjdFN5c3RlbS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG4gICAgQWJzdHJhY3RTeXN0ZW0ucHJvdG90eXBlLmFjY2VwdCA9IGZ1bmN0aW9uIChfYSkge1xuICAgICAgICB2YXIgdG8gPSBfYS50bywgZnJvbSA9IF9hLmZyb20sIG1lc3NhZ2UgPSBfYS5tZXNzYWdlO1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjKG5ldyBkcm9wXzEuRHJvcCh0bywgZnJvbSwgbWVzc2FnZSkpO1xuICAgIH07XG4gICAgQWJzdHJhY3RTeXN0ZW0ucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgQWJzdHJhY3RTeXN0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBvbGljeSA9ICh0aGlzLmNvbmZpZ3VyYXRpb24ubG9nIHx8IHt9KTtcbiAgICAgICAgaWYgKHRoaXMucnVubmluZylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgd2hpbGUgKHRoaXMuc3RhY2subGVuZ3RoID4gMClcbiAgICAgICAgICAgIG9wXzEubG9nKHBvbGljeS5sZXZlbCB8fCAwLCBwb2xpY3kubG9nZ2VyIHx8IGNvbnNvbGUsIHRoaXMuc3RhY2sucG9wKCkpLmV4ZWModGhpcyk7XG4gICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgIH07XG4gICAgcmV0dXJuIEFic3RyYWN0U3lzdGVtO1xufSgpKTtcbmV4cG9ydHMuQWJzdHJhY3RTeXN0ZW0gPSBBYnN0cmFjdFN5c3RlbTtcbi8qKlxuICogTnVsbFN5c3RlbSBpcyB1c2VkIGJ5IHN0b3BwZWQgYWN0b3JzIHRvIGF2b2lkIHNpZGUtZWZmZWN0IGNhdXNlZFxuICogY29tbXVuaWNhdGlvbi5cbiAqL1xudmFyIE51bGxTeXN0ZW0gPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTnVsbFN5c3RlbSgpIHtcbiAgICB9XG4gICAgTnVsbFN5c3RlbS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHJldHVybiBjO1xuICAgIH07XG4gICAgTnVsbFN5c3RlbS5wcm90b3R5cGUuYWNjZXB0ID0gZnVuY3Rpb24gKF8pIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBOdWxsU3lzdGVtLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBzeXN0ZW0gaGFzIGJlZW4gc3RvcHBlZCEnKTtcbiAgICB9O1xuICAgIE51bGxTeXN0ZW0ucHJvdG90eXBlLmlkZW50aWZ5ID0gZnVuY3Rpb24gKF8pIHtcbiAgICAgICAgcmV0dXJuIGFkZHJlc3NfMS5BRERSRVNTX0RJU0NBUkQ7XG4gICAgfTtcbiAgICBOdWxsU3lzdGVtLnByb3RvdHlwZS5leGVjID0gZnVuY3Rpb24gKF8pIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBOdWxsU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgcmV0dXJuIE51bGxTeXN0ZW07XG59KCkpO1xuZXhwb3J0cy5OdWxsU3lzdGVtID0gTnVsbFN5c3RlbTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBERUJVRyBsb2cgbGV2ZWwuXG4gKi9cbmV4cG9ydHMuREVCVUcgPSA3O1xuLyoqXG4gKiBJTkZPIGxvZyBsZXZlbC5cbiAqL1xuZXhwb3J0cy5JTkZPID0gNjtcbi8qKlxuICogV0FSTiBsb2cgbGV2ZWwuXG4gKi9cbmV4cG9ydHMuV0FSTiA9IDU7XG4vKipcbiAqIEVSUk9SIGxvZyBsZXZlbC5cbiAqL1xuZXhwb3J0cy5FUlJPUiA9IDE7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1sb2cuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsb2cgPSByZXF1aXJlKFwiLi4vbG9nXCIpO1xudmFyIGZ1bmN0aW9uXzEgPSByZXF1aXJlKFwiQHF1ZW5rL25vbmkvbGliL2RhdGEvZnVuY3Rpb25cIik7XG52YXIgc3RhdGVfMSA9IHJlcXVpcmUoXCIuLi9zdGF0ZVwiKTtcbnZhciByZWFkXzEgPSByZXF1aXJlKFwiLi9yZWFkXCIpO1xudmFyIF8xID0gcmVxdWlyZShcIi4vXCIpO1xuLyoqXG4gKiBDaGVjayBpbnN0cnVjdGlvbi5cbiAqL1xudmFyIENoZWNrID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhDaGVjaywgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBDaGVjayhhZGRyZXNzKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmFkZHJlc3MgPSBhZGRyZXNzO1xuICAgICAgICBfdGhpcy5jb2RlID0gXzEuT1BfQ0hFQ0s7XG4gICAgICAgIF90aGlzLmxldmVsID0gbG9nLklORk87XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgQ2hlY2sucHJvdG90eXBlLmV4ZWMgPSBmdW5jdGlvbiAocykge1xuICAgICAgICByZXR1cm4gZXhwb3J0cy5leGVjQ2hlY2socywgdGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gQ2hlY2s7XG59KF8xLk9wKSk7XG5leHBvcnRzLkNoZWNrID0gQ2hlY2s7XG4vKipcbiAqIGV4ZWNDaGVja1xuICpcbiAqIFBlZWtzIGF0IHRoZSBhY3RvcnMgbWFpbGJveCBmb3IgbmV3IG1lc3NhZ2VzIGFuZFxuICogc2NoZWR1bGVzIGEgUmVhZCBpZiBmb3IgdGhlIG9sZGVzdCBvbmUuXG4gKi9cbmV4cG9ydHMuZXhlY0NoZWNrID0gZnVuY3Rpb24gKHMsIF9hKSB7XG4gICAgdmFyIGFkZHJlc3MgPSBfYS5hZGRyZXNzO1xuICAgIHJldHVybiBzdGF0ZV8xLmdldEJlaGF2aW91cihzLnN0YXRlLCBhZGRyZXNzKVxuICAgICAgICAuY2hhaW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gc3RhdGVfMS5nZXRNZXNzYWdlKHMuc3RhdGUsIGFkZHJlc3MpOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChlKSB7IHJldHVybiBzLmV4ZWMobmV3IHJlYWRfMS5SZWFkKGFkZHJlc3MsIGUpKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbl8xLm5vb3ApXG4gICAgICAgIC5vckp1c3QoZnVuY3Rpb25fMS5ub29wKVxuICAgICAgICAuZ2V0KCk7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2hlY2suanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsb2cgPSByZXF1aXJlKFwiLi4vbG9nXCIpO1xudmFyIF8xID0gcmVxdWlyZShcIi4vXCIpO1xuLyoqXG4gKiBEcm9wIGluc3RydWN0aW9uLlxuICovXG52YXIgRHJvcCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRHJvcCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBEcm9wKHRvLCBmcm9tLCBtZXNzYWdlKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLnRvID0gdG87XG4gICAgICAgIF90aGlzLmZyb20gPSBmcm9tO1xuICAgICAgICBfdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgX3RoaXMuY29kZSA9IF8xLk9QX0RST1A7XG4gICAgICAgIF90aGlzLmxldmVsID0gbG9nLldBUk47XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgRHJvcC5wcm90b3R5cGUuZXhlYyA9IGZ1bmN0aW9uIChfKSB7IH07XG4gICAgcmV0dXJuIERyb3A7XG59KF8xLk9wKSk7XG5leHBvcnRzLkRyb3AgPSBEcm9wO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZHJvcC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsb2dnaW5nID0gcmVxdWlyZShcIi4uL2xvZ1wiKTtcbi8vT3AgY29kZXMuXG5leHBvcnRzLk9QX1JBSVNFID0gMHg2NDtcbmV4cG9ydHMuT1BfU1RPUCA9IDB4MDtcbmV4cG9ydHMuT1BfUlVOID0gMHgxO1xuZXhwb3J0cy5PUF9TUEFXTiA9IDB4MjtcbmV4cG9ydHMuT1BfUkVTVEFSVCA9IDB4MztcbmV4cG9ydHMuT1BfVEVMTCA9IDB4NDtcbmV4cG9ydHMuT1BfRFJPUCA9IDB4NTtcbmV4cG9ydHMuT1BfUkVDRUlWRSA9IDB4NjtcbmV4cG9ydHMuT1BfQ0hFQ0sgPSAweDc7XG5leHBvcnRzLk9QX1JFQUQgPSAweDg7XG5leHBvcnRzLk9QX0tJTEwgPSAweDk7XG5leHBvcnRzLk9QX0ZMQUdTID0gMHhhO1xuZXhwb3J0cy5PUF9GT1JXQVJEID0gMHhiO1xuZXhwb3J0cy5PUF9UUkFOU0ZFUiA9IDB4Yztcbi8qKlxuICogT3AgaXMgYW4gaW5zdHJ1Y3Rpb24gZXhlY3V0ZWQgYnkgYSBTeXN0ZW0vRXhlY3V0b3IuXG4gKi9cbnZhciBPcCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBPcCgpIHtcbiAgICB9XG4gICAgcmV0dXJuIE9wO1xufSgpKTtcbmV4cG9ydHMuT3AgPSBPcDtcbi8qKlxuICogbG9nIGFuIE9wIHRvIHRoZSBFeGVjdXRvcidzIGxvZ2dlci5cbiAqL1xuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbiAobGV2ZWwsIGxvZ2dlciwgbykge1xuICAgIGlmIChvLmxldmVsIDw9IGxldmVsKVxuICAgICAgICBzd2l0Y2ggKG8ubGV2ZWwpIHtcbiAgICAgICAgICAgIGNhc2UgbG9nZ2luZy5JTkZPOlxuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKG8pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBsb2dnaW5nLldBUk46XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4obyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGxvZ2dpbmcuRVJST1I6XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKG8pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBsb2dnZXIubG9nKG8pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgcmV0dXJuIG87XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsb2cgPSByZXF1aXJlKFwiLi4vbG9nXCIpO1xudmFyIHN0cmluZ18xID0gcmVxdWlyZShcIkBxdWVuay9ub25pL2xpYi9kYXRhL3N0cmluZ1wiKTtcbnZhciBmdW5jdGlvbl8xID0gcmVxdWlyZShcIkBxdWVuay9ub25pL2xpYi9kYXRhL2Z1bmN0aW9uXCIpO1xudmFyIHN0YXRlXzEgPSByZXF1aXJlKFwiLi4vc3RhdGVcIik7XG52YXIgc3RvcF8xID0gcmVxdWlyZShcIi4vc3RvcFwiKTtcbnZhciByYWlzZV8xID0gcmVxdWlyZShcIi4vcmFpc2VcIik7XG52YXIgZXJyb3JfMSA9IHJlcXVpcmUoXCIuLi9lcnJvclwiKTtcbnZhciBfMSA9IHJlcXVpcmUoXCIuL1wiKTtcbnZhciBJbGxlZ2FsS2lsbFNpZ25hbCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoSWxsZWdhbEtpbGxTaWduYWwsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gSWxsZWdhbEtpbGxTaWduYWwoY2hpbGQsIHBhcmVudCkge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBcIlRoZSBhY3RvciBhdCBhZGRyZXNzIFxcXCJcIiArIHBhcmVudCArIFwiXFxcIiBjYW4gbm90IGtpbGwgXFxcIlwiICsgY2hpbGQgKyBcIlxcXCIhXCIpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmNoaWxkID0gY2hpbGQ7XG4gICAgICAgIF90aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICByZXR1cm4gSWxsZWdhbEtpbGxTaWduYWw7XG59KGVycm9yXzEuU3lzdGVtRXJyb3IpKTtcbmV4cG9ydHMuSWxsZWdhbEtpbGxTaWduYWwgPSBJbGxlZ2FsS2lsbFNpZ25hbDtcbi8qKlxuICogS2lsbCBpbnN0cnVjdGlvbi5cbiAqL1xudmFyIEtpbGwgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEtpbGwsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gS2lsbChhY3RvciwgY2hpbGQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuYWN0b3IgPSBhY3RvcjtcbiAgICAgICAgX3RoaXMuY2hpbGQgPSBjaGlsZDtcbiAgICAgICAgX3RoaXMuY29kZSA9IF8xLk9QX0tJTEw7XG4gICAgICAgIF90aGlzLmxldmVsID0gbG9nLldBUk47XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgS2lsbC5wcm90b3R5cGUuZXhlYyA9IGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIGV4cG9ydHMuZXhlY0tpbGwocywgdGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gS2lsbDtcbn0oXzEuT3ApKTtcbmV4cG9ydHMuS2lsbCA9IEtpbGw7XG4vKipcbiAqIGV4ZWNLaWxsXG4gKlxuICogVmVyaWZ5IHRoZSB0YXJnZXQgY2hpbGQgaXMgc29tZXdoZXJlIGluIHRoZSBoaWVyYWNoeSBvZiB0aGUgcmVxdWVzdGluZ1xuICogYWN0b3IgYmVmb3JlIGtpbGxpbmcgaXQuXG4gKi9cbmV4cG9ydHMuZXhlY0tpbGwgPSBmdW5jdGlvbiAocywgX2EpIHtcbiAgICB2YXIgY2hpbGQgPSBfYS5jaGlsZCwgYWN0b3IgPSBfYS5hY3RvcjtcbiAgICByZXR1cm4gc3RhdGVfMS5nZXRBZGRyZXNzKHMuc3RhdGUsIGFjdG9yKVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChhZGRyKSB7XG4gICAgICAgIHJldHVybiBzLmV4ZWMoc3RyaW5nXzEuc3RhcnRzV2l0aChjaGlsZCwgYWRkcikgP1xuICAgICAgICAgICAgbmV3IHN0b3BfMS5TdG9wKGNoaWxkKSA6XG4gICAgICAgICAgICBuZXcgcmFpc2VfMS5SYWlzZShuZXcgSWxsZWdhbEtpbGxTaWduYWwoYWRkciwgY2hpbGQpLCBhZGRyLCBhZGRyKSk7XG4gICAgfSlcbiAgICAgICAgLm9ySnVzdChmdW5jdGlvbl8xLm5vb3ApXG4gICAgICAgIC5nZXQoKTtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1raWxsLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbG9nID0gcmVxdWlyZShcIi4uL2xvZ1wiKTtcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCIuLi8uLi90ZW1wbGF0ZVwiKTtcbnZhciBmdW5jdGlvbl8xID0gcmVxdWlyZShcIkBxdWVuay9ub25pL2xpYi9kYXRhL2Z1bmN0aW9uXCIpO1xudmFyIGFkZHJlc3NfMSA9IHJlcXVpcmUoXCIuLi8uLi9hZGRyZXNzXCIpO1xudmFyIHN0YXRlXzEgPSByZXF1aXJlKFwiLi4vc3RhdGVcIik7XG52YXIgcmVzdGFydF8xID0gcmVxdWlyZShcIi4vcmVzdGFydFwiKTtcbnZhciBzdG9wXzEgPSByZXF1aXJlKFwiLi9zdG9wXCIpO1xudmFyIF8xID0gcmVxdWlyZShcIi4vXCIpO1xuLyoqXG4gKiBSYWlzZSBpbnN0cnVjdGlvbi5cbiAqL1xudmFyIFJhaXNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSYWlzZSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBSYWlzZShlcnJvciwgc3JjLCBkZXN0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmVycm9yID0gZXJyb3I7XG4gICAgICAgIF90aGlzLnNyYyA9IHNyYztcbiAgICAgICAgX3RoaXMuZGVzdCA9IGRlc3Q7XG4gICAgICAgIF90aGlzLmNvZGUgPSBfMS5PUF9SQUlTRTtcbiAgICAgICAgX3RoaXMubGV2ZWwgPSBsb2cuRVJST1I7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogZXhlYyBSYWlzZVxuICAgICAqL1xuICAgIFJhaXNlLnByb3RvdHlwZS5leGVjID0gZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgcmV0dXJuIGV4cG9ydHMuZXhlY1JhaXNlKHMsIHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIFJhaXNlO1xufShfMS5PcCkpO1xuZXhwb3J0cy5SYWlzZSA9IFJhaXNlO1xuLyoqXG4gKiBleGVjUmFpc2VcbiAqXG4gKiBJZiB0aGUgYWN0b3IgdGVtcGxhdGUgY2FtZSB3aXRoIGEgdHJhcCB3ZSBhcHBseSBpdCB0byBkZXRlcm1pbmVcbiAqIHdoYXQgYWN0aW9uIHRvIHRha2UsIG9uZSBvZjpcbiAqIDEuIEVsZXZhdGUgdGhlIGVycm9yIHRvIHRoZSBwYXJlbnQgYWN0b3IuXG4gKiAyLiBJZ25vcmUgdGhlIGVycm9yLlxuICogMy4gUmVzdGFydCB0aGUgYWN0b3IuXG4gKiA0LiBTdG9wIHRoZSBhY3RvciBjb21wbGV0ZWx5LlxuICpcbiAqIElmIG5vIHRyYXAgaXMgcHJvdmlkZWQgd2UgZG8gMS4gdW50aWwgd2UgaGl0IHRoZSBzeXN0ZW0gYWN0b3IuXG4gKi9cbmV4cG9ydHMuZXhlY1JhaXNlID0gZnVuY3Rpb24gKHMsIF9hKSB7XG4gICAgdmFyIGVycm9yID0gX2EuZXJyb3IsIHNyYyA9IF9hLnNyYywgZGVzdCA9IF9hLmRlc3Q7XG4gICAgcmV0dXJuIHN0YXRlXzEuZ2V0VGVtcGxhdGUocy5zdGF0ZSwgZGVzdClcbiAgICAgICAgLm1hcChmdW5jdGlvbiAodCkge1xuICAgICAgICBpZiAodC50cmFwICE9IG51bGwpIHtcbiAgICAgICAgICAgIHN3aXRjaCAodC50cmFwKGVycm9yKSkge1xuICAgICAgICAgICAgICAgIGNhc2UgdGVtcGxhdGUuQUNUSU9OX1JBSVNFOlxuICAgICAgICAgICAgICAgICAgICBzLmV4ZWMobmV3IFJhaXNlKGVycm9yLCBzcmMsIGFkZHJlc3NfMS5nZXRQYXJlbnQoZGVzdCkpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSB0ZW1wbGF0ZS5BQ1RJT05fSUdOT1JFOlxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRlbXBsYXRlLkFDVElPTl9SRVNUQVJUOlxuICAgICAgICAgICAgICAgICAgICBzLmV4ZWMobmV3IHJlc3RhcnRfMS5SZXN0YXJ0KHNyYykpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRlbXBsYXRlLkFDVElPTl9TVE9QOlxuICAgICAgICAgICAgICAgICAgICBzLmV4ZWMobmV3IHN0b3BfMS5TdG9wKHNyYykpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBicmVhazsgLy9pZ25vcmVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMuZXhlYyhuZXcgUmFpc2UoZXJyb3IsIHNyYywgYWRkcmVzc18xLmdldFBhcmVudChkZXN0KSkpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbl8xLm5vb3ApXG4gICAgICAgIC5vckp1c3QoZnVuY3Rpb25fMS5ub29wKVxuICAgICAgICAuZ2V0KCk7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cmFpc2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsb2cgPSByZXF1aXJlKFwiLi4vbG9nXCIpO1xudmFyIG1heWJlXzEgPSByZXF1aXJlKFwiQHF1ZW5rL25vbmkvbGliL2RhdGEvbWF5YmVcIik7XG52YXIgZnVuY3Rpb25fMSA9IHJlcXVpcmUoXCJAcXVlbmsvbm9uaS9saWIvZGF0YS9mdW5jdGlvblwiKTtcbnZhciBzdGF0ZV8xID0gcmVxdWlyZShcIi4uL3N0YXRlXCIpO1xudmFyIGRyb3BfMSA9IHJlcXVpcmUoXCIuL2Ryb3BcIik7XG52YXIgXzEgPSByZXF1aXJlKFwiLi9cIik7XG4vKipcbiAqIFJlYWQgaW5zdHJ1Y3Rpb24uXG4gKi9cbnZhciBSZWFkID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSZWFkLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFJlYWQoYWRkcmVzcywgZW52ZWxvcGUpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuYWRkcmVzcyA9IGFkZHJlc3M7XG4gICAgICAgIF90aGlzLmVudmVsb3BlID0gZW52ZWxvcGU7XG4gICAgICAgIF90aGlzLmNvZGUgPSBfMS5PUF9SRUFEO1xuICAgICAgICBfdGhpcy5sZXZlbCA9IGxvZy5JTkZPO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFJlYWQucHJvdG90eXBlLmV4ZWMgPSBmdW5jdGlvbiAocykge1xuICAgICAgICByZXR1cm4gZXhwb3J0cy5leGVjUmVhZChzLCB0aGlzKTtcbiAgICB9O1xuICAgIHJldHVybiBSZWFkO1xufShfMS5PcCkpO1xuZXhwb3J0cy5SZWFkID0gUmVhZDtcbi8qKlxuICogZXhlY1JlYWRcbiAqXG4gKiBBcHBsaWVzIHRoZSBhY3RvciBiZWhhdmlvdXIgaW4gdGhlIFwibmV4dCB0aWNrXCIgaWYgYVxuICogcmVjZWl2ZSBpcyBwZW5kaW5nLlxuICovXG5leHBvcnRzLmV4ZWNSZWFkID0gZnVuY3Rpb24gKHMsIF9hKSB7XG4gICAgdmFyIGFkZHJlc3MgPSBfYS5hZGRyZXNzLCBlbnZlbG9wZSA9IF9hLmVudmVsb3BlO1xuICAgIHJldHVybiBzdGF0ZV8xLmdldChzLnN0YXRlLCBhZGRyZXNzKVxuICAgICAgICAuY2hhaW4oY29uc3VtZShzLCBlbnZlbG9wZSkpXG4gICAgICAgIC5vckp1c3QoZnVuY3Rpb25fMS5ub29wKVxuICAgICAgICAubWFwKGZ1bmN0aW9uXzEubm9vcClcbiAgICAgICAgLmdldCgpO1xufTtcbnZhciBjb25zdW1lID0gZnVuY3Rpb24gKHMsIGUpIHsgcmV0dXJuIGZ1bmN0aW9uIChmKSB7XG4gICAgcmV0dXJuIG1heWJlXzEuZnJvbUFycmF5KGYuYmVoYXZpb3VyKVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChfYSkge1xuICAgICAgICB2YXIgYiA9IF9hWzBdO1xuICAgICAgICByZXR1cm4gYjtcbiAgICB9KVxuICAgICAgICAuY2hhaW4oZnVuY3Rpb24gKGIpIHtcbiAgICAgICAgcmV0dXJuIGIoZS5tZXNzYWdlKVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIWYuZmxhZ3MuaW1tdXRhYmxlKVxuICAgICAgICAgICAgICAgIGYuYmVoYXZpb3VyLnNoaWZ0KCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAub3JSaWdodChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzLmV4ZWMobmV3IGRyb3BfMS5Ecm9wKGUudG8sIGUuZnJvbSwgZS5tZXNzYWdlKSk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAudG9NYXliZSgpO1xuICAgIH0pO1xufTsgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlYWQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsb2cgPSByZXF1aXJlKFwiLi4vbG9nXCIpO1xudmFyIGZ1bmN0aW9uXzEgPSByZXF1aXJlKFwiQHF1ZW5rL25vbmkvbGliL2RhdGEvZnVuY3Rpb25cIik7XG52YXIgc3RhdGVfMSA9IHJlcXVpcmUoXCIuLi9zdGF0ZVwiKTtcbnZhciBjaGVja18xID0gcmVxdWlyZShcIi4vY2hlY2tcIik7XG52YXIgXzEgPSByZXF1aXJlKFwiLi9cIik7XG4vKipcbiAqIFJlY2VpdmUgaW5zdHJ1Y3Rpb24uXG4gKi9cbnZhciBSZWNlaXZlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSZWNlaXZlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFJlY2VpdmUoYWRkcmVzcywgaW1tdXRhYmxlLCBiZWhhdmlvdXIpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuYWRkcmVzcyA9IGFkZHJlc3M7XG4gICAgICAgIF90aGlzLmltbXV0YWJsZSA9IGltbXV0YWJsZTtcbiAgICAgICAgX3RoaXMuYmVoYXZpb3VyID0gYmVoYXZpb3VyO1xuICAgICAgICBfdGhpcy5jb2RlID0gXzEuT1BfUkVDRUlWRTtcbiAgICAgICAgX3RoaXMubGV2ZWwgPSBsb2cuSU5GTztcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBSZWNlaXZlLnByb3RvdHlwZS5leGVjID0gZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgcmV0dXJuIGV4cG9ydHMuZXhlY1JlY2VpdmUocywgdGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gUmVjZWl2ZTtcbn0oXzEuT3ApKTtcbmV4cG9ydHMuUmVjZWl2ZSA9IFJlY2VpdmU7XG4vKipcbiAqIGV4ZWNSZWNlaXZlXG4gKlxuICogQ3VycmVudGx5IG9ubHkgb25lIHBlbmRpbmcgcmVjZWl2ZSBpcyBhbGxvd2VkIGF0IGEgdGltZS5cbiAqL1xuZXhwb3J0cy5leGVjUmVjZWl2ZSA9IGZ1bmN0aW9uIChzLCBfYSkge1xuICAgIHZhciBhZGRyZXNzID0gX2EuYWRkcmVzcywgYmVoYXZpb3VyID0gX2EuYmVoYXZpb3VyO1xuICAgIHJldHVybiBzdGF0ZV8xLmdldChzLnN0YXRlLCBhZGRyZXNzKVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmXG4gICAgICAgICAgICAuYmVoYXZpb3VyXG4gICAgICAgICAgICAucHVzaChiZWhhdmlvdXIpO1xuICAgIH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKCkgeyByZXR1cm4gcy5leGVjKG5ldyBjaGVja18xLkNoZWNrKGFkZHJlc3MpKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbl8xLm5vb3ApXG4gICAgICAgIC5vckp1c3QoZnVuY3Rpb25fMS5ub29wKVxuICAgICAgICAuZ2V0KCk7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cmVjZWl2ZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGxvZyA9IHJlcXVpcmUoXCIuLi9sb2dcIik7XG52YXIgZnVuY3Rpb25fMSA9IHJlcXVpcmUoXCJAcXVlbmsvbm9uaS9saWIvZGF0YS9mdW5jdGlvblwiKTtcbnZhciBzdGF0ZV8xID0gcmVxdWlyZShcIi4uL3N0YXRlXCIpO1xudmFyIHJ1bl8xID0gcmVxdWlyZShcIi4vcnVuXCIpO1xudmFyIHRlbGxfMSA9IHJlcXVpcmUoXCIuL3RlbGxcIik7XG52YXIgXzEgPSByZXF1aXJlKFwiLi9cIik7XG4vKipcbiAqIFJlc3RhcnQgaW5zdHJ1Y3Rpb24uXG4gKi9cbnZhciBSZXN0YXJ0ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSZXN0YXJ0LCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFJlc3RhcnQoYWRkcmVzcykge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5hZGRyZXNzID0gYWRkcmVzcztcbiAgICAgICAgX3RoaXMuY29kZSA9IF8xLk9QX1JFU1RBUlQ7XG4gICAgICAgIF90aGlzLmxldmVsID0gbG9nLklORk87XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgUmVzdGFydC5wcm90b3R5cGUuZXhlYyA9IGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIHJldHVybiBleHBvcnRzLmV4ZWNSZXN0YXJ0KHMsIHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIFJlc3RhcnQ7XG59KF8xLk9wKSk7XG5leHBvcnRzLlJlc3RhcnQgPSBSZXN0YXJ0O1xuLyoqXG4gKiBleGVjUmVzdGFydFxuICpcbiAqIFJldGFpbnMgdGhlIGFjdG9yJ3MgbWFpbGJveCBhbmQgc3RvcHMgdGhlIGN1cnJlbnQgaW5zdGFuY2UuXG4gKiBJdCBpcyB0aGVuIHJlc3RhcnQgYnkgY3JlYXRpbmcgYSBuZXcgaW5zdGFuY2UgYW5kIGludm9raW5nIGl0c1xuICogcnVuIG1ldGhvZC5cbiAqL1xuZXhwb3J0cy5leGVjUmVzdGFydCA9IGZ1bmN0aW9uIChzLCBvcCkge1xuICAgIHJldHVybiBzdGF0ZV8xLmdldChzLnN0YXRlLCBvcC5hZGRyZXNzKVxuICAgICAgICAubWFwKGRvUmVzdGFydChzLCBvcCkpXG4gICAgICAgIC5vckp1c3QoZnVuY3Rpb25fMS5ub29wKVxuICAgICAgICAuZ2V0KCk7XG59O1xudmFyIGRvUmVzdGFydCA9IGZ1bmN0aW9uIChzLCBfYSkge1xuICAgIHZhciBhZGRyZXNzID0gX2EuYWRkcmVzcztcbiAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgZi5hY3Rvci5zdG9wKCk7XG4gICAgICAgIHMuc3RhdGUgPSBzdGF0ZV8xLnB1dChzLnN0YXRlLCBhZGRyZXNzLCBzLmFsbG9jYXRlKGYudGVtcGxhdGUpKTtcbiAgICAgICAgcy5leGVjKG5ldyBydW5fMS5SdW4oYWRkcmVzcywgJ3Jlc3RhcnQnLCBmLnRlbXBsYXRlLmRlbGF5IHx8IDAsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHN0YXRlXzEucnVuSW5zdGFuY2Uocy5zdGF0ZSwgYWRkcmVzcyk7IH0pKTtcbiAgICAgICAgZlxuICAgICAgICAgICAgLm1haWxib3hcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG0pIHsgcmV0dXJuIG0ubWFwKGZ1bmN0aW9uIChlKSB7IHJldHVybiBzLmV4ZWMobmV3IHRlbGxfMS5UZWxsKGUudG8sIGUuZnJvbSwgZS5tZXNzYWdlKSk7IH0pOyB9KTtcbiAgICB9O1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlc3RhcnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsb2cgPSByZXF1aXJlKFwiLi4vbG9nXCIpO1xudmFyIHRpbWVyXzEgPSByZXF1aXJlKFwiQHF1ZW5rL25vbmkvbGliL2NvbnRyb2wvdGltZXJcIik7XG52YXIgXzEgPSByZXF1aXJlKFwiLi9cIik7XG4vKipcbiAqIFJ1biBpbnN0cnVjdGlvbi5cbiAqL1xudmFyIFJ1biA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUnVuLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFJ1bih0YWcsIGFjdG9yLCBkZWxheSwgZnVuYykge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy50YWcgPSB0YWc7XG4gICAgICAgIF90aGlzLmFjdG9yID0gYWN0b3I7XG4gICAgICAgIF90aGlzLmRlbGF5ID0gZGVsYXk7XG4gICAgICAgIF90aGlzLmZ1bmMgPSBmdW5jO1xuICAgICAgICBfdGhpcy5jb2RlID0gXzEuT1BfUlVOO1xuICAgICAgICBfdGhpcy5sZXZlbCA9IGxvZy5JTkZPO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFJ1bi5wcm90b3R5cGUuZXhlYyA9IGZ1bmN0aW9uIChfKSB7XG4gICAgICAgIHJldHVybiBleHBvcnRzLmV4ZWNSdW4odGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gUnVuO1xufShfMS5PcCkpO1xuZXhwb3J0cy5SdW4gPSBSdW47XG4vKipcbiAqIGV4ZWNSdW5cbiAqXG4gKiBSdW5zIGEgc2lkZS1lZmZlY3RmdWxsIGZ1bmN0aW9uIGluIHRoZSBcIm5leHQtdGlja1wiIG9yIGFmdGVyXG4gKiB0aGUgZHVyYXRpb24gcHJvdmlkZWQuXG4gKi9cbmV4cG9ydHMuZXhlY1J1biA9IGZ1bmN0aW9uIChfYSkge1xuICAgIHZhciBmdW5jID0gX2EuZnVuYywgZGVsYXkgPSBfYS5kZWxheTtcbiAgICBpZiAoZGVsYXkgPT09IDApXG4gICAgICAgIHRpbWVyXzEudGljayhmdW5jKTtcbiAgICBlbHNlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuYywgZGVsYXkpO1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJ1bi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGxvZyA9IHJlcXVpcmUoXCIuLi9sb2dcIik7XG52YXIgbWF5YmVfMSA9IHJlcXVpcmUoXCJAcXVlbmsvbm9uaS9saWIvZGF0YS9tYXliZVwiKTtcbnZhciBmdW5jdGlvbl8xID0gcmVxdWlyZShcIkBxdWVuay9ub25pL2xpYi9kYXRhL2Z1bmN0aW9uXCIpO1xudmFyIHN0YXRlXzEgPSByZXF1aXJlKFwiLi4vc3RhdGVcIik7XG52YXIgYWRkcmVzc18xID0gcmVxdWlyZShcIi4uLy4uL2FkZHJlc3NcIik7XG52YXIgZXJyb3JfMSA9IHJlcXVpcmUoXCIuLi9lcnJvclwiKTtcbnZhciByYWlzZV8xID0gcmVxdWlyZShcIi4vcmFpc2VcIik7XG52YXIgcnVuXzEgPSByZXF1aXJlKFwiLi9ydW5cIik7XG52YXIgXzEgPSByZXF1aXJlKFwiLi9cIik7XG5leHBvcnRzLlJVTl9TVEFSVF9UQUcgPSAnc3RhcnQnO1xudmFyIEludmFsaWRJZEVycm9yID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhJbnZhbGlkSWRFcnJvciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBJbnZhbGlkSWRFcnJvcihpZCkge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBcIkFjdG9yIGlkIFxcXCJcIiArIGlkICsgXCJcXFwiIG11c3Qgbm90IGluY2x1ZSBcXFwiJFxcXCIsIFxcXCI/XFxcIiBvciBcXFwiL1xcXCIhXCIpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmlkID0gaWQ7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIEludmFsaWRJZEVycm9yO1xufShlcnJvcl8xLlN5c3RlbUVycm9yKSk7XG5leHBvcnRzLkludmFsaWRJZEVycm9yID0gSW52YWxpZElkRXJyb3I7XG52YXIgRHVwbGljYXRlQWRkcmVzc0Vycm9yID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhEdXBsaWNhdGVBZGRyZXNzRXJyb3IsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRHVwbGljYXRlQWRkcmVzc0Vycm9yKGFkZHJlc3MpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgXCJVbmFibGUgdG8gc3Bhd24gYWN0b3IgXFxcIlwiICsgYWRkcmVzcyArIFwiXFxcIjogRHVwbGljYXRlIGFkZHJlc3MhXCIpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmFkZHJlc3MgPSBhZGRyZXNzO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIHJldHVybiBEdXBsaWNhdGVBZGRyZXNzRXJyb3I7XG59KGVycm9yXzEuU3lzdGVtRXJyb3IpKTtcbmV4cG9ydHMuRHVwbGljYXRlQWRkcmVzc0Vycm9yID0gRHVwbGljYXRlQWRkcmVzc0Vycm9yO1xuLyoqXG4gKiBTcGF3biBpbnN0cnVjdGlvbi5cbiAqL1xudmFyIFNwYXduID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhTcGF3biwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBTcGF3bihwYXJlbnQsIHRlbXBsYXRlKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgX3RoaXMudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICAgICAgX3RoaXMuY29kZSA9IF8xLk9QX1NQQVdOO1xuICAgICAgICBfdGhpcy5sZXZlbCA9IGxvZy5JTkZPO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFNwYXduLnByb3RvdHlwZS5leGVjID0gZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgcmV0dXJuIGV4cG9ydHMuZXhlY1NwYXduKHMsIHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIFNwYXduO1xufShfMS5PcCkpO1xuZXhwb3J0cy5TcGF3biA9IFNwYXduO1xuLyoqXG4gKiBleGVjU3Bhd24gaW5zdHJ1Y3Rpb24uXG4gKlxuICogSGVyZSB3ZSBlbnN1cmUgdGhlIHBhcmVudCBpcyBzdGlsbCBpbiB0aGUgc3lzdGVtIHRoZW4gdmFsaWRhdGVcbiAqIHRoZSBjaGlsZCBpZC5cbiAqXG4gKiBJZiB0aGF0IGlzIHN1Y2Nlc3NmdWxsIHdlIGNyZWF0ZSBhbmQgY2hlY2sgZm9yIGEgZHVwbGljYXRlIGlkXG4gKiB0aGVuIGZpbmFsbHkgYWRkIHRoZSBjaGlsZCB0byB0aGUgc3lzdGVtLlxuICovXG5leHBvcnRzLmV4ZWNTcGF3biA9IGZ1bmN0aW9uIChzLCBfYSkge1xuICAgIHZhciBwYXJlbnQgPSBfYS5wYXJlbnQsIHRlbXBsYXRlID0gX2EudGVtcGxhdGU7XG4gICAgcmV0dXJuIHN0YXRlXzEuZ2V0QWRkcmVzcyhzLnN0YXRlLCBwYXJlbnQpXG4gICAgICAgIC5jaGFpbihmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICByZXR1cm4gbWF5YmVfMS5mcm9tQm9vbGVhbighYWRkcmVzc18xLmlzUmVzdHJpY3RlZCh0ZW1wbGF0ZS5pZCkpXG4gICAgICAgICAgICAub3JFbHNlKHJhaXNlSW52YWxpZElkRXJyb3IocywgdGVtcGxhdGUuaWQsIHBhdGgpKVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoKSB7IHJldHVybiB0ZW1wbGF0ZTsgfSlcbiAgICAgICAgICAgIC5jaGFpbihtYWtlQWRkcmVzcyhwYXRoKSlcbiAgICAgICAgICAgIC5jaGFpbihmdW5jdGlvbiAoYWRkcikge1xuICAgICAgICAgICAgcmV0dXJuIGNoZWNrQWRkcmVzcyhzLCBhZGRyKVxuICAgICAgICAgICAgICAgIC5vckVsc2UocmFpc2VEdXBsaWNhdGVBZGRyZXNzRXJyb3IocywgcGF0aCwgYWRkcikpXG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbl8xLmNvbnMoYWRkcikpXG4gICAgICAgICAgICAgICAgLmNoYWluKGdlbmVyYXRlKHMsIHRlbXBsYXRlKSlcbiAgICAgICAgICAgICAgICAuY2hhaW4oc3Bhd25DaGlsZHJlbihzLCB0ZW1wbGF0ZSkpXG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoKSB7IH0pO1xuICAgICAgICB9KTtcbiAgICB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uXzEubm9vcClcbiAgICAgICAgLm9ySnVzdChmdW5jdGlvbl8xLm5vb3ApXG4gICAgICAgIC5nZXQoKTtcbn07XG52YXIgbWFrZUFkZHJlc3MgPSBmdW5jdGlvbiAocGFyZW50KSB7IHJldHVybiBmdW5jdGlvbiAodGVtcGxhdGUpIHtcbiAgICByZXR1cm4gbWF5YmVfMS5mcm9tU3RyaW5nKGFkZHJlc3NfMS5tYWtlKHBhcmVudCwgdGVtcGxhdGUuaWQpKTtcbn07IH07XG52YXIgY2hlY2tBZGRyZXNzID0gZnVuY3Rpb24gKHMsIGFkZHIpIHtcbiAgICByZXR1cm4gbWF5YmVfMS5mcm9tQm9vbGVhbighc3RhdGVfMS5leGlzdHMocy5zdGF0ZSwgYWRkcikpO1xufTtcbnZhciBnZW5lcmF0ZSA9IGZ1bmN0aW9uIChzLCB0ZW1wbGF0ZSkgeyByZXR1cm4gZnVuY3Rpb24gKGFkZHIpIHtcbiAgICByZXR1cm4gbWF5YmVfMS5mcm9tTnVsbGFibGUocy5hbGxvY2F0ZSh0ZW1wbGF0ZSkpXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcy5zdGF0ZSA9IHN0YXRlXzEucHV0KHMuc3RhdGUsIGFkZHIsIGYpO1xuICAgICAgICBzLmV4ZWMobmV3IHJ1bl8xLlJ1bihleHBvcnRzLlJVTl9TVEFSVF9UQUcsIGFkZHIsIHRlbXBsYXRlLmRlbGF5IHx8IDAsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHN0YXRlXzEucnVuSW5zdGFuY2Uocy5zdGF0ZSwgYWRkcik7IH0pKTtcbiAgICAgICAgcmV0dXJuIGYuYWN0b3I7XG4gICAgfSk7XG59OyB9O1xudmFyIHNwYXduQ2hpbGRyZW4gPSBmdW5jdGlvbiAocywgdCkgeyByZXR1cm4gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgIHJldHVybiBtYXliZV8xLmZyb21OdWxsYWJsZSh0LmNoaWxkcmVuKVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChjaGlsZHJlbikgeyByZXR1cm4gY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoYykgeyByZXR1cm4gcy5leGVjKG5ldyBTcGF3bihwYXJlbnQsIGMpKTsgfSk7IH0pO1xufTsgfTtcbnZhciByYWlzZUludmFsaWRJZEVycm9yID0gZnVuY3Rpb24gKHMsIGlkLCBwYXJlbnQpIHsgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBzLmV4ZWMobmV3IHJhaXNlXzEuUmFpc2UobmV3IEludmFsaWRJZEVycm9yKGlkKSwgcGFyZW50LCBwYXJlbnQpKTtcbiAgICByZXR1cm4gbWF5YmVfMS5ub3RoaW5nKCk7XG59OyB9O1xudmFyIHJhaXNlRHVwbGljYXRlQWRkcmVzc0Vycm9yID0gZnVuY3Rpb24gKHMsIHBhcmVudCwgYWRkcikgeyByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHMuZXhlYyhuZXcgcmFpc2VfMS5SYWlzZShuZXcgRHVwbGljYXRlQWRkcmVzc0Vycm9yKGFkZHIpLCBwYXJlbnQsIHBhcmVudCkpO1xuICAgIHJldHVybiBtYXliZV8xLm5vdGhpbmcoKTtcbn07IH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zcGF3bi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGxvZyA9IHJlcXVpcmUoXCIuLi9sb2dcIik7XG52YXIgcmVjb3JkXzEgPSByZXF1aXJlKFwiQHF1ZW5rL25vbmkvbGliL2RhdGEvcmVjb3JkXCIpO1xudmFyIGZ1bmN0aW9uXzEgPSByZXF1aXJlKFwiQHF1ZW5rL25vbmkvbGliL2RhdGEvZnVuY3Rpb25cIik7XG52YXIgc3RhdGVfMSA9IHJlcXVpcmUoXCIuLi9zdGF0ZVwiKTtcbnZhciByZXN0YXJ0XzEgPSByZXF1aXJlKFwiLi9yZXN0YXJ0XCIpO1xudmFyIF8xID0gcmVxdWlyZShcIi4vXCIpO1xuLyoqXG4gKiBTdG9wIGluc3RydWN0aW9uLlxuICovXG52YXIgU3RvcCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoU3RvcCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBTdG9wKGFkZHJlc3MpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuYWRkcmVzcyA9IGFkZHJlc3M7XG4gICAgICAgIF90aGlzLmNvZGUgPSBfMS5PUF9TVE9QO1xuICAgICAgICBfdGhpcy5sZXZlbCA9IGxvZy5XQVJOO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFN0b3AucHJvdG90eXBlLmV4ZWMgPSBmdW5jdGlvbiAocykge1xuICAgICAgICByZXR1cm4gZXhwb3J0cy5leGVjU3RvcChzLCB0aGlzKTtcbiAgICB9O1xuICAgIHJldHVybiBTdG9wO1xufShfMS5PcCkpO1xuZXhwb3J0cy5TdG9wID0gU3RvcDtcbi8qKlxuICogZXhlY1N0b3BcbiAqXG4gKiBJZiB0aGUgdGVtcGxhdGUgaGFzIHRoZSByZXN0YXJ0IGZsYWcgc2V0LFxuICogdGhlIGFjdG9yIHdpbGwgYmUgcmVzdGFydGVkIGluc3RlYWQuXG4gKiBPdGhlcndpc2VkIGl0IGlzIHN0b3BwZWQgYW5kIGVqZWN0ZWQgZnJvbSB0aGUgc3lzdGVtLlxuICovXG5leHBvcnRzLmV4ZWNTdG9wID0gZnVuY3Rpb24gKHMsIF9hKSB7XG4gICAgdmFyIGFkZHJlc3MgPSBfYS5hZGRyZXNzO1xuICAgIHJldHVybiBzdGF0ZV8xLmdldChzLnN0YXRlLCBhZGRyZXNzKVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJlY29yZF8xLm1hcChzdGF0ZV8xLmdldENoaWxkcmVuKHMuc3RhdGUsIGFkZHJlc3MpLCBmdW5jdGlvbiAoXywgaykge1xuICAgICAgICAgICAgcmV0dXJuIHMuZXhlYyhuZXcgU3RvcChrKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZi50ZW1wbGF0ZS5yZXN0YXJ0KSB7XG4gICAgICAgICAgICBzLmV4ZWMobmV3IHJlc3RhcnRfMS5SZXN0YXJ0KGFkZHJlc3MpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGYuYWN0b3Iuc3RvcCgpO1xuICAgICAgICAgICAgcy5zdGF0ZSA9IHN0YXRlXzEucmVtb3ZlKHMuc3RhdGUsIGFkZHJlc3MpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAgICAgLm9ySnVzdChmdW5jdGlvbl8xLm5vb3ApXG4gICAgICAgIC5nZXQoKTtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdG9wLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbG9nID0gcmVxdWlyZShcIi4uL2xvZ1wiKTtcbnZhciB0aW1lcl8xID0gcmVxdWlyZShcIkBxdWVuay9ub25pL2xpYi9jb250cm9sL3RpbWVyXCIpO1xudmFyIGZ1bmN0aW9uXzEgPSByZXF1aXJlKFwiQHF1ZW5rL25vbmkvbGliL2RhdGEvZnVuY3Rpb25cIik7XG52YXIgbWF5YmVfMSA9IHJlcXVpcmUoXCJAcXVlbmsvbm9uaS9saWIvZGF0YS9tYXliZVwiKTtcbnZhciBtYWlsYm94XzEgPSByZXF1aXJlKFwiLi4vLi4vbWFpbGJveFwiKTtcbnZhciBzdGF0ZV8xID0gcmVxdWlyZShcIi4uL3N0YXRlXCIpO1xudmFyIGNoZWNrXzEgPSByZXF1aXJlKFwiLi9jaGVja1wiKTtcbnZhciB0cmFuc2Zlcl8xID0gcmVxdWlyZShcIi4vdHJhbnNmZXJcIik7XG52YXIgZHJvcF8xID0gcmVxdWlyZShcIi4vZHJvcFwiKTtcbnZhciBfMSA9IHJlcXVpcmUoXCIuL1wiKTtcbi8qKlxuICogVGVsbCBpbnN0cnVjdGlvbi5cbiAqL1xudmFyIFRlbGwgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFRlbGwsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gVGVsbCh0bywgZnJvbSwgbWVzc2FnZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy50byA9IHRvO1xuICAgICAgICBfdGhpcy5mcm9tID0gZnJvbTtcbiAgICAgICAgX3RoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgIF90aGlzLmNvZGUgPSBfMS5PUF9URUxMO1xuICAgICAgICBfdGhpcy5sZXZlbCA9IGxvZy5JTkZPO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFRlbGwucHJvdG90eXBlLmV4ZWMgPSBmdW5jdGlvbiAocykge1xuICAgICAgICByZXR1cm4gZXhwb3J0cy5leGVjVGVsbChzLCB0aGlzKTtcbiAgICB9O1xuICAgIHJldHVybiBUZWxsO1xufShfMS5PcCkpO1xuZXhwb3J0cy5UZWxsID0gVGVsbDtcbi8qKlxuICogZXhlY1RlbGxcbiAqXG4gKiBJZiB0aGVyZSBpcyBhIHJvdXRlciByZWdpc3RlcmVkIGZvciB0aGUgXCJ0b1wiIGFkZHJlc3MsIHRoZSBtZXNzYWdlXG4gKiBpcyB0cmFuc2ZlcmVkLlxuICpcbiAqIE90aGVyd2lzZSBwcm92aWRlZCwgdGhlIGFjdG9yIGV4aXN0cywgd2UgcHV0IHRoZSBtZXNzYWdlIGluIGl0J3NcbiAqIG1haWxib3ggYW5kIGlzc3VlIGEgQ2hlY2suXG4gKlxuICogVGhlIG1lc3NhZ2UgaXMgZHJvcHBlZCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydHMuZXhlY1RlbGwgPSBmdW5jdGlvbiAocywgb3ApIHtcbiAgICByZXR1cm4gc3RhdGVfMS5nZXRSb3V0ZXIocy5zdGF0ZSwgb3AudG8pXG4gICAgICAgIC5tYXAocnVuVHJhbnNmZXIocywgb3ApKVxuICAgICAgICAub3JFbHNlKHJ1blRlbGwocywgb3ApKVxuICAgICAgICAub3JFbHNlKGludm9rZURyb3BIb29rKHMsIG9wKSlcbiAgICAgICAgLm9ySnVzdChqdXN0RHJvcChzLCBvcCkpXG4gICAgICAgIC5tYXAoZnVuY3Rpb25fMS5ub29wKVxuICAgICAgICAuZ2V0KCk7XG59O1xudmFyIHJ1blRyYW5zZmVyID0gZnVuY3Rpb24gKHMsIF9hKSB7XG4gICAgdmFyIHRvID0gX2EudG8sIGZyb20gPSBfYS5mcm9tLCBtZXNzYWdlID0gX2EubWVzc2FnZTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgcmV0dXJuIHMuZXhlYyhuZXcgdHJhbnNmZXJfMS5UcmFuc2Zlcih0bywgZnJvbSwgciwgbWVzc2FnZSkpO1xuICAgIH07XG59O1xudmFyIHJ1blRlbGwgPSBmdW5jdGlvbiAocywgb3ApIHsgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gc3RhdGVfMS5nZXQocy5zdGF0ZSwgb3AudG8pLmNoYWluKGRvVGVsbChzLCBvcCkpO1xufTsgfTtcbnZhciBkb1RlbGwgPSBmdW5jdGlvbiAocywgb3ApIHsgcmV0dXJuIGZ1bmN0aW9uIChmKSB7XG4gICAgcmV0dXJuIGZcbiAgICAgICAgLm1haWxib3hcbiAgICAgICAgLm1hcChkb1RlbGxNYWlsYm94KHMsIG9wKSlcbiAgICAgICAgLm9ySnVzdChmdW5jdGlvbiAoKSB7IHJldHVybiBmLmFjdG9yLmFjY2VwdCh0b0VudmVsb3BlKG9wKSk7IH0pO1xufTsgfTtcbnZhciBkb1RlbGxNYWlsYm94ID0gZnVuY3Rpb24gKHMsIF9hKSB7XG4gICAgdmFyIHRvID0gX2EudG8sIGZyb20gPSBfYS5mcm9tLCBtZXNzYWdlID0gX2EubWVzc2FnZTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgcmV0dXJuIHRpbWVyXzEudGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtLnB1c2gobmV3IG1haWxib3hfMS5FbnZlbG9wZSh0bywgZnJvbSwgbWVzc2FnZSkpO1xuICAgICAgICAgICAgcy5leGVjKG5ldyBjaGVja18xLkNoZWNrKHRvKSk7XG4gICAgICAgIH0pO1xuICAgIH07XG59O1xudmFyIGludm9rZURyb3BIb29rID0gZnVuY3Rpb24gKHMsIG9wKSB7IHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG1heWJlXzEuZnJvbU51bGxhYmxlKHMuY29uZmlndXJhdGlvbi5ob29rcylcbiAgICAgICAgLmNoYWluKGZ1bmN0aW9uIChoKSB7IHJldHVybiBtYXliZV8xLmZyb21OdWxsYWJsZShoLmRyb3ApOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChmKSB7IHJldHVybiBmKHRvRW52ZWxvcGUob3ApKTsgfSk7XG59OyB9O1xudmFyIGp1c3REcm9wID0gZnVuY3Rpb24gKHMsIF9hKSB7XG4gICAgdmFyIHRvID0gX2EudG8sIGZyb20gPSBfYS5mcm9tLCBtZXNzYWdlID0gX2EubWVzc2FnZTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcy5leGVjKG5ldyBkcm9wXzEuRHJvcCh0bywgZnJvbSwgbWVzc2FnZSkpO1xuICAgIH07XG59O1xudmFyIHRvRW52ZWxvcGUgPSBmdW5jdGlvbiAoX2EpIHtcbiAgICB2YXIgdG8gPSBfYS50bywgZnJvbSA9IF9hLmZyb20sIG1lc3NhZ2UgPSBfYS5tZXNzYWdlO1xuICAgIHJldHVybiBuZXcgbWFpbGJveF8xLkVudmVsb3BlKHRvLCBmcm9tLCBtZXNzYWdlKTtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD10ZWxsLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbG9nID0gcmVxdWlyZShcIi4uL2xvZ1wiKTtcbnZhciBmdW5jdGlvbl8xID0gcmVxdWlyZShcIkBxdWVuay9ub25pL2xpYi9kYXRhL2Z1bmN0aW9uXCIpO1xudmFyIG1haWxib3hfMSA9IHJlcXVpcmUoXCIuLi8uLi9tYWlsYm94XCIpO1xudmFyIHN0YXRlXzEgPSByZXF1aXJlKFwiLi4vc3RhdGVcIik7XG52YXIgZHJvcF8xID0gcmVxdWlyZShcIi4vZHJvcFwiKTtcbnZhciBfMSA9IHJlcXVpcmUoXCIuL1wiKTtcbi8qKlxuICogVHJhbnNmZXIgaW5zdHJ1Y3Rpb24uXG4gKi9cbnZhciBUcmFuc2ZlciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoVHJhbnNmZXIsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gVHJhbnNmZXIodG8sIGZyb20sIHJvdXRlciwgbWVzc2FnZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy50byA9IHRvO1xuICAgICAgICBfdGhpcy5mcm9tID0gZnJvbTtcbiAgICAgICAgX3RoaXMucm91dGVyID0gcm91dGVyO1xuICAgICAgICBfdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgX3RoaXMuY29kZSA9IF8xLk9QX1RSQU5TRkVSO1xuICAgICAgICBfdGhpcy5sZXZlbCA9IGxvZy5ERUJVRztcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBUcmFuc2Zlci5wcm90b3R5cGUuZXhlYyA9IGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIHJldHVybiBleHBvcnRzLmV4ZWNUcmFuc2ZlcihzLCB0aGlzKTtcbiAgICB9O1xuICAgIHJldHVybiBUcmFuc2Zlcjtcbn0oXzEuT3ApKTtcbmV4cG9ydHMuVHJhbnNmZXIgPSBUcmFuc2Zlcjtcbi8qKlxuICogZXhlY1RyYW5zZmVyXG4gKlxuICogUGVla3MgYXQgdGhlIGFjdG9ycyBtYWlsYm94IGZvciBuZXcgbWVzc2FnZXMgYW5kXG4gKiBzY2hlZHVsZXMgYSBSZWFkIGlmIGZvciB0aGUgb2xkZXN0IG9uZS5cbiAqL1xuZXhwb3J0cy5leGVjVHJhbnNmZXIgPSBmdW5jdGlvbiAocywgX2EpIHtcbiAgICB2YXIgcm91dGVyID0gX2Eucm91dGVyLCB0byA9IF9hLnRvLCBmcm9tID0gX2EuZnJvbSwgbWVzc2FnZSA9IF9hLm1lc3NhZ2U7XG4gICAgcmV0dXJuIHN0YXRlXzEuZ2V0SW5zdGFuY2Uocy5zdGF0ZSwgcm91dGVyKVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChhKSB7IHJldHVybiBhLmFjY2VwdChuZXcgbWFpbGJveF8xLkVudmVsb3BlKHRvLCBmcm9tLCBtZXNzYWdlKSk7IH0pXG4gICAgICAgIC5vckp1c3QoZnVuY3Rpb24gKCkgeyByZXR1cm4gcy5leGVjKG5ldyBkcm9wXzEuRHJvcCh0bywgZnJvbSwgbWVzc2FnZSkpOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uXzEubm9vcClcbiAgICAgICAgLmdldCgpO1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRyYW5zZmVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIG1heWJlXzEgPSByZXF1aXJlKFwiQHF1ZW5rL25vbmkvbGliL2RhdGEvbWF5YmVcIik7XG52YXIgcmVjb3JkXzEgPSByZXF1aXJlKFwiQHF1ZW5rL25vbmkvbGliL2RhdGEvcmVjb3JkXCIpO1xudmFyIHN0cmluZ18xID0gcmVxdWlyZShcIkBxdWVuay9ub25pL2xpYi9kYXRhL3N0cmluZ1wiKTtcbnZhciBhZGRyZXNzXzEgPSByZXF1aXJlKFwiLi4vYWRkcmVzc1wiKTtcbi8qKlxuICogZXhpc3RzIHRlc3RzIHdoZXRoZXIgYW4gYWRkcmVzcyBleGlzdHMgaW4gdGhlIFN0YXRlLlxuICovXG5leHBvcnRzLmV4aXN0cyA9IGZ1bmN0aW9uIChzLCBhZGRyKSB7XG4gICAgcmV0dXJuIHJlY29yZF8xLmNvbnRhaW5zKHMuY29udGV4dHMsIGFkZHIpO1xufTtcbi8qKlxuICogZ2V0IGEgQ29udGV4dCB1c2luZyBhbiBBZGRyZXNzLlxuICovXG5leHBvcnRzLmdldCA9IGZ1bmN0aW9uIChzLCBhZGRyKSB7XG4gICAgcmV0dXJuIG1heWJlXzEuZnJvbU51bGxhYmxlKHMuY29udGV4dHNbYWRkcl0pO1xufTtcbi8qKlxuICogZ2V0QWRkcmVzcyBhdHRlbXB0cyB0byByZXRyaWV2ZSB0aGUgYWRkcmVzcyBvZiBhbiBBY3RvciBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0cy5nZXRBZGRyZXNzID0gZnVuY3Rpb24gKHMsIGFjdG9yKSB7XG4gICAgcmV0dXJuIHJlY29yZF8xLnJlZHVjZShzLmNvbnRleHRzLCBtYXliZV8xLm5vdGhpbmcoKSwgZnVuY3Rpb24gKHAsIGMsIGspIHsgcmV0dXJuIGMuYWN0b3IgPT09IGFjdG9yID9cbiAgICAgICAgbWF5YmVfMS5mcm9tU3RyaW5nKGspIDogcDsgfSk7XG59O1xuLyoqXG4gKiBnZXRJbnN0YW5jZSBhdHRlbXB0cyB0byByZXRyaWV2ZSBhbiBhY3RvciBnaXZlbiBpdHMgYWRkcmVzcy5cbiAqL1xuZXhwb3J0cy5nZXRJbnN0YW5jZSA9IGZ1bmN0aW9uIChzLCBhZGRyKSB7XG4gICAgcmV0dXJuIHJlY29yZF8xLnJlZHVjZShzLmNvbnRleHRzLCBtYXliZV8xLm5vdGhpbmcoKSwgZnVuY3Rpb24gKHAsIGMsIGspIHsgcmV0dXJuIGsgPT09IGFkZHIgP1xuICAgICAgICBtYXliZV8xLmZyb21OdWxsYWJsZShjLmFjdG9yKSA6IHA7IH0pO1xufTtcbi8qKlxuICogZ2V0VGVtcGxhdGUgYXR0ZW1wdHMgdG8gcmV0cmlldmUgdGhlIHRlbXBsYXRlIGZvciBhblxuICogYWN0b3IgZ2l2ZW4gYW4gYWRkcmVzcy5cbiAqL1xuZXhwb3J0cy5nZXRUZW1wbGF0ZSA9IGZ1bmN0aW9uIChzLCBhZGRyKSB7XG4gICAgcmV0dXJuIGV4cG9ydHMuZ2V0KHMsIGFkZHIpLm1hcChmdW5jdGlvbiAoZikgeyByZXR1cm4gZi50ZW1wbGF0ZTsgfSk7XG59O1xuLyoqXG4gKiBnZXRNZXNzYWdlIGF0dGVtcHRzIHRvIHJldHJpZXZlIHRoZSBuZXh0IG1lc3NhZ2VcbiAqIGZyb20gYW4gYWN0b3JzIG1haWxib3guXG4gKlxuICogSWYgc3VjZXNzZnVsbCwgdGhlIG1lc3NhZ2Ugd2lsbCBiZSByZW1vdmVkLlxuICovXG5leHBvcnRzLmdldE1lc3NhZ2UgPSBmdW5jdGlvbiAocywgYWRkcikge1xuICAgIHJldHVybiBleHBvcnRzLmdldChzLCBhZGRyKVxuICAgICAgICAuY2hhaW4oZnVuY3Rpb24gKGYpIHsgcmV0dXJuIGYubWFpbGJveDsgfSlcbiAgICAgICAgLmNoYWluKGZ1bmN0aW9uIChtKSB7IHJldHVybiBtYXliZV8xLmZyb21BcnJheShtKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAobSkgeyByZXR1cm4gbS5zaGlmdCgpOyB9KTtcbn07XG4vKipcbiAqIGdldEJlaGF2aW91ciBhdHRlbXB0cyB0byByZXRyaWV2ZSB0aGUgYmVoYXZpb3VyIGZvciBhblxuICogYWN0b3IgZ2l2ZW4gYW4gYWRkcmVzcy5cbiAqL1xuZXhwb3J0cy5nZXRCZWhhdmlvdXIgPSBmdW5jdGlvbiAocywgYWRkcikge1xuICAgIHJldHVybiBleHBvcnRzLmdldChzLCBhZGRyKVxuICAgICAgICAuY2hhaW4oZnVuY3Rpb24gKGYpIHsgcmV0dXJuIG1heWJlXzEuZnJvbUFycmF5KGYuYmVoYXZpb3VyKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoYikgeyByZXR1cm4gYlswXTsgfSk7XG59O1xuLyoqXG4gKiBnZXRDaGlsZHJlbiByZXR1cm5zIHRoZSBjaGlsZCBjb250ZXh0cyBmb3IgYW4gYWRkcmVzcy5cbiAqL1xuZXhwb3J0cy5nZXRDaGlsZHJlbiA9IGZ1bmN0aW9uIChzLCBhZGRyKSB7XG4gICAgcmV0dXJuIChhZGRyID09PSBhZGRyZXNzXzEuQUREUkVTU19TWVNURU0pID9cbiAgICAgICAgcy5jb250ZXh0cyA6XG4gICAgICAgIHJlY29yZF8xLnBhcnRpdGlvbihzLmNvbnRleHRzKShmdW5jdGlvbiAoXywga2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gKHN0cmluZ18xLnN0YXJ0c1dpdGgoa2V5LCBhZGRyKSAmJiBrZXkgIT09IGFkZHIpO1xuICAgICAgICB9KVswXTtcbn07XG4vKipcbiAqIGdldFBhcmVudCBjb250ZXh0IHVzaW5nIGFuIEFkZHJlc3MuXG4gKi9cbmV4cG9ydHMuZ2V0UGFyZW50ID0gZnVuY3Rpb24gKHMsIGFkZHIpIHtcbiAgICByZXR1cm4gbWF5YmVfMS5mcm9tTnVsbGFibGUocy5jb250ZXh0c1thZGRyZXNzXzEuZ2V0UGFyZW50KGFkZHIpXSk7XG59O1xuLyoqXG4gKiBnZXRSb3V0ZXIgd2lsbCBhdHRlbXB0IHRvIHByb3ZpZGUgdGhlXG4gKiByb3V0aW5nIGFjdG9yIGZvciBhbiBBZGRyZXNzLlxuICpcbiAqIFRoZSB2YWx1ZSByZXR1cm5lZCBkZXBlbmRzIG9uIHdoZXRoZXIgdGhlIGdpdmVuXG4gKiBhZGRyZXNzIGJlZ2lucyB3aXRoIGFueSBvZiB0aGUgaW5zdGFsbGVkIHJvdXRlcidzIGFkZHJlc3MuXG4gKi9cbmV4cG9ydHMuZ2V0Um91dGVyID0gZnVuY3Rpb24gKHMsIGFkZHIpIHtcbiAgICByZXR1cm4gcmVjb3JkXzEucmVkdWNlKHMucm91dGVzLCBtYXliZV8xLm5vdGhpbmcoKSwgZnVuY3Rpb24gKHAsIGspIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZ18xLnN0YXJ0c1dpdGgoYWRkciwgaykgPyBtYXliZV8xLmp1c3QoaykgOiBwO1xuICAgIH0pO1xufTtcbi8qKlxuICogcHV0IGEgbmV3IENvbnRleHQgaW4gdGhlIFN0YXRlLlxuICovXG5leHBvcnRzLnB1dCA9IGZ1bmN0aW9uIChzLCBhZGRyLCBjb250ZXh0KSB7XG4gICAgcy5jb250ZXh0c1thZGRyXSA9IGNvbnRleHQ7XG4gICAgcmV0dXJuIHM7XG59O1xuLyoqXG4gKiBwdXRSb3V0ZSBhZGRzIGEgcm91dGUgdG8gdGhlIHJvdXRpbmcgdGFibGUuXG4gKi9cbmV4cG9ydHMucHV0Um91dGUgPSBmdW5jdGlvbiAocywgZnJvbSwgdG8pIHtcbiAgICBzLnJvdXRlc1tmcm9tXSA9IHRvO1xuICAgIHJldHVybiBzO1xufTtcbi8qKlxuICogcmVtb3ZlIGFuIGFjdG9yIGVudHJ5LlxuICovXG5leHBvcnRzLnJlbW92ZSA9IGZ1bmN0aW9uIChzLCBhZGRyKSB7XG4gICAgZGVsZXRlIHMuY29udGV4dHNbYWRkcl07XG4gICAgcmV0dXJuIHM7XG59O1xuLyoqXG4gKiBydW5JbnN0YW5jZSBhdHRlbXB0cyB0byBpbnZva2UgdGhlIHJ1biBjb2RlIG9mIGFuIGFjdG9yIGluc3RhbmNlLlxuICovXG5leHBvcnRzLnJ1bkluc3RhbmNlID0gZnVuY3Rpb24gKHMsIGFkZHIpIHtcbiAgICBleHBvcnRzLmdldEluc3RhbmNlKHMsIGFkZHIpLm1hcChmdW5jdGlvbiAoYSkgeyByZXR1cm4gYS5ydW4oKTsgfSk7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3RhdGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkFDVElPTl9SQUlTRSA9IC0weDE7XG5leHBvcnRzLkFDVElPTl9JR05PUkUgPSAweDA7XG5leHBvcnRzLkFDVElPTl9SRVNUQVJUID0gMHgxO1xuZXhwb3J0cy5BQ1RJT05fU1RPUCA9IDB4Mjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRlbXBsYXRlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgY29uZmlnID0gcmVxdWlyZShcIi4vYWN0b3Ivc3lzdGVtL2NvbmZpZ3VyYXRpb25cIik7XG52YXIgYWRkcmVzcyA9IHJlcXVpcmUoXCIuL2FjdG9yL2FkZHJlc3NcIik7XG52YXIgcmVjb3JkXzEgPSByZXF1aXJlKFwiQHF1ZW5rL25vbmkvbGliL2RhdGEvcmVjb3JkXCIpO1xudmFyIG1heWJlXzEgPSByZXF1aXJlKFwiQHF1ZW5rL25vbmkvbGliL2RhdGEvbWF5YmVcIik7XG52YXIgc3Bhd25fMSA9IHJlcXVpcmUoXCIuL2FjdG9yL3N5c3RlbS9vcC9zcGF3blwiKTtcbnZhciBkcm9wXzEgPSByZXF1aXJlKFwiLi9hY3Rvci9zeXN0ZW0vb3AvZHJvcFwiKTtcbnZhciBzeXN0ZW1fMSA9IHJlcXVpcmUoXCIuL2FjdG9yL3N5c3RlbVwiKTtcbi8qKlxuICogQHByaXZhdGVcbiAqL1xudmFyIFN5c1QgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3lzVCgpIHtcbiAgICAgICAgdGhpcy5pZCA9IGFkZHJlc3MuQUREUkVTU19TWVNURU07XG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKCkgeyB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgYXR0ZW1wdCB0byByZXN0YXJ0IHN5c3RlbSEnKTsgfTtcbiAgICAgICAgdGhpcy50cmFwID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGUubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBTeXNUO1xufSgpKTtcbi8qKlxuICogQWN0b3JTeXN0ZW1cbiAqXG4gKiBJbXBsZW1uYXRpb24gb2YgYSBTeXN0ZW0gYW5kIEV4ZWN1dG9yIHRoYXQgc3Bhd25zXG4gKiB2YXJpb3VzIGdlbmVyYWwgcHVycG9zZSBhY3RvcnMuXG4gKi9cbnZhciBBY3RvclN5c3RlbSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoQWN0b3JTeXN0ZW0sIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gQWN0b3JTeXN0ZW0oKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlciAhPT0gbnVsbCAmJiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGNvbnRleHRzOiB7XG4gICAgICAgICAgICAgICAgJDogbmV3Q29udGV4dChfdGhpcywgbmV3IFN5c1QoKSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByb3V0ZXM6IHt9XG4gICAgICAgIH07XG4gICAgICAgIF90aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBBY3RvclN5c3RlbS5wcm90b3R5cGUuYWNjZXB0ID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciB0byA9IF9hLnRvLCBmcm9tID0gX2EuZnJvbSwgbWVzc2FnZSA9IF9hLm1lc3NhZ2U7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWMobmV3IGRyb3BfMS5Ecm9wKHRvLCBmcm9tLCBtZXNzYWdlKSk7XG4gICAgfTtcbiAgICBBY3RvclN5c3RlbS5wcm90b3R5cGUuYWxsb2NhdGUgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgYWN0ID0gdC5jcmVhdGUodGhpcyk7XG4gICAgICAgIHJldHVybiBhY3QuaW5pdChuZXdDb250ZXh0KGFjdCwgdCkpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogc3Bhd24gYSBuZXcgYWN0b3IgZnJvbSBhIHRlbXBsYXRlLlxuICAgICAqL1xuICAgIEFjdG9yU3lzdGVtLnByb3RvdHlwZS5zcGF3biA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHRoaXMuZXhlYyhuZXcgc3Bhd25fMS5TcGF3bih0aGlzLCB0KSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIEFjdG9yU3lzdGVtO1xufShzeXN0ZW1fMS5BYnN0cmFjdFN5c3RlbSkpO1xuZXhwb3J0cy5BY3RvclN5c3RlbSA9IEFjdG9yU3lzdGVtO1xuLyoqXG4gKiBzeXN0ZW0gY3JlYXRlcyBhIG5ldyBhY3RvciBzeXN0ZW0gdXNpbmcgdGhlIG9wdGlvbmFsbHkgcGFzc2VkXG4gKiBjb25maWd1cmF0aW9uLlxuICovXG5leHBvcnRzLnN5c3RlbSA9IGZ1bmN0aW9uIChjb25mKSB7XG4gICAgcmV0dXJuIG5ldyBBY3RvclN5c3RlbShyZWNvcmRfMS5ybWVyZ2UoY29uZmlnLmRlZmF1bHRzKCksIGNvbmYpKTtcbn07XG52YXIgbmV3Q29udGV4dCA9IGZ1bmN0aW9uIChhY3RvciwgdGVtcGxhdGUpIHsgcmV0dXJuICh7XG4gICAgbWFpbGJveDogbWF5YmVfMS5ub3RoaW5nKCksXG4gICAgYWN0b3I6IGFjdG9yLFxuICAgIGJlaGF2aW91cjogW10sXG4gICAgZmxhZ3M6IHsgaW1tdXRhYmxlOiBmYWxzZSwgYnVmZmVyZWQ6IGZhbHNlIH0sXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlXG59KTsgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iXX0=
