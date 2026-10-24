// ---------------------------------------------------------------------------------------
// THE HAND'S POSES: the god hand's ten mudras (the owner's ruling, 2026-10-24; Espada's table, LORE.md 4 "Mudras: the god hand's poses"),
// as poses the hand can hold over its clips. Living sacred gestures: each is drawn as its references draw it, keyed by its Sanskrit name,
// shown on screen by its plain label, and never used for anything comic. When a pose is taken is Dovina's call; this only holds one.
//
//   gyan          index tip to thumb tip, the other three straight            Ouranurgy        index touch
//   shuni         middle tip to thumb tip                                     Alteration       middle touch
//   surya         ring tip to thumb tip (the ruled form; some teach the ring  Divination       ring touch
//                 finger to the thumb's base instead)
//   buddhi        little tip to thumb tip                                     Spellscription   little touch
//   prana         ring and little tips to thumb tip, index and middle out     Possession       breath
//   bhumisparsha  fingers down to the ground, palm in (the back to the view)  Manifestation    earth touch
//   karana        index and little finger raised, middle and ring folded      Psychokinesis    horns
//                 under the thumb
//   abhaya        palm raised, turned out to the view, fingers up (the palm   the palm die     open palm
//                 die shows in the palm's opening)
//   varada        palm open facing out, fingers pointing down                 a miracle's      giving hand
//                                                                             release
//   dhyana        the hand at rest, palm up, fingers gently extended          rest (the        rest
//                                                                             Dissonance ebbing)
//
// A pose is data: an existing clip's frame as its base where one is close (the owner's clips: idle's first frame, the hand relaxed; the
// pointing hold for karana; block's open palm; release's open hand), then per-joint offsets laid over it (local eulers in radians,
// post-multiplied), then, for the four that are about where the palm faces, `face`: the whole hand turned in the world toward the view or
// the ground (the hand is disembodied: it turns itself, at handR). The offsets were solved headless, not guessed: each finger's curl axis
// measured first (a bone turned and its tip read: the fingers curl about their local +Z toward the palm and spread about local X; the
// thumb opposes about local +Z and swings across the palm about -X), then the tips brought together on the skinned mesh (the nearest
// two vertices of the two end joints under 5 mm at the hand's scale), every joint inside the hand's limits (rom.js GODHAND_ROM), the
// other fingers kept clear. The limits still run last, after this.
//
// Blended in and out over 0.2 real s on top of whatever the clips play (after the mixer, before the limits, godhandclips.js update);
// with no pose held this touches nothing, so switching it off gives the hand back to its clips exactly.
//
// Prior art and references: the hand positions as taught in Kundalini Yoga's mudra guide (kundaliniyoga.org/mudras: Gyan, Shuni, Surya,
// Buddhi), the Sri Sri School of Yoga's (srisrischoolofyoga.org, Prana), and for the Buddhist five John C. Huntington's "Mudra in Asian
// Buddhism" (dsal.uchicago.edu, the Huntington Archive) and Lion's Roar's guide to the mudras (lionsroar.com): Bhumisparsha's right hand
// over the knee, fingers to the earth; Karana's index and little finger raised; Abhaya's raised palm turned out; Varada's open palm out,
// fingers down; Dhyana's palm up in the lap. The layering is the house's own (the Courier's emotes over its stances; Unity's
// Animator's override layers, a pose weighted over the base layer).
//
//   const M = new MudraPose(game, bones, gltf.animations)   M.hold('gyan' | null)   M.apply(dt)   M.key   M.weight
//   godHandClips.mudra('abhaya')   godHandClips.mudra(null)   MUDRAS.gyan.label   mudraCommands(game)   (/mudra <key|off>, DEBUG)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const BASE = { idle: { clip: 'idle', frame: 0 }, point: { clip: 'point', frame: 20 }, block: { clip: 'block', frame: 20 }, open: { clip: 'release', frame: 16 } };

