// ---------------------------------------------------------------------------------------
// THE ASSEMBLY PAGE'S DRESS (docs/plans/MECHS.md 4.1, 8.2 item 7): the gantry's page (Dovina's world/hangar/assembly.js, its `mk-*` classes
// on the index window) dressed as Armored Core's garage in the Clay dress. Looks only: every rule, number, word and click stay the page's.
// The page is drawn again on each click; a watch on the index window adds, once a drawing, what CSS alone cannot say:
//   THE SLOT ROW   a slot's name as a glazed tile on the kiln shelf's edge, a gold bar on its left (AC's slot list)
//   A PART         a bisque test tile (the choice card's grammar, ui/choicecard.js): its label, its glyph where it has one (the arms'
//                  weapons, the back unit: ui/icons/touchmechart.js), and its numbers as stat chips (mass, and its slot's own: a head's
//                  lock, an arm's load, a leg's type and load, a booster's thrust, a generator's output and battery); the worn one glazed
//                  whole in the window colour, rimmed gold, a gold check in its corner
//   THE GAUGES     the chosen frame's totals as AC's bars over the numbers: LOAD (its mass against the legs' load), ARM LOAD (the weapons
//                  against the arms'), ENERGY (the draw against the generator's output), each a glaze run in a bisque trough with the
//                  limit a gold notch; past it the run turns ember and its check's word stands on it (OVERWEIGHT, ARMS HEAVY, UNDERPOWERED);
//                  the kept frame's fill a faint ghost under it, so a choice reads as a move
//   THE NUMBERS    kept and chosen in the counts face, the chosen one's arrow (better in the film's cyan, worse in ember)
//   A REFUSAL      an ember plaque with its mark; the mend line and MEND a kintsugi seam; DONE the gold-rimmed tile
//   STYLE          a vermilion lacquer tile beside DONE and MEND that opens the mech's style window (ui/mechs/stylewindow.js: the looks
//                  the frame wears beside its parts), its BACK returning here with the draft as it was
//
// Prior art: Armored Core's assembly screen (the slot list, a part's spec sheet, the AP, load and EN bars with their limits and the
// overweight warnings), Medabots' part swap, the house's choice cards and the collection log's dress (ui/collectionslook.js).
//
//   installAssemblyLook(game)   (once: the style, a watch on the index window for the page, and the style window: game.mechStyleWindow)   ASSEMBLY_LOOK
// ---------------------------------------------------------------------------------------
import { SLOTS, PARTS, LEG_TYPES } from '../../progress/mechs/parts.js';
import { assemble } from '../../progress/mechs/frame.js';
import { uiIcon } from '../icons/icons.js';
import { weaponGlyph } from './mechfaces.js';
import { installMechStyleWindow } from './stylewindow.js';

export const ASSEMBLY_LOOK = { ember: '#ff6a3a', cyan: '#7fdcff', gold: '#ffd36a', retry: 1, tries: 60 };
const L = ASSEMBLY_LOOK, GOLD = L.gold;
const S = 'body #indexmenu'; // (an id and an element over the page's own rules, whichever style lands later)

