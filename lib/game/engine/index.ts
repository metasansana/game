import { Immutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address, getId } from '@quenk/potoo/lib/actor/address';
import { Coord, Grid } from '../../grid';
import { Avatar } from './avatar';
import { Message as ControllerMessage, Turn, Advance, Fire } from '../controller';
import { Shot } from './shot';
import { Point } from './point';

const ORIGIN_X = 1;
const ORIGIN_Y = 1;
const AVATAR_ROWS = 3;
const AVATAR_COLUMNS = 3;

/**
 * Message types.
 */
export type Message<M>
    = ControllerMessage<M>
    | Regen
    | ShotGen
    | M
    ;

/**
 * Regen indicates a new avatar should be 
 * inserted to the grid on behalf of some actor.
 *
 * For now, avatars are always spawned at origin.
 */
export class Regen {

    constructor(public actor: Address) { }

}

/**
 * ShotGen message.
 */
export class ShotGen {

    constructor(
        public originX: Coord,
        public originY: Coord,
        public point: Point,
        public avatar: Address) { }

}

/**
 * Engine actor serving as display server.
 *
 * This actor receives commands from other actors and
 * outputs its results to the internal grid.
 */
export class Engine<M> extends Immutable<Message<M>, Context> {

    constructor(
        public grid: Grid,
        public system: System<Context>) { super(system); }

    /**
     * bridge from Controllers to Avatars.
     */
    bridge: { [key: string]: Address } = {};

    regenerateAvatar = ({ actor }: Regen) => {

        let id = getId(actor);

        this.bridge[actor] = this.spawn({
            id,
            create: s => new Avatar(
                this.grid.getRegion(
                    ORIGIN_X,
                    ORIGIN_Y,
                    AVATAR_ROWS,
                    AVATAR_COLUMNS),
                this.grid.blockWidth * 3,
                actor,
                s)
        });

    }

    sendTurn = (t: Turn) => 
        this.tell(this.bridge[t.actor], t);
    
    sendAdvance = (a: Advance) => 
        this.tell(this.bridge[a.actor], a);

    sendFire = (a: Fire) => 
        this.tell(this.bridge[a.actor], a);

    spawnShot = ({ point, originX, originY, avatar }: ShotGen) => {

        let id = `shot-${getId(avatar)}`;
        let ttl = 25;
        let rate = this.grid.blockWidth * 2;

        switch (point) {

            case 0:
                ttl = Math.ceil(originY / this.grid.blockHeight);
                break;

            case 1:
                ttl = this.grid.xblocks - Math.ceil((originX / this.grid.blockWidth));
                break;

            case 2:
                ttl = this.grid.yblocks - Math.ceil((originY / this.grid.blockHeight));

            case 3:
                ttl = Math.ceil(originX / this.grid.blockWidth);

        }

        let blk = this.grid.getRegion(originX, originY, 1, 1);

        this.spawn({
            id,
            create: s => new Shot(blk, rate, point, ttl, avatar, s),
            restart: false
        });


    }

    receive = <Case<Message<M>>[]>[

        new Case(Turn, this.sendTurn),

        new Case(Advance, this.sendAdvance),

        new Case(Fire, this.sendFire),

        new Case(ShotGen, this.spawnShot),

        new Case(Regen, this.regenerateAvatar)

    ];

    run() { }

}

  /*
const calcTTL = (grid: Grid, point: point) => {

    let ttl = 0;

    switch (point) {

        case 0:
            break;

    }

}*/
