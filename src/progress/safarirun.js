// ---------------------------------------------------------------------------------------
// THE SAFARI, RUNNING (docs/plans/STEALTH.md 8; progress/safari.js rules; gaps G241 to G248): reads a plate's behaviour off the subject's
// mind, rates it, counts the area's research, lays a Lachryma lure, keeps an unaware Figment's flight ring, habituates it to a gentle
// Courier, and judges the day's best plate of each kind when the game day turns. It reads the world through events and fields
// (game.creatures, a brain's running action, game.dunesAreas.here) and owns only its small save section. Prior art: safari.js's.
//
//   game.safari = new Safari(game)   .lure(feeling, pos?) -> { ok, why? }   .judge(final?) -> judged[]   .open(area, what)   .level(area)
//   .hab(kind) -> 0..1   .flight(c) -> metres   .luredNow(c)
//   events (each with `by`): safari.plate { kind, behaviour, label, rarity, stars, score, framing, first, areaFirst, area, candid, d, lured, cubes, level }
//     safari.research { area, level, opens, cubes }   safari.lure { feeling, cost, at }   safari.judged { kind, behaviour, stars, score, why, final }
//     safari.habit { kind, k }   stealth.spook { kind, d, cause: 'approach', by } (stealth.js's event)
//   A photo.take may carry `act` (the subject's running action id) and `lured`; without them the subject is found by kind near the Courier.
// ---------------------------------------------------------------------------------------
import { BEHAVIOURS, behaviourNow, readout, RESEARCH, levelOf, researchHeld, behaviourFee, levelFee, LURES, KIND_FEELING, FLIGHT, flightDistance, HABITUATION, judgeDay, areaOpen } from './safari.js';
import { phaseAt } from './weather.js';
import { today } from '../core/calendar.js';

const aware = (g, c) => c.brain?.mem?.fact?.(g.player)?.aware ?? 0;

export class Safari {
  constructor(game) {
    this.game = game; this.day = -1; this.plates = []; this.hab_ = {}; this.lures = []; this.t = 0; this.turnT = 0; this.cool = new WeakMap();
    game.save?.section('safari', { scope: 'player', version: 1, dump: () => ({ day: this.day, plates: this.plates, hab: this.hab_ }),
      load: (d) => { this.day = d?.day ?? -1; this.plates = d?.plates || []; this.hab_ = d?.hab || {}; }, reset: () => { this.day = -1; this.plates = []; this.hab_ = {}; } });
    game.events?.on?.('photo.take', (e) => this.plate(e));
    game.chat?.add?.('lure', { help: 'lay a Lachryma lure on the ground before you: /lure gall (a placeholder for the lure throw; it costs the pool)', run: ([f]) => this.lure(String(f || '').toLowerCase()) });
    game.chat?.add?.('darkroom', { help: "the day's best plate of each Figment, judged now: /darkroom", run: () => { this.judge(false); } });
  }
  hab(kind) { return this.hab_[kind] || 0; }
  level(area) { return levelOf(researchHeld(this.game.ledger, area)); }
  open(area, what) { return areaOpen(this.game.ledger, area, what); }

  // ---- G241 / G242 / G243 / G247: a plate ----------------------------------------------------------------
  /** The subject: the mind-bearing creature of the plate's kind nearest the Courier (until the shutter names it, STEALTH.md 7). */
  subject(kind) {
    const g = this.game, P = g.player; if (!P) return null;
    let best = null, bd = 80; for (const c of g.creatures?.near?.(P.pos, 60) || []) { if (c.kind !== kind || c.alive === false || c.training) continue; const d = c.pos.distanceTo(P.pos); if (d < bd) { bd = d; best = c; } }
    return best;
  }
  plate(e) {
    const g = this.game, L = g.ledger; if (!L || !BEHAVIOURS[e.kind]) return;
    const c = this.subject(e.kind), act = e.act ?? c?.brain?.action?.id ?? null, candid = e.candid ? e.candid === 'candid' : c ? aware(g, c) < 0.35 : false;
    const lured = e.lured ?? (c ? this.luredNow(c) : false), w = g.weather?.here?.(g.player?.pos);
    const b = behaviourNow(e.kind, { act, phase: phaseAt(), weather: w?.aspect || 'fair', candid, lured }); if (!b) return;
    const area = g.dunesAreas?.here ?? null, first = !(L.get(`safari.beh.${e.kind}.${b.id}`) > 0);
    const areaFirst = !!area && !(L.get(`safari.area.${area}.${e.kind}.${b.id}`) > 0);
    const R = readout({ score: e.score, behaviour: b }), cubes = first ? behaviourFee(b.rarity) : 0;
    if (cubes) g.cubes?.earn?.(cubes, 'safari');
    this.turn(); this.plates.push({ kind: e.kind, id: b.id, rarity: b.rarity, stars: R.stars, score: R.score, candid: candid ? 'candid' : null, d: e.d ?? null, lured: !!lured }); this.plates = this.plates.slice(-40); g.save?.dirty?.('safari');
    const held = area ? researchHeld(L, area) : 0, was = levelOf(held), level = areaFirst ? levelOf(held + 1) : was; // (the ledger counts this plate after the event is said)
    g.events?.emit('safari.plate', { kind: e.kind, behaviour: b.id, label: b.label, rarity: b.rarity, stars: R.stars, score: R.score, framing: R.framing, first, areaFirst, area, candid: candid ? 'candid' : null, d: e.d ?? null, lured: !!lured, cubes, level, by: 'courier' });
    if (level > was) { const fee = levelFee(level), opens = RESEARCH.opens.filter((o) => o.level === level).map((o) => o.what); g.cubes?.earn?.(fee, 'safari'); g.events?.emit('safari.research', { area, level, opens, cubes: fee, by: 'courier' }); }
  }

