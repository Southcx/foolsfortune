// ---------------------------------------------------------------------------------------
// THE ABERRANT CLAPPERJAR AS AN ELITE (docs/plans/ABERRANTS.md 5.2; South picked it, 2026-11-02): the clapperjar's own layers of the
// duel's look, beside the Wisp's (wisp.js) and the slip jelly's (jelly.js).
//   ITS GROUND     Mirth's mind as a festival stage at night on its side of the domains' clash (domains.js `setStyle(4, clap)`): a
//                  kagura stage's hinoki boards round its feet, paper lanterns strung in arcs over a row of lit stalls, fireworks
//                  opening high up, confetti drifting down; every clap of its swells the lanterns' light (uStyle.y)
//   ITS CLAP       the tell (Dovina's `clapback`, secrets.js) on its body only, on the duel cue's beat as heard (game.music.clock(), the
//                  same clock the session reads a drag's `beat` from: `clapOf`): its arms swing up and its hands meet over its lid on the
//                  beat, the lid snapping shut, its pot squashed and sprung; a ring of shock and a puff of confetti where its hands meet,
//                  Mirth's yellow on the beat, a hot pink once Syncopate has moved it to the off-beat (`state.secret.off`), so the eye can
//                  tell the "and" from the one. No cue playing, no clap (no drag can keep time then: `clapOf` says 'miss'). Never a
//                  timing guide on the board: the secret is told by its body alone (ABERRANTS.md 4)
//   ITS CRACKS     the turns you have kept its time (`state.secret.streak`, 0..3) as nets of cracks spreading over its glaze, one net a
//                  turn kept, lit gold from inside and flaring on each clap: it is clapping itself to pieces
//   ITS DEATHS     the Line's: it rattles, its cracks blaze, and the pot breaks into sherds of its clay (the folk's pot breaking) in a
//                  burst of Mirth, the Figment's scatter (figmentscatter.js) taking the rest; the secret's: it claps faster and faster, the
//                  cracks running white-hot, and on a last clap bursts into confetti and sherds, a held beat after. Petra's session
//                  times them (`view.death(how)`).
// Programs: the kit's basic with a map (fxkit.js, on its body's own skinned mesh for the cracks: the skinned variant of that one), the
// juice's additive basic (the rings), the duel's clay (the sherds), the bursts', the clash's and the cut-in's: nothing else new.
// Prior art: kagura and the matsuri (the festival's paper lanterns, the stage's boards, the drum), Rhythm Heaven's call and response
// (a body you read the beat off, the off-beat turned on you), Parappa the Rapper (the teacher's line, then yours), Puyo Puyo's cut-ins
// (each opponent's own band), Patapon's drums; the Wisp's elite (wisp.js) for the shape of the file.
//
//   const E = new ClapperElite(view)   ClapperElite.fits(state, foe)   E.open(state, foe)   E.update(dt)   E.clap(off, size)
//   E.death(how) -> { dur, drainAt, step, end }   E.close()   E.pulse (0..1, the last clap's swell: sidedress.js reads it)
//   (drainAt: real s into it when its body is gone and an aberrant's data drain may begin, its tail still playing: aberrantdrain.js)
//   CLAPPER_ELITE (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { secretOf } from '../../../progress/duel/secrets.js';
import { KIND_RULESETS } from '../../../progress/duel/rulesets.js';
import { feelColour, sm, clamp01, lerp, hash } from '../layout.js';
import { tex, scrollMat } from '../fxkit.js';
import { duelMaterials } from '../pieces.js';

/** arms: their swing about the rest frame's z (rad) open and at the clap, and the share of a beat the hands take to close before it and
 *  part after; lid: its widest between claps (rad); squash: the pot's spring kicked at a clap; ring: the shock (real s, frame m);
 *  confetti: the puff's pieces; cracks: how fast a net spreads (/s), its glow at rest and its flare on a clap, and each net's repeat and
 *  offset on the body's painting; the deaths' beats (real s; drain: when its body is gone and an aberrant's data drain may begin). */
