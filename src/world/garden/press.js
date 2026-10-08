// ---------------------------------------------------------------------------------------
// THE SPIRIT PRESS AT THE ATHANOR (docs/plans/SOUL-ALCHEMY.md 3.5 and 4; the rules are progress/alchemy.js, the model Calissa's
// vfx/spiritpress.js). The press stands on the Athanor's crown, over its vent. Its FORMATION is the Athanor's own, on Wu Xing's cycles:
// the press is fire (mirth's phase), and every feature placed on the Athanor, the ground under the press and the water that reaches it
// count as its neighbours (`formation` in progress/realm.js), so a fire-feeding Athanor (moss ground, wonder beside it) is kinder:
// every swatch's radius is times this, clamped by ECON.alchemy.formationClamp.
// THE PAGE is the press worked with the hand: the BATH drawn from above (the wheel: hue round it, grey at its heart; no numbers), the
// seven SWATCHES as tiles at their hues, each sized by its radius now and marked with a shape as well as a colour (a stand-in for
// Calissa's seven glyphs, so a colour-blind eye steers by shape and place), the SOUL COLOUR as a drop, and the HOPPER: up to five
// materials from the Pneuka Box, in order, their path drawn ahead of the drop as a faint trail (what pressing will do, shown). PRESS
// walks the drop along it (a material a real second) and uses them up; FIRE pulls the lever. A refusal is said in the log at the press.
// The model follows: the queue's lumps, the soul colour in its bath and eye, the hue ring's light that is `near`, the press and the pull.
//
// Prior art: Potion Craft's map (a path previewed before the ingredient goes in, the bottle as a place you steer to), a painter's
// colour wheel (complements grey), and Calissa's press (the bath is the wheel: SOUL-ALCHEMY.md section 4).
//
//   const P = new GardenPress(realm, feature)   P.formation() -> n   P.open()   P.update(raw)   P.hopper [slot, ...]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SpiritPress } from '../../vfx/spiritpress.js';
import { ATTRIBUTES, targetOf } from '../../progress/alchemy.js';
import { formation } from '../../progress/realm.js';
import { ECON } from '../../progress/econ/table.js';

const HOPPER = 5, WALK = 1; // (materials at once; real seconds the drop takes to walk one material's path)
const IDS = Object.keys(ATTRIBUTES);
const SHAPES = [3, 4, 5, 6, -5, 0, -4]; // (a swatch's shape: a polygon's sides, a star's points (negative), 0 a ring: a stand-in for Calissa's glyphs)
const css = (c, a = 1) => `hsla(${c.h.toFixed(0)}, ${Math.round(c.s * 100)}%, ${Math.round(60 - c.s * 10)}%, ${a})`;

export class GardenPress {
  constructor(realm, feature) {
    this.R = realm; this.game = realm.game; this.feature = feature; this.hopper = []; this.walking = null;
    this.model = new SpiritPress({ hues: IDS.map((id) => ATTRIBUTES[id].hue) });
    this.model.group.name = 'garden-press';
    if (feature?.m) this.model.group.applyMatrix4(feature.m);
    realm.site.group.add(this.model.group);
    this.fire = 0; this.pull = 0; this.pressT = 0;
  }

  /** The press's formation: fire, with the Athanor's features, the ground under it and the water at it as neighbours. */
  formation() {
    const P = this.feature?.planet; if (!P) return 1;
    const R = this.R, near = R.plots.plots.filter((p) => p.planet === P && p.placed).map((p) => p.placed.feeling);
    const dir = this.feature.pos.clone().sub(P.c).normalize();
    const ground = R.clays?.[P.id]?.groundOf?.(dir) ?? null, water = R.waterworks?.feelingAt?.(P, dir) ?? null;
    const [lo, hi] = ECON.alchemy.formationClamp;
    return Math.max(lo, Math.min(hi, formation('mirth', near, false, { ground, water })));
  }

  /** The materials in the box (slots holding one), and the hopper's in order. */
  materials() { const box = this.game.pneuka; return (box?.slots || []).map((s, i) => (s?.data?.path ? { i, s } : null)).filter(Boolean); }
  inHopper() { const box = this.game.pneuka; this.hopper = this.hopper.filter((i) => box?.slots[i]?.data?.path); return this.hopper.map((i) => box.slots[i].data); }

