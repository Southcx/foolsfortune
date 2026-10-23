// ---------------------------------------------------------------------------------------
// THE READING TABLE: the Pneuka Box's loadout drawn as a two-card reading (PNEUKA-BOX.md 5, the pick: Calissa's look on Petra's function;
// Dovina's window, pneuka/ui.js and pneuka/loadout.js, calls this with the loadout's state and takes the pointer's events back). The main
// tool lies upright on a clay altar, the sub crossed over its foot (its words set level: only the card's body crosses), and the pair's
// Major Arcana above them on a kintsugi-gold edge, its face the house deck's own (vfx/bazaarfaces.js: one card stock with Raku's tables).
// A tool's fittings sit on its own card as glazed tiles (the psygun's chambers as pips with their shells), so a tool and what is fitted to
// it read as one thing. The five tools not worn fan below as a hand; lifting one shows what a swap would change. A swap refused is your
// seal pressed in vermilion over the place it would have gone (the words are `swapRefusal`'s, said by the window and the log).
// It draws and says; it decides nothing. The pocket and the Book are the window's, dressed by the classes below (`RT_CLASSES`).
//
//   THE CARD STOCK  glazed slips: the main on a warm slip, the sub on celadon, the pair on the house deck's plum under a gold edge
//   THE ALTAR       an earthenware ledge with the cord marks of the Clay dress, a slip pool under the reading
//   THE HAND        five tool cards fanned on a pivot below the altar; the hovered lifts and straightens
//   THE HANKO       your seal (drawSealFace, cradles.mine) in vermilion, pressed in from a little above, then lifted after a beat
//
// Prior art: the Celtic Cross spread (its first two cards: the present, and what crosses it), Persona's arcana (a bond is a card),
// Balatro's hand fanned and lifted, Inscryption's cards on a table, the hanko as the refusal (a seal says no in its owner's hand).
//
//   const T = new ReadingTable(game)   host.appendChild(T.el)
//   T.draw(state)   (on any change; cheap, a rebuild of a few dozen nodes)
//     state = {
//       main:  { id, name, label, lines: [string], fittings: [{ label, color?, icon? }], chambers?: { of, loaded: [hex | null] } },
//       sub:   { id, name, label, verb: string, passive: string, fittings: [...] },
//       pair:  { n: 1..21, name, open: bool, line: string },            (line: the special's words, or "special: to come", or how it opens)
//       shelf: [{ id, name, label, verb, passive, note? }],               (the five not worn, in TOOL_IDS' order)
//       preview: { id, as: 'main' | 'sub', rows: [{ what, from?, to, up? }], pair: { n, name, open, line } } | null,
//       locked: bool }                                                    (a swap would be refused now: the positions dim, nothing lifts)
//   T.on('hover', ({ id } | null))   T.on('pick', ({ id, button }))   T.on('drop', ({ id, as }))   (a hand card dropped on a position)
//   T.refuse(as)    (the seal pressed over 'main' or 'sub'; lifted after REFUSE.hold real s)
//   RT_CLASSES.window / .tray / .slot / .book   (the Clay dress for the window's own parts: add the class, the look follows)
// ---------------------------------------------------------------------------------------
import { iconEl } from './icons/icons.js';
import { bazaarAtlas } from '../vfx/bazaarfaces.js';
import { drawSealFace } from '../vfx/sealface.js';

export const REFUSE = { hold: 1.4, press: 0.16 };      // (real s the seal stays; real s it takes to come down)
export const RT_CLASSES = { window: 'rt-clay', tray: 'rt-tray', slot: 'rt-slot', book: 'rt-book' };
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
const CARD = { w: 128, h: 208, cols: 16, back: 78 }; // (the house deck's cells in its atlas: vfx/bazaarfaces.js AT.card)
const VERMILION = '#e0442a';

