// ---------------------------------------------------------------------------------------
// THE GOD HAND'S ART SELECTOR'S DRESS (GODHAND.md, "The selector": the placeholder bar "until Calissa rules on the look"; Petra's round,
// 2026-11-01). The bar's nodes are Petra's (godhand/arts.js buildUi: #goddomains' seven span[data-d] tabs, #godarts' .slot[data-i] cards,
// classes on / sel / no / out); this restyles them only, never rebuilding a node arts.js keeps.
//   THE SHELF     the seven domains as glazed tiles standing on a kiln shelf (a bat of fired clay on two posts), each in its own glaze
//                 (DOMAIN_LOOK, ui/domainlook.js), its icon in it and its key in the corner; the chosen one lifted off the shelf, ringed
//                 in gold, its name pressed on a bisque slip under it; the others set back, nameless (a tile a domain, read by colour,
//                 sign and key)
//   THE CARDS     the chosen domain's arts as test tiles: bisque, a band of the domain's glaze dipped across the top where the key sits in
//                 a gold chip, the art's icon in a glazed well, its name pressed beneath. The chosen art lifted, its glaze run down the
//                 whole tile and ringed in gold; one not learned (or the ground's tier too short) greenware, grey and dashed; one the pool
//                 cannot pay with an ember rim breathing
// On the phone on its side (max-height 480px) the tiles and cards shrink and the cards keep only their icon and key. Both stand centred
// unless the log's box reaches under them; then they slide right until clear of it (clearOfLog, SELECTOR).
//
// Prior art: the potter's test-tile board (a glaze a tile, dipped halfway so the band reads against the bisque); a kiln shelf's bats and
// posts; Black & White's and Populous's miracle bars (the god's arts as a short row under the hand); the GOD ARTS shelf's dress
// (ui/godartslook.js: the same glazes, greenware for what is not yours yet).
//
//   installGodArtSelector(game)   (once, at boot: injects the style and keeps `--gd-c` on each node as the domain changes)
// ---------------------------------------------------------------------------------------
import { DOMAIN_LOOK } from './domainlook.js';

const GOLD = '#ffd36a';
const C = 'var(--gd-c, #c46a45)';
const S = 'body #hud'; // (an id more than arts.js's own rules: the dress wins whichever style lands later)

const CSS = `
${S} #goddomains{gap:6px;padding:6px 12px 9px;bottom:calc(10px + var(--cine, 0vh));border-radius:4px;align-items:flex-end;
  background:linear-gradient(180deg,transparent 0 62%,#8a5a3c 62%,#b07a52 70%,#6e4229 100%);
  box-shadow:0 6px 10px -6px rgba(0,0,0,.6)}
${S} #goddomains::before,${S} #goddomains::after{content:'';position:absolute;bottom:-8px;width:10px;height:10px;background:linear-gradient(90deg,#5a3626,#8a5a3c,#5a3626);border-radius:0 0 2px 2px}
${S} #goddomains::before{left:18px} ${S} #goddomains::after{right:18px}
${S} #goddomains span{position:relative;display:flex;flex-direction:column;align-items:center;width:34px;height:34px;justify-content:center;border:0;
  font-size:0;letter-spacing:0;color:transparent;border-radius:6px;transition:transform .12s,filter .12s;
  background:linear-gradient(180deg,rgba(255,255,255,.3),transparent 45%,rgba(0,0,0,.25)),${C};
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -2px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08,0 2px 3px rgba(0,0,0,.5);filter:saturate(.6) brightness(.72)}
${S} #goddomains span i{opacity:1;margin:0;filter:drop-shadow(0 1px 0 rgba(0,0,0,.6))}
${S} #goddomains span b{position:absolute;top:-1px;left:3px;margin:0;font:11px var(--f-sys);color:#fff1dc;text-shadow:0 1px 0 #1c0d08,0 0 3px rgba(0,0,0,.8)}
${S} #goddomains span.on{filter:none;transform:translateY(-6px);border:0;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -2px 0 rgba(0,0,0,.3),0 0 0 1px #1c0d08,0 0 0 3px ${GOLD}aa,0 6px 10px rgba(0,0,0,.5)}
${S} #goddomains span.on::after{content:attr(data-d);position:absolute;top:100%;margin-top:4px;padding:1px 6px;border-radius:2px;white-space:nowrap;
  font:600 8px var(--f-title);letter-spacing:.2em;text-transform:uppercase;color:#2a140c;background:linear-gradient(180deg,#e9d6bc,#c9a882);box-shadow:0 0 0 1px #2a140c}

${S} #godarts{gap:7px;padding:0;background:none !important;bottom:calc(66px + var(--cine, 0vh))}
${S} #godarts .slot{width:76px;height:70px;border:0;border-radius:4px;opacity:1;justify-content:flex-end;padding-bottom:5px;text-shadow:none;
  background:linear-gradient(180deg,rgba(255,255,255,.28),transparent 40%) 0 0/100% 34% no-repeat,
    linear-gradient(180deg,color-mix(in srgb,${C} 80%,#24100a),${C}) 0 0/100% 34% no-repeat,
    radial-gradient(circle,rgba(60,30,14,.14) 0 1px,transparent 1.5px) 0 0/6px 7px,linear-gradient(180deg,#e2cdb0,#bf9c76);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 -2px 0 rgba(0,0,0,.25),0 0 0 1px #2a140c,0 3px 5px rgba(0,0,0,.45);transition:transform .12s}
${S} #godarts .slot i{position:absolute;top:13px;left:50%;transform:translateX(-50%);width:30px;height:30px;display:flex;align-items:center;justify-content:center;
  border-radius:50%;background:radial-gradient(circle at 40% 35%,rgba(255,255,255,.3),transparent 55%),color-mix(in srgb,${C} 70%,#1c0d08);
  box-shadow:inset 0 2px 3px rgba(0,0,0,.5),0 0 0 1px #2a140c}
${S} #godarts .slot span{margin:0;font:600 8px var(--f-title);letter-spacing:.14em;color:#2a140c;text-align:center;line-height:1.1;max-width:70px}
${S} #godarts .slot b{top:2px;left:3px;min-width:12px;padding:0 3px;border-radius:2px;font:11px/13px var(--f-sys);color:#2a140c;text-align:center;
  background:linear-gradient(180deg,#ffe9a8,${GOLD} 55%,#b08328);box-shadow:0 0 0 1px #2a140c}
${S} #godarts .slot u{color:#fff1dc;text-shadow:0 1px 0 #1c0d08}
${S} #godarts .slot.sel{transform:translateY(-6px);
  background:linear-gradient(180deg,rgba(255,255,255,.35),transparent 30%,rgba(0,0,0,.18)),linear-gradient(180deg,${C},color-mix(in srgb,${C} 60%,#24100a));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 -2px 0 rgba(0,0,0,.3),0 0 0 1px #1c0d08,0 0 0 3px ${GOLD}cc,0 7px 12px rgba(0,0,0,.5)}
${S} #godarts .slot.sel span{color:#fff6e8;text-shadow:0 1px 0 #1c0d08,0 0 4px rgba(0,0,0,.7)}
${S} #godarts .slot.no{opacity:1;filter:grayscale(1) brightness(.75);background:repeating-linear-gradient(135deg,#9a948c 0 4px,#8a847c 4px 8px);
  box-shadow:0 0 0 1px #2a140c;outline:1px dashed rgba(255,255,255,.35);outline-offset:-4px}
${S} #godarts .slot.out{animation:gd-ember 0.9s ease-in-out infinite alternate}
@keyframes gd-ember{from{box-shadow:0 0 0 1px #2a140c,0 0 0 2px #ff5a3a88}to{box-shadow:0 0 0 1px #2a140c,0 0 0 3px #ff5a3a,0 0 10px #ff5a3a}}

@media (max-height:480px){
${S} #goddomains{gap:4px;padding:4px 8px 7px;bottom:calc(22px + var(--cine, 0vh))}
${S} #goddomains span{width:28px;height:28px}
${S} #godarts{gap:5px;bottom:calc(64px + var(--cine, 0vh))}
${S} #godarts .slot{width:46px;height:46px;padding:0}
${S} #godarts .slot i{top:9px;width:28px;height:28px}
${S} #godarts .slot span{display:none}
}
`;

