// ---------------------------------------------------------------------------------------
// THE DOMAINS' LOOKS IN PLAY (`game.domainLooks`; docs/plans/art/VFX-LIBRARY.md section 2): what plays the seven domains' effects
// (vfx/library/domains.js) where the runtime already says the moment. Looks only: it listens and plays, it never decides.
//   domain.level { domain, by }   the domain's level-up (`domain.<d>.level`) at the Courier, or at the Pneuka Jar while the god hand is up,
//                                 following them; queued, one at a time, DOMAIN_LOOKS.gap real s apart (seven at once never land on one
//                                 spot), and held while the Spirit Garden, a puzzle duel, the shatter or a seam has the screen
//   god.<power> { repeat }        a god power's act (godhand/powers.js says it from its domain's handler): its domain's `.cast` or `.hit`
//                                 where the act begins or lands (POWER_LOOK: the drag's two ends, the press, the jar for Read), scaled
//                                 to the power's reach (progress/godpowers.js rampOf) and clamped to the god hand's view. It plays
//                                 BESIDE the power's own mark (vfx/godhand/marks.js, the Portal's eyes, the ward's circle): the mark is
//                                 what lasts, this is the act's moment; a charm's repeat (TWIN, ECHO) plays it again, weaker
// Where a drag began is read from the runner's stroke (`god.arts.powers.L`, kept by reference each frame, so its a and b are the drag's
// two ends when its act is said at the release); a press is where the hand's cursor is as it is said.
//
// Prior art: the house's split of rules from looks (game.godhandLooks over godhand/powers.js, game.classArtLooks over the class arts);
// Final Fantasy XII's level-ups (Square Enix, 2006: one beat each, in turn when several come at once); Black & White's miracles
// (Lionhead, 2001: the cast's look at the hand's spot, sized to the miracle's reach).
//
//   game.domainLooks = new DomainLooks(game)   (boot/world.js, beside the god hand's looks)   .update(rawDt) each frame (boot/frame.js)
//   DOMAIN_LOOKS (the knobs)   POWER_LOOK (what each god power plays, and where)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GOD_POWERS, POWER_EVENTS, rampOf } from '../progress/godpowers.js';

export const DOMAIN_LOOKS = {
  gap: 0.7,                       // real s between two level-ups said at once
  reach: { cast: 1.6, hit: 0.9 }, // each moment's own reach at scale 1 (m; its ground ring's): a power's look is scaled to its reach by it
  scale: [0.8, 5],                // a god power's look's scale, held to what the god hand's view holds (T.god: fov 24 at 8 to 46 m)
  repeat: 0.7,                    // a charm's repeat plays its look again this strong
  stale: 0.75,                    // m: a kept stroke whose end is this far from the cursor is an old one (a press and release in one frame)
};

const R = (id, key, k = 1) => (g) => (rampOf(id, key, g) ?? 1) * k;
const span = (k = 1, lo = 0) => (g, a, b) => Math.max(lo, a.distanceTo(b) * k);
/** Each god power's looks: [moment, where, its reach (m, or (game, a, b) -> m), delay (real s), 'along' to send it down the stroke].
 *  where: 'a' the drag's start or the press, 'b' the drag's end, 'mid' between them, 'jar' the god hand's Pneuka Jar. */
export const POWER_LOOK = {
  portal: [['cast', 'a', R('portal', 'r')], ['cast', 'b', R('portal', 'r'), 0.15]],            // (each eye opened where the sky's pillar falls)
  fold: [['hit', 'a', R('fold', 'side', 0.5)], ['hit', 'b', R('fold', 'side', 0.5), 0.1]],
  hasten: [['cast', 'a', R('hasten', 'r')]],
  setfast: [['cast', 'a', R('setfast', 'r')]],
  totem: [['cast', 'a', 1.6]],
  strata: [['cast', 'mid', span(0.5, 1)]],
  course: [['hit', 'a', 0.9]],
  read: [['cast', 'jar', R('read', 'r')]],
  gust: [['hit', 'a', span(1 / 3, 1), 0, 'along'], ['hit', 'b', 1.5, 0.25, 'along']],
  slab: [['cast', 'a', R('slab', 'side', 0.5)]],
  herd: [['hit', 'a', 1.2], ['cast', 'b', 1.6, 0.15]],
  take: [['cast', 'a', 1.2]],
  muster: [['hit', 'a', 1.2], ['hit', 'b', 1.2, 0.15]],
  transmute: [['cast', 'a', R('transmute', 'r')]],
  ward: [['cast', 'a', (g, a, b) => Math.max(2, Math.min(a.distanceTo(b), rampOf('ward', 'r', g) ?? 6))]], // (its written circle drawn round the ward's)
  stamp: [['hit', 'a', R('stamp', 'side', 0.5)], ['cast', 'b', R('stamp', 'side', 0.5), 0.15]],
};