const CSS = `
${S} .im:has(.mk-asm){width:min(960px,calc(100% - 24px))}
${S} .mk-asm{width:100%;gap:10px;font:13px var(--f-sys,system-ui)}
${S} .mk-line{font:12px/1.35 var(--f-sys,system-ui);color:#e6cfb2;opacity:.85}
${S} .mk-cols{gap:16px}
${S} .mk-slots{gap:6px}
${S} .mk-slot{gap:6px;align-items:stretch;position:relative;min-height:44px;padding:4px 6px 4px 126px;border-radius:6px;
  background:linear-gradient(90deg,rgba(20,9,5,.55),rgba(20,9,5,.15));box-shadow:inset 0 -1px 0 rgba(255,226,196,.06)}
${S} .mk-slotname{position:absolute;left:0;top:4px;bottom:4px;width:118px;box-sizing:border-box;display:flex;align-items:center;padding:0 8px 0 10px;border-radius:4px 2px 2px 4px;
  font:700 10px/1.15 var(--f-title,serif);letter-spacing:.14em;color:#f6dcb8;text-shadow:0 1px 0 #1c0d08;
  background:radial-gradient(ellipse at 30% -20%,rgba(255,236,214,.22),transparent 60%),linear-gradient(180deg,rgba(var(--jtop,104,50,32),.85),rgba(var(--jbot,34,15,9),.95));
  box-shadow:inset 3px 0 0 ${GOLD},inset 0 1px 0 rgba(255,230,200,.3),inset 0 -2px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08}
${S} .mk-part{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-width:104px;max-width:150px;padding:5px 8px 6px;position:relative;
  border:0;border-radius:4px 7px 3px 6px;text-align:left;color:#2a140c;font:700 12px/1.1 var(--f-sys,system-ui);
  background:radial-gradient(circle,rgba(60,30,14,.16) 0 1px,transparent 1.5px) 0 0/6px 7px,linear-gradient(180deg,rgba(var(--jtop,104,50,32),.35) 0 9px,transparent 9px),linear-gradient(175deg,#ead8be,#c4a37e);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -2px 0 rgba(0,0,0,.25),0 0 0 1px #2a140c,0 3px 5px rgba(0,0,0,.35);transition:transform .08s}
${S} .mk-part:hover{transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 -2px 0 rgba(0,0,0,.25),0 0 0 1px #2a140c,0 0 0 3px rgba(var(--jsel,196,106,69),.6),0 4px 8px rgba(0,0,0,.4)}
${S} .mk-part.on{color:#fff3e2;text-shadow:0 1px 0 #1c0d08;
  background:radial-gradient(ellipse at 30% -10%,rgba(255,240,220,.35),transparent 55%),linear-gradient(180deg,rgb(var(--jsel,196,106,69)),rgba(var(--jbot,34,15,9),1));
  box-shadow:inset 0 1px 0 rgba(255,240,220,.55),inset 0 -2px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08,0 0 0 3px ${GOLD},0 0 12px rgba(255,211,106,.35)}
${S} .mk-part.on::after{content:'';position:absolute;right:4px;top:4px;width:9px;height:9px;background:${GOLD};
  clip-path:polygon(14% 52%,0 66%,38% 100%,100% 22%,86% 8%,38% 70%);filter:drop-shadow(0 1px 0 #1c0d08)}
${S} .mkg-name{display:flex;align-items:center;gap:5px;padding-right:10px}
${S} .mkg-name canvas{width:28px;height:28px;image-rendering:pixelated;flex:none}
${S} .mkg-chips{display:flex;flex-wrap:wrap;gap:3px}
${S} .mkg-chip{font:400 13px/1 'Jersey 15',monospace;letter-spacing:.03em;padding:1px 4px 0;border-radius:3px;
  background:rgba(40,20,10,.16);box-shadow:inset 0 0 0 1px rgba(40,20,10,.25)}
${S} .mk-part.on .mkg-chip{background:rgba(10,4,2,.35);box-shadow:inset 0 0 0 1px rgba(255,226,196,.2)}
${S} .mk-side{gap:8px;padding:10px 12px;border-radius:7px;
  background:radial-gradient(circle,rgba(255,236,214,.06) 0 1px,transparent 1.4px) 0 0/5px 6px,linear-gradient(180deg,rgba(var(--jtop,104,50,32),.35),rgba(var(--jbot,34,15,9),.6)),linear-gradient(180deg,#5a3222,#2e170e);
  box-shadow:inset 0 1px 0 rgba(255,230,200,.25),inset 0 -3px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08,0 0 0 3px rgba(148,96,62,.45)}
${S} .mkg-gauges{display:flex;flex-direction:column;gap:7px}
${S} .mkg-g{display:grid;grid-template-columns:72px 1fr auto;align-items:center;gap:2px 8px}
${S} .mkg-g b{font:700 10px var(--f-title,serif);letter-spacing:.14em;color:#f1d2b0}
${S} .mkg-g span{font:400 15px/1 'Jersey 15',monospace;color:#fff1dc;letter-spacing:.03em}
${S} .mkg-g.over span{color:${L.ember}}
${S} .mkg-tr{position:relative;height:11px;border-radius:2px;background:linear-gradient(180deg,#4a2a1c,#b89a7a 35%,#d8c0a0);box-shadow:inset 0 2px 2px rgba(0,0,0,.55),0 0 0 1px #1c0d08}
${S} .mkg-tr i{position:absolute;left:0;top:0;bottom:0;border-radius:2px}
${S} .mkg-tr .k{background:rgba(255,240,220,.28)}
${S} .mkg-tr .c{background:linear-gradient(180deg,rgba(255,255,255,.5),transparent 45%,rgba(0,0,0,.2)),rgb(var(--jsel,196,106,69));box-shadow:0 0 6px rgba(var(--jsel,196,106,69),.55)}
${S} .mkg-g.over .mkg-tr .c{background:repeating-linear-gradient(135deg,${L.ember} 0 5px,#b8301a 5px 10px);box-shadow:0 0 8px rgba(255,90,58,.7)}
${S} .mkg-tr u{position:absolute;top:-3px;bottom:-3px;width:2px;margin-left:-1px;background:${GOLD};box-shadow:0 0 0 1px #1c0d08}
${S} .mkg-tr em{position:absolute;right:4px;top:50%;transform:translateY(-50%);font:700 8px var(--f-sys,system-ui);letter-spacing:.14em;color:#fff2e0;text-shadow:0 1px 0 #1c0d08;font-style:normal}
${S} .mk-side .grp{margin:4px 0 2px}
${S} .mk-nums{gap:3px 12px;font:400 14px/1.05 'Jersey 15',monospace;color:#e9d4b8}
${S} .mk-num:nth-child(3n+1){font:600 11px/1.3 var(--f-sys,system-ui);color:#d9c0a0;letter-spacing:.04em;text-transform:uppercase}
${S} .mk-num:nth-child(3n+2){opacity:.6}
${S} .mk-num:nth-child(3n){color:#fff1dc}
${S} .mk-num.up{color:${L.cyan}}${S} .mk-num.up::after{content:' \\25B2';font-size:9px}
${S} .mk-num.down{color:${L.ember}}${S} .mk-num.down::after{content:' \\25BC';font-size:9px}
${S} .mk-refuse{position:relative;padding:5px 8px 5px 24px;border-radius:4px;color:#ffe2d4;font:12px/1.3 var(--f-sys,system-ui);
  background:linear-gradient(180deg,rgba(255,90,58,.28),rgba(120,20,8,.45));box-shadow:inset 0 0 0 1px rgba(255,120,80,.5),0 0 0 1px #1c0d08}
${S} .mk-refuse::before{content:'!';position:absolute;left:7px;top:50%;transform:translateY(-50%);width:12px;height:12px;border-radius:50%;text-align:center;
  font:900 10px/12px var(--f-sys,system-ui);color:#2a0a04;background:${L.ember}}
${S} .mk-btn{min-width:96px;border:0;border-radius:5px 8px 4px 7px;color:#2a140c;font:700 13px var(--f-title,serif);letter-spacing:.16em;
  background:radial-gradient(circle,rgba(60,30,14,.16) 0 1px,transparent 1.5px) 0 0/6px 7px,linear-gradient(180deg,#f0dcc0,#c9a882);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -3px 0 rgba(0,0,0,.25),0 0 0 1px #2a140c,0 0 0 3px ${GOLD},0 4px 8px rgba(0,0,0,.4)}
${S} .mk-btn:nth-child(2){color:#fff1dc;text-shadow:0 1px 0 #1c0d08;box-shadow:inset 0 1px 0 rgba(255,240,220,.4),inset 0 -3px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08,0 4px 8px rgba(0,0,0,.4);
  background:linear-gradient(100deg,transparent 47%,${GOLD} 48% 50%,transparent 51%),linear-gradient(62deg,transparent 30%,${GOLD} 31% 32.5%,transparent 33.5%),linear-gradient(180deg,#7a4630,#4e2a1c)}
${S} .mk-btn.mkg-style{color:#fff1dc;text-shadow:0 1px 0 #1c0d08;background:linear-gradient(180deg,rgba(255,220,190,.18),transparent 40%),linear-gradient(180deg,#b23a1e,#6e1c0c);
  box-shadow:inset 0 2px 0 ${GOLD},inset 0 -3px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08,0 0 0 3px ${GOLD},0 4px 8px rgba(0,0,0,.4)}
`;