export const CLAPPER_ELITE = { arms: { open: 1.35, shut: 2.65, close: 0.2, part: 0.32 }, lid: 0.5, squash: 3.2,
  ring: { life: 0.4, r0: 0.05, r1: 0.55, pool: 6 }, confetti: 6, sherds: 16,
  cracks: { ease: 1.4, glow: 0.7, flare: 1.4, nets: [[1, 1, 0, 0], [1.6, 1.3, 0.31, 0.17], [2.3, 1.9, 0.62, 0.71]] },
  line: { rattle: 0.5, shatter: 0.6, dur: 1.6, drain: 1.3 }, secret: { faster: 1.9, from: 0.42, to: 0.055, hold: 0.7, back: 0.4, drain: 2.3 } };
const OFF = 0xff4fa0, GOLD = 0xffcf6a, CLAY = 0xb5653a, WHITE = 0xfff4dc;
const CONFETTI = [0xffd040, 0xff4f5a, WHITE, OFF, 0x5fd0ff, 0x8de05a];
const X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _c = new THREE.Color();

export class ClapperElite {
  /** The cut-in's motif behind this aberrant's bands (cutin.js: 5 festival lanterns and confetti). */
  static MOTIF = 5;
  constructor(view) {
    this.view = view; this.on = false; this.pulse = 0; this.cracked = 0; this.shells = []; this.posed = -1;
    this.group = new THREE.Group(); this.group.name = 'duel-clapper'; view.frame.add(this.group);
    const glow = () => new THREE.MeshBasicMaterial({ name: 'duel-juice', color: 0xffffff, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending });
    const ringGeo = new THREE.RingGeometry(0.82, 1, 48), thinGeo = new THREE.RingGeometry(0.94, 1, 48);
    this.rings = Array.from({ length: CLAPPER_ELITE.ring.pool }, (_, i) => { const m = new THREE.Mesh(i % 2 ? thinGeo : ringGeo, glow()); m.visible = false; m.renderOrder = 8; m.frustumCulled = false; this.group.add(m); return { m, age: 9, life: 1, delay: 0 }; });
    this.clay = duelMaterials().clay.clone(); this.clay.color.setHex(CLAY);
    const sherd = new THREE.TetrahedronGeometry(1, 0);
    this.sherds = Array.from({ length: CLAPPER_ELITE.sherds }, () => { const m = new THREE.Mesh(sherd, this.clay); m.visible = false; m.frustumCulled = false; this.group.add(m); return { m, v: new THREE.Vector3(), w: new THREE.Vector3(), age: 9, s: 0.04 }; });
  }

  /** Whether a duel is an aberrant clapperjar's (its ruleset's secret is the clap back, or the foe's kind brings the clapperjar's board). */
  static fits(state, foe) { return state?.style === 'pve' && (state.rs?.secret === 'clapback' || KIND_RULESETS[foe?.kind] === 'clapperjar'); }

  open(state, foe) {
    this.close(); this.on = ClapperElite.fits(state, foe); this.foe = foe; this.pulse = 0; this.cracked = 0; this.dying = false; this.lastN = null; this.lastOff = null; this.pose = null;
    if (this.on) this.dressCracks();
    this.view.clash.setStyle(this.on ? 4 : 0, 0);
  }

  close() {
    for (const s of this.shells) { s.parent?.remove(s); s.material.map?.dispose(); s.material.dispose(); } this.shells = []; // (the body's geometry is its own: kept)
    const f = this.foe; if (f?.model && f.alive !== false) f.model.visible = true;
    for (const r of this.rings) { r.m.visible = false; r.age = 9; } for (const s of this.sherds) { s.m.visible = false; s.age = 9; }
    this.on = false; this.foe = null; this.dying = false; this.pose = null; this.view.clash.setStyle(0, 0);
  }

