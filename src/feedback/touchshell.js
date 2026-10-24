// ---------------------------------------------------------------------------------------
// THE TOUCH SHELL (docs/plans/MOBILE.md 4 and 10, step 4): what touch play's controls (their look Calissa's: ui/touch/) do, wired. They
// only report (ui/touch/presses.js, the top bar's `touchShell.open`); here each report becomes the game's own input:
//   A TILE      (the cluster's hop, flare, brake, boost, nose, tail, jump, use) is pressed through the bindings table by the live
//               context (core/actions.js `press('touch', id)`), held while it is held; the art bar's two plain ones are the hand's undo
//               (Ctrl+Z) and the turn (R). The top bar's own tiles report here too, and are left to `open`.
//   THE TOP BAR opens a window as the keyboard would, by its key sent as a key event, so the window's own listener and the game's
//               reads both hear it: codex B, box P, map M, chat Enter, overhead ` (the garden's god hand view), godhand `, skiff Y,
//               survey N. settings and pause are
//               the pause menu (`game.pause`: a phone has no pointer lock to lose).
//   THE ART BAR (the Spirit Garden's, ui/touch/artbar.js) is the hand's: `touch.art { id }` sets its art (WALK, no art, included),
//               `touch.mod { mod }` WATER's SPRING or DRAIN, `touch.size { size }` the stroke's size (world/garden/hand.js).
//
// Prior art: the virtual gamepad layer of the mobile ports (the view reports, the input layer decides); VirtualKeys (coop/sibling.js).
//
//   game.touchShell = new TouchShell(game)   .open(what)   .tile(id, down)   OPENS (what -> code)   events read: touch.art, touch.mod, touch.size
// ---------------------------------------------------------------------------------------

/** The top bar's windows, by the key the keyboard opens each with. */
export const OPENS = { codex: 'KeyB', box: 'KeyP', map: 'KeyM', chat: 'Enter', overhead: 'Backquote', godhand: 'Backquote', skiff: 'KeyY', survey: 'KeyN' }; // (godhand: the hand raised or let go, ~; skiff: summoned or recalled, Y; survey: the hand's, N)
/** The art bar's plain tiles: the codes held for one frame (the hand's undo is Ctrl+Z, the turn R). */
const ART = { 'art.undo': ['ControlLeft', 'KeyZ'], 'art.turn': ['KeyR'] };

export class TouchShell {
  constructor(game) {
    this.game = game;
    const T = game.touchUI?.tiles;
    if (T) T.onPress = (id, down) => this.tile(id, down);
    const hand = () => (game.realm?.active ? game.realm.hand : null), E = game.events;
    E?.on('touch.art', (e) => hand()?.setArt(e.id));
    E?.on('touch.mod', (e) => { const H = hand(); if (H) H.mod = e.mod || null; });
    E?.on('touch.size', (e) => hand()?.setSize(e.size));
    // (the bar starts on WALK: on touch the hand comes into the garden with no art up, so the bar and the hand agree)
    E?.on('garden.enter', () => { if (game.input?.device === 'touch') hand()?.setArt('walk'); });
  }
  /** A tile pressed or let go (every touch tile reports here: ui/touch/presses.js). */
  tile(id, down) {
    const g = this.game;
    if (id.startsWith('top.')) return; // (the top bar's: `open` does them, on the tap's release)
    g.touch?.seen?.();
    const art = ART[id];
    if (art) { if (down) { for (const c of art) g.input.hold(c, true); requestAnimationFrame(() => { for (const c of art) g.input.hold(c, false); }); } return; }
    g.actions?.press('touch', id, down);
  }
  /** A top bar tile tapped (ui/touch/topbar.js calls it). */
  open(what) {
    const g = this.game;
    if (what === 'pause' || what === 'settings') return g.pause?.();
    const code = OPENS[what]; if (!code) return;
    const opts = { code, key: code === 'Enter' ? 'Enter' : code === 'Backquote' ? '`' : code.slice(3).toLowerCase(), bubbles: true };
    dispatchEvent(new KeyboardEvent('keydown', opts)); // (as the keyboard would: the window's listener and the game's read alike)
    setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', opts)), 60);
  }
}
