import { Immutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { System } from '@quenk/potoo/lib/actor/system';

export const PLAY = 'play';

/**
 * Sound acts as a sound server for the game.
 */
export class Sound extends Immutable<string, Context> {

    constructor(public resource: HTMLAudioElement, public system: System<Context>) {

        super(system);

    }

    receive = [

      new Case(PLAY, () =>{
        
        this
          .resource
          .play()
          .catch(e => console.error(`${this.self()}: ${e.message}`)); 
      
      })

    ]

    run() { }

}