  /** Its cracks: three nets of the kit's crackle laid over its own skinned body (bound to its skeleton, so they move with it), gold and
   *  added on, each shown as a turn is kept. */
  dressCracks() {
    const f = this.foe, meshes = []; if (!f?.model) return;
    f.model.traverse((o) => { if (o.isMesh && !/eye/i.test(o.name) && ![].concat(o.material).some((m) => /eye/i.test(m?.name || ''))) meshes.push(o); });
    CLAPPER_ELITE.cracks.nets.forEach(([ru, rv, ou, ov]) => {
      for (const o of meshes) {
        const mat = scrollMat(tex('crackle'), GOLD, { add: true, opacity: 0, repeat: [ru, rv] }); mat.map.offset.set(ou, ov); mat.side = THREE.FrontSide;
        mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2; // (laid on the glaze, never fighting it)
        let s; if (o.isSkinnedMesh) { s = new THREE.SkinnedMesh(o.geometry, mat); s.bindMode = o.bindMode; s.bind(o.skeleton, o.bindMatrix); } else s = new THREE.Mesh(o.geometry, mat);
        s.position.copy(o.position); s.quaternion.copy(o.quaternion); s.scale.copy(o.scale); s.frustumCulled = false; s.renderOrder = 2; s.name = 'duel-clapper-cracks';
        o.parent.add(s); this.shells.push(s);
      }
    });
    this.perNet = meshes.length;
  }

  /** Where its hands meet, in the board's frame (between its forearms, a little over them), else over its head. */
  handsAt(out) {
    const f = this.foe, b = f?.bones;
    if (b?.foreL && b?.foreR) { b.foreL.getWorldPosition(_a); b.foreR.getWorldPosition(_b); out.copy(_a).add(_b).multiplyScalar(0.5); out.y += 0.12 * (f.root?.scale?.y || 1); return this.view.frame.worldToLocal(out); }
    return this.view.foeCast.head(out);
  }
  bodyAt(out) { this.view.foeCast.head(out); out.y -= 0.3; return out; }

  /** One clap: the pot squashed, a ring of shock and a puff of confetti where its hands meet (Mirth's on the beat, pink off it). */
  clap(off = false, size = 1) {
    const V = this.view, f = this.foe, K = CLAPPER_ELITE, hex = off ? OFF : feelColour('mirth', _c).getHex(), at = this.handsAt(new THREE.Vector3());
    this.pulse = Math.min(1.5, 0.6 + 0.4 * size); if (f) f.squashV = (f.squashV || 0) - K.squash * size;
    this.ring(at, hex, size, 0); this.ring(at, WHITE, size * 0.7, 0.05);
    V.bursts.burst(at, hex, Math.round(K.confetti * size), { speed: 0.9 * size, life: 0.6, fall: 2.5, spread: 0.5, size: 0.016 });
    V.bursts.burst(at, CONFETTI[Math.floor(hash(this.t || 0, 3) * CONFETTI.length)], Math.round(3 * size), { speed: 0.7 * size, life: 0.7, fall: 2, spread: 0.6, size: 0.014 });
  }
  ring(at, hex, size, delay) { const r = this.rings.reduce((a, b) => (b.age >= b.life + b.delay ? b : a.age - a.delay > b.age - b.delay ? a : b), this.rings[0]);
    r.age = 0; r.delay = delay; r.life = CLAPPER_ELITE.ring.life * (0.8 + 0.2 * size); r.size = size; r.m.position.copy(at).setZ(at.z + 0.05); r.m.material.color.setHex(hex); }

