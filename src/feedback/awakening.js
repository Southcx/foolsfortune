// ---------------------------------------------------------------------------------------
// THE AWAKENING'S MOMENT: what the game does the instant a feeling wakes (`feeling.wake`, progress/feelings.js; docs/plans/
// FEELINGS-AWAKENING.md section 3), the parts that are no one division's look or sound. The glitch, once and short, as the feeling
// breaks through (game.glitch, the big-moment pass; the setting `visual.glitch` turns it off). The body's answer waits until the
// Courier is free: never in a fight (game.combat.engaged), never mid-move (a tech, a mantle, the air); then `feeling.embody { feeling,
// by }` is said once, and the Courier's own clip for that feeling hangs on it (Calissa's). The weather's flood round them (Calissa's)
// and the feeling's phrase (Wanda's) hang on `feeling.wake` itself; the line in the log is its rule's (tracking/weather.js).
//
// Prior art: Okami's brush techniques (the world stops, the god appears, the stroke is given), Journey's wordless set pieces, and every
// action game that holds a cutscene until the last enemy falls.
//
//   new Awakening(game).update(rawDt)   AWAKENING
// ---------------------------------------------------------------------------------------

/** The glitch's pulse (amounts 0..1, `dur` real seconds), and how long the Courier must be free before the body answers (real s). */
export const AWAKENING = { glitch: { split: 0.7, tear: 0.45, crush: 0.3, dur: 0.55 }, free: 0.6 };

export class Awakening {
  constructor(game) {
    this.game = game; this.waiting = []; this.freeT = 0;
    game.events?.on?.('feeling.wake', (e) => {
      if (e?.by !== 'courier' || !e.feeling) return;
      game.glitch?.pulse?.({ ...AWAKENING.glitch, at: game.player?.pos?.clone?.().setY(game.player.pos.y + 1.2) });
      this.waiting.push(e.feeling);
    });
  }

  /** Free: on their feet, nothing taking the body, no fight. */
  free() {
    const g = this.game, P = g.player;
    return !!P && P.grounded && !P.mantle && !P.techs?.active && !g.combat?.engaged && !g.god?.active;
  }

  update(raw = 1 / 60) {
    if (!this.waiting.length) return;
    this.freeT = this.free() ? this.freeT + raw : 0;
    if (this.freeT < AWAKENING.free) return;
    this.freeT = 0;
    this.game.events?.emit('feeling.embody', { feeling: this.waiting.shift(), by: 'courier' });
  }
}
