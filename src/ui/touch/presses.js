// ---------------------------------------------------------------------------------------
// THE TOUCH TILES' PRESSES: the one place every tile of touch play reports to (the cluster, the art bar's own tiles, the top bar), so
// the touch driver (Petra's: it presses the key codes of core/bindings.js) has one listener to set and one set to read. A press says
// itself three ways: the driver's callback, the bus (`touch.tile { id, down, by }`, Dovina's sweeps can watch it), and `held`.
// It moves nothing in the game itself: what a press does is the driver's.
//
// Prior art: the virtual gamepad of every mobile port (a button layer that only reports, the game's input layer deciding: VirtualKeys
// in core/input.js does the same for the keyboard's codes), the DOM's own pointer events for one finger a control.
//
//   touchTiles.onPress = (id, down) => {}     touchTiles.isDown(id)     touchTiles.held (Set of ids)     touchTiles.report(game, id, down)
// ---------------------------------------------------------------------------------------

export const touchTiles = {
  /** The driver's listener: (id, down) for every tile pressed or let go. */
  onPress: null,
  held: new Set(),
  isDown(id) { return this.held.has(id); },
  /** A tile pressed or let go: said to the driver and on the bus, kept in `held`. */
  report(game, id, down) {
    if (down === this.held.has(id)) return;
    if (down) this.held.add(id); else this.held.delete(id);
    try { this.onPress?.(id, down); } catch (e) { console.warn('touchTiles.onPress', e); }
    game?.events?.emit?.('touch.tile', { id, down, by: 'courier' });
  },
};
