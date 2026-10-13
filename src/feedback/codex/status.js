// ---------------------------------------------------------------------------------------
// The Codex's STATUS shelf: who the Courier has become, at a glance. Two radar charts side by side, the seven domains' levels (1 to 99;
// "The World" at all 99) and Soul Alchemy's seven attributes (their ranks), each with its numbers beneath as stats (docs/plans/
// CLARITY.md: shown, then said). A faint outer ring on each axis is the way to the next step: EXP to the next level, an attribute's
// seasoning. Drawn on demand from game.psyche and game.alchemy, never kept in step by hand. The look is Calissa's (2026-10-13): the next
// step a dashed outline (each axis pushed out by its own progress), the domains' tips in their kiln glazes on unglazed bisque (kintsugi
// gold at "The World"), the attributes' tips in their own wheel hues over your soul colour; three faint rings, axes in ink, numbers as
// stat chips beneath and none on the chart.
//
// Prior art: the radar (spider) chart of Pro Evolution Soccer's player cards and Persona 5's social stats; OSRS's skills tab (a level
// a skill, the total at the foot); FFXIV's character window.
//
//   renderStatus(codex, host)
// ---------------------------------------------------------------------------------------
import { DOMAINS, MAX_LEVEL, expAt, toNext } from '../../progress/domains.js';
import { ATTRIBUTES } from '../../progress/alchemy.js';
import { ECON } from '../../progress/econ/table.js';
import { DOMAIN_ORDER, DOMAIN_GLAZE } from '../../progress/godpowers.js';
import { wheelSRGB } from '../../vfx/wheelcolour.js';
import { CHARMS, SOCKETS, SOCKET_AT } from '../../progress/bracelet.js';

const CSS = `
#codex .st-wrap { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; }
#codex .st-card { border: 1px solid rgba(255,178,122,.25); border-radius: 5px; padding: 12px; background: rgba(28,13,8,.35); }
#codex .st-card h3 { margin: 0 0 4px; font: 600 12px var(--f-title); letter-spacing: .24em; color: var(--accent); }
#codex .st-card .st-sum { font-size: 11px; letter-spacing: .08em; opacity: .75; margin-bottom: 6px; }
#codex .st-card .st-sum b { color: #fff1dc; font-weight: normal; font-size: 18px; margin-right: 6px; }
#codex .st-card svg { width: 100%; max-width: 440px; display: block; margin: 0 auto; }
#codex .st-grid { stroke: rgba(251,227,207,.12); fill: none; stroke-width: 1; }
#codex .st-axis { stroke: rgba(251,227,207,.35); stroke-width: 1; }
#codex .st-next { fill: none; stroke: rgba(255,241,220,.45); stroke-dasharray: 3 3; stroke-width: 1; }
#codex .st-poly { stroke-width: 1.5; }
#codex .st-label { font: 600 9px var(--f-title); letter-spacing: .12em; fill: #fbe3cf; }
#codex .st-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
#codex .st-chip { display: inline-flex; align-items: baseline; gap: 6px; padding: 3px 8px; border: 1px solid rgba(255,178,122,.25); border-radius: 3px; font-size: 11px; letter-spacing: .06em; background: rgba(28,13,8,.4); }
#codex .st-chip i { font-style: normal; display: inline-block; width: 8px; height: 8px; border-radius: 2px; align-self: center; }
#codex .st-chip b { font-weight: normal; color: #fff1dc; font-size: 13px; }
#codex .st-chip small { opacity: .55; font-size: 10px; }
#codex .st-bracelet { grid-column: 1 / -1; }
#codex .st-socket { cursor: var(--jcur-pointer, pointer); min-width: 120px; } #codex .st-socket.shut { cursor: default; opacity: .45; }
#codex .st-socket:hover:not(.shut) { border-color: var(--accent); }
#codex .st-charm.no { opacity: .45; }
`;
let styled = false;
const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;

/** A radar of `axes` ([{ name, value 0..1, next 0..1, colour }]), its rings at `rings` (0..1). */
function radar(axes, rings, fill, stroke) {
  const R = 110, C = 150, n = axes.length, pt = (i, r) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [C + Math.cos(a) * R * r, C + Math.sin(a) * R * r]; };
  const poly = (f) => axes.map((ax, i) => pt(i, Math.max(0.02, f(ax))).map((v) => v.toFixed(1)).join(',')).join(' ');
  let s = `<svg viewBox="-80 0 460 300" role="img">`; // (wide enough for the side labels)
  for (const r of rings) s += `<polygon class="st-grid" points="${axes.map((_, i) => pt(i, r).join(',')).join(' ')}"/>`;
  axes.forEach((_, i) => { const [x, y] = pt(i, 1); s += `<line class="st-axis" x1="${C}" y1="${C}" x2="${x}" y2="${y}"/>`; });
  s += `<polygon class="st-next" points="${poly((a) => a.next)}"/><polygon class="st-poly" points="${poly((a) => a.value)}" style="fill:${fill};stroke:${stroke}"/>`;
  axes.forEach((ax, i) => {
    const [x, y] = pt(i, Math.max(0.02, ax.value)), [lx, ly] = pt(i, 1.2);
    s += `<circle cx="${x}" cy="${y}" r="4" fill="${ax.colour}"/>`;
    s += `<text class="st-label" x="${lx}" y="${ly + 3}" text-anchor="${Math.abs(lx - C) < 8 ? 'middle' : lx > C ? 'start' : 'end'}">${ax.name.toUpperCase()}</text>`;
  });
  return `${s}</svg>`;
}

