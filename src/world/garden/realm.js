// ---------------------------------------------------------------------------------------
// THE INNER REALM: the Spirit Garden entered (docs/plans/SPIRIT-GARDEN.md; the owner, 2026-10-07: "Use the Pneuka Jar as the character
// controller and have it hopping around with WASD, grabbable with the Godhand ... SMG from the get-go"). Entered at a Shrine, the
// Courier is not there: you are the Pneuka Jar, hopping round the planetoids (world/garden/planetbody.js, Galaxy's gravity), and you are the
// god hand over it, always (no ~): the cursor is the hand. It picks up the Jar or a spirit and throws it; let go over another planetoid,
// what it held falls to that one. A lotus flies the Jar to its neighbour. F at a place works it: the gate takes you back to the Shrine,
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
import { GardenPlace, MAX_BEDS, MAX_SLOTS } from './place.js';
import { PlanetBody } from './planetbody.js';
import { stream } from '../../core/rng.js';
import { sfx } from '../../audio/sfx.js';
const simRand = stream('world/garden/realm'); // (the spirits' wandering: core/rng.js, the same twice)

/** Names on offer at the first entry (Espada's, docs/plans/SPIRIT-GARDEN.md section 6, from the neuralese Functions). */
export const REALM_NAMES = ['HEMA-LUNO', 'KITH-HEMA', 'LUNO-DEO', 'STIL-DEO', 'EZA-LON', 'ROMI-LON', 'SIVA-LUNO', 'HUSA-HEMA', 'AMI-HEMA', 'MOR-LUNO'];
const CAM = { dist: 10, min: 5, max: 22, pitch: 0.42, turn: 1.8, lookUp: 0.8 }; // (metres; radians; radians a real second for Q / E)
const HAND = { reach: 2.2, throwMax: 26, lift: 1.4 }; // (a thing within 2.2 m of the cursor's ray is grabbed; a throw is at most 26 m/s)
const LOTUS = { r: 1.3, seconds: 2 };
const FEATURE_R = 3.2; // (F works a place within this of the Jar)
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();

export class Realm {
  constructor(game, { god }) {
    this.game = game; this.god = god;
    this.active = false; this.name = null; this.spirits = [];
    this.place = new GardenPlace(game);
    this.cam = { fwd: new THREE.Vector3(0, 0, -1), up: new THREE.Vector3(0, 1, 0), dist: CAM.dist };
    this.hand = { held: null, dist: 0, at: new THREE.Vector3(), prev: new THREE.Vector3(), vel: new THREE.Vector3(), point: new THREE.Vector3() };
    // the spirits' stand-in body (Calissa's forms come in Round 3): one sphere, tinted by kind
    this.spiritGeo = new THREE.IcosahedronGeometry(0.42, 2);
    this.spiritMat = new THREE.MeshStandardMaterial({ color: 0xd9c19a, emissive: 0x6a4f30, emissiveIntensity: 0.25, roughness: 0.5, name: 'garden-spirit' });
    game.save?.section('realm', { scope: 'player', version: 1, dump: () => ({ name: this.name }), load: (d) => { this.name = d?.name || null; }, reset: () => { this.name = null; } });
  }

  /** The garden's looks, parked for the warm-up (main.js compiles them with the rest). */
  parked() { const s = new THREE.Mesh(this.spiritGeo, this.spiritMat); this.place.group.add(s); this.parkedSpirit = s; return [this.place.group]; }

