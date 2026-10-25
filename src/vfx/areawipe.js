// ---------------------------------------------------------------------------------------
// THE AREA WIPE: the cover over a change of area (docs/ARCHITECTURE.md "Areas", Petra's; docs/plans/AREAS.md, Dovina's), crossed under
// the seam as its kind 'area' (render/seam.js: `seam.cross(fn, { kind: 'area', from, to, name, edge, progress })`). The owner: "Loading
// screens can be really stylish when done well, like it helps build anticipation in the viewer." So it is a loading screen on purpose,
// in the house's language, never a black fade. Four beats, all on the game's clock (raw dt, clamped), so a replay steps through it:
//   THE FRAME    (0.55 real s) the view is drawn into a kiln-fired frame: four slabs of the island's dress (the Clay dress on Anagami:
//                earthenware, its grog speckled, the window colour fired faintly into it; Brine's tarred salt on the Emocean) slide in
//                from the view's edges, the glazed lip of the hole they leave running round what is still seen, which darkens into
//                it. How you left leads the close: an arch, a door or a gap closes like doors (the sides first), a sandfall from above
//                (the top first), a crest from the top and bottom together; anything else, all four at once. Then `onCovered`.
//   THE CARD     (held) on the clay ground, the destination: the Gate's three glazed hoops (vfx/gatering.js: celadon, shino, oribe)
//                turning slowly round a small painted card of where you go (vfx/areacards.js AREA_CARDS: its painting, asked for
//                as the frame closes; drawn from its palette if the painting is not there by the close's end; the card comes in
//                once it stands), its layer small in the System's dot face over the name set in Cinzel, and under it a
//                thread of the film (the labradorite's schiller, OVERLAY.md 10.4): filled by the seam's progress when it is given
//                (`progress()` 0..1, never going back), else breathing, a glint running along it. The card drifts, the hoops turn,
//                the thread moves: held for 0.2 or for many real seconds it never looks stuck.
//   THE READ     the cover holds at least 0.6 real s after it closed, so the name can be read even when the area builds in a frame.
//   THE OPENING  (on open(): 0.18 s, then 0.55 s) the card and name go first, then the slabs part outward to the edges, all four.
// Nothing flickers: every amount eases. The HUD steps out while it stands (game.ui.want 'areaWipe') and comes back as the player had it.
//
// How it is drawn: DOM and CSS over the canvas, in the overlay's materials (ui/brineframe.js's dot, film and gold; ui/goalswindow.js's
// Clay dress; ui/theme.js's faces): 0 shader programs. Built the first time it closes; between crossings it is display:none and its one
// canvas (the card, 320 x 180) is let go. pointer-events none, sized in the 480-line dot (--d), so it holds at 390 x 844 and 844 x 390.
// The frame is not caught (a held copy of the frame would need the glow's program, as the aberrant wipe does): the live view darkens
// inside the closing lip instead.
//
// Prior art (a museum label): Final Fantasy XII's zone change (Square Enix, 2006: the view dims to the area's name card, the region over
// the area, in Ivalice's capitals) for the name and its layer; Okami's brush wipes and painted location cards (Clover, 2006) for the
// card's ragged painted edge; Persona 5's transitions (Atlus, 2016: the screen carved by slabs that slide in from the edges and part
// again, the calendar card) for the slabs and their lead; the shoji's two panels for the doors' close; this game's Gate (vfx/gatering.js,
// after .hack's Chaos Gate) for the three hoops; the maw wipe (vfx/mawwipe.js) for the contract.
//
//   game.areaWipe = new AreaWipe(game)
//   .close(onCovered, { from, to, name, edge, progress }?)  -> false while one is under way; `onCovered` once the view is covered
//   .open()        the opening, after the read (at once when the read is done)
//   .update(rawDt) each frame (boot/frame.js)   .active   .covered   .dispose()
// ---------------------------------------------------------------------------------------
import { dot, FILM, GOLD, SALT } from '../ui/brineframe.js';
import { FONT } from '../ui/theme.js';
import { cardOf, showAreaCard } from './areacards.js';

export const AREA_WIPE = { close: 0.55, cardIn: 0.5, cardAt: 0.3, read: 0.6, cardOut: 0.18, open: 0.55, card: [320, 180] }; // (real seconds; the card's canvas in px)
const LEAD = { // how you left leads the close: each side's delay, a fraction of the close (top, right, bottom, left)
  arch: [0.4, 0, 0.4, 0], door: [0.4, 0, 0.4, 0], gap: [0.35, 0, 0.35, 0], sandfall: [0, 0.4, 0.3, 0.4], crest: [0, 0.35, 0, 0.35],
};
const HOOPS = [ // the Gate's (vfx/gatering.js): colour, size against the card's width, tilt (deg), turn (deg a real second)
  { c: '#8fb59c', w: 1.32, tilt: 66, turn: 17 }, { c: '#ece2d2', w: 1.18, tilt: 20, turn: -24 }, { c: '#7a9450', w: 1.05, tilt: -34, turn: 31 },
];
const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

