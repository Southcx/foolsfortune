// ---------------------------------------------------------------------------------------
// THE SEA BEASTS' BODIES, INSTALLED (docs/plans/OPEN-SEA.md 14.3; Dovina's rows: progress/opensea/seabeasts.js): the makers Petra's
// runtime calls for a beast's look, and a DEBUG look test. A chain-bodied beast (creatures/seaserpent/ BEAST_BODY) is made by
// `game.makeSeaBeast(id, { segments, length })`, driven as the sea serpent's body (seaserpentbody.js); an id with no body of its own is
// the plain serpent's chassis. The kraken is not a chain: `game.makeKraken(o)` (beasts/kraken.js; its own drive, arms and parts).
//
//   /beastlook kraken | worldSerpent | off   (DEBUG, on the open sea at the helm: the body beside the ship, cycling its moves, nothing
//   counted and nothing hit; the look only)
//
// Prior art: the rail's foe bodies by role (vfx/railfoes.js railFoeBody(role)): one maker a kind, a plain one for a kind not drawn yet.
//
//   installSeaBeasts(game) -> test   (sets game.makeSeaBeast, game.makeKraken; installed with the fight's look, seafightlook.js)
//   test.start('kraken' | 'worldSerpent', { at })   test.stop()   test.tick(dt)   test.lt (the cycle's real s, settable)   SEA_BEAST_BODIES
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SeaSerpentBody } from '../seaserpentbody.js';
import { KrakenBody } from './kraken.js';
import { JormungandrBody } from './jormungandr.js';

/** Each beast's body maker by its SEA_BEASTS id (a chain body, driven as the serpent's). */
export const SEA_BEAST_BODIES = {
  worldSerpent: (game, o) => new JormungandrBody(game, o),
};

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
    this.chat?.();
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
  game.makeSeaBeast = (id, o = {}) => (SEA_BEAST_BODIES[id] ? SEA_BEAST_BODIES[id](game, o) : new SeaSerpentBody(game, o));
  game.makeKraken = (o) => new KrakenBody(game, o);
  const test = new BeastLookTest(game);
  test.chat = () => { // (the chat line is made after the rooms: added on the fight look's first frame)
    if (test.chatted || !game.chat?.add) return; test.chatted = true;
    const say = (t) => game.log?.say?.('info', t, { key: 'beastlook', throttle: 0 });
    game.chat.add('beastlook', { debug: true, help: "a sea beast's look beside the ship, cycling its moves (DEBUG; at the helm): /beastlook kraken | worldSerpent | off", run: ([k] = []) => {
      if (k === 'off') { test.stop(); say('The beast look is off.'); return; }
      say(test.start(k || 'kraken'));
    } });
  };
  return test;
}
