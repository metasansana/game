import { Mutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Regen } from './engine';

/**
 * Button alias.
 */
export type Button = HTMLButtonElement;

/**
 * Message types handled by an Avatar actor.
 */
export type Message<M>
    = Turn
    | Advance
    | Fire
    | Disable
    | M
    ;

/**
 * Turn message.
 */
export class Turn {

    constructor(public actor: Address) { }

}

/**
 * Advance message.
 */
export class Advance {

    constructor(public actor: Address) { }

}

/**
 * Fire message.
 */
export class Fire {

    constructor(public actor: Address) { }
}

/**
 * Disable message.
 */
export class Disable {

    constructor(public actor: Address) { }

}

/**
 * Controller allows the user to move the character on screen.
 */
export class Controller<M> extends Mutable<Message<M>, Context> {

    constructor(
        public buttons: [Button, Button, Button],
        public system: System<Context>) { super(system); }

    receive = [];

    advance = () => this.tell('engine', new Advance(this.self()));

    turn = () => this.tell('engine', new Turn(this.self()));

    fire = () => { this.tell('engine', new Fire(this.self())); }

    send = (m: Message<M>) => {

        this.tell('engine', m);
        this.select(this.enabled);

    }

    handleDisable = () => this.select(this.disabled);

    disabled = []

    enabled = [

        new Case(Advance, this.send),

        new Case(Turn, this.send),

        new Case(Fire, this.send),

        new Case(Disable, this.handleDisable)

    ]

    /**
     * run method.
     *
     * This will install the hooks for the button actions
     * and instruct the engine to spawn a new avatar.
     */
    run() {

        this.buttons[0].addEventListener('click', this.advance);
        this.buttons[1].addEventListener('click', this.turn);
        this.buttons[2].addEventListener('click', this.fire);
        this.tell('engine', new Regen(this.self()));
      this.select(this.enabled);

    }

}