  /** Sherds of its clay flung out from its body (and its chips in the bursts). */
  shatter(n, speed = 1) {
    const at = this.bodyAt(new THREE.Vector3());
    for (let i = 0; i < Math.min(n, this.sherds.length); i++) { const s = this.sherds[i], a = hash(i, 5) * Math.PI * 2, up = 0.5 + hash(i, 7);
      s.age = 0; s.s = 0.03 + 0.04 * hash(i, 9); s.m.position.copy(at).add(_v.set((hash(i, 2) - 0.5) * 0.2, (hash(i, 4) - 0.3) * 0.3, 0));
      s.v.set(Math.cos(a) * 1.6 * speed, up * 2.2 * speed, Math.sin(a) * 0.9 * speed); s.w.set(hash(i, 11) * 12, hash(i, 13) * 12, hash(i, 17) * 12); s.m.visible = true; }
    this.view.bursts.burst(at, CLAY, 18, { speed: 1.6 * speed, life: 0.7, fall: 5, spread: 0.6, size: 0.024 });
  }

  /** The rings and sherds in flight (frame-local: y up). */
  stepFx(dt) {
    const K = CLAPPER_ELITE.ring;
    for (const r of this.rings) { if (r.age >= r.life + r.delay) { r.m.visible = false; continue; } r.age += dt; const u = clamp01((r.age - r.delay) / r.life);
      r.m.visible = r.age >= r.delay; const e = 1 - (1 - u) * (1 - u) * (1 - u); r.m.scale.setScalar(lerp(K.r0, K.r1 * (r.size || 1), e)); r.m.material.opacity = (1 - u) * (1 - u); }
    for (const s of this.sherds) { if (s.age >= 1.6) { s.m.visible = false; continue; } s.age += dt; s.v.y -= 6 * dt; s.m.position.addScaledVector(s.v, dt);
      s.m.rotation.x += s.w.x * dt; s.m.rotation.y += s.w.y * dt; s.m.rotation.z += s.w.z * dt; s.m.scale.set(s.s, s.s * 0.35, s.s * 0.8).multiplyScalar(1 - sm((s.age - 1.1) / 0.5)); }
  }

  /** Its arms and lid at `f` (0..1 into the beat since its last clap): the hands closing over the last share of the beat, meeting on it,
   *  parting after; laid over the clapperjar's own pose once a frame it posed (creatures/clappers.js runs first), then its joints' limits. */
  poseAt(f, rattle = 0) {
    const c = this.foe, b = c?.bones, K = CLAPPER_ELITE.arms; if (!b || c.t === this.posed) return; this.posed = c.t;
    const shut = f > 1 - K.close ? sm((f - (1 - K.close)) / K.close) : f < K.part ? 1 - sm(f / K.part) : 0, ang = lerp(K.open, K.shut, shut);
    const arm = (bn, inv, a) => { if (bn && inv) bn.quaternion.multiply(_q.setFromAxisAngle(_v.copy(Z).applyQuaternion(inv).normalize(), a)); };
    arm(b.armL, c.armInv?.L, ang); arm(b.armR, c.armInv?.R, -ang);
    if (b.head && c.headInv) b.head.quaternion.multiply(_q.setFromAxisAngle(_v.copy(X).applyQuaternion(c.headInv).normalize(), -(1 - shut) * CLAPPER_ELITE.lid));
    if (rattle > 0 && c.root) { c.root.rotation.z += Math.sin(this.t * 61) * 0.14 * rattle; c.root.rotation.x += Math.cos(this.t * 53) * 0.08 * rattle; }
    c.rom?.apply?.();
  }

