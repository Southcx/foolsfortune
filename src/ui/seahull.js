// ---------------------------------------------------------------------------------------
// THE HULL AT SEA (Petra's handoff, 2026-10-22: the open sea's fight had no hull pips): the hits the ship can still bear on the open sea,
// as the crossing shows them (ui/railreadout.js's HULL row: a pip each, salt-white and lit while borne, cracked and dark once spent), in
// the Emocean's dress (ui/brineframe.js), at the view's top-left as the rail readout stands. It reads what is (game.seaFight.hull of its
// `bears`), on `sea.hull` (a pip cracks with a flash) and `sea.dock` (mended); what happened is the log's. Shown while sailing the open sea
// and the hull is less than whole or a serpent is up; hidden otherwise, and while the goals window or the rail readout has the corner.
//
// Prior art: the crossing's own readout (Star Fox 64's shield pips), The Wind Waker's hearts on the boat (the same hearts at sea as on
// land), Sea of Thieves' hull holes (damage you can count).
//
//   game.seaHull = new SeaHull(game)   .update(rawDt)   (each frame; it builds itself the first time it is wanted)
// ---------------------------------------------------------------------------------------
import { brineFrame, dot, SALT, INK } from './brineframe.js';
import { FONT } from './theme.js';

const CSS = `
.seahull{position:fixed;left:calc(10*var(--d));top:calc(10*var(--d));z-index:3;pointer-events:none;opacity:0;transition:opacity .3s}
.seahull.on{opacity:1}
.seahull .sh-row{display:flex;align-items:center;gap:calc(5*var(--d));font-family:${FONT.sys};font-size:calc(9*var(--d));letter-spacing:.16em;color:${SALT}}
.seahull .sh-pips{display:flex;gap:calc(2*var(--d))}
.seahull .sh-hp{width:calc(4*var(--d));height:calc(7*var(--d));background:${SALT};box-shadow:inset 0 calc(-2*var(--d)) 0 rgba(127,220,255,.55),0 0 0 var(--d) ${INK}}
.seahull .sh-hp.spent{background:rgba(8,6,4,.7);box-shadow:inset 0 0 0 var(--d) rgba(239,230,210,.3);
  background-image:linear-gradient(115deg,transparent 45%,rgba(239,230,210,.45) 45% 55%,transparent 55%)}
.seahull .sh-hp.lost{animation:sh-lost .4s steps(2)}
@keyframes sh-lost{0%,50%{background:#fff}}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-seahull', ''); s.textContent = CSS; document.head.appendChild(s);
}
const make = (cls) => { const e = document.createElement('div'); e.className = cls; return e; };

export class SeaHull {
  constructor(game) {
    this.game = game; this.root = null; this.on = false; this.shown = { hull: -1, of: -1 };
    game.events?.on?.('sea.hull', () => { this.lost = true; });
  }
  build() {
    if (this.root || typeof document === 'undefined') return;
    style();
    const root = (this.root = make('seahull'));
    root.style.setProperty('--d', `${dot()}px`);
    const f = (this.frame = brineFrame(root, { tab: 'HULL' }));
    const row = make('sh-row'); this.pips = make('sh-pips'); row.append(this.pips); f.body.append(row);
    document.body.appendChild(root);
    addEventListener('resize', () => { root.style.setProperty('--d', `${dot()}px`); f.layout(); });
  }
  update() {
    const g = this.game, F = g.seaFight, R = g.opensea;
    const want = !!(F && R?.sailing && (F.hull < F.bears || F.serpent)) && !g.railReadout?.on && !g.goalsWindow?.root?.classList.contains('on') && !g.questJournal?.on;
    if (want) this.build();
    if (!this.root) return;
    if (want !== this.on) { this.on = want; this.root.classList.toggle('on', want); if (want) requestAnimationFrame(() => this.frame?.layout()); }
    if (!want) return;
    const hull = F.hull, of = F.bears, S = this.shown;
    if (of !== S.of) { this.pips.replaceChildren(...Array.from({ length: of }, () => make('sh-hp'))); S.of = of; S.hull = -1; }
    if (hull !== S.hull) {
      [...this.pips.children].forEach((p, i) => { const spent = i >= hull; p.classList.toggle('lost', spent && this.lost && i === hull); p.classList.toggle('spent', spent); });
      S.hull = hull; this.lost = false;
    }
  }
}
