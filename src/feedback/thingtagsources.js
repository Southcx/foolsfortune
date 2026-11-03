// ---------------------------------------------------------------------------------------
// WHO WEARS A THING'S TAG, AND WHEN (docs/plans/OVERLAY.md 8 and 9; GAPS G166, G113, G167; drawn by feedback/thingtags.js). The tag is
// the System's sight on what you attend to, never clutter on everything in view (the creature's rule, OVERLAY.md 17: the lock-on or the
// Veritome's raised lens). A thing has no lock-on, so its "this one" is the interact chevron (the one thing F would act on now: the
// System has already picked it out) or the lens raised over it; a few readouts come on a moment of their own and go:
//   ONE OF THE FOLK     the chevron on them, or the lens over them within its reach: the name and the title once you have spoken
//                       with them (the ledger's `npc.talk.<id>`), else ??? (a known unknown: talk to learn it); a shop's keeper, the
//                       shop's name as a row
//   A PRICE             the chevron on the Tithe's console: the sealed chest's price in cubes, and the cubes you hold beside it; on the
//                       Purser's posted board: what the Purser pays for a cask of each field and asks for Margarite's (the posted
//                       price, game.shops.offer / price: Dovina's numbers, read here)
//   A CRYSTAL'S FRET    the Dreamvane in hand and a crystal formation within its pick's few metres before you: the fret the pick would
//                       strike now (in its note's colour), of five; once struck, its strikes left. Never the sweet spot: the ear finds
//                       that (the mechanic is the lesson). The lens raised over one within reach: its name and strikes left only.
//   A PLANETOID'S HARMONY  the Spirit Garden's overhead view: each planetoid in view in briar or in bloom wears BRIAR or CALM under its
//                       name; between them nothing (GARDEN-COZY.md A7: shown, never said as a number)
//   A CRACKED REGION    `vessel.crack`: the region struck, pinned to it, with what the cracks hold off the pool, for 3 real s
//   THE SKY READ        `sky.read` (the Dreamvane's dowse raised to the sky): the weather now and the next blocks, over the Courier, for
//                       6 real s (the log says it too)
// The setting `visual.creatureTags` 'off' turns these off too (the overlay's tags as one preference). None in the god hand, a duel, a
// cinematic or a crossing (the overlay's rule).
//
// Prior art: the MMO vendor's nameplate shown on the one you face; Watch Dogs' profiler on the one you look at; Skyrim's "activate"
// prompt naming the thing under the reticle; Animal Crossing's shop tags over the goods (the price on the thing, not in a menu).
//
//   installThingTagSources(game)   (after game.thingTags; one `marks` system: boot/warmup.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T as TUNE } from '../core/config.js';
import { SHOPS } from '../progress/shop/catalogue.js';
import { TITHE } from '../world/treasure/treasure.js';
import { ECON } from '../progress/econ/table.js';
import { COLOR } from '../progress/weather.js';
import { bandOf } from '../progress/harmony.js';
import { CAP } from '../progress/poolcaps.js';
import { fretAt, FRETS } from '../world/dunes/crystaltuning.js';
import { degreeColor } from '../music/tone.js';

/** Reaches (m) and how long the moments stand (real s). */
export const THING_TAG_AT = { lens: 18, pick: 4.2, face: 0.55, crack: 3, sky: 6, poll: 0.1, lensMax: 3 };
/** The harmony's two words and their tones (the bramble's rust, the bloom's jade: never gold, which means won). */
const BAND = { briar: { word: 'BRIAR', tone: '#c4643f' }, bloom: { word: 'CALM', tone: '#8ed6a0' } };
const REGION = { mask: ['MASK', 'head'], torso: ['TORSO', 'spine004'], armL: ['LEFT ARM', 'forearmL'], armR: ['RIGHT ARM', 'forearmR'], legL: ['LEFT LEG', 'shinL'], legR: ['RIGHT LEG', 'shinR'] };
const REGION_DY = { mask: 1.62, torso: 1.25, armL: 1.15, armR: 1.15, legL: 0.5, legR: 0.5 };
const hex = (c) => `#${(c >>> 0).toString(16).padStart(6, '0').slice(-6)}`;
const cap = (s) => String(s || '').replace(/^./, (c) => c.toUpperCase());
const fieldName = (f) => (ECON.crude.fields[f]?.name || f).replace(/ crude$/, '').toUpperCase();

export function installThingTagSources(game) {
  const tags = game.thingTags; if (!tags) return null;
  const S = new ThingTagSources(game, tags);
  game.events?.on?.('vessel.crack', (e) => S.crack(e));
  game.events?.on?.('sky.read', (e) => S.sky(e));
  return S;
}

