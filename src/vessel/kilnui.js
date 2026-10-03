// ---------------------------------------------------------------------------------------
// THE KILN STATION'S WINDOW: what the Courier can fire onto their vessel, beside them as they turn in front of the kiln (moves/kiln.js
// holds them and the camera). A tab for each region (the body, the trim, the mask, the hair), the glazes they have as swatches under it
// (a click tries one on them at once), the gold in their seams, and FIRE, which costs cubes and keeps the look. The world is not paused:
// they turn, the kiln breathes. Drag on the scene or use A / D (or the arrows) to turn them; Esc or LEAVE ends it and puts back what they
// wore if it was not fired.
//
// Prior art: FFXIV's glamour plate and dye window (a part, then a swatch, previewed on the character as it turns), the colour
// pickers of Animal Crossing's Able Sisters, and the PS2 era's character-edit screens (a slow turntable and a menu at the side).
//
//   const ui = new KilnUI(game)   ui.show()   ui.hide()   ui.render()   ui.open   ui.look (the preview)   ui.spin (turn, -1..1)
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';
import { REGIONS } from './glazes.js';

const CSS = `
#kiln { position: fixed; right: 18px; top: 50%; transform: translateY(-50%); z-index: 9; display: none; width: 330px; user-select: none; }
#kiln.open { display: block; }
#kiln .px { background: rgba(42,20,13,.92); border: 1px solid rgba(255,178,122,.5); box-shadow: 0 10px 40px rgba(0,0,0,.6), inset 0 0 0 3px rgba(60,28,18,.9); padding: 14px 16px 12px; color: #f6e2c8; }
#kiln h2 { margin: 0 0 2px; font-size: 17px; letter-spacing: .22em; color: var(--accent, #ffb27a); font-weight: normal; }
#kiln .sub { font-size: 11px; opacity: .65; margin-bottom: 10px; line-height: 1.4; }
#kiln .tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 8px; }
#kiln .tab { text-align: center; font-size: 10px; letter-spacing: .14em; padding: 5px 2px 4px; border: 1px solid rgba(255,178,122,.25); border-radius: 3px; cursor: var(--jcur-pointer, pointer); }
#kiln .tab i { display: block; height: 8px; margin: 4px 6px 0; border-radius: 2px; border: 1px solid rgba(0,0,0,.4); }
#kiln .tab.on, #kiln .tab:hover { border-color: #ffd98a; background: rgba(var(--jsel),.35); }
#kiln .sw { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin: 6px 0 8px; }
#kiln .s { aspect-ratio: 1; border-radius: 50%; border: 2px solid rgba(255,241,220,.25); cursor: var(--jcur-pointer, pointer); box-shadow: inset -4px -6px 8px rgba(0,0,0,.35), inset 3px 4px 6px rgba(255,255,255,.25); }
#kiln .s:hover { border-color: #ffd98a; } #kiln .s.on { border-color: #fff1dc; box-shadow: 0 0 0 2px #ffd98a, inset -4px -6px 8px rgba(0,0,0,.35), inset 3px 4px 6px rgba(255,255,255,.25); }
#kiln .s.metal { background-image: linear-gradient(135deg, rgba(255,255,255,.45), rgba(255,255,255,0) 45%); }
#kiln .what { min-height: 46px; font-size: 12px; line-height: 1.4; } #kiln .what b { color: #ffd98a; font-weight: normal; letter-spacing: .08em; }
#kiln .gold { font-size: 10px; letter-spacing: .1em; opacity: .75; margin: 6px 0 8px; } #kiln .gold i { display: block; height: 4px; margin-top: 4px; background: rgba(255,217,138,.15); border-radius: 2px; } #kiln .gold i b { display: block; height: 100%; background: #e9b44c; border-radius: 2px; }
#kiln .row { display: flex; gap: 8px; } #kiln button { flex: 1; font: inherit; font-size: 11px; letter-spacing: .14em; color: #fff1dc; background: rgba(120,50,30,.6); border: 1px solid rgba(255,178,122,.45); padding: 6px 8px; border-radius: 3px; cursor: var(--jcur-pointer, pointer); }
#kiln button:hover { background: rgba(var(--jsel),.55); } #kiln button:disabled { opacity: .4; cursor: default; }
#kiln .hint { font-size: 10px; opacity: .5; margin-top: 8px; letter-spacing: .06em; }
#kilndrag { position: fixed; inset: 0; z-index: 8; display: none; cursor: grab; } #kilndrag.open { display: block; }
`;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;

