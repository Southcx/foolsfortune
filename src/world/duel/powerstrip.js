// ---------------------------------------------------------------------------------------
// THE DUEL'S POWERS ON THE DESK (South, 2026-11-16: "no UI indication of godhand power selected"). In a PvE duel on the desk the god
// hand's seven powers (progress/duel/powers.js `powersOf`) stand as a row of tiles along the foot of the view, each its domain's icon in
// its glaze, its key (1 to 7), its label and its cost; the armed one lifted and ringed gold, one not ready dimmed with its rest left as
// pips. On touch the duel screen's own power tiles do this (ui/touch/duelscreen.js); this row is the desk's, read from the session only.
// A placeholder look in the Clay dress's colours: Calissa's to dress (docs/handoffs/calissa/).
//
// Prior art: the touch duel's power tiles (ui/touch/actioncontext.js powerTiles), an MMO's hotbar (a key a slot, the armed one lit).
//
//   new DuelPowerStrip(game)   .update()  (the session's update calls it)   .hide()
// ---------------------------------------------------------------------------------------
import { powersOf } from '../../progress/duel/powers.js';
import { DOMAIN_LOOK } from '../../ui/domainlook.js';
import { iconEl } from '../../ui/icons/icons.js';

const CSS = `
#duelpowers{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:8px;z-index:40;pointer-events:none;font:600 10px/1.1 'Cinzel',Georgia,serif;letter-spacing:.08em}
#duelpowers .dp{position:relative;width:62px;padding:6px 4px 5px;border-radius:7px;background:linear-gradient(#5a3424,#2c160e);border:1px solid #8a5a3a;
  color:#f0dcc0;text-align:center;box-shadow:inset 0 1px 0 rgba(255,230,190,.25),0 2px 6px rgba(0,0,0,.5);transition:transform .12s,box-shadow .12s,opacity .12s}
#duelpowers .dp .uicon{display:block;margin:0 auto 3px}
#duelpowers .dp .k{position:absolute;left:4px;top:3px;color:#ffd36a;font-size:9px}
#duelpowers .dp .c{position:absolute;right:4px;top:3px;color:#cfe6ff;font-size:9px}
#duelpowers .dp .l{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#duelpowers .dp .r{display:block;height:3px;margin-top:3px;letter-spacing:0;color:#ffb27a;font-size:8px}
#duelpowers .dp.dim{opacity:.38}
#duelpowers .dp.on{transform:translateY(-8px);border-color:#ffd36a;box-shadow:0 0 0 2px #ffd36a,0 0 14px rgba(255,211,106,.7),inset 0 1px 0 rgba(255,240,200,.4)}
`;

export class DuelPowerStrip {
  constructor(game) { this.game = game; this.el = null; this.key = ''; }
  build() {
    if (this.el) return;
    if (!document.getElementById('duelpowers-css')) { const s = document.createElement('style'); s.id = 'duelpowers-css'; s.textContent = CSS; document.head.appendChild(s); }
    this.el = document.createElement('div'); this.el.id = 'duelpowers'; document.body.appendChild(this.el);
  }
  /** Drawn from the session as it stands: shown only in a PvE duel on the desk. */
  update() {
    const D = this.game.duel, s = D?.active ? D.state : null;
    if (!s || s.style !== 'pve' || this.game.hudLayout?.touch) return this.hide();
    const ps = powersOf(s, 0); if (!ps.length) return this.hide();
    const key = ps.map((P) => `${P.id}${P.ready ? 1 : 0}${P.left}${P.cost}`).join('|') + `|${D.armedPower}|${D.mine ? 1 : 0}`;
    this.build(); this.el.style.display = '';
    if (key === this.key) return; this.key = key;
    this.el.textContent = '';
    ps.forEach((P, i) => {
      const L = DOMAIN_LOOK[P.domain] || {}, t = document.createElement('div');
      t.className = 'dp' + (D.armedPower === P.id ? ' on' : '') + (!D.mine || !P.ready ? ' dim' : '');
      t.style.background = `linear-gradient(${L.colours?.body || '#5a3424'}44,#2c160e 70%)`;
      const icon = P.id === 'kindle' || P.id === 'absorb' ? `godart.${P.id}` : L.icon;
      if (icon) t.appendChild(iconEl(icon, { pal: L.pal || 'gold', px: 2 }));
      const k = document.createElement('span'); k.className = 'k'; k.textContent = String(i + 1); t.appendChild(k);
      const c = document.createElement('span'); c.className = 'c'; c.textContent = String(P.cost); t.appendChild(c);
      const l = document.createElement('span'); l.className = 'l'; l.textContent = P.label.toUpperCase(); t.appendChild(l);
      const r = document.createElement('span'); r.className = 'r'; r.textContent = P.left ? '•'.repeat(P.left) : P.used ? 'USED' : ''; t.appendChild(r);
      this.el.appendChild(t);
    });
  }
  hide() { if (this.el) this.el.style.display = 'none'; this.key = ''; }
}
