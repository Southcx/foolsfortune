// ---------------------------------------------------------------------------------------
// IN COMBAT: one signal for "is she fighting?", so everything that should only be there in a fight (the HUD ring and the ability
// charges, the battle music, a status worth showing) asks one place. HEAT rises to full the moment a blow is struck, by her or at her,
// or a hunter notices her, and holds while anything is still hunting her; then it eases away over a few seconds. ENGAGED is heat
// above a hair. The edges are events (`combat.start`, `combat.end`) for whoever wants them; nothing is said in the log.
//
// Prior art: the "in combat" flag of every MMO (WoW's combat state that gates mounting and the UI, FFXIV's battle stance that brings
// up the hotbars), and Breath of the Wild's battle music, which starts on a notice and fades after the last threat.
//
//   game.combat = new Combat(game)   .update(dt)   .engaged   .heat (0..1)   .poke(k = 1) (anything else that is a fight)
// ---------------------------------------------------------------------------------------
const STRUCK = ['cut.hit', 'brush.hit', 'jelly.hit', 'jelly.strike', 'jelly.notice', 'throw.hit', 'lob.hit', 'clapper.down', 'creature.stun', 'shell.hit', 'vessel.crack'];
const HOLD = 5, FADE = 3; // (seconds at full after the last blow, then seconds to ease away)

export class Combat {
  constructor(game) {
    this.game = game;
    this.heat = 0; this.since = 99; this.engaged = false;
    for (const k of STRUCK) game.events?.on(k, (e) => { if (e?.by !== 'clapperjar' || k === 'jelly.strike') this.poke(); });
  }
  /** Something that is a fight happened just now. */
  poke(k = 1) { this.since = 0; this.heat = Math.max(this.heat, k); }

  update(dt) {
    const g = this.game;
    if (g.jellies?.hunting?.(24)) this.poke(); // (while something is after her, the fight holds)
    this.since += dt;
    if (this.since > HOLD) this.heat = Math.max(0, this.heat - dt / FADE);
    const on = this.heat > 0.02;
    if (on !== this.engaged) { this.engaged = on; g.events?.emit(on ? 'combat.start' : 'combat.end', {}); }
  }
}
