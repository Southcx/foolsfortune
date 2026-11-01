// ---------------------------------------------------------------------------------------
// THE CODEX'S GOD ARTS SHELF: a page for each domain (South, 2026-11-01: "the God Arts section in the Codex needs a UI overhaul for
// readability ... give each domain a sub-page within the tab"). A domain's page is its ladder read top to bottom (progress/domainladder.js:
// a milestone every ten levels), each step a power, a rung, a trait, the epic or the summit, in one of four states: yours, the next one,
// ahead, or still to come (not built yet). Click a step and its card opens beside the ladder: a power's is the arts' card (codex.js
// renderCard: its two ways and its variants); a rung's says what it does, its kind, its two ways and its traits; a trait's, its rung and
// its two ways. The page is Dovina's (its `ga-*` classes); its look is Calissa's to dress (docs/handoffs/calissa/), and until then it
// wears the Codex's own tablets. Read from game.psyche, game.domainArts and the System on every draw, never kept in step by hand.
// Prior art: Old School RuneScape's skill guides (a skill's every unlock by level, in one scrolling list, the ones you have ticked);
// FFXIV's job guide (actions and traits by level); Path of Exile's ascendancy page (a tree you read before you climb it).
//
//   renderGodArts(codex, cx)   codex.godDomain (which page)   codex.godStep (which step's card)
// ---------------------------------------------------------------------------------------
import { DOMAINS, levelOf, expAt } from '../../progress/domains.js';
import { DOMAIN_ARTS, FEAT_WORDS } from '../../progress/domainarts.js';
import { ladderOf, nextMilestone, traitOpen, traitsOf, featTimes, TRAITS, KIND_WORDS, QUESTIONS } from '../../progress/domainladder.js';
import { BY_ID } from '../../progress/skills.js';
import { DOMAIN_LOOK } from '../../ui/domainlook.js';
import { iconEl } from '../../ui/icons/icons.js';

const CSS = `
#codex .ga-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 12px; }
#codex .ga-tab { display: flex; align-items: center; gap: 6px; padding: 4px 10px 4px 6px; border: 1px solid rgba(255,178,122,.3); border-radius: 3px; cursor: var(--jcur-pointer, pointer); font-size: 11px; letter-spacing: .12em; }
#codex .ga-tab b { font-weight: normal; } #codex .ga-tab s { text-decoration: none; opacity: .6; }
#codex .ga-tab.on { border-color: var(--ga-c, var(--accent)); background: rgba(var(--jsel),.3); }
#codex .ga-head { display: grid; grid-template-columns: auto 1fr auto; gap: 4px 14px; align-items: center; padding: 10px 12px; border: 1px solid var(--ga-c, rgba(255,178,122,.4)); border-radius: 3px; margin-bottom: 12px; }
#codex .ga-head h3 { margin: 0; font-size: 18px; letter-spacing: .2em; font-weight: normal; color: #fff1dc; }
#codex .ga-head .q { font-style: italic; opacity: .75; font-size: 12px; }
#codex .ga-head .lv { font-size: 24px; color: var(--ga-c, var(--accent)); text-align: right; } #codex .ga-head .lv small { display: block; font-size: 10px; letter-spacing: .14em; opacity: .7; color: #fff1dc; }
#codex .ga-head .bar { grid-column: 1 / -1; height: 4px; background: rgba(28,13,8,.8); } #codex .ga-head .bar i { display: block; height: 100%; background: var(--ga-c, var(--accent)); }
#codex .ga-head .nx { grid-column: 1 / -1; font-size: 11px; opacity: .85; }
#codex .ga-body { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 14px; align-items: start; }
#codex .ga-ladder { list-style: none; margin: 0; padding: 0; position: relative; }
#codex .ga-ladder::before { content: ''; position: absolute; left: 21px; top: 6px; bottom: 6px; width: 2px; background: rgba(255,178,122,.2); }
#codex .ga-step { display: grid; grid-template-columns: 44px 1fr; gap: 0 10px; padding: 5px 6px 5px 0; cursor: var(--jcur-pointer, pointer); position: relative; }
#codex .ga-step .at { text-align: center; font-size: 13px; line-height: 22px; width: 30px; height: 22px; margin-left: 7px; border: 1px solid rgba(255,178,122,.35); border-radius: 11px; background: #2a140d; position: relative; z-index: 1; }
#codex .ga-step.cont .at { visibility: hidden; }
#codex .ga-step .t b { font-weight: normal; letter-spacing: .1em; color: #fff1dc; } #codex .ga-step .t u { text-decoration: none; font-size: 9px; letter-spacing: .18em; opacity: .6; margin-left: 8px; }
#codex .ga-step .t small { display: block; font-size: 11px; opacity: .7; }
#codex .ga-step.got .at { background: var(--ga-c, var(--accent)); color: #fff1dc; text-shadow: 0 0 2px #1c0d08, 0 1px 1px #1c0d08; border-color: transparent; }
#codex .ga-step.next .at { border-color: var(--ga-c, var(--accent)); box-shadow: 0 0 0 2px rgba(255,241,220,.25); }
#codex .ga-step.ahead .t { opacity: .7; } #codex .ga-step.planned .t { opacity: .45; } #codex .ga-step.planned .at { border-style: dashed; }
#codex .ga-step.sel { background: rgba(var(--jsel),.25); }
#codex .ga-card { border: 1px solid rgba(255,178,122,.35); border-radius: 3px; padding: 12px; }
#codex .ga-card h4 { margin: 0 0 4px; font-weight: normal; letter-spacing: .16em; color: #fff1dc; } #codex .ga-card .k { font-size: 10px; letter-spacing: .2em; color: color-mix(in srgb, var(--ga-c, var(--accent)) 55%, #fff1dc); }
#codex .ga-card p { font-size: 12px; margin: 8px 0; } #codex .ga-card .way span:last-child { white-space: nowrap; } #codex .ga-card .way { font-size: 11px; display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; }
#codex .ga-card .way.done { color: #fff1dc; } #codex .ga-card .way.done span:first-child::before { content: '\\2713  '; color: var(--ga-c, var(--accent)); }
@media (max-width: 640px) { #codex .ga-body { grid-template-columns: 1fr; } }
@media (max-height: 480px) { #codex .ga-tab:not(.on) b { display: none; } #codex .ga-tabs { flex-wrap: nowrap; overflow-x: auto; } #codex .ga-head { padding: 6px 10px; } #codex .ga-head h3 { font-size: 14px; } #codex .ga-head .lv { font-size: 18px; } #codex .ga-card { position: sticky; top: 0; } }
`;
let styled = false;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
const ten = (at) => (at <= 1 ? 1 : at >= 99 ? 99 : Math.ceil(at / 10) * 10);