const CSS = `
.rt-clay{position:relative;border-radius:4px;color:#efe6d2;
  background:radial-gradient(circle,rgba(255,236,214,.16) 0 1px,transparent 1.4px) 0 0/9px 11px,
    radial-gradient(circle,rgba(40,20,10,.35) 0 1.3px,transparent 1.6px) 4px 3px/13px 15px,
    linear-gradient(180deg,rgba(111,165,150,.10),rgba(0,0,0,.18)),linear-gradient(180deg,#7a4630,#4e2a1c);
  box-shadow:0 0 0 2px #2a140c,0 0 0 3px rgba(239,230,210,.18),0 18px 40px rgba(0,0,0,.55)}
.rt-tray{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;padding:10px;border-radius:4px;background:linear-gradient(180deg,#3d1f14,#2a140c);
  box-shadow:inset 0 2px 6px rgba(0,0,0,.6),0 1px 0 rgba(255,226,196,.12)}
.rt-slot{position:relative;aspect-ratio:1;border-radius:5px;background:radial-gradient(ellipse at 50% 30%,#5e3424,#3f2015);
  box-shadow:inset 0 3px 4px rgba(0,0,0,.6),inset 0 -1px 0 rgba(255,226,196,.10)}
.rt-slot:hover,.rt-slot.hov{box-shadow:inset 0 3px 4px rgba(0,0,0,.6),0 0 0 2px var(--rt-window,#6fa596)}
.rt-book{padding:9px 10px;border-radius:3px;color:#17111f;background:linear-gradient(90deg,#efe0c2,#dcc49c);box-shadow:0 0 0 1px #2a140c,inset 0 0 0 3px rgba(122,70,48,.25)}

.rt{position:relative;width:560px;height:640px;user-select:none;font-family:inherit}
.rt-altar{position:absolute;left:0;right:0;top:0;height:420px;border-radius:50% 50% 8px 8px/22% 22% 8px 8px;
  background:radial-gradient(ellipse at 50% 34%,rgba(255,226,196,.12),transparent 60%),linear-gradient(180deg,#5a3020,#3a1c12);
  box-shadow:inset 0 2px 0 rgba(255,226,196,.12),inset 0 -14px 30px rgba(0,0,0,.45)}
.rt-altar::after{content:'';position:absolute;left:8%;right:8%;bottom:10px;height:6px;border-radius:3px;
  background:repeating-linear-gradient(62deg,#a8664a 0 3px,#5c3020 3px 6px);opacity:.55}
.rt-pos{position:absolute;font:700 10px/1 Georgia,serif;letter-spacing:.2em;text-transform:uppercase;color:#e9d6bc;opacity:.7}
.rt-card{position:absolute;width:150px;height:236px;border-radius:9px;padding:9px;color:#17111f;box-sizing:border-box}
.rt-card .nm{font:700 11px/1.1 Georgia,serif;letter-spacing:.14em;text-transform:uppercase;text-align:center;margin:2px 0 6px}
.rt-card .lb{font-size:10px;letter-spacing:.12em;text-transform:uppercase;text-align:center;opacity:.7;margin-top:-3px}
.rt-card .art{height:96px;margin:6px 0;border-radius:5px;display:grid;place-items:center;
  background:radial-gradient(circle at 50% 40%,#fff6e4,#cdb58e);box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)}
.rt-card .gl{font-size:10.5px;line-height:1.35}
.rt-main{left:46px;top:150px;background:linear-gradient(180deg,#f4ead6,#e2cfae);box-shadow:0 0 0 2px #2a140c,0 0 0 4px #e9d6bc,0 10px 18px rgba(0,0,0,.5)}
.rt-subwrap{position:absolute;left:228px;top:236px;width:150px;height:236px}
.rt-subwrap .body{position:absolute;inset:0;border-radius:9px;transform:rotate(-90deg);background:linear-gradient(180deg,#e8f0ec,#c7d8cf);
  box-shadow:0 0 0 2px #2a140c,0 0 0 4px #86ad93,0 10px 18px rgba(0,0,0,.5)}
.rt-subwrap .face{position:absolute;left:-36px;top:52px;width:222px;height:132px;padding:8px 10px;box-sizing:border-box;color:#17111f;display:grid;
  grid-template-columns:52px 1fr;gap:8px;align-items:center}
.rt-subwrap .face .nm{grid-column:1/-1;font:700 11px/1 Georgia,serif;letter-spacing:.14em;text-transform:uppercase}
.rt-subwrap .face .gl{font-size:10.5px;line-height:1.35}
.rt-arcana{left:350px;top:16px;width:170px;height:270px;background:linear-gradient(180deg,#1d1424,#120c18);color:#efe6d2;
  box-shadow:0 0 0 2px #2a140c,0 0 0 4px #ffd36a,0 0 30px rgba(255,211,106,.22),0 14px 24px rgba(0,0,0,.6)}
.rt-arcana .face{display:block;width:96px;height:156px;margin:4px auto 6px;image-rendering:pixelated;border-radius:3px;box-shadow:0 0 0 1px rgba(255,211,106,.4)}
.rt-arcana .nm{color:#ffd36a}
.rt-arcana .tag{display:inline-block;padding:1px 6px;border-radius:2px;background:rgba(255,211,106,.16);color:#ffd36a;font-size:10px;letter-spacing:.14em;margin-right:4px}
.rt-arcana.down .tag{background:rgba(239,230,210,.1);color:#e9d6bc}
.rt-thread{position:absolute;left:198px;top:206px;width:156px;height:2px;background:linear-gradient(90deg,transparent,#ffd36a);transform:rotate(-26deg);transform-origin:left;opacity:.7}
.rt-fits{display:flex;gap:4px;justify-content:center;margin-top:6px;flex-wrap:wrap}
.rt-fit{width:22px;height:22px;border-radius:4px;display:grid;place-items:center;font:700 11px/1 Georgia,serif;color:#fff;overflow:hidden;
  box-shadow:inset 0 2px 0 rgba(255,255,255,.35),inset 0 -2px 0 rgba(0,0,0,.35),0 0 0 1px #2a140c}
.rt-fit img{width:100%;height:100%;object-fit:contain}
.rt-ch{display:flex;gap:3px;justify-content:center;margin-top:5px}
.rt-ch i{width:14px;height:14px;border-radius:50%;box-shadow:inset 0 0 0 2px #2a140c;background:#c9b490}
.rt-hand{position:absolute;left:0;right:0;top:438px;height:200px}
.rt-t{position:absolute;bottom:0;width:104px;height:164px;border-radius:7px;padding:7px;box-sizing:border-box;color:#17111f;cursor:grab;
  background:linear-gradient(180deg,#f0e4cc,#d9c3a0);box-shadow:0 0 0 2px #2a140c,0 0 0 3px rgba(239,230,210,.6),0 8px 14px rgba(0,0,0,.45);
  transform-origin:50% 140%;transition:transform .16s cubic-bezier(.2,.8,.3,1.2),box-shadow .16s}
.rt-t .nm{font:700 9.5px/1.1 Georgia,serif;letter-spacing:.12em;text-transform:uppercase;text-align:center}
.rt-t .art{height:62px;margin:5px 0;border-radius:4px;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#fff6e4,#cdb58e)}
.rt-t .gl{font-size:9.5px;line-height:1.3}
.rt-t.lift{box-shadow:0 0 0 2px #2a140c,0 0 0 3px #ffd36a,0 14px 22px rgba(0,0,0,.55);z-index:3}
.rt.locked .rt-t{cursor:not-allowed;filter:saturate(.6) brightness(.9)}
.rt.locked .rt-main,.rt.locked .rt-subwrap{filter:saturate(.75)}
.rt-drop{outline:2px dashed #ffd36a;outline-offset:6px}
.rt-preview{position:absolute;left:372px;top:470px;width:186px;padding:9px 10px;border-radius:4px;font-size:11px;line-height:1.45;color:#efe6d2;
  background:linear-gradient(180deg,#3a2016,#2a140c);box-shadow:0 0 0 1px rgba(255,211,106,.5),0 8px 18px rgba(0,0,0,.5)}
.rt-preview h4{margin:0 0 5px;font:700 10px/1 Georgia,serif;letter-spacing:.2em;color:#ffd36a;text-transform:uppercase}
.rt-preview .up{color:#9be08a}.rt-preview .dn{color:#ff9f80}
.rt-preview .fd{display:inline-block;width:12px;height:17px;vertical-align:-4px;margin-right:5px;border-radius:2px;
  background:repeating-linear-gradient(45deg,#3a2a50 0 3px,#22182e 3px 6px);box-shadow:0 0 0 1px #ffd36a}
.rt-seal{position:absolute;width:132px;height:132px;pointer-events:none;z-index:6;transition:transform ${REFUSE.press}s cubic-bezier(.3,1.4,.5,1),opacity .2s}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-readingtable', ''); s.textContent = CSS; document.head.appendChild(s);
}
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const icon = (id, px) => { try { return iconEl(`mount.${id}`, { pal: 'gold', px }); } catch { return make('span', '', '·'); } };

export class ReadingTable {
  constructor(game) {
    this.game = game; this.handlers = {}; this.state = null; this.faces = new Map(); this.sealUrl = null; this.sealKey = '';
    style();
    this.el = typeof document === 'undefined' ? null : make('div', 'rt');
  }
  on(type, fn) { (this.handlers[type] ||= []).push(fn); return this; }
  emit(type, e) { for (const fn of this.handlers[type] || []) fn(e); }

  /** The house deck's face of a Major Arcana (n 1..21) or its back, as a canvas the size of the atlas cell. */
  face(n, down) {
    const key = down ? 'back' : n; if (this.faces.has(key)) return this.copy(this.faces.get(key));
    const A = bazaarAtlas(), i = down ? CARD.back : n, c = make('canvas'); c.width = CARD.w; c.height = CARD.h;
    c.getContext('2d').drawImage(A.canvas, (i % CARD.cols) * CARD.w, Math.floor(i / CARD.cols) * CARD.h, CARD.w, CARD.h, 0, 0, CARD.w, CARD.h);
    this.faces.set(key, c); return this.copy(c);
  }
  copy(src) { const c = make('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); return c; }

  /** Your seal in vermilion, as an image (drawn again if your seal changes). */
  seal() {
    const mine = this.game?.cradles?.mine || null, key = JSON.stringify(mine);
    if (this.sealUrl && key === this.sealKey) return this.sealUrl;
    const S = 256, c = make('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    drawSealFace(g, mine || { name: '', outline: 'round', carving: 'relief' }, { size: S, ink: VERMILION });
    g.globalCompositeOperation = 'source-in'; g.fillStyle = VERMILION; g.fillRect(0, 0, S, S);
    this.sealKey = key; this.sealUrl = c.toDataURL(); return this.sealUrl;
  }

  draw(state) {
    if (!this.el) return; this.state = state;
    const el = this.el; el.replaceChildren(); el.classList.toggle('locked', !!state.locked);
    el.append(make('div', 'rt-altar'), make('div', 'rt-thread'));
    const pos = (text, l, t) => { const p = make('span', 'rt-pos', text); p.style.left = `${l}px`; p.style.top = `${t}px`; return p; };
    el.append(pos('MAIN', 58, 128), pos('SUB, CROSSED', 300, 414), pos('THE PAIR', 398, 294));
    if (state.main) el.append(this.mainCard(state.main));
    if (state.sub) el.append(this.subCard(state.sub));
    if (state.pair) el.append(this.pairCard(state.pair));
    el.append(this.hand(state.shelf || [], state.preview?.id));
    if (state.preview) el.append(this.preview(state.preview));
  }

  fittings(list = []) {
    const row = make('div', 'rt-fits');
    for (const f of list) {
      const t = make('div', 'rt-fit'); t.title = f.label || ''; t.style.background = f.color || '#8a5a3a';
      if (f.icon) { const im = make('img'); im.src = f.icon; im.alt = ''; t.append(im); } else t.textContent = (f.label || '?')[0];
      row.append(t);
    }
    return row;
  }

  mainCard(m) {
    const c = make('div', 'rt-card rt-main'); c.dataset.as = 'main'; this.dropTarget(c, 'main');
    const art = make('div', 'art'); art.append(icon(m.id, 5));
    c.append(make('div', 'nm', m.name), make('div', 'lb', m.label), art);
    for (const line of m.lines || []) c.append(make('div', 'gl', line));
    if (m.chambers) {
      const ch = make('div', 'rt-ch');
      for (let i = 0; i < m.chambers.of; i++) { const p = make('i'); const s = m.chambers.loaded?.[i]; if (s) p.style.background = `radial-gradient(circle at 40% 35%,#fff3d0,${s})`; ch.append(p); }
      c.append(ch);
    }
    c.append(this.fittings(m.fittings));
    return c;
  }

  subCard(s) {
    const w = make('div', 'rt-subwrap'); w.dataset.as = 'sub'; this.dropTarget(w, 'sub');
    const face = make('div', 'face'), art = make('div', ''); art.append(icon(s.id, 3));
    const gl = make('div', 'gl'); gl.append(make('b', '', `R · ${s.verb}`), make('br'), document.createTextNode(s.passive ? `Passive: ${s.passive}` : 'Passive: none'));
    const right = make('div', ''); right.append(gl, this.fittings(s.fittings));
    face.append(make('div', 'nm', `${s.name} · ${s.label}`), art, right);
    w.append(make('div', 'body'), face);
    return w;
  }

  pairCard(p) {
    const c = make('div', `rt-card rt-arcana${p.open ? '' : ' down'}`);
    const f = this.face(p.n, !p.open); if (f) { f.className = 'face'; c.append(f); }
    c.append(make('div', 'nm', `${ROMAN[p.n] || ''} · ${p.name}`));
    const gl = make('div', 'gl'); gl.append(make('span', 'tag', p.open ? 'OPEN' : 'NOT YET'), document.createTextNode(p.line || 'special: to come'));
    c.append(gl);
    return c;
  }

  hand(shelf, lifted) {
    const h = make('div', 'rt-hand'), n = shelf.length, mid = (n - 1) / 2;
    shelf.forEach((t, i) => {
      const c = make('div', `rt-t${t.id === lifted ? ' lift' : ''}`), k = i - mid;
      c.style.left = `${8 + i * 62}px`;
      c.style.transform = t.id === lifted ? 'translateY(-34px)' : `rotate(${k * 7}deg) translateY(${Math.abs(k) * 4}px)`;
      const art = make('div', 'art'); art.append(icon(t.id, 3));
      c.append(make('div', 'nm', t.name), art, make('div', 'gl', `R · ${t.verb}`));
      if (t.note) c.append(make('div', 'gl', t.note));
      c.draggable = !this.state?.locked;
      c.addEventListener('pointerenter', () => this.emit('hover', { id: t.id }));
      c.addEventListener('pointerleave', () => this.emit('hover', null));
      c.addEventListener('click', (e) => this.emit('pick', { id: t.id, button: e.button, shift: e.shiftKey }));
      c.addEventListener('dragstart', (e) => { e.dataTransfer?.setData('text/plain', t.id); this.dragging = t.id; });
      c.addEventListener('dragend', () => { this.dragging = null; for (const d of this.el.querySelectorAll('.rt-drop')) d.classList.remove('rt-drop'); });
      h.append(c);
    });
    return h;
  }

  dropTarget(el, as) {
    el.addEventListener('dragover', (e) => { if (!this.dragging) return; e.preventDefault(); el.classList.add('rt-drop'); });
    el.addEventListener('dragleave', () => el.classList.remove('rt-drop'));
    el.addEventListener('drop', (e) => { e.preventDefault(); el.classList.remove('rt-drop'); const id = this.dragging || e.dataTransfer?.getData('text/plain'); if (id) this.emit('drop', { id, as }); });
  }

  preview(p) {
    const b = make('div', 'rt-preview'); b.append(make('h4', '', p.as === 'main' ? 'Wear in hand' : 'Swap in as sub'));
    for (const r of p.rows || []) {
      const row = make('div', ''); row.append(document.createTextNode(`${r.what} · `));
      if (r.from) { row.append(make('span', 'dn', r.from), document.createTextNode(' → ')); }
      row.append(make('span', r.up === false ? 'dn' : 'up', r.to)); b.append(row);
    }
    if (p.pair) {
      const row = make('div', ''); row.append(document.createTextNode('Pair · '));
      if (!p.pair.open) row.append(make('span', 'fd'));
      row.append(document.createTextNode(`${ROMAN[p.pair.n] || ''} ${p.pair.name}`), make('span', p.pair.open ? 'up' : 'dn', p.pair.open ? ', open' : ', not yet open'));
      b.append(row); if (p.pair.line) { const l = make('div', '', p.pair.line); l.style.opacity = '.75'; b.append(l); }
    }
    return b;
  }

  /** A swap refused: your seal pressed over where it would have gone, then lifted. The words are the window's (swapRefusal). */
  refuse(as = 'sub') {
    if (!this.el) return;
    const at = as === 'main' ? { x: 54, y: 196 } : { x: 238, y: 290 };
    const s = make('img', 'rt-seal'); s.src = this.seal(); s.alt = '';
    s.style.left = `${at.x}px`; s.style.top = `${at.y}px`; s.style.transform = 'scale(1.6) rotate(-14deg)'; s.style.opacity = '0';
    this.el.append(s);
    requestAnimationFrame(() => { s.style.transform = 'scale(1) rotate(-10deg)'; s.style.opacity = '0.95'; });
    setTimeout(() => { s.style.opacity = '0'; setTimeout(() => s.remove(), 260); }, REFUSE.hold * 1000);
  }
}
