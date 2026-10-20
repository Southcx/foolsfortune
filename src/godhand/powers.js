// ---------------------------------------------------------------------------------------
// THE DOMAINS' GOD POWERS, AT RUN TIME (docs/plans/GODHAND.md sections 8 and 11): the runner for the sixteen powers that are not the
// God Arts of old nor the matter's verbs. Each power is a handler in its domain's module (godhand/powers/<domain>.js) with a small
// contract, and this runner gives them the hand's cursor, the island's matter, the ramp (progress/godpowers.js RAMP: its numbers by the
// domain's level), marks on the ground, and what lasts (a portal, a ward, a totem: `keep`). Every act is an event `god.<id>` with `by`
// and `act` (the domains' sources and dissonance reads it).
// Placeholder looks throughout: plain rings and lines in the domain's colour (Calissa's to dress).
//
// Prior art: the house's own God Arts (godhand/arts.js: begin on press, hold, end on release); Black & White 2's miracles that stand
// (a totem is a miracle held); Populous's powers as a short list by kind.
//
//   handler = { begin(P, L) -> bool, hold?(P, L, dt), end?(P, L), passive?(P, dt) }   L = { id, a, b, t, shift }
//   P.ramp(id, key)   P.keep({ tick(dt) -> done, dispose() })   P.ring(at, r, colour)   P.line(points, colour)   P.emit(id, payload)
//   P.near(p, r)   P.creatureAt(p)   P.place(c|body, at)   P.walk(c, to, secs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GOD_POWERS, rampOf, DOMAIN_COLOUR, DOMAIN_ORDER } from '../progress/godpowers.js';
import { expAt } from '../progress/domains.js';
import { CHARMS } from '../progress/bracelet.js';
import { SPACE } from './powers/space.js';
import { MAKE } from './powers/make.js';
import { SIGHT } from './powers/sight.js';
import { FORCE } from './powers/force.js';
import { WILL } from './powers/will.js';
import { SCRIPT } from './powers/script.js';
import { ALTER } from './powers/alter.js';
import { hideSight } from './powers/sight.js';
import { dropSlab } from './powers/force.js';

/** Run `fn` with every Lachryma the pool spends or drains in it multiplied by `k` (a charm's cost: progress/bracelet.js). */
export function withCost(pool, k, fn) {
  if (!pool || k === 1) return fn();
  const s = pool.spend, d = pool.drain, ownS = Object.hasOwn(pool, 'spend'), ownD = Object.hasOwn(pool, 'drain');
  pool.spend = (a, ...r) => s.call(pool, a * k, ...r); pool.drain = (a, ...r) => d.call(pool, a * k, ...r);
  try { return fn(); } finally { if (ownS) pool.spend = s; else delete pool.spend; if (ownD) pool.drain = d; else delete pool.drain; }
}
/** Powers TWIN and ECHO never repeat: a toggle (Slab, Take) or seeing (Strata, Course, Read). */
const NO_REPEAT = new Set(['slab', 'take', 'strata', 'course', 'read']);

export const HANDLERS = { ...SPACE, ...MAKE, ...SIGHT, ...FORCE, ...WILL, ...ALTER, ...SCRIPT };
export const POWER_IDS = new Set(Object.keys(HANDLERS));

export class GodPowers {
  constructor(arts) {
    this.arts = arts; this.god = arts.god; this.game = arts.game;
    this.L = null; this.kept = []; this.walking = new Set(); this.marks = [];
    this.chatted = false;
  }

  /** DEBUG: raise the domains to a level, to try the ramp's top (GODHAND.md 11): /psyche 99, or /psyche divination 60 (the ledger's
   *  counters only go up: a lower level is refused). Added once the chat line exists (it is made after the hand: main.js). */
  addChat() {
    this.chatted = true;
    this.game.chat.add('psyche', { debug: true, help: 'raise the domains to a level (DEBUG): /psyche 99 or /psyche divination 60', run: (args) => {
      const g = this.game, lv = Math.max(1, Math.min(99, Number(args[args.length - 1]) || 0)), only = args.length > 1 ? args[0] : null;
      for (const d of DOMAIN_ORDER) {
        if (only && d !== only) continue;
        const need = expAt(lv) - (g.psyche?.exp?.(d) ?? 0);
        if (need > 0) { g.ledger.inc(`exp.${d}`, need); g.events?.emit('domain.level', { domain: d, level: lv, by: 'courier' }); }
      }
    } });
  }

