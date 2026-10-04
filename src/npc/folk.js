// ---------------------------------------------------------------------------------------
// THE CLAY FOLK: the people of the workshop and the oasis. A folk is a clapperjar grown up and glazed: the same little jar body,
// its lid for a head (and a mouth: the lid lifts and clinks on every syllable it speaks, in time with its voice, npc/clayese.js),
// a glaze of its own and a hat that says what it does (the doc's "hats read faction"). It stands where it lives, turns its lid
// toward the Courier when they come near, and shows how it feels with its whole body, as the treasure chests show theirs:
//
//   joy      hops and squashes, arms up, warm sparks and a note            fear     shivers, crouches, lid chattering, sweat flicking off
//   anger    puffs up, throbs red, steam from under the lid, embers         sad      droops and sways, sinks, tears falling
//   surprise jumps, the lid pops, a ring bursts                            awe      leans back and rises, Lachryma motes drifting up
//   confused tilts side to side, motes circling its lid                    sly      leans back, lid ajar, eyes narrowed, a wink of violet
//   whisper  leans in close
//
// A mood is set by the dialogue (a line's mood, or {mood:x} inside it) and fades back to the folk's own temper when the talk ends;
// {burst} is the big moment (the explosion of feeling: twice the particles, a glyph, the camera strains, the room's light flinches).
// The marks over it are glyphs (vfx/glyphs.js: ! !! ? … ♪ and the vein of anger), the motes and drops are the FX particles.
//
// Prior art: Animal Crossing's villagers (a voice of their own, emotes with a mark over the head: the sweat drop, the anger vein,
// the musical note), Dark Cloud 2's and Rogue Galaxy's talking heads (a bob on every line), the manga marks for feelings, and this
// game's own treasure chests (a body that squashes, stretches and shakes with what is happening to it).
//
//   const F = new Folk(game, clapperGltf)    F.spawn(def)    F.update(dt)    F.near(P)    npc.setMood('fear', 1)    npc.speak(emph)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { addOutline } from '../render/outline.js';
import { addRim } from '../render/toon.js';
import { JointLimits, CLAPPER_ROM } from '../courier/anim/rom.js';
import { RAPIER, GROUPS, G, groups } from '../core/physics.js';
import { PALETTE } from '../core/config.js';
import { Clayese } from './clayese.js';
import { sfx } from '../audio/sfx.js';

const UP = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1);
const POSE = ['hop', 'squash', 'armUp', 'armIn', 'armOut', 'armDown', 'shake', 'lid', 'eyes', 'puff', 'red', 'lean', 'sink', 'sway', 'rise', 'tilt', 'look2'];
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _c = new THREE.Color();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const rnd = (a, b) => a + Math.random() * (b - a);

// the hats (a few primitives each): what a folk does is on its head
function hat(kind, color) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, flatShading: true });
  const add = (geo, x = 0, y = 0, z = 0, rx = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.x = rx; o.castShadow = true; g.add(o); addOutline(o); return o; };
  if (kind === 'straw') { add(new THREE.CylinderGeometry(0.3, 0.3, 0.015, 14), 0, 0.02); add(new THREE.ConeGeometry(0.15, 0.16, 12), 0, 0.1); }
  else if (kind === 'fez') { add(new THREE.CylinderGeometry(0.075, 0.1, 0.14, 12), 0, 0.07); const t = add(new THREE.SphereGeometry(0.022, 6, 4), 0.06, 0.1, 0); t.material = new THREE.MeshStandardMaterial({ color: 0x2a1640, roughness: 0.6 }); }
  else if (kind === 'cap') { add(new THREE.SphereGeometry(0.11, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0.01); add(new THREE.BoxGeometry(0.1, 0.012, 0.09), 0, 0.012, 0.11); }
  else if (kind === 'scarf') { add(new THREE.TorusGeometry(0.155, 0.036, 6, 16), 0, -0.065, 0, Math.PI / 2); add(new THREE.SphereGeometry(0.045, 6, 5), 0, -0.06, -0.17); add(new THREE.ConeGeometry(0.03, 0.09, 5), 0.02, -0.11, -0.19, 0.5); }
  return g;
}

