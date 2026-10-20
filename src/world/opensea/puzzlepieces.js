// ---------------------------------------------------------------------------------------
// THE ISLETS' PUZZLES AND CACHES, IN THE WORLD (docs/plans/OPEN-SEA.md section 12; the rules: progress/opensea/isletpuzzles.js). The
// sea's deal laid on its islets as placeholders Calissa dresses later, and played:
//   a PAIR's carved thing on each of its two islets (a shape in a colour): come within PAIR.seen of both, in either order, and it is a
//     find to report (`sea.pair.half`, then `sea.pair`);
//   a LINE-UP's spot on an islet's shore (a flat stone) and its four arcs hung over the water, each at its distance and scaled to it, so
//     from the spot's eye they close into one ring: stand on the spot and look along it and it is a fix and the squares round charted
//     (`sea.lineup`);
//   an ECHO's two stones: the singing one sings its phrase (in the Crucibelle's own voice and the degrees' colours, a note glyph a
//     note) when you come near; the listening one has a socket a note, lit as the Crucibelle's notes played near it match the phrase
//     from its start; the whole phrase and its cache rises and pays (`sea.echo.hear`, `sea.echo`, `sea.dig`);
//   a CACHE buried in an islet's sand, nothing on it but a signature of kind `chest` (core/signatures.js), so the Dreamvane's dowse is
//     the metal detector: attuned to chests it sings faster as you face it, and on the spot the sand shivers (the dowse's own mark).
//     Dug with the pick or the Dreamquake (`dreamvane.strike` calls `unearth`) or F with the Dreamvane in hand: it pays its tier once
//     (`sea.dig`). A dug cache leaves its opened box.
// The state (seen, solved, heard, dug) is the room's (`room.puzzle`, kept in its save section).
//
// Prior art: as the rules' module: Islands of Insight, The Witness's anamorphic lines, Ocarina of Time's songs, Ratchet & Clank's
// metal detector, Pokemon's Dowsing Machine, Animal Crossing's fossils.
//
//   new PuzzlePieces(room)   .update(dt)   .interact(P) -> bool (F)   .unearth(point, r) -> n   .deal
//   events (each with `by`): sea.pair.half { id, shape }, sea.pair { id, shape, tier }, sea.lineup { id, charted }, sea.echo.hear { id },
//   sea.echo { id }, sea.dig { id, tier, cubes, how }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { dealPuzzles, phraseHeard, cachePay, PAIR, LINEUP, ECHO, CACHE } from '../../progress/opensea/isletpuzzles.js';
import { neighbours } from '../../progress/opensea/seagrid.js';
import { takeFix } from '../../progress/opensea/seatrip.js';
import { today } from '../../core/calendar.js';
import { seeded } from '../../core/rng.js';
import { SCALE, DEGREE_COLOR } from '../../tools/crucibelle/songs.js';
import { sfx } from '../../audio/sfx.js';

const EYE = 1.6, SING_AGAIN = 8; // (the Courier's eye over the spot, m; real s before the singing stone sings again to one still near)
const mat = (c, extra = {}) => new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...extra });
const SHAPE = {
  urn: () => new THREE.CylinderGeometry(0.35, 0.5, 1.2, 8), fish: () => new THREE.ConeGeometry(0.45, 1.4, 4), bell: () => new THREE.ConeGeometry(0.6, 1.1, 10, 1, true),
  wheel: () => new THREE.TorusGeometry(0.55, 0.14, 6, 12), hand: () => new THREE.BoxGeometry(0.5, 1.3, 0.25), moon: () => new THREE.TorusGeometry(0.55, 0.16, 6, 12, Math.PI * 1.3),
};
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _m = new THREE.Matrix4(), Y = new THREE.Vector3(0, 1, 0);

