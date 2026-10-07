// ---------------------------------------------------------------------------------------
// THE DREAMVANE'S BODY: a shepherd's crook of dark wood, as long as they are tall, that is four things at once (the concept art):
//   - the CROOK at its head, a hook of the staff bent back on itself;
//   - the DREAMCATCHER hung in the crook: a hoop with a web strung across it and a bead at its heart, feathers below. It is the dowsing
//     needle: it turns on its pin toward the Lachryma it hears, and its web glows with how loud (a line that glows with its load, not
//     a gauge);
//   - the PICK across the staff below the crook: a point on one side for crystal, a broad adze on the other;
//   - the TUNING FORK at its heel, two tines of white steel socketed in the butt like a ferrule, that comes out and is thrown.
// Modelled in the held-tool frame (tools/grip.js): +X up the staff from the right hand, +Z the palm's side; metres.
//
//   const m = new DreamvaneModel()   m.group   m.setDowse(yaw, pitch, glow)   m.setFork(inHeel)   m.headWorld(out)   m.forkMesh() (a copy to throw)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { addOutline } from '../../render/outline.js';

// (the crook with its dreamcatcher, and the tuning fork, at two and a half times their first size: the owner's note on v40)
export const HOOK = 2.5, FORK = 2.5;
const WOOD = 0x4a2f22, WOOD2 = 0x6a4430, STEEL = 0xe6e8ee, BRASS = 0xd9b048, WEB = 0xe8d7b6, FEATHER = 0xb49be6;

