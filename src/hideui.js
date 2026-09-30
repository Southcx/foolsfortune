// ---------------------------------------------------------------------------------------
// HIDE UI: F2 takes the interface off the screen, for a clean shot of the game (and so that a screenshot shows the world and not the
// furniture around it). Three states, F2 cycles them:
//   0  everything
//   1  the HUD is gone (the compass, the log, the bars, the strip, the lap timer, the crosshair) but the frame of a shot stays: the
//      letterbox bars and the fish window are part of how the game is shown, not part of its interface
//   2  nothing at all but the picture
// Menus that were opened on purpose (the Codex, the map, the index) are never hidden; the error box is never hidden either.
//
//   game.ui.cycle()      game.ui.set(0 | 1 | 2)      window.__game.hideUI(level)   (for tests and screenshots)
// ---------------------------------------------------------------------------------------
const HUD = '#hud, #circuit, #godtip, #godwheel, #god, .lil-gui';
const FRAME = '#cinema, #portrait';

export class HideUI {
  constructor(game) {
    this.game = game;
    this.level = 0;
    const st = document.createElement('style');
    st.textContent = `body.ui1 :is(${HUD}), body.ui2 :is(${HUD}), body.ui2 :is(${FRAME}) { display: none !important; }`;
    document.head.appendChild(st);
  }
  set(level) {
    this.level = ((level % 3) + 3) % 3;
    document.body.classList.toggle('ui1', this.level === 1);
    document.body.classList.toggle('ui2', this.level === 2);
    return this.level;
  }
  cycle() { return this.set(this.level + 1); }
}