export class PuzzlePieces {
  constructor(room) {
    this.room = room; this.game = room.game; this.played = []; this.singing = null;
    const islets = room.props.islets, byId = this.islet = new Map(islets.map((i) => [i.feature.id, i]));
    this.deal = dealPuzzles(islets.map((i) => ({ id: i.feature.id, kit: i.islet.kit, tier: i.islet.tier })), room.seed);
    const add = (m) => { m.userData.zone = 'opensea'; this.game.scene.add(m); return m; };
    const spot = (isl, salt, frac = 0.55) => { const r = seeded((salt * 2654435761) >>> 0); for (let k = 0; k < 8; k++) { const a = r() * 6.283, d = isl.r * frac * Math.sqrt(r()), p = isl.pos.clone().add(_a.set(Math.sin(a) * d, 0, Math.cos(a) * d)); if (p.distanceTo(isl.secret.pos) > 3) return p; } return isl.pos.clone(); };
    let salt = room.seed % 100000;
    // the pairs: the same carving on two islets
    this.pairs = this.deal.pairs.map((p) => ({ ...p, at: [p.a, p.b].map((id) => { const isl = byId.get(id), pos = spot(isl, ++salt); const m = add(new THREE.Mesh(SHAPE[p.shape](), mat(p.colour))); m.position.copy(pos).setY(isl.top + 0.75); return { islet: id, pos }; }) }));
    // the line-ups: a spot on the shore, four arcs over the water that make one ring from its eye
    this.lineups = this.deal.lineups.map((L) => {
      const isl = byId.get(L.islet), out = _a.set(Math.sin(L.bearing), 0, Math.cos(L.bearing));
      const at = isl.pos.clone().addScaledVector(out, Math.max(1, isl.r - 2)).setY(isl.top);
      const dir = new THREE.Vector3(Math.sin(L.bearing) * Math.cos(L.pitch), Math.sin(L.pitch), Math.cos(L.bearing) * Math.cos(L.pitch));
      const eye = at.clone().setY(at.y + EYE), x = new THREE.Vector3().crossVectors(Y, dir).normalize(), y = new THREE.Vector3().crossVectors(dir, x);
      const q = new THREE.Quaternion().setFromRotationMatrix(_m.makeBasis(x, y, dir)), arcs = [];
      const stone = add(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 0.2, 10), mat(0xc8beb0))); stone.position.copy(at).setY(at.y + 0.1);
      L.dists.forEach((d, k) => {
        const rho = d * Math.tan(L.size), grp = new THREE.Group(), arc = new THREE.Mesh(new THREE.TorusGeometry(rho, d * 0.006, 5, 16, Math.PI / 2), mat(0xd8cfc0, { emissive: 0x000000 }));
        arc.rotation.z = k * Math.PI / 2; grp.add(arc); grp.quaternion.copy(q); grp.position.copy(eye).addScaledVector(dir, d); add(grp); arcs.push(arc);
      });
      const far = eye.clone().addScaledVector(dir, L.dists[L.dists.length - 1]);
      return { ...L, at, eye, dir, far, arcs };
    });
    // the echoes: a singing stone and a listening one with a socket a note
    this.echoes = this.deal.echoes.map((E) => {
      const stoneAt = (id) => { const isl = byId.get(id), p = spot(isl, ++salt, 0.4); const m = add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.6), mat(0x8a8478))); m.position.copy(p).setY(isl.top + 1.1); m.rotation.y = salt; return { islet: id, pos: p.setY(isl.top), mesh: m }; };
      const hear = stoneAt(E.hear), play = stoneAt(E.play);
      const sockets = E.phrase.map((_, k) => { const s = add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), mat(0x2a2620, { emissive: 0x000000 }))); s.position.copy(play.mesh.position).add(_a.set((k - (E.phrase.length - 1) / 2) * 0.3, 1.25, 0).applyAxisAngle(Y, play.mesh.rotation.y)); return s; });
      return { ...E, hearAt: hear, playAt: play, sockets, sungT: 0 };
    });
    // the caches: buried, a signature for the dowse
    this.caches = this.deal.caches.map((c) => {
      const isl = byId.get(c.islet), ground = spot(isl, ++salt, 0.6).setY(isl.top), C = { ...c, ground, box: null, get veiled() { return !room.puzzle.dug.has(c.id); } }; // (veiled: what the dowse's mark asks)
      C.sig = this.game.signatures?.add({ pos: ground.clone().setY(ground.y - 0.3), strength: 3, kind: 'chest', ref: C, alive: () => this.diggable(C) });
      return C;
    });
    this.sync();
    // the Dreamvane's ground strike or Dreamquake (dreamvane.js emits it; F digs too, and never misses)
    this.game.events?.on?.('dreamvane.strike', (e) => { if (room.active && e?.at) this.unearth(_b.fromArray(e.at), e.r ?? 3.2, 'pick'); });
    this.game.events?.on?.('crucibelle.note', (e) => this.note(e));
  }

  // ---------------------------------------------------------------- each frame, on foot
  update(dt) {
    const R = this.room, P = this.game.player, S = R.puzzle; if (R.sailing) return;
    for (const p of this.pairs) for (const h of p.at) {
      const key = `${p.id}@${h.islet}`; if (S.seen.has(key) || h.pos.distanceTo(_a.copy(P.pos).setY(h.pos.y)) > PAIR.seen) continue;
      S.seen.add(key); R.dirty();
      if (p.at.every((x) => S.seen.has(`${p.id}@${x.islet}`)) && !S.solved.has(p.id)) {
        S.solved.add(p.id); R.voyage.found.set(p.id, { tier: PAIR.tier, kind: 'pair', gameDay: today() });
        this.emit('sea.pair', { id: p.id, shape: p.shape, tier: PAIR.tier });
      } else this.emit('sea.pair.half', { id: p.id, shape: p.shape });
    }
    for (const L of this.lineups) if (!S.solved.has(L.id) && Math.hypot(P.pos.x - L.at.x, P.pos.z - L.at.z) < LINEUP.stand) this.lookAlong(L);
    for (const E of this.echoes) {
      if ((E.sungT -= dt) > 0 || E.hearAt.pos.distanceTo(_a.copy(P.pos).setY(E.hearAt.pos.y)) > ECHO.hear) continue;
      E.sungT = SING_AGAIN; this.sing(E);
    }
    if (this.singing) this.singTick(dt);
  }

  lookAlong(L) {
    const cam = this.game.camera; if (!cam) return;
    const fwd = cam.getWorldDirection(_a), to = _b.copy(L.far).sub(cam.position).normalize();
    if (fwd.angleTo(to) > LINEUP.aim) return;
    const R = this.room, v = R.voyage, S = R.puzzle; S.solved.add(L.id);
    this.sync();
    R.emit(takeFix(v, 'landmark'));
    const sq = R.squareAt(L.at); let n = 0;
    if (sq) for (const s of [sq, ...neighbours(R.grid, sq)]) if (!v.charted.has(s.id)) { v.charted.add(s.id); n++; }
    R.dirty(); this.emit('sea.lineup', { id: L.id, charted: n });
  }

  // ---------------------------------------------------------------- the echo
  sing(E) {
    const S = this.room.puzzle;
    if (!S.heard.has(E.id)) { S.heard.add(E.id); this.room.dirty(); this.emit('sea.echo.hear', { id: E.id, notes: E.phrase.length }); }
    this.singing = { E, k: 0, t: 0.3 };
  }
  singTick(dt) {
    const s = this.singing; if ((s.t -= dt) > 0) return;
    const d = s.E.phrase[s.k], top = s.E.hearAt.mesh.position.clone().setY(s.E.hearAt.mesh.position.y + 1.5);
    this.game.glyphs?.pop?.('note', top, { color: DEGREE_COLOR[d - 1], size: 0.5, life: 0.9 });
    const C = this.game.crucibelle, midi = (C?.grid?.().root ?? 63) + SCALE[d - 1]; try { if (sfx.stoneSing) sfx.stoneSing(midi, 0.5); else C?.voice?.(midi, 0.5); } catch { /* the stone is silent where it has no voice */ } // (Wanda's stone voice, the bell's pitches; the bell's own until hers reaches main)
    s.t = ECHO.gap; if (++s.k >= s.E.phrase.length) this.singing = null;
  }
  note(e) {
    const R = this.room, P = this.game.player; if (!R.active || R.sailing || !e?.degree) return;
    const E = this.echoes.find((x) => !R.puzzle.solved.has(x.id) && x.playAt.pos.distanceTo(_a.copy(P.pos).setY(x.playAt.pos.y)) < ECHO.listen); if (!E) return;
    this.played.push(e.degree); if (this.played.length > 8) this.played.shift();
    const n = phraseHeard(E.phrase, this.played); this.light(E, n);
    if (n < E.phrase.length) return;
    this.played = []; R.puzzle.solved.add(E.id); R.dirty();
    this.emit('sea.echo', { id: E.id });
    const C = this.caches.find((c) => c.sealed === E.id); if (C) this.dig(C, 'echo');
  }
  light(E, n) { E.sockets.forEach((s, k) => s.material.emissive.setHex(k < n ? DEGREE_COLOR[E.phrase[k] - 1] : 0x000000)); }

  // ---------------------------------------------------------------- the caches
  /** F on foot: with the Dreamvane in hand, on a cache's spot, dig it (the pick's strike does the same once it calls `unearth`). */
  interact(P) {
    if (this.game.belt?.inHand?.id !== 'dreamvane') return false;
    const C = this.caches.find((c) => this.diggable(c) && Math.hypot(P.pos.x - c.ground.x, P.pos.z - c.ground.z) < CACHE.dig && Math.abs(P.pos.y - c.ground.y) < 2);
    if (!C) return false; this.dig(C, 'dig'); return true;
  }
  /** The pick or the Dreamquake came down at `point`: the caches within `r` come up. */
  unearth(point, r, how = 'pick') {
    let n = 0; for (const c of this.caches) if (this.diggable(c) && c.ground.distanceTo(point) < r) { this.dig(c, how); n++; }
    return n;
  }
  diggable(c) { const S = this.room.puzzle; return !S.dug.has(c.id) && !(c.sealed && !S.solved.has(c.sealed)); }
  dig(C, how) {
    const g = this.game, cubes = cachePay(C.tier);
    this.room.puzzle.dug.add(C.id); this.room.dirty();
    g.cubes?.earn?.(cubes, 'cache');
    g.fx?.absorbSparkle?.(C.ground.clone().setY(C.ground.y + 0.4));
    g.glyphs?.pop?.('bang3', C.ground.clone().setY(C.ground.y + 0.9), { color: 0xffb27a, size: 0.6, life: 1 });
    this.opened(C);
    this.emit('sea.dig', { id: C.id, tier: C.tier, cubes, how });
  }
  opened(C) {
    if (C.box) return void (C.box.visible = true);
    const m = C.box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.55), mat(0x8a5a2a)); m.userData.zone = 'opensea';
    m.position.copy(C.ground).setY(C.ground.y + 0.2); this.game.scene.add(m);
  }
  /** The looks from the state (built, loaded, or reset by a new build): lit arcs and sockets, the dug caches' boxes. */
  sync() {
    const S = this.room.puzzle;
    for (const L of this.lineups) for (const a of L.arcs) a.material.emissive.setHex(S.solved.has(L.id) ? 0x6a5a30 : 0x000000);
    for (const E of this.echoes) this.light(E, S.solved.has(E.id) ? E.phrase.length : 0);
    for (const C of this.caches) if (S.dug.has(C.id)) this.opened(C); else if (C.box) C.box.visible = false;
  }
  emit(type, payload) { this.game.events?.emit(type, { ...payload, by: 'courier' }); }
}
