// ---------------------------------------------------------------------------------------
// THE GARAGE'S SHEET AND THE RUN TRACE (docs/plans/SKIFF-TUNING.md T5 and T7; Dovina's handoff, 2026-10-24): the race board's GARAGE
// (world/raceway/raceboard.js, Dovina's page) drawn as a tuning sheet in the Clay dress, and the last laps' telemetry drawn over the map.
//   THE SHEET   five sliders (Dovina's `TUNE.sliders`, progress/skifftune.js), each seven notches -3 .. +3 on a glazed groove, stock the
//               middle notch's gold tick, the worn step the knob; the minus end's words to its left and the plus end's to its right; under
//               it the keys it moves as stats (top +3%, accel -12%). Hover a notch (or step it with the arrow keys) and the stats show
//               what that step would change against what is worn, an arrow and a sign each (never colour alone), and the PI strip under
//               the sheet shows each track's PI (`game.skiffParts.pi(track)`) for that step beside the worn one. A click wears it.
//   THE TRACE   `race.traces.last` and `.prev` (samples [s, speed m/s, slip rad, sail, grip] at 10 Hz): the track's line as a map, the last
//               lap a thick strip at the line's left and the lap before a thin one at its right, each coloured by speed (dusk blue slow .. gold fast)
//               and lit ember where it slid (|slip| past 0.15 rad, the GARAGE's "sliding"); under it the speed along the lap, both laps,
//               the slides marked. Hover the map or the chart for that point's numbers.
// Prior art: Forza's and Gran Turismo's tuning sheets (a slider, the feel at each end, the numbers it moves, the PI), F-Zero GX's balance
// slider; MoTeC and Forza's telemetry (speed over distance, a lap against the last, the racing line coloured by speed).
//
//   tuneSheet(parent, { P, tracks, TUNE, tuneMult, onChange })   runTrace(parent, { traces, trackOf })   installGarageSheet()
// ---------------------------------------------------------------------------------------

const CSS = `
.gs{display:flex;flex-direction:column;gap:6px;margin:2px 0 8px;font:12px/1.25 Georgia,serif;color:#efe0c2}
.gs-row{display:grid;grid-template-columns:96px 1fr 168px 1fr;align-items:center;gap:8px;padding:6px 10px 5px;border-radius:5px;
  background:linear-gradient(180deg,rgba(58,33,72,.55),rgba(20,10,24,.65));box-shadow:inset 0 0 0 1px rgba(212,165,60,.28)}
.gs-row.shut{opacity:.45}
.gs-row b{font:700 10px/1.1 Georgia,serif;letter-spacing:.14em;text-transform:uppercase;color:#ffd36a}
.gs-end{font-size:11px;color:#cdb898}.gs-end.m{text-align:right}
.gs-track{position:relative;height:22px;outline:none;cursor:pointer}
.gs-track:focus-visible{box-shadow:0 0 0 2px rgba(255,211,106,.6);border-radius:11px}
.gs-groove{position:absolute;left:6px;right:6px;top:9px;height:4px;border-radius:2px;background:linear-gradient(180deg,#140a18,#3a2418);box-shadow:0 0 0 1px #2a140c,inset 0 1px 1px rgba(0,0,0,.6)}
.gs-notch{position:absolute;top:5px;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#6a5040,#2a140c);box-shadow:0 0 0 1px #2a140c}
.gs-notch.stock::after{content:'';position:absolute;left:5px;top:-5px;width:2px;height:22px;background:#ffd36a;opacity:.7}
.gs-notch.hov{background:radial-gradient(circle at 40% 35%,#efe0c2,#9a8068)}
.gs-knob{position:absolute;top:1px;width:20px;height:20px;margin-left:-10px;border-radius:50%;pointer-events:none;transition:left .12s;
  background:radial-gradient(circle at 38% 32%,#fff3c8,#ffd36a 45%,#a8761e);box-shadow:0 0 0 1px #2a140c,0 0 8px rgba(255,211,106,.5)}
.gs-stats{grid-column:2/5;display:flex;flex-wrap:wrap;gap:4px 10px;font-size:10.5px;color:#cdb898;min-height:13px}
.gs-stat i{font-style:normal;color:#efe0c2}.gs-stat .up{color:#9fe0a0}.gs-stat .dn{color:#ff9a7a}
.gs-pi{display:flex;flex-wrap:wrap;gap:6px;padding:2px 0}
.gs-pi span{padding:3px 9px;border-radius:10px;font:700 10px/1.2 Georgia,serif;letter-spacing:.06em;color:#2a140c;background:linear-gradient(180deg,#e9d6bc,#c9a882);box-shadow:0 0 0 1px #2a140c}
.gs-pi span em{font-style:normal;margin-left:5px}.gs-pi .up{color:#1f6a2a}.gs-pi .dn{color:#8a2a14}
.gt{display:flex;flex-direction:column;gap:4px;margin:2px 0 8px;font:11px/1.2 Georgia,serif;color:#cdb898}
.gt canvas{width:100%;border-radius:6px;box-shadow:0 0 0 1px #2a140c,0 0 0 3px rgba(212,165,60,.35);background:#140a18;cursor:crosshair}
.gt-key{display:flex;flex-wrap:wrap;gap:4px 14px}.gt-key b{color:#ffd36a;font-weight:700}
.gt-read{min-height:14px;color:#efe0c2}
`;
let styled = false;
export function installGarageSheet() {
  if (styled || typeof document === 'undefined') return;
  styled = true; const s = document.createElement('style'); s.setAttribute('data-garagesheet', ''); s.textContent = CSS; document.head.appendChild(s);
}
const pct = (k) => `${k >= 1 ? '+' : '−'}${Math.abs(Math.round((k - 1) * 100))}%`;
const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
/** A key's word on the sheet (the board's numbers as a racer says them). */
const KEY_WORD = { top: 'top speed', accel: 'pull', grip: 'grip', coast: 'coast', turn: 'turn', carveRate: 'carve', hover: 'ride height', follow: 'ground follow', wobble: 'wobble', mass: 'weight' };
/** Which way is better for each key, for the arrow's colour (the sign says the way, so colour is never alone). */
const BETTER_UP = { top: true, accel: true, grip: true, coast: true, turn: true, carveRate: true, hover: null, follow: null, wobble: false, mass: null };

