// ---------------------------------------------------------------------------------------
// THE ANIM LAB'S CONTROLS: the Anim Lab's window (workbench/animstage.js) in the Workbench's own idiom (its window look, its rows of
// buttons, its searchable grouped list): on the right, the tool in the hands and the others worn or not, what plays (searched, grouped:
// the stances, the tool's moves, the emotes, every clip raw), the views, what is shown (the grid, the midline, the travel, each
// overlay) and the snapshot; along the bottom, the transport (first, a frame back, play, a frame on, last, loop, the speed) and the scrub
// bar, its frame number and time, the move's strike drawn under it as a band and where the drive acted as ticks.
//
// Prior art: Unreal's Persona (the asset browser beside the viewport, the timeline and its transport under it, the speed menu),
// Blender's timeline header (the frame counter, the play buttons, the playback range).
//
//   const P = new AnimPanel(lab)   P.say(text)   P.tools()   P.list()   P.views()   P.shows()   P.transport()   P.frame()   P.scrub()
//   P.dispose()
// ---------------------------------------------------------------------------------------
import { ANIM_OVERLAYS } from './animoverlay.js';

const CSS = `
#workbench .wb.animlab { left: auto; right: 12px; width: 312px; bottom: 118px; }
#workbench .wb.animbar { left: 364px; right: 336px; top: auto; bottom: 12px; width: auto; padding: 6px 10px; }
#workbench .animlab .head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
#workbench .animlab .head b { letter-spacing: .12em; }
#workbench .animlab select { width: 100%; background: rgba(0,0,0,.4); color: inherit; border: 1px solid rgba(255,255,255,.2); padding: 3px; margin-bottom: 4px; }
#workbench .animlab .list { flex: 1 1 auto; min-height: 140px; }
#workbench .animlab .say { font-size: 11px; color: #c9a98f; min-height: 28px; margin-top: 4px; }
#workbench .animlab .fi { font: 11px/1.4 ui-monospace, monospace; color: #e8d6c0; min-height: 30px; white-space: pre-wrap; }
#workbench .animlab .row button, #workbench .animbar .row button { padding: 2px 6px; }
#workbench .row button.on { background: rgba(255,215,140,.34); border-color: rgba(255,215,140,.85); }
#workbench .animbar .scrub { position: relative; height: 24px; margin: 4px 0 2px; }
#workbench .animbar .scrub canvas { position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; }
#workbench .animbar .scrub input { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; background: transparent; }
#workbench .animbar .fr { font: 12px var(--f-sys, monospace); display: flex; justify-content: space-between; gap: 8px; }
`;

/** What the hands can hold, as the select lists it (`tool[:form]`). */
export const TOOL_KEYS = [
  ['none', 'nothing (the kick)'], ['psygun', 'the psygun'], ['sondelass:cutlass', 'the Sondelass: cutlass'], ['sondelass:rod', 'the Sondelass: rod'],
  ['sondelass:hook', 'the Sondelass: hook'], ['soulbrush', 'the Soul Brush'], ['veritome', 'the Veritome'], ['dreamvane', 'the Dreamvane'],
  ['crucibelle', 'the Crucibelle'], ['lockheart', 'the Lockheart'],
];
const VIEW_LABELS = { front: 'FRONT', side: 'SIDE', top: 'TOP', three: '3/4', free: 'FREE' };
const SPEEDS = [0.1, 0.25, 0.5, 1];

