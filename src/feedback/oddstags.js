// ---------------------------------------------------------------------------------------
// ODDS TAGS: the world's chances pinned to the thing they belong to, as the overlay's tag (docs/plans/OVERLAY.md 8; GLOSSARY, "an odds
// tag"), for True Odds (Divination's rung at 60, Dovina's courier/domainarts/depth.js): a chest's tier odds, the Lockheart's wheel, a
// duel's flee, a crystal's shard chance. The odds are Dovina's (her tables); this is only the place to show them. The call is Petra's;
// the look Calissa's, in the house's tag grammar (vfx/creaturetags.js, THE SCAN): a bracket closed on the point, a dashed leader up to a
// small hex-cornered plate of ink, and on it a row a chance: its label in the readout's green, a bar filled to its chance on a dark
// track, its percent in the count face lit in the VFD's glow. It is drawn in the page over the canvas (after the grade: the sand under
// it never lifts its ink to grey) and hides with the HUD (F2, `#hud`).
//
// A tag lives while it is asked for: `show` each frame it should stand (or once with `ttl`), gone `ttl` real s after the last ask.
// It never narrates: what happened goes to the log. No words beyond the rows' own labels.
//
// Prior art: XCOM's hit chance over the target; Fire Emblem's forecast; Watch Dogs' tag on the thing (vfx/creaturetags.js's leader and
// count face, VFD tubes for the counts).
//
//   game.oddsTags = new OddsTags(game)   .show(key, { at: Vector3 | () => Vector3, rows: [{ label, p (0..1) }], ttl? })   .hide(key)
//   .update(rawDt) (boot/frame.js)   .list -> the keys standing   ODDS_TAG (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FONT } from '../ui/theme.js';

/** Its lift over the point (m), the seconds a tag stands after its last ask, the most rows drawn, and the plate's layout (CSS px): the
 *  leader's rise and run, the plate's width, a row's height, the bar's width. */
export const ODDS_TAG = { lift: 0.4, ttl: 0.25, rows: 6, rise: 34, run: 22, w: 196, rowH: 18, bar: 54 };

const INK = 'rgba(13,10,18,0.9)', VFD = '#7dffd2', VFD_GLOW = 'rgba(60,255,190,.85)', LAB = '#8fd8b0';
const pct = (p) => `${Math.round(Math.max(0, Math.min(1, p)) * 1000) / 10}%`;
const _v = new THREE.Vector3();

const CSS = `
#hud .ot{position:absolute;left:0;top:0;pointer-events:none;z-index:4;will-change:transform}
#hud .ot svg{position:absolute;left:0;top:0;overflow:visible}
#hud .ot .ot-p{position:absolute;width:${ODDS_TAG.w}px;padding:5px 8px 6px;box-sizing:border-box;background:${INK};
  clip-path:polygon(7px 0,calc(100% - 7px) 0,100% 7px,100% calc(100% - 7px),calc(100% - 7px) 100%,7px 100%,0 calc(100% - 7px),0 7px);
  box-shadow:inset 0 0 0 1px rgba(125,255,210,.35)}
#hud .ot .ot-r{display:flex;align-items:center;gap:6px;height:${ODDS_TAG.rowH}px}
#hud .ot .ot-l{flex:1;min-width:0;font:11px ${FONT.sys};letter-spacing:.06em;text-transform:uppercase;color:${LAB};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#hud .ot .ot-b{width:${ODDS_TAG.bar}px;height:4px;background:#0b3d2a;box-shadow:inset 0 0 0 1px rgba(0,0,0,.5)}
#hud .ot .ot-b i{display:block;height:100%;background:${VFD};box-shadow:0 0 4px ${VFD_GLOW}}
#hud .ot .ot-v{width:44px;text-align:right;font:15px/1 'Jersey 15',${FONT.sys};color:${VFD};text-shadow:0 0 4px ${VFD_GLOW}}
`;

export class OddsTags {
  constructor(game) { this.game = game; this.tags = new Map(); }

  get list() { return [...this.tags.keys()]; }