/** The tune sheet: five sliders and the PI strip, drawn into `parent`. `onChange()` after a step is worn (the page redraws). */
export function tuneSheet(parent, { P, tracks = [], TUNE, tuneMult, onChange } = {}) {
  installGarageSheet();
  if (typeof document === 'undefined' || !P || !TUNE) return null;
  const root = mk('div', 'gs'), R = TUNE.range, piCache = new Map();
  const piWith = (id, v) => { // (each track's PI with one slider at v, the rest as worn: P.pi read on a sheet swapped in a moment)
    const key = `${id}:${v}:${JSON.stringify(P.sheet)}:${JSON.stringify(P.chosen)}`; if (piCache.has(key)) return piCache.get(key);
    const was = P.sheet[id]; P.sheet[id] = v; let out;
    try { out = tracks.map((T) => P.pi(T)); } finally { P.sheet[id] = was; }
    piCache.set(key, out); return out;
  };
  const worn = tracks.map((T) => P.pi(T));
  const pi = mk('div', 'gs-pi');
  const showPi = (alt) => {
    pi.innerHTML = '';
    tracks.forEach((T, i) => {
      const d = alt ? alt[i] - worn[i] : 0, s = mk('span', null, `PI ${(alt ? alt[i] : worn[i]).toFixed(1)} · ${T.name.replace(/^the /, '')}`);
      if (alt && Math.abs(d) >= 0.05) s.appendChild(mk('em', d > 0 ? 'up' : 'dn', `${d > 0 ? '▲ +' : '▼ −'}${Math.abs(d).toFixed(1)}`));
      pi.appendChild(s);
    });
  };
  for (const [id, S] of Object.entries(TUNE.sliders)) {
    const open = P.sliderOpen(id), v = P.sheet[id] || 0, row = mk('div', `gs-row${open ? '' : ' shut'}`);
    row.appendChild(mk('b', null, `${S.label} ${v > 0 ? '+' : ''}${v}`));
    row.appendChild(mk('span', 'gs-end m', S.minus));
    const tr = mk('div', 'gs-track'), groove = mk('div', 'gs-groove'), knob = mk('div', 'gs-knob'), notches = [];
    tr.appendChild(groove);
    const at = (step) => `calc(6px + (100% - 12px) * ${(step + R) / (2 * R)})`;
    for (let i = -R; i <= R; i++) { const n = mk('div', `gs-notch${i === 0 ? ' stock' : ''}`); n.style.left = at(i); tr.appendChild(n); notches.push(n); }
    knob.style.left = at(v); tr.appendChild(knob);
    row.appendChild(tr); row.appendChild(mk('span', 'gs-end', S.plus));
    const stats = mk('div', 'gs-stats'); row.appendChild(stats);
    const showStats = (step) => { // (the keys this slider moves at `step`, against what is worn when they differ)
      stats.innerHTML = '';
      for (const key of Object.keys(S.moves)) {
        const now = tuneMult({ [id]: v }, key), then = tuneMult({ [id]: step }, key);
        const st = mk('span', 'gs-stat', `${KEY_WORD[key] || key} <i>${pct(then)}</i>`);
        if (step !== v && Math.abs(then - now) > 1e-6) { const up = then > now, good = BETTER_UP[key] == null ? null : up === BETTER_UP[key]; st.appendChild(mk('span', good == null ? '' : good ? 'up' : 'dn', ` ${up ? '▲' : '▼'}`)); }
        stats.appendChild(st);
      }
      if (!open) stats.textContent = `Opens with a ${S.slot} part.`;
    };
    showStats(v);
    if (open) {
      let hov = v;
      const stepAt = (x) => { const r = tr.getBoundingClientRect(); return Math.max(-R, Math.min(R, Math.round(((x - r.left - 6) / Math.max(1, r.width - 12)) * 2 * R - R))); };
      const hover = (step) => { hov = step; notches.forEach((n, i) => n.classList.toggle('hov', i - R === step && step !== v)); showStats(step); showPi(step !== v ? piWith(id, step) : null); };
      const wear = (step) => { if (step !== v && P.setSlider(id, step)) onChange?.(); };
      tr.tabIndex = 0; tr.setAttribute('role', 'slider'); tr.setAttribute('aria-label', S.label); tr.setAttribute('aria-valuemin', -R); tr.setAttribute('aria-valuemax', R); tr.setAttribute('aria-valuenow', v);
      tr.onmousemove = (e) => { const s = stepAt(e.clientX); if (s !== hov) hover(s); };
      tr.onmouseleave = () => hover(v);
      tr.onclick = (e) => { e.stopPropagation(); wear(stepAt(e.clientX)); };
      tr.onkeydown = (e) => { // (arrows preview, Enter wears: every action by keyboard too)
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); hover(Math.max(-R, Math.min(R, hov + (e.key === 'ArrowLeft' ? -1 : 1)))); }
        else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); wear(hov); }
      };
    }
    root.appendChild(row);
  }
  showPi(null); root.appendChild(pi);
  parent.appendChild(root);
  return root;
}

