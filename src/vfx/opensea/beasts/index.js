// ---------------------------------------------------------------------------------------
// THE SEA BEASTS' BODIES, MADE BY ID (docs/plans/OPEN-SEA.md 14.3): `game.makeSeaBeast(id, { segments, length })` for Petra's chain
// chassis (creatures/seaserpent/seaserpent.js: drive/update/hit/down, headPos, headRadius, segmentsAt, radii), a small table of makers a
// beast (another body adds its line to BEAST_LOOKS); an id with none falls through to the sea serpent's body at that length. The
// umibozu and the kraken are not chains: `game.makeUmibozu({ seaY })` (beasts/umibozu.js), `game.makeKraken(o)` (beasts/kraken.js),
// each its own drive. And a DEBUG look at them without a mind: `/beastlook akhlut | umibozu | both | kraken | worldSerpent | off`,
// beside the ship (moored or sailing), each running its moves on a loop (`window.__beastTest`: { show(which), pose(which, move, k,
// rise), step(dt), list }; the kraken's and Jormungandr's: `.chain`, a BeastLookTest, ticked by the fight's look).
//
// Prior art: the safari's body maker (egregorebodies.js, `game.makeEgregore`), the serpent's (`game.makeSeaSerpent`, boot/rooms.js) and
// the rail's foe bodies by role (vfx/railfoes.js railFoeBody(role)): one maker a kind, a plain one for a kind not drawn yet.
//
//   installSeaBeasts(game) -> tester (once a game: rooms.js and the fight's look both ask)   BEAST_LOOKS { [id]: (game, o) => body }
//   makeSeaBeast(game, id, o)   tester.tick(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SeaSerpentBody } from '../seaserpentbody.js';
import { AkhlutBody } from './akhlut.js';
import { UmibozuBody } from './umibozu.js';
import { KrakenBody } from './kraken.js';
import { JormungandrBody } from './jormungandr.js';

export const BEAST_LOOKS = {
  wolfWhale: (game, o) => new AkhlutBody(game, o),
  worldSerpent: (game, o) => new JormungandrBody(game, o),
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

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const _v = new THREE.Vector3();

/** The look test: a body beside the ship, its moves on a loop (the kraken's 14 real s, Jormungandr's 38). */
class BeastLookTest {
  constructor(game) { this.game = game; this.body = null; this.kind = null; this.lt = 0; this.centre = new THREE.Vector3(); }
  start(kind = 'kraken') {
    this.stop(); const H = this.game.opensea?.helm; if (!H) return 'board a ship on the open sea first';
    this.kind = kind === 'kraken' || kind === 'bigSquid' ? 'kraken' : 'worldSerpent'; this.lt = 0; this.centre.copy(H.pos);
    this.body = this.kind === 'kraken' ? this.game.makeKraken() : this.game.makeSeaBeast('worldSerpent', {});
    return `${this.kind}'s look beside the ship (the look only: nothing hits)`;
  }
  stop() { this.body?.dispose(); this.body = null; }
  tick(dt) {
    const B = this.body, H = this.game.opensea?.helm; if (!B || !H) return;
    this.lt += dt;
    if (this.kind === 'kraken') {
      const t = this.lt % 14, grasp = t < 9 ? clamp01((t - 1) / 2.5) : 0, slam = (a) => (t > a && t < a + 2.2 ? clamp01((t - a) / 2) : 0);
      const arms = [0, 1, 2, 3, 4, 5].map((id) => ({ id, move: null, k: 0 }));
      arms[0].move = arms[3].move = grasp ? 'grasp' : null; arms[0].k = arms[3].k = grasp;
      if (slam(2)) { arms[1].move = 'slam'; arms[1].k = slam(2); }
      if (slam(6)) { arms[4].move = 'slam'; arms[4].k = slam(6); }
      B.drive({ hull: H, open: t > 5 && t < 13, move: t > 10 && t < 11.5 ? 'ink' : null, k: clamp01((t - 10) / 1), arms });
      B.hit('arm2', 0.6);
    } else {
      const t = this.lt % 38, C = this.centre;
      if (t < 12 || t >= 18) { // (circle at Petra's 125 m, then the coil of the world closing 120 to 15 m over 20 real s)
        const world = t >= 18, r = world ? 120 + (15 - 120) * clamp01((t - 18) / 20) : 125, a = (world ? (t - 18) * 0.35 : t * 0.112) + 0.4;
        const head = _v.set(C.x + Math.cos(a) * r, C.y, C.z + Math.sin(a) * r), heading = Math.atan2(-Math.sin(a), Math.cos(a));
        B.drive({ head, heading, rise: 1, move: world ? 'coilWorld' : 'circle', k: 1, ring: { centre: C, r } });
      } else { // (rise, then the spit's fan, 90 m off the bow)
        const f = _v.set(Math.sin(H.yaw), 0, Math.cos(H.yaw)), head = new THREE.Vector3().copy(H.pos).addScaledVector(f, 90);
        const k = clamp01((t - 12) / 1.6), spit = t > 15;
        B.drive({ head, heading: H.yaw + Math.PI, rise: 1, move: spit ? 'spit' : 'rise', k: spit ? clamp01((t - 15) / 1.1) : k });
      }
    }
    B.update(dt);
  }
}

export function installSeaBeasts(game) {
  if (game.seaBeastTest) return game.seaBeastTest;
  game.makeSeaBeast = (id, o) => makeSeaBeast(game, id, o);
  game.makeUmibozu = (o) => new UmibozuBody(game, o);
  game.makeKraken = (o) => new KrakenBody(game, o);
  const T = new BeastTest(game), C = new BeastLookTest(game); T.chain = C; T.tick = (dt) => C.tick(dt); game.seaBeastTest = T;
  if (typeof window !== 'undefined') window.__beastTest = T;
  const say = (s) => game.log?.say?.('info', s, { key: 'beastlook', throttle: 0 });
  const register = () => {
    if (!game.chat?.add) return false;
    game.chat.add('beastlook', { debug: true, help: "the sea beasts' bodies on a loop beside the ship, no mind: /beastlook akhlut | umibozu | both | kraken | worldSerpent | off (DEBUG; on the open sea)", run: ([w] = []) => {
      const k = String(w || 'both');
      if (k === 'off') { T.show('none'); C.stop(); say('The beast look is off.'); return; }
      if (k === 'kraken' || k === 'bigSquid' || k === 'worldSerpent' || k === 'jormungandr') { say(C.start(k === 'jormungandr' ? 'worldSerpent' : k)); return; }
      T.show(k);
    } });
    return true;
  };
  let tries = 0; const again = () => { if (!register() && tries++ < 40) setTimeout(again, 500); }; again(); // (the chat may be booted after the rooms)
  return T;
}
