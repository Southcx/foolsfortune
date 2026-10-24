// ---------------------------------------------------------------------------------------
// THE COURIER'S FLOURISHES (plain name, a look only): the small personal effects round the body, chosen slot by slot and worn
// everywhere. Five slots, each with a stock (or off) and four or five others:
//   footprints   the print each step leaves (over the ground's own print: vfx/flourishprints.js lays it)
//   dash         what a dash or a blink trails (shed along the way, beside Blink Dash's own afterimage)
//   shatter      how the vessel bursts at a shatter, and how its pieces come home as it is made whole (courier/vessel/death.js asks)
//   aura         a subtle stream round a Courier standing still (off by default)
//   arrival      the gate-out's end (vfx/gatering.js asks) and a Shrine's rest or travel
// A flourish is never a rule and never touches the core movement (CLAUDE.md, "The core movement is the gold standard"): it reads the
// body and the bus (a footstep, `move.dash`, `move.blink`, `courier.reform`, `shrine.rest`, `shrine.travel`) and draws. Its colours are
// the Courier's own: the soul colour (Soul Alchemy's, `game.alchemy`), the body, trim and stones glazes (`vessel.look`).
//
// What each option throws is a library entry (vfx/flourisheffects.js, `flourish.<slot>.<id>`), drawn by the sprite pools; the soul
// ribbon is a weapon trail's (vfx/trail.js); the prints are the one program the flourishes add (vfx/flourishprints.js), built at boot.
// Nothing here allocates in a frame: the vectors and colours are kept, the effects are the pools'.
//
// THE CHOICE is kept with the player's looks (save section `flourishes`, scope player, as the vessel's glazes and the idle are: it travels
// with the player in co-op and resets with progress on a new build). What opens an option is Dovina's (OPEN_WHEN, empty until her rows
// land: docs/handoffs/dovina/2026-10-24-from-calissa-flourishes.md); until then every option is open in the DEBUG save only, and a
// slot's stock is always open.
//
//   game.flourishes = new Flourishes(game)   .worn[slot] (the id worn)   .options(slot) -> [{ id, label, line, open, worn }]
//   .set(slot, id) -> { ok, reason? }   .shatter(mid) -> bool (true: drawn, the stock burst is not)   .arrive(why) -> bool   .update(raw)
//   /flourish (lists)   /flourish <slot> <id>   (DEBUG)      event flourish.set { slot, id, by: 'courier' }
//
// Prior art: the cosmetic slots of Fortnite (contrails, emotes, wraps), Path of Exile and Diablo IV (footprints, portals, auras as
// slots of their own), Destiny's ghost shells and transmat effects (the arrival), Kingdom Hearts' keychains (a look that changes no
// number), and Okami's flowers in Amaterasu's steps.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FlourishPrints } from './flourishprints.js';
import { Trail } from './trail.js';
import { wheelColour } from './wheelcolour.js';
import { GLAZES } from '../courier/vessel/glazes.js';

/** The look table: slot -> { label, line, stock (the id worn by default), options: [{ id, label, line, ... how it is drawn }] }.
 *  A colour is a key: 'soul', 'body', 'trim', 'stones' (the Courier's own), 'petal' (a cherry's pinks), or a hex. */
