// ---------------------------------------------------------------------------------------
// THING TAGS: the overlay's tag on a thing that is not a creature (docs/plans/OVERLAY.md 8: "a crystal's fret; a price over the shop's
// goods; one of the folk's name"; GAPS G166, G113, G167; GLOSSARY, "a thing's tag"). The house's tag grammar, as the creature's tag
// (vfx/creaturetags.js) and the odds tag (feedback/oddstags.js) draw it: a bracket closed on the point, a dashed leader up to a small
// hex-cornered plate of ink; on it the thing's name carved (Cinzel, ivory), then its rows: a label in the readout's green and its value
// in the count face lit in the VFD's glow, or a word in the row's own tone. A name not known is '???' in the System's face, dim (a
// known unknown: OVERLAY.md 17's rule that the tag's shape is the same whether or not it is read). Drawn in the page over the canvas,
// after the grade, and hidden with the HUD (F2, `#hud`). Who wears one and when is feedback/thingtagsources.js (never always on).
//
// A tag lives while it is asked for: `show` each frame it should stand (or once with `ttl`), gone `ttl` real s after the last ask,
// fading in and out over a beat. It never narrates: what happened is the log's. Words are labels and counts only.
//
// Prior art: Watch Dogs' profiler (a glance reads a line, the leader line); Dennō Coil's glasses (the data pinned on the thing);
// an MMO's nameplate over a vendor (shown on the one you face, not on every one in sight); the house's odds tag, whose layout this is.
//
//   game.thingTags = new ThingTags(game)   .show(key, { at: Vector3 | () => Vector3, name, known?, rows?: [{ label?, value?, tone? }], ttl? })
//   .hide(key)   .update(rawDt)   .list -> the keys standing   THING_TAG (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FONT } from '../ui/theme.js';

/** Its lift over the point (m), the seconds a tag stands after its last ask, the most rows drawn, the fade (real s), and the plate's
 *  layout (CSS px): the leader's rise and run, the plate's least and most width, a row's height, the name's. */
export const THING_TAG = { lift: 0.25, ttl: 0.25, rows: 5, fade: 0.18, rise: 30, run: 20, wMin: 112, wMax: 210, rowH: 17, nameH: 20 };

const INK = 'rgba(13,10,18,0.9)', VFD = '#7dffd2', VFD_GLOW = 'rgba(60,255,190,.85)', LAB = '#8fd8b0', IVORY = '#f1e6cc';
const _v = new THREE.Vector3();
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CSS = `
#hud .tt{position:absolute;left:0;top:0;pointer-events:none;z-index:4;will-change:transform,opacity;transition:opacity ${THING_TAG.fade}s linear}
#hud .tt svg{position:absolute;left:0;top:0;overflow:visible}
#hud .tt .tt-p{position:absolute;min-width:${THING_TAG.wMin}px;max-width:${THING_TAG.wMax}px;padding:4px 9px 5px;box-sizing:border-box;background:${INK};
  clip-path:polygon(7px 0,calc(100% - 7px) 0,100% 7px,100% calc(100% - 7px),calc(100% - 7px) 100%,7px 100%,0 calc(100% - 7px),0 7px);
  box-shadow:inset 0 0 0 1px rgba(125,255,210,.35)}
#hud .tt .tt-n{height:${THING_TAG.nameH}px;line-height:${THING_TAG.nameH}px;font:600 13px ${FONT.title};letter-spacing:.08em;color:${IVORY};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#hud .tt .tt-n.unk{font:13px ${FONT.sys};letter-spacing:.3em;color:rgba(143,216,176,.55)}
#hud .tt .tt-r{display:flex;align-items:center;gap:8px;height:${THING_TAG.rowH}px;border-top:1px solid rgba(125,255,210,.12)}
#hud .tt .tt-l{flex:1;min-width:0;font:11px ${FONT.sys};letter-spacing:.06em;text-transform:uppercase;color:${LAB};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#hud .tt .tt-v{font:15px/1 'Jersey 15',${FONT.sys};color:${VFD};text-shadow:0 0 4px ${VFD_GLOW};white-space:nowrap}
#hud .tt .tt-w{font:12px ${FONT.sys};letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
#hud .tt .tt-s{display:inline-block;width:7px;height:7px;margin-right:5px;vertical-align:1px;transform:rotate(45deg)}
`;

export class ThingTags {
  constructor(game) { this.game = game; this.tags = new Map(); }

  get list() { return [...this.tags.keys()]; }

