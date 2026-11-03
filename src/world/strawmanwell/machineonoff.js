// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S ON/OFF BLOCKS (docs/plans/STRAWMANS-WELL.md 3.7; GAPS G251): two sets of blocks in two colours, one solid and the other
// a ghost, swapped by a toggle pad each time it is stepped onto (Super Mario Maker's switch blocks; VVVVVV-style, the platform you stand on
// may be the one a toggle takes away). A set that would come on over the Courier waits until they are clear of it. Placeholder meshes are
// named for Calissa: wellOnBlock (the solid set), wellOffBlock (the ghost set), wellToggleSwitch.
//
// Prior art: Super Mario Maker's on/off switch and its blocks, Super Mario Odyssey's and Celeste's switch blocks.
//
//   makeOnOff(machine, S, { sets: [[[x0, x1, y0, y1], ...], [...]], pad: [x0, x1, top], on: 0 }) -> the machine item (kind 'onoff')
//   tickOnOff(machine, it)
// ---------------------------------------------------------------------------------------
import { COLOR } from './stagekit.js';
import { AT } from './layout.js';

const SET_COLOR = [COLOR.spring, COLOR.felt];

export function makeOnOff(machine, S, { sets, pad, on = 0 }) {
  const it = { kind: 'onoff', on, want: on, sets: [], pad: { x0: AT.x + pad[0], x1: AT.x + pad[1], top: AT.y + pad[2], was: false } };
  sets.forEach((list, i) => {
    it.sets.push(list.map(([x0, x1, y0, y1]) => {
      const r = S.box(x0, x1, y0, y1, SET_COLOR[i], { own: true });
      return { mesh: r.mesh, collider: r.collider, x0: AT.x + x0, x1: AT.x + x1, y0: AT.y + y0, y1: AT.y + y1, solid: null, mat: r.mesh.material };
    }));
  });
  const sw = S.box(pad[0], pad[1], pad[2] - 0.12, pad[2], COLOR.gold, { own: true, d: 1.4, collide: false }); sw.mesh.name = 'wellToggleSwitch';
  it.pad.mesh = sw.mesh; it.pad.y0 = sw.mesh.position.y;
  apply(it, null, true); machine.add(it); return it;
}

const inside = (P, b) => P.pos.x > b.x0 - 0.3 && P.pos.x < b.x1 + 0.3 && P.pos.y + P.height > b.y0 && P.pos.y < b.y1;

/** The set that is on solid and drawn plain; the other a ghost (no body, translucent). */
function apply(it, P, force = false) {
  it.sets.forEach((list, i) => {
    for (const b of list) {
      const solid = i === it.on;
      if (b.solid === solid && !force) continue;
      if (solid && P && inside(P, b)) continue; // (waits: the Courier is in it)
      b.solid = solid; b.collider?.setEnabled(solid); b.mat.transparent = !solid; b.mat.opacity = solid ? 1 : 0.22; b.mat.depthWrite = solid; b.mesh.name = solid ? 'wellOnBlock' : 'wellOffBlock';
    }
  });
}

export function tickOnOff(machine, it) {
  const P = machine.P, p = it.pad, on = P.grounded && P.pos.x > p.x0 - 0.1 && P.pos.x < p.x1 + 0.1 && Math.abs(P.pos.y - p.top) < 0.25;
  if (on && !p.was) { it.on = 1 - it.on; machine.well.verb('onOff'); }
  p.was = on; p.mesh.position.y = p.y0 - (on ? 0.06 : 0);
  apply(it, P);
}
