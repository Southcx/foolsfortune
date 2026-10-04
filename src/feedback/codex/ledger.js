// ---------------------------------------------------------------------------------------
// The Codex's two record shelves: LEDGER (the achievements) and RECORDS (everything counted). Drawn on demand
// from the numbers in stats.js, never kept in step by hand.
//
// LEDGER follows the Achievements window of Final Fantasy XIV (categories down the side, a sub-group heading, points
// and a bar on every entry, hidden entries as ???) with Old School RuneScape's Combat Achievements vocabulary: a tier
// (Easy to Grandmaster) with its points, and a type (Count, Speed, Perfection, Mechanic, Stamina). RECORDS is a
// Hiscores page: lifetime totals, then personal bests with where and when, then where the time went.
// ---------------------------------------------------------------------------------------
import { CATS, TIERS, TYPES, RANKS } from '../../progress/achievements.js';
import { SPECIES, ASPECTS, TIDES } from '../../tools/sondelass/angling/species.js';
import { TIERS as CHEST_TIERS, CURIOS, TITHE, hex as tierHex } from '../../world/treasure/treasure.js';

const CSS = `
#codex .lg-head { display: flex; gap: 22px; flex-wrap: wrap; align-items: baseline; margin-bottom: 10px; font-size: 12px; letter-spacing: .08em; }
#codex .lg-head b { font-weight: normal; color: #fff1dc; font-size: 20px; letter-spacing: .04em; }
#codex .lg-head small { display: block; opacity: .6; font-size: 10px; letter-spacing: .14em; }
#codex .lg-body { display: grid; grid-template-columns: 190px 1fr; gap: 16px; }
@media (max-width: 720px) { #codex .lg-body { grid-template-columns: 1fr; } }
#codex .lg-cats { display: flex; flex-direction: column; gap: 4px; }
#codex .lg-cat { padding: 7px 10px; border: 1px solid rgba(255,178,122,.25); border-radius: 4px; cursor: var(--jcur-pointer, pointer); font-size: 12px; letter-spacing: .1em; background: rgba(28,13,8,.35); }
#codex .lg-cat.on { border-color: var(--accent); background: rgba(var(--jsel),.3); }
#codex .lg-cat span { float: right; opacity: .65; font-size: 11px; }
#codex .lg-filter { display: flex; gap: 8px; margin: 8px 0 0; font-size: 11px; letter-spacing: .1em; }
#codex .lg-filter i { font-style: normal; cursor: var(--jcur-pointer, pointer); padding: 2px 8px; border: 1px solid rgba(255,178,122,.3); border-radius: 3px; opacity: .6; }
#codex .lg-filter i.on { opacity: 1; border-color: var(--accent); }
#codex .lg-sub { font-size: 11px; letter-spacing: .24em; color: var(--accent); margin: 12px 0 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,178,122,.2); }
#codex .lg-sub:first-child { margin-top: 0; }
#codex .ach { display: grid; grid-template-columns: 34px 1fr auto; gap: 10px; align-items: center; padding: 6px 8px; margin-bottom: 4px; border: 1px solid rgba(255,178,122,.18); border-radius: 3px; background: rgba(28,13,8,.3); }
#codex .ach.done { border-color: rgba(255,212,94,.5); background: rgba(var(--jsel),.16); }
#codex .ach .pt { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #1c0d08; background: #b9a58f; }
#codex .ach .pt.t2 { background: #c9b26a; } #codex .ach .pt.t3 { background: #ffb27a; } #codex .ach .pt.t4 { background: #ff8a5c; } #codex .ach .pt.t5 { background: #e88ad0; } #codex .ach .pt.t6 { background: #9ff0ff; }
#codex .ach:not(.done) .pt { opacity: .55; }
#codex .ach .nm { font-size: 13px; letter-spacing: .06em; } #codex .ach.done .nm { color: #ffd45e; }
#codex .ach .nm em { font-style: normal; font-size: 10px; opacity: .55; letter-spacing: .12em; margin-left: 8px; }
#codex .ach .ds { font-size: 11px; opacity: .72; margin-top: 1px; }
#codex .ach .bar { margin-top: 4px; }
#codex .ach .nv { font-size: 11px; opacity: .8; text-align: right; min-width: 92px; font-variant-numeric: tabular-nums; }
#codex .ach .nv small { display: block; opacity: .6; font-size: 10px; }
#codex .rec-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
#codex .rec { border: 1px solid rgba(255,178,122,.25); border-radius: 4px; padding: 10px 12px; background: rgba(28,13,8,.3); }
#codex .rec h4 { margin: 0 0 6px; font-weight: normal; font-size: 11px; letter-spacing: .24em; color: var(--accent); }
#codex .rec .r { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; padding: 2px 0; border-bottom: 1px dotted rgba(255,178,122,.12); }
#codex .rec .r span:first-child { opacity: .8; } #codex .rec .r b { font-weight: normal; color: #fff1dc; font-variant-numeric: tabular-nums; text-align: right; }
#codex .rec .r small { opacity: .55; font-size: 10px; margin-left: 6px; }
#codex .rec .bar { margin: 2px 0 5px; }
`;