  show(key, { at, name = '', known = true, rows = [], ttl = THING_TAG.ttl } = {}) {
    if (!at || typeof document === 'undefined') return null;
    const host = document.getElementById('hud') || document.body; if (!host) return null;
    if (!document.getElementById('thingtags-css')) { const st = document.createElement('style'); st.id = 'thingtags-css'; st.textContent = CSS; document.head.appendChild(st); }
    let T = this.tags.get(key);
    const R = rows.slice(0, THING_TAG.rows), sig = `${known ? name : '?'}|${R.map((r) => `${r.label}:${r.value}:${r.tone}`).join('|')}`;
    if (!T) {
      const el = document.createElement('div'); el.className = 'tt'; el.dataset.key = key; el.style.opacity = '0';
      el.innerHTML = `<svg width="1" height="1"><path class="lb" fill="none" stroke="#0d0a12" stroke-width="3"/><path class="lf" fill="none" stroke="${VFD}" stroke-width="1.2" stroke-dasharray="3 3"/></svg><div class="tt-p"></div>`;
      host.appendChild(el);
      T = { el, plate: el.querySelector('.tt-p'), lb: el.querySelector('.lb'), lf: el.querySelector('.lf'), sig: '', left: ttl, at, w: THING_TAG.wMin, h: THING_TAG.nameH };
      this.tags.set(key, T);
    }
    T.at = at; T.left = Math.max(T.left, ttl); T.gone = false;
    if (T.sig !== sig) { T.sig = sig; this.draw(T, name, known, R); }
    return T;
  }

  hide(key) { const T = this.tags.get(key); if (!T) return; T.el.remove(); this.tags.delete(key); }

  /** The plate: the name carved (or '???'), then a row each: a label and its count, or a word in its tone. Text is set as text. */
  draw(T, name, known, rows) {
    T.plate.innerHTML = `<div class="tt-n${known ? '' : ' unk'}">${known ? esc(name) : '???'}</div>`
      + rows.map((r) => {
        const tone = r.tone ? ` style="color:${esc(r.tone)}"` : '', swatch = r.tone ? `<i class="tt-s" style="background:${esc(r.tone)}"></i>` : '';
        const val = r.value == null ? '' : r.word ? `<span class="tt-w"${tone}>${swatch}${esc(r.value)}</span>` : `<span class="tt-v">${esc(r.value)}</span>`;
        return `<div class="tt-r">${r.label ? `<span class="tt-l">${esc(r.label)}</span>` : '<span class="tt-l"></span>'}${val}</div>`;
      }).join('');
    T.w = 0; // (measured on the next placement: the plate is as wide as its widest line)
    T.h = THING_TAG.nameH + rows.length * THING_TAG.rowH + 9;
  }

  update(raw) {
    if (!this.tags.size) return;
    const cam = this.game.camera, cv = this.game.renderer?.domElement, rect = cv?.getBoundingClientRect?.();
    for (const [key, T] of this.tags) {
      if ((T.left -= raw) <= 0) {
        if (!T.gone) { T.gone = true; T.el.style.opacity = '0'; T.left = THING_TAG.fade; continue; } // (it fades out, then goes)
        this.hide(key); continue;
      }
      const p = typeof T.at === 'function' ? T.at() : T.at;
      if (!p || !cam || !rect) { T.el.style.display = 'none'; continue; }
      _v.set(p.x, p.y + THING_TAG.lift, p.z).project(cam);
      if (_v.z > 1 || _v.z < -1 || Math.abs(_v.x) > 1.05 || Math.abs(_v.y) > 1.05) { T.el.style.display = 'none'; continue; }
      if (T.el.style.display === 'none') T.el.style.display = '';
      if (!T.gone && T.el.style.opacity !== '1') T.el.style.opacity = '1'; // (faded in by its transition: set here, a frame after it was made)
      if (!T.w) { const ow = T.plate.offsetWidth; if (ow) T.w = Math.max(THING_TAG.wMin, Math.min(THING_TAG.wMax, ow)); }
      const x = rect.left + (_v.x * 0.5 + 0.5) * rect.width, y = rect.top + (-_v.y * 0.5 + 0.5) * rect.height;
      // the plate goes up and to the right of the point, or to the left where the right edge would cut it (the odds tag's layout)
      const C = THING_TAG, W = T.w || C.wMin, h = T.h, flip = x + C.run + W + 12 > rect.right, dx = flip ? -1 : 1;
      const kx = x + dx * C.run, ky = y - C.rise, px = flip ? kx - W : kx, py = Math.max(rect.top + 4, ky - h);
      T.el.style.transform = `translate(${Math.round(px)}px, ${Math.round(py)}px)`;
      const ax = x - px, ay = y - py, cx = flip ? W : 0, cy = h, b = 6;
      const d = `M${ax - b} ${ay - b + 2}V${ay - b}H${ax - b + 2}M${ax + b - 2} ${ay - b}H${ax + b}V${ay - b + 2}M${ax + b} ${ay + b - 2}V${ay + b}H${ax + b - 2}M${ax - b + 2} ${ay + b}H${ax - b}V${ay + b - 2}`
        + `M${ax + dx * b} ${ay - b}L${ax + dx * (C.run * 0.5)} ${cy}L${cx} ${cy}`;
      T.lb.setAttribute('d', d); T.lf.setAttribute('d', d);
    }
  }
}
