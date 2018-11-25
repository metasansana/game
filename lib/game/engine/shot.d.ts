import { Mutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Offset, Region } from '../../grid';
import { Point } from './point';
/**
 * Message types.
 */
export declare type Message<M> = Tick | Stop | M;
/**
 * Tick message.
 */
export declare class Tick {
}
/**
 * Stop message.
 */
export declare class Stop {
}
/**
 * Shot actor.
 *
 * Represents a moving shot across an x or y point.
 */
export declare class Shot<M> extends Mutable<Message<M>, Context> {
    block: Region;
    step: Offset;
    point: Point;
    ttl: number;
    avatar: Address;
    system: System<Context>;
    constructor(block: Region, step: Offset, point: Point, ttl: number, avatar: Address, system: System<Context>);
    doTick: (ttl: number) => () => void;
    ticking: (ttl: number) => Case<Tick>[];
    receive: never[];
    run(): void;
}
