// ---------------------------------------------------------------------------------------
// THE VESSEL: the Courier dressed as a pot is. It keeps her LOOK (a glaze for each region: vessel/glazes.js), the glazes she has
// (hers from the start, those her achievements have earned, and those the Veritome has learned from photographs), and her KINTSUGI
// (vessel/kintsugi.js: gold in the seams, more of it the more she has done). `dress(character)` lays all of it on any Courier model:
// the one she plays and the one on the title's hill alike.
//
// A look is FIRED at the kiln in the workshop (moves/kiln.js, the kiln station; its window is vessel/kilnui.js): a preview first, on
// her, while she turns in front of the kiln's mouth; then the firing, which costs cubes (`ECON.firing`: a drain) and which the body
// shows (it glows kiln-orange and cools into the new glaze). Every outcome is an event (`vessel.fire`, `glaze.earn`, `glaze.learn`)
// and tracking.js says it.
//
// Prior art: FFXIV's glamour dresser and dyes (a look apart from what you are, fixed on at a station), Animal Crossing's Able
// Sisters (a look tried on before it is paid for), Dark Cloud 2's ideas from photographs (the camera as a way of learning things),
// and the potter's firing itself.
//
//   const v = new Vessel(game)   v.dress(character)   v.owned() -> [glaze]   v.glaze(id)   v.preview(look)   v.fire(look) -> bool
//   v.learnFrom([r, g, b], kind)   v.kinShare()   v.update(dt)   v.look   v.cost
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { REGIONS, GLAZES, DEFAULT_LOOK } from './glazes.js';
import { addKintsugi, kintsugiUniforms } from './kintsugi.js';
import { tagRegions } from './damage.js';
import { ECON } from '../econ/table.js';
import { PALETTE } from '../config.js';
import { sfx } from '../audio.js';

const KEY = 'foolsfortune.vessel.v1';
const LEARNED_MAX = 8;
const _c = new THREE.Color(), _h = {};

export class Vessel {
  constructor(game) {
    this.game = game;
    this.look = { ...DEFAULT_LOOK };
    this.learned = []; // glazes learned from photographs: { id, name, color, rough, metal, glow, blurb, got: { photo } }
    this.known = null; // glazes she has been told of (an earned one is said once)
    this.dressed = new Set(); // the characters wearing it
    this.kinU = kintsugiUniforms();
    this.t = 0; this.fireT = 0;
    this.load();
  }
  get cost() { return Math.round(ECON.firing * ECON.perMinute); }

  // ---------------------------------------------------------------- the glazes she has
  glaze(id) { return GLAZES[id] || this.learned.find((g) => g.id === id) || null; }
  has(id) {
    const g = this.glaze(id);
    if (!g) return false;
    if (g.got.start || g.got.photo) return true;
    if (g.got.ach) return !!this.game.ledger?.done?.[g.got.ach];
    return !!this.bought?.[id];
  }
  owned() { return [...Object.values(GLAZES), ...this.learned].filter((g) => this.has(g.id)); }

  /** The share of the kintsugi net that is gold: it grows quickly with the first achievements and slowly toward the whole. */
  kinShare() { const n = this.game.achievements?.count?.() || 0; return n ? 1 - Math.exp(-n / 25) : 0; }

  // ---------------------------------------------------------------- on a body
  /** Lay a look (hers, unless another is given) on a Courier model: each region's material takes its glaze; the armour and the mask carry
   *  the kintsugi. */
  dress(ch, look = this.look) {
    if (!ch?.regionMats) return;
    if (!this.dressed.has(ch)) tagRegions(ch); // (each vertex told its hit region, for the cracks: vessel/damage.js)
    this.dressed.add(ch);
    for (const r of Object.keys(REGIONS)) {
      const m = ch.regionMats[r], g = this.glaze(look[r]) || GLAZES[DEFAULT_LOOK[r]];
      if (!m) continue;
      // (what the model was made with is kept: the starting glaze on a painted part is the maker's painting itself, untouched, and any
      //  other glaze tints the painting and leaves its glow, so the paint holds in the shade: character.js PAINT_LIGHT)
      const base = (m.userData.base ||= { color: m.color.getHex(), rough: m.roughness, metal: m.metalness, em: m.emissive?.getHex() ?? 0, emI: m.emissiveIntensity ?? 0 });
      const own = !!m.map && g.id === DEFAULT_LOOK[r];
      m.color.setHex(own ? base.color : g.color); m.roughness = own ? base.rough : g.rough; m.metalness = own ? base.metal : g.metal;
      m.userData.rest = m.map ? { em: own ? base.em : g.color, emI: base.emI } : { em: g.glow ? PALETTE.glow : 0x000000, emI: g.glow || 0 };
      if (m.emissive) { m.emissive.setHex(m.userData.rest.em); m.emissiveIntensity = m.userData.rest.emI; }
      m.userData.glaze = g;
      if ((r === 'body' || r === 'mask') && !m.userData.kin) { addKintsugi(m, this.kinU); m.userData.kin = true; }
    }
  }
  /** Try a look on her (the kiln's preview: nothing is kept until it is fired). */
  preview(look) { for (const ch of this.dressed) this.dress(ch, look); }
  /** Back to what she wears. */
  revert() { this.preview(this.look); }

