// ---------------------------------------------------------------------------------------
// THE TABLE HUD'S STYLES: one string of CSS, injected once, for the table HUD, the seat plates and the goal bar (docs/handoffs/dovina/
// casino-clarity-art-brief.md sections 1 and 2). Lacquer plates in the schiller's ink, glazed ivory numerals, and the oil film (the
// labradorite's four colours, `FILM` of vfx/oxidation.js, converted to sRGB here) as a conic border that walks at SCHILLER.rate.
// Prior art: Balatro's fat numerals on plates, a poker client's seat (name, colour, stack), Slay the Spire's target. Words and numbers
// show here by the owner's exception (2026-10-15), only inside the table view.
// The film edge goes ONLY on the acting plate and the turn banner's cue; the goal panel and idle plates take a plain lacquer edge, the winner gold.
// Interface: `injectTableHudCss()` (idempotent), `FILM_CSS` (the film as CSS colours), `filmGradient(from)`.
// ---------------------------------------------------------------------------------------
import { FILM, SCHILLER } from '../vfx/oxidation.js';

const toS = (c) => Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));
const lift = (c) => Math.min(1, c * 1.1);
/** The film's four colours as sRGB CSS colours, lifted to read as light (as featTint does). */
export const FILM_CSS = FILM.map(([r, g, b]) => `rgb(${toS(lift(r))},${toS(lift(g))},${toS(lift(b))})`);
/** A conic gradient of the film, round once, starting at the angle `from` (a CSS value). */
export const filmGradient = (from = 'var(--film-a)') => `conic-gradient(from ${from}, ${FILM_CSS.join(', ')}, ${FILM_CSS[0]})`;

const INK = '#' + SCHILLER.ink.toString(16).padStart(6, '0');
const WALK_S = (1 / SCHILLER.rate).toFixed(1); // one loop of the film, real seconds
const U = (n) => `calc(${n} * var(--u))`;