  open() {
    const g = this.game, menu = g.indexMenu || g.course?.menu; if (!menu?.showPage) return;
    const A = g.alchemy; if (!A) return;
    const show = () => menu.showPage('press', (im, el) => {
      const cv = document.createElement('canvas'); cv.width = 300; cv.height = 300; cv.style.cssText = 'display:block;margin:4px auto 8px;width:300px;height:300px;image-rendering:auto';
      im.appendChild(cv); this.canvas = cv; this.draw();
      const rows = el('div', 'rooms'), row = (glyph, t, sub, run) => { const d = el('div', 'room', `<span class="n">${glyph}</span><span><b>${t}</b><s>${sub}</s></span>`); if (run) d.onclick = run; rows.appendChild(d); return d; };
      const box = g.pneuka, mats = this.materials(), inH = this.inHopper();
      im.appendChild(el('div', 'grp', `THE HOPPER · ${inH.length} OF ${HOPPER}`));
      const hop = el('div', 'rooms');
      this.hopper.forEach((i, k) => { const m = box.slots[i].data, d = el('div', 'room', `<span class="n" style="color:${css({ h: m.hue, s: m.sat })}">●</span><span><b>${k + 1}. ${m.kind}</b><s>click to take it out</s></span>`); d.onclick = () => { this.hopper.splice(k, 1); show(); }; hop.appendChild(d); });
      if (!inH.length) hop.appendChild(el('div', 'room', '<span class="n">○</span><span><b>Empty</b><s>choose materials below, in the order they go in</s></span>'));
      im.appendChild(hop);
      im.appendChild(el('div', 'grp', 'THE PRESS'));
      row('⟳', 'Press', inH.length ? 'the drop walks their paths; they are used up' : 'put materials in the hopper first', inH.length && !this.walking ? () => this.press(show) : null);
      row('✶', 'Fire', A.s.cocked ? 'pull the lever while the drop sits in a swatch' : 'the lever is down: one firing a press', !this.walking ? () => this.fireLever(show) : null);
      im.appendChild(rows);
      im.appendChild(el('div', 'grp', 'YOUR MATERIALS'));
      const list = el('div', 'rooms');
      for (const { i, s } of mats) {
        const m = s.data, left = (s.n || 1) - (this.hopper.includes(i) ? 1 : 0);
        if (left <= 0) continue;
        const d = el('div', 'room', `<span class="n" style="color:${css({ h: m.hue, s: m.sat })}">●</span><span><b>${m.kind}${(s.n || 1) > 1 ? ` x${s.n}` : ''}</b><s>${m.path.length} steps${m.tier ? `, tier ${m.tier}` : ''}</s></span>`);
        d.onclick = () => { if (this.hopper.length < HOPPER && !this.hopper.includes(i)) { this.hopper.push(i); show(); } };
        list.appendChild(d);
      }
      if (!list.children.length) list.appendChild(el('div', 'room', '<span class="n">○</span><span><b>No materials</b><s>a Well run, a fish, a crystal, a harvest: each leaves one</s></span>'));
      im.appendChild(list);
    }, { title: 'THE SPIRIT PRESS', sub: 'click · F closes' });
    this.reopen = show; show();
  }

  /** PRESS: the hopper's materials go in; the drop walks their trail on the page (a material a real second). */
  press(show) {
    const A = this.game.alchemy, slots = [...this.hopper];
    const before = A.colour, r = A.press(slots);
    if (!r.trail.length) return;
    this.hopper = []; this.pressT = 1;
    this.walking = { trail: r.trail, from: before, t: 0, dur: WALK * slots.length };
    this.model.set({ queue: [] });
    show();
  }

  /** FIRE: the lever; the log says what happened (a firing by the event, a refusal here). */
  fireLever(show) {
    const r = this.game.alchemy.fire();
    this.pull = 1;
    if (r.ok) this.fire = 1;
    else { this.game.events?.emit('alchemy.refuse', { why: r.code, by: 'courier' }); this.game.log?.say?.('info', r.why, { key: 'alchemy.refuse', throttle: 1 }); } // (SOUL-ALCHEMY 4.19; the why is said at the point of use)
    show();
  }

