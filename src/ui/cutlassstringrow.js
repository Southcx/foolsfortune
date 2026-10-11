// ---------------------------------------------------------------------------------------
// THE STRING ROW: the cutlass's own UI (the owner, 2026-10-11: "each tool should have its own UI according to what it does, much like the
// Dreamvane already"; docs/plans/MELEE-LOADOUT.md section 4). While the cutlass is drawn, the melee loadout's string sits as a short row
// of pips at the bottom middle of the screen, one a slot (4 to 8), threaded on a line as the blows are threaded on LMB:
//
//   THE LIT PIP     the slot the next LMB plays: the gold palette, raised two art pixels (the psygun's shell palette raises its chosen
//                   shell the same way). The string's place moves as the blows are struck and starts over where the engine starts it
//                   over (a string left past its reset, a pause string's run); a blink cancel keeps it (the place is kept), so the lit
//                   pip stays where it was.
//   THE STRUCK      the slots this run has struck, in the clay palette, whole; the slots still ahead, the same at half strength; the
//                   thread between them bright as far as the lit pip, dim past it.
//   THE FORK        a pause string (the engine's `strings.pause`: a press 0.25-0.8 s after the slot it branches from ends) grows as a
//                   second row over the first, its thread rising from the gap after that slot: shown while a press would take it (the
//                   pause's window open: its first pip lit, no slot of the string lit) and while its run goes on (its next pip lit;
//                   its last struck, the string's first lit again, as the engine begins it again). The string's row never moves.
//   THE GLINT       while a blow's recovery is open for THE PAID CUT (the engine's own answer, its cost affordable: a press now pays
//                   Lachryma and the next blow begins at once), the lit pip wears the oil film in the hues the paid cut's afterimage
//                   walks (vfx/oxidation.js featTint, as vfx/afterimage.js wears them), its bevel kept as shading, and a pale diagonal
//                   glint runs across it again and again: the window seen. (Gold on gold hid a band alone: the film's own gold.)
//   A PIP           the move's own UI icon where it has one (its catalogue row's `icon`, else `sondelass.<id>`: ui/icons/icons.js),
//                   else a plain shape for what the move does to a body: a cut that rocks it (stagger) a small diamond, a blow that
//                   throws it (knock: the finisher) the diamond grown with a bright core, a lift (launch) a double chevron up, a guard
//                   broken a square cracked through. Bigger is heavier (docs/ART.md precept 6: magnitude is size).
//   FADE            out of a fight (game.combat) and idle a few real seconds, it fades; the first blow brings it back at once. Stowed, or
//                   another form or tool in the hands (the belt says), it is gone that frame, nothing left over.
//
// No words and no numbers (CLAUDE.md, Feedback; docs/plans/CLARITY.md: shown before it is said). The maker's pixel kit's rule: drawn at
// 1x into one small canvas in the icons' hand (ui/icons/hand.js: a light shape bevelled from the top left, keylined dark, so it reads on
// any ground), palette-swapped for a state, never redrawn, and scaled by a whole number (ui/pixel.js). Read, never driven: the string,
// its place (a pause string's too) and the paid cut's window are the combo engine's (tools/moveset.js `string`, `stringPlace()`,
// `branches()`, `paidCutOpen()`), the
// loadout read through the engine (a saved loadout is the engine's to hand it), so the row never says other than the blade does.
//
// Prior art, as on a museum label:
//   God Hand (Clover, 2006): the Combo Tree, the string of slots the square button walks, shown as a row of boxes the player filled.
//   Devil May Cry's and Bayonetta's combo lists (a pause drawn as a gap, the string forking from the blow before it): the fork.
//   The psygun's shell palette (feedback/hud.js): the chosen one raised and lit, the rest stepped back.
//   Bayonetta's dodge offset: the combo's place held through a dodge, which is why the lit pip stays after a blink.
//   The fighting games' cancels made visible (Guilty Gear's Roman Cancel flash, Street Fighter 6's Drive Rush in its green afterimage):
//   a cancel is something you see, here before it is taken, on the blow it would go into.
//   The 8- and 16-bit consoles' palette swaps and keylines (Mega Man's, Kirby's): one drawing, a palette a state.
//
//   const r = new CutlassStringRow(game, px)   r.update(rawDt)   r.read() -> { shown, alpha, len, next, struck, glint, slots, branch }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { featTint } from '../vfx/oxidation.js';
import { grid, toneGrid } from './icons/hand.js';
import { ICON_PALS, hasIcon, uiIcon } from './icons/icons.js';