const CSS = `
.aw{position:fixed;inset:0;z-index:12;pointer-events:none;overflow:hidden;display:none;--d:1.5px;contain:strict}
.aw.on{display:block}
.aw-slab{position:absolute;will-change:transform}
.aw-t{left:0;right:0;top:0;height:calc(50% + 1px)} .aw-b{left:0;right:0;bottom:0;height:calc(50% + 1px)}
.aw-l{top:0;bottom:0;left:0;width:calc(50% + 1px)} .aw-r{top:0;bottom:0;right:0;width:calc(50% + 1px)}
.aw[data-dress=clay] .aw-slab{background:
  radial-gradient(circle,rgba(255,236,214,.16) 0 calc(.5*var(--d)),transparent calc(.6*var(--d))) 0 0/calc(4*var(--d)) calc(5*var(--d)),
  radial-gradient(circle,rgba(40,20,10,.35) 0 calc(.6*var(--d)),transparent calc(.7*var(--d))) calc(2*var(--d)) calc(1*var(--d))/calc(6*var(--d)) calc(7*var(--d)),
  radial-gradient(140% 120% at 50% 50%,rgba(var(--jtop,104,50,32),.18),rgba(var(--jbot,34,15,9),.42)),
  linear-gradient(180deg,#6e3e2a,#43241a)}
.aw[data-dress=brine] .aw-slab{background:
  radial-gradient(circle,rgba(239,230,210,.16) 0 calc(.5*var(--d)),transparent calc(.6*var(--d))) 0 0/calc(5*var(--d)) calc(5*var(--d)),
  radial-gradient(circle,rgba(239,230,210,.08) 0 calc(.5*var(--d)),transparent calc(.6*var(--d))) calc(2*var(--d)) calc(3*var(--d))/calc(7*var(--d)) calc(9*var(--d)),
  linear-gradient(180deg,rgba(var(--jtop,104,50,32),.35),rgba(var(--jbot,34,15,9),.5)),linear-gradient(180deg,#1d1a26,#0d0a12)}
.aw-slab::after{content:'';position:absolute;background:linear-gradient(var(--gd),rgba(255,235,210,.0),rgba(var(--jtop,104,50,32),.9) 55%,rgba(255,240,220,.55) 85%,rgba(20,8,4,.8))}
.aw-t::after{left:0;right:0;bottom:0;height:calc(5*var(--d));--gd:180deg} .aw-b::after{left:0;right:0;top:0;height:calc(5*var(--d));--gd:0deg}
.aw-l::after{top:0;bottom:0;right:0;width:calc(5*var(--d));--gd:90deg} .aw-r::after{top:0;bottom:0;left:0;width:calc(5*var(--d));--gd:270deg}
.aw-lip{position:absolute;border-radius:calc(7*var(--d));will-change:left,top,right,bottom,opacity;
  box-shadow:0 0 0 calc(1*var(--d)) ${GOLD},0 0 0 calc(2*var(--d)) rgba(20,8,4,.9),inset 0 0 0 calc(1*var(--d)) rgba(10,140,191,.55),
  inset 0 0 calc(40*var(--d)) rgba(7,3,13,var(--dim,0)),inset 0 0 0 200vmax rgba(7,3,13,calc(var(--dim,0)*.55))}
.aw-heart{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;
  width:min(calc(176*var(--d)),78vw);opacity:0;will-change:opacity}
.aw-stage{position:relative;width:100%;aspect-ratio:16/9;perspective:calc(400*var(--d))}
.aw-hoop{position:absolute;left:50%;top:50%;border-radius:50%;border:max(2px,calc(1.5*var(--d))) solid;opacity:.75;
  box-shadow:0 0 calc(4*var(--d)) rgba(255,230,190,.25);will-change:transform}
.aw-card{position:absolute;inset:0;padding:calc(2*var(--d));border-radius:calc(4*var(--d));
  background:linear-gradient(160deg,rgba(255,240,220,.5),rgba(var(--jtop,104,50,32),.95) 40%,rgba(var(--jbot,34,15,9),1));
  box-shadow:0 0 0 calc(1*var(--d)) rgba(20,8,4,.85),0 calc(3*var(--d)) calc(8*var(--d)) rgba(0,0,0,.55);overflow:hidden}
.aw-card canvas{display:block;width:100%;height:100%;will-change:transform}
.aw-layer{margin-top:calc(9*var(--d));font-family:${FONT.sys};font-size:max(12px,calc(8*var(--d)));letter-spacing:.32em;color:${SALT};opacity:.7;
  text-transform:uppercase;-webkit-font-smoothing:none;text-align:center}
.aw-name{margin-top:calc(2*var(--d));font-family:${FONT.title};font-weight:700;font-size:max(20px,calc(17*var(--d)));color:${SALT};
  text-transform:uppercase;text-align:center;line-height:1.05;max-width:92vw;text-shadow:0 calc(1*var(--d)) 0 rgba(20,8,4,.9),0 0 calc(10*var(--d)) rgba(0,0,0,.5);
  will-change:letter-spacing}
.aw-thread{position:relative;margin-top:calc(6*var(--d));width:100%;height:max(2px,calc(2*var(--d)));background:rgba(20,8,4,.75);
  box-shadow:0 calc(1*var(--d)) 0 rgba(255,226,196,.14);overflow:hidden}
.aw-thread i{position:absolute;top:0;bottom:0;left:0;width:0;background:linear-gradient(90deg,${FILM.join(',')},${FILM[0]});
  background-size:200% 100%;will-change:left,width,opacity}
.aw-thread b{position:absolute;top:0;bottom:0;width:12%;background:linear-gradient(90deg,transparent,rgba(255,250,235,.85),transparent);will-change:left}
`;