// how each mood moves the body (k: 0..1 how strongly)
const BODY = {
  calm: () => {},
  joy: (n, k, t) => { const h = Math.abs(Math.sin(t * 7.5)); n.p.hop = h * 0.07 * k; n.p.squash += (h < 0.15 ? -0.1 : 0.04) * k; n.p.armUp = 1.4 * k + Math.sin(t * 15) * 0.3 * k; },
  fear: (n, k, t) => { n.p.shake = 0.018 * k; n.p.squash -= 0.14 * k; n.p.lid = Math.max(n.p.lid, (0.08 + Math.random() * 0.12) * k); n.p.armIn = 0.9 * k; n.p.eyes = 0.75; },
  anger: (n, k, t) => { n.p.puff = 0.09 * k + Math.sin(t * 11) * 0.025 * k; n.p.shake = 0.006 * k; n.p.red = (0.55 + 0.45 * Math.sin(t * 9)) * k; n.p.armOut = 0.8 * k; n.p.eyes = 0.55; },
  sad: (n, k, t) => { n.p.lean = 0.28 * k; n.p.sink = 0.04 * k; n.p.sway = Math.sin(t * 1.3) * 0.06 * k; n.p.armDown = 0.7 * k; n.p.eyes = 0.45; },
  surprise: (n, k, t) => { n.p.squash += 0.12 * k; n.p.lid = Math.max(n.p.lid, 0.5 * k); n.p.eyes = 1.4; n.p.armUp = 0.8 * k; },
  awe: (n, k, t) => { n.p.lean = -0.16 * k; n.p.rise = 0.03 * k + Math.sin(t * 2) * 0.01; n.p.eyes = 1.3; n.p.armUp = 0.5 * k; },
  confused: (n, k, t) => { n.p.tilt = Math.sin(t * 2.2) * 0.2 * k; n.p.look2 = Math.sin(t * 1.7) * 0.5 * k; },
  sly: (n, k, t) => { n.p.lean = -0.08 * k; n.p.tilt = 0.12 * k; n.p.lid = Math.max(n.p.lid, 0.1 * k); n.p.eyes = 0.5; },
  whisper: (n, k, t) => { n.p.lean = 0.16 * k; n.p.squash -= 0.05 * k; },
};

export class Folk {
  constructor(game, gltf) {
    this.game = game; this.gltf = gltf; this.list = []; this.byId = {};
    this.voice = new Clayese(sfx);
    this.clips = Object.fromEntries((gltf?.animations || []).map((c) => [c.name.replace('clapper_', ''), c]));
    this.eyeMat = new THREE.MeshBasicMaterial({ color: PALETTE.outline });
    // the folk answer the Courier's emotes (emotes.js): a wave gets a happy hop, a faint a fright
    game.events?.on('emote.start', (e) => this.react(e.emote));
  }

  /** The nearest folk (in sight, not talking) answers an emote with a feeling for a moment. */
  react(emote) {
    const P = this.game.player, m = { wave: 'joy', dance: 'joy', nod: 'joy', faint: 'surprise', no: 'sad', talk: 'confused', kneel: 'confused', fold: 'sly', sit: 'calm' }[emote];
    if (!m || this.game.dialogue?.open) return;
    let best = null, bd = 8;
    for (const n of this.list) { const d = n.pos.distanceTo(P.pos); if (d < bd) { bd = d; best = n; } }
    if (!best) return;
    best.reactT = 2.4; this.setMood(best, m, 0.9);
  }