class ThingTagSources {
  constructor(game, tags) { this.game = game; this.tags = tags; this.poll = 0; this.v = new THREE.Vector3(); this.w = new THREE.Vector3(); }

  /** The overlay's tags are off, or this is a moment with no overlay in it. */
  get off() {
    const g = this.game, B = typeof document !== 'undefined' ? document.body.classList : null;
    return (TUNE.visual?.creatureTags ?? 'scan') === 'off' || !!(g.title?.active || g.god?.controlling || g.duel?.active || g.rail?.stage?.active || g.cinema?.active || B?.contains('cine'));
  }
  get lens() { const V = this.game.veritome; return !!(V?.lens && V.toolOut); }

  update(raw) {
    if ((this.poll -= raw) > 0) return; this.poll = THING_TAG_AT.poll;
    if (this.off) return;
    const ttl = THING_TAG_AT.poll * 2.5;
    this.chevron(ttl); this.crystals(ttl); this.planetoids(ttl);
    if (this.lens) this.lensFolk(ttl);
  }

  // ---------------------------------------------------------------- the chevron's one thing: the folk, the Tithe, the Purser's board
  chevron(ttl) {
    const g = this.game, cur = g.interact?.cur; if (!cur) return;
    if (cur.id === 'npc') { const n = g.folk?.byId?.[cur.ref]; if (n) this.folk(n, ttl); }
    else if (cur.id === 'chest' && cur.ref === 'tithe') this.tithe(cur, ttl);
    else if (cur.id === 'purser') this.purser(cur, ttl);
  }

  folk(n, ttl) {
    const g = this.game, met = (g.ledger?.get?.(`npc.talk.${n.id}`) || 0) > 0, rows = [];
    if (met && n.def?.title) rows.push({ value: n.def.title, word: true });
    const shop = met ? Object.values(SHOPS).find((s) => s.keeper === n.id) : null;
    if (shop) rows.push({ label: 'trade', value: shop.name, word: true, tone: '#8fd8b0' });
    const F = g.folk, at = () => F.head(n, this.w).setY(this.w.y + 0.42 * n.scale);
    this.tags.show(`folk.${n.id}`, { at, name: n.name, known: met, rows, ttl });
  }

  tithe(cur, ttl) {
    const g = this.game, have = g.cubes?.balance ?? 0, short = have < TITHE.cost;
    this.tags.show('price.tithe', { at: cur.pos, name: 'The Tithe', ttl, rows: [
      { label: 'a sealed chest', value: `${TITHE.cost}` },
      { label: 'you hold', value: short ? `${have}  SHORT` : `${have}`, tone: short ? '#ff8a6a' : null, word: short },
    ] });
  }

  purser(cur, ttl) {
    const sh = this.game.shops, rows = []; if (!sh) return;
    for (const f of Object.keys(ECON.crude.fields)) { const p = sh.offer?.('purser', `cask.${f}`); if (p > 0) rows.push({ label: `buys ${fieldName(f)}`, value: `${p}` }); }
    for (const id of Object.keys(SHOPS.purser?.sells || {})) { const p = sh.price?.('purser', id); if (p != null) rows.push({ label: `sells ${fieldName(id.split('.')[1])}`, value: `${p}` }); }
    this.tags.show('price.purser', { at: cur.pos, name: 'The posted price', rows, ttl });
  }

  // ---------------------------------------------------------------- a crystal's fret: the pick in hand before one; the lens over one
  crystals(ttl) {
    const g = this.game, C = g.crystals, P = g.player, cam = g.camera; if (!C?.list?.length || !P || !cam) return;
    const pick = !!g.dreamvane?.toolOut, lens = this.lens; if (!pick && !lens) return;
    const eye = cam.getWorldPosition(this.v), fwd = cam.getWorldDirection(this.w).setY(0).normalize();
    const near = [];
    for (const e of C.list) {
      if (e.veiled || e.rise < 0.95 || e.hp <= 0) continue;
      const dx = e.ground.x - P.pos.x, dz = e.ground.z - P.pos.z, d = Math.hypot(dx, dz) - (e.r || 0);
      if (pick && d < THING_TAG_AT.pick && (dx * fwd.x + dz * fwd.z) / (Math.hypot(dx, dz) || 1) > THING_TAG_AT.face) near.push([d, e, true]);
      else if (lens && e.pos.distanceTo(eye) < THING_TAG_AT.lens) near.push([d + 100, e, false]);
    }
    near.sort((a, b) => a[0] - b[0]);
    near.slice(0, pick ? 1 : THING_TAG_AT.lensMax).forEach(([, e, close]) => {
      const rows = [], struck = e.hp < e.maxHp;
      if (close) { const f = fretAt(C.aimHeight(e)); rows.push({ label: 'fret', value: `${f + 1} / ${FRETS}`, word: true, tone: hex(degreeColor(f)) }); }
      if (struck) rows.push({ label: e.tune?.kind === 'fragile' ? 'fragile' : 'dense', value: `${e.hp} / ${e.maxHp}` });
      const top = () => this.v.copy(e.ground).setY(e.ground.y + (e.h || 1.5) * 1.05);
      this.tags.show(`crystal.${C.list.indexOf(e)}`, { at: top, name: 'Lachryma crystal', rows, ttl });
    });
  }

