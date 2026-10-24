// ---------------------------------------------------------------------------------------
// A HOP'S BURST (plain name): what puffs from the Pneuka Jar's foot when it hops and lands in the Spirit Garden, chosen as its look's
// `burst` (vfx/pneukajar/table.js): a puff of the body glaze's dye, petals, sparks, bubbles of its inner light, the seven feelings'
// confetti; `motes` adds nothing to the ring of motes the hop already gives (vfx/garden/jarhop.js). Particles on the house's sprite
// pools (game.fx.vfx's add and alpha: vfx/sprites.js shapes), bigger as it comes down harder. Called by the hop (JarHop.burst).
//
// Prior art: Spyro's and Ori's footfalls of colour, the dust and petal kicks of a platformer's landing (Celeste's), Splatoon's ink puff.
//
//   jarBurst(game, look, kind ('hop' | 'land'), k (0..1 how hard), obj (the Jar's group: where, and which way is up))
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../../progress/weather.js';

const FEELINGS = Object.values(COLOR);
const _u = new THREE.Vector3(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _f = new THREE.Vector3(), _c = new THREE.Color();

export function jarBurst(game, L, kind, k, obj) {
  const id = L.look?.burst; if (!id || id === 'motes') return;
  const add = game.fx?.vfx?.add, alpha = game.fx?.vfx?.alpha; if (!add || !alpha) return;
  obj.updateWorldMatrix(true, false);
  const up = _u.set(0, 1, 0).transformDirection(obj.matrixWorld), at = obj.getWorldPosition(_p), side = _s.set(1, 0, 0).transformDirection(obj.matrixWorld), fwd = _f.crossVectors(side, up);
  const land = kind === 'land', n = Math.round((land ? 10 + 16 * k : 8) * (id === 'confetti' ? 1.4 : 1)), M = L.materials;
  const out = (a, s, lift) => side.clone().multiplyScalar(Math.cos(a) * s).addScaledVector(fwd, Math.sin(a) * s).addScaledVector(up, lift);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, r = Math.random(), pos = at.clone().addScaledVector(up, 0.05);
    if (id === 'dye') alpha.emit({ pos, vel: out(a, 1.2 + 1.6 * k, 0.5 + r), life: 0.9, size: 0.18, sizeEnd: 0.42, color: _c.copy(M.bodyColor).getHex(), alpha: 0.55, alphaEnd: 0, drag: 3, shape: 'puff', spin: (r - 0.5) * 2 });
    else if (id === 'petals') alpha.emit({ pos: pos.addScaledVector(up, 0.3), vel: out(a, 0.8 + 1.4 * k, 1.6 + 1.4 * r), life: 1.8, size: 0.09, sizeEnd: 0.07, color: [0xf2a0b8, 0xffd7a8, 0xfff0f4][i % 3], alpha: 1, alphaEnd: 0, drag: 1.6, gravity: 0.9, shape: 'petal', spin: (r - 0.5) * 8 });
    else if (id === 'sparks') add.emit({ pos, vel: out(a, 1.5 + 2.5 * k, 2 + 3 * r), life: 0.55, size: 0.07, sizeEnd: 0.01, color: 0xffd06a, colorEnd: 0xff7a30, alpha: 1, alphaEnd: 0, drag: 1.2, gravity: 7, shape: 'streak', stretch: 1 });
    else if (id === 'bubbles') add.emit({ pos: pos.addScaledVector(up, 0.2 + 0.4 * r), vel: out(a, 0.4 + 0.6 * k, 0.5 + 0.7 * r), life: 1.6, size: 0.06, sizeEnd: 0.11, color: _c.copy(M.inner).getHex(), alpha: 0.9, alphaEnd: 0, drag: 1.5, gravity: -0.4, shape: 'bubble', twinkle: 0.3 });
    else if (id === 'confetti') alpha.emit({ pos: pos.addScaledVector(up, 0.4), vel: out(a, 1 + 2 * k, 2.2 + 2 * r), life: 1.4, size: 0.06, sizeEnd: 0.05, color: FEELINGS[i % FEELINGS.length], alpha: 1, alphaEnd: 0.2, drag: 2, gravity: 3, shape: 'chip', spin: (r - 0.5) * 14 });
  }
}
