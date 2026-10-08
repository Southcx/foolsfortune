// ---------------------------------------------------------------------------------------
// THE OSTRACA, IN THE WORLD: where the sixteen inscribed potsherds lie and how each is found, and the two stelae (the numbers and the
// split of the words: progress/ostraca.js, Dovina's; the words and their English: npc/neuralese.js, Espada's; the look: a stand-in for
// Calissa's vfx/ostracon.js). The words go to the places in the Functions' own order: six BURIED in the Dunes (a weak signature the
// dowse finds, the sand shivering over it like a veiled crystal's; the pick's ground strike or the Dreamquake lifts it), six in the
// Great Dunemaw's FORGOTTEN POTS (a floor draws from a deck: a quarter a floor, certain within eight; broken, the pot leaves the sherd),
// two leaning at the feet of the ruins' COLUMNS in plain sight, two under the workshop's PLASTER (a patch that a blow knocks away). A
// sherd lying loose is taken with F: `ostracon.find`, once a word for good (the ledger keeps it; a new build starts over). The STELAE:
// one in the great cavern's upper ring (on the bowl, so it goes with it), one in the SEALED ROOM by the ruins, whose door the
// Dreamvane's fork opens when it rings in it; F reads one: `stele.read`. A find glosses its word into the Crib Sheet (the knack:
// progress/knacks.js), which `gloss(word)` here shows beside a word.
//
// Prior art: La-Mulana's tablets and Heaven's Vault's inscriptions (words found in the world, read in context), Spelunky's buried
// treasure and its hidden rooms, Zelda's bombable walls (the plaster: a cracked patch a blow opens), Greek ostraca (sherds as paper).
//
//   const O = new Ostraca(game)   O.update(raw)   O.reveal(pos, r) -> n   O.forFloor(finds)   O.drop(word, at, place)   O.near(P)
//   O.take(s)   O.gloss(word) -> 'SIVA (drink)' | 'SIVA'   O.glossLine(words) -> text   (the interact chevron's id: 'ostracon')
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { OSTRACA, STELAE, WORD_SPLIT, DUNEMAW_DECK } from '../progress/ostraca.js';
import { FUNCTIONS } from '../tools/veritome/mind/functions.js';
import * as NEURALESE from '../npc/neuralese.js';
import { tag, register, unregister } from '../core/tags.js';
import { DUNE, OASIS, BARRIER } from './dunes/dunes.js';
import { RAPIER, GROUPS } from '../core/physics.js';
import { ROOM } from './level.js';
import { bearingXZ } from './well/bowl.js';
import { ARENA } from '../progress/combat/dunemaw.js';
import { stream } from '../core/rng.js';
const simRand = stream('world/ostraca'); // (the simulation's chance: core/rng.js)

const REACH = 2.2, SEALED = { a: 2.25, r: OASIS.flat + 46, half: 2.2, h: 3 }; // (the sealed room: its bearing and distance from the oasis, its half-width and height)
const _v = new THREE.Vector3(), _d = new THREE.Vector3(0, -1, 0);