/** A step's state: yours, the next ten's, ahead, or not built yet. */
function stateOf(g, r, level, next) {
  if (!r.built) return 'planned';
  const A = g.domainArts, L = g.ledger, lv = g.psyche?.level ? (d) => g.psyche.level(d) : null;
  const got = r.kind === 'rung' ? !!A?.open?.(r.id) : r.kind === 'trait' ? traitOpen(r.id, L, lv) && !!A?.open?.(TRAITS[r.id].of) : r.kind === 'start' ? true : !!g.system?.has?.(r.id);
  if (got) return 'got';
  return next && ten(r.at) === next.at ? 'next' : 'ahead';
}

/** Two ways, each with how near it is. */
function ways(card, rows) {
  for (const [label, have, of] of rows) card.appendChild(el('div', `way${have >= of ? ' done' : ''}`, `<span>${label}</span><span>${Math.min(have, of)} / ${of}</span>`));
}

function stepCard(codex, host, g, r) {
  host.innerHTML = '';
  if (r.kind === 'power' || r.kind === 'start' || r.kind === 'epic') { // (the arts' own card: its ways and variants)
    if (BY_ID[r.id]) { codex.cardHost = host; codex.sel = r.id; codex.renderCard(); return; }
  }
  const card = el('div', 'ga-card'), D = DOMAINS[r.domain], L = g.ledger, lvOf = (d) => g.psyche?.level?.(d) ?? levelOf(L?.get?.(`exp.${d}`) || 0);
  card.appendChild(el('div', 'k', `${KIND_WORDS[r.kind].toUpperCase()} · LEVEL ${r.at}`));
  card.appendChild(el('h4', '', r.label.toUpperCase()));
  card.appendChild(el('p', '', cap(r.line)));
  if (!r.built) { card.appendChild(el('p', '', 'Still to come: designed, not yet built.')); host.appendChild(card); return; }
  if (r.kind === 'rung') {
    const A = DOMAIN_ARTS[r.id], P = g.domainArts?.progress?.(r.id), [feat, n] = A.feat;
    card.appendChild(el('p', '', A.how));
    card.appendChild(el('div', 'k', A.kind === 'action' ? 'ACTION · WORN ON THE ART KEY' : 'ALWAYS ON · HOLDS A NOTCH'));
    ways(card, [[`${D.name} level`, P?.level ?? lvOf(A.domain), A.level], [FEAT_WORDS[feat] || feat, P?.done ?? 0, n]]);
    for (const t of traitsOf(r.id)) { const T = TRAITS[t]; card.appendChild(el('p', '', `<span class="k">LEVEL ${T.at} · ${T.label.toUpperCase()}</span><br>${T.line}`)); }
  } else if (r.kind === 'trait') {
    const T = TRAITS[r.id], A = DOMAIN_ARTS[T.of], [feat, n] = A.feat;
    card.appendChild(el('p', '', `It makes ${A.label} stronger, while ${A.label} is yours.`));
    ways(card, [[`${D.name} level`, lvOf(T.domain), T.at], [`${FEAT_WORDS[feat] || feat} (${featTimes(r.id)} times ${A.label}'s)`, L?.get?.(`domain.feat.${feat}`) || 0, n * featTimes(r.id)]]);
  }
  host.appendChild(card);
}

