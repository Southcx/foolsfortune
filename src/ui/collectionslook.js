// ---------------------------------------------------------------------------------------
// THE COLLECTION LOG'S DRESS (the Codex's COLLECTIONS shelf: Dovina's page `feedback/codex/collections.js`, its `cl-*` classes): the shelf
// in the Clay dress (OVERLAY.md 15.4), only looks: every rule, number and word stay the page's.
//   THE HEAD      the whole's share and the counts as numbers in the count face on a bisque plaque
//   A CARD        a section as a glazed tile: fired terracotta under a glossy kiln-glaze top (its rim catching the light), a tile filled
//                 glazed gold at its edge
//   THE BAR       its N of M as a glaze run in a bisque trough (the glaze's colour the window colour's selection, gold once filled), the
//                 page's 80% "enough" mark as a gold notch cut in the trough's lip
//   A SLOT        a little sherd: unglazed bisque, dark and dusty, its name pressed in, until had; then glazed and lit (a celadon run
//                 with a highlight), so a card reads at a glance as a shelf of sherds filling up
//
// Prior art: Old School RuneScape's collection log (a tab a source, the slots greyed until had), a potter's test-tile board (glaze
// tests fired on numbered bisque tiles), the sherd tray of an archaeologist's finds.
//
//   installCollectionsLook()   (once, at boot: injects the style; the page's classes do the rest)
// ---------------------------------------------------------------------------------------
const GOLD = '#ffd36a';
const S = 'body #codex'; // (one id and an element more than the page's own rules: the dress wins, whichever style is injected later)

const CSS = `
${S} .cl-head{gap:10px;align-items:stretch;font:11px/1.2 var(--f-sys);letter-spacing:.1em;opacity:1}
${S} .cl-head>div{padding:6px 12px 7px;border-radius:4px;color:#3a1c10;
  background:radial-gradient(circle,rgba(60,30,14,.16) 0 1px,transparent 1.5px) 0 0/6px 7px,linear-gradient(180deg,#e9d6bc,#c9a882);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -2px 0 rgba(0,0,0,.22),0 0 0 1px #2a140c,0 3px 6px rgba(0,0,0,.4)}
${S} .cl-head b{font:400 26px/1 'Jersey 15',var(--f-sys);color:#2a140c;letter-spacing:.02em}
${S} .cl-wrap .cl-card{position:relative;border:0;border-radius:7px;padding:11px 13px 12px;
  background:radial-gradient(ellipse at 30% -10%,rgba(255,236,214,.22),transparent 55%),
    radial-gradient(circle,rgba(255,236,214,.07) 0 1px,transparent 1.4px) 0 0/5px 6px,
    linear-gradient(180deg,rgba(var(--jtop,104,50,32),.55),rgba(var(--jbot,34,15,9),.75)),linear-gradient(180deg,#7a4630,#3e2016);
  box-shadow:inset 0 1px 0 rgba(255,230,200,.35),inset 0 -3px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08,0 0 0 3px rgba(148,96,62,.55),0 6px 14px rgba(0,0,0,.45)}
${S} .cl-wrap .cl-card.done{box-shadow:inset 0 1px 0 rgba(255,240,200,.55),inset 0 -3px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08,0 0 0 3px ${GOLD},0 0 14px rgba(255,211,106,.35),0 6px 14px rgba(0,0,0,.45)}
${S} .cl-wrap .cl-card h3{font:600 12px var(--f-title);letter-spacing:.18em;color:#f1d2b0;text-shadow:0 1px 0 #1c0d08}
${S} .cl-wrap .cl-card h3 span{font:400 17px/1 'Jersey 15',var(--f-sys);letter-spacing:.04em;color:#fff1dc}
${S} .cl-wrap .cl-card.done h3 span{color:${GOLD}}
${S} .cl-wrap .cl-bar{height:9px;margin:2px 0 10px;border-radius:5px;background:linear-gradient(180deg,#5a3626,#b89a7a 30%,#d8c0a0);
  box-shadow:inset 0 2px 2px rgba(0,0,0,.55),0 1px 0 rgba(255,226,196,.15)}
${S} .cl-wrap .cl-bar i{border-radius:5px;background:linear-gradient(180deg,rgba(255,255,255,.55),transparent 45%,rgba(0,0,0,.18)),rgb(var(--jsel,196,106,69));
  box-shadow:inset 0 0 0 1px rgba(255,240,220,.25),0 0 6px rgba(var(--jsel,196,106,69),.5)}
${S} .cl-wrap .cl-card.done .cl-bar i{background:linear-gradient(180deg,rgba(255,255,255,.6),transparent 45%,rgba(0,0,0,.15)),${GOLD};box-shadow:0 0 8px rgba(255,211,106,.6)}
${S} .cl-wrap .cl-bar u{top:-3px;bottom:auto;width:6px;height:6px;margin-left:-3px;background:${GOLD};clip-path:polygon(0 0,100% 0,50% 100%);box-shadow:none;filter:drop-shadow(0 1px 0 #1c0d08)}
${S} .cl-wrap .cl-slots{gap:5px}
${S} .cl-wrap .cl-slot{font:10px/1.2 var(--f-sys);letter-spacing:.04em;padding:3px 7px 3px 8px;border:0;color:rgba(40,22,14,.62);
  border-radius:3px 6px 2px 5px;background:radial-gradient(circle,rgba(60,30,14,.2) 0 1px,transparent 1.5px) 0 0/5px 4px,linear-gradient(170deg,#a88a6e,#7e624a);
  box-shadow:inset 0 1px 0 rgba(255,236,214,.18),inset 0 -1px 0 rgba(0,0,0,.3),0 0 0 1px rgba(28,13,8,.8);filter:saturate(.6) brightness(.8)}
${S} .cl-wrap .cl-slot:nth-child(3n){border-radius:6px 2px 5px 3px}
${S} .cl-wrap .cl-slot:nth-child(4n+1){border-radius:2px 5px 6px 2px}
${S} .cl-wrap .cl-slot.got{color:#14281e;filter:none;
  background:linear-gradient(170deg,rgba(255,255,255,.55),transparent 40%),linear-gradient(170deg,#bfe0c4,#7fb293 60%,#5e9478);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 -1px 0 rgba(0,0,0,.25),0 0 0 1px #1c0d08,0 0 6px rgba(160,230,190,.35)}
${S} .cl-wrap .cl-card.done .cl-slot.got{background:linear-gradient(170deg,rgba(255,255,255,.6),transparent 40%),linear-gradient(170deg,#ffe6a8,${GOLD} 60%,#c8962e);color:#2a140c}
`;

let installed = false;
export function installCollectionsLook() {
  if (installed || typeof document === 'undefined') return; installed = true;
  const st = document.createElement('style'); st.id = 'collections-look'; st.textContent = CSS; document.head.appendChild(st);
}
