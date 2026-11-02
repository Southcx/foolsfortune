// ---------------------------------------------------------------------------------------
// THE MECH'S MOVES AND WHAT BREAKS (Dovina's mech v2: progress/mechs/destruction.js, techniques.js, joints.js; the runtime world/hangar/).
// The city's masonry and a building felled are audio/mechs.js's; this is the rest of everything breaking, a voice a thing from a table
// keyed by the event's own field (the building's material, the technique's id, the prop, the joint's state), never a switch on a kind.
//   A BUILDING'S STUFF  (city.break { building }) over mechs.js's masonry, what the building is made of (BUILDINGS' shell, frame, glass):
//                       glass a bright shatter and its tinkle, timber splintering, brick and stone a chunkier crack, steel a groan and
//                       a girder's ring
//   A TECHNIQUE         (mech.technique { id }) the Thunderclap a clap at a mech's scale with the glass answering, the Ground Pound two
//                       fists and the ground's roll, the Elbow Drop a whoosh down into a slam, the Super Jump the charge let go, the
//                       Battering Ram the assault boost's roar, the Uppercut a blow up and its clang, the Wrecking Spin a whirl, the
//                       Javelin a long throw's whistle, the Slab Shield a slab set with a thud; Grab and Throw by their prop
//   A PROP              (mech.grab / mech.prop.throw / mech.prop.break { prop }) a lamp post's clay, a girder's steel, a chunk's
//                       rubble, a limb's porcelain, a water tower's tank: picked up, thrown, and broken (the tank bursting)
//   A JOINT             (mech.joint { joint, to }) a joint fractured: steel creaking; snapped: a tear; the neck snapped: the head off
//                       on its spring, Rock 'Em Sock 'Em's boing
//
// Prior art: Rampage and Godzilla's buildings (each stuff its own break), Mercenaries' and Red Faction's materials, Rock 'Em Sock 'Em
// Robots (the head's spring), Pacific Rim's and Giant Clank's moves at scale.
//
//   sfx.cityStuff(building) .mechTechnique(id) .mechProp(verb, prop) .mechJoint(joint, to)
// ---------------------------------------------------------------------------------------
import { BUILDINGS, MAT } from '../progress/mechs/destruction.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const MAT_NAME = Object.fromEntries(Object.entries(MAT).map(([k, v]) => [v, k]));
/** Each material's break, over the masonry (s the Sfx, t the time, d the out). */
const STUFF = {
  glass: (s, t, d) => { s.noise(t, 0.08, { type: 'highpass', f0: 4000, gain: 0.5, dest: d }); for (let i = 0; i < 10; i++) { const at = t + 0.03 + Math.random() * 0.5, f = 2500 + Math.random() * 3500; s.tone(at, 0.2, { f0: f, gain: 0.025, dest: d }); } },
  timber: (s, t, d) => { for (let i = 0; i < 6; i++) s.noise(t + i * 0.035, 0.05, { type: 'bandpass', f0: 700 + Math.random() * 500, q: 3, gain: 0.3, dest: d }); s.tone(t, 0.3, { f0: 160, f1: 100, type: 'triangle', gain: 0.1, dest: d }); },
  brick: (s, t, d) => { s.noise(t, 0.12, { type: 'bandpass', f0: 900, q: 1.2, gain: 0.35, dest: d }); for (let i = 0; i < 5; i++) s.noise(t + 0.1 + Math.random() * 0.4, 0.04, { type: 'lowpass', f0: 1200, gain: 0.2, dest: d }); },
  stone: (s, t, d) => { s.noise(t, 0.1, { type: 'bandpass', f0: 700, q: 1.5, gain: 0.4, dest: d }); s.tone(t, 0.5, { f0: 70, f1: 40, gain: 0.25, dest: d }); },
  steel: (s, t, d) => { s.noise(t, 0.6, { type: 'bandpass', f0: 300, f1: 200, q: 5, gain: 0.25, attack: 0.1, dest: d }); [180, 470, 830].forEach((f, i) => s.tone(t + 0.05, 1.2 / (1 + i), { f0: f, f1: f * 0.97, gain: 0.05 / (1 + i), dest: d })); },
};
/** Each technique's sound (its id, techniques.js). */
const TECH = {
  thunderclap: (s, t, d) => { s.noise(t, 0.06, { type: 'bandpass', f0: 1400, q: 0.8, gain: 0.8, dest: d }); s.tone(t, 0.8, { f0: 90, f1: 40, gain: 0.5, dest: d }); s.noise(t + 0.04, 1.2, { type: 'lowpass', f0: 2000, f1: 300, gain: 0.25, dest: d }); STUFF.glass(s, t + 0.15, d); },
  groundPound: (s, t, d) => { [0, 0.08].forEach((x) => { s.tone(t + x, 0.6, { f0: 70, f1: 30, gain: 0.5, dest: d }); s.noise(t + x, 0.1, { type: 'lowpass', f0: 1200, gain: 0.4, dest: d }); }); s.noise(t + 0.1, 1.6, { type: 'lowpass', f0: 500, f1: 100, gain: 0.3, attack: 0.1, dest: d }); },
  elbowDrop: (s, t, d) => { s.noise(t, 0.5, { type: 'bandpass', f0: 600, f1: 2500, q: 1, gain: 0.3, attack: 0.4, dest: d }); s.tone(t + 0.5, 0.8, { f0: 80, f1: 30, gain: 0.55, dest: d }); s.noise(t + 0.5, 0.15, { type: 'lowpass', f0: 1500, gain: 0.45, dest: d }); },
  superJump: (s, t, d) => { s.tone(t, 0.25, { f0: 200, f1: 600, type: 'sawtooth', gain: 0.04, dest: d }); s.noise(t + 0.2, 0.6, { type: 'bandpass', f0: 400, f1: 1800, q: 0.8, gain: 0.35, dest: d }); s.tone(t + 0.2, 0.5, { f0: 60, f1: 120, gain: 0.25, dest: d }); },
  battering: (s, t, d) => { s.noise(t, 1, { type: 'bandpass', f0: 500, f1: 900, q: 0.6, gain: 0.35, attack: 0.15, dest: d }); s.tone(t, 1, { f0: 55, f1: 70, type: 'sawtooth', gain: 0.04, dest: d }); },
  uppercut: (s, t, d) => { s.noise(t, 0.2, { type: 'bandpass', f0: 500, f1: 2400, q: 1, gain: 0.35, dest: d }); s.tone(t + 0.18, 0.5, { f0: 200, f1: 120, gain: 0.35, dest: d }); [2.7, 4.3].forEach((r) => s.tone(t + 0.18, 0.4, { f0: 200 * r, gain: 0.04, dest: d })); },
  spin: (s, t, d) => { for (let i = 0; i < 4; i++) s.noise(t + i * 0.16, 0.18, { type: 'bandpass', f0: 500 + i * 150, f1: 1500 + i * 150, q: 1, gain: 0.25, dest: d }); },
  javelin: (s, t, d) => { s.noise(t, 0.1, { type: 'lowpass', f0: 900, gain: 0.3, dest: d }); s.tone(t + 0.05, 1, { f0: 1600, f1: 700, gain: 0.04, dest: d }); s.noise(t + 0.05, 1, { type: 'bandpass', f0: 2500, f1: 1200, q: 3, gain: 0.12, dest: d }); },
  shieldUp: (s, t, d) => { s.tone(t, 0.4, { f0: 90, f1: 60, gain: 0.4, dest: d }); s.noise(t, 0.1, { type: 'lowpass', f0: 800, gain: 0.4, dest: d }); },
};
/** Each prop's stuff (PROPS' ids, techniques.js): its body Hz, its band, and what it breaks as. */
const PROP = {
  post: { f: 260, band: 1400, breaks: 'brick' }, girder: { f: 180, band: 900, breaks: 'steel', ring: true },
  chunk: { f: 110, band: 800, breaks: 'stone' }, limb: { f: 300, band: 2200, breaks: 'glass', ring: true }, tower: { f: 90, band: 600, breaks: 'steel', water: true },
};
/** Each moment's level against the parry's clang (set by ear in the probe). */
const LEVEL = { stuff: 1.9, grab: 3.2, throw: 1.36, break: 1, strain: 5.4, snap: 1.75, head: 2.8,
  thunderclap: 0.65, groundPound: 0.66, elbowDrop: 0.52, superJump: 1, battering: 1.9, uppercut: 0.8, spin: 2.4, javelin: 3.7, shieldUp: 2.1 };