  get F() { return this.game.matter?.ensure(this.god.jar.pos); }
  ramp(id, key) { return rampOf(id, key, this.game); }
  shift() { const i = this.game.input; return i.isDown('ShiftLeft') || i.isDown('ShiftRight'); }

  begin(id) {
    const K = this.god.cursor, H = HANDLERS[id];
    if (!H || !K.ok) return false;
    const L = { id, a: K.point.clone(), b: K.point.clone(), t: 0, shift: this.shift() };
    if (H.begin && this.act(id, () => H.begin(this, { ...L, a: L.a.clone(), b: L.b.clone() })) === false) return false;
    this.L = L;
    return true;
  }
  hold(dt) {
    const L = this.L; if (!L) return;
    L.t += dt; L.b.copy(this.god.cursor.point);
    HANDLERS[L.id].hold?.(this, L, dt);
  }
  end() { const L = this.L; this.L = null; this.arts.hideFx(); const H = L && HANDLERS[L.id]; if (H?.end) this.act(L.id, () => H.end(this, { ...L, a: L.a.clone(), b: L.b.clone() })); }

  /** One act of a power under the bracelet (progress/bracelet.js): its charms' cost on the Lachryma it spends, and TWIN's and ECHO's
   *  repeat of it if it acted (it emitted); each charm that bent it is said for the ring's gold line (`bracelet.charm`). */
  act(id, fn) {
    const g = this.game, dom = GOD_POWERS[id]?.domain, B = g.bracelet;
    this.emitted = false;
    const r = withCost(g.lachryma, B?.costOf?.(dom) ?? 1, fn);
    if (!this.emitted || this.repeating || !B) return r;
    for (const [charm, C] of B.on(dom)) {
      if (!C.repeat) { g.events?.emit('bracelet.charm', { id: CHARMS[charm].label, charm, domain: dom, power: id, by: 'courier' }); continue; }
      if (NO_REPEAT.has(id)) continue;
      let t = 0; const P = this;
      this.keep({ id: 'repeat', tick(dt) {
        if ((t += dt) < C.delay) return false;
        P.repeating = true;
        try { withCost(g.lachryma, B.costOf(dom), fn); } finally { P.repeating = false; }
        g.events?.emit('bracelet.charm', { id: CHARMS[charm].label, charm, domain: dom, power: id, by: 'courier' });
        return true;
      } });
    }
    return r;
  }

  /** Every frame the hand is up: the selected power's passive (Read, Course) and the walk of taken creatures. */
  passive(id, dt) { hideSight(id); HANDLERS[id]?.passive?.(this, dt); }

  /** Every frame, hand up or not: what lasts. */
  update(dt) {
    if (!this.chatted && this.game.chat?.add) this.addChat();
    for (const k of [...this.kept]) if (this.kept.includes(k) && k.tick(dt)) { k.dispose?.(); const i = this.kept.indexOf(k); if (i >= 0) this.kept.splice(i, 1); } // (by identity: a tick may cap and remove others)
    for (const c of this.walking) this.step(c, dt);
    for (let i = this.marks.length - 1; i >= 0; i--) { const m = this.marks[i]; if ((m.life -= dt) <= 0) { this.drop(m.obj); this.marks.splice(i, 1); } }
  }
  keep(item) { this.kept.push(item); return item; }
  count(id) { return this.kept.filter((k) => k.id === id).length; }
  /** The oldest of a power's lasting things goes when one more than its count is made. */
  cap(id, n) { const mine = this.kept.filter((k) => k.id === id); while (mine.length >= n) { const k = mine.shift(); k.dispose?.(); this.kept.splice(this.kept.indexOf(k), 1); } }

