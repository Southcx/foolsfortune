// ---------------------------------------------------------------------------------------
// THE VESSEL: the Courier dressed as a pot is. It keeps their LOOK (a glaze for each region: courier/vessel/glazes.js), the glazes they have
// (theirs from the start, those their achievements have earned, and those the Veritome has learned from photographs), and the net its
// cracks run along (courier/vessel/kintsugi.js; the cracks themselves are courier/vessel/damage.js's, and mend). `dress(character)` lays all of it on any Courier model:
// the one they play and the one on the title's hill alike.
//
// A look is FIRED at the kiln in the workshop (courier/moves/kiln.js, the kiln station; its window is courier/vessel/kilnui.js): a preview first, on
// them, while they turn in front of the kiln's mouth; then the firing, which costs cubes (`ECON.firing`: a drain) and which the body
// shows (it glows kiln-orange and cools into the new glaze). Every outcome is an event (`vessel.fire`, `glaze.earn`, `glaze.learn`)
// and tracking.js says it.
//
// Prior art: FFXIV's glamour dresser and dyes (a look apart from what you are, fixed on at a station), Animal Crossing's Able
// Sisters (a look tried on before it is paid for), Dark Cloud 2's ideas from photographs (the camera as a way of learning things),
// and the potter's firing itself.
//
//   const v = new Vessel(game)   v.dress(character)   v.owned() -> [glaze]   v.glaze(id)   v.preview(look)   v.fire(look) -> bool
//   v.learnFrom([r, g, b], kind)   v.update(dt)   v.look   v.cost
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { REGIONS, GLAZES, DEFAULT_LOOK } from './glazes.js';
import { dressFinish } from '../../vfx/finish.js';
import { addKintsugi, kintsugiUniforms } from './kintsugi.js';
import { tagRegions } from './damage.js';
import { ECON } from '../../progress/econ/table.js';
import { PALETTE } from '../../core/config.js';
import { sfx } from '../../audio/sfx.js';

const KEY = 'foolsfortune.vessel.v1';
const LEARNED_MAX = 8;
const _c = new THREE.Color(), _h = {};

export class Vessel {
  constructor(game) {
    this.game = game;
    this.look = { ...DEFAULT_LOOK };
    this.learned = []; // glazes learned from photographs: { id, name, color, rough, metal, glow, blurb, got: { photo } }
    this.known = null; // glazes they have been told of (an earned one is said once)
    this.dressed = new Set(); // the characters wearing it
    this.kinU = kintsugiUniforms();
    this.t = 0; this.fireT = 0;
    this.load();
  }
  get cost() { return Math.round(ECON.firing * ECON.perMinute); }

  // ---------------------------------------------------------------- the glazes they have
  glaze(id) { return GLAZES[id] || this.learned.find((g) => g.id === id) || null; }
  has(id) {
    const g = this.glaze(id);
    if (!g) return false;
    if (g.got.start || g.got.photo) return true;
    if (g.got.ach) return !!this.game.ledger?.done?.[g.got.ach];
    return !!this.bought?.[id];
  }
  owned() { return [...Object.values(GLAZES), ...this.learned].filter((g) => this.has(g.id)); }

