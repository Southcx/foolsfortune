// ---------------------------------------------------------------------------------------
// ODDS TAGS: the world's chances pinned to the thing they belong to, as the overlay's tag (docs/plans/OVERLAY.md 8; GLOSSARY, "an odds
// tag"), for True Odds (Divination's rung at 60, Dovina's courier/domainarts/depth.js): a chest's tier odds, the Lockheart's wheel, a
// duel's flee, a crystal's shard chance. The odds are Dovina's (her tables); this is only the place to show them. The look here is a
// placeholder (one canvas sprite a tag, the System's type, a row a chance), Calissa's to dress; the call stays.
//
// A tag lives while it is asked for: `show` each frame it should stand (or once with `ttl`), gone `ttl` real s after the last ask.
// It never narrates: what happened goes to the log. No words beyond the rows' own labels.
//
// Prior art: XCOM's hit chance over the target; Fire Emblem's forecast; Watch Dogs' tag on the thing (vfx/creaturetags.js's leader).
//
//   game.oddsTags = new OddsTags(game)   .show(key, { at: Vector3 | () => Vector3, rows: [{ label, p (0..1) }], ttl? })   .hide(key)
//   .update(rawDt) (boot/frame.js)   .list -> the keys standing   ODDS_TAG (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FONT } from '../ui/theme.js';

/** Its size (m a row, m wide), its lift over the point (m), the seconds a tag stands after its last ask, the canvas (px a row, px wide),
 *  and the most rows drawn. */
export const ODDS_TAG = { rowH: 0.26, w: 1.6, lift: 0.4, ttl: 0.25, px: 32, cw: 256, rows: 6 };

const pct = (p) => `${Math.round(Math.max(0, Math.min(1, p)) * 1000) / 10}%`;

export class OddsTags {
  constructor(game) { this.game = game; this.tags = new Map(); }

  get list() { return [...this.tags.keys()]; }

  show(key, { at, rows = [], ttl = ODDS_TAG.ttl } = {}) {
    const g = this.game; if (!g.scene || !at) return null;
    let T = this.tags.get(key);
    const R = rows.slice(0, ODDS_TAG.rows), sig = R.map((r) => `${r.label}:${pct(r.p)}`).join('|');
    if (!T) {
      const cv = document.createElement('canvas'); cv.width = ODDS_TAG.cw; cv.height = ODDS_TAG.px * ODDS_TAG.rows;
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, toneMapped: false, fog: false }));
      sprite.name = 'odds.tag'; sprite.renderOrder = 20; g.scene.add(sprite);
      T = { cv, tex, sprite, sig: '', left: ttl, at };
      this.tags.set(key, T);
    }
    T.at = at; T.left = ttl;
    if (T.sig !== sig) { T.sig = sig; this.draw(T, R); }
    return T;
  }

  hide(key) { const T = this.tags.get(key); if (!T) return; this.game.scene?.remove(T.sprite); T.tex.dispose(); T.sprite.material.dispose(); this.tags.delete(key); }

  draw(T, rows) {
    const C = ODDS_TAG, x = T.cv.getContext('2d'), n = Math.max(1, rows.length);
    x.clearRect(0, 0, T.cv.width, T.cv.height);
    x.fillStyle = 'rgba(13,10,18,0.86)'; x.fillRect(0, 0, C.cw, C.px * n);
    x.font = `${Math.round(C.px * 0.7)}px ${FONT.sys}`; x.textBaseline = 'middle';
    rows.forEach((r, i) => {
      const y = C.px * (i + 0.5);
      x.fillStyle = '#e8e2f0'; x.textAlign = 'left'; x.fillText(String(r.label), 8, y);
      x.fillStyle = '#ffd36a'; x.textAlign = 'right'; x.fillText(pct(r.p), C.cw - 8, y);
    });
    T.n = n; T.tex.needsUpdate = true;
    T.sprite.material.map.repeat.set(1, n / C.rows); T.sprite.material.map.offset.set(0, 1 - n / C.rows);
    T.sprite.scale.set(C.w, C.rowH * n, 1);
  }

  update(raw) {
    if (!this.tags.size) return;
    for (const [key, T] of this.tags) {
      if ((T.left -= raw) <= 0) { this.hide(key); continue; }
      const p = typeof T.at === 'function' ? T.at() : T.at; if (!p) continue;
      T.sprite.position.set(p.x, p.y + ODDS_TAG.lift + ODDS_TAG.rowH * (T.n || 1) * 0.5, p.z);
    }
  }
}