const CELL = 16, GAP = 4, RAISE = 2, LIFT = 2; // a pip's cell (14 authored, the keyline round it), the thread between two, the lit pip's lift, the fork's row over the string's: art pixels
const IDLE = 3, IN = 14, OUT = 2.2;          // real s idle before it fades (out of a fight); how fast it comes in and goes, /s
const SWEEP = 0.2, REST = 0.1, STEPS = 24;   // the glint: real s to cross the pip's body (from its first pixel: a window may be 4 frames), between two crossings, and its steps
const WALK = 1.1;                            // how fast the glint's hue walks the film, a real second (the afterimage's 0.5 over its 0.45 s life)

const d1 = (x, y) => Math.abs(x - 6.5) + Math.abs(y - 6.5);
/** The plain pips, by what the move does to a body (its catalogue row's `effect`), 14 x 14 in the icons' hand. */
const PIP_ART = {
  stagger: grid(14, 14, (x, y) => (d1(x, y) <= 4.6 ? '#' : null)),
  knock: grid(14, 14, (x, y) => { const d = d1(x, y); return d <= 2.1 ? '+' : d <= 6.6 ? '#' : null; }),
  launch: [
    '..............',
    '......##......',
    '.....####.....',
    '....######....',
    '...###..###...',
    '..###....###..',
    '..##......##..',
    '......##......',
    '.....####.....',
    '....######....',
    '...###..###...',
    '..###....###..',
    '..##......##..',
    '..............',
  ],
  guardBreak: grid(14, 14, (x, y) => (x >= 2 && x <= 11 && y >= 2 && y <= 11 ? (Math.abs(x - 2 - (y - 2) * 0.55 - 2.5) < 0.6 && y < 10 ? 'x' : '#') : null)),
};
const TONES = new Map();
const tonesOf = (effect) => { const k = PIP_ART[effect] ? effect : 'stagger'; if (!TONES.has(k)) TONES.set(k, toneGrid(PIP_ART[k])); return TONES.get(k); };
const ART = new Map();
/** A plain pip at 1x in a palette (cached). */
function pipArt(effect, pal) {
  const key = `${effect}|${pal}`;
  if (ART.has(key)) return ART.get(key);
  const { w, h, tones } = tonesOf(effect), L = ICON_PALS[pal] || ICON_PALS.clay, c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d'), d = g.createImageData(w, h);
  for (let i = 0; i < tones.length; i++) { const t = tones[i]; if (t < 0) continue; const [r, gg, b] = L[t]; d.data.set([r, gg, b, 255], i * 4); }
  g.putImageData(d, 0, 0);
  ART.set(key, c);
  return c;
}
/** A slot's picture: the move's icon where there is one (`row.icon`, else `sondelass.<id>`), else its plain pip (a move with no catalogue
 *  row, a pause string's, by its own blow: one that throws, push 6 m/s or more, a knock). */
function slotArt(row, id, pal, def = null) {
  const icon = row?.icon || `sondelass.${id}`;
  return hasIcon(icon) ? uiIcon(icon, pal) : pipArt(row?.effect || ((def?.hit?.push ?? 0) >= 6 ? 'knock' : 'stagger'), pal);
}

const _c = new THREE.Color(), _rgb = { r: 0, g: 0, b: 0 };
const CSS = `
#cutlassstring { position: absolute; left: 50%; bottom: calc(80px + var(--cine, 0vh)); transform: translateX(-50%); pointer-events: none; display: none; }
#cutlassstring canvas { filter: drop-shadow(0 1px 0 rgba(8,3,1,.45)); }
`;

export class CutlassStringRow {
  constructor(game, px) {
    this.game = game; this.px = px;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'cutlassstring';
    this.c = document.createElement('canvas'); this.c.width = this.c.height = 1;
    this.view = px.show(this.c, { k: 1 });
    this.el.appendChild(this.view);
    document.getElementById('hud')?.appendChild(this.el);
    this.alpha = 0; this.idle = 0; this.shown = false; this.key = ''; this.glintT = -1; this.ph = 0;
    this.state = { len: 0, next: -1, struck: 0, glint: false, slots: [], branch: null };
  }

  /** The cutlass in the hands, as the belt says (the Sondelass drawn, in its cutlass form), or null. */
  cutlass() {
    const g = this.game, tool = g.techs?.get?.('sondelass');
    if (!tool || g.belt?.inHand?.id !== 'sondelass' || tool.drawT < 0.5 || tool.drawTarget <= 0 || tool.form !== 'cutlass' || g.god?.controlling) return null;
    return tool.cutlass;
  }

