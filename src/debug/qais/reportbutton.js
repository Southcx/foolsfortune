// ---------------------------------------------------------------------------------------
// QAIS'S CORNER BUTTON (docs/plans/MOBILE.md 9, M1): a phone has no F8, so while touch play is on a REPORT tile (Espada's word) stands
// in the top-left corner of the safe area (upright, under the log's ticker: the top bar wraps into that corner), and a tap on it is F8: the frame taken first, then the window (`qais.toggle`). It stands over
// the windows too, since a bug is often in one; never over QAIS itself, the title or the workbench (`qais.canOpen`). Built only where
// QAIS is (main.js QAIS_ON: never in a public build). Its look is Calissa's touch tile in its named form (ui/touch/tile.js).
// What it shows is looked at four times a real second (REPORT_BUTTON.every), and only a change touches the page.
//
// Prior art: the floating feedback button of mobile betas (TestFlight's screenshot feedback, Instabug's), Valve's `bug` command (one
// press, the frame first).
//
//   installReportButton(game) -> { tile, check() }   REPORT_BUTTON
// ---------------------------------------------------------------------------------------
import { TouchTile, TILE } from '../../ui/touch/tile.js';
import { touchOn, placeOf, onPlaceChange } from '../../ui/touch/areas.js';

/** The tile's label, its height (CSS px), its gap from the safe area's corner, how often what it shows is looked at (real ms), its
 *  stacking (over the windows, under nothing but QAIS's own). */
export const REPORT_BUTTON = { word: 'REPORT', size: TILE.small, gap: 8, every: 250, z: 9400 };

export function installReportButton(game) {
  if (typeof document === 'undefined' || !game.qais) return null;
  const tile = new TouchTile('qais.report', { size: REPORT_BUTTON.size, glyph: null, word: REPORT_BUTTON.word, onPress: (id, down, inside) => { tile.update(performance.now() / 1000); if (!down && inside) game.qais?.toggle(); } }); // (the face sits down, then the window)
  tile.el.style.zIndex = String(REPORT_BUTTON.z);
  const place = () => {
    const P = placeOf(game), L = game.hudLayout, g = REPORT_BUTTON.gap; // (upright the top bar wraps into the corner: the tile stands under the log's ticker instead)
    const y = L?.touch && L.portrait && L.log ? L.log.y + L.log.h + 2 * g : P.safe.t + g;
    tile.place(P.safe.l + g, y, REPORT_BUTTON.size); tile.update(performance.now() / 1000);
  };
  const check = () => {
    const Q = game.qais, show = !!(touchOn(game) && Q && !Q.open && Q.canOpen());
    if (show === !tile.state.hidden) return;
    tile.set({ hidden: !show }); if (show) place();
  };
  onPlaceChange(game, () => { if (!tile.state.hidden) place(); });
  setInterval(check, REPORT_BUTTON.every);
  return { tile, check };
}
