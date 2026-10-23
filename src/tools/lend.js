// ---------------------------------------------------------------------------------------
// THE SUB'S VERB, LENT: what every tool's lend() shares (main and sub, tools/belt.js; SUB_GIFTS in progress/toolpairs.js). The sub is
// never drawn: on R its one verb goes off at once from where the tool hangs, or from the hand where the verb needs a hand (the shot's
// round, the hook's line). Each tool's own effect code does the work; this is the point it leaves from, and the word it goes by.
//
// The gesture over the main's stance and a model shown at the hand for the move's length are Calissa's (clips to come, on the event
// `tool.lend`); until then the verb is its effect alone, and says so here.
//
// Prior art: NieR: Automata's pod and Elden Ring's off hand (a second tool's one act, done without changing what is held).
//
//   lendHand(game, out) -> the right hand's world point (the shoulder's, the chest's, before the body is built)
// ---------------------------------------------------------------------------------------

/** Where a lent verb that needs a hand leaves from: the right hand. */
export function lendHand(game, out) {
  const ch = game.character, hand = ch?.arm?.R?.hand;
  if (hand) { hand.updateWorldMatrix(true, false); return hand.getWorldPosition(out); }
  const P = game.player;
  return out.set(P.pos.x, P.pos.y + 1.2, P.pos.z);
}