  update(dt) {
    const g = this.game, cut = this.cutlass();
    if (!cut) { this.hide(true); return; }
    const M = cut.moves, string = M.string || [], place = M.stringPlace(), br = place.branch;
    // fade: out of a fight and idle IDLE real s, out; a blow, back at once
    const busy = !!M.cur || cut.busy;
    this.idle = busy ? 0 : this.idle + dt;
    const fight = !!g.combat?.engaged, want = (fight || this.idle < IDLE) && !document.body.classList.contains('cine');
    this.alpha += ((want ? 1 : 0) - this.alpha) * (1 - Math.exp(-dt * (want ? IN : OUT)));
    if (busy && want) this.alpha = Math.max(this.alpha, 0.6); // (the first blow: back at once)
    if (this.alpha < 0.01 && !want) { this.hide(false); return; }
    if (!this.shown) { this.shown = true; this.el.style.display = 'block'; }
    this.el.style.opacity = this.alpha.toFixed(3);
    // the paid cut's window, over the lit pip: the next blow is the string's or its fork's (a ground blow, a pause, the dash, a charge,
    // the iaido's cut or a special into the next; never an air blow or the launcher, whose cut goes on in the air)
    const c = M.cur, litId = br && br.next >= 0 ? br.to[br.next] : string[place.next], nd = litId && M.def(litId);
    const into = c && c.kind !== 'air' && c.kind !== 'launcher' && g.player?.grounded;
    const open = !!into && !!litId && M.paidCutOpen(nd ? M.rule(nd)?.cost ?? nd.cost ?? 0 : 0);
    if (open) { if (this.glintT < 0) { this.glintT = 0; this.ph = (this.ph + 0.37) % 1; } else this.glintT += dt; } else this.glintT = -1;
    const u = this.glintT < 0 ? null : (this.glintT % (SWEEP + REST)) / SWEEP, band = u == null || u > 1 ? null : Math.floor(u * STEPS) / STEPS; // (how far across the body: stepped)
    this.state = { len: string.length, next: place.next, struck: place.struck, glint: open, slots: string.slice(), branch: br ? { at: br.at, to: br.to.slice(), next: br.next, struck: br.struck } : null };
    const hue = open ? Math.floor((this.ph + this.glintT * WALK) * 48) : -1; // (the film's hue walks while it is open: a step at a time)
    const key = `${string.join(',')}|${place.next}|${place.struck}|${br ? `${br.at}:${br.to.join(',')}:${br.next}:${br.struck}` : '-'}|${band ?? '-'}|${hue}|${this.px.scale()}`;
    if (key !== this.key) { this.key = key; this.paint(M, string, place, open, band); }
  }

  /** Out of sight (`gone`: stowed or swapped, so the next draw shows it afresh; else faded, idle). */
  hide(gone) {
    this.alpha = 0; this.glintT = -1;
    if (gone) { this.idle = 0; this.state = { len: 0, next: -1, struck: 0, glint: false, slots: [], branch: null }; }
    if (!this.shown) return;
    this.shown = false; this.key = '';
    this.el.style.display = 'none'; this.el.style.opacity = '0';
  }

