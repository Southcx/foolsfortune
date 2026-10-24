// ---------------------------------------------------------------------------------------
// THE PHONE'S PAGE (docs/plans/MOBILE.md 10, step 5; 11.1, iOS Safari's limits): what a page must do to be played with thumbs.
//   NO ZOOM OR SCROLL   the canvas takes every touch (`touch-action: none`), the page never scrolls or bounces, Safari's pinch is refused
//                       (`gesturestart`), and a double tap does not zoom; text fields keep their selection.
//   AWAKE               while you play on touch, the screen is kept on (the Screen Wake Lock API where it exists, asked again when the
//                       page comes back), and let go when it is hidden.
//   FULL SCREEN         asked on the first touch where the browser allows it (Android; an iPhone gives it to video only), and the
//                       turn to landscape asked after (Android only: no browser lets a page lock it otherwise).
//   WHICH WAY UP        `game.screenTurn.portrait`, and `screen.turn { portrait, by }` when it changes. An action mode held in portrait
//                       shows the turn card instead, the game held under it (Calissa's ui/turncard.js: its rule and its hold).
// Each is asked once and its refusal is quiet: the perf readout says what the host allows (debug/hostprobe.js).
//
// Prior art: the Screen Wake Lock API's own pattern (re-acquire on visibilitychange); Android Chrome's fullscreen-then-lock rule for
// orientation; every web game's `touch-action: none` canvas and `gesturestart` guard on iOS.
//
//   installPlatform(game)   game.screenTurn = { portrait }   Events: screen.turn { portrait, by: 'environment' }
// ---------------------------------------------------------------------------------------

const CSS = `
canvas { touch-action: none; -webkit-tap-highlight-color: transparent; }
html, body { overscroll-behavior: none; -webkit-text-size-adjust: 100%; }
body { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; touch-action: manipulation; }
input, textarea, [contenteditable] { -webkit-user-select: text; user-select: text; }
`;

export function installPlatform(game) {
  const st = document.createElement('style'); st.setAttribute('data-platform', ''); st.textContent = CSS; document.head.appendChild(st);
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false }); // (Safari's pinch)
  const vp = document.querySelector('meta[name="viewport"]'); // (index.html says viewport-fit=cover, or iOS reports no safe insets; a page that lost it gets it back)
  if (vp && !/viewport-fit/.test(vp.content)) vp.content += ', viewport-fit=cover, maximum-scale=1';

  // ---- awake while playing on touch
  let lock = null;
  const awake = async () => {
    if (lock || document.hidden || game.input?.device !== 'touch' || !navigator.wakeLock?.request) return;
    try { lock = await navigator.wakeLock.request('screen'); lock.addEventListener?.('release', () => { lock = null; }); } catch { lock = null; }
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) awake(); });

  // ---- the first touch: full screen where allowed, then landscape where allowed
  let asked = false;
  addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    awake();
    if (asked) return; asked = true;
    const el = document.documentElement;
    if (document.fullscreenEnabled && el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation?.lock?.('landscape')).catch(() => {});
    }
  }, true);

  // ---- which way up
  const turn = (game.screenTurn = { portrait: innerHeight > innerWidth });
  const check = () => { const p = innerHeight > innerWidth; if (p === turn.portrait) return; turn.portrait = p; game.events?.emit('screen.turn', { portrait: p, by: 'environment' }); };
  addEventListener('resize', check); screen.orientation?.addEventListener?.('change', check);
}