  /** The bath from above: the wheel, the swatches (sized by their radius now), the trail ahead and the drop. */
  draw() {
    const cv = this.canvas; if (!cv?.isConnected) return;
    const A = this.game.alchemy, c = cv.getContext('2d'), W = cv.width, R = W / 2 - 6, cx = W / 2, cy = W / 2;
    const at = (col) => [cx + Math.cos(col.h * Math.PI / 180) * col.s * R, cy - Math.sin(col.h * Math.PI / 180) * col.s * R];
    c.clearRect(0, 0, W, W);
    // the bath: hue round it, grey at its heart (a conic sweep under a radial wash of grey)
    if (c.createConicGradient) { const g = c.createConicGradient(0, cx, cy); for (let k = 0; k <= 12; k++) g.addColorStop(k / 12, `hsl(${(360 - k * 30) % 360}, 55%, 42%)`); c.fillStyle = g; }
    else c.fillStyle = '#5a4a40';
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    const grey = c.createRadialGradient(cx, cy, 0, cx, cy, R); grey.addColorStop(0, 'rgba(120,112,108,1)'); grey.addColorStop(1, 'rgba(120,112,108,0)');
    c.fillStyle = grey; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,178,122,.5)'; c.lineWidth = 2; c.stroke();
    // the seven swatches: a glazed tile at the attribute's hue, as wide as its radius now, its shape its mark
    const near = A.near();
    IDS.forEach((id, k) => {
      const t = targetOf(id), [x, y] = at(t), r = A.radius(id) * 2 * R; // (distance is half the wheel's chord: a radius of 0.12 is 0.24 of the wheel)
      c.fillStyle = css({ h: t.h, s: 0.8 }, id === near ? 0.75 : 0.4); c.strokeStyle = id === near ? '#fff4e0' : 'rgba(255,244,224,.55)'; c.lineWidth = id === near ? 2.5 : 1.2;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.stroke();
      this.glyph(c, x, y, Math.max(5, Math.min(12, r * 0.5)), SHAPES[k]);
    });
    // the trail ahead: what the hopper's materials will do (or, while pressing, the drop walking the trail it is on)
    const W8 = this.walking, inH = this.inHopper();
    const trail = W8 ? W8.trail : inH.length ? A.walk(inH).trail : null;
    let drop = A.colour;
    if (trail) {
      c.strokeStyle = 'rgba(255,244,224,.55)'; c.setLineDash([3, 4]); c.lineWidth = 1.5; c.beginPath();
      trail.forEach((p, i) => { const [x, y] = at(p); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke(); c.setLineDash([]);
      if (W8) { const u = Math.min(1, W8.t / W8.dur) * (trail.length - 1), i = Math.floor(u), f = u - i, a = trail[i], b = trail[Math.min(trail.length - 1, i + 1)]; const [ax, ay] = at(a), [bx, by] = at(b); drop = null; this.dropAt(c, ax + (bx - ax) * f, ay + (by - ay) * f, a); }
    }
    if (drop) { const [x, y] = at(drop); this.dropAt(c, x, y, drop); }
  }
  dropAt(c, x, y, col) { c.fillStyle = col.s < 0.05 ? '#bdb3ad' : css(col); c.strokeStyle = '#1c0d08'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill(); c.stroke(); }
  glyph(c, x, y, r, n) {
    c.strokeStyle = '#1c0d08'; c.lineWidth = 1.6; c.beginPath();
    if (n === 0) c.arc(x, y, r * 0.7, 0, Math.PI * 2);
    else { const pts = Math.abs(n) * (n < 0 ? 2 : 1); for (let i = 0; i <= pts; i++) { const a = -Math.PI / 2 + (i / pts) * Math.PI * 2, rr = n < 0 && i % 2 ? r * 0.45 : r; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if (i) c.lineTo(px, py); else c.moveTo(px, py); } }
    c.stroke();
  }

  /** The model each frame: the queue in the crown's mouth, the soul in the bath, the swatch it is inside lit, the press and the pull. */
  update(raw) {
    const A = this.game.alchemy; if (!A) return;
    const W8 = this.walking;
    if (W8) { W8.t += raw; if (W8.t >= W8.dur) { this.walking = null; this.reopen?.(); } else this.draw(); }
    this.fire = Math.max(0, this.fire - raw * 0.5); this.pull = Math.max(0, this.pull - raw * 1.5); this.pressT = Math.max(0, this.pressT - raw * 0.5);
    const near = A.near(), q = this.inHopper().map((m) => m.hue);
    this.model.set({ soul: A.colour, fire: this.fire, press: this.pressT, pull: this.pull, near: near ? IDS.indexOf(near) : -1, queue: q });
    this.model.update(performance.now() / 1000);
  }

  dispose() { this.model.group.removeFromParent(); this.model.dispose?.(); }
}