  /** Put a folk in the world: def = { id, name, title, pos: [x, y, z], yaw, scale, glaze, hat, hatColor, voice, temper } */
  spawn(def) {
    const g = this.game, root = new THREE.Group(), model = cloneSkinned(this.gltf.scene);
    const mat = addRim(new THREE.MeshStandardMaterial({ color: def.glaze, roughness: def.rough ?? 0.42, metalness: def.metal ?? 0.05, flatShading: true }), 0.9);
    mat.emissive = new THREE.Color(0x000000);
    model.traverse((o) => { if (o.isMesh) { o.material = mat; o.castShadow = true; o.frustumCulled = false; addOutline(o); } });
    const bone = (n) => model.getObjectByName(n), eyes = bone('eyes');
    if (eyes) for (const x of [-0.055, 0.055]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 4), this.eyeMat); e.scale.set(1, 1.5, 0.6); e.position.set(x, 0.01, 0); eyes.add(e); }
    const head = bone('head');
    if (head && def.hat) { const h = hat(def.hat, def.hatColor ?? 0xd9b98a); h.position.set(0, { scarf: 0.1, cap: 0.085, straw: 0.1, fez: 0.095 }[def.hat] ?? 0.1, 0); head.add(h); }
    root.add(model);
    // where it stands: on whatever is under the place it was given
    const p = new THREE.Vector3(...def.pos);
    const hit = g.physics.raycast({ x: p.x, y: p.y + 3, z: p.z }, { x: 0, y: -1, z: 0 }, 12, undefined, groups(0xffff, G.STATIC));
    if (hit) p.y = hit.point.y;
    root.position.copy(p); root.rotation.y = def.yaw || 0;
    g.scene.add(root);
    const mixer = new THREE.AnimationMixer(model), idle = this.clips.idle && mixer.clipAction(this.clips.idle);
    idle?.play(); idle && (idle.time = Math.random() * 2);
    model.updateMatrixWorld(true);
    const mq = model.getWorldQuaternion(new THREE.Quaternion()).invert();
    const restInv = (b) => (b ? b.getWorldQuaternion(new THREE.Quaternion()).premultiply(mq).invert() : null);
    const bones = { body: bone('body'), head, eyes, armL: bone('upper_armL'), armR: bone('upper_armR'), foreL: bone('forearmL'), foreR: bone('forearmR') };
    // (their joints' limits, applied last, as the clapperjars' are: the folk wear the same rig; rom.js)
    const rom = new JointLimits();
    for (const [name, spec] of Object.entries(CLAPPER_ROM)) { const bn = bone(name); if (bn) rom.add(bn, bn.quaternion.clone(), spec); }
    const s = def.scale ?? 1.9;
    // a solid post so they walk round it, not through (a static collider: shots and tools pass it by as part of the room)
    const body = g.physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(p.x, p.y + 0.35 * s / 1.9, p.z));
    g.physics.world.createCollider(RAPIER.ColliderDesc.cylinder(0.35 * s / 1.9, 0.26 * s / 1.9).setCollisionGroups(GROUPS.static), body);
    const n = {
      def, id: def.id, name: def.name, root, model, mixer, mat, bones, rom, pos: p, yaw: def.yaw || 0, scale: s,
      inv: { head: restInv(head), body: restInv(bones.body), L: restInv(bones.armL), R: restInv(bones.armR) },
      mood: def.temper || 'calm', k: 0.35, kTarget: 0.35, t: Math.random() * 10, look: 0, lidT: 0, lidA: 0, blinkT: 2, hopV: 0, hopY: 0,
      vfxT: 0, talking: false, p: Object.fromEntries(POSE.map((k) => [k, 0])), glaze: new THREE.Color(def.glaze), voice: def.voice || { base: 74, scale: 'yo', bell: 0.7, clay: 0.5 },
    };
    root.scale.setScalar(s);
    this.list.push(n); this.byId[def.id] = n;
    return n;
  }

  /** The nearest folk the Courier could talk to (in reach, in front of them, on their level). */
  near(P, reach = 2.4) {
    let best = null, bd = reach;
    for (const n of this.list) {
      const dx = n.pos.x - P.pos.x, dz = n.pos.z - P.pos.z, d = Math.hypot(dx, dz);
      if (d > bd || Math.abs(n.pos.y - P.pos.y) > 1.2) continue;
      best = n; bd = d;
    }
    return best;
  }
  head(n, out = new THREE.Vector3()) { return out.copy(n.pos).setY(n.pos.y + 0.62 * n.scale); }

  // ------------------------------------------------------------------ what the dialogue asks of a folk
  setMood(n, mood, k = 0.85) {
    if (!n) return;
    const was = n.mood;
    n.mood = BODY[mood] ? mood : 'calm'; n.kTarget = k;
    if (was !== n.mood) this.onset(n, n.mood, k);
  }
  /** One syllable: the lid lifts (more for a stressed word) and the voice sounds. */
  speak(n, letter, opts = {}) {
    n.lidT = 0.09; n.lidA = Math.max(n.lidA, 0.28 + (opts.emph ? 0.3 : 0) + Math.random() * 0.12);
    const d = this.game.listenerDistance?.(n.pos) ?? 3;
    this.voice.blip(letter, n.voice, { mood: n.mood, dist: d, ...opts });
  }
  /** The start of a feeling: its mark over the lid, and a first flourish. */
  onset(n, mood, k) {
    const g = this.game, top = this.head(n, _v).add(_w.set(0, 0.32 * n.scale, 0));
    const mark = { joy: 'note', fear: 'bang1', anger: 'vein', sad: 'dots', surprise: 'bang2', awe: 'star', confused: 'ask' }[mood];
    const col = { joy: 0xffd76a, fear: 0xbfe4ff, anger: 0xff6a4a, sad: 0x9fb8ff, surprise: 0xfff1dc, awe: 0xd9b0ff, confused: 0xffe0a0 }[mood];
    if (mark && k > 0.4) g.glyphs?.pop(mark, top.clone(), { color: col, size: 0.42, follow: () => this.head(n).add(_w.set(0, 0.32 * n.scale, 0)) });
    if (mood === 'surprise') { n.hopV = 2.6; this.ring(n, 0xfff1dc, 18); sfx.pop?.(2); }
    if (mood === 'joy') n.hopV = 1.6;
  }
  /** The big moment: everything at once, twice over. */
  burst(n) {
    const g = this.game, m = n.mood;
    const col = { joy: 0xffd76a, fear: 0xbfe4ff, anger: 0xff5a30, sad: 0x8fb0ff, surprise: 0xffffff, awe: 0xc9a0ff, confused: 0xffe0a0, sly: 0xb07cff }[m] || 0xffe0c0;
    this.ring(n, col, 34);
    for (let i = 0; i < 3; i++) this.emit(n, m, 2);
    n.hopV = m === 'sad' ? 0 : 2.2;
    if (m === 'anger') { g.player.shake = Math.max(g.player.shake || 0, 0.35); g.mood?.set('npc.burst', { dim: 0.25, tint: 0xff3010, tintK: 0.45, ease: 14 }); }
    else if (m === 'fear') g.mood?.set('npc.burst', { dim: 0.5, tint: 0x2040a0, tintK: 0.4, ease: 14 });
    else if (m === 'awe' || m === 'joy') g.mood?.set('npc.burst', { dim: -0.15, tint: 0xffe0a0, tintK: 0.25, ease: 14 });
    clearTimeout(this.burstFree); this.burstFree = setTimeout(() => g.mood?.free('npc.burst'), 650);
    if (g.cinema) g.cinema.strain = Math.max(g.cinema.strain || 0, 0.6);
    sfx.chime?.() ?? sfx.mark?.();
  }
  ring(n, color, count) {
    const c = this.head(n, _v).add(_w.set(0, 0.05, 0)), col = _c.setHex(color).clone();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      this.game.fx.add.emit({ pos: c, vel: new THREE.Vector3(Math.cos(a) * 3.2, rnd(0.5, 1.6), Math.sin(a) * 3.2), life: 0.45, size: 0.07, sizeEnd: 0.01, color: col, drag: 4, twinkle: 14, floor: -999 });
    }
  }
  /** The particles of a mood (per tick; `x` scales how many). */
  emit(n, mood, x = 1) {
    const fx = this.game.fx, h = this.head(n, _v).clone(), s = n.scale;
    const side = () => _w.set(Math.cos(n.yaw), 0, -Math.sin(n.yaw)).multiplyScalar(Math.random() < 0.5 ? -1 : 1);
    for (let i = 0; i < x; i++) {
      if (mood === 'joy') fx.add.emit({ pos: h.clone().add(new THREE.Vector3(rnd(-0.3, 0.3), rnd(-0.1, 0.4), rnd(-0.3, 0.3)).multiplyScalar(s)), vel: new THREE.Vector3(rnd(-0.4, 0.4), rnd(0.6, 1.4), rnd(-0.4, 0.4)), life: 0.9, size: 0.06, sizeEnd: 0.0, color: _c.setHSL(rnd(0.08, 0.15), 1, 0.65).clone(), drag: 1.5, twinkle: 18, floor: -999 });
      else if (mood === 'fear') fx.alpha.emit({ pos: h.clone().addScaledVector(side(), 0.16 * s).add(_w.set(0, 0.05 * s, 0)), vel: side().multiplyScalar(rnd(0.8, 1.4)).add(_w.set(0, rnd(0.6, 1.2), 0)), life: 0.6, size: 0.04, sizeEnd: 0.025, color: _c.setHex(0xd8f0ff).clone(), alpha: 0.9, drag: 0.8, gravity: 7 });
      else if (mood === 'anger') {
        fx.alpha.emit({ pos: h.clone().add(_w.set(rnd(-0.08, 0.08) * s, 0.12 * s, rnd(-0.08, 0.08) * s)), vel: new THREE.Vector3(rnd(-0.3, 0.3), rnd(1.2, 2), rnd(-0.3, 0.3)), life: 0.9, size: 0.08, sizeEnd: 0.4, color: _c.setHex(0xf2ece4).clone(), alpha: 0.4, drag: 2.5, gravity: -0.6 });
        if (Math.random() < 0.4) fx.add.emit({ pos: h.clone(), vel: new THREE.Vector3(rnd(-1, 1), rnd(1, 2.5), rnd(-1, 1)), life: 0.5, size: 0.04, sizeEnd: 0, color: _c.setHex(0xff6a2a).clone(), drag: 1.5, gravity: 2, twinkle: 20, floor: -999 });
      } else if (mood === 'sad') fx.alpha.emit({ pos: h.clone().addScaledVector(side(), 0.06 * s).add(_w.set(0, -0.02 * s, 0)).addScaledVector(_w.set(Math.sin(n.yaw), 0, Math.cos(n.yaw)), 0.14 * s), vel: new THREE.Vector3(0, -0.2, 0), life: 0.9, size: 0.035, sizeEnd: 0.02, color: _c.setHex(0x9cc8ff).clone(), alpha: 0.85, drag: 0.4, gravity: 6 });
      else if (mood === 'awe') fx.add.emit({ pos: h.clone().add(new THREE.Vector3(rnd(-0.6, 0.6), rnd(-0.6, 0.2), rnd(-0.6, 0.6)).multiplyScalar(s)), vel: new THREE.Vector3(0, rnd(0.2, 0.6), 0), life: 1.6, size: 0.05, sizeEnd: 0, color: _c.setHSL(rnd(0.5, 0.88), 0.9, 0.6).clone(), drag: 0.6, twinkle: 9, floor: -999 });
      else if (mood === 'confused') { const a = n.t * 5 + i * 2.1; fx.add.emit({ pos: h.clone().add(_w.set(Math.cos(a) * 0.22 * s, 0.3 * s, Math.sin(a) * 0.22 * s)), vel: new THREE.Vector3(0, 0, 0), life: 0.35, size: 0.04, sizeEnd: 0, color: _c.setHex(0xffe6a0).clone(), drag: 1, floor: -999 }); }
      else if (mood === 'sly' && Math.random() < 0.3) fx.add.emit({ pos: h.clone().add(_w.set(Math.sin(n.yaw) * 0.14 * s + 0.05, 0.03 * s, Math.cos(n.yaw) * 0.14 * s)), vel: new THREE.Vector3(0, 0.2, 0), life: 0.5, size: 0.07, sizeEnd: 0, color: _c.setHex(0xb07cff).clone(), drag: 2, twinkle: 25, floor: -999 });
    }
  }

  // ------------------------------------------------------------------ every frame
  update(dt) {
    const g = this.game, P = g.player;
    for (const n of this.list) {
      if (g.zones && !g.zones.visibleAt(n.pos)) continue;
      n.t += dt;
      if (n.reactT > 0) { n.reactT -= dt; if (n.reactT <= 0 && this.game.dialogue?.npc !== n) this.setMood(n, n.def.temper || 'calm', 0.35); }
      n.k = THREE.MathUtils.damp(n.k, n.kTarget, 4, dt);
      n.mixer.update(dt);
      // the body: start each frame from rest, let the mood move it
      const p = n.p; for (const key of POSE) p[key] = 0; p.eyes = 1;
      BODY[n.mood]?.(n, n.k, n.t);
      // particles at a mood's own rate
      n.vfxT -= dt;
      if (n.vfxT <= 0 && n.k > 0.3) {
        n.vfxT = { joy: 0.09, fear: 0.22, anger: 0.11, sad: 0.4, awe: 0.07, confused: 0.03, sly: 0.5 }[n.mood] ?? 9;
        this.emit(n, n.mood, 1);
      }
      // a hop (surprise, joy's first leap, a burst)
      n.hopV -= 14 * dt; n.hopY = Math.max(0, n.hopY + n.hopV * dt); if (n.hopY <= 0 && n.hopV < 0) n.hopV = 0;
      // the lid: a syllable lifts it, fear rattles it, a surprise pops it
      n.lidT -= dt; if (n.lidT <= 0) n.lidA = THREE.MathUtils.damp(n.lidA, 0, 22, dt);
      const lid = Math.max(n.lidA, p.lid || 0);
      // look at the Courier (when they are near), the confused shake of the lid on top
      const dx = P.pos.x - n.pos.x, dz = P.pos.z - n.pos.z, near = Math.hypot(dx, dz) < 7;
      const want = near ? THREE.MathUtils.clamp(wrap(Math.atan2(dx, dz) - n.yaw), -1.1, 1.1) : Math.sin(n.t * 0.4) * 0.3;
      n.look = THREE.MathUtils.damp(n.look, want + (p.look2 || 0), 5, dt);
      const b = n.bones;
      const sq = (p.squash || 0) + Math.sin(n.t * 2.1) * 0.015; // (breathing)
      if (b.body && n.inv.body) b.body.scale.set(1 - sq * 0.5 + (p.puff || 0), 1 + sq + (p.puff || 0), 1 - sq * 0.5 + (p.puff || 0));
      if (b.head && n.inv.head) {
        b.head.quaternion.multiply(_q.setFromAxisAngle(_v.copy(UP).applyQuaternion(n.inv.head).normalize(), n.look));
        b.head.quaternion.multiply(_q.setFromAxisAngle(_v.copy(X).applyQuaternion(n.inv.head).normalize(), -lid));
      }
      const arm = (bn, inv, ang) => { if (bn && inv && ang) bn.quaternion.multiply(_q.setFromAxisAngle(_v.copy(Z).applyQuaternion(inv).normalize(), ang)); };
      if (p.armUp) { arm(b.armL, n.inv.L, p.armUp); arm(b.armR, n.inv.R, -p.armUp); }
      if (p.armIn) { arm(b.armL, n.inv.L, -p.armIn * 0.6); arm(b.armR, n.inv.R, p.armIn * 0.6); }
      if (p.armOut) { arm(b.armL, n.inv.L, 0.9 * p.armOut + Math.sin(n.t * 18) * 0.15); arm(b.armR, n.inv.R, -0.9 * p.armOut - Math.sin(n.t * 18) * 0.15); }
      if (p.armDown) { arm(b.armL, n.inv.L, -0.5 * p.armDown); arm(b.armR, n.inv.R, 0.5 * p.armDown); }
      n.rom.apply(); // (every posed joint through its limits, last)
      // eyes: blink, and their size says the feeling (wide in awe, narrowed in anger)
      n.blinkT -= dt; if (n.blinkT < 0) n.blinkT = 2 + Math.random() * 4;
      if (b.eyes) b.eyes.scale.set(1, (n.blinkT < 0.1 ? 0.15 : 1) * p.eyes, 1);
      // the whole body
      const sh = p.shake || 0;
      n.root.position.set(n.pos.x + (sh ? (Math.random() - 0.5) * sh * 2 : 0), n.pos.y + n.hopY + (p.rise || 0) - (p.sink || 0), n.pos.z + (sh ? (Math.random() - 0.5) * sh * 2 : 0));
      n.root.rotation.set(p.lean || 0, n.yaw, (p.tilt || 0) + (p.sway || 0), 'YXZ');
      // anger glows through the glaze
      if (p.red) { n.mat.emissive.setRGB(0.55 * p.red, 0.06 * p.red, 0.02 * p.red); } else if (n.mat.emissive.r) n.mat.emissive.setRGB(0, 0, 0);
    }
  }
}