  // ------------------------------------------------------------------ in and out
  /** In at a Shrine: the Courier stays there; you are the Jar on the Dantian, by the gate. */
  enter(shrine) {
    const g = this.game, P = g.player;
    if (this.active || this.god?.active || g.death?.active || g.emocean?.stage.active) return false;
    this.back = { shrine: shrine?.id || null, pos: P.pos.clone(), yaw: P.yaw };
    const go = () => {
      const D = this.place.by.dantian, gate = this.place.features.find((f) => f.kind === 'gate');
      const start = D.c.clone().add(gate.pos.clone().sub(D.c).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.25).multiplyScalar(D.r + 0.5));
      this.jar = new PlanetBody({ planets: this.place.planets, pos: start, radius: 0.5 });
      this.jar.planet = D; this.jar.up.copy(start).sub(D.c).normalize();
      this.cam.up.copy(this.jar.up); this.cam.fwd.copy(gate.pos).sub(start).projectOnPlane(this.cam.up).normalize(); this.cam.dist = CAM.dist;
      this.active = true; this.lotusLock = null;
      this.place.sync({ beds: Math.min(MAX_BEDS, g.garden?.beds?.length || 0), slots: Math.min(MAX_SLOTS, g.garden?.slots?.length || 0) });
      this.place.show(true); if (this.parkedSpirit) this.parkedSpirit.visible = false;
      for (const t of g.belt?.tools || []) if (t.wants) t.stow?.();
      g.character?.setHidden(true);
      document.exitPointerLock?.();
      g.hud?.el?.cross && (g.hud.el.cross.style.display = 'none');
      const V = this.god?.jar; if (V?.group) V.group.visible = true;
      const H = this.god?.hand; if (H?.root) { H.root.visible = true; H.root.scale.setScalar(1); }
      this.hopOut();
      this.sync();
      g.events?.emit('garden.enter', { shrine: this.back.shrine, by: 'courier' });
      if (!this.name) this.naming();
    };
    if (g.seam) g.seam.cross(go, { kind: 'shrine' }); else go();
    return true;
  }
  /** Out by the gate: the Courier where they stood at the Shrine. */
  leave() {
    const g = this.game; if (!this.active) return;
    const go = () => {
      this.active = false; this.place.show(false);
      for (const s of this.spirits) this.place.group.remove(s.mesh);
      this.spirits = []; this.hand.held = null;
      const V = this.god?.jar; if (V?.group && !this.god.active) V.group.visible = false;
      const H = this.god?.hand; if (H?.root && !this.god.active) H.root.visible = false;
      g.character?.setHidden(false);
      g.hud?.el?.cross && (g.hud.el.cross.style.display = '');
      const B = this.back; if (B && !g.places?.stand(B.pos, B.yaw)) g.course.teleport(B.pos, B.yaw);
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
      for (const n of REALM_NAMES) { const d = el('div', 'room', `<span class="n">❀</span><span><b>${n}</b></span>`); d.onclick = () => { this.setName(n); menu.close(); }; box.appendChild(d); }
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
    const G = this.place.by.grove, list = this.game.bound?.list || [];
    list.forEach((e, i) => {
      const a = (i / Math.max(1, list.length)) * Math.PI * 2, dir = new THREE.Vector3(Math.cos(a) * 0.6, 1, Math.sin(a) * 0.6).normalize();
      const mesh = new THREE.Mesh(this.spiritGeo, this.spiritMat); mesh.castShadow = true; mesh.scale.setScalar(0.8 + 0.25 * (e.cls || 0)); mesh.name = `spirit-${e.kind}`;
      this.place.group.add(mesh);
      this.spirits.push({ e, mesh, hop: new PlanetBody({ planets: this.place.planets, pos: G.c.clone().addScaledVector(dir, G.r + 1.5), radius: 0.4, hop: { short: [2.4, 1.6], long: [3, 2.4] } }), wish: new THREE.Vector3(), next: simRand() * 2 });
    });
  }

  // ------------------------------------------------------------------ every step
  /** Is the Jar's (or a spirit's) wish this step: WASD along the ground, as the camera faces. */
  wish(out) {
    const I = this.game.input, f = (I.isDown('KeyW') ? 1 : 0) - (I.isDown('KeyS') ? 1 : 0), r = (I.isDown('KeyD') ? 1 : 0) - (I.isDown('KeyA') ? 1 : 0);
    const right = _w.crossVectors(this.cam.fwd, this.cam.up).normalize();
    out.copy(this.cam.fwd).multiplyScalar(f).addScaledVector(right, r);
    if (out.lengthSq() > 1) out.normalize();
    return out;
  }
  fixed(dt) {
    if (!this.active) return;
    const I = this.game.input, J = this.jar, typing = this.game.log?.typing;
    if (!J.held) J.step(dt, { move: typing ? null : this.wish(_v), jump: !typing && I.isDown('Space') && J.grounded });
    for (const s of this.spirits) {
      if ((s.next -= dt) <= 0) { s.next = 1.2 + simRand() * 2.4; if (simRand() < 0.35) s.wish.set(0, 0, 0); else s.wish.set(simRand() - 0.5, simRand() - 0.5, simRand() - 0.5).normalize().multiplyScalar(0.7); }
      s.hop.step(dt, { move: s.wish });
    }
  }

  update(dt) {
    if (!this.active) return;
    const g = this.game, I = g.input, P = g.player, J = this.jar;
    // the camera: behind and over the Jar, its up the planetoid's (smoothed: a hop over a rim turns the world, not the head)
    this.cam.up.lerp(J.up, Math.min(1, dt * 4)).normalize();
    const turn = (I.isDown('KeyE') ? 1 : 0) - (I.isDown('KeyQ') ? 1 : 0);
    if (turn) this.cam.fwd.applyAxisAngle(this.cam.up, -turn * CAM.turn * dt);
    this.cam.fwd.projectOnPlane(this.cam.up).normalize(); // (carried along the surface: Galaxy's camera keeps its heading over the curve)
    if (I.wheel) { this.cam.dist = THREE.MathUtils.clamp(this.cam.dist * (1 + Math.sign(I.wheel) * 0.12), CAM.min, CAM.max); I.wheel = 0; }
    const cam = g.camera, focus = _v.copy(J.pos).addScaledVector(this.cam.up, CAM.lookUp);
    cam.position.copy(focus).addScaledVector(this.cam.fwd, -this.cam.dist * Math.cos(CAM.pitch)).addScaledVector(this.cam.up, this.cam.dist * Math.sin(CAM.pitch));
    cam.up.copy(this.cam.up); cam.lookAt(focus); cam.updateMatrixWorld();
    // the Courier's place is the Jar's while in here (the sun's shadow, the zones and the listener follow it)
    P.pos.copy(J.pos); P.prevPos?.copy(J.pos); P.renderPos?.copy(J.pos);
    this.placeJar(dt);
    this.updateHand(dt);
    // the lotuses: stood on, it flies (not again until it has stepped off the one it landed on)
    if (J.grounded && !J.held) {
      const L = this.place.lotuses.find((l) => l.pos.distanceTo(J.pos) < LOTUS.r + J.radius);
      if (L && L !== this.lotusLock) {
        const land = this.place.lotuses.find((l) => l.planet === L.toPlanet && l.toPlanet === L.planet);
        this.lotusLock = land; J.launch(J.surface(L.toPlanet, L.land.clone().sub(L.toPlanet.c), 0.1), LOTUS.seconds, L.toPlanet);
        sfx.jump?.(); g.events?.emit('garden.launch', { from: L.planet.id, to: L.toPlanet.id, by: 'courier' });
      } else if (!L && this.lotusLock && this.lotusLock.pos.distanceTo(J.pos) > LOTUS.r + 1.5) this.lotusLock = null;
    }
    // the spirits' bodies
    for (const s of this.spirits) { s.mesh.position.copy(s.hop.pos); s.mesh.quaternion.setFromUnitVectors(_w.set(0, 1, 0), s.hop.up); const sq = s.hop.grounded ? 1 : 1.12; s.mesh.scale.y = s.mesh.scale.x * sq; }
    // F works the place the Jar stands at
    if (I.wasPressed('KeyF') && !g.log?.typing && g.interact?.cur?.id === 'garden') this.use(this.near);
    if (I.wasPressed('KeyP') && !g.log?.typing && !g.pneukaUI?.open) g.pneukaUI?.toggle(); // (the box is yours anywhere, the shed's or not)
  }

  /** The Jar's model where its body is, upright on the planetoid, turned the way it hops, squashed as it lands. */
  placeJar(dt) {
    const V = this.god?.jar, J = this.jar; if (!V?.group) return;
    const grp = V.group, up = this.cam.up.clone().lerp(J.up, 0.7).normalize(), fwd = J.forward.clone().projectOnPlane(up).normalize();
    if (fwd.lengthSq() < 0.5) fwd.copy(this.cam.fwd);
    _m.makeBasis(_w.crossVectors(up, fwd).normalize(), up, fwd); _q.setFromRotationMatrix(_m);
    grp.quaternion.slerp(_q, Math.min(1, dt * 12));
    grp.position.copy(J.pos).addScaledVector(J.up, -J.radius);
    const s = J.grounded ? 1 : 1.08; grp.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
  }

  // ------------------------------------------------------------------ the hand
  /** The cursor's ray, where it meets a planetoid (or a point ahead), and what it would grab. */
  updateHand(dt) {
    const g = this.game, I = g.input, cam = g.camera, H = this.hand, god = this.god;
    const ndc = _v.set((I.mx / innerWidth) * 2 - 1, -(I.my / innerHeight) * 2 + 1, 0.5).unproject(cam), o = cam.position, d = ndc.sub(o).normalize();
    let tHit = Infinity;
    for (const Pl of this.place.planets) { const t = raySphere(o, d, Pl.c, Pl.r); if (t > 0 && t < tHit) tHit = t; }
    H.point.copy(o).addScaledVector(d, Number.isFinite(tHit) ? tHit : 30);
    if (I.mx >= 0 && I.wasPressed('Mouse0') && !H.held) { // (grab: the nearest of the Jar and the spirits to the ray)
      let best = null, bd = HAND.reach;
      for (const b of [{ hop: this.jar, kind: 'jar' }, ...this.spirits.map((s) => ({ hop: s.hop, kind: 'spirit', s }))]) {
        const t = Math.max(0, _w.copy(b.hop.pos).sub(o).dot(d)), near = _w.copy(o).addScaledVector(d, t).distanceTo(b.hop.pos);
        if (near < bd) { bd = near; best = b; }
      }
      if (best) { H.held = best; H.dist = o.distanceTo(best.hop.pos); best.hop.held = true; best.hop.flight = null; H.at.copy(best.hop.pos); H.prev.copy(H.at); sfx.grab?.(); }
    }
    if (H.held) {
      const want = _w.copy(o).addScaledVector(d, H.dist);
      H.prev.copy(H.at); H.at.lerp(want, 1 - Math.exp(-14 * dt));
      H.vel.copy(H.at).sub(H.prev).divideScalar(Math.max(dt, 1e-3));
      H.held.hop.pos.copy(H.at);
      if (!I.isDown('Mouse0')) { // (let go: thrown with the hand's speed)
        const v = H.vel.clampLength(0, HAND.throwMax); H.held.hop.release(v); H.held = null; sfx.toss?.();
      }
    }
    // the hand's model over what it holds or the ground under the cursor (the god hand's own: godhand.js, its fingers posed there)
    const hand = god?.hand; if (!hand?.root) return;
    const at = H.held ? H.at : H.point, n = this.place.planets.reduce((b, Pl) => (at.distanceTo(Pl.c) - Pl.r < at.distanceTo(b.c) - b.r ? Pl : b)).c;
    const up = _w.copy(at).sub(n).normalize(), fwd = this.cam.fwd.clone().projectOnPlane(up).normalize();
    const fingers = fwd.clone().multiplyScalar(Math.cos(0.5)).addScaledVector(up, -Math.sin(0.5)).normalize(), back = up.clone().addScaledVector(fingers, -up.dot(fingers)).normalize();
    _m.makeBasis(new THREE.Vector3().crossVectors(fingers, back).normalize(), fingers, back); hand.root.quaternion.setFromRotationMatrix(_m);
    hand.root.position.copy(at).addScaledVector(up, H.held ? 0.6 : HAND.lift).addScaledVector(fingers, -hand.tip.length());
    hand.grab += ((H.held ? 1 : 0.15) - hand.grab) * Math.min(1, dt * 12);
    god.t = (god.t || 0) + dt; god.poseHand?.(dt);
  }

  // ------------------------------------------------------------------ the places
  /** The place the Jar stands at, for the chevron (courier/interact.js: game.interact.add('garden', ...)). */
  offer() {
    if (!this.active || this.jar?.held || this.jar?.flight) return null;
    let best = null, bd = FEATURE_R;
    for (const f of this.place.features) { if (f.mesh && !f.mesh.visible) continue; const d = f.pos.distanceTo(this.jar.pos); if (d < bd) { bd = d; best = f; } }
    this.near = best;
    return best ? { pos: best.pos.clone().addScaledVector(this.jar.up, 2.4), d: bd } : null;
  }
  /** F at a place. */
  use(f) {
    const g = this.game, G = g.garden; if (!f) return;
    const say = (s) => g.log?.say('info', s, { key: 'garden.use', throttle: 1 }); // (a refusal at the point of use)
    switch (f.kind) {
      case 'gate': this.leave(); return;
      case 'shed': g.pneukaUI?.toggle(); return;
      case 'bed': {
        const b = G?.beds?.[f.i];
        if (b && G.ripe(f.i)) G.harvest(f.i);
        else if (b) say(`The ${b.kind} bed is still growing.`);
        else { const k = g.pneuka?.slots.findIndex((x) => x?.id?.startsWith('mat.') && x.id !== 'mat.shard'); if (k >= 0) G.plant(f.i, k); else say('You have no material to plant.'); }
        break;
      }
      case 'slot': if (G?.accrued(f.i) > 0) G.collect(f.i); else say(G?.slots?.[f.i]?.enc ? 'Nothing has gathered here yet.' : 'No echo works this pavilion yet.'); break;
      case 'furnace': say('The furnace waits for the press: soon.'); break;
      case 'cocoon': say('The cocoon tree is still growing.'); break;
      case 'peak': say('The Heavenly Kiln is not yet open.'); break;
      default: break;
    }
    this.sync();
  }
  sync() { const G = this.game.garden; this.place.sync({ beds: Math.min(MAX_BEDS, G?.beds?.length || 0), slots: Math.min(MAX_SLOTS, G?.slots?.length || 0) }); }

  /** The garden's light over the world's (after the dunes and the hour have set theirs): a soft dream, no ground under it. */
  light() {
    if (!this.active) return;
    const sc = this.game.scene;
    sc.fog.color.setHex(0xcfc6e8); sc.fog.density = 0.004;
    if (sc.background?.isColor) sc.background.setHex(0xb9b2e0);
  }
}

/** Where a ray (o, unit d) first meets a sphere, or -1. */
function raySphere(o, d, c, r) {
  const ox = o.x - c.x, oy = o.y - c.y, oz = o.z - c.z, b = ox * d.x + oy * d.y + oz * d.z, k = ox * ox + oy * oy + oz * oz - r * r, h = b * b - k;
  if (h < 0) return -1;
  const s = Math.sqrt(h), t = -b - s;
  return t > 0 ? t : -b + s;
}