  update(dt) {
    if (!this.on) return; this.t = (this.t || 0) + dt; this.stepFx(dt);
    const V = this.view, S = secretOf(V.state), K = CLAPPER_ELITE, cr = K.cracks;
    this.pulse = Math.max(0, this.pulse - dt * 3.5);
    if (!this.dying) this.cracked += (Math.min(3, S?.streak ?? 0) - this.cracked) * Math.min(1, dt * cr.ease);
    this.shells.forEach((s, i) => { const net = Math.floor(i / Math.max(1, this.perNet)), k = clamp01(this.cracked - net);
      s.material.opacity = k * (cr.glow + cr.flare * this.pulse) * (this.dying ? 1 + this.heat : 1); }); // (always drawn, at 0 adding nothing: compiled at the open, never mid-duel)
    V.clash.setStyle(4, Math.min(1, this.pulse));
    if (this.dying) { if (this.pose) this.poseAt(this.pose.f, this.pose.rattle); return; }
    const clock = V.game.music?.clock?.(); if (!(clock?.spb > 0)) { this.lastN = null; return; } // (no cue: no beat to keep, no clap)
    const off = !!S?.off, ph = Math.floor(clock.bar) * clock.beats + clock.beat + (off ? 0.5 : 0), n = Math.floor(ph); // (its clap on the beat, or on the "and" once Syncopate has moved it)
    if (this.lastN != null && n > this.lastN && off === this.lastOff && n - this.lastN < 3) this.clap(off); // (a jump of the clock, a new cue or its clap moved, says nothing)
    this.lastN = n; this.lastOff = off; this.poseAt(ph - n);
  }

  /** One of its two deaths as a timeline the session plays (Petra's): 'line' or 'secret'. */
  death(how) {
    const V = this.view, g = V.game, f = this.foe; this.dying = true; this.heat = 0; this.pose = { f: 0.5, rattle: 0 };
    if (how === 'line') { const D = CLAPPER_ELITE.line; let broke = false;
      return { dur: D.dur, drainAt: D.drain, step: (age) => {
        const r = sm(clamp01(age / D.rattle)); this.pose.rattle = broke ? 0 : r; this.heat = r * 1.5; this.cracked = Math.max(this.cracked, 3 * r);
        if (!broke && age >= D.shatter) { broke = true; const at = this.bodyAt(new THREE.Vector3()); this.shatter(CLAPPER_ELITE.sherds, 1);
          V.bursts.burst(at, feelColour('mirth', _c).getHex(), 24, { speed: 2.0, life: 0.7, fall: 3, spread: 0.7, size: 0.03 }); this.ring(at, feelColour('mirth', _c).getHex(), 1.6, 0);
          V.stage?.jolt?.(0.8); g.glitch?.pulse?.({ split: 0.08, tear: 0.05, dur: 0.2 });
          if (f && g.figmentScatter) g.figmentScatter.play(f, { hide: true }); else if (f?.model) f.model.visible = false; } },
        end: () => { this.dying = false; this.pose = null; } };
    }
    const D = CLAPPER_ELITE.secret, ratio = Math.pow(D.to / D.from, 1 / 14); let next = 0, gap = D.from, last = 0, burst = false;
    return { dur: D.faster + D.hold + D.back, drainAt: D.drain, step: (age) => {
      if (!burst) { while (next <= age && next < D.faster) { this.clap(!!secretOf(V.state)?.off, 0.7); last = next; next += gap; gap = Math.max(D.to, gap * ratio); } // (faster and faster: it has lost its own time)
        const k = clamp01(age / D.faster); this.heat = 0.9 * k * k; this.cracked = 3; this.pose.f = clamp01((age - last) / Math.max(0.02, next - last)); this.pose.rattle = 0.6 * k * k; }
      if (!burst && age >= D.faster) { burst = true; const at = this.bodyAt(new THREE.Vector3()); this.clap(false, 2); this.shatter(10, 0.8); // (a last clap, and it bursts)
        for (const hex of CONFETTI) V.bursts.burst(at, hex, 10, { speed: 2.4, life: 1.1, fall: 1.6, spread: 0.9, size: 0.022 });
        V.stage?.jolt?.(0.6); g.glitch?.pulse?.({ split: 0.06, tear: 0.04, dur: 0.16 }); if (f?.model) f.model.visible = false; this.pose = null; }
      const h = age - D.faster, veil = !burst ? 0 : h < D.hold ? 0.5 * sm(h / 0.15) : 0.5 * (1 - sm((h - D.hold) / D.back)); // (a held beat after the last clap)
      V.cutIn?.veil?.(veil); },
      end: () => { V.cutIn?.veil?.(0); this.dying = false; this.pose = null; } };
  }
}