  show(key, { at, rows = [], ttl = ODDS_TAG.ttl } = {}) {
    if (!at || typeof document === 'undefined') return null;
    const host = document.getElementById('hud') || document.body; if (!host) return null;
    if (!document.getElementById('oddstags-css')) { const st = document.createElement('style'); st.id = 'oddstags-css'; st.textContent = CSS; document.head.appendChild(st); }
    let T = this.tags.get(key);
    const R = rows.slice(0, ODDS_TAG.rows), sig = R.map((r) => `${r.label}:${pct(r.p)}`).join('|');
    if (!T) {
      const el = document.createElement('div'); el.className = 'ot'; el.dataset.key = key;
      el.innerHTML = '<svg width="1" height="1"><path class="lb" fill="none" stroke="#0d0a12" stroke-width="3"/><path class="lf" fill="none" stroke="' + VFD + '" stroke-width="1.2" stroke-dasharray="3 3"/></svg><div class="ot-p"></div>';
      host.appendChild(el);
      T = { el, plate: el.querySelector('.ot-p'), lb: el.querySelector('.lb'), lf: el.querySelector('.lf'), sig: '', left: ttl, at };
      this.tags.set(key, T);
    }
    T.at = at; T.left = ttl;
    if (T.sig !== sig) { T.sig = sig; this.draw(T, R); }
    return T;
  }

  hide(key) { const T = this.tags.get(key); if (!T) return; T.el.remove(); this.tags.delete(key); }

  /** The plate's rows: a label, a bar filled to its chance, its percent in the count face. */
  draw(T, rows) {
    T.plate.innerHTML = rows.map((r) => `<div class="ot-r"><span class="ot-l"></span><span class="ot-b"><i style="width:${(Math.max(0, Math.min(1, r.p)) * 100).toFixed(1)}%"></i></span><span class="ot-v">${pct(r.p)}</span></div>`).join('');
    T.plate.querySelectorAll('.ot-l').forEach((s, i) => { s.textContent = String(rows[i].label); }); // (labels as text: never markup)
    T.h = rows.length * ODDS_TAG.rowH + 11;
  }

  update(raw) {
    if (!this.tags.size) return;
    const cam = this.game.camera, cv = this.game.renderer?.domElement, rect = cv?.getBoundingClientRect?.();
    for (const [key, T] of this.tags) {
      if ((T.left -= raw) <= 0) { this.hide(key); continue; }
      const p = typeof T.at === 'function' ? T.at() : T.at;
      if (!p || !cam || !rect) { T.el.style.display = 'none'; continue; }
      _v.set(p.x, p.y + ODDS_TAG.lift, p.z).project(cam);
      if (_v.z > 1 || _v.z < -1) { T.el.style.display = 'none'; continue; }
      const x = rect.left + (_v.x * 0.5 + 0.5) * rect.width, y = rect.top + (-_v.y * 0.5 + 0.5) * rect.height;
      // the plate goes up and to the right of the point, or to the left where the right edge would cut it
      const C = ODDS_TAG, flip = x + C.run + C.w + 12 > rect.right, dx = flip ? -1 : 1, h = T.h || C.rowH;
      const kx = x + dx * C.run, ky = y - C.rise, px = flip ? kx - C.w : kx, py = Math.max(rect.top + 4, ky - h);
      T.el.style.display = '';
      T.el.style.transform = `translate(${Math.round(px)}px, ${Math.round(py)}px)`;
      T.plate.style.left = '0px'; T.plate.style.top = '0px';
      // the bracket on the point and the leader up to the plate's near corner, in the tag's own frame
      const ax = x - px, ay = y - py, cx = flip ? C.w : 0, cy = h, b = 7;
      const d = `M${ax - b} ${ay - b + 2}V${ay - b}H${ax - b + 2}M${ax + b - 2} ${ay - b}H${ax + b}V${ay - b + 2}M${ax + b} ${ay + b - 2}V${ay + b}H${ax + b - 2}M${ax - b + 2} ${ay + b}H${ax - b}V${ay + b - 2}`
        + `M${ax + dx * b} ${ay - b}L${ax + dx * (C.run * 0.5)} ${cy}L${cx} ${cy}`;
      T.lb.setAttribute('d', d); T.lf.setAttribute('d', d);
    }
  }
}