export const FLOURISHES = {
  footprints: { label: 'Footprints', line: 'What each step leaves on the ground.', stock: 'stock', options: [
    { id: 'stock', label: 'Stock', line: 'The ground\'s own print: sand pressed, paint trodden.' },
    { id: 'blossom', label: 'Blossoms', line: 'A cherry blossom opens where you tread.', print: { kind: 'blossom', size: 0.24, life: 7, color: 'petal', alpha: 0.95 }, fx: 'flourish.step.blossom' },
    { id: 'scorch', label: 'Ash scorch', line: 'Kiln-hot soles: a charred print, embers in it.', print: { kind: 'scorch', size: 0.34, life: 9, color: 0xffffff, alpha: 0.8 }, fx: 'flourish.step.scorch' },
    { id: 'comb', label: 'Comb glyphs', line: 'A cell of the System\'s script, glowing, fading.', print: { kind: 'comb', alt: 'comb2', size: 0.26, life: 3, color: 'soul', alpha: 0.9, glow: 1 }, fx: 'flourish.step.comb' },
    { id: 'paw', label: 'Paw prints', line: 'Something small walks where you walk.', print: { kind: 'paw', size: 0.2, life: 8, color: 0x3a2a20, alpha: 0.55 } },
    { id: 'puddle', label: 'Glaze puddles', line: 'A pool of your body glaze, drying.', print: { kind: 'puddle', size: 0.3, life: 6, color: 'body', alpha: 0.9 }, fx: 'flourish.step.puddle' },
  ] },
  dash: { label: 'Dash trail', line: 'What a dash or a blink leaves along the way.', stock: 'stock', options: [
    { id: 'stock', label: 'Stock', line: 'The blink\'s own afterimage, and nothing more.' },
    { id: 'shards', label: 'Glazed shards', line: 'Chips of your glaze, shed and falling.', fx: 'flourish.dash.shards', every: 0.3, color: 'body', tip: 'trim' },
    { id: 'ribbon', label: 'Soul ribbon', line: 'A ribbon of your soul colour, drawn through the air.', fx: 'flourish.dash.ribbon', every: 0.4, color: 'soul', tip: 'soul', ribbon: true },
    { id: 'talismans', label: 'Paper talismans', line: 'A flurry of ofuda, tumbling down.', fx: 'flourish.dash.talismans', every: 0.45 },
    { id: 'feelings', label: 'Seven feelings', line: 'Motes of all seven feelings, scattered.', fx: 'flourish.dash.feelings', every: 0.3 },
    { id: 'dice', label: 'Tumbling dice', line: 'The stones\' dice, thrown off as you go.', fx: 'flourish.dash.dice', every: 0.6, color: 'stones', tip: 'body' },
  ] },
  shatter: { label: 'Shatter', line: 'How the vessel breaks, and how it is made whole.', stock: 'stock', options: [
    { id: 'stock', label: 'Stock', line: 'Clay and dust and Lachryma\'s light.' },
    { id: 'porcelain', label: 'Blue and white', line: 'Porcelain shards, cobalt-painted, ringing.', color: 'body', tip: 'trim' },
    { id: 'kintsugi', label: 'Kintsugi', line: 'Shards of your glaze; home again with gold in every join.', color: 'body', tip: 'trim' },
    { id: 'ink', label: 'Ink', line: 'You burst into ink, and are drawn back.', color: 'soul', tip: 'soul' },
    { id: 'moths', label: 'Moths', line: 'A cloud of moths that flies apart and gathers.', color: 'soul', tip: 'soul' },
    { id: 'leaves', label: 'Falling leaves', line: 'An autumn\'s worth of leaves, and back.', color: 'body', tip: 'body' },
  ] },
  aura: { label: 'Idle aura', line: 'A faint stream round you while you stand still.', stock: 'off', options: [
    { id: 'off', label: 'Off', line: 'Nothing.' },
    { id: 'motes', label: 'Soul motes', line: 'Motes of your soul colour, drifting up.', fx: 'flourish.aura.motes', color: 'soul' },
    { id: 'comb', label: 'Comb ring', line: 'Cells of the Comb, turning slowly at your feet.', fx: 'flourish.aura.comb', color: 'soul' },
    { id: 'embers', label: 'Kiln embers', line: 'Embers rising, as from a kiln\'s spy-hole.', fx: 'flourish.aura.embers' },
    { id: 'die', label: 'Orbiting die', line: 'A die of your stones, circling.', fx: 'flourish.aura.die', color: 'stones', tip: 'soul', orbit: { r: 0.72, y: 1.3, turn: 1.05 } },
  ] },
  arrival: { label: 'Arrival', line: 'How you come in: through the Index, at a Shrine.', stock: 'stock', options: [
    { id: 'stock', label: 'Stock', line: 'The gate\'s bands of light, coming down.' },
    { id: 'column', label: 'Glaze column', line: 'A column of your body glaze, rising.', fx: 'flourish.arrive.column', color: 'body' },
    { id: 'petals', label: 'Petal swirl', line: 'Blossom petals, whirling down round you.', fx: 'flourish.arrive.petals' },
    { id: 'talismans', label: 'Talisman fall', line: 'Ofuda drifting down from overhead.', fx: 'flourish.arrive.talismans' },
    { id: 'smoke', label: 'Kiln smoke', line: 'A puff of kiln smoke, a kiln door opening.', fx: 'flourish.arrive.smoke' },
  ] },
};
export const FLOURISH_SLOTS = Object.keys(FLOURISHES);
/** What opens an option, by `slot.id`: `(game) => bool` (Dovina's to fill: a predicate over the ledger or the achievements). */
export const OPEN_WHEN = {};
const optionOf = (slot, id) => FLOURISHES[slot]?.options.find((o) => o.id === id) || null;

