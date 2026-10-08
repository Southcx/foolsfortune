// ---------------------------------------------------------------------------------------
// HIDE UI: F2 takes the interface off the screen, for a clean shot of the game (and so that a screenshot shows the world and not the
// furniture around it). Three states, F2 cycles them:
//   0  everything
//   1  the HUD is gone (the compass, the log, the bars, the strip, the lap timer, the crosshair) but the frame of a shot stays: the
//      letterbox bars and the fish window are part of how the game is shown, not part of its interface
//   2  nothing at all but the picture
// Menus that were opened on purpose (the Codex, the map, the index) are never hidden; the error box is never hidden either.
//
//   game.ui.cycle()      game.ui.set(0 | 1 | 2)      game.ui.want(id, on, { log }?)   window.__game.hideUI(level)   (for tests and screenshots)
//   (`log`: the HUD steps out but the log stays, when every want asks it and F2 has not hidden it: the spirit press's view)
// ---------------------------------------------------------------------------------------
const HUD = '#hud, #circuit, #godtip, #godwheel, #god, .lil-gui';
const FRAME = '#cinema, #portrait';

export class HideUI {
  constructor(game) {
    this.game = game;
    this.level = 0;
    const st = document.createElement('style');
    st.textContent = `body.ui1 :is(${HUD}), body.ui2 :is(${HUD}), body.ui2 :is(${FRAME}) { display: none !important; }
      body.ui1.uilog #hud { display: block !important; } body.ui1.uilog #hud > :not(#chatlog) { display: none !important; }`;
    document.head.appendChild(st);
  }
  set(level) {
    this.level = ((level % 3) + 3) % 3;
    this.apply();
    return this.level;
  }
  /** A feature that wants the HUD out of the way while it is on (the Veritome's lens raised: the picture is the whole screen). It is
   *  hidden as at level 1 while any want it, and comes back as the player had it. */
  want(id, on, { log = false } = {}) {
    this.wants ??= new Set(); this.logs ??= new Set();
    const had = this.logs.has(id); if (on && log) this.logs.add(id); else this.logs.delete(id);
    if (on === this.wants.has(id) && had === this.logs.has(id)) return;
    if (on) this.wants.add(id); else this.wants.delete(id);
    this.apply();
  }
  apply() {
    const eff = this.wants?.size ? Math.max(this.level, 1) : this.level;
    document.body.classList.toggle('ui1', eff === 1);
    document.body.classList.toggle('ui2', eff === 2);
    document.body.classList.toggle('uilog', eff === 1 && this.level === 0 && !!this.wants?.size && [...this.wants].every((id) => this.logs?.has(id)));
  }
  cycle() { return this.set(this.level + 1); }
}
