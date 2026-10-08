// ---------------------------------------------------------------------------------------
// THE INNER REALM: the Spirit Garden entered (docs/plans/SPIRIT-GARDEN.md; the owner, 2026-10-07: "Use the Pneuka Jar as the character
// controller and have it hopping around with WASD, grabbable with the Godhand ... SMG from the get-go"). Entered at a Shrine, the
// Courier is not there: you are the Pneuka Jar, hopping round the planetoids (world/garden/planetbody.js, Galaxy's gravity), and you are the
// god hand over it, always (no ~): the cursor is the hand (world/garden/hand.js: grab and throw, pet and flick, the clay's four strokes,
// placing a feature in a plot: world/garden/plots.js); the planetoids' ground is clay (world/garden/clay.js), a pond's water runs where
// it was carved, and the spirits are raised by hand (world/garden/raising.js). A lotus flies the Jar to its neighbour. F at a place works it: the gate takes you back to the Shrine,
// the shed opens the Pneuka Box, a bed is planted or harvested, a pavilion's slot paid out, the furnace's press told of. The Figments
// you caught (creatures/bound.js) hop about the Grove. The first time in, you name it (Espada's names on offer; /realmname writes your
// own). Its look is Calissa's to come, its music Wanda's; the place is world/garden/place.js.
// Events: garden.enter { shrine }, garden.leave, garden.launch { from, to }, realm.name { realm }, each with `by`.
//
// Prior art: Super Mario Galaxy (the camera that keeps the planetoid's up, the launch star), Black & White (the hand as your whole
// presence, a creature picked up and thrown), Sonic Adventure's Chao Garden (a home between adventures where what you raised waits),
// Kingdom Hearts' Gummi hangar (a door out of the world you came from, and back to the same spot).
//
//   game.realm = new Realm(game, { god })   .enter(shrine)   .leave()   .active   .fixed(dt)   .update(dt)   .light()   .offer()   .parked()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GardenSite, MAX_BEDS, MAX_SLOTS } from './place.js';
import { PlanetBody } from './planetbody.js';
import { Clay } from './clay.js';
import { Plots, FEELING_COLOR } from './plots.js';
import { Raising, spiritName } from './raising.js';
import { GardenHand } from './hand.js';
import { Awaken, FOSSIL } from './awaken.js';
import { Tribulation } from './tribulation.js';
import { GardenCamera } from './gardencam.js';
import { Waterworks } from './waterworks.js';
import { Plants } from './plants.js';
import { Races } from './races.js';
import { Orbit } from './orbit.js';
import { Cascades } from './cascades.js';
import { GardenPress } from './press.js';
import { Daturas } from '../../vfx/datura.js';
import { JarHop } from '../../vfx/garden/jarhop.js';
import { buildFeature } from '../../vfx/garden/features.js';
import { Fossil } from '../../vfx/garden/fossil.js';
import { dressForm } from '../../vfx/garden/forms.js';
import { waterParked } from '../../vfx/garden/gardenwater.js';
import { GardenRain, rainParked } from '../../vfx/garden/gardenrain.js';
import { plantsParked } from '../../vfx/garden/gardenplants.js';
import { cascadeParked } from '../../vfx/garden/gardencascade.js';
import { phaseAt } from '../../progress/weather.js';
import { DAY_MS } from '../../core/calendar.js';
import { stream } from '../../core/rng.js';
import { sfx } from '../../audio/sfx.js';
import { OFFERED, gloss } from '../../npc/realmnames.js';
const _pm = new THREE.Matrix4(), _p = new THREE.Vector3(); // (the keepsake pots read for their song)
const simRand = stream('world/garden/realm'); // (the spirits' wandering: core/rng.js, the same twice)

const LOTUS = { r: 1.3, seconds: 2 };
const FEATURE_R = 3.2; // (F works a place within this of the Jar)
const JAR_LOST = 6; // (seconds a thrown Jar may stay off the ground before it is set down by the gate: GARDEN-SWEEP #5)
const GAME_HOUR = (DAY_MS ?? 3600000) / 24 / 1000; // (real seconds a game hour: a spirit rests a game hour at a time)
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();

