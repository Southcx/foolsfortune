// ---------------------------------------------------------------------------------------
// TOUCH PLAY'S CONTROLS, THEIR LOOK: the one entry (docs/plans/MOBILE.md 4, 6.3, 8, 8.2, 10 "Calissa's answers"). It builds nothing until
// touch play is on (the HUD layout manager's word, ui/hudlayout.js, or its stand-in: ui/touch/areas.js), so keyboard-and-mouse play
// meets no element, no listener on the page and no frame's work; once on, one requestAnimationFrame loop draws what moved, and every
// part stands down when touch goes off again. The parts:
//   the cluster (ui/touch/cluster.js)   the stick's ring (stick.js)   the long press's ring (longpress.js)   the top bar (topbar.js)
//   the art bar and its size slider (artbar.js, sizeslider.js)   each tile (tile.js), all reporting through touchTiles (presses.js)
// The INPUT is not here: the touch driver (Petra's, core/bindings.js's codes) reads and listens to these; they move nothing themselves.
//
// Prior art: the virtual-pad layers of the mobile ports (a view that only reports, built only on a touch device), the pixel kit's and
// the goals window's lazy builds (ui/pixel.js, ui/goalswindow.js).
//
//   installTouchControls(game) -> game.touchUI = { on, force(on | null), cluster, stick, longPress, topBar, artBar, tiles (touchTiles) }
//   (built on first touch; until then cluster, stick, topBar and artBar are null)
// ---------------------------------------------------------------------------------------
import { touchOn, force, onPlaceChange, wireLayout } from './areas.js';
import { touchTiles } from './presses.js';
import { longPress } from './longpress.js';
import { TouchCluster } from './cluster.js';
import { TouchStick } from './stick.js';
import { TouchTopBar } from './topbar.js';
import { TouchArtBar } from './artbar.js';

export function installTouchControls(game) {
  const UI = { on: false, cluster: null, stick: null, longPress, topBar: null, artBar: null, tiles: touchTiles, force: (on) => { game.hudLayout?.force?.(on); force(on); } }; // (one word on touch for the layout and the controls)
  game.touchUI = UI;
  if (typeof document === 'undefined') return UI;
  let raf = 0;
  const build = () => {
    if (UI.cluster) return;
    UI.cluster = new TouchCluster(game); UI.stick = new TouchStick(game); UI.topBar = new TouchTopBar(game); UI.artBar = new TouchArtBar(game);
  };
  const relayout = () => { if (!UI.cluster) return; UI.stick.relayout(); UI.topBar.relayout(); if (UI.artBar.shown) UI.artBar.relayout(); UI.cluster.relayout(); };
  const frame = (ms) => {
    raf = 0;
    wireLayout(game);
    const now = ms / 1000, on = touchOn(game);
    if (on !== UI.on) { UI.on = on; if (on) { build(); relayout(); } else longPress.cancel(); }
    if (UI.cluster) {
      UI.topBar.update(now, on); UI.artBar.update(now, on);
      const avoid = UI.artBar.shown ? UI.artBar.bar : null;
      if (avoid !== UI.cluster.avoid) { UI.cluster.avoid = avoid; UI.cluster.relayout(); }
      UI.cluster.update(now, on); UI.stick.update(now, on);
    }
    if (on) raf = requestAnimationFrame(frame); // (off: no loop; a change of place starts it again)
    else if (!game.hudLayout && !wait) wait = setTimeout(() => { wait = 0; kick(); }, 2000); // (the layout manager may come later: looked for until it does)
  };
  let wait = 0;
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); relayout(); };
  onPlaceChange(game, kick);
  kick();
  return UI;
}
