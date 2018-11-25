import { Mutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
/**
 * Button alias.
 */
export declare type Button = HTMLButtonElement;
/**
 * Message types handled by an Avatar actor.
 */
export declare type Message<M> = Turn | Advance | Fire | Disable | M;
/**
 * Turn message.
 */
export declare class Turn {
    actor: Address;
    constructor(actor: Address);
}
/**
 * Advance message.
 */
export declare class Advance {
    actor: Address;
    constructor(actor: Address);
}
/**
 * Fire message.
 */
export declare class Fire {
    actor: Address;
    constructor(actor: Address);
}
/**
 * Disable message.
 */
export declare class Disable {
    actor: Address;
    constructor(actor: Address);
}
/**
 * Controller allows the user to move the character on screen.
 */
export declare class Controller<M> extends Mutable<Message<M>, Context> {
    buttons: [Button, Button, Button];
    system: System<Context>;
    constructor(buttons: [Button, Button, Button], system: System<Context>);
    receive: never[];
    advance: () => import("@quenk/potoo/lib/actor/resident").AbstractResident<Context>;
    turn: () => import("@quenk/potoo/lib/actor/resident").AbstractResident<Context>;
    fire: () => void;
    send: (m: Message<M>) => void;
    handleDisable: () => Mutable<Message<M>, Context>;
    disabled: never[];
    enabled: Case<Advance>[];
    /**
     * run method.
     *
     * This will install the hooks for the button actions
     * and instruct the engine to spawn a new avatar.
     */
    run(): void;
}
