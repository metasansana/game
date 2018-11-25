import { Immutable } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
export declare const SOUNDS_FIRE = "assets/audio/fire.wav";
export declare const SOUNDS_ADVANCE = "assets/audio/advance.flac";
export declare const SOUNDS_TURN = "assets/audio/turn.flac";
/**
 * Sounds actor.
 *
 * Serves as parent for all the audio assets.
 */
export declare class Sounds extends Immutable<void, Context> {
    receive: never[];
    run(): void;
}
