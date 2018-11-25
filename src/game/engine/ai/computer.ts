import { Mutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { Turn, Advance, Fire } from '../../controller';
import { Regen } from '../';

/**
 * Message types
 */
export type Message = Tick;

/**
 *  Tick message.
 */
export class Tick { }

/**
 * Computer actor.
 *
 * Generates input commands on behalf of a computer player.
 */
export class Computer extends Mutable<Message, Context> {

    actions = ['turn', 'advance', 'rest', 'rage'];

    handleTick = () => {

        switch (pick(this.actions)) {

            case 'turn':
                this.tell('engine', new Turn(this.self()));
                break;

            case 'advance':
                this.tell('engine', new Advance(this.self()));
                break;

            case 'fire':
                this.tell('engine', new Fire(this.self()));
                break;

            case 'rage':
                for (let i = 0; i <= random(10); i++)
                    this.tell(this.self(), new Tick());
                break;

            default:
                break;

        }

        this.select(this.running);

    }

    running = [

        new Case(Tick, this.handleTick)

    ]

    receive = [];

    run() {

        this.tell('engine', new Regen(this.self()));
        this.tell(this.self(), new Tick());
        this.select(this.running);

    }

}

const pick = (list: string[]) =>
    list[Math.floor(Math.random() * list.length)];

const random = (n: number) =>
    Math.floor(Math.random() * n) + 1;