const UP = new THREE.Vector3(0, 1, 0), _p = new THREE.Vector3();

export class DomainLooks {
  constructor(game) {
    this.game = game;
    this.queue = []; this.wait = 0; this.later = []; this.stroke = null;
    const E = game.events;
    E?.on?.('domain.level', (e) => { if (e.by === 'courier' && e.domain) this.levelUp(e.domain); });
    for (const id of POWER_EVENTS) E?.on?.(`god.${id}`, (e) => this.power(id, e));
  }

  /** A domain's level-up said: queued (one a domain: a second of the same before its turn is the same beat). */
  levelUp(domain) { if (!this.queue.includes(domain)) this.queue.push(domain); }

  /** Where the Vessoul stands now: the Pneuka Jar while the god hand is up, else the Courier's feet. */
  vessoulAt(out) {
    const g = this.game;
    if (g.god?.active && g.god.jar?.pos) return out.copy(g.god.jar.pos);
    const P = g.player; return P ? out.copy(P.renderPos ?? P.pos) : null;
  }
  /** Whether something else has the screen (a level-up waits for it). */
  busy() { const g = this.game; return !!(g.realm?.active || g.duel?.active || g.death?.active || g.seam?.busy || !g.player); }

  /** A god power's act: its domain's moments where it began or landed, scaled to its reach. */
  power(id, e = {}) {
    const g = this.game, look = POWER_LOOK[id], dom = GOD_POWERS[id]?.domain, K = g.god?.cursor;
    if (!look || !dom || !g.vfx || !K?.point) return;
    const S = this.stroke?.id === id && this.stroke.b.distanceTo(K.point) < DOMAIN_LOOKS.stale ? this.stroke : null; // (the drag it ended, else a press)
    const a = (S ? S.a : K.point).clone(), b = (S ? S.b : K.point).clone(), [lo, hi] = DOMAIN_LOOKS.scale;
    for (const [m, where, reach, delay = 0, how] of look) {
      const at = where === 'b' ? b : where === 'mid' ? a.clone().lerp(b, 0.5) : where === 'jar' ? g.god?.jar?.pos?.clone() : a;
      if (!at) continue;
      const r = typeof reach === 'function' ? reach(g, a, b) : reach, d = how === 'along' ? b.clone().sub(a).setY(0) : null;
      const ctx = { pos: at.clone(), scale: THREE.MathUtils.clamp(r / DOMAIN_LOOKS.reach[m], lo, hi), dir: d && d.lengthSq() > 0.01 ? d.normalize() : UP.clone() };
      const k = e.repeat ? DOMAIN_LOOKS.repeat : 1, name = `domain.${dom}.${m}`;
      if (delay > 0) this.later.push({ t: delay, name, ctx, k }); else this.play(name, ctx, k);
    }
  }

  play(name, ctx, k = 1) { const h = this.game.vfx?.play(name, ctx); if (h) h.k = k; return h; }

  update(dt) {
    dt = Math.min(0.1, dt || 0);
    const g = this.game, L = g.god?.arts?.powers?.L;
    if (L) this.stroke = L; // (the drag in hand: read at its release)
    for (let i = this.later.length - 1; i >= 0; i--) { const q = this.later[i]; if ((q.t -= dt) <= 0) { this.later.splice(i, 1); this.play(q.name, q.ctx, q.k); } }
    if ((this.wait -= dt) > 0 || !this.queue.length || this.busy() || !this.vessoulAt(_p)) return;
    const domain = this.queue.shift(); this.wait = DOMAIN_LOOKS.gap;
    this.play(`domain.${domain}.level`, { pos: _p.clone(), follow: (h) => { if (this.vessoulAt(_p)) h.pos.copy(_p); return true; } }); // (it goes with them as they move)
  }
}