// ---------------------------------------------------------------- the run trace
const SLIDE = 0.15; // (rad: the GARAGE's "sliding", the slip arc's threshold)
const lerp = (a, b, u) => a + (b - a) * u;
/** Speed's colour, dusk blue (slow) through slip cream to gold (fast); `slide` 0..1 lifts it to the ember. */
function speedColour(u, slide) {
  const A = [70, 96, 170], B = [239, 224, 194], C = [255, 211, 106], E = [255, 122, 42];
  const c = u < 0.5 ? A.map((x, i) => lerp(x, B[i], u * 2)) : B.map((x, i) => lerp(x, C[i], (u - 0.5) * 2));
  return `rgb(${c.map((x, i) => Math.round(lerp(x, E[i], slide))).join(',')})`;
}

/** The last two laps drawn: the map with both strips, and speed along the lap. */
export function runTrace(parent, { traces, trackOf } = {}) {
  installGarageSheet();
  if (typeof document === 'undefined') return null;
  const laps = [traces?.last, traces?.prev].filter((L) => L?.samples?.length);
  if (!laps.length) return null;
  const T = trackOf?.(laps[0].track); if (!T?.X) return null;
  const root = mk('div', 'gt'), dpr = Math.min(2, globalThis.devicePixelRatio || 1);
  const map = mk('canvas'), chart = mk('canvas'), read = mk('div', 'gt-read', 'Hover the map or the chart for a point\'s numbers.');
  const W = 520, MH = 300, CH = 110; for (const [c, h] of [[map, MH], [chart, CH]]) { c.width = W * dpr; c.height = h * dpr; c.style.aspectRatio = `${W} / ${h}`; }
  // the map's frame: the line's bounds, square, with a margin for the strips
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < T.N; i++) { x0 = Math.min(x0, T.X[i]); x1 = Math.max(x1, T.X[i]); z0 = Math.min(z0, T.Z[i]); z1 = Math.max(z1, T.Z[i]); }
  const sc = Math.min((W - 40) / Math.max(1, x1 - x0), (MH - 40) / Math.max(1, z1 - z0)), ox = (W - (x1 - x0) * sc) / 2, oz = (MH - (z1 - z0) * sc) / 2;
  const px = (x, z) => [ox + (x - x0) * sc, oz + (z - z0) * sc];
  const vMax = Math.max(...laps.flatMap((L) => L.samples.map((s) => s[1]))), vMin = Math.min(...laps.flatMap((L) => L.samples.map((s) => s[1])));
  const vu = (v) => (v - vMin) / Math.max(1e-3, vMax - vMin);
  const g = map.getContext('2d'); g.scale(dpr, dpr);
  g.fillStyle = '#140a18'; g.fillRect(0, 0, W, MH);
  g.strokeStyle = 'rgba(205,184,152,.25)'; g.lineWidth = 9; g.lineJoin = g.lineCap = 'round'; g.beginPath();
  for (let i = 0; i <= T.N; i++) { const [a, b] = px(T.X[i % T.N], T.Z[i % T.N]); i ? g.lineTo(a, b) : g.moveTo(a, b); }
  g.stroke();
  // each lap a strip beside the line (the last at the line's left, thick; the one before at its right, thin), a segment a sample
  laps.forEach((L, k) => {
    const off = (k ? 7 : -7), Sm = L.samples;
    g.lineWidth = k ? 3 : 4.5; g.globalAlpha = k ? 0.7 : 1;
    for (let i = 1; i < Sm.length; i++) {
      const a = T.frame(Sm[i - 1][0]), b = T.frame(Sm[i][0]); if (!a || !b || Math.hypot(b.x - a.x, b.z - a.z) > 40) continue; // (a respawn's jump)
      const n = [a.fz, -a.fx], [ax, az] = px(a.x, a.z), [bx, bz] = px(b.x, b.z), slide = Math.min(1, Math.max(0, (Math.abs(Sm[i][2]) - SLIDE) / 0.25) + (Math.abs(Sm[i][2]) > SLIDE ? 0.4 : 0));
      g.strokeStyle = speedColour(vu(Sm[i][1]), slide);
      g.beginPath(); g.moveTo(ax + n[0] * off, az + n[1] * off); g.lineTo(bx + n[0] * off, bz + n[1] * off); g.stroke();
    }
  });
  g.globalAlpha = 1;
  { const st = T.frame(T.line ?? 0); if (st) { const [a, b] = px(st.x, st.z); g.fillStyle = '#ffd36a'; g.beginPath(); g.arc(a, b, 4, 0, Math.PI * 2); g.fill(); } } // (the start, a gold dot)
  // the chart: speed along the lap, both laps; the slides as ember ticks under each
  const c2 = chart.getContext('2d'); c2.scale(dpr, dpr); c2.fillStyle = '#140a18'; c2.fillRect(0, 0, W, CH);
  const len = T.length || 1, cx = (s) => 8 + (((s - (T.line ?? 0)) % len + len) % len) / len * (W - 16), cy = (v) => CH - 18 - vu(v) * (CH - 30);
  laps.forEach((L, k) => {
    const Sm = [...L.samples].sort((a, b) => cx(a[0]) - cx(b[0]));
    c2.strokeStyle = k ? 'rgba(205,184,152,.55)' : '#ffd36a'; c2.lineWidth = k ? 1.2 : 1.8; c2.beginPath();
    Sm.forEach((s, i) => (i ? c2.lineTo(cx(s[0]), cy(s[1])) : c2.moveTo(cx(s[0]), cy(s[1])))); c2.stroke();
    c2.fillStyle = k ? 'rgba(255,122,42,.45)' : '#ff7a2a';
    for (const s of Sm) if (Math.abs(s[2]) > SLIDE) c2.fillRect(cx(s[0]) - 1, CH - (k ? 8 : 14), 2, 5);
  });
  // the numbers under the cursor
  const near = (L, s) => L.samples.reduce((b, x) => (Math.abs(x[0] - s) < Math.abs(b[0] - s) ? x : b), L.samples[0]);
  const say = (s) => { read.textContent = laps.map((L, k) => { const x = near(L, s); return `${k ? 'Lap before' : 'Last lap'}: ${x[1].toFixed(1)} m/s, slip ${(Math.abs(x[2]) * 57.3).toFixed(0)}°, sail ${Math.round(x[3] * 100)}%, grip ×${x[4].toFixed(2)}`; }).join(' · ') + ` · ${Math.round(((s - (T.line ?? 0)) % len + len) % len)} m in`; };
  map.onmousemove = (e) => { const r = map.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, z = (e.clientY - r.top) / r.height * MH; const wx = x0 + (x - ox) / sc, wz = z0 + (z - oz) / sc, hit = T.nearest?.(wx, wz); if (hit && hit.d < 60) say(hit.s ?? hit.sb ?? 0); };
  chart.onmousemove = (e) => { const r = chart.getBoundingClientRect(), u = ((e.clientX - r.left) / r.width * W - 8) / (W - 16); say((T.line ?? 0) + Math.max(0, Math.min(1, u)) * len); };
  root.appendChild(mk('div', 'gt-key', `<span><b>Thick:</b> the last lap</span><span><b>Thin:</b> the lap before</span><span>blue slow · gold fast · <b style="color:#ff7a2a">ember</b> where you slid</span><span>${vMin.toFixed(1)} .. ${vMax.toFixed(1)} m/s</span>`));
  root.append(map, chart, read);
  parent.appendChild(root);
  return root;
}