export class Ostraca {
  constructor(game) {
    this.game = game; this.loose = []; this.buried = []; this.patches = []; this.stelae = [];
    this.s = { dry: 0, revealed: [], opened: false };
    game.save?.section('ostraca', { scope: 'player', version: 1, dump: () => this.s, load: (d) => { this.s = { dry: 0, revealed: [], opened: false, ...(d || {}) }; }, reset: () => { this.s = { dry: 0, revealed: [], opened: false }; } });
    const words = WORD_SPLIT(FUNCTIONS).ostraca, P = OSTRACA.places;
    let i = 0; this.at = {};
    for (const place of ['dunes', 'dunemaw', 'ruins', 'workshop']) { this.at[place] = words.slice(i, i + P[place].n); i += P[place].n; }
    this.mat = new THREE.MeshStandardMaterial({ color: 0xc98a5a, roughness: 0.85, name: 'ostracon' }); // (a stand-in: Calissa's black-figure sherd, vfx/ostracon.js)
    this.ink = new THREE.MeshBasicMaterial({ color: 0x1b1210, name: 'ostracon-ink' });
    this.geo = new THREE.CylinderGeometry(0.16, 0.2, 0.035, 6); this.stoneGeo = new THREE.BoxGeometry(0.9, 1.6, 0.25);
    this.stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.95, name: 'stele' });
    this.built = { dunes: false, workshop: false };
  }

  found(word) { return (this.game.ledger?.get(`ostracon.${word}`) || 0) > 0; }

  // ---------------------------------------------------------------- the places
  /** Once the Dunes and the workshop stand: the buried six, the columns' two, the plaster's two, the sealed room. */
  build() {
    const g = this.game, D = g.dunes;
    if (!this.built.dunes && D?.heightAt && D.columns?.length) {
      this.built.dunes = true;
      const rnd = (() => { let s = 7171717; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
      const R0 = OASIS.flat + 24, R1 = BARRIER - 60;
      for (const word of this.at.dunes) {
        const a = rnd() * Math.PI * 2, r = R0 + rnd() * (R1 - R0), x = DUNE.x + Math.cos(a) * r, z = DUNE.z + Math.sin(a) * r;
        const ground = new THREE.Vector3(x, D.heightAt(x, z), z);
        if (this.found(word)) continue;
        if (this.s.revealed.includes(word)) { this.drop(word, ground, 'dunes', false); continue; }
        const b = { word, ground, veiled: true };
        b.sig = g.signatures?.add({ pos: ground.clone().setY(ground.y - 0.3), strength: 2.5, kind: 'ostracon', ref: b, alive: () => b.veiled && !this.found(word) });
        this.buried.push(b);
      }
      // the columns' two: leaning at the feet of two of the broken columns, out where the ruins are thickest
      const cols = D.columns.slice(0, 2);
      this.at.ruins.forEach((word, k) => { const c = cols[k]; if (c && !this.found(word)) this.drop(word, c.clone().add(_v.set(1.1, 0.05, 0.4)), 'ruins', false); });
      this.sealedRoom();
    }
    if (!this.built.workshop && g.level) {
      this.built.workshop = true;
      const { W, D: Dd } = ROOM;
      // two cracked patches of plaster on the ground floor's old walls (the west and the north): a blow knocks one away
      [[new THREE.Vector3(-W + 0.03, 1.15, 6), Math.PI / 2], [new THREE.Vector3(-6, 0.95, -Dd + 0.03), 0]].forEach(([pos, yaw], k) => {
        const word = this.at.workshop[k]; if (!word || this.found(word)) return;
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.04), new THREE.MeshStandardMaterial({ color: 0xe6dccb, roughness: 1, name: 'plaster-patch' }));
        m.position.copy(pos); m.rotation.y = yaw; g.scene.add(m);
        const p = { word, pos: pos.clone(), r: 0.6, mesh: m, broken: false };
        p.struck = () => { if (p.broken) return; p.broken = true; m.removeFromParent(); m.geometry.dispose(); m.material.dispose(); unregister(p); this.drop(word, pos.clone().setY(0.05).add(_v.set(Math.sin(yaw) * 0.5, 0, Math.cos(yaw) * 0.5)), 'workshop'); g.events?.emit('plaster.break', { by: 'courier' }); };
        tag(p, 'struckable', 'static'); register(p); this.patches.push(p);
      });
    }
  }

  /** The sealed room by the ruins: four walls of the ruins' stone, a slab for a door that the fork's ring opens, the stele inside. */
  sealedRoom() {
    const g = this.game, D = g.dunes, W = g.physics.world, S = SEALED;
    const x = DUNE.x + Math.cos(S.a) * S.r, z = DUNE.z + Math.sin(S.a) * S.r, y = D.heightAt(x, z) - 0.2, c = new THREE.Vector3(x, y, z);
    const grp = this.room = new THREE.Group(); grp.name = 'sealed-room'; g.scene.add(grp);
    const box = (sx, sy, sz, px, py, pz) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), this.stoneMat); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; grp.add(m);
      const b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(c.x + px, c.y + py, c.z + pz));
      return { m, b, col: W.createCollider(RAPIER.ColliderDesc.cuboid(sx / 2, sy / 2, sz / 2).setCollisionGroups(GROUPS.static), b) };
    };
    grp.position.copy(c);
    const h = S.h, s = S.half, t = 0.4, sink = 2.2, wh = h + sink, wy = (h - sink) / 2; // (the walls go 2.2 m into the sand: it slopes under the room, up to 1.9 m, and no gap opens under a wall)
    box(s * 2 + t, wh, t, 0, wy, -s); box(t, wh, s * 2, -s, wy, 0); box(t, wh, s * 2, s, wy, 0); box(s * 2 + t, t, s * 2 + t, 0, h + t / 2, 0);
    box(s - 0.6, wh, t, -(s + 0.6) / 2, wy, s); box(s - 0.6, wh, t, (s + 0.6) / 2, wy, s); // (the front, either side of the door)
    const door = box(1.3, wh, t * 0.8, 0, wy, s);
    door.ent = { type: 'sealed', ring: () => this.open() }; g.physics.register(door.col, door.ent);
    this.door = door;
    if (this.s.opened) this.open(true);
    { const at = c.clone().add(_v.set(0, 0, -s + 0.6)); at.y = D.heightAt(at.x, at.z) - 0.15; this.addStele(STELAE.find((x2) => x2.id === 'stele.sealed'), at, grp); } // (on the sand where it stands)
  }
  /** The fork rang in the door: the slab sinks into the sand (once, kept). */
  open(quiet = false) {
    const g = this.game, d = this.door; if (!d || d.open) return;
    d.open = true; d.m.visible = false; g.physics.world.removeCollider(d.col, true);
    if (!quiet) { this.s.opened = true; g.save?.dirty('ostraca'); g.events?.emit('sealed.open', { by: 'courier' }); }
  }

  addStele(def, pos, parent = null) {
    if (!def) return;
    const m = new THREE.Mesh(this.stoneGeo, this.stoneMat); m.position.copy(pos).setY(pos.y + 0.8); m.name = def.id;
    (parent ? parent : this.game.scene).add(m); if (parent) parent.worldToLocal(m.position);
    this.stelae.push({ def, pos: pos.clone(), mesh: m });
  }

  /** The great cavern's stele, on the bowl (it goes when the bowl does), the first frame the cavern stands. */
  cavern() {
    const C = this.game.well?.cur; if (!C?.isCavern || C.ostracaStele) return;
    C.ostracaStele = true;
    const B = C.bowl, d = bearingXZ(222, 26.5), at = B.world(d.x, ARENA.upper.y, d.z);
    this.addStele(STELAE.find((x) => x.id === 'stele.ring'), at, B.group);
  }

  // ---------------------------------------------------------------- the finds
  /** The pick or the Dreamquake came down near `pos`: the buried within `r` rise out of the sand. */
  reveal(pos, r) {
    let n = 0;
    for (const b of this.buried) {
      if (!b.veiled || b.ground.distanceTo(pos) > r) continue;
      b.veiled = false; n++; this.game.signatures?.remove?.(b.sig);
      this.s.revealed.push(b.word); this.game.save?.dirty('ostraca');
      this.drop(b.word, b.ground.clone(), 'dunes');
    }
    this.buried = this.buried.filter((b) => b.veiled);
    return n;
  }

  /** A floor of the Great Dunemaw: the deck draws, and a pot that holds nothing else may hold the next of its words. */
  forFloor(finds) {
    const word = this.at.dunemaw.find((w) => !this.found(w)); if (!word) return;
    const r = finds.r, sure = this.s.dry + 1 >= DUNEMAW_DECK.certainWithin;
    if (!sure && r() >= DUNEMAW_DECK.chance) { this.s.dry++; this.game.save?.dirty('ostraca'); return; }
    const pots = finds.pots.filter((p) => !p.def.find); if (!pots.length) return;
    pots[r.int(pots.length)].def.ostracon = word; this.s.dry = 0; this.game.save?.dirty('ostraca');
  }

  /** A sherd lying loose at `at`, for F. */
  drop(word, at, place, rise = true) {
    if (this.found(word) || this.loose.some((s) => s.word === word)) return;
    { const down = this.game.physics?.raycast?.(_v.copy(at).setY(at.y + 1), _d, 4, this.game.player?.collider, undefined, (k) => !k.isSensor()); if (down) at = down.point.clone(); } // (it lies on whatever is under it: a pot breaks mid-height, a column's foot is not the sand beside it)
    const g = this.game, m = new THREE.Mesh(this.geo, this.mat); m.position.copy(at).setY(at.y + 0.06); m.rotation.set(0.25, simRand() * 6.28, 0.15); m.castShadow = true; m.name = `ostracon-${word}`;
    g.scene.add(m);
    const s = { word, place, pos: at.clone(), mesh: m, t: rise ? 0 : 1 };
    s.sig = g.signatures?.add({ pos: at.clone(), strength: 2.5, kind: 'ostracon', ref: s, alive: () => !this.found(word) });
    this.loose.push(s);
    if (rise) g.glyphs?.pop?.('ask', at.clone().setY(at.y + 0.6), { color: 0xc98a5a, size: 0.45, life: 1.2 });
    return s;
  }

  /** What F would take or read here: a loose sherd, or a stele not yet read. */
  near(P) {
    let best = null;
    const consider = (pos, ref, lift) => { const d = Math.hypot(pos.x - P.pos.x, pos.z - P.pos.z); if (d < REACH && Math.abs(pos.y - P.pos.y) < 2.2 && (!best || d < best.d)) best = { pos: pos.clone().setY(pos.y + lift), d, ref }; };
    for (const s of this.loose) consider(s.pos, s, 0.7);
    for (const st of this.stelae) if (!(this.game.ledger?.get(st.def.id) > 0)) consider(st.pos, st, 1.9);
    return best;
  }

  take(ref) {
    const g = this.game;
    if (ref?.def) { // a stele: read
      const words = ref.def.words, gloss = words.map((w) => NEURALESE.glossOf(w));
      g.events?.emit('stele.read', { stele: ref.def.id, text: NEURALESE.STELE_TEXT?.[ref.def.id] ?? null, words, gloss, by: 'courier' });
      return;
    }
    const s = ref; if (!s || !this.loose.includes(s)) return;
    this.loose.splice(this.loose.indexOf(s), 1);
    s.mesh.removeFromParent(); g.signatures?.remove?.(s.sig);
    g.fx?.absorbSparkle?.(s.pos.clone().setY(s.pos.y + 0.3));
    g.events?.emit('ostracon.find', { word: s.word, gloss: NEURALESE.glossOf(s.word), place: s.place, by: 'courier' });
  }

  // ---------------------------------------------------------------- the Crib Sheet
  glossed(word) {
    const w = String(word).toLowerCase(), L = this.game.ledger;
    const named = String(this.game.realm?.name || '').toLowerCase().split(/[^a-z]+/).includes(w); // (a word of the realm's name you chose: Espada, 2026-10-08)
    return this.found(w) || named || STELAE.some((st) => st.words.includes(w) && L?.get(st.id) > 0) || !!this.game.macros?.known?.has?.(w); // (a Function learned: seen a mind do it)
  }
  /** A word as the Crib Sheet shows it: its English beside it when glossed and the knack is on; bare otherwise. */
  gloss(word) {
    const W = String(word).toUpperCase(), en = NEURALESE.glossOf(W);
    return en && this.game.knacks?.on('crib') && this.glossed(W) ? `${W} (${en})` : W;
  }
  glossLine(words) { return words.map((w) => this.gloss(w)).join(' '); }

  update() {
    this.build(); this.cavern();
    const g = this.game, P = g.player, it = g.interact?.cur;
    if (it?.id === 'ostracon' && P?.peekLatch?.('KeyF') && !g.god?.controlling) { P.latch('KeyF'); this.take(it.ref); }
    for (const s of this.loose) if (s.t < 1) { s.t = Math.min(1, s.t + 0.02); s.mesh.position.y = s.pos.y + 0.06 - 0.4 * (1 - s.t); } // (it rises out of the sand)
  }
}
