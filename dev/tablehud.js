// Stand-alone demo of the table HUD (builder B's stub): four seat plates and a three-track goal bar over a dark felt. Not the game's.
import { TableHud } from '../src/ui/tablehud.js';
const hud = new TableHud().mount(document.getElementById('host'));
hud.setSeats([
  { seat: 0, colour: 'White', name: 'You', state: 'idle', stats: [{ label: 'points', value: 340, kind: 'score' }, { label: 'chips', value: 120, kind: 'money' }] },
  { seat: 1, colour: 'Black', name: 'Raku', state: 'acting', stats: [{ label: 'points', value: 410, kind: 'score' }, { label: 'dice', value: 4, kind: 'lives' }] },
  { seat: 2, colour: 'Yellow', name: 'Pip', state: 'out', stats: [{ label: 'points', value: 90, kind: 'score' }, { label: 'dice', value: 0, kind: 'lives' }] },
  { seat: 3, colour: 'Purple', name: 'Seger', state: 'winner', stats: [{ label: 'points', value: 520, kind: 'score' }, { label: 'chips', value: 300, kind: 'money' }] },
]);
hud.setGoal({ label: 'FIRST TO 500', line: 'Roll all your dice. A top face makes a new die.', target: 500, marks: [{ at: 500, label: 'GOAL' }],
  tracks: [{ seat: 0, colour: 'White', value: 340 }, { seat: 1, colour: 'Black', value: 410 }, { seat: 3, colour: 'Purple', value: 500 }] });
const W = innerWidth, H = innerHeight;
hud.place('goal', W / 2, H * 0.22);
[[0.5, 0.82], [0.15, 0.55], [0.5, 0.55], [0.85, 0.55]].forEach(([x, y], i) => hud.place(`seat:${i}`, W * x, H * y));
hud.show();