export const MUDRAS = {
  gyan: { label: 'index touch', domain: 'ouranurgy', base: BASE.idle, fingers: {
    thumb01R: [0, 0.012, -0.014], thumb02R: [-0.006, 0, 0.106], thumb03R: [0, 0, 0.02],
    f_index01R: [0, 0, 0.483], f_index02R: [0, 0, 0.349], f_index03R: [0, 0, 0.083] } },
  shuni: { label: 'middle touch', domain: 'alteration', base: BASE.idle, fingers: {
    thumb01R: [-0.321, 0.068, 0.008], thumb02R: [-0.155, 0, 0.277], thumb03R: [0, 0, 0.087],
    f_middle02R: [0, 0, 0.827], f_middle03R: [0, 0, 0.214] } },
  surya: { label: 'ring touch', domain: 'divination', base: BASE.idle, fingers: {
    thumb01R: [-0.781, 0.419, 0.092], thumb02R: [-0.176, 0, 0.261], thumb03R: [0, 0, 0.086],
    f_ring01R: [0.002, 0, 0.494], f_ring02R: [0, 0, 0.373], f_ring03R: [0, 0, 0.098] } },
  buddhi: { label: 'little touch', domain: 'spellscription', base: BASE.idle, fingers: {
    thumb01R: [-0.794, 0.302, 0.093], thumb02R: [-0.233, 0, 0.378], thumb03R: [0, 0, -0.085],
    f_pinky01R: [0.663, 0, 0.39], f_pinky02R: [0, 0, 0.005], f_pinky03R: [0, 0, -0.054] } },
  prana: { label: 'breath', domain: 'possession', base: BASE.idle, fingers: {
    thumb01R: [-0.652, 0.103, 0.218], thumb02R: [-0.278, 0, 0.482], thumb03R: [0, 0, -0.047],
    f_ring01R: [0.021, 0, 0.737], f_ring02R: [0, 0, 0.596], f_ring03R: [0, 0, 0.098],
    f_pinky01R: [0.672, 0, 0.466], f_pinky02R: [0, 0, 0.03], f_pinky03R: [0, 0, -0.053] } },
  bhumisparsha: { label: 'earth touch', domain: 'manifestation', base: BASE.open, fingers: {},
    face: { lead: 'fingers', fingers: 'down', palm: 'away' } },
  karana: { label: 'horns', domain: 'psychokinesis', base: BASE.point, fingers: { // (the little finger raised out of the pointing fist, the thumb laid over the middle and ring)
    f_pinky01R: [0.024, 0.38, -1.284], f_pinky02R: [-0.137, 0.3, -1.379], f_pinky03R: [-0.937, 0.163, -0.384], thumb01R: [0.212, -0.046, 0] } },
  abhaya: { label: 'open palm', domain: null, shows: 'palm die', base: BASE.block, fingers: {},
    face: { lead: 'fingers', fingers: 'up', palm: 'view' } },
  varada: { label: 'giving hand', domain: null, shows: "a miracle's release", base: BASE.open, fingers: {},
    face: { lead: 'fingers', fingers: 'down', palm: 'view' } },
  dhyana: { label: 'rest', domain: null, shows: 'rest (the Dissonance Level ebbing)', base: BASE.idle, fingers: {},
    face: { lead: 'palm', palm: 'up', fingers: 'away' } },
};

