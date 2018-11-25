import { Mutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Offset, Region } from '../../grid';
import { Reload } from './avatar';
import { Point, seek } from './point';

/**
 * Message types.
 */
export type Message<M>
    = Tick
    | Stop
    | M
    ;

/**
 * Tick message.
 */
export class Tick { }

/**
 * Stop message.
 */
export class Stop { }

/**
 * Shot actor.
 *
 * Represents a moving shot across an x or y point.
 */
export class Shot<M> extends Mutable<Message<M>, Context> {

    constructor(
        public block: Region,
        public step: Offset,
        public point: Point,
        public ttl: number,
        public avatar: Address,
        public system: System<Context>) { super(system); }

    doTick = (ttl: number) => () => {

        if (ttl > 0) {

            //avoid erasing the avatar head.
            if (ttl !== this.ttl)
                this.block.erase();

            seek(this.point, this.step, this.block);

            this.block.draw();

            setTimeout(() => this.tell(this.self(), new Tick()), 10);
            this.select(this.ticking(ttl - 1));

        } else {

            this.block.erase();
            this.exit();
            this.tell(this.avatar, new Reload());

        }

    }

    ticking = (ttl: number) => [

        new Case(Tick, this.doTick(ttl))

    ];

    receive = [];

    run() {

        this.tell(this.self(), new Tick());
        this.select(this.ticking(this.ttl));

    }

}
