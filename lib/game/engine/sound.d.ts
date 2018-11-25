import { Immutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { System } from '@quenk/potoo/lib/actor/system';
export declare const PLAY = "play";
/**
 * Sound acts as a sound server for the game.
 */
export declare class Sound extends Immutable<string, Context> {
    resource: HTMLAudioElement;
    system: System<Context>;
    constructor(resource: HTMLAudioElement, system: System<Context>);
    receive: Case<{}>[];
    run(): void;
}