  // ---- G245: the darkroom ------------------------------------------------------------------------------
  turn() { const d = today(); if (d !== this.day) { if (this.plates.length && this.day >= 0) this.judge(true); this.day = d; this.plates = []; } }
  judge(final = false) {
    const out = judgeDay(this.plates);
    for (const j of out) this.game.events?.emit('safari.judged', { kind: j.kind, behaviour: j.id, stars: j.stars, score: j.score, why: j.why, final, by: 'courier' });
    if (!out.length && !final) this.game.events?.emit('safari.judged', { kind: null, behaviour: null, stars: 0, score: 0, why: [], final, by: 'courier' });
    return out;
  }

  // ---- G244: lures ----------------------------------------------------------------------------------------
  lure(feeling, at = null) {
    const g = this.game, P = g.player, S = LURES[feeling]; if (!P) return { ok: false, why: 'nobody' };
    if (!S) return { ok: false, why: 'unknown' };
    if (!g.lachryma?.spend?.(S.cost, 'lure')) return { ok: false, why: 'dry' };
    const pos = (at || P.pos).clone(); if (!at) { pos.x += Math.sin(P.yaw || 0) * 4; pos.z += Math.cos(P.yaw || 0) * 4; }
    this.lures.push({ feeling, pos, until: this.t + S.ttl });
    g.ai?.stimuli?.emit?.('food', pos, { radius: S.radius, strength: 1, by: 'courier', ttl: S.ttl });
    g.events?.emit('safari.lure', { feeling, cost: S.cost, at: [+pos.x.toFixed(1), +pos.z.toFixed(1)], by: 'courier' });
    return { ok: true };
  }
  /** Is a Figment held by a live lure of its feeling (inside `hold` m of it)? */
  luredNow(c) {
    for (const l of this.lures) { const S = LURES[l.feeling]; if (l.until > this.t && S.kinds.includes(c.kind) && c.pos.distanceTo(l.pos) <= S.hold) return true; }
    return false;
  }

  // ---- G248: flight rings and habituation -------------------------------------------------------------------
  flight(c) {
    const P = this.game.player, v = P.vel, sp = v ? Math.hypot(v.x, v.z) : 0, dx = c.pos.x - P.pos.x, dz = c.pos.z - P.pos.z, d = Math.hypot(dx, dz) || 1;
    const heading = v && sp > 0.2 ? (v.x * dx + v.z * dz) / (sp * d) : 1;
    return flightDistance({ bold: c.traits?.bold ?? 1, speed: sp, heading, posture: P.posture || (P.crouching ? 'crouch' : 'stand'), hab: this.hab(c.kind) });
  }
  update(dt) {
    const g = this.game, P = g.player; this.t += dt; if (!P || g.god?.active) return;
    this.lures = this.lures.filter((l) => l.until > this.t);
    if ((this.turnT += dt) > 5) { this.turnT = 0; this.turn(); }
    const sp = P.vel ? Math.hypot(P.vel.x, P.vel.z) : 0, near = new Set();
    for (const c of g.creatures?.near?.(P.pos, 40) || []) {
      if (!BEHAVIOURS[c.kind] || c.alive === false || c.training || !c.brain) continue;
      if (aware(g, c) >= 0.35 || this.luredNow(c)) continue; // (a Figment that knows you, or is held by a lure, keeps no ring)
      const d = c.pos.distanceTo(P.pos), ring = this.flight(c);
      if (d < ring && d > 0.5 && (this.cool.get(c) || 0) < this.t) {
        this.cool.set(c, this.t + FLIGHT.cool); this.hab_[c.kind] = Math.max(0, this.hab(c.kind) - HABITUATION.fright); g.save?.dirty?.('safari');
        c.brain.force?.('flee', 'spooked'); g.events?.emit('stealth.spook', { kind: c.kind, d: +d.toFixed(1), cause: 'approach', by: 'courier' });
      } else if (d < ring * 1.6 && sp < HABITUATION.slow) near.add(c.kind);
    }
    for (const k of Object.keys(KIND_FEELING)) {
      const was = this.hab(k), now = near.has(k) ? Math.min(1, was + HABITUATION.gain * dt) : Math.max(0, was - HABITUATION.decay * dt);
      if (now === was) continue;
      this.hab_[k] = now;
      if (Math.floor(now * 4) > Math.floor(was * 4)) { g.save?.dirty?.('safari'); g.events?.emit('safari.habit', { kind: k, k: +now.toFixed(2), by: 'courier' }); }
    }
  }
}