export function renderGodArts(codex, cx) {
  if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const g = codex.game, ids = Object.keys(DOMAINS), lv = (d) => g.psyche?.level?.(d) ?? levelOf(g.ledger?.get?.(`exp.${d}`) || 0);
  const d = (codex.godDomain = ids.includes(codex.godDomain) ? codex.godDomain : ids[0]), look = DOMAIN_LOOK[d], level = lv(d), next = nextMilestone(d, level), real = nextMilestone(d, level, { built: true });
  const wrap = el('div', 'ga'); wrap.style.setProperty('--ga-c', look.colours.body);
  wrap.dataset.domain = d;

  const tabs = el('nav', 'ga-tabs');
  for (const id of ids) {
    const t = el('span', `ga-tab${id === d ? ' on' : ''}`, `<i></i><b>${DOMAINS[id].name.toUpperCase()}</b><s>${lv(id)}</s>`);
    t.style.setProperty('--ga-c', DOMAIN_LOOK[id].colours.body); t.dataset.domain = id;
    t.querySelector('i').appendChild(iconEl(DOMAIN_LOOK[id].icon, { pal: DOMAIN_LOOK[id].pal, px: 1 }));
    t.onclick = () => { codex.godDomain = id; codex.godStep = null; codex.render(); };
    tabs.appendChild(t);
  }
  wrap.appendChild(tabs);

  const page = el('section', 'ga-page');
  const head = el('header', 'ga-head');
  const ic = el('i'); ic.appendChild(iconEl(look.icon, { pal: look.pal, px: 2 }));
  const top = level >= 99, lo = expAt(level), hi = top ? lo : expAt(level + 1), have = g.ledger?.get?.(`exp.${d}`) || 0;
  const frac = top ? 1 : Math.max(0, Math.min(1, (have - lo) / Math.max(1, hi - lo)));
  head.append(ic, el('div', '', `<h3>${DOMAINS[d].name.toUpperCase()}</h3><div class="q">${QUESTIONS[d]}</div>`), el('div', 'lv', `${level}<small>LEVEL</small>`));
  head.appendChild(el('div', 'bar', `<i style="width:${(frac * 100).toFixed(1)}%"></i>`));
  const said = (m) => `at ${m.at}: ${m.rows.map((r) => `${r.label} (${KIND_WORDS[r.kind].toLowerCase()})`).join(', ')}`;
  head.appendChild(el('div', 'nx', real ? `Next ${said(real)}${next && next.at < real.at ? `. Still to come ${said(next)}` : ''}.` : next ? `Still to come ${said(next)}.` : 'Every milestone reached.'));
  page.appendChild(head);

  const body = el('div', 'ga-body'), list = el('ol', 'ga-ladder'), host = el('div');
  const rows = ladderOf(d); let lastTen = null, sel = rows.find((r) => r.id === codex.godStep) || real?.rows[0] || next?.rows[0] || rows[0];
  const steps = [];
  for (const r of rows) {
    const t = ten(r.at), st = stateOf(g, r, level, real);
    const li = el('li', `ga-step ${st}${t === lastTen ? ' cont' : ''}${r === sel ? ' sel' : ''}`, `<span class="at">${t}</span><span class="t"><b>${r.label.toUpperCase()}</b><u>${KIND_WORDS[r.kind].toUpperCase()}</u><small>${cap(r.line)}</small></span>`);
    li.dataset.kind = r.kind; li.dataset.state = st; lastTen = t;
    li.onclick = () => { codex.godStep = r.id; for (const s of steps) s.classList.toggle('sel', s === li); stepCard(codex, host, g, r); };
    steps.push(li); list.appendChild(li);
  }
  body.append(list, host);
  page.appendChild(body);
  wrap.appendChild(page);
  cx.appendChild(wrap);
  stepCard(codex, host, g, sel);
}