const t = (v) => `${(+v).toFixed(v >= 10 ? 0 : 1)} t`;
/** A part's chips: its mass and its slot's own numbers (the page's numbers, only shown). */
function chipsOf(P) {
  if (!P) return ['—'];
  const out = [P.mass ? t(P.mass) : '0 t'];
  switch (P.slot) {
    case 'head': out.push(`LOCK ${P.lock} m`, `RADAR ${P.radar} m`); break;
    case 'core': out.push(`CRACK x${P.armour.toFixed(2)}`); break;
    case 'arms': out.push(`LOAD ${P.load} t`, `AIM x${P.aim}`); break;
    case 'legs': out.push(LEG_TYPES[P.type]?.label?.toUpperCase() || P.type, `LOAD ${P.load} t`); break;
    case 'booster': out.push(`${(P.thrust / 1000).toFixed(1)} MN`, `FIRE ${P.fire} kW`); break;
    case 'generator': out.push(`${P.output} kW`, `${(P.capacity / 1000).toFixed(0)} MJ`); break;
    case 'weapon': out.push(`POW ${P.k}`, `${P.range} m`); break;
    case 'back': out.push(P.range ? `${P.range} m` : `BLOCK ${Math.round((1 - P.block) * 100)}%`); break;
  }
  return out;
}
const glyphOf = (slot, id) => (slot === 'weaponL' || slot === 'weaponR' ? weaponGlyph(id) : slot === 'back' ? ({ missiles: 'mkmissiles', shield: 'mkshield' }[id] || null) : null);

