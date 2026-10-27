// ---------------------------------------------------------------------------------------
// THE SEA BEASTS' BODIES, MADE BY ID (docs/plans/OPEN-SEA.md 14.3): `game.makeSeaBeast(id, { segments, length })` for Petra's chain
// chassis (creatures/seaserpent/seaserpent.js: drive/update/hit/down, headPos, headRadius, segmentsAt, radii), a small table of makers a
// beast (another body adds its line to BEAST_LOOKS); an id with none falls through to the sea serpent's body at that length. The
// umibozu is not a chain: `game.makeUmibozu({ seaY })`, its own drive (beasts/umibozu.js). And a DEBUG look at them without a mind:
// `/beastlook akhlut | umibozu | both | off`, beside the ship (moored or sailing), each running its moves on a loop
// (`window.__beastTest`: { show(which), pose(which, move, k, rise), step(dt), list }).
//
// Prior art: the safari's body maker (egregorebodies.js, `game.makeEgregore`) and the serpent's (`game.makeSeaSerpent`, boot/rooms.js).
//
//   installSeaBeasts(game)   BEAST_LOOKS { [id]: (game, o) => body }   makeSeaBeast(game, id, o)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SeaSerpentBody } from '../seaserpentbody.js';
import { AkhlutBody } from './akhlut.js';
import { UmibozuBody } from './umibozu.js';

export const BEAST_LOOKS = {
  wolfWhale: (game, o) => new AkhlutBody(game, o),
};
export function makeSeaBeast(game, id, o = {}) { return (BEAST_LOOKS[id] || ((g, oo) => new SeaSerpentBody(g, oo)))(game, o); }

const _h = new THREE.Vector3(), _l = new THREE.Vector3();
/** The two looks on a loop beside the ship: what each move looks like, with no mind. */
class BeastTest {
  constructor(game) { this.game = game; this.list = {}; this.t = 0; this.fixed = {}; this.raf = 0; this.last = 0; }
  ship() { const H = this.game.opensea?.helm; return H ? { pos: H.pos, yaw: H.yaw, length: H.look?.length ?? 35, beam: H.look?.beam ?? 9, deckY: H.look?.deckY ?? 2.3 } : null; }
  show(which = 'both') {
    for (const k of Object.keys(this.list)) { this.list[k].dispose(); delete this.list[k]; }
    const g = this.game, sea = this.ship()?.pos.y ?? undefined;
    if (which === 'akhlut' || which === 'both') this.list.akhlut = new AkhlutBody(g, { seaY: sea });
    if (which === 'umibozu' || which === 'both') this.list.umibozu = new UmibozuBody(g, { seaY: sea });
    this.fixed = {}; this.t = 0;
    if (Object.keys(this.list).length && !this.raf && typeof requestAnimationFrame === 'function') {
      const loop = (now) => { const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0; this.last = now; this.step(dt); this.raf = Object.keys(this.list).length ? requestAnimationFrame(loop) : 0; };
      this.raf = requestAnimationFrame(loop);
    }
    return Object.keys(this.list);
  }
  /** Hold one at a move (for a shot): pose('akhlut', 'breach', 0.78). */
  pose(which, move, k, rise = 1) { this.fixed[which] = { move, k, rise }; }
  step(dt) {
    const S = this.ship(); if (!S) return;
    this.t += dt;
    const f = _h.set(Math.sin(S.yaw), 0, Math.cos(S.yaw)), r = _l.set(Math.cos(S.yaw), 0, -Math.sin(S.yaw));
    const A = this.list.akhlut;
    if (A) {
      const F = this.fixed.akhlut, c = this.t % 16, beat = F ? null : c < 4 ? [null, 1, 0] : c < 6 ? ['ram', 1, (c - 4) / 2] : c < 8 ? ['dive', 0, (c - 6) / 2] : c < 12 ? ['breach', 0, (c - 8) / 3.2] : [null, 1, 0];
      const move = F ? F.move : beat[0], rise = F ? F.rise : beat[1], k = F ? F.k : Math.min(1, beat[2]);
      const land = S.pos.clone().addScaledVector(r, 55).addScaledVector(f, 10); land.y = S.pos.y;
      const a = this.t * 0.12, head = S.pos.clone().addScaledVector(r, 95 * Math.cos(a)).addScaledVector(f, 95 * Math.sin(a));
      if (move === 'breach') head.copy(S.pos).addScaledVector(r, 120).addScaledVector(f, -30);
      A.drive({ head, heading: move === 'breach' ? Math.atan2(land.x - head.x, land.z - head.z) : S.yaw + a + Math.PI / 2, rise, move: k >= 1 && move === 'breach' ? null : move, k, land, landR: 14 });
      A.update(dt);
    }
    const M = this.list.umibozu;
    if (M) {
      const F = this.fixed.umibozu, c = this.t % 18, beat = F ? null : c < 3 ? ['rise', (c) / 3] : c < 5 ? [null, 0] : c < 7 ? ['grip', (c - 5) / 2] : c < 12 ? ['grip', 1] : c < 14 ? [null, 0] : c < 15.5 ? ['dive', (c - 14) / 1.5] : [null, 0];
      const move = F ? F.move : beat[0], k = F ? F.k : beat[1], rise = F ? F.rise : c < 14 ? 1 : 0;
      const at = S.pos.clone().addScaledVector(r, -60);
      M.drive({ at, heading: S.yaw + Math.PI / 2, rise, move, k, hull: S });
      M.update(dt);
    }
  }
}

export function installSeaBeasts(game) {
  game.makeSeaBeast = (id, o) => makeSeaBeast(game, id, o);
  game.makeUmibozu = (o) => new UmibozuBody(game, o);
  const T = new BeastTest(game);
  if (typeof window !== 'undefined') window.__beastTest = T;
  const register = () => {
    if (!game.chat?.add) return false;
    game.chat.add('beastlook', { debug: true, help: "the sea beasts' bodies on a loop beside the ship, no mind: /beastlook akhlut | umibozu | both | off (DEBUG; on the open sea)", run: ([w] = []) => T.show(String(w || 'both')) });
    return true;
  };
  let tries = 0; const again = () => { if (!register() && tries++ < 40) setTimeout(again, 500); }; again(); // (the chat may be booted after the rooms)
  return T;
}
