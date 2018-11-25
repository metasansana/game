import { Mutable, Case } from '@quenk/potoo/lib/actor/resident';
import { Context } from '@quenk/potoo/lib/actor/context';
import { System } from '@quenk/potoo/lib/actor/system';
import { Address } from '@quenk/potoo/lib/actor/address';
import { Future, Run } from '@quenk/noni/lib/control/monad/future';
import { noop } from '@quenk/noni/lib/data/function';
import { Offset, Region } from '../../../grid';
import { seek } from '../point';
import { ShotGen } from '../';
import { Orientation } from './orientation';
import { PLAY } from '../sound';
import {
    Message as ControllerMessage,
    Turn,
    Advance,
    Fire,
    Disable
} from '../../controller';

/**
 * Message types
 */
export type Message<M>
    = ControllerMessage<M>
    | Reload
    | M
    ;

/**
 * Reload message.
 */
export class Reload { }

/**
 * Die message.
 */
export class Die { }

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
export class Avatar<M> extends Mutable<Message<M>, Context> {

    constructor(
        public region: Region,
        public step: Offset,
        public controller: Address,
        public system: System<Context>) { super(system); }

    orientation = new Orientation(0, [
        [1, 3, 4, 5, 6, 8],
        [0, 1, 4, 5, 6, 7],
        [0, 2, 3, 4, 5, 7],
        [1, 2, 3, 4, 7, 8]
    ]);

    doTurn = () => {

        erase(this);
        drawNext(this);
        this.tell('sounds/turn', PLAY);
        this.select(this.hunting);

    }

    doAdvance = () => {

        let { region, step } = this;
        let orient = region.select(this.orientation.current());

        region.erase();
        seek(this.orientation.point, step, region);
        orient.draw();

        this.tell('sounds/advance', PLAY);
        this.select(this.hunting);

    }

    doFire = () => {

        let head = this.region.blockAt(this.orientation.head());

        this.tell('engine', new ShotGen(
            head.x, head.y, this.orientation.point, this.self()));


        this.tell('sounds/fire', PLAY);
        this.select(this.firing);

    }

    doDie = () => {

        let time = 500;

        delay(time, () => drawNext(this))
            .chain(() => delay(time, () => drawNext(this)))
            .chain(() => delay(time, () => drawNext(this)))
            .chain(() => delay(time, () => drawNext(this)))
            .chain(() => delay(time, () => erase(this)))
            .fork(noop, noop);

        this.tell('engine', new Disable(this.self()));

    }

    doReload = () =>
        this.select(this.hunting);

    hunting = [

        new Case(Turn, this.doTurn),

        new Case(Advance, this.doAdvance),

        new Case(Fire, this.doFire),

        new Case(Die, this.doDie)

    ];

    firing = [

        new Case(Turn, this.doTurn),

        new Case(Advance, this.doAdvance),

        new Case(Reload, this.doReload),

        new Case(Die, this.doDie)

    ];

    receive = this.hunting;

    run() {

        drawNext(this);

    }

}

const drawNext = <M>(a: Avatar<M>) =>
    a.region.select(a.orientation.next()).draw();

const erase = <M>(a: Avatar<M>) =>
    a.region.select(a.orientation.current()).erase();

const delay = <A>(n: number, f: () => A): Future<A> =>
    new Run<A>(s => {
        setTimeout(() => s.onSuccess(f()), n);
        return () => { }
    });