const LACH = 0xb49be6, PETAL = [0xf6c6d2, 0xf2a8bc, 0xfbe4ea, 0xf7d3dc];
const WHOLE = { delay: 0.3, hold: 0.35, build: 0.65 }; // (made whole, real s after `courier.reform`: the pieces fly in; the body held dissolved, then built from the feet)
const TRAVEL_DELAY = 0.6; // (a Shrine's travel: the arrival waits for the seam's cover to lift, real s)
const DASH = { dash: 0.26, blink: 0.22, perFrame: 10 }; // (how long a dash and a blink shed, real s; the most sheds in one frame)
const AURA_STILL = 0.8; // (m/s: slower than this, the Courier is standing; the aura eases in)
const UP = new THREE.Vector3(0, 1, 0), WHITE = new THREE.Color(1, 1, 1);
const _p = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3();

export class Flourishes {
  constructor(game) {
    this.game = game;
    this.worn = Object.fromEntries(FLOURISH_SLOTS.map((s) => [s, FLOURISHES[s].stock]));
    this.prints = new FlourishPrints(game);
    this.ribbon = new Trail(game.scene, { life: 0.45, max: 40, color: LACH, tip: 0xffffff, core: 1.2, fade: 1.4, k: 0.9 });
    this.ribbon.mesh.visible = true; // (shown for the warm-up's compile; its first update hides it)
    this.colour = { soul: new THREE.Color(LACH), body: new THREE.Color(), trim: new THREE.Color(), stones: new THREE.Color() };
    this.tip = new THREE.Color();
    this.side = 1; this.lastStep = new THREE.Vector3(); this.stepYaw = 0; this.haveStep = false;
    this.dash = { t: 0, dur: 0, acc: 0, at: new THREE.Vector3(), on: false };
    this.whole = null; this.later = null; // (made whole, and an arrival waiting for the seam)
    this.aura = null; this.auraK = 0; this.auraT = 0;
    this.prev = new THREE.Vector3(); this.havePrev = false;
    const ch = game.character;
    if (ch) { const was = ch.onFootstep; ch.onFootstep = () => { was?.(); this.step(); }; } // (the heel strikes' hook, main.js: the sound first)
    const E = game.events;
    E?.on('move.dash', () => this.dashStart(DASH.dash));
    E?.on('move.blink', () => this.dashStart(DASH.blink));
    E?.on('courier.reform', () => this.wholeStart());
    E?.on('shrine.rest', () => this.arrive('rest'));
    E?.on('shrine.travel', () => { this.later = TRAVEL_DELAY; });
    game.save?.section('flourishes', {
      scope: 'player', version: 1, dump: () => ({ ...this.worn }),
      load: (d) => { for (const s of FLOURISH_SLOTS) this.worn[s] = d && optionOf(s, d[s]) ? d[s] : FLOURISHES[s].stock; this.enforce(); },
      reset: () => { for (const s of FLOURISH_SLOTS) this.worn[s] = FLOURISHES[s].stock; },
    });
    game.chat?.add('flourish', {
      debug: true, help: 'the Courier\'s flourishes (DEBUG): /flourish lists them; /flourish footprints blossom, /flourish shatter kintsugi, /flourish aura off',
      run: (args) => this.command(args),
    });
  }

