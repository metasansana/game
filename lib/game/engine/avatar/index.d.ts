import { Mutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Offset, Region } from '../../../grid';
import { Orientation } from './orientation';
import { Message as ControllerMessage } from '../../controller';
/**
 * Message types
 */
export declare type Message<M> = ControllerMessage<M> | Reload | M;
/**
 * Reload message.
 */
export declare class Reload {
}
/**
 * Die message.
 */
export declare class Die {
}
/**
 * Avatar controls the rendering of an avatar on screen.
 *
 * This works by turning various arrays of blocks on and off
 *
 * North [1,3,4,5,6,8]
 * 0  1  2
 *___###___
 *#########
 *###___###
 * 6  7  8
 *
 *East [0,1,4,5,6,7]
 * 0  1  2
 *######___
 *___######
 *######___
 * 6  7  8
 *
 *South [0,2,3,4,5,7]
 * 0  1  2
 *###___###
 *#########
 *___###___
 * 6  7  8
 *
 *West [1,2,3,4,7,8]
 * 0  1  2
 *___######
 *######___
 *___######
 * 6  7  8
 */
export declare class Avatar<M> extends Mutable<Message<M>, Context> {
    region: Region;
    step: Offset;
    controller: Address;
    system: System<Context>;
    constructor(region: Region, step: Offset, controller: Address, system: System<Context>);
    orientation: Orientation;
    doTurn: () => void;
    doAdvance: () => void;
    doFire: () => void;
    doDie: () => void;
    doReload: () => Mutable<Message<M>, Context>;
    hunting: Case<{}>[];
    firing: Case<{}>[];
    receive: Case<{}>[];
    run(): void;
}