  /** Draw the row at 1x and hand it to the kit to scale. */
  paint(M, string, place, open, band) {
    const n = string.length, c = this.c, step = CELL + GAP, br = place.branch, forks = M.branches?.().filter((b) => b.at < n) || [];
    const need = Math.max(n, ...forks.map((b) => b.at + 1 + b.to.length)), pad = (need - n) * step; // (a fork longer than the string: as much room each side, the string kept centred)
    const top = forks.length ? CELL + RAISE + LIFT : 0; // (the fork's row, kept whether it shows or not: bottom-anchored, the string never moves)
    const W = Math.max(1, (2 * need - n) * step - GAP), H = top + CELL + RAISE;
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false; g.clearRect(0, 0, W, H); // (the glint reads the lit pip back)
    const clay = ICON_PALS.clay, rgb = (t) => `rgb(${clay[t][0]},${clay[t][1]},${clay[t][2]})`;
    // a row of pips (the string's, or the fork's) from x0, y0: the thread through their middles, its shadow under it, bright as far as
    // the lit pip, dim past it; then the pips, the lit one gold and raised, the struck clay, those ahead at half strength
    const row = (ids, x0, y0, lit, struck) => {
      const ty = y0 + RAISE + CELL / 2 - 1;
      for (let i = 0; i < ids.length - 1; i++) {
        const xa = x0 + i * step + CELL - 1, xb = xa + GAP + 2, on = i < lit || i + 1 < struck;
        g.globalAlpha = on ? 1 : 0.5;
        g.fillStyle = rgb(on ? 10 : 7); g.fillRect(xa, ty, xb - xa, 1);
        g.fillStyle = rgb(0); g.fillRect(xa, ty + 1, xb - xa, 1);
      }
      for (let i = 0; i < ids.length; i++) {
        const s = i === lit ? 'lit' : i < struck ? 'struck' : 'ahead';
        g.globalAlpha = s === 'ahead' ? 0.5 : 1;
        g.drawImage(slotArt(M.catalogueRow(ids[i]), ids[i], s === 'lit' ? 'gold' : 'clay', M.def(ids[i])), x0 + i * step, y0 + (s === 'lit' ? 0 : RAISE));
      }
      g.globalAlpha = 1;
    };
    row(string, pad, top, place.next, place.struck);
    // the fork: its thread rises from the gap after the slot it branches from (over the string's own thread, dim past it) to its row's
    // middle, then along to its first pip (the walked way: bright), its shadow beside and under it
    if (br) {
      const fx = pad + br.at * step + CELL + GAP / 2 - 1, fy = RAISE + CELL / 2 - 1, gy = top + RAISE + CELL / 2 - 1, x1 = pad + (br.at + 1) * step;
      g.fillStyle = rgb(10); g.fillRect(fx, fy, 1, gy - fy + 1); g.fillRect(fx, fy, x1 - fx + 1, 1);
      g.fillStyle = rgb(0); g.fillRect(fx + 1, fy + 1, 1, gy - fy - 1); g.fillRect(fx + 1, fy + 1, x1 - fx, 1);
      row(br.to, x1, 0, br.next, br.struck);
    }
    // the glint: while the window is open the lit pip's body wears the oil film's hue (the paid cut's afterimage's, walking), its bevel
    // kept as shading, and a pale band runs across it from the body's first pixel to its last, a whole art pixel at a time; the keyline
    // stays the keyline
    const onFork = !!br && br.next >= 0, li = onFork ? br.at + 1 + br.next : place.next, ly = onFork ? 0 : top;
    if (open && li >= 0 && (onFork || li < n)) {
      const x = pad + li * step, d = g.getImageData(x, ly, CELL, CELL), a = d.data, body = (i, xx) => xx >= 1 && xx <= CELL - 2 && a[i + 3] && a[i] + a[i + 1] + a[i + 2] >= 120; // (its edge columns are the keyline and the thread)
      let lo = 99, hi = -1;
      for (let yy = 0; yy < CELL; yy++) for (let xx = 0; xx < CELL; xx++) if (body((yy * CELL + xx) * 4, xx)) { lo = Math.min(lo, xx + yy); hi = Math.max(hi, xx + yy); }
      const at = band == null ? -99 : lo - 1 + Math.floor(band * (hi - lo + 3)); // (between two crossings, no band: the film stays)
      featTint(this.ph + this.glintT * WALK, _c, { bright: 1 }).getRGB(_rgb, THREE.SRGBColorSpace);
      const film = [_rgb.r, _rgb.g, _rgb.b].map((v) => Math.min(1, v));
      for (let yy = 0; yy < CELL; yy++) for (let xx = 0; xx < CELL; xx++) {
        const i = (yy * CELL + xx) * 4;
        if (!body(i, xx)) continue;
        const L = (0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2]) / 255, k = xx + yy - at, m = k === 1 ? 0.8 : k === 0 || k === 2 ? 0.45 : 0;
        for (let ch = 0; ch < 3; ch++) { const v = Math.min(1, film[ch] * (0.15 + 0.9 * L)); a[i + ch] = Math.round((v + (1 - v) * m) * 255); }
      }
      g.putImageData(d, x, ly);
    }
    this.px.paint(this.view);
  }

  /** What the eye can read off the row now (for a test): whether it is shown, its slots, the lit one, how many struck, the glint, the
   *  fork (a pause string's row: { at, to, next, struck }, or null). */
  read() { const s = this.state; return { shown: this.shown && this.alpha > 0.5, alpha: +this.alpha.toFixed(2), len: s.len, next: s.next, struck: s.struck, glint: s.glint, slots: s.slots, branch: s.branch }; }
}
