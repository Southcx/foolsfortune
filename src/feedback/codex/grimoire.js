// ---------------------------------------------------------------------------------------
// THE GRIMOIRE OF ECHOES: the Codex's page of the mycelium (docs/plans/MYCELIUM.md section 8: "the wiki problem: every rule is a picture
// you can read; the Codex keeps what you have found"). What it shows is only what you have met: the strains you hold and what each
// eats and does, every graft you have made (its two curios and what came of them: the chart filled in by doing, never printed whole),
// Myggdrasil's girth, its open fruiting bodies and its tincture's colour, the branches hung (the rest as ???), and the keepsake pots.
// Drawn on demand from the kept state and the ledger, never kept in step by hand. The tab is Petra's (codex.js); the page is Dovina's.
//
// Prior art: Potion Craft's recipe book (a found recipe written down by the doing), Atelier's recipe pages, the Pokedex's seen and
// caught, and FFXIV's achievement window for the ??? of what is still to come.
//
//   renderGrimoire(codex, cx)   (codex.game: sporeBeds, myggdrasil, keepsakes, ledger)
// ---------------------------------------------------------------------------------------
import { STRAINS, STRAIN_NAMES, CAPS, BRANCHES } from '../../progress/mycelium.js';
import { itemOf } from '../../pneuka/items.js';
import { DISPLAY_ORDER, COLOR } from '../../progress/weather.js';

const CSS = `
#codex .gm { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 22px; font-size: 12px; }
@media (max-width: 720px) { #codex .gm { grid-template-columns: 1fr; } }
#codex .gm h3 { font-weight: normal; font-size: 11px; letter-spacing: .24em; color: var(--accent); margin: 0 0 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,178,122,.2); }
#codex .gm .ln { display: flex; gap: 8px; align-items: baseline; padding: 3px 0; }
#codex .gm .ln i { width: 10px; height: 10px; border-radius: 50%; flex: none; display: inline-block; }
#codex .gm .ln s { text-decoration: none; opacity: .65; }
#codex .gm .dim { opacity: .4; }
`;
let styled = false;
const el = (tag, cls = '', html = '') => { const n = document.createElement(tag); if (cls) n.className = cls; if (html) n.innerHTML = html; return n; };
const hex = (c) => `#${(c ?? 0x888888).toString(16).padStart(6, '0')}`;
const nameOf = (id) => itemOf(id)?.name || id;
const cap = (s) => s[0].toUpperCase() + s.slice(1);

export function renderGrimoire(codex, cx) {
  if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const g = codex.game, S = g.sporeBeds, T = g.myggdrasil, L = g.ledger, wrap = el('div', 'gm');
  const sec = (title) => { const s = el('section'); s.appendChild(el('h3', '', title)); wrap.appendChild(s); return s; };
  const line = (s, html, colour = null, dim = false) => s.appendChild(el('div', `ln${dim ? ' dim' : ''}`, `${colour != null ? `<i style="background:${hex(colour)}"></i>` : ''}<span>${html}</span>`));

  // the strains, in the order the five feelings are always shown
  const st = sec('THE STRAINS');
  for (const f of DISPLAY_ORDER) {
    const own = !!S?.strains?.[f], X = STRAINS[f];
    if (own) line(st, `<b>${cap(STRAIN_NAMES[f])}</b> <s>${X.verb}s ${X.eats.join(', ')}${X.pair ? ', two at a time' : ''} · ${X.hours} game hours</s>`, COLOR[f]);
    else line(st, '<b>???</b> <s>a strain not yet held</s>', null, true);
  }
  line(st, `<s>beds: ${S?.beds?.length || 0} · things worked: ${L?.get('spore.harvest') || 0}</s>`);

  // the grafts found (the chart filled in by doing)
  const gr = sec('THE GRAFTS FOUND');
  const pairs = (L?.under?.('spore.graft.pair.') || []).map(([k, n]) => { const [two, made] = k.slice('spore.graft.pair.'.length).split('>'); return { two: two.split('+'), made, n }; });
  for (const p of pairs.slice(0, 40)) line(gr, `${p.two.map(nameOf).join(' + ')} <s>→</s> <b>${nameOf(p.made)}</b>${p.n > 1 ? ` <s>×${p.n}</s>` : ''}`);
  if (!pairs.length) line(gr, '<s>none yet: the lichen grafts two curios into one</s>', null, true);

  // Myggdrasil
  const tr = sec('MYGGDRASIL');
  if (!g.gardenMycelium?.planet && !L?.get('myggdrasil.feed')) line(tr, '<s>its planetoid is given at the second Firing</s>', null, true);
  if (T) {
    const sap = T.tincture;
    line(tr, `girth <b>${T.girth}</b> <s>· fed ${L?.get('myggdrasil.feed') || 0} times · picked ${L?.get('myggdrasil.pick') || 0}</s>`);
    if (sap?.mass) line(tr, `the tincture <s>· hue ${Math.round(sap.h)}°, ${Math.round(sap.s * 100)}% saturated</s>`, hslHex(sap.h, sap.s));
    CAPS.forEach((c, i) => line(tr, i < T.caps ? cap(c) : '???', null, i >= T.caps));
  }

  // the branches
  const br = sec('THE BRANCHES');
  const hung = Object.keys(T?.branches || {});
  line(br, `<b>${hung.length}</b> of ${Object.keys(BRANCHES).length} hung`);
  for (const a of Object.keys(BRANCHES)) line(br, hung.includes(a) ? `${cap(a)} <s>· ${BRANCHES[a].adds}${BRANCHES[a].strain ? ` (${STRAIN_NAMES[BRANCHES[a].strain]})` : ''}</s>` : '???', null, !hung.includes(a));

  // the keepsake pots
  const kp = sec('THE KEEPSAKE POTS');
  const pots = g.keepsakes?.pots || [];
  for (const p of pots.slice(-24).reverse()) line(kp, `${p.kind ? cap(String(p.kind)) : 'a spirit'}${p.feeling ? ` <s>· in ${p.feeling}</s>` : ''}`, COLOR[p.feeling] ?? 0xf4efe4);
  if (!pots.length) line(kp, '<s>a spirit let go is fired into a pot that stays at the Chimney</s>', null, true);

  cx.appendChild(wrap);
}

function hslHex(h, s) {
  const H = ((((h ?? 0) % 360) + 360) % 360) / 60, C = Math.max(0, Math.min(1, s)), X = C * (1 - Math.abs((H % 2) - 1)), m = 0.5 - C / 2;
  const [r, g, b] = H < 1 ? [C, X, 0] : H < 2 ? [X, C, 0] : H < 3 ? [0, C, X] : H < 4 ? [0, X, C] : H < 5 ? [X, 0, C] : [C, 0, X];
  return (Math.round((r + m) * 255) << 16) | (Math.round((g + m) * 255) << 8) | Math.round((b + m) * 255);
}
