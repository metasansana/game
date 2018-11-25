import { Mutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { System } from '@quenk/potoo/lib/actor/system';
import { Computer } from './computer';

/**
 * Message types.
 */
export type Message
    = Spawn
    | Resume
    ;

/**
 * Spawn message.
 */
export class Spawn { }

/**
 * Resume message.
 */
export class Resume { }

/**
 * Resurector spawns new ai avatars occasionally.
 */
export class Resurector extends Mutable<Message, Context> {

    constructor(
        public duration: number,
        public limit: number,
        public system: System<Context>) { super(system); }

    count = 0;

    receive = [];

    handleSpawn = (id: number) => () => {

        if (this.count === this.limit) {

            this.select(this.resting(id));

        } else {

            this.count = this.count + 1;

            this.spawn({
                id: `computer-${id}`,
                create: s => new Computer(s)
            });

            this.select(this.spawning(id + 1));
            schedule(this);

        }

    }

    handleResume = (id: number) => () => {

        schedule(this);
        this.select(this.spawning(id));

    }

    spawning = (id: number) => [

        new Case(Spawn, this.handleSpawn(id))

    ];

    resting = (id: number) => [

        new Case(Resume, this.handleResume(id))

    ]

    run() {

      //    this.select(this.spawning(0));
      //schedule(this);

    }

}

const schedule = (r: Resurector) =>
    setTimeout(() => r.tell(r.self(), new Spawn), r.duration);

//const random = (n: number) =>
//  Math.floor(Math.random() * n) + 1000;
