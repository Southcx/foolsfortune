// ---------------------------------------------------------------------------------------
// CRYSTALS: Lachryma that has set hard in the sand, in formations of six-sided spires. They are found (they give off a strong signature:
// signatures.js, so the Dreamvane leans toward them), some lie VEILED under the sand until something shows them (the Crucibelle's Reveal
// song, or the Dreamvane's pick struck where the vane says), and they are HARVESTED: struck with a pick they give up Lachryma a blow at
// a time (baubles, and a shed of cubes that the break pays back: ECON.crystal), and struck while a tuning fork RINGS in them (the Dreamvane's fork) they give
// twice as much and a shard of crystal besides (an item: it feeds the Lockheart). Any other blade or club only chips them. A spent
// formation is stubs; a few minutes and it has grown back. Each is TUNED (world/dunes/crystaltuning.js): a key and a sweet spot, found by ear
// (the fork gives the reference, each strike a note: its pitch from the fret struck, its wavering from the way round); found, it
// opens and pays many times over. Dense formations take many strikes, fragile ones few.
//
// One InstancedMesh for every spire of every formation: one draw for the whole sea; a formation's spires shrink as it is worked and
// glow while it rings (a steady slow pulse, never a flicker). The stave (the main spire) wears its five frets in the notes' colours
// (vfx/crystalfrets.js); a strike lights the fret it sounded.
//
// Prior art: the ore veins of Minecraft and Terraria (found, struck, they give), Deep Rock Galactic's crystal veins and its pickaxe,
// Breath of the Wild's ore deposits (a few blows; some ore is luminous), and the resonance of a tuning fork on a glass (the fork's ring
// is what takes it apart cleanly).
//
//   game.crystals.reveal(pos, radius) -> n     .ring(ent, secs)     .near(pos, r)     ent.struck(point, dir, power, by, tool)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { tag, register } from '../../core/tags.js';
import { sfx } from '../../audio/sfx.js';
import { DUNE, BARRIER, OASIS } from './dunes.js';
import { ECON } from '../../progress/econ/table.js';
import { tuneFor, readStrike, refNote, FRETS, SPAN } from './crystaltuning.js';
import { degreeColor } from '../../music/tone.js';
import { crystalFretMaterial, CrystalFrets } from '../../vfx/crystalfrets.js';
import { stream } from '../../core/rng.js';
const simRand = stream('world/dunes/crystals'); // (the simulation's chance: core/rng.js, the same twice)

/** A plain tone (two, `beat` hertz apart, so it wavers) until Wanda's crystal voices land (docs/HANDOFFS.md). */
function placeholderTone(midi, beat, dur, gain) {
  if (!sfx.ok?.() || !sfx.tone) return;
  const t = sfx.ctx.currentTime, f = 440 * 2 ** ((midi - 69) / 12), dest = sfx.master;
  sfx.tone(t, dur, { f0: f, gain, dest, type: 'triangle' });
  if (beat > 0.05) sfx.tone(t, dur, { f0: f + beat, gain: gain * 0.9, dest, type: 'triangle' });
}
const REGROW = 180, GROW = 6, OPEN = 0.5, OPEN_SWEET = 0.85; // (the stave stands whole a moment as it gives: its last fret's light, or the sweet run)
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color();
const BASE = new THREE.Color(0xcdb8f2), RING = new THREE.Color(0xfff1d6), SPENT = new THREE.Color(0x5d4a7a);