const CSS = `
@property --film-a { syntax: '<angle>'; inherits: true; initial-value: 0deg; }
@keyframes th-walk { to { --film-a: 360deg; } }
@keyframes th-breathe { 50% { transform: scale(1.14); } }
.th-root { --ink: ${INK}; --ivory: #f4ecd8; --gold: #f2c14e; --ash: #a39dab; --u: calc(100vh / 1080);
  position: absolute; inset: 0; pointer-events: none; overflow: hidden; font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
  color: var(--ivory); animation: th-walk ${WALK_S}s linear infinite; }
.th-root[hidden] { display: none; }
.th-anchor { position: absolute; left: 0; top: 0; }
.th-plate { position: relative; box-sizing: border-box; min-width: ${U(190)}; padding: ${U(10)} ${U(16)} ${U(12)};
  background: linear-gradient(180deg, #2a1f38, ${INK}); border-radius: ${U(14)}; border: ${U(4)} solid var(--seat, #888);
  box-shadow: 0 ${U(6)} ${U(14)} #000a, inset 0 0 0 ${U(2)} #0006; transition: transform .25s cubic-bezier(.34,1.56,.64,1), opacity .3s, filter .3s; }
.th-head { display: flex; align-items: center; gap: ${U(8)}; font-size: ${U(20)}; font-weight: 700; letter-spacing: .03em; }
.th-cue { width: ${U(26)}; height: ${U(26)}; flex: none; }
.th-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: ${U(170)}; }
.th-tag { margin-left: auto; font-size: ${U(14)}; letter-spacing: .12em; opacity: .9; }
.th-stats { display: flex; flex-wrap: wrap; gap: ${U(2)} ${U(18)}; margin-top: ${U(4)}; }
.th-stat { display: flex; flex-direction: column; line-height: 1; }
.th-stat b { font-size: ${U(34)}; font-weight: 900; font-variant-numeric: tabular-nums; text-shadow: 0 ${U(2)} 0 #000a; }
.th-stat i { font-style: normal; font-size: ${U(14)}; letter-spacing: .1em; text-transform: uppercase; opacity: .75; margin-top: ${U(2)}; }
.th-tier-XL b { font-size: ${U(56)}; } .th-tier-L b { font-size: ${U(34)}; } .th-tier-M b { font-size: ${U(20)}; } .th-tier-S b { font-size: ${U(14)}; }
.th-tier-XL i { font-size: ${U(16)}; } .th-tier-M i, .th-tier-S i { font-size: ${U(12)}; }
.th-score b, .th-count b { color: var(--ivory); } .th-money b { color: var(--gold); } .th-lives b { color: var(--ash); }
.th-plate[data-state=acting] { transform: scale(1.1); z-index: 2; animation: th-breathe 2.4s ease-in-out infinite; }
.th-plate[data-state=acting] { border-color: transparent; background: linear-gradient(180deg, #2a1f38, ${INK}) padding-box, ${filmGradient()} border-box; }
.th-plate[data-state=out] { opacity: .4; filter: grayscale(1); transform: translateY(${U(10)}) scale(.94); }
.th-plate[data-state=winner] { border-color: var(--gold); background: linear-gradient(180deg, #7d5a14, #c99a2e 55%, #7d5a14); box-shadow: 0 0 ${U(24)} #f2c14e88, 0 ${U(6)} ${U(14)} #000a; transform: scale(1.12); z-index: 3; }
.th-plate[data-state=winner] .th-stat b { color: #fff6d8; }
.th-goal { box-sizing: border-box; width: ${U(720)}; padding: ${U(10)} ${U(20)} ${U(14)}; border-radius: ${U(16)};
  border: ${U(4)} solid #5b4a6e; background: linear-gradient(180deg, #2a1f38, ${INK}); box-shadow: 0 ${U(6)} ${U(14)} #000a, inset 0 0 0 ${U(2)} #0006; position: relative; }
.th-goal-label { font-size: ${U(56)}; font-weight: 900; line-height: 1; text-align: center; letter-spacing: .02em; text-shadow: 0 ${U(3)} 0 #000a; }
.th-goal-line { font-size: ${U(20)}; text-align: center; opacity: .85; margin: ${U(4)} 0 ${U(30)}; }
.th-track { display: flex; align-items: center; gap: ${U(10)}; height: ${U(26)}; margin-top: ${U(8)}; }
.th-track .th-cue { width: ${U(22)}; height: ${U(22)}; }
.th-rail { position: relative; flex: 1; height: 100%; border-radius: ${U(13)}; background: #0008; box-shadow: inset 0 ${U(2)} ${U(4)} #000; }
.th-fill { height: 100%; width: 0; border-radius: ${U(13)}; background: var(--seat, #888); transition: width .6s cubic-bezier(.34,1.56,.64,1); }
.th-fill.over { background: repeating-linear-gradient(135deg, var(--ash) 0 ${U(6)}, #55505c ${U(6)} ${U(12)}); }
.th-val { width: ${U(64)}; text-align: right; font-size: ${U(20)}; font-weight: 900; font-variant-numeric: tabular-nums; }
.th-mark { position: absolute; top: ${U(-3)}; bottom: ${U(-3)}; width: ${U(3)}; background: var(--gold); transform: translateX(-50%); }
.th-mark span { position: absolute; top: ${U(-20)}; left: 50%; transform: translateX(-50%); font-size: ${U(14)}; color: var(--gold); white-space: nowrap; }
.th-mark.hit { background: ${filmGradient()}; }

.th-turn { position: absolute; left: 50%; top: ${U(28)}; transform: translateX(-50%); text-align: center; display: flex; flex-direction: column;
  align-items: center; gap: ${U(4)}; padding: ${U(10)} ${U(34)} ${U(14)}; border-radius: ${U(18)}; border: ${U(4)} solid #5b4a6e;
  background: linear-gradient(180deg, #2a1f38dd, ${INK}dd); box-shadow: 0 ${U(6)} ${U(14)} #000a; max-width: ${U(900)}; }
.th-turn[hidden] { display: none; }
.th-turn.mine { border-color: transparent; background: linear-gradient(180deg, #2a1f38, ${INK}) padding-box, ${filmGradient()} border-box; animation: th-pop .5s cubic-bezier(.34,1.56,.64,1); }
.th-turn-who { display: flex; align-items: center; gap: ${U(12)}; font-weight: 900; letter-spacing: .06em; font-size: ${U(26)}; color: var(--tc, var(--ivory)); text-shadow: 0 ${U(3)} 0 #000b; }
.th-turn.mine .th-turn-who { font-size: ${U(64)}; line-height: 1; } .th-turn.mine .th-cue { width: ${U(48)}; height: ${U(48)}; }
.th-turn .th-cue { width: ${U(26)}; height: ${U(26)}; }
.th-turn-say { font-size: ${U(18)}; opacity: .85; } .th-turn.mine .th-turn-say { font-size: ${U(28)}; opacity: 1; font-weight: 700; }
@keyframes th-pop { from { transform: translateX(-50%) scale(.8); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .th-root, .th-plate { animation: none !important; } .th-fill { transition: none; } }
`;

let done = false;
/** Add the styles to the page, once. */
export function injectTableHudCss() {
  if (done || typeof document === 'undefined') return;
  const s = document.createElement('style');
  s.dataset.tablehud = '1';
  s.textContent = CSS;
  document.head.appendChild(s);
  done = true;
}
