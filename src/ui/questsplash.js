// ---------------------------------------------------------------------------------------
// THE QUEST SPLASH: a quest begun or done gets its splash, the one pop-up besides the title placard (CLAUDE.md, Feedback; South,
// 2026-10-31: "the event pop up splash is okay"; Dovina's QUESTS.md 5). On `quest.start` the word EVENT! slammed over the play with the
// quest's name on a clay ribbon under it (Tomba!'s); on `quest.done` QUEST COMPLETE! in gold, the name, and its quest points (RuneScape's
// completion scroll). It holds a moment, then flies off toward the left edge and hands over to the quest journal's beat (that quest
// lit: ui/questjournal.js), so what was said big is then shown where it lives. It never pauses play, takes no keys and adds no log line
// (the log says it: tracking/quests.js).
//
//   WAITING    one at a time, the rest queued; nothing starts on the title screen, in a cinematic, in a live moment
//              (`game.liveMoment()`, core/livemoment.js) or while the title placard stands (the two pop-ups never at once), as the placard
//              waits; a live moment that begins under it sends it off at once, and one not yet held long enough comes again after. On
//              touch it stands under the log's ticker (the HUD layout's --hud-log-y and --hud-log-h), clear of the top bar.
//   THE LOOK   the window colour's sunburst turning behind the word (gold for a quest done), the word in the System's display face
//              (Cinzel Decorative) cut gold with a dark keyline and slammed in from big with a shiver, a faint flash; the ribbon in the
//              Clay dress (unglazed earthenware with its cord-marked edge: the goals window's), swept in under it; on a quest done, gold
//              flecks thrown out (kintsugi's) and the points as a chip with the journal's COMPLETE mark.
//   SOUND      `quest.splash { id, quest, kind, by }` when the word lands, so Wanda's jingle lands with it whenever it is shown.
//
// Prior art: Tomba!'s EVENT! and EVENT CLEAR! (the jingle and the big word over the play), RuneScape's quest complete scroll, the comic
// book's starburst and Persona 5's slammed callouts (as the duel's stamps: vfx/duelview/stamps.js), and this house's title placard (one
// pop-up at a time, waiting out a live moment).
//
//   game.questSplash = new QuestSplash(game)   .update()   (each frame)   .show({ id, quest, kind, points })   .queue   .active   QUEST_SPLASH
// ---------------------------------------------------------------------------------------
import { GOLD, INK, COUNT_FACE, FILM } from './brineframe.js';
import { FONT } from './theme.js';
import { QUEST_LOOK, questMark } from './questjournal.js';

/** Real seconds: the slam, the hold (begun, done), the flight off; how long it must have stood before a live moment counts it seen;
 *  the gold flecks thrown on a quest done. */
export const QUEST_SPLASH = { slam: 0.42, hold: { start: 1.6, done: 2.2 }, off: 0.38, seen: 0.9, flecks: 18 };
const S = QUEST_SPLASH;
const WORD = { start: 'EVENT!', done: 'QUEST COMPLETE!' };