export class MechMoveSounds {
  moveOut(key, gain, verb) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb)); setTimeout(() => d.disconnect(), 8000); return d; }

  cityStuff(building = 'house') {
    const B = BUILDINGS[building]; if (!B || !this.ok() || !this.allow('cityStuff', 6)) return;
    const t = this.ctx.currentTime, d = this.moveOut('stuff', 0.4, 0.7);
    STUFF[MAT_NAME[B.shell]]?.(this, t, d);
    if (B.glass >= 0.3 && MAT_NAME[B.shell] !== 'glass') STUFF.glass(this, t + 0.04, d); // (its windows)
    if (MAT_NAME[B.frame] === 'steel') STUFF.steel(this, t + 0.1, d); // (a steel frame's groan)
  }
  mechTechnique(id = '') {
    const T = TECH[id]; if (!T || !this.ok() || !this.allow(`mechTech.${id}`, 2)) return;
    T(this, this.ctx.currentTime, this.moveOut(id, 0.45, 0.8));
  }
  mechProp(verb = 'grab', prop = 'post') {
    const P = PROP[prop] ?? PROP.chunk; if (!this.ok() || !this.allow(`mechProp.${verb}`, 4)) return;
    const t = this.ctx.currentTime, d = this.moveOut(verb, 0.4, 0.6);
    if (verb === 'grab') { this.tone(t, 0.25, { f0: P.f, f1: P.f * 0.9, type: 'triangle', gain: 0.2, dest: d }); this.noise(t, 0.1, { type: 'bandpass', f0: P.band, q: 2, gain: 0.3, dest: d }); return; } // (taken up in the hand)
    if (verb === 'throw') { this.noise(t, 0.5, { type: 'bandpass', f0: 500, f1: 1800, q: 1, gain: 0.3, attack: 0.2, dest: d }); this.tone(t + 0.3, 0.6, { f0: P.f * 2, f1: P.f, gain: 0.03, dest: d }); return; } // (thrown, whirling off)
    STUFF[P.breaks]?.(this, t, d); // (broken as its stuff)
    if (P.water) this.noise(t + 0.05, 1.4, { type: 'lowpass', f0: 2500, f1: 500, gain: 0.35, attack: 0.05, dest: d }); // (the tank bursting: its water let go)
  }
  mechJoint(joint = '', to = 'fractured') {
    if (!this.ok() || !this.allow('mechJoint', 4)) return;
    const t = this.ctx.currentTime, snapped = to === 'snapped', head = snapped && joint === 'neck', d = this.moveOut(head ? 'head' : snapped ? 'snap' : 'strain', 0.4, 0.4);
    if (!snapped) { for (let i = 0; i < 5; i++) this.noise(t + i * 0.04, 0.03, { type: 'bandpass', f0: 500 + i * 120, q: 8, gain: 0.3, dest: d }); return; } // (steel creaking)
    this.noise(t, 0.05, { type: 'highpass', f0: 2500, gain: 0.5, dest: d }); this.noise(t + 0.02, 0.25, { type: 'bandpass', f0: 1800, f1: 600, q: 2, gain: 0.3, dest: d }); // (the tear)
    if (head) { this.tone(t + 0.1, 0.6, { f0: hz(55), f1: hz(67), type: 'triangle', gain: 0.12, dest: d }); for (let i = 0; i < 6; i++) this.tone(t + 0.2 + i * 0.09, 0.08, { f0: hz(64 + (i % 2) * 3), gain: 0.05 / (1 + i * 0.3), dest: d }); } // (boing: the head off on its spring)
  }
}
