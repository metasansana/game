import { Immutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Coord, Grid } from '../../grid';
import { Message as ControllerMessage, Turn, Advance, Fire } from '../controller';
import { Point } from './point';
/**
 * Message types.
 */
export declare type Message<M> = ControllerMessage<M> | Regen | ShotGen | M;
/**
 * Regen indicates a new avatar should be
 * inserted to the grid on behalf of some actor.
 *
 * For now, avatars are always spawned at origin.
 */
export declare class Regen {
    actor: Address;
    constructor(actor: Address);
}
/**
 * ShotGen message.
 */
export declare class ShotGen {
    originX: Coord;
    originY: Coord;
    point: Point;
    avatar: Address;
    constructor(originX: Coord, originY: Coord, point: Point, avatar: Address);
}
/**
 * Engine actor serving as display server.
 *
 * This actor receives commands from other actors and
 * outputs its results to the internal grid.
 */
export declare class Engine<M> extends Immutable<Message<M>, Context> {
    grid: Grid;
    system: System<Context>;
    constructor(grid: Grid, system: System<Context>);
    /**
     * bridge from Controllers to Avatars.
     */
    bridge: {
        [key: string]: Address;
    };
    regenerateAvatar: ({ actor }: Regen) => void;
    sendTurn: (t: Turn) => void;
    sendAdvance: (a: Advance) => void;
    sendFire: (a: Fire) => void;
    spawnShot: ({ point, originX, originY, avatar }: ShotGen) => void;
    receive: Case<Message<M>>[];
    run(): void;
}