  // ---------------------------------------------------------------- the lens over the folk
  lensFolk(ttl) {
    const g = this.game, F = g.folk, cam = g.camera; if (!F?.list?.length || !cam) return;
    const eye = cam.getWorldPosition(new THREE.Vector3()), p = new THREE.Vector3(), seen = [];
    for (const n of F.list) {
      F.head(n, p); const d = p.distanceTo(eye); if (d > THING_TAG_AT.lens) continue;
      p.project(cam); if (p.z > 1 || Math.abs(p.x) > 0.9 || Math.abs(p.y) > 0.9) continue;
      seen.push([Math.hypot(p.x, p.y), n]);
    }
    seen.sort((a, b) => a[0] - b[0]); for (const [, n] of seen.slice(0, THING_TAG_AT.lensMax)) this.folk(n, ttl);
  }

  // ---------------------------------------------------------------- a planetoid's harmony, in the garden's overhead view
  planetoids(ttl) {
    const g = this.game, R = g.realm, H = g.harmony, cam = g.camera;
    if (!R?.active || !H || !cam || R.camera?.view !== 'overhead') return;
    const up = this.w.set(0, 1, 0).applyQuaternion(cam.quaternion), p = new THREE.Vector3();
    for (const P of R.site?.planets || []) {
      const band = BAND[bandOf(H.of(P.id))]; if (!band) continue;
      p.copy(P.c).addScaledVector(up, P.r * 0.92); const q = p.clone().project(cam);
      if (q.z > 1 || Math.abs(q.x) > 0.95 || Math.abs(q.y) > 0.95) { // (its rim off the screen: the ground under the view)
        p.copy(cam.position).sub(P.c).normalize().multiplyScalar(P.r).add(P.c); q.copy(p).project(cam);
        if (q.z > 1 || Math.abs(q.x) > 1 || Math.abs(q.y) > 1) continue;
      }
      this.tags.show(`planetoid.${P.id}`, { at: p.clone(), name: P.name || P.id, rows: [{ value: band.word, word: true, tone: band.tone }], ttl });
    }
  }

  // ---------------------------------------------------------------- a moment's readouts: a cracked region, the sky read
  crack(e) {
    if (this.off) return;
    const g = this.game, R = REGION[e.region]; if (!R) return;
    const bone = g.character?.bones?.[R[1]], P = g.player;
    const at = () => (bone ? bone.getWorldPosition(this.v) : P ? this.v.set(P.pos.x, P.pos.y + REGION_DY[e.region], P.pos.z) : null);
    const n = (g.vesselDamage?.crack ? [...g.vesselDamage.crack].filter((k) => k > CAP.cracked).length : 1) || 1;
    this.tags.show(`crack.${e.region}`, { at, name: R[0], ttl: THING_TAG_AT.crack, rows: [
      { label: 'cracked', value: `${Math.round((e.k ?? 0) * 100)}%` },
      { label: 'pool held off', value: `${Math.round(CAP.crack * n * 100)}%` },
    ] });
  }

  sky(e) {
    if (this.off || e?.by !== 'courier') return;
    const P = this.game.player; if (!P) return;
    const rows = (e.blocks || []).slice(0, 4).map((b) => ({ label: `${String(b.hour % 24).padStart(2, '0')}:00`, word: true,
      value: b.aspect ? `${cap(b.aspect)} ${Math.round((b.strength || 0) * 100)}%` : 'fair', tone: b.aspect ? hex(COLOR[b.aspect]) : '#d8e8f0' }));
    this.tags.show('sky.read', { at: () => this.v.set(P.pos.x, P.pos.y + 2.1, P.pos.z), name: 'The sky ahead', rows, ttl: THING_TAG_AT.sky });
  }
}
