import { system } from '@quenk/potoo';
import { Grid } from './grid';
import { Engine } from './game/engine';
import { Button, Controller } from './game/controller';
import { Sounds } from './game/sounds';

let s = system({ log: { level: 5 } });
let canvas = <HTMLCanvasElement>document.getElementById('screen');

let buttons = <[Button, Button, Button]>[
    document.getElementById('button-0'),
    document.getElementById('button-1'),
    document.getElementById('button-2')
];

(<any>window).system = s
    .spawn({
        id: 'engine',
        create: s => new Engine(new Grid(50, 50, canvas), s)
    })
    .spawn({
        id: 'p1',
        create: s => new Controller(buttons, s)
    })
    .spawn({
        id: 'sounds',
        create: s => new Sounds(s)
    });
