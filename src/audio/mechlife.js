// ---------------------------------------------------------------------------------------
// THE MECH'S LIFE HEARD (Petra's pilot, world/hangar/mechpilot.js, mechtech.js, giantmoves.js; Dovina's mech v2 and the mech night,
// MECHS.md 10, 11). The mount, the city and the ring are audio/mechs.js's, what breaks audio/mechmoves.js's; this is the frame moving and
// the giants and the challenges round it, each voice from a table keyed by the event's own field, never a switch on a kind.
//   A STEP        (mech.step { beat, legs, mass }) a footfall by its leg type (LEGS: the biped's heel and toe, the reverse joint's
//                 hop-skip, the tetra's four-beat patter, the tank's tread clank), heavier and lower with the frame's tonnes; a step
//                 'fought' against the stride grinds (sync slipping)
//   THE SKATE     (mech.skate { k }, mech.land { k }, mech.turn { k, pivot }) the heels' rails hissing on the ground, a landing's
//                 compression by its weight, a pivot's screech
//   BOOST / JUMP  (mech.boost { kind }, mech.jump { super }) the quick boost's puff and the assault boost's roar; a jump's thrusters,
//                 the Super Jump's charge let go
//   THE CABLE     (mech.cable { plugged, jolt }) a plug seated with a clunk and the battery's hum rising; pulled out; torn out with a
//                 spark and a jolt
//   ITS STATE     (mech.launch, mech.hurt { k }, mech.berserk, mech.fail { why }) the lift's klaxon and the shaft's rumble; a hit on
//                 the plates by its weight; berserk's growl and the generator over-revving; the power dying ('dry': winding down)
//   A SPECIAL     (mech.special { kind }) a part's special by its kind (KIND: scan's ping, ward's shell, hasten's whine, sunder's blade,
//                 pull's draw, gust's wind, quake's ground, blink's portal); the barrier (mech.barrier { neutralised }) pressed through
//   A GIANT       (giant.wake, giant.windup { move }, giant.stagger, giant.down, giant.call) its waking groan; a windup by its move
//                 (GIANT_MOVE: the swipe's and sweep's arm drawn back, the slam's breath, the burrow's sand sinking, the hurl's clod
//                 lifted, the wave's sand gathering); a stagger; its fall in straw or sand; the call at its post
//   A CHALLENGE   (challenge.start, challenge.score { what }, challenge.end { medal }) the starter's bell; a score's tick, the pins'
//                 clatter, a STRIKE's or SPARE's cheer; the medal's sting by its tier (none, bronze, silver, gold)
//   FIRE          (city.ignite, city.burn { k }, city.char, city.douse, city.out, mech.heat { k }) a building catching with a whoomph,
//                 its burning crackle by how much burns, the char's settling, water on it hissing, the fire out; the frame's heat
//                 ticking up through its plates
//
// Prior art: Armored Core's footfalls by leg type and its boost roar, Pacific Rim's and MechWarrior's weight, Titanfall's
// cable-and-reactor whine, Punch-Out and Wii Sports Bowling for the challenges' stings, Battlefield's and Red Faction's fire crackle.
//
//   sfx.mechStep(beat, legs, mass) .mechSkate(k) .mechLand(k) .mechTurn(k, pivot) .mechBoost(kind) .mechJump(sup) .mechCable(plugged, jolt)
//   .mechLaunch() .mechHurt(k) .mechBerserk() .mechFail(why) .mechSpecial(kind) .mechBarrier(neutralised)
//   .giantWake() .giantWindup(move) .giantStagger() .giantDown() .giantCall() .challengeStart() .challengeScore(id, what) .challengeEnd(medal)
//   .cityIgnite() .cityBurn(k) .cityChar() .cityDouse() .cityOut() .mechHeat(k)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** Each leg type's footfall (Dovina's LEG_TYPES ids): its knocks' offsets in real s, and the body's ring. */
const LEGS = {
  biped:   { hits: [0, 0.07], band: 500, ring: 1 },             // heel, then toe
  reverse: { hits: [0, 0.05, 0.11], band: 650, ring: 0.8 },     // a hop-skip on the bird's knee
  tetra:   { hits: [0, 0.06, 0.12, 0.18], band: 800, ring: 0.5 }, // four feet, a patter
  tank:    { hits: [0, 0.04, 0.08, 0.12, 0.16, 0.2], band: 1400, ring: 0.3, tread: true }, // the tread's links
};
/** Each special's kind (Dovina's PART_SPECIALS `kind`): its sound. */
const KIND = {
  scan:   (s, t, d) => [0, 0.3].forEach((x, i) => s.tone(t + x, 0.6, { f0: hz(88 - i * 5), gain: 0.12 / (1 + i), dest: d })),
  ward:   (s, t, d) => { s.tone(t, 0.9, { f0: hz(55), f1: hz(67), type: 'triangle', gain: 0.2, dest: d }); s.noise(t, 0.6, { type: 'bandpass', f0: 3000, q: 4, gain: 0.12, attack: 0.2, dest: d }); },
  hasten: (s, t, d) => { s.tone(t, 0.7, { f0: 300, f1: 1500, type: 'sawtooth', gain: 0.1, dest: d }); s.noise(t, 0.7, { type: 'bandpass', f0: 1500, f1: 4000, q: 2, gain: 0.2, dest: d }); },
  sunder: (s, t, d) => { s.noise(t, 0.35, { type: 'bandpass', f0: 800, f1: 3500, q: 2, gain: 0.35, dest: d }); s.tone(t + 0.3, 0.6, { f0: 140, f1: 70, gain: 0.3, dest: d }); },
  pull:   (s, t, d) => { s.tone(t, 0.8, { f0: 600, f1: 150, gain: 0.08, dest: d }); s.noise(t, 0.8, { type: 'lowpass', f0: 600, gain: 0.2, attack: 0.3, dest: d }); },
  gust:   (s, t, d) => s.noise(t, 1, { type: 'bandpass', f0: 600, f1: 1800, q: 0.7, gain: 0.35, attack: 0.15, dest: d }),
  quake:  (s, t, d) => { s.tone(t, 1.2, { f0: 45, f1: 30, gain: 0.5, dest: d }); s.noise(t, 1.2, { type: 'lowpass', f0: 300, gain: 0.35, attack: 0.1, dest: d }); },
  blink:  (s, t, d) => { s.tone(t, 0.3, { f0: hz(84), f1: hz(60), gain: 0.1, dest: d }); s.tone(t + 0.3, 0.3, { f0: hz(60), f1: hz(84), gain: 0.1, dest: d }); },
};
/** Each giant move's windup (giants.js `moves` ids). */
const GIANT_MOVE = {
  swipe:  (s, t, d) => s.noise(t, 0.9, { type: 'bandpass', f0: 300, f1: 700, q: 1, gain: 0.3, attack: 0.6, dest: d }),
  sweep:  (s, t, d) => s.noise(t, 1, { type: 'bandpass', f0: 250, f1: 600, q: 1, gain: 0.3, attack: 0.7, dest: d }),
  slam:   (s, t, d) => { s.noise(t, 1.5, { type: 'lowpass', f0: 500, gain: 0.25, attack: 1.2, dest: d }); s.tone(t, 1.5, { f0: 60, f1: 90, gain: 0.2, attack: 1, dest: d }); },
  burrow: (s, t, d) => { s.noise(t, 2.2, { type: 'lowpass', f0: 800, f1: 200, gain: 0.35, attack: 0.3, dest: d }); s.tone(t, 2.2, { f0: 50, f1: 35, gain: 0.3, dest: d }); },
  hurl:   (s, t, d) => { s.noise(t, 0.4, { type: 'lowpass', f0: 600, gain: 0.3, dest: d }); s.tone(t + 0.2, 1, { f0: 120, f1: 200, gain: 0.15, attack: 0.6, dest: d }); },
  wave:   (s, t, d) => s.noise(t, 1.4, { type: 'bandpass', f0: 400, f1: 1600, q: 0.8, gain: 0.3, attack: 1, dest: d }),
};
/** A challenge's medal sting (0 none .. 3 gold): its notes. */
const MEDAL = [[60, 58], [60, 64, 67], [60, 64, 67, 72], [60, 64, 67, 72, 76, 79]];
/** Each moment's level against the parry's clang (set by ear in the probe). */
const LEVEL = { step: 1.32, fought: 1, skate: 3.3, land: 1.9, turn: 6.3, 'boost.quick': 2, 'boost.assault': 1.75, jump: 2.1, cable: 2.6, jolt: 1,
  launch: 3.75, hurt: 6.5, berserk: 5, fail: 1.55, barrier: 1.9, giantWake: 2.2, giantStagger: 4.6, giantDown: 0.35, giantCall: 1,
  start: 1.85, pins: 1.7, tick: 4.5, medal: 2.35, ignite: 2.1, burn: 1.56, douse: 0.88, char: 2.5, out: 5.6, heat: 3.5,
  scan: 2.6, ward: 3, hasten: 3.9, sunder: 0.9, pull: 2.7, gust: 1.4, quake: 1.2, blink: 2.2,
  swipe: 3, sweep: 2.9, slam: 2.1, burrow: 1.1, hurl: 1.45, wave: 1.4 };