export class AreaWipe {
  constructor(game) {
    this.game = game;
    this.el = null; // (built the first time it closes)
    this.phase = null; this.t = 0; this.held = 0; this.ot = 0; this.cb = null; this.wantOpen = false; this.prog = 0; this.opts = {}; this.cardT = null;
  }

  make() {
    if (!document.getElementById('aw-css')) { const st = document.createElement('style'); st.id = 'aw-css'; st.textContent = CSS; document.head.appendChild(st); }
    const el = this.el = document.createElement('div'); el.className = 'aw'; el.dataset.dress = 'clay';
    el.innerHTML = '<div class="aw-slab aw-t"></div><div class="aw-slab aw-b"></div><div class="aw-slab aw-l"></div><div class="aw-slab aw-r"></div><div class="aw-lip"></div>'
      + '<div class="aw-heart"><div class="aw-stage">' + HOOPS.map(() => '<div class="aw-hoop"></div>').join('') + '<div class="aw-card"><canvas></canvas></div></div>'
      + '<div class="aw-layer"></div><div class="aw-name"></div><div class="aw-thread"><i></i><b></b></div></div>';
    const q = (s) => el.querySelector(s);
    this.$ = { lip: q('.aw-lip'), t: q('.aw-t'), r: q('.aw-r'), b: q('.aw-b'), l: q('.aw-l'), heart: q('.aw-heart'), hoops: [...el.querySelectorAll('.aw-hoop')],
      canvas: q('canvas'), layer: q('.aw-layer'), name: q('.aw-name'), fill: q('.aw-thread i'), glint: q('.aw-thread b') };
    document.body.appendChild(el);
  }

  get active() { return !!this.phase; }
  get covered() { return this.phase === 'held'; }

  /** The frame closes in from the edges; then `onCovered` (the area changes behind it). opts: { from, to, name, edge, progress }. */
  close(onCovered, opts = {}) {
    if (this.phase) return false; // (one crossing at a time: the seam then uses its plain dark cover)
    if (!this.el) this.make();
    opts = opts || {};
    const A = cardOf(opts.to), name = opts.name ?? A.name ?? '';
    const $ = this.$, [cw, ch] = AREA_WIPE.card;
    $.canvas.width = cw; $.canvas.height = ch; this.cardT = null;
    showAreaCard($.canvas, opts.to, { name, wait: AREA_WIPE.close }, () => { this.cardT = this.phase ? this.t : 0; }); // (the card comes in once it stands; at once when it stood before the close began)
    $.name.textContent = name; $.name.style.display = name ? '' : 'none';
    $.layer.textContent = A.layer || ''; $.layer.style.display = $.layer.textContent ? '' : 'none';
    this.el.dataset.dress = A.dress === 'brine' ? 'brine' : 'clay';
    this.lead = LEAD[opts.edge] || [0, 0, 0, 0];
    HOOPS.forEach((h, i) => { const s = $.hoops[i].style; s.borderColor = h.c; s.width = `${h.w * 100}%`; s.height = `${h.w * 100 * 0.5625}%`; s.marginLeft = `${-h.w * 50}%`; s.marginTop = `${-h.w * 50 * 0.5625}%`; });
    this.opts = opts; this.cb = onCovered || null; this.phase = 'close'; this.t = 0; this.held = 0; this.ot = 0; this.wantOpen = false; this.prog = 0;
    this.el.classList.add('on'); this.game.ui?.want?.('areaWipe', true);
    this.apply();
    return true;
  }

  /** The card goes, then the slabs part outward (after the read). */
  open() { if (this.phase === 'close' || this.phase === 'held') this.wantOpen = true; }