export class Realm {
  constructor(game, { god }) {
    this.game = game; this.god = god;
    this.active = false; this.name = null; this.spirits = [];
    this.site = new GardenSite(game);
    // the planetoids' clay (world/garden/clay.js): each holds still round what stands on it; the bodies stand on what it is shaped to
    this.clays = Object.fromEntries(this.site.planets.map((P) => [P.id, new Clay(P)]));
    for (const P of this.site.planets) P.radiusAt = (d) => this.clays[P.id].radiusAt(d); // (Calissa's shape plus the clay: one ground)
    for (const f of this.site.features) this.clays[f.planet.id].keep(f.pos.clone().sub(f.planet.c), f.kind === 'athanor' ? 5.6 : f.kind === 'gate' || f.kind === 'shed' ? 4 : 3); // (the Athanor's bath, its ware ring and the press 4.35 m north: no stroke heaves them)
    for (const l of this.site.lotuses) this.clays[l.planet.id].keep(l.pos.clone().sub(l.planet.c), 2);
    this.plots = new Plots(game, this.site, this.clays);
    this.raising = new Raising(game, this);
    this.awaken = new Awaken(game, this); this.tribulation = new Tribulation(game, this);
    this.waterworks = new Waterworks(this); // (the water on the planetoids, its springs and drains: world/garden/waterworks.js)
    this.plants = new Plants(this); // (green that spreads over wet, fertile ground: world/garden/plants.js)
    this.races = new Races(this); // (tracks carved in one closed stroke, and the spirits' races on them: world/garden/races.js)
    this.orbit = new Orbit(this); // (the planetoids bought and set in the ring: world/garden/orbit.js)
    this.cascades = new Cascades(this); // (water spilling from one planetoid to the next: world/garden/cascades.js)
    this.press = new GardenPress(this, this.site.features.find((f) => f.kind === 'athanor')); // (Soul Alchemy's press on the Athanor: world/garden/press.js)
    this.plots.onSeed = (P, dir) => this.plants.seed(P, dir, 2.5);
    this.plots.wet = (p) => this.waterworks.feelingAt(p.planet, p.dir); // (water standing at a plot is a neighbour in its formation: item 11)
    this.hand = new GardenHand(this);
    this.water = new THREE.Group(); this.water.name = 'garden-water'; this.site.group.add(this.water);
    this.rainLook = new GardenRain({ sky: this.site.sky }); this.site.group.add(this.rainLook.group); // (Calissa's rain: each drop falls to its own planetoid's heart, vfx/garden/gardenrain.js)
    this.camera = new GardenCamera(this); // (its three views: behind the Jar, first person, overhead: world/garden/gardencam.js)
    this.restT = 0; this.workT = 0;
    // the spirits' stand-in body (Calissa's forms come in Round 3): one sphere, tinted by kind
    this.spiritGeo = new THREE.IcosahedronGeometry(0.42, 2);
    this.spiritMat = new THREE.MeshStandardMaterial({ color: 0xd9c19a, emissive: 0x6a4f30, emissiveIntensity: 0.25, roughness: 0.5, name: 'garden-spirit' });
    this.waiting = { clay: {}, ground: {} }; // (saved clay of planetoids not yet here: adopt takes it)
    game.save?.section('realm', { scope: 'player', version: 3,
      dump: () => ({ name: this.name, placed: this.plots.dump(), clay: { ...this.waiting.clay, ...Object.fromEntries(Object.entries(this.clays).map(([id, c]) => [id, c.dump()]).filter(([, a]) => a)) }, ground: { ...this.waiting.ground, ...Object.fromEntries(Object.entries(this.clays).map(([id, c]) => [id, c.dumpGround()]).filter(([, a]) => a)) }, awaken: this.awaken.dump(), water: this.waterworks.dump(), plants: this.plants.dump(), tracks: this.races.dump(), orbit: this.orbit.dump() }),
      load: (d) => {
        this.name = d?.name || null; this.awaken.load(d?.awaken); this.orbit.load(d?.orbit); // (the bought planetoids first: their clay loads next)
        for (const [id, c] of Object.entries(this.clays)) { c.load(d?.clay?.[id]); c.loadGround(d?.ground?.[id]); if (d?.clay?.[id] || d?.ground?.[id]) this.reshape(this.site.by[id], true); }
        // a planetoid that comes later (Myggdrasil's, given on entering): its clay kept until it is adopted (adopt), never dropped
        this.waiting = { clay: Object.fromEntries(Object.entries(d?.clay || {}).filter(([id]) => !this.clays[id])), ground: Object.fromEntries(Object.entries(d?.ground || {}).filter(([id]) => !this.clays[id])) };
        this.plots.load(d?.placed); this.plots.veins(); this.flowAll(); this.waterworks.load(d?.water); this.plants.load(d?.plants); this.races.load(d?.tracks);
      },
      reset: () => { this.name = null; this.waiting = { clay: {}, ground: {} }; this.plots.waiting = []; for (const [id, c] of Object.entries(this.clays)) { if (c.dump() || c.painted) { c.restore({ h: new Float32Array(c.h.length), g: new Uint8Array(c.ground.length), painted: 0 }); this.reshape(this.site.by[id], true); } } this.waterworks.load(null); this.plants.load(null); this.races.load(null); this.plots.veins(); } }); // (a wipe puts the ground back too: the clay, the paint, the water)
  }

  /** The garden's looks, parked for the warm-up (main.js compiles them with the rest). */
  parked() {
    const s = new THREE.Mesh(this.spiritGeo, this.spiritMat); this.site.group.add(s); this.parkedSpirit = s;
    // (Calissa's features and forms, one of each, and the brush's ring: compiled with the rest, then put away)
    this.parkedLooks = [];
    for (const id of ['terrace', 'pavilion', 'spiritHouse', 'pond', 'lantern', 'incense', 'stone', 'drillYard']) { const F = buildFeature(id, { feeling: 'wonder' }); F.set?.({ lit: true, active: true }); F.group.position.copy(this.site.by.dantian.c); this.site.group.add(F.group); this.parkedLooks.push(F.group); }
    { const F = new Fossil({ shape: 'spiral' }); F.awaken(0.5); F.update(0); F.group.position.copy(this.site.by.mulberryGrove.c); this.site.group.add(F.group); this.parkedLooks.push(F.group); } // (the fossil's crystal and cracking stone)
    this.site.tree.slots[0].pod.visible = true; this.tribulation.look.vortex.visible = true; // (a pod and the Heavenly Kiln's eye: put away by their own updates)
    { const T = plantsParked(); T.position.copy(this.site.by.dantian.c); this.site.group.add(T); this.parkedLooks.push(T); } // (the plants: Calissa's look, vfx/garden/gardenplants.js)
    { const L = cascadeParked(); this.site.group.add(L); this.parkedLooks.push(L); } // (a cascade's ribbon and spray: Calissa's, vfx/garden/gardencascade.js)
    { const W = waterParked(); W.position.copy(this.site.by.dantian.c); this.site.group.add(W); this.parkedLooks.push(W); } // (Calissa's water, one material for every planetoid's: vfx/garden/gardenwater.js)
    { const W = rainParked(); this.site.group.add(W); this.parkedLooks.push(W); } // (and her rain's streaks and rings)
    ['mirth', 'wonder', 'desire', 'grief', 'dread'].forEach((f, i) => { const m = new THREE.Mesh(this.spiritGeo, this.spiritMat.clone()); m.position.copy(this.site.by.dantian.c); dressForm(m, { feeling: f, side: ['law', 'neutral', 'chaos'][i % 3], size: 0.42 }); this.site.group.add(m); this.parkedLooks.push(m); });
    this.hand.brush.group.visible = true;
    this.plots.show(true); this.parkedThread = new THREE.Line(new THREE.BufferGeometry().setFromPoints([this.site.by.chimney.c, this.site.by.dantian.c]), this.plots.threadMat.gen); this.site.group.add(this.parkedThread);
    return [this.site.group];
  }