  // ------------------------------------------------------------------ the choice
  /** Open to wear: a slot's stock, anything in the DEBUG save, or what Dovina's rule opens. */
  isOpen(slot, id) {
    if (id === FLOURISHES[slot]?.stock) return true;
    return this.game.mode === 'debug' || OPEN_WHEN[`${slot}.${id}`]?.(this.game) === true;
  }
  /** An option no longer open (the DEBUG save's pick met in STORY) put back to its slot's stock. */
  enforce() { for (const s of FLOURISH_SLOTS) if (!this.isOpen(s, this.worn[s])) this.worn[s] = FLOURISHES[s].stock; }
  options(slot) {
    this.enforce();
    return (FLOURISHES[slot]?.options || []).map((o) => ({ id: o.id, label: o.label, line: o.line, open: this.isOpen(slot, o.id), worn: this.worn[slot] === o.id }));
  }
  set(slot, id) {
    if (!FLOURISHES[slot]) return { ok: false, reason: `There is no such flourish slot (${FLOURISH_SLOTS.join(', ')}).` };
    if (!optionOf(slot, id)) return { ok: false, reason: `There is no such ${FLOURISHES[slot].label.toLowerCase()} flourish.` };
    if (!this.isOpen(slot, id)) return { ok: false, reason: 'That flourish is not open to you yet.' };
    if (this.worn[slot] !== id) {
      this.worn[slot] = id;
      if (slot === 'aura') this.auraStop();
      this.game.save?.dirty('flourishes');
      const o = optionOf(slot, id); // (its words with it, for the log's rule: feedback/tracking/flourishes.js)
      this.game.events?.emit('flourish.set', { slot, id, slotLabel: FLOURISHES[slot].label, label: o.label, line: o.line, stock: id === FLOURISHES[slot].stock, by: 'courier' });
    }
    return { ok: true };
  }
  command(args) {
    const g = this.game, [slot, id] = (args || []).map((a) => String(a).toLowerCase());
    if (!slot) { g.log?.say('system', `Flourishes: ${FLOURISH_SLOTS.map((s) => `${s} ${this.worn[s]} (${FLOURISHES[s].options.map((o) => o.id).join(', ')})`).join('; ')}.`, { key: 'flourish.list', throttle: 1 }); return; }
    const r = this.set(slot, id || '');
    if (!r.ok) g.log?.say('warn', `${r.reason} (/flourish <slot> <id>)`, { key: 'flourish.refuse', throttle: 1 });
  }
  wearing(slot) { const o = optionOf(slot, this.worn[slot]); return o && o.id !== FLOURISHES[slot].stock ? o : null; }

  // ------------------------------------------------------------------ the Courier's colours
  /** A colour key as the Courier wears it now (a kept Color: never allocated). */
  tone(key, out = null) {
    if (key == null) return undefined;
    if (typeof key === 'number') return key;
    if (key === 'petal') return PETAL[Math.floor(Math.random() * PETAL.length)];
    const C = this.colour[key];
    if (!C) return LACH;
    if (key === 'soul') {
      const s = this.game.alchemy?.s?.colour;
      if (s && s.s > 0.08) wheelColour(s.h, s.s, C); else C.setHex(LACH); // (an unpressed soul, the bare clay's grey, reads as Lachryma's violet)
    } else C.setHex(GLAZES[this.game.vessel?.look?.[key]]?.color ?? 0xb4603f);
    return out ? out.copy(C) : C;
  }
  /** Is the Courier's body drawn in the world now (the blob shadow's own test: vfx/blobshadow.js)? */
  shown() { return this.game.blobShadow?.shown?.() ?? !!this.game.character?.root?.visible; }