export class DreamvaneModel {
  constructor() {
    const g = (this.group = new THREE.Group());
    const m = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, flatShading: true, ...o });
    const wood = m(WOOD), wood2 = m(WOOD2), steel = m(STEEL, { metalness: 0.7, roughness: 0.25 }), brass = m(BRASS, { metalness: 0.6, roughness: 0.35 });
    this.webMat = new THREE.MeshBasicMaterial({ color: WEB, transparent: true, opacity: 0.85 });
    this.beadMat = new THREE.MeshStandardMaterial({ color: 0xcdb8f2, emissive: 0x6a4ab0, emissiveIntensity: 0.4, roughness: 0.2, flatShading: true });
    const X = (len, r0, r1, mat, at, seg = 6) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, seg), mat); c.rotation.z = -Math.PI / 2; c.position.x = at + len / 2; return c; };
    // the staff: from the heel (below the hands) to the crook
    g.add(X(1.42, 0.02, 0.017, wood, -0.42));
    // wraps of leather where the hands go, and brass bands
    g.add(X(0.16, 0.024, 0.024, wood2, -0.08)); g.add(X(0.14, 0.024, 0.024, wood2, -0.38));
    for (const at of [0.12, 0.62, 0.97]) g.add(X(0.018, 0.023, 0.023, brass, at, 8));
    // the crook: the staff bent back on itself at the top (a half torus, then a short drop), HOOK times the first size (the owner's
    // note: two and a half times bigger), the wood as thick as the staff's
    const crook = new THREE.Mesh(new THREE.TorusGeometry(0.11 * HOOK, 0.018, 6, 18, Math.PI * 1.15), wood);
    crook.position.set(1.0, 0.11 * HOOK, 0); crook.rotation.z = -Math.PI / 2 - 0.08; g.add(crook);
    const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.013, 0.09 * HOOK, 6), wood); drop.position.set(1.0 - 0.05 * HOOK, 0.225 * HOOK, 0); drop.rotation.z = 0.15; g.add(drop);
    // the dreamcatcher, hung in the crook on a pin: a hoop, a web, a bead, feathers (its own group: it turns), as much bigger
    const dc = (this.catcher = new THREE.Group()); dc.position.set(1.0, 0.11 * HOOK, 0); dc.scale.setScalar(HOOK); g.add(dc);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.006, 5, 18), brass); dc.add(hoop);
    const web = new THREE.Group(); dc.add(web);
    for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.002, 0.002), this.webMat); s.rotation.z = (i / 6) * Math.PI; web.add(s); }
    for (const r of [0.028, 0.052]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0015, 3, 12), this.webMat); web.add(t); }
    this.bead = new THREE.Mesh(new THREE.IcosahedronGeometry(0.014, 0), this.beadMat); dc.add(this.bead);
    const fm = m(FEATHER, { side: THREE.DoubleSide });
    for (const [x, len] of [[-0.03, 0.09], [0, 0.11], [0.03, 0.08]]) {
      const thread = new THREE.Mesh(new THREE.BoxGeometry(0.0015, 0.04, 0.0015), this.webMat); thread.position.set(x, -0.095, 0); dc.add(thread);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.018, len), fm); f.position.set(x, -0.115 - len / 2, 0); dc.add(f);
    }
    // the pick across the staff below the crook: a point toward +Y (it leads the blow), a broad adze toward -Y
    const pick = new THREE.Group(); pick.position.set(0.86, 0, 0); g.add(pick);
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.05), steel); pick.add(eye);
    const point = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.24, 4), steel); point.position.set(-0.03, 0.14, 0); point.rotation.z = 0.22; pick.add(point);
    const adze = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.07), steel); adze.position.set(-0.02, -0.09, 0); adze.rotation.z = -0.18; pick.add(adze);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.08), steel); edge.position.set(-0.04, -0.165, 0); pick.add(edge);
    // the tuning fork at the heel (its own group: it comes out)
    this.fork = this.makeFork(steel, brass); this.fork.position.set(-0.42, 0, 0); this.fork.scale.setScalar(FORK); g.add(this.fork);
    this.forkMats = { steel, brass };
    for (const o of [...g.children]) if (o.isMesh) addOutline(o);
    this.glow = 0;
  }

  /** The fork: a stem and two tines, pointing down the staff (-X) from where it sits. */
  makeFork(steel, brass) {
    const f = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), brass); stem.rotation.z = -Math.PI / 2; stem.position.x = -0.04; f.add(stem);
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 4, 10, Math.PI), steel); yoke.rotation.z = Math.PI / 2; yoke.position.x = -0.085; f.add(yoke);
    for (const y of [-0.018, 0.018]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.008, 0.006), steel); t.position.set(-0.165, y, 0); f.add(t); }
    return f;
  }
  /** A fork to throw (a copy of the one in the heel, the same look), its point toward its own -X. */
  forkMesh() { const f = this.makeFork(this.forkMats.steel, this.forkMats.brass); f.scale.setScalar(FORK); f.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return f; }

  /** The weather vane on the crook's head (vfx/vanemeter.js drives it): a brass rose of five petals, the feelings in their shown order,
   *  each faintly its colour; a needle turning about the staff to point at the mood, its head the mood's colour and its tail the agate's
   *  second; two streamers from the tail, longer with the mood's strength, slack in calm. Built on first use. */
  vane() {
    if (this.vaneG) return this.vaneG;
    const V = (this.vaneG = new THREE.Group()); V.position.set(1.0 + 0.11 * HOOK + 0.06, 0.11 * HOOK, 0); V.scale.setScalar(1.6); this.group.add(V);
    const brass = new THREE.MeshStandardMaterial({ name: 'vane-brass', color: BRASS, metalness: 0.7, roughness: 0.35 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.07, 6), brass); post.rotation.z = -Math.PI / 2; post.position.x = -0.02; V.add(post);
    this.petals = [];
    for (let i = 0; i < 5; i++) { // (the rose: five petals round the post, in the plane across the staff)
      const a = (i / 5) * Math.PI * 2, m = new THREE.MeshStandardMaterial({ name: 'vane-petal', color: 0x8a6a3a, metalness: 0.5, roughness: 0.4, emissive: 0x000000 });
      const pet = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.035, 4), m); pet.position.set(0.012, Math.cos(a) * 0.05, Math.sin(a) * 0.05); pet.rotation.x = a; V.add(pet); this.petals.push(m);
    }
    const N = (this.vaneNeedle = new THREE.Group()); N.position.x = 0.03; V.add(N);
    this.vaneHead = new THREE.MeshStandardMaterial({ name: 'vane-head', color: 0xffffff, roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.25 });
    this.vaneTail = new THREE.MeshStandardMaterial({ name: 'vane-tail', color: 0xffffff, roughness: 0.5, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0.15 });
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.13, 0.005), brass); N.add(shaft);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.04, 4), this.vaneHead); head.position.y = 0.085; N.add(head);
    const fin = new THREE.Mesh(new THREE.PlaneGeometry(0.004, 0.045), this.vaneTail); fin.scale.x = 8; fin.position.y = -0.06; N.add(fin);
    this.streamers = [-1, 1].map((sd) => { // (ribbons from the tail: their length is the strength, scaled at runtime)
      const g2 = new THREE.PlaneGeometry(0.012, 0.2, 1, 6); g2.translate(0, -0.1, 0);
      const st = new THREE.Mesh(g2, this.vaneTail); st.position.set(0, -0.08, sd * 0.008); N.add(st); return st;
    });
    return V;
  }

  /** The vane: the needle's turn about the staff, its head's and tail's colours, the mood's strength (0 calm); `t` for the streamers' flutter. */
  setVane(angle, head, tail, strength, t = 0, petals = null) {
    this.vane();
    this.vaneNeedle.rotation.x = angle;
    this.vaneHead.color.copy(head); this.vaneHead.emissive.copy(head);
    this.vaneTail.color.copy(tail); this.vaneTail.emissive.copy(tail);
    this.streamers.forEach((st, i) => { st.scale.y = 0.15 + 1.1 * strength; st.rotation.x = (1 - strength) * 0.15 + Math.sin(t * (5 + 4 * strength) + i * 1.7) * 0.35 * strength; st.rotation.z = (i ? 1 : -1) * (0.2 + 0.5 * strength); });
    if (petals) this.petals.forEach((m, i) => m.color.setHex(petals[i]).multiplyScalar(0.6));
  }

  /** The needle: the catcher turned toward what it hears (in the staff's frame: yaw about the staff, pitch across it), its web lit. */
  setDowse(yaw, pitch, glow) {
    this.catcher.rotation.set(yaw, 0, pitch);
    this.glow = glow;
    this.webMat.color.setHex(WEB).lerp(new THREE.Color(0xfff1d6), glow);
    this.beadMat.emissiveIntensity = 0.4 + 2.2 * glow;
  }
  setFork(inHeel) { this.fork.visible = inHeel; }
  headWorld(out = new THREE.Vector3()) { return out.set(1.0, 0.11 * HOOK, 0).applyMatrix4(this.group.matrixWorld); }
  pickWorld(out = new THREE.Vector3()) { return out.set(0.83, 0.26, 0).applyMatrix4(this.group.matrixWorld); }
}