function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

/** One gauge: its label, chosen against its limit, the kept fill as a ghost, its check's word past the limit. */
function gauge(label, kept, now, limit, unit, word) {
  const g = el('div', `mkg-g${now > limit ? ' over' : ''}`), top = Math.max(limit * 1.25, now, kept, 1e-6), pc = (v) => `${Math.min(100, (v / top) * 100).toFixed(1)}%`;
  const tr = el('div', 'mkg-tr'), k = el('i', 'k'), c = el('i', 'c'), u = el('u');
  k.style.width = pc(kept); c.style.width = pc(now); u.style.left = pc(limit); tr.append(k, c, u);
  if (now > limit) tr.appendChild(el('em', '', word));
  g.append(el('b', '', label), tr, el('span', '', `${now.toFixed(now >= 100 ? 0 : 1)} / ${limit} ${unit}`));
  return g;
}

/** The page as drawn now, dressed (once a drawing). */
function dress(game, root) {
  const asm = root.querySelector('.mk-asm:not([data-dressed])'); if (!asm) return;
  asm.dataset.dressed = '1';
  const H = game.hangar, St = H?.state; if (!St) return;
  const rows = asm.querySelectorAll('.mk-slot');
  SLOTS.forEach((slot, i) => {
    const row = rows[i]; if (!row) return;
    const ids = St.owned(slot), btns = row.querySelectorAll('.mk-part');
    btns.forEach((b, j) => {
      const id = ids[j], P = id ? PARTS[id] : null, name = el('div', 'mkg-name'), gl = glyphOf(slot, id);
      if (gl) { const c = uiIcon(`touch.${gl}`, 'gold'), cv = el('canvas'); cv.width = c.width; cv.height = c.height; cv.getContext('2d').drawImage(c, 0, 0); name.appendChild(cv); }
      name.appendChild(document.createTextNode(b.textContent)); b.textContent = '';
      const chips = el('div', 'mkg-chips'); for (const s of chipsOf(P)) chips.appendChild(el('span', 'mkg-chip', s));
      b.append(name, chips);
    });
  });
  const side = asm.querySelector('.mk-side'), draft = H.assembly?.draft; if (!side || !draft) return;
  const now = assemble(draft), kept = St.stats, box = el('div', 'mkg-gauges');
  box.append(
    gauge('LOAD', kept.mass, now.mass, now.load, 't', 'OVERWEIGHT'),
    gauge('ARM LOAD', kept.armMass, now.armMass, now.armLoad, 't', 'ARMS HEAVY'),
    gauge('ENERGY', kept.draw, now.draw, now.output, 'kW', 'UNDERPOWERED'));
  side.prepend(el('div', 'grp', 'THE FRAME CHOSEN'), box);
  const row = side.querySelector('.mk-row'); // (the style window's tile: the looks beside the parts)
  if (row && game.mechStyleWindow) { const b = el('button', 'mk-btn mkg-style', 'STYLE'); b.title = "The mech's looks: its form, helm, pauldrons, harness, hip piece, back piece, cradle mount and gunblade."; b.onclick = (e) => { e.stopPropagation(); game.mechStyleWindow.open({ from: 'gantry' }); }; row.appendChild(b); }
}

let installed = false;
export function installAssemblyLook(game) {
  if (installed || typeof document === 'undefined' || typeof MutationObserver === 'undefined') return; installed = true;
  installMechStyleWindow(game); // (the style window the STYLE tile opens, and `/mechstyle` alone)
  const st = document.createElement('style'); st.id = 'mech-assembly-look'; st.textContent = CSS; document.head.appendChild(st);
  let tries = 0;
  const watch = () => { // (the index window may be built after the hangar: looked for again until it stands)
    const root = document.getElementById('indexmenu');
    if (!root) { if (++tries < L.tries) setTimeout(watch, L.retry * 1000); return; }
    new MutationObserver(() => { if (game.indexMenu?.page?.name === 'mech' || root.querySelector('.mk-asm:not([data-dressed])')) dress(game, root); }).observe(root, { childList: true, subtree: true });
  };
  watch();
}
