// ---------------------------------------------------------------------------------------
// THE TOOLS (the Codex's shelf for the last three tools): what the Dreamvane listens for, the Crucibelle's songs written out, and the
// Lockheart's coffins with their odds now (the coffin on the chain and the keys on its ring, from the Pneuka Box). The songs are written
// as their notes' numbers in the notes' colours (the colours of the bell's vents): the score is the same marks the bell makes.
//
// Prior art: Ocarina of Time's song screen (the notes of each song learned, in the buttons' own symbols), and a gacha banner's
// published rates.
//
//   renderTools(codex, cx)
// ---------------------------------------------------------------------------------------
import { SONGS, INSTRUMENTS, DEGREE_COLOR } from './crucibelle/songs.js';
import { HEARTS, KEYS, OUTCOMES, oddsOf, rates } from './lockheart/table.js';

const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
let styled = false;
const CSS = `
#codex .tools { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 900px) { #codex .tools { grid-template-columns: 1fr; } }
#codex .tools section { border: 1px solid rgba(255,178,122,.2); border-radius: 4px; padding: 10px 12px; background: rgba(30,14,8,.35); }
#codex .tools h3 { margin: 0 0 2px; font-size: 13px; letter-spacing: .18em; color: #ffd98a; }
#codex .tools .k { font-size: 10px; letter-spacing: .12em; opacity: .7; margin-bottom: 8px; }
#codex .tools p { font-size: 12px; line-height: 1.45; margin: 6px 0; }
#codex .tools .song { display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; margin: 8px 0; align-items: baseline; }
#codex .tools .song b { font-size: 11px; letter-spacing: .1em; }
#codex .tools .song .n { font: 700 15px var(--f-ui, monospace); letter-spacing: .25em; }
#codex .tools .song s { grid-column: 1 / 3; text-decoration: none; font-size: 11px; opacity: .8; }
#codex .tools .odds { display: flex; height: 9px; border-radius: 2px; overflow: hidden; margin: 4px 0; border: 1px solid rgba(255,178,122,.25); }
#codex .tools .odds i { display: block; height: 100%; }
#codex .tools .lrow { font-size: 11px; line-height: 1.5; margin: 6px 0 8px; }
#codex .tools .on { color: #ffd98a; }
`;

export function renderTools(codex, cx) {
  if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const g = codex.game, box = g.pneuka, belt = g.belt;
  const wrap = el('div', 'tools');
  const has = (id) => belt?.isWorn(id) || box?.held(`tool.${id}`);
  // ---- the Dreamvane
  const dv = el('section');
  dv.appendChild(el('h3', '', 'THE DREAMVANE'));
  dv.appendChild(el('div', 'k', `K · ${has('dreamvane') ? (belt.isWorn('dreamvane') ? 'worn across the back' : 'in the Pneuka Box') : 'not yours'}`));
  dv.appendChild(el('p', '', '<b>Hold RMB</b> to dowse: the dreamcatcher turns toward the loudest Lachryma about, and its web lights and its bead ticks faster the more nearly you face it. <b>The wheel</b> attunes it: to anything, to crystal, to chests, to the living, to what lies loose.'));
  dv.appendChild(el('p', '', '<b>LMB</b> the pick: crystal gives to it a blow at a time. Struck into the sand where the vane points at nothing you can see, it brings veiled crystal up.'));
  dv.appendChild(el('p', '', '<b>Tap RMB</b> to throw the tuning fork, and again to call it back. Rung into crystal, the pick takes twice as much and a shard; into a creature, it shakes the Lachryma out of it; into the ground, it calls everything near to come and look.'));
  dv.appendChild(el('p', '', `Crystal broken open: ${g.ledger?.get('crystal.harvest') || 0} · shards: ${g.ledger?.get('crystal.shard') || 0}`));
  wrap.appendChild(dv);
  // ---- the Crucibelle
  const cb = el('section');
  const inst = box?.fitted('instrument')[0] || 'bell';
  cb.appendChild(el('h3', '', 'THE CRUCIBELLE'));
  cb.appendChild(el('div', 'k', `U · ${INSTRUMENTS[inst].name}`));
  cb.appendChild(el('p', '', '<b>1 to 5</b> play the five notes of whatever music is playing (its minor pentatonic: nothing is wrong); RMB held, an octave up. On the beat they build <b>fever</b>, and fever makes every song stronger and cheaper. <b>LMB</b> tolls the bell. The instrument fitted in the box is its voice, and makes one school of song stronger.'));
  for (const [id, S] of Object.entries(SONGS)) {
    const d = el('div', 'song');
    d.appendChild(el('b', '', S.name));
    d.appendChild(el('span', 'n', S.notes.map((n) => `<span style="color:${hex(DEGREE_COLOR[n - 1])}">${n}</span>`).join(' ')));
    const school = Object.values(INSTRUMENTS).find((I) => I.school === S.school);
    d.appendChild(el('s', '', `${S.does} <i style="opacity:.7">(${S.cost} Lachryma; ${school ? school.name.toLowerCase() : ''} sings it best)</i>`));
    if (!(g.ledger?.get(`song.${id}`) > 0)) d.style.opacity = '0.75';
    cb.appendChild(d);
  }
  wrap.appendChild(cb);
  // ---- the Lockheart
  const lh = el('section'), L = g.lockheart;
  const heart = box?.fitted('heart')[0], keys = box?.fitted('keys') || [];
  lh.appendChild(el('h3', '', 'THE LOCKHEART'));
  lh.appendChild(el('div', 'k', `I · ${heart ? HEARTS[heart].name : 'no coffin on the chain'} · ${L ? `${Math.round(L.charge)} / ${heart ? HEARTS[heart].fill : '·'} Lachryma in it` : ''}`));
  lh.appendChild(el('p', '', 'Worn, it drinks the Lachryma you cannot hold. Drawn, <b>hold LMB</b> to hoover up what lies loose (liquid Lachryma counts double) and to draw it out of a mind laid low. <b>RMB</b>, when it is full and a Possibilikey is on its ring, opens it: the keys are used up, and its wheel is spun.'));
  for (const [id, H] of Object.entries(HEARTS)) {
    const { table } = oddsOf(id, id === heart ? keys : []), R = rates(table);
    const d = el('div', 'lrow');
    d.appendChild(el('div', id === heart ? 'on' : '', `<b>${H.name}</b>${id === heart && keys.length ? ` · with ${keys.map((k) => KEYS[k].name.toLowerCase()).join(', ')}` : ''}`));
    const bar = el('div', 'odds');
    for (const r of R) { const i = el('i'); i.style.width = `${(r.p * 100).toFixed(2)}%`; i.style.background = hex(OUTCOMES[r.id].color); bar.appendChild(i); }
    d.appendChild(bar);
    d.appendChild(el('div', '', R.slice().reverse().map((r) => `<span style="color:${hex(OUTCOMES[r.id].color)}">${OUTCOMES[r.id].label}</span> ${r.p >= 0.1 ? Math.round(r.p * 100) : (r.p * 100).toFixed(1)}%`).join(' · ')));
    lh.appendChild(d);
  }
  lh.appendChild(el('p', '', Object.entries(KEYS).map(([, K]) => `<b>${K.name}</b>: ${K.does}`).join('<br>')));
  wrap.appendChild(lh);
  cx.appendChild(wrap);
}
