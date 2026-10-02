// ---------------------------------------------------------------------------------------
// THE MIND (the Codex, B: VERITOME, THE MIND): where macros are composed. Five macros, each a lattice (lattice.js): pick a Function from
// those known (functions.js; the unknown ones are shown dark, with how they are learned), turn it (R) and mirror it (F), and place it; click
// a placed piece to lift it off. The signal comes in at the CORE on the left and must leave by the MOUTH on the right; what it passes
// through, in order, is the macro, spoken as its NEURALESE (and drawn as its runes, runes.js). Below: how well it is made (complete, tight,
// tidy, and the quality those make) and what it will do, how long, how deep, to a mind it is run on (veritome/reprogram.js).
//
// Prior art: the component editors of Zachtronics' puzzles (SpaceChem, Opus Magnum: a palette, a grid, pieces turned and placed, a
// result scored against a histogram), Persona's fusion screen (what you make is previewed as you make it), and Transistor's Function
// slots (the same word means something different in a different place).
//
//   renderMind(codex, cx, game)   (the Veritome shelf calls it)
// ---------------------------------------------------------------------------------------
import { FUNCTIONS, KIND_COLOR, known } from './functions.js';
import { Lattice, turned } from './lattice.js';
import { runeStrip } from './runes.js';

const CSS = `
#codex .mind { display: grid; grid-template-columns: auto 1fr; gap: 18px; align-items: start; }
@media (max-width: 860px) { #codex .mind { grid-template-columns: 1fr; } }
#codex .mslots { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
#codex .mslots span { cursor: var(--jcur-pointer, pointer); font-size: 10px; letter-spacing: .14em; padding: 3px 8px; border: 1px solid rgba(180,155,230,.3); border-radius: 3px; color: #b49be6; }
#codex .mslots span.on { background: rgba(86,56,137,.55); border-color: #b49be6; color: #fff1dc; }
#codex .mind .board { position: relative; display: grid; grid-template-columns: repeat(7, 46px); grid-template-rows: repeat(5, 46px); gap: 2px; padding: 8px 18px;
  background: radial-gradient(ellipse at 50% 50%, #241a40, #0f0a1e); border: 2px solid #563889; box-shadow: inset 0 0 0 1px #7650b8; }
#codex .mind .cell { position: relative; background: rgba(118,80,184,.08); border: 1px dashed rgba(180,155,230,.16); border-radius: 3px; cursor: var(--jcur-pointer, pointer); }
#codex .mind .cell.p { border-style: solid; }
#codex .mind .cell.dim { opacity: .45; }
#codex .mind .cell.ghost { outline: 2px solid #9be36a; outline-offset: -2px; }
#codex .mind .cell.bad { outline: 2px solid #ff7a9a; outline-offset: -2px; }
#codex .mind .cell b { position: absolute; left: 3px; top: 2px; font-size: 9px; letter-spacing: .06em; color: #0f0a1e; font-weight: bold; }
#codex .mind .cell i { position: absolute; width: 8px; height: 8px; background: #fff1dc; border-radius: 50%; box-shadow: 0 0 4px #fff; }
#codex .mind .cell i.o { background: #ffd98a; border-radius: 1px; }
#codex .mind .end { position: absolute; width: 12px; height: 30px; background: #b49be6; border-radius: 3px; box-shadow: 0 0 10px #b49be6; }
#codex .mind .end.core { left: 2px; } #codex .mind .end.mouth { right: 2px; background: #ffd98a; box-shadow: 0 0 10px #ffd98a; }
#codex .mind .pal { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 6px; }
#codex .mind .fn { cursor: var(--jcur-pointer, pointer); padding: 5px 6px; border: 1px solid rgba(180,155,230,.25); border-radius: 3px; font-size: 10px; letter-spacing: .08em; background: rgba(15,10,30,.5); }
#codex .mind .fn.on { border-color: #ffd98a; background: rgba(86,56,137,.5); }
#codex .mind .fn.unk { opacity: .38; cursor: default; }
#codex .mind .fn em { display: block; font-style: normal; font-size: 13px; letter-spacing: .12em; }
#codex .mind .fn s { text-decoration: none; display: block; opacity: .7; font-size: 9px; margin-top: 2px; }
#codex .mind .res { margin-top: 10px; font-size: 12px; line-height: 1.5; }
#codex .mind .res .words { font-size: 16px; letter-spacing: .2em; color: #ffd98a; }
#codex .mind .res canvas { display: block; margin: 4px 0; image-rendering: pixelated; }
#codex .mind .q { display: grid; grid-template-columns: 70px 1fr 36px; gap: 3px 8px; align-items: center; font-size: 10px; letter-spacing: .1em; margin: 6px 0; max-width: 360px; }
#codex .mind .q i { display: block; height: 6px; background: #b49be6; border-radius: 2px; }
#codex .mind .tools { display: flex; gap: 6px; margin: 8px 0; flex-wrap: wrap; }
`;
let styled = false;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const button = (label, on, title = '') => { const b = el('button', '', label); if (title) b.title = title; b.onclick = on; return b; };
const SIDE = [[1, 0.5], [0.5, 1], [0, 0.5], [0.5, 0]]; // (where a side's mark sits in a cell: E S W N)

