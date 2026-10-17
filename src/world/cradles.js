// ---------------------------------------------------------------------------------------
// CRADLES: the Pneuka Jar as a seal (docs/plans/HANKO.md, ruled by the owner 2026-10-17; names Espada's, LORE.md). A cradle is a
// receptacle built into a machine, a gate or a ship's helm. F at one and the Courier folds back into the Pneuka Jar (the god hand's
// form change, the same clips: godhand/pneukajarclips.js), the Jar drops into the cradle and SEALS: the thing wakes and runs as you.
// F again unseals: the Jar lifts out and the Courier stands beside it. Three kinds (HANKO.md 4):
//   threshold  a stamp at once: it opens, remembers your seal, and you step out again (`hold: true` keeps you in, for a page to choose)
//   engine     runs while you are sealed in, on the pool: `drain` a real second, shown on its tag; the pool empty, you are put out
//   body       you drive it (its own controller, as the skiff is); the pool is its hull: empty, the body fails and the Jar is thrown
//              clear, cracked
// A sealed Jar is struck only through its cradle (HANKO.md 6.4): every blow on the Courier goes to the cradle's `hurt`, or nowhere.
// The core movement is untouched: the Courier's body is held still and hidden while sealed, and unsealing restores it exactly.
//
// YOUR SEAL (HANKO.md 5): the Jar's base, carved once at character creation and never again ("Recarving your seal would be like making
// a new account", the owner): a name of two or three syllables, an outline (round, square, oval, gourd), a carving (relief: the name in
// ink; intaglio: the name cut out of it). A save section of scope `settings`, so it survives a new build. The picker is Calissa's
// (`seal.choose`); the imprint's look and the stamp's sound are Calissa's and Wanda's, on `seal.set`.
//
// Prior art: Mega Man Battle Network's jack-in (every machine a port), Breath of the Wild's Sheikah Slate pedestals, Metroid's Morph Ball
// sockets, Kirby Planet Robobot's armour and Mario Odyssey's capture (a bigger body with its own moves), the Japanese registered seal.
//
//   game.cradles = new Cradles(game)
//   .add({ id, kind, pos, yaw?, reach?, hold?, drain?, onSeal?(c), onUnseal?(c, why), hurt?(blow), update?(dt, c) }) -> cradle   .remove(c)
//   .seal(c, by?) -> bool   .unseal(why?, by?, { now }?) -> bool   .sealed (the cradle you are in, or null)   .near() (the one F would seal)
//   .mine -> { name, outline, carving } | null   .choose({ name, outline, carving }) -> bool (once, ever)
//   .struck(blow) (vessel/damage.js asks it first while sealed)    events: seal.set / seal.unset { cradle, kind, by, why? }, seal.carve
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { tag } from '../core/tags.js';

export const CRADLE_KINDS = ['threshold', 'engine', 'body'];
export const SEAL_OUTLINES = ['round', 'square', 'oval', 'gourd'];
export const SEAL_CARVINGS = ['relief', 'intaglio'];
const STAMP = 0.55; // (real seconds from F to the stamp: the fold, the drop, the quarter turn; one beat, always the same)
const OUT = 0.4; // (real seconds the Jar is shown lifting out, as the god hand's ~ out)
const REACH = 1.6, STEP = 1.1; // (metres: F's reach to a cradle; where the Courier stands on unsealing, in front of it)