  // ------------------------------------------------------------------ in and out
  /** In at a Shrine: the Courier stays there; you are the Jar on the Dantian, by the gate. */
  enter(shrine) {
    const g = this.game, P = g.player;
    const no = this.active ? 'inside' : this.god?.active ? 'god' : g.death?.active ? 'death' : g.emocean?.stage.active ? 'stage' : g.seam?.busy ? 'busy' : null;
    if (no) { if (no !== 'inside') g.events?.emit('garden.refuse', { why: no, by: 'courier' }); return false; } // (a refusal is said: GARDEN-SWEEP #14)
    this.back = { shrine: shrine?.id || null, pos: P.pos.clone(), yaw: P.yaw };
    const go = () => {
      this.entering = false;
      this.lake = this.waterworks.feeling(); this.site.by.dantian?.look?.tint?.(FEELING_COLOR[this.lake]); // (the Dantian's lake is the draught you entered with: item 11)
      const sc = g.scene; this.kept = { up: g.camera.up.clone(), bg: sc.background?.isColor ? sc.background.clone() : null, fog: sc.fog?.color.clone(), fogD: sc.fog?.density }; // (what the garden changes of the world's, put back on leaving: casebook rule 30, GARDEN-SWEEP #12)
      const D = this.site.by.dantian, gate = this.site.features.find((f) => f.kind === 'gate'), start = this.gateStart();
      this.jarBody = new PlanetBody({ planets: this.site.planets, pos: start, radius: 0.5 });
      this.jarBody.planet = D; this.jarBody.up.copy(start).sub(D.c).normalize();
      this.camera.reset(this.jarBody.up, gate.pos.clone().sub(start));
      this.active = true; this.lotusLock = null;
      if (g.garden) g.garden.inside = true; // (Wanda's cue plays while it is: music/choose.js)
      this.site.sync({ beds: Math.min(MAX_BEDS, g.garden?.beds?.length || 0), slots: Math.min(MAX_SLOTS, g.garden?.slots?.length || 0) });
      this.site.show(true); if (this.parkedSpirit) this.parkedSpirit.visible = false; for (const o of this.parkedLooks || []) o.visible = false; if (this.parkedThread) this.parkedThread.visible = false; this.plots.show(this.hand.art === 'place');
      for (const c of g.spirits?.list || []) if (c.spirit?.from === 'garden') g.jellies.vanish(c, 'courier', 'home'); // (the one out with you comes home)
      for (const t of g.belt?.tools || []) if (t.wants) t.stow?.();
      g.character?.setHidden(true);
      document.exitPointerLock?.();
      g.hud?.el?.cross && (g.hud.el.cross.style.display = 'none');
      const cmp = document.getElementById('compass'); if (cmp) cmp.style.visibility = 'hidden'; // (the world's map has no say in here)
      const V = this.god?.jar; if (V?.group) { V.group.visible = true; V.group.scale.setScalar(1); this.jarLook ||= new JarHop(V.group, { fx: g.fx }); this.jarLook.base.setScalar(1); } // (Calissa's hop: crouch, stretch, land, trail; at full size whatever the god hand left: GARDEN-SWEEP #2)
      const H = this.god?.hand; if (H?.root) { H.root.visible = true; H.root.scale.setScalar(1); }
      this.hopOut();
      this.sync();
      this.awaken.visitors(); // (the wild ones the garden draws come by once a game day: progress/realm.js VISITORS)
      g.events?.emit('garden.enter', { shrine: this.back.shrine, by: 'courier' });
      this.namingDue = !this.name; // (asked once the seam is back up: a page opened under the cover held it black, GARDEN-SWEEP #1)
    };
    const took = g.seam ? g.seam.cross(go, { kind: 'shrine' }) : (go(), true);
    if (took && g.seam) this.entering = true;
    return !!took; // (a seam already under way refuses: said, not pretended, GARDEN-SWEEP #11)
  }
  /** Where the Jar is set down on the Dantian, a step from the gate (on entry, and when a throw has lost it). */
  gateStart() {
    const D = this.site.by.dantian, gate = this.site.features.find((f) => f.kind === 'gate');
    return D.c.clone().add(gate.pos.clone().sub(D.c).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.25).multiplyScalar(D.r + 0.5));
  }
  /** Out by the gate: the Courier where they stood at the Shrine. */
  leave() {
    const g = this.game;
    if (this.entering || (this.active && g.seam?.busy)) { this.leaveDue = true; return; } // (asked mid-fade: kept until the seam is done, GARDEN-SWEEP #11)
    if (!this.active) return;
    this.leaveDue = false;
    const go = () => {
      this.press?.leave('garden'); // (the press view ends with the garden: what waits in the mouth goes back)
      this.active = false; this.site.show(false); this.awaken.cancel(); // (a waking or a merging is put off, not spent)
      this.rainLook.clear(); // (no drop left hanging for the next visit: CASEBOOK rule 15)
      if (this.tribulation?.active) this.tribulation.cancel(); // (a tribulation is not carried out of the garden: its music and its storm end here, GARDEN-SWEEP #14)
      if (g.garden) g.garden.inside = false;
      for (const s of this.spirits) this.site.group.remove(s.mesh);
      this.raising.sparring = null; this.races.stop(); // (a spar or a race is left with the garden)
      if (this.hand.seed) { this.orbit.release(this.hand.seed.id, this.hand.seed.mesh.position); this.site.group.remove(this.hand.seed.mesh); this.hand.seed = null; } // (a seed paid for is never lost: it takes the nearest free slot)
      this.spirits = []; this.hand.held = null;
      const V = this.god?.jar; if (V?.group && !this.god.active) V.group.visible = false;
      const H = this.god?.hand; if (H?.root && !this.god.active) H.root.visible = false;
      g.character?.setHidden(false);
      const K = this.kept, sc = g.scene; if (K) { g.camera.up.copy(K.up); if (K.bg && sc.background?.isColor) sc.background.copy(K.bg); if (K.fog && sc.fog) { sc.fog.color.copy(K.fog); sc.fog.density = K.fogD; } this.kept = null; }
      g.hud?.el?.cross && (g.hud.el.cross.style.display = '');
      const cmp = document.getElementById('compass'); if (cmp) cmp.style.visibility = '';
      this.hand.letGo();
      const B = this.back; if (B && !g.places?.stand(B.pos, B.yaw)) g.course.teleport(B.pos, B.yaw);
      const O = this.raising.out; if (O) g.spirits?.summon(B?.pos || g.player.pos, { life: 1e6, power: 1 + (O.sp ? Math.max(...Object.values(O.sp.stats)) / 999 : 0), from: 'garden' }); // (one walks the world with you: creatures/spirits.js)
      if (g.input?.enabled) g.input.requestLock();
      g.events?.emit('garden.leave', { by: 'courier' });
    };
    if (g.seam) g.seam.cross(go, { kind: 'shrine' }); else go();
  }

  /** The first entry: the realm is named (a page of Espada's names; /realmname writes your own). */
  naming() {
    const g = this.game, menu = g.indexMenu || g.course?.menu; if (!menu?.showPage) return;
    menu.showPage('realm.name', (im, el) => {
      const box = el('div', 'rooms');
      for (const n of OFFERED) { const d = el('div', 'room', `<span class="n">❀</span><span><b>${n}</b><s>${gloss(n) || ''}</s></span>`); d.onclick = () => { this.setName(n); menu.close(); }; box.appendChild(d); }
      for (const e of [el('div', 'grp', 'NAME YOUR INNER REALM'), box, el('div', 'grp', 'or type /realmname and your own')]) im.appendChild(e);
    }, { title: 'YOUR INNER REALM', sub: 'click a name · F closes' });
  }
  setName(n) {
    const name = String(n || '').trim().slice(0, 24); if (!name) return;
    this.name = name; this.game.save?.dirty('realm');
    this.game.events?.emit('realm.name', { realm: name, by: 'courier' }); // (`realm`, not `name`: the bus writes the event's own name there)
  }

  /** The bound hop out of the Jar into the Grove (creatures/bound.js): one body each, wandering. */
  hopOut() {
    const G = this.site.by.mulberryGrove, list = this.game.bound?.list || [];
    list.forEach((e, i) => {
      if (this.awaken.inTree(e)) return; // (wound into a pod in the cocoon tree: world/garden/awaken.js)
      const a = (i / Math.max(1, list.length)) * Math.PI * 2, dir = new THREE.Vector3(Math.cos(a) * 0.6, 1, Math.sin(a) * 0.6).normalize();
      const mesh = new THREE.Mesh(this.spiritGeo, this.spiritMat); mesh.castShadow = true; mesh.scale.setScalar(0.8 + 0.25 * (e.cls || 0)); mesh.name = `spirit-${e.kind}`;
      this.site.group.add(mesh);
      const s = { e, mesh, body: new PlanetBody({ planets: this.site.planets, pos: G.c.clone().addScaledVector(dir, G.r + 1.5), radius: 0.4, hop: { short: [2.4, 1.6], long: [3, 2.4] } }), wish: new THREE.Vector3(), next: simRand() * 2 };
      this.raising.ready(e); this.raising.lookOf(s);
      this.spirits.push(s);
    });
  }

  // ------------------------------------------------------------------ every step
  /** Is the Jar's (or a spirit's) wish this step: WASD along the ground, as the camera faces. */
  wish(out) {
    const I = this.game.input, f = (I.isDown('KeyW') ? 1 : 0) - (I.isDown('KeyS') ? 1 : 0), r = (I.isDown('KeyD') ? 1 : 0) - (I.isDown('KeyA') ? 1 : 0);
    if (this.camera.view === 'overhead' || this.press?.viewing) return out.set(0, 0, 0); // (overhead, WASD pans the view; at the press, WASD leaves it: the Jar stands)
    const right = _w.crossVectors(this.camera.fwd, this.camera.up).normalize();
    out.copy(this.camera.fwd).multiplyScalar(f).addScaledVector(right, r);
    if (out.lengthSq() > 1) out.normalize();
    return out;
  }
  fixed(dt) {
    if (!this.active) return;
    const I = this.game.input, J = this.jarBody, typing = this.game.log?.typing;
    if (!J.held) J.step(dt, { move: typing ? null : this.wish(_v), jump: !typing && this.camera.view !== 'overhead' && I.isDown('Space') && J.grounded });
    if (!J.held && !J.flight && J.airT > JAR_LOST) { // (thrown off into the sky: set down by the gate, casebook rule 32, GARDEN-SWEEP #5)
      const D = this.site.by.dantian; J.pos.copy(this.gateStart()); J.vel.set(0, 0, 0); J.planet = D; J.up.copy(J.pos).sub(D.c).normalize(); J.airT = 0; J.grounded = false;
      this.game.events?.emit('garden.jar.back', { by: 'courier' });
    }
    for (const s of this.spirits) {
      if ((s.next -= dt) <= 0) { s.next = 1.2 + simRand() * 2.4; if (simRand() < 0.35) s.wish.set(0, 0, 0); else s.wish.set(simRand() - 0.5, simRand() - 0.5, simRand() - 0.5).normalize().multiplyScalar(0.7); }
      s.body.step(dt, { move: s.wish });
    }
    this.raising.fixed(dt); this.races.fixed(dt); // (a spar at the Chimney: world/garden/raising.js; a race: races.js)
    this.waterworks.fixed(dt); // (the water runs while you are in the garden: world/garden/waterworks.js)
  }

  update(dt) {
    if (!this.active) return;
    const g = this.game, I = g.input, P = g.player, J = this.jarBody;
    // the camera: behind the Jar, first person (Z), or overhead (`: the god hand's view here) (world/garden/gardencam.js)
    if (I.wasPressed('KeyZ') && !g.log?.typing && !I.isDown('ControlLeft') && !I.isDown('ControlRight')) this.camera.toggleFirst(); // (Ctrl+Z is the hand's undo)
    this.camera.update(dt);
    // the Courier's place is the Jar's while in here (the sun's shadow, the zones and the listener follow it)
    P.pos.copy(J.pos); P.prevPos?.copy(J.pos); P.renderPos?.copy(J.pos);
    this.placeJar(dt);
    this.hand.update(dt);
    const raw = g.rawDt ?? dt;
    this.site.update(raw, g.camera); this.plots.update(raw);
    for (const s of this.spirits) s.mesh.userData.form?.update?.(raw);
    // the spirits rest a game hour at a time, and work where they stand
    if ((this.restT += dt) >= GAME_HOUR) { this.raising.rest(Math.floor(this.restT / GAME_HOUR)); this.restT %= GAME_HOUR; }
    if ((this.workT += dt) >= 1) { this.workT = 0; this.raising.work(this.spirits, this.plots); }
    this.awaken.update(dt); this.tribulation.update(dt); this.waterworks.update(raw); this.cascades.update(raw); this.press.update(raw);
    this.rainLook.set({ amount: this.waterworks.rain(), feeling: this.waterworks.feeling() }); this.rainLook.update(raw, g.camera, this.site.planets, J.planet); // (the rain as it falls: your mental state, your draught)
    this.plants.tick(raw * 24000 / DAY_MS); this.plants.update(); // (a step of the green each game hour while you are here)
    this.moonflowers(raw);
    g.gardenMycelium?.update(raw); // (a spore bed's ring lit when it comes ready: Dovina's)
    this.hearMycelium(raw);
    // the lotuses: stood on, it flies (not again until it has stepped off the one it landed on)
    if (J.grounded && !J.held) {
      const L = this.site.lotuses.find((l) => l.pos.distanceTo(J.pos) < LOTUS.r + J.radius);
      if (L && L !== this.lotusLock) {
        const land = this.site.lotuses.find((l) => l.planet === L.toPlanet && l.toPlanet === L.planet);
        this.lotusLock = land; J.launch(J.surface(L.toPlanet, L.land.clone().sub(L.toPlanet.c), 0.1), LOTUS.seconds, L.toPlanet);
        sfx.jump?.(); g.events?.emit('garden.launch', { from: L.planet.id, to: L.toPlanet.id, by: 'courier' });
      } else if (!L && this.lotusLock && this.lotusLock.pos.distanceTo(J.pos) > LOTUS.r + 1.5) this.lotusLock = null;
    }
    // the spirits' bodies
    for (const s of this.spirits) { s.mesh.position.copy(s.body.pos); s.mesh.quaternion.setFromUnitVectors(_w.set(0, 1, 0), s.body.up); const sq = s.body.grounded ? 1 : 1.12; s.mesh.scale.y = s.mesh.scale.x * sq; }
    // F works the place the Jar stands at
    if (this.leaveDue && !g.seam?.busy) { this.leave(); return; }
    if (this.namingDue && !g.seam?.busy) { this.namingDue = false; this.naming(); }
    if (I.wasPressed('KeyF') && !g.log?.typing && g.interact?.cur?.id === 'garden') this.use(this.near);
  }

  /** The Jar's model where its body is, upright on the planetoid, turned the way it hops, squashed as it lands. */
  placeJar(dt) {
    const V = this.god?.jar, J = this.jarBody; if (!V?.group) return;
    const grp = V.group, up = this.camera.up.clone().lerp(J.up, 0.7).normalize(), fwd = J.forward.clone().projectOnPlane(up).normalize();
    grp.visible = !this.camera.hidesJar; // (shown every frame it is the Jar's, whatever put it away: the god hand's exit hid it, casebook 2026-10-07)
    if (fwd.lengthSq() < 0.5) fwd.copy(this.camera.fwd);
    _m.makeBasis(_w.crossVectors(up, fwd).normalize(), up, fwd); _q.setFromRotationMatrix(_m);
    grp.quaternion.slerp(_q, Math.min(1, dt * 12));
    grp.position.copy(J.pos).addScaledVector(J.up, -J.radius);
    const L = this.jarLook; if (!L) return;
    if (J.hops !== this.lastHops) { this.lastHops = J.hops; L.hop(); }
    if (J.grounded && !this.wasGrounded) L.land(this.fallV || 4);
    this.wasGrounded = J.grounded; this.fallV = -J.vel.dot(J.up);
    L.trail(!!J.flight || (!J.grounded && J.vel.length() > 9));
    L.update(this.game.rawDt ?? dt);
  }

  // ------------------------------------------------------------------ the clay and the water
  /** A planetoid's clay changed: its mesh follows (a few times a second while a stroke runs, at once when it ends), and the water. */
  /** The moonflower (item 14): a clump of Calissa's datura beside each stone lantern, riding on the lantern's own group (so a lantern moved
   *  takes it along), open by night and furled by day on the game clock, as slowly as the real flower. */
  moonflowers(raw) {
    if ((this.moonT = (this.moonT ?? 0) - raw) <= 0) {
      this.moonT = 1;
      for (const p of this.plots.plots) if (p.placed?.feature === 'lantern' && p.group && !p.group.userData.moon) p.group.userData.moon = new Daturas(this.game, [{ x: 0.9, z: 0.2, n: 6 }], { parent: p.group, heightAt: () => 0 });
    }
    const want = phaseAt() === 'night' ? 1 : 0; this.moonOpen = (this.moonOpen ?? want) + (want - (this.moonOpen ?? want)) * (1 - Math.exp(-raw * 0.4));
    for (const p of this.plots.plots) { const D = p.group?.userData.moon; if (D) D.u.uOpen.value = this.moonOpen; }
  }
  /** A bought planetoid taken in (world/garden/orbit.js): its clay, its plots, its veins and lotuses to its two nearest, its water. */
  adopt(P, plots) {
    this.clays[P.id] = new Clay(P); P.radiusAt = (d) => this.clays[P.id].radiusAt(d);
    const near = this.site.planets.filter((Q) => Q !== P && !Q.bought).sort((a, b) => a.c.distanceTo(P.c) - b.c.distanceTo(P.c)).slice(0, 2);
    for (const Q of near) { const V = this.site.link(P, Q); this.site.links?.push({ V, a: P, b: Q, ends: {} }); }
    for (const l of this.site.lotuses) if (l.planet === P) this.clays[P.id].keep(l.pos.clone().sub(P.c), 2);
    this.plots.addPlanet(P, plots); this.plots.placeWaiting?.(P); this.plots.veins(P);
    const W = this.waiting; if (W.clay[P.id] || W.ground[P.id]) { this.clays[P.id].load(W.clay[P.id]); this.clays[P.id].loadGround(W.ground[P.id]); delete W.clay[P.id]; delete W.ground[P.id]; this.reshape(P, true); }
    P.waterAt = (dir) => this.waterworks.waters[P.id]?.depthAt(dir) ?? 0;
    P.look.group.visible = true;
  }
  /** The mycelium heard where the Pneuka Jar stands (Wanda's sounds, audio/mycelium.js; the state Dovina's): a bed at work within 12 m
   *  (a phrase now and then: it limits itself), Myggdrasil's drone while on its planetoid, a keepsake pot's line within 4 m. */
  hearMycelium(raw) {
    const g = this.game, J = this.jarBody, M = g.gardenMycelium; if (!M || !J) return;
    if ((this.myceliumT = (this.myceliumT ?? 0) - raw) <= 0) {
      this.myceliumT = 0.5;
      const S = g.sporeBeds;
      for (const f of this.site.features) {
        if (f.kind !== 'sporebed' || !S) continue;
        const b = S.beds[f.bed], d = f.pos.distanceTo(J.pos);
        if (b?.strain && b.set && d < 12 && !S.ready(f.bed)) sfx.sporeBed?.(b.strain, d);
      }
      const pots = g.keepsakes?.pots || [], C = this.site.by.chimney;
      if (C && pots.length && J.planet === C) {
        let best = null, bd = 4;
        for (let i = 0; i < Math.min(pots.length, M.pots?.count ?? 0); i++) { M.pots.getMatrixAt(i, _pm); _p.setFromMatrixPosition(_pm); const d = _p.distanceTo(J.pos); if (d < bd) { bd = d; best = pots[i]; } }
        if (best) sfx.keepsakeSong?.({ feeling: best.feeling }, bd);
      }
    }
    if (M.planet && J.planet === M.planet) sfx.myggDrone?.(g.myggdrasil?.tincture ?? null, Math.max(0, J.pos.distanceTo(M.planet.c) - M.planet.r)); // (every frame: it fades by itself half a real second after the last)
  }

  /** The shed: the Pneuka Box (P opens it anywhere), and the next planetoid to buy (world/garden/orbit.js). */
  shed() {
    const g = this.game, menu = g.indexMenu || g.course?.menu; if (!menu?.showPage) { g.pneukaUI?.toggle(); return; }
    menu.showPage('garden.shed', (im, el) => {
      const rows = el('div', 'rooms'), row = (t, sub, run, dim = false) => { const d = el('div', 'room', `<span class="n">◇</span><span><b>${t}</b><s>${sub}</s></span>`); if (dim) d.style.opacity = 0.4; if (run) d.onclick = run; rows.appendChild(d); };
      row('The Pneuka Box', 'P opens it anywhere', () => { menu.close(); g.pneukaUI?.toggle(); });
      const N = this.orbit.next();
      if (N) { const why = () => { const r = this.orbit.buy(); if (r) g.log?.say('warn', r, { key: 'garden.buy', throttle: 1 }); else menu.close(); }; row(`A new planetoid: ${N.name}`, `${N.cubes} cubes · opens with the ${['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'][N.firing - 1]} Firing · its seed goes in your hand: let it go in the open sky`, why, (g.cubes?.balance ?? 0) < N.cubes); }
      im.appendChild(el('div', 'grp', 'THE SHED')); im.appendChild(rows);
    }, { title: 'THE SHED', sub: 'click to choose · F closes' });
  }
  /** A planetoid put back to its rest shape (the hand's Ctrl+Backspace, asked twice: free, item 30): its clay, its paint and its water. */
  resetPlanetoid(P) {
    const c = this.clays[P.id]; if (!c) return;
    this.hand.undos.push({ planet: P, h: c.snapshot() }); // (and a slip of the keys can be undone: Ctrl+Z)
    c.restore({ h: new Float32Array(c.h.length), g: new Uint8Array(c.ground.length), painted: 0 });
    this.waterworks.reset(P); this.plants.clear(P); this.races.clear(P); this.reshape(P, true); this.plots.veins(P); this.game.save?.dirty('realm');
    this.game.events?.emit('garden.reset', { planetoid: P.id, by: 'courier' });
  }
  reshape(P, now = false) {
    const clay = this.clays[P.id]; if (!clay) return;
    clay.toLook(P.look); // (every call: the look redraws only the cells that changed, well under a millisecond; casebook 2026-10-08)
    if (now) this.flowAll();
  }
  /** Every pond's water led downhill (world/garden/clay.js flow): a ribbon of Lachryma along the ground to where it pools. */
  flowAll() {
    for (const o of [...this.water.children]) { this.water.remove(o); o.geometry.dispose(); }
    for (const p of this.plots.plots) {
      if (p.placed?.feature !== 'pond') continue;
      const P = p.planet, clay = this.clays[P.id], dirs = clay.flow(p.dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0).cross(p.dir).normalize(), 1.9 / P.r));
      if (dirs.length < 3) continue;
      const pts = dirs.map((d) => P.c.clone().addScaledVector(d, clay.radiusAt(d) + 0.08));
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.min(64, pts.length * 2), 0.28, 5, false), this.site.mats.lake); tube.name = 'garden-stream';
      this.water.add(tube);
    }
  }
  /** The spirits' bodies laid again (one bound or two merged while you are in here). */
  respawn() { for (const s of this.spirits) this.site.group.remove(s.mesh); this.spirits = []; this.hopOut(); }
  /** Let one go for good (creatures/bound.js release): it hops off into the sky. */
  release(s) {
    const i = (this.game.bound?.list || []).indexOf(s.e); if (i < 0) return;
    this.game.bound.release(i);
    this.site.group.remove(s.mesh); this.spirits.splice(this.spirits.indexOf(s), 1);
  }

  // ------------------------------------------------------------------ the places
  /** The place the Jar stands at, for the chevron (courier/interact.js: game.interact.add('garden', ...)). */
  offer() {
    if (!this.active || this.jarBody?.held || this.jarBody?.flight || this.press?.viewing) return null;
    let best = null, bd = FEATURE_R;
    for (const f of this.site.features) { if (f.mesh && !f.mesh.visible) continue; const d = f.pos.distanceTo(this.jarBody.pos); if (d < bd) { bd = d; best = f; } }
    for (const s of this.spirits) { const d = s.body.pos.distanceTo(this.jarBody.pos); if (d < Math.min(bd, 2.5)) { bd = d; best = { kind: 'spirit', s, pos: s.body.pos }; } }
    this.near = best;
    if (!best) return null;
    const up = best.kind === 'spirit' ? best.s.body.up.clone() : best.pos.clone().sub(best.planet.c).normalize(); // (the place's own up on its planetoid, not the Jar's: GARDEN-SWEEP #4)
    return { pos: best.pos.clone().addScaledVector(up, 2.4), up, d: bd };
  }
  /** F at a place. */
  use(f) {
    const g = this.game, G = g.garden; if (!f) return;
    const say = (s) => g.log?.say('info', s, { key: 'garden.use', throttle: 1 }); // (a refusal at the point of use)
    switch (f.kind) {
      case 'gate': this.leave(); return;
      case 'spirit': this.raising.page(f.s); return;
      case 'shed': this.shed(); return;
      case 'bed': {
        const b = G?.beds?.[f.i];
        if (b && G.ripe(f.i)) G.harvest(f.i);
        else if (b) say(`The ${b.kind} bed is still growing.`);
        else { const k = g.pneuka?.slots.findIndex((x) => x?.id?.startsWith('mat.') && x.id !== 'mat.shard'); if (k >= 0) G.plant(f.i, k); else say('You have no material to plant.'); }
        break;
      }
      case 'slot': if (G?.accrued(f.i) > 0) G.collect(f.i); else say(G?.slots?.[f.i]?.enc ? 'Nothing has gathered here yet.' : 'No echo works this pavilion yet.'); break;
      case 'athanor': this.press.enter(); return; // (the bath: F opens the press view, world/garden/press.js)
      case 'hokora': this.athanor(); return; // (the plate shrine's own hokora on the Athanor's east shoulder: SOUL-ALCHEMY.md 4.2)
      case 'cocoon': this.cocoon(); return;
      case 'debugChest': g.debugChests?.give(f.kit); return; // (a debug chest: debug/debugchest.js)
      case 'tribulationMat': {
        if (this.tribulation.active) return;
        const n = this.tribulation.open();
        if (n == null) say('The Heavenly Kiln is closed. Fire your soul at the Athanor to open the next Firing.');
        else if (!this.tribulation.onMat()) say('Stand on the mat at the Chimney\'s foot.');
        else this.tribulation.begin();
        return;
      }
      default: if (g.gardenMycelium?.use(f)) return; break; // (a spore bed, Myggdrasil's roots: world/garden/mycelium.js, Dovina's)
    }
    this.sync();
  }
  /** The plate shrine (its hokora on the Athanor's shoulder): a photograph of a creature awakens a spirit of its kind (world/garden/awaken.js). */
  athanor() {
    const g = this.game, menu = g.indexMenu || g.course?.menu; if (!menu?.showPage) return;
    const open = () => menu.showPage('athanor', (im, el) => {
      const rows = el('div', 'rooms'), plates = this.awaken.plates();
      for (const p of plates) { const d = el('div', 'room', `<span class="n">◫</span><span><b>Awaken: ${p.kind}</b><s>a plate of ${p.stars} ${p.stars === 1 ? 'star' : 'stars'}</s></span>`); d.onclick = () => { this.awaken.plate(p.kind); open(); }; rows.appendChild(d); }
      if (!plates.length) rows.appendChild(el('div', 'room', '<span class="n">◫</span><span><b>No plate to awaken</b><s>photograph a creature with the Veritome, and its plate can wake one here</s></span>'));
      im.appendChild(el('div', 'grp', 'THE PLATE SHRINE')); im.appendChild(rows);
    }, { title: 'THE PLATE SHRINE', sub: 'click a plate · F closes' });
    open();
  }
  /** The cocoon tree: a fossil woken by the Awakening Song, or two spirits merged into one. */
  cocoon() {
    const g = this.game, menu = g.indexMenu || g.course?.menu, L = g.bound?.list || []; if (!menu?.showPage) return;
    let first = null;
    const open = () => menu.showPage('cocoon', (im, el) => {
      const rows = el('div', 'rooms'), btn = (t, sub, run) => { const d = el('div', 'room', `<span class="n">❦</span><span><b>${t}</b><s>${sub}</s></span>`); if (run) d.onclick = run; rows.appendChild(d); };
      const H = this.awaken.hatch;
      if (H) btn(H.kind === 'fossil' ? 'A fossil is waking' : 'Two are twining in the tree', 'listen, and watch the tree', null);
      else if (g.pneuka?.count(FOSSIL)) btn('Wake a fossil', 'the Awakening Song wakes what the Lachryma kept', () => { this.awaken.fossil(); menu.close(); });
      if (!H) for (const e of L) { this.raising.ready(e); btn(`${first === e ? '◆ ' : ''}${spiritName(e)}`, first ? (first === e ? 'chosen: choose another to merge with it' : 'merge with the chosen one') : 'choose two to merge into one', () => { if (!first) { first = e; open(); } else if (first !== e) { this.awaken.merge(first, e); menu.close(); } }); }
      if (L.length < 2) btn('Two spirits make one here', 'when you have two', null);
      im.appendChild(el('div', 'grp', 'THE COCOON TREE')); im.appendChild(rows);
    }, { title: 'THE COCOON TREE', sub: 'click · F closes' });
    open();
  }
  sync() { const G = this.game.garden; this.site.sync({ beds: Math.min(MAX_BEDS, G?.beds?.length || 0), slots: Math.min(MAX_SLOTS, G?.slots?.length || 0) }); }

  /** The garden's light over the world's (after the dunes and the hour have set theirs): a soft dream, no ground under it. */
  light() {
    if (!this.active) return;
    const sc = this.game.scene;
    const storm = this.tribulation?.active ? 1 : 0, ph = phaseAt(), S = this.site.sky; // (Calissa's sky: your draught's haze, the night's stars; the Heavenly Kiln darkens it)
    S.set({ draught: this.game.draughtHex ?? null, night: storm ? 1 : ph === 'night' ? 1 : ph === 'dusk' || ph === 'dawn' ? 0.45 : 0 });
    sc.fog.color.copy(S.fog); sc.fog.density = storm ? 0.012 : 0.003;
    if (sc.background?.isColor) sc.background.copy(S.fog);
  }
}