export class AnimPanel {
  constructor(lab) {
    this.lab = lab;
    const host = lab.wb?.root || document.body;
    if (!document.getElementById('animlab-css')) { const st = document.createElement('style'); st.id = 'animlab-css'; st.textContent = CSS; document.head.appendChild(st); }
    const w = (this.win = document.createElement('div')); w.className = 'wb animlab';
    w.innerHTML = `<div class="head"><b>THE ANIM LAB</b><span class="fi0"></span></div>
      <select class="tool">${TOOL_KEYS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
      <div class="row"><button data-a="others"></button><button data-a="snap" title="the frame on show: front, side, top, one PNG">SNAPSHOT</button></div>
      <input type="search" placeholder="what plays: search (stances, moves, emotes, clips)">
      <div class="list"></div>
      <div class="row views"></div>
      <div class="row shows"></div>
      <div class="fi"></div>
      <div class="say"></div>`;
    const b = (this.bar = document.createElement('div')); b.className = 'wb animbar';
    b.innerHTML = `<div class="row tr">
        <button data-a="first" title="first frame (Home)">|◀</button><button data-a="back" title="a frame back (←; Shift: ten)">◀</button>
        <button data-a="play" title="play, pause (Space)"></button><button data-a="fwd" title="a frame on (→; Shift: ten)">▶</button><button data-a="last" title="last frame (End)">▶|</button>
        <button data-a="loop"></button><span style="flex:1"></span>${SPEEDS.map((s) => `<button data-s="${s}">${s}x</button>`).join('')}</div>
      <div class="scrub"><canvas></canvas><input type="range" min="0" max="0" step="1" value="0"></div>
      <div class="fr"><span class="fno"></span><span class="ftime"></span></div>`;
    host.appendChild(w); host.appendChild(b);
    this.listEl = w.querySelector('.list'); this.search = w.querySelector('input[type=search]'); this.toolSel = w.querySelector('select.tool');
    this.range = b.querySelector('input[type=range]'); this.canvas = b.querySelector('canvas');
    this.search.addEventListener('input', () => this.list());
    this.toolSel.addEventListener('change', () => lab.setTool(this.toolSel.value));
    this.range.addEventListener('input', () => { lab.state.playing = false; lab.seek(+this.range.value); this.transport(); });
    const act = (a) => ({ others: () => lab.setOthers(!lab.state.others), snap: () => lab.snapshot(), first: () => lab.step(-1e6), back: () => lab.step(-1), play: () => lab.play(), fwd: () => lab.step(1), last: () => lab.step(1e6), loop: () => lab.setLoop(!lab.state.loop) }[a]?.());
    for (const el of [w, b]) el.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.a) act(t.dataset.a);
      else if (t.dataset.s) lab.setSpeed(+t.dataset.s);
      else if (t.dataset.v) lab.setView(t.dataset.v);
      else if (t.dataset.show) lab.toggle(t.dataset.show);
      else if (t.dataset.ov) lab.toggleOverlay(t.dataset.ov);
    });
    this.listEl.addEventListener('click', (e) => { const d = e.target.closest('div[data-id]'); if (d) lab.choose(d.dataset.id); });
    this.tools(); this.views(); this.shows(); this.transport();
  }

  say(t) { this.win.querySelector('.say').textContent = t; }

  tools() {
    const s = this.lab.state;
    this.toolSel.value = s.tool;
    this.win.querySelector('[data-a=others]').textContent = s.others ? 'OTHER TOOLS WORN' : 'OTHER TOOLS HIDDEN';
    this.win.querySelector('[data-a=others]').classList.toggle('on', s.others);
  }

  /** What plays, grouped, searched; the one chosen marked. */
  list() {
    const q = (this.search.value || '').toLowerCase(), cur = this.lab.state.playId, html = [];
    let grp = null;
    for (const p of this.lab.plays || []) {
      if (q && !p.label.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q) && !p.grp.toLowerCase().includes(q)) continue;
      if (p.grp !== grp) { grp = p.grp; html.push(`<div class="grp">${grp.toUpperCase()}</div>`); }
      html.push(`<div data-id="${p.id.replace(/"/g, '&quot;')}" class="${p.id === cur ? 'on' : ''}" title="${p.label.replace(/"/g, '&quot;')}">${p.label.replace(/</g, '&lt;')}</div>`);
    }
    this.listEl.innerHTML = html.join('');
    this.listEl.querySelector('div.on')?.scrollIntoView?.({ block: 'nearest' });
  }

  views() { this.win.querySelector('.views').innerHTML = Object.entries(VIEW_LABELS).map(([v, l]) => `<button data-v="${v}" class="${v === this.lab.state.view ? 'on' : ''}">${l}</button>`).join(''); }

  shows() {
    const s = this.lab.state, row = [['grid', 'GRID'], ['midline', 'MIDLINE'], ['travel', 'TRAVEL']].map(([k, l]) => `<button data-show="${k}" class="${s.show[k] ? 'on' : ''}">${l}</button>`);
    for (const o of ANIM_OVERLAYS.list()) row.push(`<button data-ov="${o.id}" class="${s.overlays.has(o.id) ? 'on' : ''}" title="an overlay: ${o.id}">${o.label}</button>`);
    this.win.querySelector('.shows').innerHTML = row.join('');
  }

  transport() {
    const s = this.lab.state;
    this.bar.querySelector('[data-a=play]').textContent = s.playing ? 'PAUSE' : 'PLAY';
    this.bar.querySelector('[data-a=loop]').textContent = s.loop ? 'LOOP ON' : 'LOOP OFF';
    this.bar.querySelectorAll('button[data-s]').forEach((b) => b.classList.toggle('on', +b.dataset.s === s.speed));
  }

  /** The frame on show: the counter, the time, what plays and its clip time, the strike live. */
  frame() {
    const L = this.lab, T = L.take; if (!T) return;
    const k = L.frame, I = T.info[k] || {};
    this.range.max = String(T.n - 1); this.range.value = String(k);
    this.bar.querySelector('.fno').textContent = `frame ${k} / ${T.n - 1}`;
    this.bar.querySelector('.ftime').textContent = `${(k / T.fps).toFixed(3)} s of ${((T.n - 1) / T.fps).toFixed(3)}`;
    this.win.querySelector('.fi').textContent = `${I.what || ''}${I.clip ? `  ${I.clip}` : ''}${I.t != null ? ` @ ${I.t.toFixed(3)} s` : ''}${I.strike ? '  STRIKE' : ''}`;
  }

  /** The scrub bar's marks: the strike's band, the drive's ticks, each overlay's timeline. */
  scrub() {
    const T = this.lab.take, c = this.canvas, W = (c.width = c.clientWidth || 400), H = (c.height = c.clientHeight || 24), x = c.getContext('2d');
    x.clearRect(0, 0, W, H);
    if (!T || T.n < 2) return;
    const px = (k) => 8 + ((W - 16) * k) / (T.n - 1); // (the range's thumb travels inside its own width less a thumb)
    x.fillStyle = 'rgba(255,170,90,.55)';
    for (let k = 0; k < T.n; k++) if (T.strike[k]) x.fillRect(px(k) - 1, H - 7, Math.max(2, px(k + 1) - px(k) + 1), 5);
    x.fillStyle = 'rgba(255,255,255,.8)';
    for (const k of T.marks) x.fillRect(px(k) - 1, 1, 2, 7);
    for (const tl of this.lab.timeline()) for (let k = 0; k < T.n; k++) if (tl[k] > 0.01) { x.fillStyle = `rgba(255,60,48,${0.25 + 0.7 * Math.min(1, tl[k])})`; x.fillRect(px(k) - 1, 9, Math.max(2, px(k + 1) - px(k) + 1), 5); }
  }

  dispose() { this.win.remove(); this.bar.remove(); }
}