let styled = false;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const dur = (s) => (s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min` : s >= 60 ? `${Math.floor(s / 60)} min ${Math.floor(s % 60)} s` : `${s.toFixed(1)} s`);
const num = (n) => Math.round(n).toLocaleString('en-GB');
const dist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);
const at = (rec) => (rec ? `<small>${rec.at ? `${rec.at} · ` : ''}after ${dur(rec.t)}</small>` : '');

function value(a, v) {
  if (a.dir === 'down') return Number.isFinite(v) ? `${v.toFixed(2)} s` : '—';
  const r = Math.min(v, a.goal);
  const f = (x) => (a.unit === 'm' ? dist(x) : Number.isInteger(x) ? num(x) : x.toFixed(1));
  return `${f(r)} / ${f(a.goal)}${a.unit && a.unit !== 'm' ? ` ${a.unit}` : ''}`;
}

export function ensureStyle() {
  if (styled) return;
  styled = true;
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
}

export function renderLedger(codex, cx) {
  ensureStyle();
  const g = codex.game, A = g.achievements, L = g.ledger;
  const head = el('div', 'lg-head');
  const rank = A.rankName, next = RANKS.find(([p]) => p > A.points);
  head.innerHTML = `<div><small>STANDING</small><b>${rank}</b></div><div><small>POINTS</small><b>${A.points}</b> / ${A.maxPoints}${next ? `<small>${next[0] - A.points} to ${next[1]}</small>` : ''}</div>`
    + `<div><small>COMPLETE</small><b>${A.count()}</b> / ${A.list.length}</div><div><small>LOGGED</small><b>${L.firstCount()}</b><small>firsts</small></div>`
    + `<div><small>TITLES</small>${A.titles.length ? A.titles.join(' · ') : '—'}</div>`;
  cx.appendChild(head);
  const body = el('div', 'lg-body');
  const side = el('div');
  const cats = el('div', 'lg-cats');
  const all = [{ id: 'all', name: 'ALL' }, ...CATS];
  codex.lcat ||= 'all'; codex.lshow ||= 'all';
  for (const c of all) {
    const list = c.id === 'all' ? A.list : A.list.filter((a) => a.cat === c.id);
    const d = list.filter((a) => L.done[a.id]).length;
    const row = el('div', `lg-cat${codex.lcat === c.id ? ' on' : ''}`, `${c.name}<span>${d}/${list.length}</span>`);
    row.onclick = () => { codex.lcat = c.id; codex.render(); };
    cats.appendChild(row);
  }
  side.appendChild(cats);
  const fl = el('div', 'lg-filter');
  for (const [id, name] of [['all', 'ALL'], ['todo', 'TO DO'], ['done', 'DONE']]) {
    const i = el('i', codex.lshow === id ? 'on' : '', name);
    i.onclick = () => { codex.lshow = id; codex.render(); };
    fl.appendChild(i);
  }
  side.appendChild(fl);
  body.appendChild(side);

  const main = el('div');
  const cat = CATS.find((c) => c.id === codex.lcat);
  for (const c of cat ? [cat] : CATS) {
    for (const sub of c.subs) {
      const rows = A.list.filter((a) => a.cat === c.id && a.sub === sub)
        .filter((a) => codex.lshow === 'all' || (codex.lshow === 'done') === !!L.done[a.id])
        .sort((a, b) => a.tier - b.tier);
      if (!rows.length) continue;
      main.appendChild(el('div', 'lg-sub', `${cat ? '' : `${c.name} · `}${sub.toUpperCase()}`));
      for (const a of rows) {
        const done = !!L.done[a.id];
        const [v, , f] = A.progress(a);
        const hide = a.hidden && !done;
        const T0 = TIERS[a.tier];
        const row = el('div', `ach${done ? ' done' : ''}`,
          `<span class="pt t${a.tier}" title="${T0.name}">${T0.pts}</span>`
          + `<span><div class="nm">${hide ? '???' : a.name}<em>${TYPES[a.type].toUpperCase()}${a.title && !hide ? ` · TITLE: ${a.title.toUpperCase()}` : ''}</em></div>`
          + `<div class="ds">${hide ? 'A hidden achievement.' : a.desc}</div>${done ? '' : `<div class="bar"><i style="width:${Math.round(f * 100)}%"></i></div>`}</span>`
          + `<span class="nv">${done ? `DONE<small>after ${dur(L.done[a.id])}</small>` : hide ? '' : value(a, v)}</span>`);
        main.appendChild(row);
      }
    }
  }
  body.appendChild(main);
  cx.appendChild(body);
}

// ---- records: what is shown, table-driven (a new counter is one line)
const TOTALS = [
  ['Time played', (L) => dur(L.play)], ['Sessions', (L) => num(L.sessions)],
  ['Distance travelled', (L) => dist(L.get('dist.total'))], ['Climbed', (L) => dist(L.get('dist.up'))], ['Fallen', (L) => dist(L.get('dist.down'))],
  ['Jumps', (L) => `${num(L.get('move.jump'))} (${num(L.get('move.airjump'))} in the air)`], ['Falls out of the world', (L) => num(L.get('respawn.fall'))],
  ['Pots broken', (L) => num(L.get('break.total'))], ['Clapperjars defeated', (L) => num(L.get('clapper.down'))], ['Workshops cleared', (L) => num(L.get('room.cleared'))],
  ['Shots fired', (L) => `${num(L.get('shot.fired'))} · ${L.get('shot.fired') ? Math.round((100 * L.get('shot.hit')) / L.get('shot.fired')) : 0}% hit`],
  ['Shells fired', (L) => num(L.get('shell.fire'))], ['Lachryma spent', (L) => num(L.get('lach.spent'))], ['Lachryma absorbed', (L) => num(L.get('lach.gain'))],
  ['Blinks · slams · stomps', (L) => `${num(L.get('move.blink'))} · ${num(L.get('move.slam'))} · ${num(L.get('move.stomp'))}`],
  ['Parries · kicks · throws', (L) => `${num(L.get('move.parry'))} · ${num(L.get('kick.hit'))} · ${num(L.get('move.throw'))}`],
  ['Board time · distance', (L) => `${dur(L.get('time.surf'))} · ${dist(L.get('dist.state.surfer'))}`], ['Spins landed', (L) => num(L.get('surf.spins'))],
  ['Time as the hand', (L) => dur(L.get('time.god'))], ['Grabs · throws · cuts', (L) => `${num(L.get('god.grab'))} · ${num(L.get('god.throw'))} · ${num(L.get('god.cuts'))}`],
  ['Survey pulses · areas charted', (L) => `${num(L.get('map.pulse'))} · ${num(L.get('map.cells'))}`],
  ['Circuits finished · laps', (L) => `${num(L.get('circuit.finish'))} · ${num(L.get('course.lap'))}`],
];
const RECORDS = [
  ['Top speed on foot', 'speed.max', (v) => `${v.toFixed(1)} m/s`], ['Top speed on the board', 'speed.surf.max', (v) => `${v.toFixed(1)} m/s`],
  ['Longest airtime', 'air.longest', (v) => `${v.toFixed(1)} s`], ['Longest fall', 'fall.max', (v) => `${Math.round(v)} m`],
  ['Highest slam', 'slam.height', (v) => `${Math.round(v)} m`], ['Longest slide', 'slide.longest', (v) => `${Math.round(v)} m`],
  ['Longest wall run', 'wallrun.longest', (v) => `${Math.round(v)} m`], ['Longest chain', 'chain.max', (v) => `${v}`],
  ['Fastest workshop clear', 'room.clear.time', (v) => dur(v)], ['Fastest basement lap', 'course.lap.time', (v) => dur(v)],
  ['Fastest trial', 'trial.time', (v) => dur(v)], ['Best surf spin', 'surf.spin.best', (v) => `${v} turns`],
  ['Best sunder', 'god.cuts.best', (v) => `${v} at once`], ['Highest raid wave', 'god.wave.max', (v) => `${v}`],
  ['Fastest throw', 'god.throw.speed', (v) => `${v.toFixed(1)} m/s`], ['Best slice', 'shell.slice.best', (v) => `${v} at once`],
  ['Best mantle', 'mantle.height', (v) => `${v.toFixed(1)} m`], ['Fastest gate', 'course.gate.speed', (v) => `${v.toFixed(1)} m/s`],
];

export function renderRecords(codex, cx) {
  ensureStyle();
  const g = codex.game, L = g.ledger;
  const grid = el('div', 'rec-grid');
  const box = (title) => { const b = el('div', 'rec'); b.appendChild(el('h4', '', title)); grid.appendChild(b); return b; };
  const row = (b, k, v, extra = '') => b.appendChild(el('div', 'r', `<span>${k}</span><b>${v}${extra}</b>`));

  const t = box('LIFETIME');
  for (const [k, f] of TOTALS) row(t, k, f(L));

  const r = box('PERSONAL BESTS');
  for (const [k, key, f] of RECORDS) { const rec = L.rec[key]; row(r, k, rec ? f(rec.v) : '—', at(rec)); }
  const circ = [...(g.circuits?.defs?.values() || [])];
  for (const d of circ) { const rec = L.rec[`circuit.${d.id}.time`]; row(r, d.name, rec ? dur(rec.v) : '—', at(rec)); }

  // where the time went (OSRS keeps time-per-activity in its logs; the bars are shares of all the time counted)
  const states = L.under('time.state.').sort((a, b) => b[1] - a[1]);
  const tot = states.reduce((n, [, v]) => n + v, 0) || 1;
  const ts = box('WHERE THE TIME WENT');
  for (const [k, v] of states.slice(0, 14)) {
    row(ts, k.slice(11), `${dur(v)} <small>${Math.round((100 * v) / tot)}%</small>`);
    ts.appendChild(el('div', 'bar', `<i style="width:${Math.round((100 * v) / tot)}%"></i>`));
  }
  const areas = box('AREAS');
  for (const [k, v] of L.under('time.area.').sort((a, b) => b[1] - a[1])) row(areas, k.slice(10), dur(v));

  const groups = [
    ['POTS BROKEN, BY KIND', 'break.kind.'], ['CLAPPERJARS, BY CAUSE', 'clapper.cause.'], ['SHELLS FIRED, BY KIND', 'shell.fire.'],
    ['MOVEMENT ARTS, USES', 'tech.start.'], ['MOVES', 'move.'], ['LACHRYMA SPENT, BY USE', 'lach.spent.'],
  ];
  for (const [title, prefix] of groups) {
    const list = L.under(prefix).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    if (!list.length) continue;
    const b = box(title);
    for (const [k, v] of list.slice(0, 16)) row(b, k.slice(prefix.length).replaceAll('.', ' '), num(v));
  }
  cx.appendChild(grid);

  const foot = el('div', 'lg-filter');
  const wipe = el('i', '', 'ERASE THE LEDGER');
  let armed = false;
  wipe.onclick = () => {
    if (!armed) { armed = true; wipe.textContent = 'CLICK AGAIN TO ERASE'; setTimeout(() => { armed = false; wipe.textContent = 'ERASE THE LEDGER'; }, 3000); } else { L.reset(); g.achievements.rank = 0; codex.render(); }
  };
  foot.appendChild(wipe);
  cx.appendChild(foot);
}

// ---- the Angling shelf: the bestiary, after FFXIV's Fish Guide and OSRS's collection log. A slot per kind; unknown until landed,
// the entry itself opening up as you land more of it (what it is at once, what it likes after the first, where and when after three).
const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;

export function renderAngling(codex, cx) {
  ensureStyle();
  const g = codex.game, L = g.ledger;
  codex.asel ||= SPECIES[0].id;
  const landed = SPECIES.filter((s) => L.get(`fish.sp.${s.id}`) > 0).length;
  const head = el('div', 'lg-head');
  head.innerHTML = `<div><small>LANDED</small><b>${num(L.get('fish.total'))}</b></div><div><small>KINDS</small><b>${landed}</b> / ${SPECIES.length}</div>`
    + `<div><small>LARGEST</small><b>${L.best('fish.cm.max') ? Math.round(L.best('fish.cm.max')) : '—'}</b> cm</div>`
    + `<div><small>HEAVIEST</small><b>${L.best('fish.kg.max') ? L.best('fish.kg.max').toFixed(1) : '—'}</b> kg</div>`
    + `<div><small>LINES LOST</small><b>${num(L.get('angle.escape'))}</b></div><div><small>TIDE</small>${g.weir ? TIDES[g.weir.tide].name : '—'}</div>`;
  cx.appendChild(head);
  const body = el('div', 'body');
  const list = el('div', 'list');
  for (const sp of SPECIES) {
    const n = L.get(`fish.sp.${sp.id}`), cm = L.best(`fish.cm.${sp.id}`);
    const row = el('div', `row${n ? '' : ' locked'}${codex.asel === sp.id ? ' sel' : ''}`,
      `<span class="g" style="color:${n ? hex(sp.color) : 'inherit'}">${n ? '◉' : '?'}</span><span class="t"><b>${n ? sp.name.toUpperCase() : '· · ·'}</b><s>${n ? `${n} landed · best ${Math.round(cm)} cm` : 'not yet landed'}</s></span>`);
    row.onclick = () => { codex.asel = sp.id; codex.render(); };
    list.appendChild(row);
  }
  body.appendChild(list);
  const sp = SPECIES.find((s) => s.id === codex.asel), n = L.get(`fish.sp.${sp.id}`);
  const card = el('div', 'card');
  if (!n) {
    card.appendChild(el('h3', '', '· · ·'));
    card.appendChild(el('div', 'in', `TIER ${sp.tier}${sp.legend ? ' · SOMETHING ELSE' : ''}`));
    card.appendChild(el('p', 'hint', sp.legend ? 'It comes to nothing you have thought before. Perhaps to the echo of something large, at the top of the tide.' : 'Not yet landed. Cast a lure, and see what thinks it is hungry for it.'));
  } else {
    card.appendChild(el('h3', '', sp.name.toUpperCase()));
    card.appendChild(el('div', 'in', `TIER ${sp.tier} · ${n} LANDED · ${L.get(`fish.lost.${sp.id}`)} LOST`));
    card.appendChild(el('p', '', sp.blurb));
    const aff = el('div');
    aff.innerHTML = `<div class="in">DRAWN TO</div>` + sp.aff.map((a, i) => `<div style="display:flex;gap:8px;align-items:center;font-size:12px;margin:3px 0"><span style="width:88px;color:${hex(ASPECTS[i].color)}">${ASPECTS[i].glyph} ${ASPECTS[i].name}</span><span class="bar" style="flex:1;margin:0"><i style="width:${Math.round(a * 100)}%"></i></span></div>`).join('');
    card.appendChild(aff);
    // (landed three times, or photographed at it: the Veritome's bestiary knows its habits)
    const Bs = g.veritome?.book.bestiary, saw = (f) => !!Bs?.knows(`fish.${sp.id}`, f);
    const known = n >= 3, lives = known || saw('lives'), fights = known || saw('fights');
    card.appendChild(el('p', '', `<span style="color:var(--accent)">LIVES</span> · ${lives ? `${sp.depth[0]}–${sp.depth[1]} m down` : '? (land it three times, or photograph it swimming)'}<br><span style="color:var(--accent)">COMES</span> · ${lives ? sp.tides.map((t) => TIDES[t].name).join(', ') : '?'}<br><span style="color:var(--accent)">FIGHTS</span> · ${fights ? ({ drift: 'in slow swimming turns', dart: 'in quick flicks', thrash: 'in coils and thrashes: ease off at the tremble', run: 'in long runs: give it line', sweep: 'side to side: follow it', leap: 'leaping clear, and landing hard', anchor: 'by being immovable: reel steadily', legend: 'in phases: it changes as it tires' })[sp.style] : '?'}`));
    const cm = L.best(`fish.cm.${sp.id}`), kg = L.best(`fish.kg.${sp.id}`);
    card.appendChild(el('p', '', `<span style="color:var(--accent)">BEST</span> · ${Math.round(cm)} cm · ${kg ? kg.toFixed(2) : '—'} kg <span style="opacity:.6">(kinds run ${sp.size[0]}–${sp.size[1]} cm)</span>`));
  }
  body.appendChild(card);
  cx.appendChild(body);
}

/** CURIOS: the twenty things a chest can hold, by tier; a silhouette until you have it. The Tithe's odds are here too, in the open. */
export function renderCurios(codex, cx) {
  ensureStyle();
  const g = codex.game, L = g.ledger;
  codex.csel ||= CURIOS[0].id;
  const own = (c) => L.get(`curio.${c.id}`) > 0; // (found, ever: the ledger's)
  const B = g.veritome?.book, box = g.pneuka, held = (c) => { const id = `curio.${c.id}`, k = box ? box.count(id) + (box.lure === id ? 1 : 0) : 0; return B ? `${B.count(id)} in the Book${k ? ` · ${k} carried` : ''}` : `${L.get(id)} held`; };
  const head = el('div', 'lg-head');
  head.innerHTML = `<div><small>CUBES</small><b>${num(g.cubes?.balance ?? 0)}</b></div><div><small>CURIOS</small><b>${CURIOS.filter(own).length}</b> / ${CURIOS.length}</div>`
    + `<div><small>CHESTS OPENED</small><b>${num(L.get('chest.open'))}</b></div><div><small>TITHES PAID</small><b>${num(L.get('tithe.pulls'))}</b></div>`
    + `<div><small>BIGGEST CHEST</small><b>${L.best('chest.cubes.max') ? num(L.best('chest.cubes.max')) : '—'}</b></div>`;
  cx.appendChild(head);
  const body = el('div', 'body');
  const list = el('div', 'list');
  for (const t of CHEST_TIERS) {
    list.appendChild(el('div', 'lg-sub', `${t.name.toUpperCase()} <span style="opacity:.6;float:right;letter-spacing:.06em">${CURIOS.filter((c) => c.tier === CHEST_TIERS.indexOf(t) && own(c)).length}/4</span>`));
    for (const c of CURIOS.filter((c) => c.tier === CHEST_TIERS.indexOf(t))) {
      const has = own(c);
      const row = el('div', `row${has ? '' : ' locked'}${codex.csel === c.id ? ' sel' : ''}`,
        `<span class="g" style="color:${has ? tierHex(t.rgb) : 'inherit'}">${has ? c.glyph : '?'}</span><span class="t"><b>${has ? c.name.toUpperCase() : '· · ·'}</b><s>${has ? held(c) : 'not yet found'}</s></span>`);
      row.onclick = () => { codex.csel = c.id; codex.render(); };
      list.appendChild(row);
    }
  }
  body.appendChild(list);
  const c = CURIOS.find((x) => x.id === codex.csel), has = own(c), t = CHEST_TIERS[c.tier];
  const card = el('div', 'card');
  card.appendChild(el('h3', '', has ? c.name.toUpperCase() : '· · ·'));
  card.appendChild(el('div', 'in', `${t.name.toUpperCase()} CURIO${has ? ` · ${held(c).toUpperCase()}` : ''}`));
  card.appendChild(el('p', has ? '' : 'hint', has ? c.blurb : `Found in ${t.name} chests${c.tier >= 3 ? ', and rarely' : ''}. A copy the Book cannot hold is condensed into cubes.`));
  // the odds, in the open: what a sealed chest from the Tithe can be, and what the pity guarantees
  const tot = CHEST_TIERS.reduce((a, x) => a + x.weight, 0);
  const odds = el('div');
  odds.innerHTML = `<div class="in">THE TITHE · ${TITHE.cost} CUBES A PULL</div>` + CHEST_TIERS.map((x, i) => `<div style="display:flex;gap:8px;align-items:center;font-size:12px;margin:3px 0"><span style="width:88px;color:${tierHex(x.rgb)}">${x.name}</span><span class="bar" style="flex:1;margin:0"><i style="width:${Math.max(2, Math.round(x.weight / tot * 100))}%"></i></span><span style="width:92px;text-align:right;opacity:.8">${(x.weight / tot * 100).toFixed(1)}% · ${x.cubes[0]}–${x.cubes[1]}</span></div>`).join('')
    + `<p class="hint" style="margin-top:8px">Pity: ${TITHE.pity.rare} pulls without a rare or better guarantee one; ${TITHE.pity.epic} an epic; ${TITHE.pity.prismatic} a prismatic. Kept count: ${g.chests ? `rare ${g.chests.since().rare}/${TITHE.pity.rare}, epic ${g.chests.since().epic}/${TITHE.pity.epic}, prismatic ${g.chests.since().prismatic}/${TITHE.pity.prismatic}` : '—'}. Chest chance of holding a curio: ${CHEST_TIERS.map((x) => `${x.name} ${Math.round(x.curioP * 100)}%`).join(' · ')}.</p>`;
  card.appendChild(odds);
  body.appendChild(card);
  cx.appendChild(body);
}