  /** Fire a look on: it costs cubes; the body glows and cools into it. False if she cannot pay, or it is what she wears already. */
  fire(look) {
    const g = this.game, same = Object.keys(REGIONS).every((r) => look[r] === this.look[r]);
    if (same) { g.log?.say('warn', 'That is what the vessel wears already.', { key: 'kiln.same', throttle: 2 }); return false; }
    if (Object.keys(REGIONS).some((r) => !this.has(look[r]))) return false;
    if (!g.cubes?.spend(this.cost, 'kiln')) { g.log?.say('warn', `The firing costs ${this.cost} cubes.`, { key: 'kiln.poor', throttle: 2 }); return false; }
    this.look = { ...look };
    this.save();
    this.preview(this.look);
    this.fireT = 2.6; // (the glow, cooling)
    sfx.kilnFire?.(); // (Wanda's: docs/HANDOFFS.md)
    g.events?.emit('vessel.fire', { look: { ...this.look }, cost: this.cost, by: 'courier' });
    return true;
  }

  // ---------------------------------------------------------------- learned from photographs (veritome/darkroom.js)
  /** A colour the Veritome saw in a good photograph, learned as a glaze if it is a colour at all (not grey, not black) and not one she
   *  has already. The oldest learned glaze goes when there are too many. */
  learnFrom(rgb, kind = 'thing') {
    _c.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace).getHSL(_h);
    if (_h.s < 0.22 || _h.l < 0.12 || _h.l > 0.9) return null;
    const hex = _c.getHex();
    const near = [...Object.values(GLAZES), ...this.learned].some((g) => { const o = new THREE.Color(g.color); return Math.abs(o.r - _c.r) + Math.abs(o.g - _c.g) + Math.abs(o.b - _c.b) < 0.12; });
    if (near) return null;
    const n = (this.seq = (this.seq || 0) + 1);
    const name = `${String(kind).toUpperCase()} GLAZE`;
    const g = { id: `photo.${n}`, name, color: hex, rough: 0.35, metal: 0.05, glow: 0, blurb: `A colour the Veritome saw in a photograph of ${kind === 'thing' ? 'something' : `the ${kind}`}.`, got: { photo: true } };
    this.learned.push(g);
    while (this.learned.length > LEARNED_MAX) {
      const old = this.learned.shift();
      for (const r of Object.keys(this.look)) if (this.look[r] === old.id) this.look[r] = DEFAULT_LOOK[r];
    }
    this.save();
    this.game.events?.emit('glaze.learn', { glaze: g.id, kind, color: hex });
    return g;
  }

  // ---------------------------------------------------------------- each frame
  update(dt) {
    this.t += dt;
    if (this.t > 1) {
      this.t = 0;
      this.kinU.uKin.value = this.kinShare();
      // an achievement's glaze, said once when it is earned
      const now = this.owned().map((g) => g.id);
      if (!this.known) this.known = new Set(now);
      for (const id of now) if (!this.known.has(id)) { this.known.add(id); this.game.events?.emit('glaze.earn', { glaze: id }); }
    }
    if (this.fireT > 0) {
      this.fireT = Math.max(0, this.fireT - dt);
      const k = this.fireT / 2.6; // 1 white-hot .. 0 cooled
      for (const ch of this.dressed) for (const r of Object.keys(REGIONS)) {
        const m = ch.regionMats?.[r], g = m?.userData.glaze;
        const rest = m?.userData.rest;
        if (!m?.emissive || !g || !rest) continue;
        _c.setHex(0xff6a20).lerp(new THREE.Color(rest.em), 1 - k);
        m.emissive.copy(_c); m.emissiveIntensity = Math.max(rest.emI, 1.4 * k * k);
      }
    }
  }

  // ---------------------------------------------------------------- kept (progress: reset with each build)
  save() { try { localStorage.setItem(KEY, JSON.stringify({ look: this.look, learned: this.learned, seq: this.seq || 0 })); } catch { /* this session only */ } }
  load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!s) return;
      this.learned = (s.learned || []).filter((g) => g?.id && Number.isFinite(g.color)).slice(-LEARNED_MAX);
      this.seq = s.seq || 0;
      for (const r of Object.keys(REGIONS)) if (s.look?.[r] && this.glaze(s.look[r])) this.look[r] = s.look[r];
    } catch { /* nothing kept */ }
  }
}