const FADE = 0.2; // (real s, in and out)
const SKIP = new Set(['godhand_root']); // (its travel and squash stay the clips')
const _q = new THREE.Quaternion(), _p = new THREE.Quaternion(), _d = new THREE.Quaternion(), _o = new THREE.Quaternion(), _m = new THREE.Matrix4(), _e = new THREE.Euler();
const _f = new THREE.Vector3(), _b = new THREE.Vector3(), _x = new THREE.Vector3(), _c = new THREE.Vector3(), _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export class MudraPose {
  constructor(game, bones, clips) {
    this.game = game; this.bones = bones; this.clips = new Map((clips || []).map((c) => [c.name, c]));
    this.targets = new Map(); // (key -> Map(bone -> its local quaternion in the pose))
    this.layers = new Map(); // (key -> weight 0..1)
    this.rest = new Map(Object.values(bones).map((b) => [b, b.quaternion.clone()])); // (built at the rig's rest: a bone the base clip leaves out stays at rest)
    this.key = null;
  }

  /** Hold a pose (its key) or let it go (null). Returns false for a key that is no mudra. */
  hold(key) {
    if (key != null && !MUDRAS[key]) return false;
    this.key = key ?? null;
    if (key && !this.layers.has(key)) this.layers.set(key, 0);
    return true;
  }
  get weight() { return this.key ? this.layers.get(this.key) ?? 0 : 0; }
  get active() { return this.layers.size > 0; }

  /** The pose's local quaternions: its base clip's frame, each track read through its own interpolant, then the offsets. */
  target(key) {
    let T = this.targets.get(key);
    if (T) return T;
    const M = MUDRAS[key], clip = M.base && this.clips.get(M.base.clip);
    T = new Map();
    for (const [name, b] of Object.entries(this.bones)) if (!SKIP.has(name)) T.set(b, this.rest.get(b).clone());
    if (clip) for (const tr of clip.tracks) {
      const [name, prop] = tr.name.split('.'), b = this.bones[name];
      if (prop !== 'quaternion' || !b || SKIP.has(name)) continue;
      const v = tr.createInterpolant().evaluate(Math.min(clip.duration, M.base.frame / 30));
      T.set(b, new THREE.Quaternion().fromArray(v).normalize());
    }
    for (const [name, e] of Object.entries(M.fingers || {})) {
      const b = this.bones[name]; if (!b) continue;
      T.set(b, T.get(b).clone().multiply(_q.setFromEuler(_e.set(e[0], e[1], e[2]))));
    }
    if (M.wrist && this.bones.handR) T.set(this.bones.handR, T.get(this.bones.handR).clone().multiply(_q.setFromEuler(_e.set(...M.wrist))));
    this.targets.set(key, T);
    return T;
  }

  /** Once a frame after the mixer, before the limits: each held or fading pose laid over the clips by its weight. */
  apply(dt) {
    if (!this.layers.size) return false;
    for (const [key, w0] of this.layers) {
      const w = Math.min(1, Math.max(0, w0 + (key === this.key ? dt : -dt) / FADE));
      if (w <= 0 && key !== this.key) { this.layers.delete(key); continue; }
      this.layers.set(key, w);
      const k = w * w * (3 - 2 * w), T = this.target(key), hand = this.bones.handR;
      for (const [b, q] of T) if (b !== hand) b.quaternion.slerp(q, k);
      if (hand) hand.quaternion.slerp(MUDRAS[key].face ? _o.copy(this.faced(MUDRAS[key].face, T.get(hand))) : T.get(hand), k);
    }
    return true;
  }

  /** handR's local rotation that turns the whole hand (as posed at `local`) so its fingers and palm face as `face` asks in the world:
   *  fingers 'up' | 'down' | 'away' (from the view, level), palm 'view' | 'away' | 'up'; `lead` is kept exact, the other squared to it. */
  faced(face, local) {
    const hand = this.bones.handR, parent = hand.parent, cam = this.game.camera;
    if (!parent || !cam) return local;
    parent.updateWorldMatrix(true, false);
    hand.getWorldPosition(_w);
    _c.copy(cam.position).sub(_w).normalize(); // (toward the view)
    const dir = (what, out) => what === 'up' ? out.copy(UP) : what === 'down' ? out.copy(UP).negate() : what === 'view' ? out.copy(_c)
      : out.copy(_c).negate().setY(0).normalize(); // ('away': level, away from the view)
    // the wanted model frame
    const F = dir(face.fingers, _f), B = dir(face.palm, _b).negate(); // (the back is the palm's opposite)
    if (face.lead === 'palm') F.addScaledVector(B, -F.dot(B)).normalize(); else B.addScaledVector(F, -B.dot(F)).normalize();
    if (F.lengthSq() < 1e-6 || B.lengthSq() < 1e-6) return local;
    _x.crossVectors(F, B).normalize();
    const want = _d.setFromRotationMatrix(_m.makeBasis(_x, F, B));
    // the hand's frame in the world is P * local * rest^-1 (P its parent's world rotation; at rest the model's own: fingers +Y, back
    // +Z); set equal to `want`, keeping the pose's own wrist: local' = P^-1 * want * local
    parent.getWorldQuaternion(_p);
    return _p.invert().multiply(want).multiply(local).normalize();
  }

  dispose() { this.layers.clear(); this.targets.clear(); this.key = null; }
}

/** `/mudra <key|off>` on the chat line (DEBUG): the hand holds a pose so the owner can try each one. */
export function mudraCommands(game) {
  const keys = Object.keys(MUDRAS);
  game.chat?.add?.('mudra', { debug: true, help: `the god hand holds a mudra (DEBUG): /mudra ${keys.join(' | ')} | off`, run: ([k]) => {
    const C = game.god?.handClips; if (!C) return;
    const key = !k || k === 'off' ? null : String(k).toLowerCase();
    if (key && !MUDRAS[key]) { game.log?.say('warn', `There is no mudra ${k}: ${keys.join(', ')}.`, { key: 'mudra.no', throttle: 1 }); return; }
    C.mudra(key);
  } });
}
