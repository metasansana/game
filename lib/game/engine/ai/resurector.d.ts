import { Mutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { System } from '@quenk/potoo/lib/actor/system';
/**
 * Message types.
 */
export declare type Message = Spawn | Resume;
/**
 * Spawn message.
 */
export declare class Spawn {
}
/**
 * Resume message.
 */
export declare class Resume {
}
/**
 * Resurector spawns new ai avatars occasionally.
 */
export declare class Resurector extends Mutable<Message, Context> {
    duration: number;
    limit: number;
    system: System<Context>;
    constructor(duration: number, limit: number, system: System<Context>);
    count: number;
    receive: never[];
    handleSpawn: (id: number) => () => void;
    handleResume: (id: number) => () => void;
    spawning: (id: number) => Case<Spawn>[];
    resting: (id: number) => Case<Resume>[];
    run(): void;
}
