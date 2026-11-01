// ---------------------------------------------------------------------------------------
// THE GOD ARTS SHELF'S DRESS (South, 2026-11-01: "the God Arts section in the Codex needs a UI overhaul for readability, get with calissa
// to make something bespoke, give each domain a sub-page within the tab"; Dovina's page `feedback/codex/godarts.js`, its `ga-*` classes,
// her brief docs/handoffs/calissa/2026-11-02-from-dovina-god-arts-pages.md). Looks only: every rule, number and word stay the page's.
//   THE TABS      seven glazed tiles, each in its domain's glaze (`--ga-c`), the chosen one lifted and lit, the rest set back
//   THE HEAD      a band of the domain's glaze fired over terracotta, the level in the count face on a bisque plaque, the bar a glaze
//                 run in a bisque trough (as the collection log's)
//   THE LADDER    a climbing kiln (the noborigama: chambers up a hillside, one a ten): each ten a chamber with an arched mouth, the
//                 chambers stepped up the page, the flue between them; a step's ten on its chamber's firebox plaque
//   A STEP'S KIND told by shape as well as word, on the mark beside its label: a rung a ladder's rungs, a power a thrown bowl (a disc),
//                 a trait a lozenge, the epic a flame, the summit a peak, the start your seal's square
//   A STEP'S STATE yours: glazed in the domain's colour and lit / the next: its outline breathing in the glaze / ahead: bisque, plain /
//                 still to come: greenware (unfired, grey, its outline dashed, STILL TO COME pressed in): never mistaken for the game's
//                 (the glaze darkened toward the clay wherever words sit on it: a pale one, Ouranurgy's celadon, still reads)
//   THE CARD      a glazed tablet in the domain's tint, the met way checked in gold
// On the phone on its side (max-height 480px): the tabs a row of icons, the head one row (its question folded), a step's line shown
// only on the chosen one, so more of the ladder stands in the height.
//
// Prior art: the noborigama (a climbing kiln's chambers stepped up a slope, each fired in turn); Old School RuneScape's skill guide (a
// list of unlocks by level, the had ones marked); a potter's test-tile board; greenware before bisque firing (the unfired state).
//
//   installGodArtsLook()   (once, at boot: injects the style; the page's classes do the rest)
// ---------------------------------------------------------------------------------------
const GOLD = '#ffd36a';
const S = 'body #codex'; // (one id and an element more than the page's own rules: the dress wins, whichever style lands later)
const C = 'var(--ga-c, #c46a45)';

/** Each kind's mark, a clip-path on the step's `.t::before` (a shape as well as a word). */
const MARK = {
  rung: 'polygon(0 10%,100% 10%,100% 28%,0 28%,0 41%,100% 41%,100% 59%,0 59%,0 72%,100% 72%,100% 90%,0 90%)',
  power: 'circle(50% at 50% 50%)',
  trait: 'polygon(50% 0,100% 50%,50% 100%,0 50%)',
  epic: 'polygon(50% 0,68% 34%,62% 18%,90% 52%,80% 100%,20% 100%,10% 56%,34% 26%,40% 44%)',
  summit: 'polygon(50% 4%,100% 96%,0 96%)',
  start: 'inset(8% 8% 8% 8% round 2px)',
};

