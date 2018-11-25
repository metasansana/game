import { Immutable } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { Sound } from './engine/sound';

export const SOUNDS_FIRE = 'assets/audio/fire.wav';
export const SOUNDS_ADVANCE = 'assets/audio/advance.flac';
export const SOUNDS_TURN = 'assets/audio/turn.flac';

/**
 * Sounds actor.
 *
 * Serves as parent for all the audio assets.
 */
export class Sounds extends Immutable<void, Context> {

    receive = [];

    run() {

        this.spawn({

            id: 'fire',
            create: s => new Sound(new Audio(SOUNDS_FIRE), s)

        });

        this.spawn({

            id: 'advance',
            create: s => new Sound(new Audio(SOUNDS_ADVANCE), s)

        });

        this.spawn({

            id: 'turn',
            create: s => new Sound(new Audio(SOUNDS_TURN), s)

        });

    }

}