export function renderMind(codex, cx, g) {
  if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const book = g.macros, L = g.ledger;
  if (!book) { cx.appendChild(el('p', '', 'The mind is not here.')); return; }
  codex.mindSlot ??= 0;
  codex.mindPick ??= { fn: 'wire', rot: 0, flip: false };
  const lat = book.slots[codex.mindSlot], pick = codex.mindPick;
  const save = () => { book.save(); codex.render(); };
  // the five macros
  const slots = el('div', 'mslots');
  book.slots.forEach((l, i) => {
    const c = l.compile();
    const s = el('span', i === codex.mindSlot ? 'on' : '', `${i + 1} · ${c.words.length ? c.words.join('-') : 'EMPTY'}`);
    s.onclick = () => { codex.mindSlot = i; codex.render(); };
    slots.appendChild(s);
  });
  cx.appendChild(slots);
  const wrap = el('div', 'mind'), left = el('div'), right = el('div');
  // ---- the lattice
  const board = el('div', 'board');
  const res = lat.compile(), inChain = new Set(res.chain);
  const ghost = codex.mindHover && pick.fn ? (() => {
    const t = turned(FUNCTIONS[pick.fn].shape, pick.rot, pick.flip);
    const [hx, hy] = codex.mindHover, ok = lat.fits(pick.fn, hx, hy, pick.rot, pick.flip);
    return { cells: new Set(t.cells.map(([a, b]) => `${hx + a},${hy + b}`)), ok };
  })() : null;
  for (let y = 0; y < Lattice.H; y++) for (let x = 0; x < Lattice.W; x++) {
    const p = lat.at(x, y), d = el('div', `cell${p ? ' p' : ''}${p && !inChain.has(p) ? ' dim' : ''}`);
    if (p) {
      const f = FUNCTIONS[p.fn], t = turned(f.shape, p.rot, p.flip);
      d.style.background = KIND_COLOR[f.kind];
      const ci = t.cells.findIndex(([a, b]) => p.x + a === x && p.y + b === y);
      if (ci === 0 && f.word) d.appendChild(el('b', '', f.word));
      if (ci === t.in[0]) d.appendChild(mark(t.in[1], ''));
      if (ci === t.out[0]) d.appendChild(mark(t.out[1], 'o'));
      d.title = `${f.label}${f.word ? ` (${f.word})` : ''}: ${f.does} (click to lift it off)`;
    }
    const key = `${x},${y}`;
    if (ghost?.cells.has(key)) d.classList.add(ghost.ok ? 'ghost' : 'bad');
    d.onmouseenter = () => { if (!p) { codex.mindHover = [x, y]; paintGhost(board, lat, pick, x, y); } };
    d.onclick = () => {
      if (p) { lat.remove(x, y); save(); return; }
      if (pick.fn && lat.place(pick.fn, x, y, pick.rot, pick.flip)) { g.events?.emit('mind.place', { fn: pick.fn }); save(); }
    };
    d.oncontextmenu = (e) => { e.preventDefault(); pick.rot = (pick.rot + 1) % 4; codex.render(); };
    board.appendChild(d);
  }
  const core = el('div', 'end core'), mouth = el('div', 'end mouth');
  core.style.top = `${8 + Lattice.CORE * 48 + 8}px`; mouth.style.top = `${8 + Lattice.MOUTH * 48 + 8}px`;
  core.title = 'the core: the signal comes in here'; mouth.title = 'the mouth: the macro is said here';
  board.append(core, mouth);
  left.appendChild(board);
  const tools = el('div', 'tools');
  tools.append(
    button(`TURN (R) · ${pick.rot * 90}°`, () => { pick.rot = (pick.rot + 1) % 4; codex.render(); }),
    button(`MIRROR (F) · ${pick.flip ? 'on' : 'off'}`, () => { pick.flip = !pick.flip; codex.render(); }),
    button('CLEAR', () => { lat.clear(); save(); }),
  );
  left.appendChild(tools);
  // ---- what it makes
  const r = el('div', 'res');
  if (res.words.length) {
    r.appendChild(el('div', 'words', res.words.join(' ')));
    const rc = runeStrip(res.words); const big = document.createElement('canvas'); big.width = rc.width * 3; big.height = rc.height * 3;
    const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(rc, 0, 0, big.width, big.height); r.appendChild(big);
  } else r.appendChild(el('div', '', 'Nothing yet: the signal passes through no Function.'));
  const q = el('div', 'q');
  for (const [k, v, note] of [['COMPLETE', res.complete ? 1 : 0, res.complete ? 'yes' : 'no'], ['TIGHT', res.tight, `${res.cells}`], ['TIDY', res.tidy, ''], ['QUALITY', res.q, `${Math.round(res.q * 100)}%`]]) {
    q.append(el('span', '', k), el('span', '', `<i style="width:${Math.round(v * 100)}%"></i>`), el('span', '', note));
  }
  r.appendChild(q);
  for (const e of res.effects) {
    const f = FUNCTIONS[e.fn], dur = (f.base || 10) * (0.5 + res.q) * e.dur, pow = (0.6 + 0.6 * res.q) * e.pow;
    r.appendChild(el('div', '', `<b style="color:${KIND_COLOR[f.kind]}">${f.word}</b> · ${f.does} <span style="opacity:.7">(${f.kind === 'drive' || f.kind === 'mem' ? `x${pow.toFixed(2)}` : `${dur.toFixed(0)} s, x${pow.toFixed(2)}`})</span>`));
  }
  if (res.effects.length) r.appendChild(el('div', '', `<span style="opacity:.7">A mind takes it ${Math.round(Math.min(0.98, 0.45 + 0.55 * res.q) * 100)}% of the time. Say it to a stunned mind (MMB by it).</span>`));
  left.appendChild(r);
  // ---- the Functions
  right.appendChild(el('div', '', '<span style="font-size:10px;letter-spacing:.2em;opacity:.75">FUNCTIONS · learned by seeing them done (photograph, then appraise)</span>'));
  const pal = el('div', 'pal');
  for (const f of Object.values(FUNCTIONS)) {
    const k = known(f.id, L);
    const d = el('div', `fn${pick.fn === f.id ? ' on' : ''}${k ? '' : ' unk'}`, `<em style="color:${KIND_COLOR[f.kind]}">${k ? f.word || f.label : '????'}</em>${f.label} · ${f.kind}<s>${k ? f.does : f.how}</s>`);
    d.title = k ? f.does : `Not known yet. ${f.how}`;
    if (k) d.onclick = () => { pick.fn = f.id; codex.render(); };
    pal.appendChild(d);
  }
  right.appendChild(pal);
  wrap.append(left, right);
  cx.appendChild(wrap);
  // R / F while the page is up
  if (!codex.mindKeys) {
    codex.mindKeys = true;
    addEventListener('keydown', (e) => {
      if (!codex.open || codex.shelf !== 'veritome' || codex.vtPage !== 'mind') return;
      if (e.code === 'KeyR') { codex.mindPick.rot = (codex.mindPick.rot + 1) % 4; codex.render(); }
      if (e.code === 'KeyF') { codex.mindPick.flip = !codex.mindPick.flip; codex.render(); }
    });
  }
}

function mark(side, cls) {
  const i = el('i', cls), [fx, fy] = SIDE[side];
  i.style.left = `calc(${fx * 100}% - 4px)`; i.style.top = `calc(${fy * 100}% - 4px)`;
  return i;
}

/** The ghost of the piece in hand, where it would go (without redrawing the whole page). */
function paintGhost(board, lat, pick, hx, hy) {
  const cells = board.querySelectorAll('.cell');
  cells.forEach((c) => c.classList.remove('ghost', 'bad'));
  if (!pick.fn) return;
  const t = turned(FUNCTIONS[pick.fn].shape, pick.rot, pick.flip), ok = lat.fits(pick.fn, hx, hy, pick.rot, pick.flip);
  for (const [a, b] of t.cells) {
    const x = hx + a, y = hy + b;
    if (x < 0 || y < 0 || x >= Lattice.W || y >= Lattice.H) continue;
    cells[y * Lattice.W + x]?.classList.add(ok ? 'ghost' : 'bad');
  }
}