export class MechLifeSounds {
  lifeOut(key, gain, verb) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb)); setTimeout(() => d.disconnect(), 8000); return d; }

  mechStep(beat = 'beat', legs = 'biped', mass = 45) {
    if (!this.ok() || !this.allow('mechStep', 6)) return;
    const L = LEGS[legs] ?? LEGS.biped, w = clamp(mass / 45, 0.5, 2.5), t = this.ctx.currentTime, d = this.lifeOut(beat === 'fought' ? 'fought' : 'step', 0.35, 0.45);
    const f = 70 / Math.sqrt(w); // (heavier is lower)
    L.hits.forEach((x, i) => { const g = (i ? 0.6 : 1) * Math.min(1, 0.5 + w * 0.3); this.tone(t + x, 0.25 * L.ring + 0.1, { f0: f * (1 + i * 0.1), f1: f * 0.6, gain: 0.45 * g, dest: d }); this.noise(t + x, 0.05, { type: 'bandpass', f0: L.band, q: 1.5, gain: 0.25 * g, dest: d }); });
    if (L.tread) this.noise(t, 0.25, { type: 'bandpass', f0: 2200, q: 6, gain: 0.08, dest: d }); // (the links' rattle)
    if (beat === 'fought') this.noise(t + 0.02, 0.3, { type: 'bandpass', f0: 600, f1: 300, q: 6, gain: 0.25, dest: d }); // (against the stride: a grind)
  }
  mechSkate(k = 1) {
    if (!this.ok() || !this.allow('mechSkate', 3)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('skate', 0.3, 0.3), g = clamp(k, 0.2, 1);
    this.noise(t, 0.45, { type: 'bandpass', f0: 2600, f1: 2200, q: 3, gain: 0.25 * g, attack: 0.05, dest: d }); this.noise(t, 0.45, { type: 'lowpass', f0: 400, gain: 0.2 * g, dest: d });
  }
  mechLand(k = 1) {
    if (!this.ok() || !this.allow('mechLand', 3)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('land', 0.4, 0.5), g = clamp(k, 0.2, 1.5);
    this.tone(t, 0.6, { f0: 70, f1: 30, gain: 0.5 * g, dest: d }); this.noise(t, 0.12, { type: 'lowpass', f0: 1200, gain: 0.4 * g, dest: d });
    this.noise(t + 0.08, 0.35, { type: 'bandpass', f0: 500, f1: 250, q: 4, gain: 0.15 * g, dest: d }); // (the legs' compression)
  }
  mechTurn(k = 1, pivot = false) {
    if (!this.ok() || !this.allow('mechTurn', 3)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('turn', 0.3, 0.3), g = clamp(k, 0.2, 1);
    this.noise(t, pivot ? 0.5 : 0.25, { type: 'bandpass', f0: 3200, f1: 2400, q: 5, gain: 0.3 * g, dest: d }); // (the heels' screech)
  }
  mechBoost(kind = 'quick') {
    if (!this.ok() || !this.allow(`mechBoost.${kind}`, 4)) return;
    const t = this.ctx.currentTime, d = this.lifeOut(`boost.${kind}`, 0.4, 0.4);
    if (kind === 'assault') { this.noise(t, 1.2, { type: 'bandpass', f0: 400, f1: 900, q: 0.6, gain: 0.45, attack: 0.15, dest: d }); this.tone(t, 1.2, { f0: 55, f1: 75, type: 'sawtooth', gain: 0.05, dest: d }); return; } // (the roar)
    this.noise(t, 0.25, { type: 'bandpass', f0: 900, f1: 500, q: 0.8, gain: 0.45, dest: d }); this.tone(t, 0.15, { f0: 120, f1: 70, gain: 0.25, dest: d }); // (a puff)
  }
  mechJump(sup = false) {
    if (!this.ok() || !this.allow('mechJump', 2)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('jump', 0.4, 0.5);
    this.noise(t, sup ? 0.9 : 0.5, { type: 'bandpass', f0: 500, f1: sup ? 2400 : 1400, q: 0.8, gain: 0.4, dest: d }); this.tone(t, 0.3, { f0: 90, f1: 50, gain: 0.35, dest: d });
    if (sup) this.tone(t, 0.6, { f0: 200, f1: 900, type: 'sawtooth', gain: 0.03, dest: d }); // (the charge let go)
  }
  mechCable(plugged = true, jolt = false) {
    if (!this.ok() || !this.allow('mechCable', 2)) return;
    const t = this.ctx.currentTime, d = this.lifeOut(jolt ? 'jolt' : 'cable', 0.35, 0.3);
    if (plugged) { this.noise(t, 0.04, { type: 'lowpass', f0: 1500, gain: 0.5, dest: d }); this.tone(t, 0.12, { f0: 160, f1: 110, gain: 0.3, dest: d }); this.tone(t + 0.1, 1, { f0: 60, f1: 120, gain: 0.08, attack: 0.3, dest: d }); return; } // (seated; the battery's hum rising)
    this.noise(t, 0.05, { type: 'bandpass', f0: 1200, q: 2, gain: 0.35, dest: d }); this.tone(t, 0.5, { f0: 120, f1: 50, gain: 0.08, dest: d }); // (pulled; the hum falling)
    if (jolt) { this.noise(t, 0.12, { type: 'highpass', f0: 4000, gain: 0.5, dest: d }); for (let i = 0; i < 5; i++) this.noise(t + 0.03 + i * 0.04, 0.02, { type: 'highpass', f0: 5000, gain: 0.35, dest: d }); } // (torn out: sparks)
  }
  mechLaunch() {
    if (!this.ok() || !this.allow('mechLaunch', 0.5)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('launch', 0.35, 0.6);
    for (let i = 0; i < 3; i++) { this.tone(t + i * 0.5, 0.35, { f0: hz(69), type: 'square', gain: 0.03, dest: d }); this.tone(t + i * 0.5 + 0.2, 0.2, { f0: hz(64), type: 'square', gain: 0.03, dest: d }); } // (the klaxon)
    this.noise(t + 0.3, 2.5, { type: 'lowpass', f0: 300, f1: 600, gain: 0.3, attack: 0.6, dest: d }); // (the shaft)
  }
  mechHurt(k = 0.3) {
    if (!this.ok() || !this.allow('mechHurt', 5)) return;
    const t = this.ctx.currentTime, g = clamp(k * 2, 0.3, 1.2), d = this.lifeOut('hurt', 0.35, 0.4);
    this.noise(t, 0.08, { type: 'bandpass', f0: 1100, q: 1.2, gain: 0.45 * g, dest: d }); [210, 560, 990].forEach((f, i) => this.tone(t, 0.5 / (1 + i), { f0: f, gain: 0.08 * g / (1 + i), dest: d })); // (the plates rung)
  }
  mechBerserk() {
    if (!this.ok() || !this.allow('mechBerserk', 0.3)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('berserk', 0.4, 0.5);
    this.tone(t, 1.4, { f0: 55, f1: 45, type: 'sawtooth', gain: 0.08, dest: d }); this.tone(t, 1.4, { f0: 57, f1: 46, type: 'sawtooth', gain: 0.07, dest: d }); // (a growl, beating)
    this.tone(t + 0.2, 1.2, { f0: 400, f1: 2000, type: 'sawtooth', gain: 0.03, dest: d }); // (the generator over-revving)
  }
  mechFail(why = 'dry') {
    if (!this.ok() || !this.allow('mechFail', 0.5)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('fail', 0.4, 0.5);
    this.tone(t, 2, { f0: 300, f1: 40, type: 'sawtooth', gain: 0.05, dest: d }); this.tone(t, 2, { f0: 80, f1: 25, gain: 0.25, dest: d }); // (winding down)
    if (why !== 'dry') this.noise(t, 0.2, { type: 'lowpass', f0: 1500, gain: 0.4, dest: d });
  }
  mechSpecial(kind = 'scan') {
    const K = KIND[kind]; if (!K || !this.ok() || !this.allow(`mechSpecial.${kind}`, 2)) return;
    K(this, this.ctx.currentTime, this.lifeOut(kind, 0.4, 0.6));
  }
  mechBarrier(neutralised = false) {
    if (!this.ok() || !this.allow('mechBarrier', 2)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('barrier', 0.35, 0.5);
    if (!neutralised) { this.tone(t, 0.3, { f0: hz(79), gain: 0.08, dest: d }); this.noise(t, 0.1, { type: 'bandpass', f0: 4000, q: 3, gain: 0.2, dest: d }); return; } // (a blow turned on it)
    this.noise(t, 0.08, { type: 'highpass', f0: 3000, gain: 0.5, dest: d }); for (let i = 0; i < 8; i++) this.tone(t + 0.04 + Math.random() * 0.4, 0.15, { f0: 2000 + Math.random() * 3000, gain: 0.02, dest: d }); // (pressed through: it shatters)
  }
  giantWake() {
    if (!this.ok() || !this.allow('giantWake', 0.3)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('giantWake', 0.4, 0.7);
    this.tone(t, 2, { f0: 50, f1: 70, type: 'sawtooth', gain: 0.06, attack: 0.5, dest: d }); this.noise(t, 2, { type: 'lowpass', f0: 400, gain: 0.3, attack: 0.6, dest: d });
  }
  giantWindup(move = 'swipe') {
    const M = GIANT_MOVE[move]; if (!M || !this.ok() || !this.allow(`giantWindup.${move}`, 2)) return;
    M(this, this.ctx.currentTime, this.lifeOut(move, 0.35, 0.6));
  }
  giantStagger() {
    if (!this.ok() || !this.allow('giantStagger', 1)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('giantStagger', 0.35, 0.6);
    this.tone(t, 0.8, { f0: 90, f1: 50, type: 'sawtooth', gain: 0.05, dest: d }); this.noise(t, 0.6, { type: 'lowpass', f0: 600, gain: 0.3, dest: d });
  }
  giantDown() {
    if (!this.ok() || !this.allow('giantDown', 0.3)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('giantDown', 0.45, 0.8);
    this.tone(t, 1.5, { f0: 70, f1: 30, type: 'sawtooth', gain: 0.06, dest: d }); this.tone(t + 0.9, 1.4, { f0: 55, f1: 25, gain: 0.6, dest: d }); this.noise(t + 0.9, 2, { type: 'lowpass', f0: 900, f1: 200, gain: 0.5, dest: d }); // (its groan, its fall)
  }
  giantCall() {
    if (!this.ok() || !this.allow('giantCall', 0.5)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('giantCall', 0.35, 0.8);
    [0, 0.4].forEach((x, i) => this.tone(t + x, 0.9, { f0: hz(45 + i * 7), type: 'triangle', gain: 0.2, dest: d })); // (a horn at its post)
  }
  challengeStart() {
    if (!this.ok() || !this.allow('challengeStart', 1)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('start', 0.3, 0.5);
    [0, 0.25, 0.5].forEach((x, i) => this.tone(t + x, i === 2 ? 0.6 : 0.2, { f0: hz(i === 2 ? 84 : 72), gain: 0.12, dest: d })); // (ready, set, go)
  }
  challengeScore(id = '', what = '') {
    if (!this.ok() || !this.allow('challengeScore', 6)) return;
    const t = this.ctx.currentTime, w = String(what), d = this.lifeOut(id === 'bowling' || w === 'STRIKE' || w === 'SPARE' ? 'pins' : 'tick', 0.3, 0.4);
    if (id === 'bowling' && /^\d+ down$/.test(w)) { const n = +w.split(' ')[0] || 1; for (let i = 0; i < Math.min(10, n) * 2; i++) this.noise(t + Math.random() * 0.5, 0.03, { type: 'bandpass', f0: 1200 + Math.random() * 1800, q: 4, gain: 0.25, dest: d }); return; } // (the pins' clatter)
    if (w === 'STRIKE' || w === 'SPARE') { for (let i = 0; i < 20; i++) this.noise(t + Math.random() * 0.5, 0.03, { type: 'bandpass', f0: 1200 + Math.random() * 1800, q: 4, gain: 0.25, dest: d }); this.noise(t + 0.4, 1.5, { type: 'bandpass', f0: 1500, q: 0.5, gain: w === 'STRIKE' ? 0.25 : 0.15, attack: 0.2, dest: d }); return; } // (all ten, and the cheer)
    this.tone(t, 0.12, { f0: hz(84), gain: 0.08, dest: d }); this.tone(t + 0.07, 0.15, { f0: hz(88), gain: 0.06, dest: d }); // (a score ticked)
  }
  challengeEnd(medal = 0) {
    if (!this.ok() || !this.allow('challengeEnd', 0.5)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('medal', 0.35, 0.6), M = MEDAL[clamp(medal | 0, 0, 3)];
    M.forEach((m, i) => this.tone(t + i * 0.1, i === M.length - 1 ? 1 : 0.3, { f0: hz(m + 12), type: 'triangle', gain: 0.12, dest: d }));
  }
  cityIgnite() {
    if (!this.ok() || !this.allow('cityIgnite', 2)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('ignite', 0.35, 0.6);
    this.noise(t, 0.6, { type: 'lowpass', f0: 300, f1: 1500, gain: 0.5, attack: 0.05, dest: d }); this.tone(t, 0.5, { f0: 60, f1: 40, gain: 0.3, dest: d }); // (whoomph)
  }
  cityBurn(k = 0.5) {
    if (!this.ok() || !this.allow('cityBurn', 2)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('burn', 0.3, 0.6), n = Math.round(4 + clamp(k, 0, 1) * 14);
    this.noise(t, 0.9, { type: 'lowpass', f0: 700, gain: 0.15 + clamp(k, 0, 1) * 0.15, dest: d }); for (let i = 0; i < n; i++) this.noise(t + Math.random() * 0.9, 0.015, { type: 'bandpass', f0: 1500 + Math.random() * 3000, q: 3, gain: 0.3, dest: d }); // (the crackle)
  }
  cityChar() {
    if (!this.ok() || !this.allow('cityChar', 2)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('char', 0.3, 0.5);
    for (let i = 0; i < 6; i++) this.noise(t + i * 0.12, 0.06, { type: 'lowpass', f0: 900, gain: 0.2, dest: d }); // (the timbers settling)
  }
  cityDouse() {
    if (!this.ok() || !this.allow('cityDouse', 3)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('douse', 0.3, 0.5);
    this.noise(t, 1.2, { type: 'highpass', f0: 2500, f1: 1500, gain: 0.35, attack: 0.03, dest: d }); // (water on it)
  }
  cityOut() {
    if (!this.ok() || !this.allow('cityOut', 2)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('out', 0.3, 0.5);
    this.noise(t, 0.8, { type: 'lowpass', f0: 600, f1: 150, gain: 0.2, dest: d }); this.tone(t + 0.3, 0.5, { f0: 800, f1: 400, gain: 0.02, dest: d }); // (the last of it)
  }
  mechHeat(k = 0.5) {
    if (!this.ok() || !this.allow('mechHeat', 1)) return;
    const t = this.ctx.currentTime, d = this.lifeOut('heat', 0.3, 0.3), n = Math.round(2 + clamp(k, 0, 1) * 6);
    for (let i = 0; i < n; i++) this.tone(t + i * (0.18 - clamp(k, 0, 1) * 0.1), 0.04, { f0: 3000 + i * 50, gain: 0.04, dest: d }); // (the plates ticking as they heat)
  }
}