  update(dt) {
    if (!this.phase) return;
    dt = Math.min(Math.max(dt || 0, 0), 0.1); // (a stalled frame does not jump the frame shut)
    this.t += dt;
    if (this.phase === 'close' && this.t >= AREA_WIPE.close) {
      this.phase = 'held';
      if (this.cb) { const cb = this.cb; this.cb = null; cb(); }
    } else if (this.phase === 'held') {
      this.held += dt;
      if (this.wantOpen && this.held >= AREA_WIPE.read) { this.phase = 'open'; this.ot = 0; this.prog = 1; }
    } else if (this.phase === 'open') {
      this.ot += dt;
      if (this.ot >= AREA_WIPE.cardOut + AREA_WIPE.open) { this.finish(); return; }
    }
    this.apply();
  }

  /** Lays every amount for the moment it is at. */
  apply() {
    const W = AREA_WIPE, $ = this.$, el = this.el;
    el.style.setProperty('--d', `${dot()}px`);
    let side, heart;
    if (this.phase === 'open') {
      const k = 1 - ease((this.ot - W.cardOut * 0.6) / W.open);
      side = [k, k, k, k];
      heart = 1 - ease(this.ot / W.cardOut);
    } else {
      const u = this.t / W.close;
      side = this.lead.map((d) => ease((u - d) / (1 - d)));
      heart = this.cardT == null ? 0 : ease((this.t - Math.max(W.cardAt, this.cardT)) / W.cardIn);
    }
    const [kt, kr, kb, kl] = side;
    $.t.style.transform = `translateY(${(kt - 1) * 100}%)`; $.b.style.transform = `translateY(${(1 - kb) * 100}%)`;
    $.l.style.transform = `translateX(${(kl - 1) * 100}%)`; $.r.style.transform = `translateX(${(1 - kr) * 100}%)`;
    const ls = $.lip.style, kMin = Math.min(kt, kr, kb, kl), kAll = (kt + kr + kb + kl) / 4;
    ls.top = `${kt * 50}%`; ls.bottom = `${kb * 50}%`; ls.left = `${kl * 50}%`; ls.right = `${kr * 50}%`;
    ls.opacity = String(1 - ease((kMin - 0.82) / 0.18));
    el.style.setProperty('--dim', (0.85 * ease(kAll * 1.2)).toFixed(3));
    // the card: it drifts and the hoops turn while it stands (held long, it never looks stuck)
    $.heart.style.opacity = heart.toFixed(3);
    if (heart > 0) {
      const t = this.t;
      $.canvas.style.transform = `scale(${(1.04 + 0.03 * Math.sin(t * 0.31)).toFixed(4)}) translate(${(1.4 * Math.sin(t * 0.23)).toFixed(2)}%,${(0.9 * Math.cos(t * 0.19)).toFixed(2)}%)`;
      HOOPS.forEach((h, i) => { $.hoops[i].style.transform = `rotateX(${h.tilt}deg) rotateZ(${(t * h.turn + i * 40).toFixed(1)}deg)`; });
      $.name.style.letterSpacing = `${(0.08 + 0.14 * (1 - heart)).toFixed(3)}em`; // (the name sets: its letters close up as it comes in)
      this.thread(t);
    }
  }

  /** The film's thread: the seam's progress when given (never going back), else breathing with a glint running along it. */
  thread(t) {
    const $ = this.$, f = $.fill.style, p = this.opts.progress;
    const v = typeof p === 'function' ? Number(p()) : typeof p === 'number' ? p : NaN;
    f.backgroundPosition = `${(-t * 30) % 200}% 0`;
    if (Number.isFinite(v) || this.phase === 'open') {
      if (Number.isFinite(v)) this.prog = Math.max(this.prog, Math.min(1, Math.max(0, v)));
      f.left = '0'; f.width = `${(this.prog * 100).toFixed(1)}%`; f.opacity = '1';
    } else {
      const w = 0.34, x = (0.5 - 0.5 * Math.cos(t * 1.3)) * (1 - w);
      f.left = `${(x * 100).toFixed(1)}%`; f.width = `${w * 100}%`; f.opacity = (0.65 + 0.35 * Math.sin(t * 2.1)).toFixed(3);
    }
    $.glint.style.left = `${(((t * 0.45) % 1.3) - 0.15) * 100}%`;
  }

  finish() {
    this.phase = null; this.cb = null; this.opts = {};
    if (this.el) { this.el.classList.remove('on'); this.$.canvas.width = 0; this.$.canvas.height = 0; } // (the card's pixels let go between crossings)
    this.game.ui?.want?.('areaWipe', false);
  }

  dispose() { this.finish(); this.el?.remove(); this.el = null; document.getElementById('aw-css')?.remove(); }
}