const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
/** A domain's tile colour: its glaze's body, unless that would vanish (a black tenmoku reads as a hole, a pale shino as bare bisque): then
 *  the colour its glaze is known by (the tenmoku's star violet, the shino's fire flash). */
const glazeOf = (d) => { const c = DOMAIN_LOOK[d]?.colours; if (!c) return null; const L = lum(c.body); return (L < 0.15 || L > 0.75) && (c.edge || c.accent) ? (L < 0.15 ? c.edge || c.accent : c.accent) : c.body; };

/** The shelf and the cards stand centred, unless the log's box (#chatlog, bottom left on the desk) reaches under them: then both are
 *  slid right until clear of it (SELECTOR.gap), never past the Lachrimeter's corner (SELECTOR.right). */
export const SELECTOR = { gap: 12, right: 96 };
function clearOfLog(doms, bar) {
  const log = document.getElementById('chatlog'), W = innerWidth;
  const w = Math.max(doms.offsetWidth, bar.offsetWidth), half = w / 2;
  let cx = W / 2;
  const r = log && log.offsetParent !== null ? log.getBoundingClientRect() : null;
  const top = Math.min(doms.getBoundingClientRect().top, bar.getBoundingClientRect().top);
  if (r && r.width > 0 && r.bottom > top && r.right + SELECTOR.gap > cx - half) cx = Math.min(r.right + SELECTOR.gap + half, W - SELECTOR.right - half);
  const left = Math.abs(cx - W / 2) < 1 ? '' : `${Math.round(cx)}px`;
  if (doms.style.left !== left) { doms.style.left = left; bar.style.left = left; }
}

/** Install the dress; it keeps `--gd-c` on each tab (its own glaze) and on the cards' bar (the chosen domain's). */
export function installGodArtSelector() {
  if (typeof document === 'undefined' || document.getElementById('godartselector-css')) return;
  const st = document.createElement('style'); st.id = 'godartselector-css'; st.textContent = CSS; document.head.appendChild(st);
  let bound = null;
  const bind = () => {
    const doms = document.getElementById('goddomains'), bar = document.getElementById('godarts');
    if (!doms || !bar || bound === doms) return;
    bound = doms;
    const tabs = [...doms.querySelectorAll('span[data-d]')];
    for (const t of tabs) { const c = glazeOf(t.dataset.d); if (c) t.style.setProperty('--gd-c', c); }
    const follow = () => { const on = tabs.find((t) => t.classList.contains('on')); const c = on && glazeOf(on.dataset.d); if (c) bar.style.setProperty('--gd-c', c); };
    new MutationObserver(follow).observe(doms, { subtree: true, attributes: true, attributeFilter: ['class'] });
    follow();
    const clear = () => clearOfLog(doms, bar);
    addEventListener('resize', clear);
    setInterval(() => { if (doms.style.display === 'flex') clear(); }, 400); // (the log is dragged, folded and grows: read it while the bar is up)
  };
  bind();
  const hud = document.getElementById('hud');
  if (hud) new MutationObserver(bind).observe(hud, { childList: true }); // (the bar is built when the god hand is first made)
}
