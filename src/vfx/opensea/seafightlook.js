// ---------------------------------------------------------------------------------------
// THE FIGHT AT THE HELM, ITS LOOK (Petra's handoff, 2026-10-22: docs/handoffs/calissa/2026-10-22-from-petra-sea-serpent-looks.md): what
// the open sea's fight throws, drawn in the crossing's own hand so a shot at sea reads as a shot on the rail. Petra's runtime
// (world/opensea/seafight.js) moves everything and decides what it does; it hands each frame's shots and globs to `draw` and calls the
// moments (`muzzle`, `hit`, `splash`, `hull`). Nothing here is counted or decides anything.
//
//   THE NEEDLES   the psygun's shots as the rail draws them (vfx/railshots.js `gun`): a thin streak in the ship's colour, white at its heart,
//                 light added, never a capsule with a rim. A muzzle's flash at the bow as each one leaves; a hit on the serpent a spray of
//                 sparks in that colour and the hide's chips; a needle into the sea a pinprick on the water.
//   THE GLOB      the spit, an outlined shot (the rail's word, courier/ship/shots.js): drawn as the rail's umbral shot, a black core of
//                 crude with a pale rim, the parry mark's ring round it (the one look that says "only the parry answers this"). Sent back
//                 it is the Courier's: its outline gone, its core lit in the ship's colour. Falling short it bursts on the water (a dive's
//                 crown and rings); on the hull it bursts dark and the deck shakes (the runtime's shake).
//
// Prior art: the rail's own shots (Touhou's and Cave's core and edge; Rez's lasers; Cuphead's pink parry, ours the parry mark), The Wind
// Waker's cannon at sea (a puff at the muzzle, a ring of spray where a shot lands short), Sea of Thieves' splash on a near miss.
//
//   game.seaFightLook = new SeaFightLook(game)
//   .draw(fight)   (each frame: fight.shots [{ pos, vel }], fight.globs [{ pos, vel, back }])
//   .muzzle(from, dir)   .hit(point, dir)   .splash(pos, 'shot' | 'glob')   .hull(pos)   .parked() -> [mesh] (the warm-up)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RailShots } from '../railshots.js';
import { LANCE_COLOR } from '../../courier/ship/shots.js';

export const SEA_FIGHT_LOOK = { globR: 0.85, sparks: 10, chips: 6 }; // (the glob's drawn head (m): its hit sphere is 0.7, drawn a little larger, as the rail's are)

const _c = new THREE.Color(), _v = new THREE.Vector3(), _u = new THREE.Vector3(0, 1, 0);

export class SeaFightLook {
  constructor(game) {
    this.game = game;
    this.shots = new RailShots({ cap: 8, guns: 48 }).build(game.scene);
    this.shots.mesh.userData.zone = 'opensea'; this.shots.mesh.renderOrder = 60;
    this.shots.color(LANCE_COLOR);
    this.gold = new THREE.Color(LANCE_COLOR);
  }
  parked() { return this.shots.parked(); }

  /** This frame's needles and globs, as the runtime holds them. */
  draw(fight) {
    const S = this.shots, shots = fight.shots, globs = fight.globs;
    const m = Math.min(shots.length, S.gunCap);
    for (let i = 0; i < m; i++) S.gun(i, shots[i].pos, shots[i].vel);
    S.guns = m;
    let n = 0;
    for (const b of globs) {
      if (n >= S.cap) break;
      // (coming: the rail's umbral shot, outlined; sent back: the astral, its outline gone, the Courier's now)
      S.set(n, b.pos, b.vel, b.back ? 'astral' : 'umbral', !b.back, SEA_FIGHT_LOOK.globR, 1, ((b.seed ??= Math.random()) % 1));
      n++;
    }
    S.count = n;
    S.show(m + n > 0);
    S.update(this.game.rawDt ?? 1 / 60, this.game.camera);
  }

  /** A needle leaves the bow: a small flash and a few sparks along the aim. */
  muzzle(from, dir) {
    const fx = this.game.fx; if (!fx?.add) return;
    for (let i = 0; i < 4; i++) fx.add.emit({ pos: from.clone(), vel: _v.copy(dir).multiplyScalar(6 + Math.random() * 6).add(new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5)).clone(), life: 0.12, size: 0.16, sizeEnd: 0.02, color: this.gold.clone(), alpha: 0.9, drag: 6, gravity: 0 });
  }

  /** A needle (or a glob sent home) strikes the serpent: sparks in the ship's colour and the hide's chips. */
  hit(point, dir) {
    const fx = this.game.fx; if (!fx) return;
    fx.impact?.(point, _v.copy(dir).negate().normalize(), { color: 0x9aa7b0, sparks: SEA_FIGHT_LOOK.chips, dust: 2 });
    if (!fx.add) return;
    for (let i = 0; i < SEA_FIGHT_LOOK.sparks; i++) fx.add.emit({ pos: point.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.5) * 6).addScaledVector(dir, -3), life: 0.3, size: 0.07, sizeEnd: 0.01, color: _c.copy(this.gold).clone(), alpha: 1, drag: 2, gravity: 6 });
  }

  /** Into the sea: a needle a pinprick, a glob falling short a burst (a dive's crown and its rings). */
  splash(pos, kind = 'shot') {
    const W = this.game.water; if (!W?.disturb) return;
    if (kind === 'glob') W.disturb(pos.x, pos.z, 1.2, 'dive', pos.y);
    else W.disturb(pos.x, pos.z, 0.15, 'stroke', pos.y);
  }

  /** A glob bursts on the hull: dark spray and the crude's chips where it struck. */
  hull(pos) {
    const fx = this.game.fx; if (!fx) return;
    fx.impact?.(pos, _u, { color: 0x1a120c, sparks: 4, dust: 10 });
    this.game.water?.disturb?.(pos.x, pos.z, 0.8, 'land');
  }
}