export class Cradles {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.sealed = null; this.phase = null; this.t = 0;
    this.mine = null;
    game.save?.section('seal', { scope: 'settings', version: 1, dump: () => this.mine, load: (d) => { this.mine = valid(d) ? { ...d } : null; }, reset: () => { this.mine = null; } });
    game.interact?.add('cradle', () => { const c = this.near(); return c ? { pos: c.pos.clone().setY(c.pos.y + 0.6), d: c.d, ref: `cradle.${c.id}` } : null; });
  }

  add({ id, kind = 'threshold', pos, yaw = 0, reach = REACH, hold, drain = 0, onSeal = null, onUnseal = null, hurt = null, update = null }) {
    if (!CRADLE_KINDS.includes(kind)) throw new Error(`cradle ${id}: no kind ${kind}`);
    const c = { id, kind, pos: pos.clone(), yaw, reach, hold: hold ?? kind !== 'threshold', drain, onSeal, onUnseal, hurt, update, d: 0, imprint: false };
    tag(c, 'cradle'); this.list.push(c);
    return c;
  }
  remove(c) { if (this.sealed === c) this.unseal('removed', 'environment'); this.list = this.list.filter((x) => x !== c); }

  /** The cradle F would seal into from where the Courier stands, if any. */
  near() {
    const g = this.game, P = g.player;
    if (this.sealed || g.god?.controlling || g.techs?.active || !P.grounded) return null;
    let best = null;
    for (const c of this.list) { const d = c.pos.distanceTo(P.pos); if (d < c.reach && (!best || d < best.d)) { c.d = d; best = c; } }
    return best;
  }

  /** Carve your seal: once, ever (HANKO.md 5). The picker at character creation calls it. */
  choose(s) {
    if (this.mine || !valid(s)) return false;
    this.mine = { name: String(s.name).toUpperCase(), outline: s.outline, carving: s.carving };
    this.game.save?.dirty('seal'); this.game.events?.emit('seal.carve', { ...this.mine });
    return true;
  }

  get jar() { return this.game.god?.jar; }

  seal(c, by = 'courier') {
    const g = this.game, P = g.player, J = this.jar;
    if (this.sealed || !c || !J) return false;
    this.sealed = c; this.phase = 'in'; this.t = 0;
    g.techs?.get('carry')?.drop?.(); g.weapon && (g.weapon.charge = 0, g.weapon.holding = false, g.weapon.cancelCharge?.());
    for (const t of g.belt?.tools || []) if (t.wants || t.drawT > 0) t.stow(); // (nothing in the hands: the Courier folds into the Jar)
    P.vel.set(0, 0, 0); P.freeze = true;
    g.character.setHidden(true);
    if (!J.alive || J.hp <= 0) { J.hp = J.max * 0.6; J.alive = true; }
    J.pos.copy(c.pos); J.group.position.copy(c.pos); J.group.rotation.y = c.yaw; J.group.visible = true;
    J.clips?.R.start('summon');
    return true;
  }

  /** `now`: out at once, with no beat and no step in front of the cradle, for a cradle whose act moves you elsewhere (a Shrine's
   *  threshold travelling, its arch opening the Spirit Garden): the move that follows sets the Courier down. */
  unseal(why = 'f', by = 'courier', { now = false } = {}) {
    const g = this.game, c = this.sealed, J = this.jar;
    if (!c || this.phase === 'out') return false;
    this.phase = 'out'; this.t = 0;
    if (J?.alive && !now) J.clips?.R.play('dismiss');
    c.onUnseal?.(c, why);
    g.events?.emit('seal.unset', { cradle: c.id, kind: c.kind, by, why });
    if (now) this.stepOut(false);
    return true;
  }

  /** The Courier back on their feet (in front of the cradle, unless `place` is false), the Jar put away. */
  stepOut(place = true) {
    const g = this.game, c = this.sealed, P = g.player, J = this.jar;
    const at = c.pos.clone().add(new THREE.Vector3(Math.sin(c.yaw), 0, Math.cos(c.yaw)).multiplyScalar(STEP));
    if (J) J.group.visible = false;
    P.freeze = false; g.character.setHidden(false);
    if (place) g.course?.teleport ? g.course.teleport(at, c.yaw, { keepPool: true }) : P.pos.copy(at);
    this.sealed = null; this.phase = null;
    if (this.wrecked) { this.wrecked = false; g.vesselDamage?.hit({ dir: new THREE.Vector3(Math.sin(c.yaw), 0, Math.cos(c.yaw)), k: 0.6, why: 'wreck', by: 'environment' }); } // (a body that failed throws the Jar clear, cracked)
  }

  /** A blow on the Courier while sealed goes to the cradle (HANKO.md 6.4): its own `hurt`, or nothing at all. */
  struck(blow) { this.sealed?.hurt?.(blow, this.sealed); return -1; }

  update(dt) {
    const g = this.game, I = g.input, c = this.sealed;
    if (!c) {
      const n = g.interact?.cur?.id === 'cradle' ? this.near() : null;
      if (n && I?.wasPressed('KeyF') && !g.log?.typing && I.enabled) this.seal(n);
      return;
    }
    this.t += g.rawDt ?? dt;
    if (this.phase === 'in' && this.t >= STAMP) {
      this.phase = 'on'; this.t = 0;
      const first = !c.imprint; c.imprint = true;
      g.events?.emit('seal.set', { cradle: c.id, kind: c.kind, by: 'courier', first, seal: this.mine ? { ...this.mine } : null });
      c.onSeal?.(c);
      if (!c.hold) this.unseal('stamped');
      return;
    }
    if (this.phase === 'out') { if (this.t >= OUT) this.stepOut(); return; }
    if (this.phase !== 'on') return;
    c.update?.(dt, c);
    const pool = g.lachryma;
    if (c.drain > 0 && pool) {
      pool.drain(c.drain * dt, `cradle.${c.id}`);
      if (pool.value <= 0.01) { this.unseal(c.kind === 'body' ? 'wrecked' : 'dry', 'environment'); if (c.kind === 'body') this.wrecked = true; }
    }
    if (I?.wasPressed('KeyF') && !g.log?.typing && I.enabled && !c.keepF) this.unseal('f');
  }
}

/** A seal as carved: a name of two or three syllables' letters, one of the outlines, one of the carvings. */
function valid(s) {
  return !!s && typeof s.name === 'string' && /^[A-Za-z]{2,12}$/.test(s.name) && SEAL_OUTLINES.includes(s.outline) && SEAL_CARVINGS.includes(s.carving);
}