const CSS = `
.qs{position:fixed;left:var(--safe-l,0px);right:var(--safe-r,0px);top:var(--safe-t,0px);bottom:var(--safe-b,0px);z-index:7;pointer-events:none;
  --u:calc(var(--su,7px));display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:calc(16*var(--u));
  opacity:0;visibility:hidden}
.qs.on{opacity:1;visibility:visible}
body.hud-touch .qs{padding-top:calc(var(--hud-log-y,60px) + var(--hud-log-h,36px) + 6*var(--u))}
.qs-hush{position:absolute;inset:0;background:radial-gradient(ellipse 60% 40% at 50% 32%,rgba(20,8,4,.42),transparent 75%);opacity:0;transition:opacity .25s}
.qs.on .qs-hush{opacity:1}
.qs-flash{position:absolute;inset:0;background:#fff7e8;opacity:0}
.qs.on .qs-flash{animation:qs-flash .22s ${S.slam * 0.4}s ease-out both}
@keyframes qs-flash{0%{opacity:.22}100%{opacity:0}}
.qs-stage{position:relative;display:flex;flex-direction:column;align-items:center;transform-origin:50% 40%}
.qs-burst{position:absolute;left:50%;top:calc(7*var(--u));width:calc(70*var(--u));height:calc(70*var(--u));margin:calc(-35*var(--u)) 0 0 calc(-35*var(--u));
  border-radius:50%;opacity:0;background:repeating-conic-gradient(var(--qs-ray) 0 5deg,transparent 5deg 15deg);
  -webkit-mask-image:radial-gradient(circle,#000 0 18%,rgba(0,0,0,.5) 40%,transparent 68%);mask-image:radial-gradient(circle,#000 0 18%,rgba(0,0,0,.5) 40%,transparent 68%)}
.qs.on .qs-burst{animation:qs-burst-in .35s ${S.slam * 0.4}s ease-out both,qs-spin 9s linear infinite}
@keyframes qs-burst-in{0%{opacity:0;transform:scale(.3)}100%{opacity:1;transform:scale(1)}}
@keyframes qs-spin{to{rotate:360deg}}
.qs-word{position:relative;font-family:${FONT.deco};font-weight:900;font-size:calc(var(--qs-size,12)*var(--u));line-height:1;letter-spacing:.03em;white-space:nowrap;
  color:${GOLD};background:linear-gradient(180deg,#fff4c8 0%,${GOLD} 45%,#c98a1c 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  -webkit-text-stroke:calc(.45*var(--u)) ${INK};paint-order:stroke fill;
  filter:drop-shadow(0 calc(.6*var(--u)) 0 ${INK}) drop-shadow(0 0 calc(2*var(--u)) rgba(255,200,120,.45));transform:skewX(-8deg)}
.qs.on .qs-word{animation:qs-slam ${S.slam}s cubic-bezier(.2,.9,.3,1.3) both,qs-shiver .3s ${S.slam}s linear both}
@keyframes qs-slam{0%{opacity:0;transform:skewX(-8deg) scale(2.6) rotate(-6deg)}55%{opacity:1;transform:skewX(-8deg) scale(.92)}80%{transform:skewX(-8deg) scale(1.05)}100%{opacity:1;transform:skewX(-8deg) scale(1)}}
@keyframes qs-shiver{0%,100%{translate:0 0}20%{translate:calc(.5*var(--u)) 0}40%{translate:calc(-.4*var(--u)) calc(.2*var(--u))}60%{translate:calc(.3*var(--u)) 0}80%{translate:calc(-.2*var(--u)) 0}}
.qs-ribbon{position:relative;margin-top:calc(2.4*var(--u));padding:calc(1.2*var(--u)) calc(5*var(--u)) calc(1.4*var(--u));text-align:center;
  background:radial-gradient(circle,rgba(255,236,214,.16) 0 1px,transparent 1.6px) 0 0/7px 9px,linear-gradient(180deg,rgba(255,230,200,.18),transparent 40%,rgba(0,0,0,.3)),linear-gradient(180deg,#8a5136,#55301f);
  clip-path:polygon(0 0,100% 0,96% 50%,100% 100%,0 100%,4% 50%);
  box-shadow:inset 0 calc(.5*var(--u)) 0 rgba(255,226,196,.2);opacity:0}
.qs-ribbon::before,.qs-ribbon::after{content:'';position:absolute;left:4%;right:4%;height:calc(.7*var(--u));
  background:repeating-linear-gradient(62deg,#b06e50 0 3px,#5c3020 3px 6px)}
.qs-ribbon::before{top:0}
.qs-ribbon::after{bottom:0}
.qs.on .qs-ribbon{animation:qs-ribbon .4s ${S.slam * 0.75}s cubic-bezier(.2,.8,.3,1) both}
@keyframes qs-ribbon{0%{opacity:0;clip-path:polygon(0 0,0 0,0 50%,0 100%,0 100%,0 50%)}100%{opacity:1;clip-path:polygon(0 0,100% 0,96% 50%,100% 100%,0 100%,4% 50%)}}
.qs-name{font-family:${FONT.title};font-weight:700;font-size:calc(4.2*var(--u));letter-spacing:.1em;text-transform:uppercase;color:#fff1dc;
  text-shadow:0 calc(.3*var(--u)) 0 rgba(20,8,4,.85)}
.qs-who{margin-top:calc(.4*var(--u));font-family:${COUNT_FACE};font-size:calc(2.6*var(--u));letter-spacing:.18em;color:rgba(255,236,214,.8)}
.qs-pts{display:inline-flex;align-items:center;gap:calc(1*var(--u));margin-top:calc(1.6*var(--u));padding:calc(.4*var(--u)) calc(1.6*var(--u));
  font-family:${COUNT_FACE};font-size:calc(3*var(--u));letter-spacing:.12em;color:${QUEST_LOOK.colour.done};background:rgba(20,8,4,.55);
  box-shadow:inset 0 0 0 calc(.25*var(--u)) rgba(143,220,150,.5);opacity:0}
.qs-pts .qj-mark{width:calc(3*var(--u));height:calc(3*var(--u))}
.qs.on .qs-pts{animation:qs-pop .32s ${S.slam + 0.35}s cubic-bezier(.2,.9,.3,1.4) both}
@keyframes qs-pop{0%{opacity:0;transform:scale(.4)}100%{opacity:1;transform:none}}
.qs-fleck{position:absolute;left:50%;top:calc(7*var(--u));width:calc(1.1*var(--u));height:calc(.5*var(--u));background:${GOLD};border-radius:1px;opacity:0;
  box-shadow:0 0 calc(.6*var(--u)) rgba(255,211,106,.8)}
.qs.on .qs-fleck{animation:qs-fleck 1.3s var(--d0) cubic-bezier(.15,.7,.4,1) both}
@keyframes qs-fleck{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--fx),var(--fy)) rotate(var(--fr))}}
.qs.off .qs-stage{transition:transform ${S.off}s cubic-bezier(.5,0,.8,.4),opacity ${S.off}s;transform:translate(calc(-38*var(--u)),calc(6*var(--u))) scale(.35);opacity:0}
.qs.off .qs-burst,.qs.off .qs-hush{transition:opacity ${S.off}s;opacity:0}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-questsplash', ''); s.textContent = CSS; document.head.appendChild(s);
}
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

export class QuestSplash {
  constructor(game) {
    this.game = game; this.queue = []; this.active = null; this.root = null; this.t = 0; this.last = 0;
    const ev = game?.events; if (!ev?.on) return;
    ev.on('quest.start', (e) => this.show({ id: e?.id, quest: e?.quest, kind: 'start' }));
    ev.on('quest.done', (e) => this.show({ id: e?.id, quest: e?.quest, kind: 'done', points: e?.points }));
  }

  show(e) { if (e?.id) this.queue.push({ id: e.id, quest: e.quest || e.id, kind: e.kind === 'done' ? 'done' : 'start', points: e.points ?? null }); }

  build() {
    if (this.root || typeof document === 'undefined') return;
    style();
    const r = (this.root = make('div', 'qs'));
    r.setAttribute('aria-live', 'polite');
    this.stage = make('div', 'qs-stage');
    r.append(make('div', 'qs-hush'), make('div', 'qs-flash'), this.stage);
    document.body.appendChild(r);
  }

  /** Draw one: the burst, the word, the ribbon, the points and the flecks of a quest done. */
  draw(a) {
    this.build(); if (!this.root) return;
    const Q = this.game?.quests?.list?.()?.find((q) => q.id === a.id), done = a.kind === 'done';
    const st = this.stage; st.innerHTML = '';
    const burst = make('div', 'qs-burst');
    burst.style.setProperty('--qs-ray', done ? 'rgba(255,211,106,.55)' : rgba(FILM[1], 0.55));
    const word = make('div', 'qs-word', WORD[a.kind]); word.style.setProperty('--qs-size', done ? '8.5' : '13');
    const rib = make('div', 'qs-ribbon');
    rib.append(make('div', 'qs-name', Q?.name || a.quest), make('div', 'qs-who', Q?.who ? `FOR ${String(Q.who).toUpperCase()}` : ''));
    st.append(burst, word, rib);
    if (done) {
      const n = a.points ?? Q?.points ?? 0;
      if (n) { const p = make('div', 'qs-pts'); p.insertAdjacentHTML('afterbegin', questMark('done')); p.append(make('span', '', `+${n} QUEST POINT${n === 1 ? '' : 'S'}`)); rib.append(p); }
      for (let i = 0; i < S.flecks; i++) {
        const f = make('i', 'qs-fleck'), ang = (i / S.flecks) * Math.PI * 2 + Math.sin(i * 7.3) * 0.3, r = 22 + 12 * ((i * 37) % 7) / 7;
        f.style.setProperty('--fx', `calc(${(Math.cos(ang) * r).toFixed(1)}*var(--u))`); f.style.setProperty('--fy', `calc(${(Math.sin(ang) * r * 0.7 + 6).toFixed(1)}*var(--u))`);
        f.style.setProperty('--fr', `${(i * 97) % 360}deg`); f.style.setProperty('--d0', `${(S.slam * 0.5 + (i % 5) * 0.03).toFixed(2)}s`);
        st.append(f);
      }
    }
  }

  begin(a) {
    this.active = a; this.t = 0;
    this.draw(a); if (!this.root) return;
    this.root.classList.remove('on', 'off'); void this.root.offsetWidth; this.root.classList.add('on');
    this.game?.events?.emit('quest.splash', { id: a.id, quest: a.quest, kind: a.kind, by: 'courier' });
  }

  end(seen) {
    const a = this.active; this.active = null;
    if (!this.root) return;
    this.root.classList.add('off');
    clearTimeout(this.offT); this.offT = setTimeout(() => this.root?.classList.remove('on', 'off'), S.off * 1000);
    if (!seen) { this.queue.unshift(a); return; }
    this.game?.questJournal?.show?.(a.kind === 'done' ? QUEST_LOOK.done : QUEST_LOOK.start, { lit: a.id, kind: a.kind });
  }

  update() {
    const now = typeof performance !== 'undefined' ? performance.now() : 0, dt = Math.min(0.1, (now - (this.last || now)) / 1000); this.last = now;
    const g = this.game, P = g.titlePlacard, placard = !!(P?.active || P?.building || P?.pending);
    const busy = !!(g.title?.active || (typeof document !== 'undefined' && document.body.classList.contains('cine')) || g.liveMoment?.());
    if (!this.active) { if (this.queue.length && !busy && !placard) this.begin(this.queue.shift()); return; }
    this.t += dt;
    if (busy) { this.end(this.t >= S.seen); return; }
    if (this.t >= S.slam + S.hold[this.active.kind]) this.end(true);
  }
}