/** THE BRACELET (progress/bracelet.js): a socket a domain; a click puts the next charm you own in it (and then none). Under it, the
 *  charms: yours, or how each is earned. */
function bracelet(codex) {
  const g = codex.game, B = g.bracelet, c = document.createElement('div'); c.className = 'st-card st-bracelet';
  if (!B) return c;
  c.innerHTML = `<h3>THE BRACELET</h3><div class="st-sum">a charm in a domain's socket bends that domain's powers · click a socket to change it</div>`;
  const row = document.createElement('div'); row.className = 'st-chips';
  for (const s of SOCKETS) {
    const open = B.open(s), id = B.charmAt(s), G = DOMAIN_GLAZE[s], chip = document.createElement('span');
    chip.className = `st-chip st-socket${open ? '' : ' shut'}`;
    chip.innerHTML = `<i style="background:${G.b}"></i>${DOMAINS[s].name}<b>${open ? (id ? CHARMS[id].label : '·') : '—'}</b><small>${open ? '' : `opens at ${SOCKET_AT}`}</small>`;
    if (open) chip.onclick = () => { const mine = Object.keys(CHARMS).filter((k) => B.owned(k)), order = [null, ...mine], i = order.indexOf(id); B.set(s, order[(i + 1) % order.length]); codex.render(); };
    row.appendChild(chip);
  }
  const list = document.createElement('div'); list.className = 'st-chips';
  for (const [k, C] of Object.entries(CHARMS)) {
    const have = B.owned(k), A = g.achievements?.list?.find?.((x) => x.id === `charm.${k}`), chip = document.createElement('span');
    chip.className = `st-chip st-charm${have ? '' : ' no'}`; chip.title = have ? C.does : (A?.desc || C.does);
    chip.innerHTML = `${C.label}<small>${have ? C.does : 'not yet earned'}</small>`;
    list.appendChild(chip);
  }
  c.append(row, list);
  return c;
}

export function renderStatus(codex, host) {
  if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const g = codex.game, P = g.psyche, Al = g.alchemy, ranks = ECON.alchemy.ranks;
  const wrap = document.createElement('div'); wrap.className = 'st-wrap';
  // the domains: a level a domain (1..99), the way to the next level as the faint ring
  const doms = DOMAIN_ORDER.map((id) => {
    const lv = P?.level?.(id) ?? 1, exp = P?.exp?.(id) ?? 0, into = lv >= MAX_LEVEL ? 1 : (exp - expAt(lv)) / toNext(lv);
    return { id, name: DOMAINS[id].name, lv, value: lv / MAX_LEVEL, next: Math.min(1, (lv + Math.max(0, Math.min(1, into))) / MAX_LEVEL), colour: DOMAIN_GLAZE[id].b === '#f2efe6' ? DOMAIN_GLAZE[id].b : hex(DOMAIN_GLAZE[id].mark), into };
  });
  const total = doms.reduce((n, d) => n + d.lv, 0), world = doms.every((d) => d.lv >= MAX_LEVEL);
  const a = document.createElement('div'); a.className = 'st-card';
  a.innerHTML = `<h3>THE DOMAINS</h3><div class="st-sum"><b>${total}</b>total level of ${MAX_LEVEL * 7}${world ? ' · THE WORLD' : ''}</div>`
    + radar(doms, [33, 66, 99].map((l) => l / MAX_LEVEL), world ? 'rgba(212,165,60,.85)' : 'rgba(201,168,130,.35)', world ? '#d4a53c' : '#c9a882') // (unglazed bisque; kintsugi gold at The World)
    + `<div class="st-chips">${doms.map((d) => `<span class="st-chip"><i style="background:${d.colour}"></i>${d.name}<b>${d.lv}</b><small>${d.lv >= MAX_LEVEL ? 'max' : `${Math.round(d.into * 100)}% to ${d.lv + 1}`}</small></span>`).join('')}</div>`;
  // Soul Alchemy's attributes: a rank each (0..ranks), its seasoning toward the next as the faint ring
  const atts = Object.values(ATTRIBUTES).map((t) => {
    const r = Al?.rank?.(t.id) ?? 0, s = (Al?.seasoning?.(t.id) ?? 0) / 100, [cr, cg, cb] = wheelSRGB(t.hue, 0.65);
    return { id: t.id, name: t.name, r, s, value: r / ranks, next: Math.min(1, (r + s) / ranks), colour: `rgb(${Math.round(cr * 255)},${Math.round(cg * 255)},${Math.round(cb * 255)})`, does: t.does };
  });
  const soul = Al?.colour ? wheelSRGB(Al.colour.h, Al.colour.s).map((v) => Math.round(v * 255)) : [201, 168, 130]; // (your soul colour fills it: the shape is your soul)
  const b = document.createElement('div'); b.className = 'st-card';
  b.innerHTML = `<h3>SOUL ALCHEMY</h3><div class="st-sum"><b>${atts.reduce((n, t) => n + t.r, 0)}</b>ranks of ${ranks * 7}</div>`
    + radar(atts, [1 / 3, 2 / 3, 1], `rgba(${soul.join(',')},.35)`, `rgb(${soul.join(',')})`)
    + `<div class="st-chips">${atts.map((t) => `<span class="st-chip" title="${t.does}"><i style="background:${t.colour}"></i>${t.name}<b>${t.r}/${ranks}</b><small>seasoning ${Math.round(t.s * 100)}</small></span>`).join('')}</div>`;
  wrap.append(a, b, bracelet(codex));
  host.appendChild(wrap);
}