  // ------------------------------------------------------------------ footprints
  step() {
    const o = this.wearing('footprints'), g = this.game, P = g.player;
    if (!o?.print || !P || !this.shown() || g.techs?.get?.('skiff')?.active) return;
    const f = P.renderPos, dx = f.x - this.lastStep.x, dz = f.z - this.lastStep.z;
    if (this.haveStep && dx * dx + dz * dz > 0.0025 && dx * dx + dz * dz < 9) this.stepYaw = Math.atan2(dx, dz);
    this.lastStep.copy(f); this.haveStep = true;
    this.side = -this.side;
    const y = this.stepYaw, sx = Math.cos(y) * 0.11 * this.side, sz = -Math.sin(y) * 0.11 * this.side;
    const at = g.blobShadow?.below?.(f.x + sx, f.y, f.z + sz);
    if (!at || f.y - at.y > 0.35) return; // (a step in the air, or on nothing)
    const pr = o.print, kind = pr.alt && this.side > 0 ? pr.alt : pr.kind;
    _p.set(f.x + sx, at.y, f.z + sz); _n.copy(at.n);
    this.prints.lay({ pos: _p, n: _n, yaw: y + (kind === 'blossom' ? Math.random() * 6.28 : 0), kind, size: pr.size * (0.9 + Math.random() * 0.2), color: this.tone(pr.color), alpha: pr.alpha, glow: pr.glow || 0, life: pr.life, mirror: this.side < 0 });
    if (o.fx) g.vfx?.play(o.fx, { pos: _p, tint: this.tone(pr.color), floor: at.y });
  }

  // ------------------------------------------------------------------ dash / blink
  dashStart(dur) {
    const o = this.wearing('dash'), P = this.game.player;
    if (!o || !P) return;
    const D = this.dash;
    D.on = true; D.t = 0; D.dur = dur; D.acc = 0; D.at.copy(P.renderPos).addScaledVector(UP, 0.9);
    if (o.ribbon) { const c = this.tone('soul'); this.tip.copy(c).lerp(WHITE, 0.6); this.ribbon.setColors(c.getHex(), this.tip.getHex()); this.ribbon.gap(); } // (the soul colour, its edge paling to white)
  }
  dashTick(raw) {
    const D = this.dash, o = this.wearing('dash'), g = this.game, P = g.player;
    if (!D.on || !o || !P) { D.on = false; return; }
    D.t += raw;
    _p.copy(P.renderPos).addScaledVector(UP, 0.9);
    const d = D.at.distanceTo(_p);
    if (o.ribbon && this.shown()) this.ribbon.push(_a.copy(P.renderPos).addScaledVector(UP, 0.35), _b.copy(P.renderPos).addScaledVector(UP, 1.45));
    D.acc += d;
    let n = 0;
    const tint = this.tone(o.color), tip = this.tone(o.tip);
    while (D.acc >= o.every && n < DASH.perFrame) { // (shed every so many metres along the way, from where the last was)
      D.acc -= o.every; n++;
      const u = d > 1e-4 ? 1 - D.acc / d : 1;
      _a.lerpVectors(D.at, _p, THREE.MathUtils.clamp(u, 0, 1));
      g.vfx?.play(o.fx, { pos: _a, tint, tip, floor: P.renderPos.y - 0.02 });
    }
    if (D.acc > o.every) D.acc = 0;
    D.at.copy(_p);
    if (D.t >= D.dur) { D.on = false; this.ribbon.gap(); }
  }