export class KilnUI {
  constructor(game) {
    this.game = game; this.open = false; this.region = 'body'; this.spin = 0; this.drag = 0;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.root = el('div'); this.root.id = 'kiln';
    this.root.addEventListener('mousedown', (e) => e.stopPropagation());
    this.dragEl = el('div'); this.dragEl.id = 'kilndrag';
    let last = null;
    this.dragEl.addEventListener('mousedown', (e) => { e.stopPropagation(); last = e.clientX; });
    addEventListener('mousemove', (e) => { if (last != null && this.open) { this.drag += (e.clientX - last) * 0.008; last = e.clientX; } });
    addEventListener('mouseup', () => { last = null; });
    document.body.appendChild(this.dragEl); document.body.appendChild(this.root);
    this.keys = new Set();
    addEventListener('keydown', (e) => {
      if (!this.open) return;
      if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); this.onLeave?.(); return; }
      if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(e.code)) { this.keys.add(e.code); e.stopPropagation(); }
    }, true);
    addEventListener('keyup', (e) => this.keys.delete(e.code), true);
    game.theme?.watch?.(this.root, { sound: false, point: '.tab, .s, button' });
  }
  get turn() { return (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0); }

  show() {
    const V = this.game.vessel;
    this.look = { ...V.look }; this.region = 'body'; this.open = true; this.keys.clear();
    this.root.classList.add('open'); this.dragEl.classList.add('open');
    document.exitPointerLock?.();
    this.render();
  }
  hide() { this.open = false; this.root.classList.remove('open'); this.dragEl.classList.remove('open'); this.keys.clear(); }

  render() {
    if (!this.open) return;
    const g = this.game, V = g.vessel, owned = V.owned();
    this.root.replaceChildren();
    const px = el('div', 'px');
    px.appendChild(el('h2', '', 'THE KILN'));
    px.appendChild(el('div', 'sub', 'Choose a glaze for each part of the vessel, see it on you, and fire it on.'));
    const tabs = el('div', 'tabs');
    for (const r of Object.values(REGIONS)) {
      const gz = V.glaze(this.look[r.id]);
      const t = el('div', `tab${r.id === this.region ? ' on' : ''}`, `${r.name.replace('THE ', '')}<i style="background:${hex(gz?.color ?? 0)}"></i>`);
      t.onclick = () => { this.region = r.id; this.render(); };
      tabs.appendChild(t);
    }
    px.appendChild(tabs);
    const what = el('div', 'what');
    const sayGlaze = (gz) => { what.innerHTML = gz ? `<b>${gz.name}</b><br>${gz.blurb}` : `${REGIONS[this.region].blurb}`; };
    const sw = el('div', 'sw');
    for (const gz of owned) {
      const s = el('div', `s${this.look[this.region] === gz.id ? ' on' : ''}${gz.metal > 0.3 ? ' metal' : ''}`);
      s.style.background = hex(gz.color);
      s.title = gz.name;
      s.onmouseenter = () => sayGlaze(gz);
      s.onmouseleave = () => sayGlaze(V.glaze(this.look[this.region]));
      s.onclick = () => { this.look[this.region] = gz.id; V.preview(this.look); this.render(); };
      sw.appendChild(s);
    }
    px.appendChild(sw);
    sayGlaze(V.glaze(this.look[this.region]));
    px.appendChild(what);
    const share = V.kinShare(), n = g.achievements?.count?.() || 0;
    px.appendChild(el('div', 'gold', `GOLD IN THE SEAMS · ${n} mending${n === 1 ? '' : 's'}<i><b style="width:${Math.round(share * 100)}%"></b></i>`));
    const row = el('div', 'row');
    const same = Object.keys(REGIONS).every((r) => this.look[r] === V.look[r]);
    const fire = el('button', '', `FIRE · ${V.cost} CUBES`); fire.disabled = same;
    fire.onclick = () => { if (V.fire(this.look)) this.render(); };
    const leave = el('button', '', 'LEAVE (Esc)'); leave.onclick = () => this.onLeave?.();
    row.appendChild(fire);
    // the cracks refired at once (R40: they mend slowly on their own: vessel/damage.js), for cubes as many as they are deep
    const D = g.vesselDamage, worn = D?.worn || 0;
    if (worn > 0.001) {
      const cost = Math.max(1, Math.round(worn * ECON.refire * ECON.perMinute));
      const mend = el('button', '', `MEND · ${cost} CUBES`);
      mend.onclick = () => {
        if (!g.cubes?.spend(cost, 'refire')) { g.log?.say('warn', `Mending the cracks costs ${cost} cubes.`, { key: 'kiln.poormend', throttle: 2 }); return; }
        D.mendAll(); V.fireT = 1.4; g.events?.emit('vessel.refire', { cost, by: 'courier' }); this.render();
      };
      row.appendChild(mend);
    }
    row.appendChild(leave);
    px.appendChild(row);
    px.appendChild(el('div', 'hint', `drag on the scene or A / D to turn the vessel · purse ${g.cubes?.balance ?? 0} cubes · more glazes come from achievements and from good photographs`));
    this.root.appendChild(px);
  }
}