const CSS = `
${S} .ga{--ga-ink:#2a140c}
${S} .ga-tabs{gap:5px;margin:0 0 14px}
${S} .ga-tab{border:0;border-radius:6px;padding:5px 10px 5px 6px;font:600 10px var(--f-title);letter-spacing:.14em;color:#f6e6d0;
  background:linear-gradient(180deg,rgba(255,255,255,.18),transparent 45%,rgba(0,0,0,.25)),color-mix(in srgb,${C} 45%,#3e2016);
  box-shadow:inset 0 1px 0 rgba(255,236,214,.25),inset 0 -2px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08;filter:saturate(.7) brightness(.8);transition:transform .12s,filter .12s}
${S} .ga-tab:hover{filter:none}
${S} .ga-tab s{font:400 15px/1 'Jersey 15',var(--f-sys);letter-spacing:.02em;opacity:1;color:#fff1dc;margin-left:2px}
${S} .ga-tab.on{filter:none;transform:translateY(-2px);background:linear-gradient(180deg,rgba(255,255,255,.35),transparent 42%,rgba(0,0,0,.2)),color-mix(in srgb,${C} 68%,#24100a);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 -2px 0 rgba(0,0,0,.3),0 0 0 1px #1c0d08,0 0 0 3px rgba(255,211,106,.55),0 4px 10px rgba(0,0,0,.45)}
${S} .ga-tab.on b,${S} .ga-tab.on s{text-shadow:0 1px 0 #1c0d08,0 0 3px rgba(0,0,0,.6)}

${S} .ga-head{border:0;border-radius:8px;padding:12px 14px 11px;position:relative;
  background:linear-gradient(180deg,rgba(255,255,255,.28),transparent 30%),radial-gradient(ellipse at 20% 0,rgba(255,240,220,.25),transparent 60%),
    linear-gradient(180deg,color-mix(in srgb,${C} 62%,#24100a),color-mix(in srgb,${C} 38%,#1c0d08)); /* (the glaze darkened toward the clay: a pale celadon still carries white letters) */
  box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -3px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08,0 0 0 3px rgba(148,96,62,.6),0 6px 14px rgba(0,0,0,.45)}
${S} .ga-head h3{font:600 17px var(--f-title);letter-spacing:.22em;color:#fff6e8;text-shadow:0 1px 0 #1c0d08,0 0 6px rgba(0,0,0,.45)}
${S} .ga-head .q{opacity:1;color:#fff1dc;font-size:13px;text-shadow:0 1px 1px rgba(0,0,0,.6)}
${S} .ga-head .lv{font:400 30px/1 'Jersey 15',var(--f-sys);color:var(--ga-ink);text-align:center;padding:4px 10px 3px;border-radius:4px;
  background:radial-gradient(circle,rgba(60,30,14,.16) 0 1px,transparent 1.5px) 0 0/6px 7px,linear-gradient(180deg,#e9d6bc,#c9a882);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -2px 0 rgba(0,0,0,.22),0 0 0 1px #2a140c}
${S} .ga-head .lv small{color:#5a3626;opacity:1;font:600 8px var(--f-title);letter-spacing:.2em}
${S} .ga-head .bar{height:9px;border-radius:5px;margin-top:4px;background:linear-gradient(180deg,#5a3626,#b89a7a 30%,#d8c0a0);box-shadow:inset 0 2px 2px rgba(0,0,0,.55)}
${S} .ga-head .bar i{border-radius:5px;background:linear-gradient(180deg,rgba(255,255,255,.6),transparent 45%,rgba(0,0,0,.15)),${GOLD};box-shadow:0 0 6px rgba(255,211,106,.5)}
${S} .ga-head .nx{opacity:1;color:#fff1dc;font-size:12px;text-shadow:0 1px 1px rgba(0,0,0,.7)}

${S} .ga-ladder{padding:2px 0 0}
${S} .ga-ladder::before{left:22px;width:6px;border-radius:3px;background:linear-gradient(90deg,#1c0d08,#5a3626 40%,#2a140c);opacity:.9}
${S} .ga-step{grid-template-columns:48px 1fr;padding:6px 8px 6px 0;margin:0 0 2px;border-radius:0 8px 8px 0}
${S} .ga-step:not(.cont){margin-top:7px;
  background:radial-gradient(ellipse 60% 120% at 0 50%,rgba(255,150,80,.08),transparent 70%),linear-gradient(90deg,rgba(62,32,22,.7),rgba(42,20,13,.4));
  box-shadow:inset 0 1px 0 rgba(255,226,196,.08),0 -1px 0 rgba(28,13,8,.9)}
${S} .ga-step:not(.cont)::after{content:'';position:absolute;left:48px;right:0;top:-1px;height:6px;border-radius:50% 50% 0 0/100% 100% 0 0;
  border-top:1px solid rgba(255,178,122,.18);pointer-events:none}
${S} .ga-step .at{width:34px;height:24px;margin-left:8px;border:0;border-radius:4px 4px 2px 2px;line-height:24px;font:400 17px/24px 'Jersey 15',var(--f-sys);color:var(--ga-ink);
  background:radial-gradient(circle,rgba(60,30,14,.16) 0 1px,transparent 1.5px) 0 0/5px 6px,linear-gradient(180deg,#d8c0a0,#a88a6e);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 -2px 0 rgba(0,0,0,.3),0 0 0 1px #1c0d08}
${S} .ga-step .t{position:relative;padding-left:24px;min-height:20px}
${S} .ga-step .t::before{content:'';position:absolute;left:0;top:2px;width:16px;height:16px;background:#8a7262;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.4)}
${Object.entries(MARK).map(([k, p]) => `${S} .ga-step[data-kind="${k}"] .t::before{clip-path:${p}}`).join('\n')}
${S} .ga-step .t b{font:600 12px var(--f-title);letter-spacing:.14em}
${S} .ga-step .t u{font:600 8px var(--f-title);letter-spacing:.2em;padding:1px 5px;border-radius:2px;opacity:1;color:#e9d6bc;background:rgba(28,13,8,.6)}
${S} .ga-step .t small{font-size:12px;opacity:.85;line-height:1.35;margin-top:1px}

${S} .ga-step.got .at{color:#fff6e8;text-shadow:0 1px 0 #1c0d08,0 0 3px #1c0d08;background:linear-gradient(180deg,rgba(255,255,255,.45),transparent 45%,rgba(0,0,0,.2)),color-mix(in srgb,${C} 75%,#24100a);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 0 0 1px #1c0d08,0 0 8px color-mix(in srgb,${C} 60%,transparent)}
${S} .ga-step.got .t::before{background:linear-gradient(160deg,rgba(255,255,255,.7),transparent 50%),${C};filter:drop-shadow(0 0 3px color-mix(in srgb,${C} 80%,transparent))}
${S} .ga-step.got .t b{color:#fff6e8}
${S} .ga-step.next .at{box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 0 0 1px #1c0d08,0 0 0 3px ${C};animation:ga-breathe 2.4s ease-in-out infinite}
${S} .ga-step.next .t::before{background:${C};opacity:.75}
${S} .ga-step.next .t b{color:${GOLD}}
${S} .ga-step.ahead .t{opacity:.82}
${S} .ga-step.planned .t{opacity:.62}
${S} .ga-step.planned .at{background:repeating-linear-gradient(135deg,#6e6660 0 3px,#5e5650 3px 6px);color:#cfc6bc;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12),0 0 0 1px #1c0d08}
${S} .ga-step.planned .t::before{background:transparent;outline:1px dashed #9a918a;outline-offset:-2px;box-shadow:none;clip-path:none;border-radius:2px}
${S} .ga-step.planned .t b{color:#bdb4aa}
${S} .ga-step.planned .t u::after{content:' · STILL TO COME';color:#d8cfc4}
${S} .ga-step.sel{background:linear-gradient(90deg,color-mix(in srgb,${C} 35%,transparent),rgba(42,20,13,.3));box-shadow:inset 3px 0 0 ${GOLD}}
@keyframes ga-breathe{0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 0 0 1px #1c0d08,0 0 0 2px ${C}}50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 0 0 1px #1c0d08,0 0 0 4px ${C},0 0 10px ${C}}}

${S} .ga-card{border:0;border-radius:8px;padding:13px 14px;position:sticky;top:0;
  background:radial-gradient(ellipse at 30% -10%,rgba(255,236,214,.2),transparent 55%),linear-gradient(180deg,color-mix(in srgb,${C} 30%,#5a2e1e),#2e160e);
  box-shadow:inset 0 1px 0 rgba(255,230,200,.3),inset 0 -3px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08,0 0 0 3px color-mix(in srgb,${C} 55%,#94603e),0 6px 14px rgba(0,0,0,.45)}
${S} .ga-card h4{font:600 14px var(--f-title);letter-spacing:.18em;color:#fff6e8}
${S} .ga-card .k{font:600 9px var(--f-title);letter-spacing:.22em;color:color-mix(in srgb,${C} 50%,#fff1dc)}
${S} .ga-card p{font-size:13px;line-height:1.45;color:#f6e6d0}
${S} .ga-card .way{font-size:12px;padding:4px 8px;border-radius:3px;background:rgba(28,13,8,.45)}
${S} .ga-card .way.done{color:${GOLD};background:rgba(255,211,106,.12)}
${S} .ga-card .way.done span:first-child::before{color:${GOLD}}

@media (prefers-reduced-motion: reduce){${S} .ga-step.next .at{animation:none}}
@media (max-height:480px){
  ${S} .ga-tabs{margin-bottom:8px}
  ${S} .ga-tab{padding:4px 6px}
  ${S} .ga-head{padding:6px 10px;gap:2px 10px}
  ${S} .ga-head .q{display:none}
  ${S} .ga-head h3{font-size:14px}
  ${S} .ga-head .lv{font-size:20px;padding:1px 7px}
  ${S} .ga-head .lv small{display:none}
  ${S} .ga-head .bar{height:6px;margin-top:2px}
  ${S} .ga-head .nx{font-size:11px}
  ${S} .ga-step .t small{display:none}
  ${S} .ga-step.sel .t small{display:block}
  ${S} .ga-step:not(.cont){margin-top:4px}
  ${S} .ga-step{padding:4px 6px 4px 0}
}
`;

let installed = false;
export function installGodArtsLook() {
  if (installed || typeof document === 'undefined') return; installed = true;
  const st = document.createElement('style'); st.id = 'godarts-look'; st.textContent = CSS; document.head.appendChild(st);
}