export class Crystals {
  constructor(game) {
    this.game = game;
    this.list = [];
    // a spire: a six-sided prism with a point, standing on its base (1 m tall before it is scaled)
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 6, 1).translate(0, 0.4, 0);
    const tip = new THREE.ConeGeometry(0.5, 0.35, 6).translate(0, 0.975, 0);
    this.geo = mergeTwo(geo, tip);
    this.mat = crystalFretMaterial({ color: 0xffffff, emissive: 0x4a2f86, emissiveIntensity: 0.55, roughness: 0.22, metalness: 0.15, flatShading: true }, BASE);
    this.spires = [];
    this.build();
    this.mesh = new THREE.InstancedMesh(this.geo, this.mat, this.spires.length);
    this.frets = new CrystalFrets(this.mesh);
    this.mesh.castShadow = true; this.mesh.receiveShadow = false;
    this.mesh.frustumCulled = false; // (spread over the whole sea: one draw, culled by being in the dunes or not)
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.spires.forEach((s, i) => { s.i = i; this.place(s); });
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.spires.length * 3), 3);
    for (const s of this.spires) this.mesh.setColorAt(s.i, BASE);
    game.scene.add(this.mesh);
    // what the world can sense of them (signatures.js): a formation still whole, loudly; a veiled one as loudly (it is there)
    for (const e of this.list) game.signatures?.add({ pos: e.pos, strength: 4 + e.size * 3, kind: 'crystal', ref: e, alive: () => e.hp > 0 });
  }

  build() {
    const g = this.game, D = g.dunes, W = g.physics.world;
    if (!D) return;
    const rnd = (() => { let s = 4242421; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    const R0 = OASIS.flat + 18, R1 = BARRIER - 40;
    const spots = [];
    // a few within sight of the oasis (to be found the first afternoon), the rest out in the sea; one in four veiled
    for (let i = 0; i < 18; i++) {
      const a = rnd() * Math.PI * 2, r = i < 4 ? R0 + rnd() * 40 : R0 + 40 + rnd() * (R1 - R0 - 40);
      spots.push({ x: DUNE.x + Math.cos(a) * r, z: DUNE.z + Math.sin(a) * r, veiled: i >= 4 && rnd() < 0.3, size: 0.6 + rnd() * 0.8 });
    }
    for (const sp of spots) {
      const y = D.heightAt(sp.x, sp.z);
      const pos = new THREE.Vector3(sp.x, y, sp.z), n = 4 + Math.floor(rnd() * 4), r = 0.7 + sp.size * 0.9, h = 1.2 + sp.size * 1.8;
      const body = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(sp.x, y + h * 0.4, sp.z));
      const col = W.createCollider(RAPIER.ColliderDesc.cylinder(h * 0.4, r * 0.75).setCollisionGroups(GROUPS.static).setFriction(0.6), body);
      const e = tag({ type: 'crystal', kind: 'crystal', pos: pos.clone().setY(y + h * 0.35), ground: pos, r, h, size: sp.size, body, col,
        hp: 0, maxHp: 0, tune: tuneFor(rnd, sp.size), veiled: sp.veiled, rise: sp.veiled ? 0 : 1, ringT: 0, regrowT: 0, spires: [],
        struck: (p, dir, power, by, tool) => this.struck(e, p, dir, power, by, tool) }, 'struckable', 'harvestable', 'static');
      e.hp = e.maxHp = e.tune.kind === 'dense' ? 6 + Math.round(sp.size * 3) : 2 + Math.round(sp.size); // (dense: many strikes; fragile: few)
      if (e.veiled) col.setEnabled(false);
      g.physics.register(col, e);
      register(e);
      for (let k = 0; k < n; k++) {
        const big = k === 0, a = rnd() * Math.PI * 2, d = big ? 0 : r * (0.35 + rnd() * 0.6);
        const s = { e, at: new THREE.Vector3(Math.cos(a) * d, -0.15, Math.sin(a) * d), h: h * (big ? 1 : 0.35 + rnd() * 0.45), w: (big ? 0.55 : 0.25 + rnd() * 0.2) * (0.8 + sp.size * 0.4),
          tilt: new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * (big ? 0.2 : 0.9), rnd() * 6.28, (rnd() - 0.5) * (big ? 0.2 : 0.9))) };
        e.spires.push(s); this.spires.push(s);
      }
      this.list.push(e);
    }
  }

  /** A spire's matrix: its formation's state (how much of it is left, how far it has risen from the sand). */
  place(s) {
    // (the main spire stands whole until the formation gives: it is the stave being sounded, up and down, so it must not shrink
    //  under the pick (owner's note, R40); the lesser spires about it are what the blows knock away)
    const e = s.e, main = s === e.spires[0], whole = main ? (e.hp > 0 ? 1 : 0.22) : 0.22 + 0.78 * (e.hp / e.maxHp);
    const open = main && e.openT > 0; // (the stave holds a moment as it gives, for its frets' light: vfx/crystalfrets.js)
    const left = open ? 1 : e.regrowT > 0 ? Math.min(1, 0.22 + 0.78 * Math.max(0, 1 - e.regrowT / GROW)) : whole;
    const k = left * e.rise;
    _s.set(s.w, s.h * Math.max(0.001, k), s.w);
    _p.copy(e.ground).add(s.at).setY(e.ground.y + s.at.y - (1 - e.rise) * 0.4);
    this.mesh.setMatrixAt(s.i, _m.compose(_p, s.tilt, _s));
    // the frets: on the stave alone, rising with it out of the sand; none while it is stubs, coming back as it grows again
    const drawn = !main ? 0 : open || e.regrowT <= 0 ? 1 : Math.max(0, 1 - e.regrowT / GROW);
    this.frets.set(s.i, e.ground.y - (1 - e.rise) * 0.4, SPAN * e.h, drawn);
  }
  dirty(e) { for (const s of e.spires) this.place(s); this.mesh.instanceMatrix.needsUpdate = true; }

  near(pos, r) { return this.list.filter((e) => e.pos.distanceTo(pos) < r + e.r); }

  /** Show what is veiled within `radius` of `pos` (it rises out of the sand): the Reveal song, a pick in the right place. */
  reveal(pos, radius, by = 'courier', how = 'song') {
    let n = 0;
    for (const e of this.list) {
      if (!e.veiled || e.ground.distanceTo(pos) > radius) continue;
      e.veiled = false; e.col.setEnabled(true); e.rising = true; n++;
      sfx.chime?.(0.7);
      this.game.glyphs?.pop('bang', e.pos.clone().setY(e.pos.y + e.h * 0.6), { color: 0xcdb8f2, size: 0.7, life: 1.2, burst: true });
      this.game.events?.emit('crystal.reveal', { by, how });
    }
    return n;
  }

  /** A tuning fork struck into it: it rings for `secs` (a pick's blow now gives twice, and a shard). */
  ring(e, secs = 6) {
    if (e.hp <= 0 || e.veiled) return;
    e.ringT = Math.max(e.ringT, secs);
    // the reference: the sweet spot's own note, held while the fork rings (Wanda's sfx.crystalRef; a plain tone until then)
    const ref = refNote(e.tune);
    if (sfx.crystalRef) sfx.crystalRef(ref); else placeholderTone(ref, 0, 3.5, 0.14);
    this.game.music?.duck?.(4, 0.15); // (the music steps back while it rings: the ear has work to do)
    this.game.fx?.toneBurst?.(e.ground.clone().setY(e.ground.y + 0.3), RING, 0.8, 1 + e.r * 0.5); // (the reference: the fork's own light; in a fret's colour it would show the answer)
    this.game.events?.emit('crystal.ref', { note: ref });
  }

  /** How high on a formation they aim (0 its foot .. 1 its top): where their look passes its axis. */
  aimHeight(e) {
    const cam = this.game.camera, d = _p.set(0, 0, -1).applyQuaternion(cam.quaternion), o = cam.position;
    const hx = e.ground.x - o.x, hz = e.ground.z - o.z, hd = Math.hypot(d.x, d.z) || 1e-3;
    const t = (hx * d.x + hz * d.z) / (hd * hd); // (along the look, to its nearest pass by the axis, in plan)
    const y = o.y + d.y * Math.max(0, t);
    return Math.max(0, Math.min(1, (y - e.ground.y) / (e.h * SPAN)));
  }

  struck(e, p, dir, power, by, tool) {
    const g = this.game;
    if (e.veiled || e.rise < 0.95) return false;
    if (e.hp <= 0) { sfx.cubeClack?.(0.3); return false; }
    if (tool !== 'dreamvane') { // (only a pick takes it: anything else chips it and rings off it)
      sfx.cubeClack?.(0.6);
      g.fx?.impact?.(p.clone(), dir.clone().negate(), { sparks: 4, dust: 1 });
      g.log?.say('info', 'The crystal rings, and holds. A pick would take it.', { key: 'xtal.chip', throttle: 8 });
      return false;
    }
    const ringing = e.ringT > 0, k = ringing ? 2 : 1, T = e.tune;
    // where the blow fell, by ear (world/dunes/crystaltuning.js): their bearing round the formation, and the height they aimed at on it
    const th = Math.atan2(g.player.pos.x - e.ground.x, g.player.pos.z - e.ground.z), u = this.aimHeight(e);
    const R = readStrike(T, th, u);
    e.hp = R.sweet ? 0 : Math.max(0, e.hp - 1);
    const last = e.hp <= 0;
    // the strike's baubles (the Lachryma refill: the tools' fuel); and, unless this blow opens it, a SHED of cubes (solid Lachryma sheds
    // solid pieces: the owner's R51), which the break pays back out of its worth, so it pays the same however many blows it takes (ECON)
    g.baubles?.spawn(p.clone().setY(p.y + 0.2), (R.sweet ? 6 : 2) * k, { spread: 0.7, up: 3.2 });
    // (never past what a plain break would pay: a dense formation takes more blows than it is worth in cubes)
    const plain = Math.round((ECON.crystal.base + e.size * ECON.crystal.perSize) * k * ECON.crystal.kind[T.kind]);
    const n = last ? 0 : Math.min(ECON.crystal.shed * k, Math.max(0, plain - (e.shed || 0)));
    if (n > 0) { e.shed = (e.shed || 0) + n; g.cubes?.burst?.(p.clone().setY(p.y + 0.2), n, { spread: 0.7, up: 3.2, from: 'crystal' }); }
    g.vfx?.play('crystal.strike', { pos: p.clone(), dir: dir.clone().negate(), power: R.sweet ? 1.6 : 0.8 + 0.6 * R.near });
    g.fx?.impact?.(p.clone(), dir.clone().negate(), { sparks: 6 + Math.round(R.near * 14), dust: 2 });
    // the note made visible at the height struck, in its fret's colour (music/tone.js: the root gold), the fret lit on the stave (the
    // sweet strike runs them all, foot to point), and chips knocked off the lesser spires
    const at = e.ground.clone().setY(e.ground.y + u * e.h * SPAN);
    g.fx?.toneBurst?.(at, degreeColor(R.fret), R.sweet ? 1 : 0.3 + 0.5 * R.near, 0.6 + e.r * 0.4);
    this.frets.strike(e.spires[0].i, R.fret); if (R.sweet) this.frets.run(e.spires[0].i);
    g.fx?.chipsOff?.(p.clone(), dir.clone().negate(), R.sweet ? 14 : 5, 0.8 + e.size * 0.4);
    g.music?.duck?.(R.sweet ? 3 : 1.6, 0.25);
    sfx.cubeClack?.(1);
    if (sfx.crystalStrike) sfx.crystalStrike(R.midi, R.beat, { dense: T.kind === 'dense', last }); else placeholderTone(R.midi, R.beat, T.kind === 'dense' ? 1.1 : 1.8, 0.16);
    g.ai?.stimuli.emit('noise', p, { radius: 18, strength: 0.6, by, source: e });
    g.events?.emit('crystal.strike', { by, tool, ringing, pos: [p.x, p.y, p.z], near: R.near, fret: R.fret, pitchOff: R.deg, beat: R.beat, sweet: R.sweet, nature: T.kind });
    if (last) {
      // it opens: at its sweet spot many times over, else as its nature pays (cubes; a shard if it rang; sometimes a key)
      if (R.sweet) { if (sfx.crystalSweet) sfx.crystalSweet(R.midi); else { placeholderTone(R.midi, 0, 2.5, 0.2); placeholderTone(R.midi + 7, 0, 2.5, 0.12); placeholderTone(R.midi + 12, 0, 2.5, 0.1); } }
      const shed = e.shed || 0, worth = Math.max(0, Math.round((ECON.crystal.base + e.size * ECON.crystal.perSize) * k * (R.sweet ? ECON.crystal.sweet[T.kind] : ECON.crystal.kind[T.kind])) - shed);
      if (worth > 0) g.cubes?.burst?.(e.pos.clone().setY(e.pos.y + 0.4), worth, { count: 4 + Math.round(e.size * 4), up: 4.5, from: 'crystal' });
      let shard = false, key = null;
      if (ringing && g.pneuka) { g.pneuka.add('mat.shard', 'crystal'); shard = true; }
      if (g.pneuka && simRand() < (ringing ? 0.22 : 0.06)) { key = rollKey(); g.pneuka.add(key, 'crystal'); }
      let fossil = false; if (g.pneuka && simRand() < (ringing ? 0.1 : 0.03)) { g.pneuka.add('fossil.lachrymite', 'crystal'); fossil = true; } // (a creature's shape in the set Lachryma: the Grove wakes it, world/garden/awaken.js)
      e.regrowT = REGROW + GROW; e.ringT = 0; e.openT = R.sweet ? OPEN_SWEET : OPEN;
      T.spot = { th: simRand() * Math.PI * 2, fret: Math.floor(simRand() * FRETS) }; // (it grows back with its spot somewhere new)
      g.events?.emit('crystal.harvest', { by, tool, ringing, worth, shed, shard, key, fossil, sweet: R.sweet, nature: T.kind });
    }
    this.dirty(e);
    return true;
  }

  update(dt) {
    const on = !!this.game.dunes?.active;
    this.mesh.visible = on;
    if (!on) return;
    let colors = false, mats = false;
    for (const e of this.list) {
      if (e.rising) { e.rise = Math.min(1, e.rise + dt / 1.6); if (e.rise >= 1) e.rising = false; this.dirty(e); }
      if (e.openT > 0) { e.openT -= dt; if (e.openT <= 0) this.dirty(e); } // (it has given: the stave falls to its stub)
      if (e.regrowT > 0) {
        e.regrowT -= dt;
        if (e.regrowT <= GROW) { if (e.hp <= 0) { e.hp = e.maxHp; e.shed = 0; } this.dirty(e); } // (grown back: whole again over its last seconds)
        if (e.regrowT <= 0) { e.regrowT = 0; this.dirty(e); }
        mats = true;
      }
      const ringing = e.ringT > 0;
      if (ringing) e.ringT -= dt;
      // the colour: lit while it rings (a slow steady pulse), dull while it is stubs
      if (ringing || e.wasRinging || e.regrowT > 0 || e.wasSpent) {
        const pulse = ringing ? 0.55 + 0.45 * Math.sin(performance.now() / 1000 * Math.PI * 2 * 1.5) : 0;
        _c.copy(e.hp <= 0 && e.regrowT > GROW && !(e.openT > 0) ? SPENT : BASE).lerp(RING, pulse);
        for (const s of e.spires) this.mesh.setColorAt(s.i, _c);
        colors = true;
      }
      e.wasRinging = ringing; e.wasSpent = e.regrowT > 0;
    }
    if (colors) this.mesh.instanceColor.needsUpdate = true;
    if (mats) this.mesh.instanceMatrix.needsUpdate = true;
    this.frets.update(dt, this.game.daylight?.k.day ?? 0);
  }
}

/** A Possibilikey, by luck (the common ones commonly): lockheart/keys.js has what each does. */
export function rollKey() {
  const T = [['key.brass', 40], ['key.invert', 12], ['key.even', 14], ['key.twin', 10], ['key.loaded', 10], ['key.wide', 9], ['key.echo', 5]];
  let r = simRand() * T.reduce((a, t) => a + t[1], 0);
  for (const [id, w] of T) if ((r -= w) <= 0) return id;
  return 'key.brass';
}

function mergeTwo(a, b) {
  const A = a.toNonIndexed(), B = b.toNonIndexed(), out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal']) {
    const x = A.attributes[k].array, y = B.attributes[k].array, z = new Float32Array(x.length + y.length);
    z.set(x); z.set(y, x.length); out.setAttribute(k, new THREE.BufferAttribute(z, 3));
  }
  out.computeVertexNormals();
  return out;
}