  // ---------------------------------------------------------------- on a body
  /** Lay a look (theirs, unless another is given) on a Courier model: each region's material takes its glaze; the armour and the mask carry
   *  the kintsugi. */
  dress(ch, look = this.look) {
    if (!ch?.regionMats) return;
    if (!this.dressed.has(ch)) tagRegions(ch); // (each vertex told its hit region, for the cracks: courier/vessel/damage.js)
    this.dressed.add(ch);
    for (const r of Object.keys(REGIONS)) {
      const m = ch.regionMats[r];
      let g = this.glaze(look[r]);
      if (!g || !REGIONS[r].kinds.includes(g.kind || 'glaze')) g = GLAZES[DEFAULT_LOOK[r]]; // (a finish of the wrong kind for the part: its own)
      if (!m) continue;
      // (what the model was made with is kept: the starting finish of a painted part, or one marked `keep`, is the maker's own, untouched;
      //  anything else is laid on by the part's finish shader, vfx/finish.js: a glaze takes the painting only as light and shade)
      const base = (m.userData.base ||= { color: m.color.getHex(), rough: m.roughness, metal: m.metalness, em: m.emissive?.getHex() ?? 0, emI: m.emissiveIntensity ?? 0 });
      const own = g.keep || (!!m.map && g.id === DEFAULT_LOOK[r]);
      const U = dressFinish(m, REGIONS[r].shader);
      U.uFinOn.value = own ? 0 : 1;
      if (own) {
        m.color.setHex(base.color); m.roughness = base.rough; m.metalness = base.metal;
        m.userData.rest = { em: base.em, emI: base.emI };
      } else {
        U.uFinA.value.setHex(g.color); U.uFinB.value.setHex(g.color2 ?? g.color);
        const sh = REGIONS[r].shader, P = U.uFinP.value;
        if (sh === 'glaze') P.set(m.map ? 2.0 : 0, lumaMean(m), g.pattern || 0, 1 / modelSpan(ch)); // (how much of the painting's light and shade shows through; the kiln pattern, at the body's scale)
        else if (sh === 'hair') { const b = hairSpan(ch); P.set(g.kind === 'hair' ? g.p[0] : 0, b.h, g.kind === 'hair' ? g.p[2] : 0, b.y0); if (g.kind !== 'hair') U.uFinB.value.setHex(g.color); }
        else P.set(...(g.p || [0, 0, 0, 0]));
        m.color.setHex(0xffffff); m.roughness = g.rough; m.metalness = g.metal;
        m.userData.rest = sh === 'glaze' && m.map ? { em: g.color, emI: base.emI } : { em: g.glow ? PALETTE.glow : 0x000000, emI: g.glow || 0 };
      }
      if (m.emissive) { m.emissive.setHex(m.userData.rest.em); m.emissiveIntensity = m.userData.rest.emI; }
      m.userData.glaze = g;
      if ((r === 'body' || r === 'mask') && !m.userData.kin) { addKintsugi(m, this.kinU); m.userData.kin = true; }
    }
  }
  /** Try a look on them (the kiln's preview: nothing is kept until it is fired). */
  preview(look) { for (const ch of this.dressed) this.dress(ch, look); }
  /** Back to what they wear. */
  revert() { this.preview(this.look); }

  /** Fire a look on: it costs cubes; the body glows and cools into it. False if they cannot pay, or it is what they wear already. */
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

  // ---------------------------------------------------------------- learned from photographs (tools/veritome/darkroom.js)
  /** A colour the Veritome saw in a good photograph, learned as a glaze if it is a colour at all (not grey, not black) and not one they
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

/** The mean lightness of a painted part's own texture (a glaze keeps the painting as light and shade around it), measured once. */
function lumaMean(m) {
  if (m.userData.lumaMean != null) return m.userData.lumaMean;
  let v = 0.3;
  try {
    const img = m.map?.image, c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, 32, 32);
    const d = g.getImageData(0, 0, 32, 32).data; let s = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 8) { s += (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255; n++; }
    if (n) v = s / n;
  } catch { /* no image to read: the default */ }
  return (m.userData.lumaMean = v);
}
/** The Courier's height in their own space (the tallest part), so a glaze's pattern is the same size on every part. */
function modelSpan(ch) {
  if (ch.userData?.span) return ch.userData.span;
  let h = 0;
  ch.model?.traverse((o) => { if (o.isMesh) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; h = Math.max(h, b.max.y - b.min.y); } });
  return ((ch.userData ||= {}).span = h || 1);
}
/** The hair's height in its own space (root at the top, tips at the bottom), for an ombre. */
function hairSpan(ch) {
  if (ch.userData?.hairSpan) return ch.userData.hairSpan;
  let y0 = 0, h = 1;
  ch.model?.traverse((o) => { if (o.isMesh && o.name === 'Kiritohair') { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; y0 = b.min.y; h = b.max.y - b.min.y; } });
  (ch.userData ||= {}).hairSpan = { y0, h };
  return ch.userData.hairSpan;
}
