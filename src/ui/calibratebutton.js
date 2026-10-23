// ---------------------------------------------------------------------------------------
// THE SIGHT'S CALIBRATE BUTTON (docs/plans/OVERLAY.md 16; Dovina's ruling, 2026-10-23: a creature by a Veritome plate's pick, a place by a
// charted room on the map): one small button set beside the thing you could want, that points the Sight's needle at it. Its label is the
// genre's: TRACK, and TRACKING while the needle is on it (Breath of the Wild's Sheikah Sensor "Set", Zelda's map pin). A brass compass
// rose in the Clay dress, its needle swinging to point when pressed, lit gold while it is the waypoint. A refusal is said where you
// pressed it, once (`log.say` with a throttle: the Sight's own `why`), and the button shakes; the Sight tells the rest (`sight.calibrate`).
//
// Prior art: Breath of the Wild's Sheikah Sensor+ set from the Compendium; Zelda's map pins; Monster Hunter's "track" on a quest target.
//
//   calibrateButton(el, target, game?) -> the button (appended to el)   target: { place } | { kind } | { home: true }
//   installCalibrateButtons(game)   (once at boot: the game the buttons ask, and the style)
// ---------------------------------------------------------------------------------------

const CSS = `
.sightcal{display:inline-flex;align-items:center;gap:5px;margin:0 0 0 6px;padding:3px 8px 3px 4px;border:0;border-radius:11px;cursor:pointer;
  font:700 9px/1 Georgia,serif;letter-spacing:.14em;color:#2a140c;vertical-align:middle;
  background:linear-gradient(180deg,#e9d6bc,#c9a882);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 -2px 0 rgba(0,0,0,.22),0 0 0 1px #2a140c}
.sightcal:hover{background:linear-gradient(180deg,#f3e3c8,#d4b48c)}
.sightcal svg{width:14px;height:14px;display:block}
.sightcal .ndl{transform-origin:7px 7px;transition:transform .45s cubic-bezier(.3,1.6,.5,1)}
.sightcal.on{background:linear-gradient(180deg,#ffe6a8,#ffd36a);box-shadow:inset 0 1px 0 #fff8,0 0 0 1px #2a140c,0 0 8px rgba(255,211,106,.5)}
.sightcal.no{animation:sightcalno .3s}
@keyframes sightcalno{25%{transform:translateX(-2px)}75%{transform:translateX(2px)}}
`;
const ROSE = `<svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="6.2" fill="#3a2418" stroke="#8a6a3a" stroke-width="1"/>
<g class="ndl"><path d="M7 1.8 L8.6 7 L7 7.8 L5.4 7 Z" fill="#e0442a"/><path d="M7 12.2 L8.6 7 L7 6.2 L5.4 7 Z" fill="#efe0c2"/></g>
<circle cx="7" cy="7" r=".9" fill="#ffd36a"/></svg>`;

let G = null, styled = false;
const buttons = new Set();
const same = (w, t) => !!w && ((t.home && w.from === 'home') || (t.place && w.from === 'place' && w.id === t.place) || (t.kind && w.from === 'kind' && w.id === t.kind));

function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-sightcal', ''); s.textContent = CSS; document.head.appendChild(s);
}
function paint(b) {
  const on = same(G?.sight?.want, b._target);
  b.classList.toggle('on', on); b.lastChild.textContent = on ? 'TRACKING' : 'TRACK';
  b.title = on ? 'The Sight points here. Press to stop.' : 'Point the Sight here';
}

/** The game the buttons ask, once at boot; each button repaints when the Sight's waypoint changes. */
export function installCalibrateButtons(game) {
  G = game; style();
  game.events?.on?.('sight.calibrate', () => queueMicrotask(() => { for (const b of buttons) { if (!b.isConnected) buttons.delete(b); else paint(b); } })); // (after the event: clear() tells before it lets go)
}

/** A TRACK button for one thing you could want, appended to `el`. */
export function calibrateButton(el, target, game = G) {
  G ||= game; style();
  if (typeof document === 'undefined') return null;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'sightcal'; b._target = target;
  b.innerHTML = ROSE; b.appendChild(document.createElement('span'));
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    const S = G?.sight; if (!S) return;
    if (same(S.want, target)) { S.clear(); return; }
    const r = S.calibrate(target);
    const n = b.querySelector('.ndl');
    if (r.ok) { if (n) n.style.transform = `rotate(${360 + 40}deg)`; setTimeout(() => n && (n.style.transform = 'rotate(0deg)'), 460); }
    else { b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); G.log?.say?.('system', r.why, { key: 'sightno', throttle: 2 }); }
  });
  buttons.add(b); paint(b); el?.appendChild?.(b);
  return b;
}
