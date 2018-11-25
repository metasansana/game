import { Mutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
/**
 * Message types
 */
export declare type Message = Tick;
/**
 *  Tick message.
 */
export declare class Tick {
}
/**
 * Computer actor.
 *
 * Generates input commands on behalf of a computer player.
 */
export declare class Computer extends Mutable<Message, Context> {
    actions: string[];
    handleTick: () => void;
    running: Case<Tick>[];
    receive: never[];
    run(): void;
}