  // ------------------------------------------------------------------ the shatter and made whole
  /** The vessel bursts (courier/vessel/death.js, at its burst): drawn here instead of the stock burst when one is worn. */
  shatter(mid) {
    const o = this.wearing('shatter');
    if (!o || !this.game.vfx) return false;
    this.game.vfx.play(`flourish.shatter.${o.id}`, { pos: mid, tint: this.tone(o.color, new THREE.Color()), tip: this.tone(o.tip, new THREE.Color()), floor: mid.y - 0.95, cine: true });
    return true;
  }
  wholeStart() { const o = this.wearing('shatter'); this.whole = o ? { t: -WHOLE.delay, id: o.id, played: false } : null; }
  wholeTick(raw) {
    const W = this.whole, g = this.game, ch = g.character, P = g.player;
    if (!W || !P) return;
    W.t += raw;
    const feet = P.renderPos.y;
    if (W.t >= 0 && !W.played) {
      W.played = true;
      const o = optionOf('shatter', W.id);
      g.vfx?.play(`flourish.whole.${W.id}`, { pos: _p.copy(P.renderPos).addScaledVector(UP, 0.95), tint: this.tone(o.color, new THREE.Color()), tip: this.tone(o.tip, new THREE.Color()), floor: feet, cine: true });
    }
    // the body built up from the feet as the pieces come home (the rig's own dissolve run backwards, as a sibling's is: vfx/siblingshatter.js)
    const u = (W.t - WHOLE.hold) / WHOLE.build, k = u < 0 ? 1 : Math.max(0, 1 - u);
    if (g.techs?.active?.id !== 'slip') ch?.setDissolve?.(k, feet, 1.9);
    if (u >= 1) { this.whole = null; if (g.techs?.active?.id !== 'slip') ch?.setDissolve?.(0); }
  }

  // ------------------------------------------------------------------ the arrival
  /** The Courier arrives (`gate`: the gate-out's end, vfx/gatering.js; `rest`, `travel`: a Shrine's). True: drawn, the gate's bands are not. */
  arrive() {
    const o = this.wearing('arrival'), P = this.game.player;
    if (!o || !P || !this.game.vfx) return false;
    this.game.vfx.play(o.fx, { pos: P.renderPos, tint: this.tone(o.color ?? 'soul', new THREE.Color()), floor: P.renderPos.y });
    return true;
  }

  // ------------------------------------------------------------------ the idle aura
  auraStop() { this.aura?.stop?.(); this.aura = null; }
  auraTick(raw, speed) {
    const o = this.wearing('aura'), P = this.game.player;
    if (!o || !P) { this.auraStop(); return; }
    const want = this.shown() && speed < AURA_STILL && !this.game.death?.active ? 1 : 0;
    this.auraK = THREE.MathUtils.damp(this.auraK, want, want ? 1.5 : 6, raw);
    this.auraT += raw;
    if (!this.aura) {
      const tint = this.tone(o.color ?? 'soul', new THREE.Color()), tip = this.tone(o.tip ?? 'soul', new THREE.Color());
      this.aura = this.game.vfx?.play(o.fx, { pos: P.renderPos, tint, tip, follow: (h) => this.auraFollow(h, o) }) || null;
    }
  }
  auraFollow(h, o) {
    const P = this.game.player;
    if (!P || this.wearing('aura') !== o) return false;
    h.k = this.auraK;
    h.pos.copy(P.renderPos);
    if (o.orbit) { const a = this.auraT * o.orbit.turn; h.pos.x += Math.cos(a) * o.orbit.r; h.pos.z += Math.sin(a) * o.orbit.r; h.pos.y += o.orbit.y + 0.08 * Math.sin(this.auraT * 1.7); }
    if ((this.auraT % 1) < 0.02) { this.tone(o.color ?? 'soul', h.ctx.tint); this.tone(o.tip ?? 'soul', h.ctx.tip); } // (a glaze fired or a soul pressed: the aura follows, once a real second)
    return true;
  }

  // ------------------------------------------------------------------ the frame
  update(raw) {
    const g = this.game, P = g.player;
    this.prints.update(raw);
    if (!P) return;
    // a change of place (a teleport, the Index, a Shrine's travel): the prints and the ribbon stay behind
    let speed = 0;
    if (this.havePrev) {
      const d = this.prev.distanceTo(P.renderPos);
      if (d > 25) { this.prints.clear(); this.ribbon.clear(); this.dash.on = false; this.haveStep = false; }
      speed = d / Math.max(1e-3, raw);
    }
    this.prev.copy(P.renderPos); this.havePrev = true;
    this.dashTick(raw);
    if (this.ribbon.s.length || this.ribbon.mesh.visible) this.ribbon.update(raw);
    this.wholeTick(raw);
    if (this.later != null && (this.later -= raw) <= 0) { this.later = null; this.arrive('travel'); }
    this.auraTick(raw, speed);
  }
}