  emit(id, payload = {}) { this.emitted = true; this.game.events?.emit(`god.${id}`, { act: true, ...payload, ...(this.repeating ? { repeat: true } : {}), by: 'courier' }); }
  domainColour(id) { return DOMAIN_COLOUR[GOD_POWERS[id]?.domain] ?? 0xffffff; }

  // ---- marks (placeholders: a ring on the ground, a line; flash marks go after `life` real seconds)
  ring(at, r, colour, life = 0) {
    const m = new THREE.Mesh(new THREE.RingGeometry(Math.max(0.05, r - 0.25), r, 48), new THREE.MeshBasicMaterial({ forceSinglePass: true, color: colour, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.set(at.x, at.y + 0.07, at.z); m.renderOrder = 7;
    this.game.scene.add(m);
    if (life) this.marks.push({ obj: m, life });
    return m;
  }
  line(points, colour, life = 0) {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const m = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: 0.85, depthWrite: false }));
    m.frustumCulled = false; m.renderOrder = 7;
    this.game.scene.add(m);
    if (life) this.marks.push({ obj: m, life });
    return m;
  }
  drop(obj) { if (!obj) return; this.game.scene.remove(obj); obj.geometry?.dispose(); obj.material?.dispose(); }

  // ---- what is on the island
  near(p, r) { return (this.game.creatures?.near?.(p, r) || []).filter((c) => c.alive && !c.friend); }
  creatureAt(p, r = 2.5) { let best = null, bd = r; for (const c of this.near(p, r)) { const d = Math.hypot(c.pos.x - p.x, c.pos.z - p.z); if (d < bd) { bd = d; best = c; } } return best; }
  /** Every loose dynamic body within r of a point. */
  bodies(p, r, fn) {
    this.game.physics.world.forEachRigidBody((b) => {
      if (!b.isDynamic()) return;
      const t = b.translation(), dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
      if (d < r && Math.abs(t.y - p.y) < r + 2) fn(b, d, dx, dz, t);
    });
  }
  /** Set a creature or a body down somewhere else, as it is. */
  place(thing, at) {
    const g = this.game;
    if (thing.type === 'creature') {
      if (thing.kind === 'wisp') g.wisps?.place?.(thing, at); else if (g.jellies?.list?.includes(thing)) g.jellies.place(thing, at);
      else { thing.pos?.copy(at); thing.rb?.setTranslation?.({ x: at.x, y: at.y + (thing.height || 1) * 0.5, z: at.z }, true); }
    } else thing.setTranslation({ x: at.x, y: at.y, z: at.z }, true);
  }

  /** A creature walked by the hand (Herd, Take): its mind set aside while it walks, given back when it is done. */
  walk(c, to, secs) {
    if (!c?.brain) return;
    if (!c.godWalk) { c.godWalk = { keep: c.brain.update.bind(c.brain) }; c.brain.end?.('taken'); c.brain.update = () => {}; }
    c.godWalk.to = to.clone(); c.godWalk.until = secs;
    this.walking.add(c);
  }
  release(c) {
    if (!c?.godWalk) return;
    c.brain.update = c.godWalk.keep; c.godWalk = null; c.want?.set(0, 0, 0); c.brain.wake = true;
    this.walking.delete(c);
  }
  step(c, dt) {
    const W = c.godWalk;
    if (!c.alive || !W || (W.until -= dt) <= 0) { this.release(c); return; }
    const dx = W.to.x - c.pos.x, dz = W.to.z - c.pos.z, d = Math.hypot(dx, dz), sp = W.speed ?? 3;
    if (d < 0.6) c.want?.set(0, 0, 0); else c.want?.set((dx / d) * sp, 0, (dz / d) * sp);
  }

  clear() {
    this.L = null;
    dropSlab(this);
    for (const k of this.kept) k.dispose?.();
    this.kept.length = 0;
    for (const c of [...this.walking]) this.release(c);
    for (const m of this.marks) this.drop(m.obj);
    this.marks.length = 0;
  }
}
