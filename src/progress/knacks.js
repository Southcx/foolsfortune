// ---------------------------------------------------------------------------------------
// THE KNACKS: passive Arts, switched on or off at will, where every assist lives (docs/plans/TRAINING.md section 3; CLAUDE.md's design
// laws: arts only by achievement, assists earned and never gating the skill). A knack is OPENED by the ledger (a count way, a feat way,
// an explorer's way: any one), never by a flag set in a hook; once open it is ON until you switch it off, and switching it off restores
// the game exactly. The table is Dovina's to fill (the names Espada's, approved by the owner); the first row is the Crib Sheet, whose
// gloss world/ostraca.js shows. Kept in the save (`knacks`, player scope: what you switched off).
//
// Prior art: Celeste's Assist Mode (offered plainly, never judged), Hades' God Mode (earned and optional), and the arts here
// (progress/skills.js: opened by the ledger).
//
//   KNACKS[id] = { name, does, opens(L) -> bool }   const K = new Knacks(game)   K.open(id)   K.on(id)   K.set(id, on)   /knack [id] [on|off]
//   K.update(dt): a knack the ledger has just opened is said once (`knack.open { knack, by }`; the ones said are kept in the save)
// ---------------------------------------------------------------------------------------
import { CRIB } from './ostraca.js';

const G = (L, k) => L.get(k) || 0;
const under = (L, prefix) => (L.under ? L.under(prefix).filter(([, v]) => v > 0).length : 0);
/** Each knack: what it does, and the ledger's ways to open it (the patient's count, the skilled feat; any one). `switch` is where the
 *  game reads it (Petra wires each: `game.knacks.on(id)`); `number` what it changes. The names are Espada's, approved by the owner. */
export const KNACKS = {
  crib: { name: 'the Crib Sheet', does: 'Shows the English beside each neuralese word you have glossed',
    opens: (L) => G(L, 'reprogram.run') >= CRIB.macros || G(L, 'reprogram.held5') >= CRIB.heldFive || G(L, 'ostracon.found') >= CRIB.ostraca },
  steadyHand: { name: 'Steady Hand', does: "Draws the psygun's aim gently onto a target near the reticle",
    opens: (L) => G(L, 'drill.hits') >= 2000 || ['flick', 'track', 'spray', 'recover'].some((d) => G(L, `drill.${d}.gold`) >= 1),
    switch: 'tools/psygun/weapon.js (the aim)', number: 'a pull of the aim toward a target within 3 degrees of the reticle, at most 30% a frame' },
  wideBore: { name: 'Wide Bore', does: "Makes the psygun's shots a third wider",
    opens: (L) => G(L, 'drill.hits') >= 5000 || G(L, 'chain.max') >= 25,
    switch: "tools/psygun/weapon.js (a shot's radius)", number: 'x 4/3' },
  thickWalls: { name: 'Thick Walls', does: 'Lets the shield take a tenth more before the clay',
    opens: (L) => G(L, 'vessel.mends') >= 200 || G(L, 'well.run.whole') >= 1,
    switch: "courier/vessel/damage.js (the shield's cost)", number: 'a full blow costs 35 / 1.1 Lachryma' },
  perfectPitch: { name: 'Perfect Pitch', does: "Sounds a crystal's target note once more before you strike",
    opens: (L) => G(L, 'crystal.strike') >= 300 || G(L, 'crystal.sweet.run') >= 10,
    switch: 'world/dunes/crystals.js (the reference note)', number: 'one more reference, a beat before the strike' },
  heldBreath: { name: 'Held Breath', does: "Holds a blow's parry window a beat longer",
    opens: (L) => G(L, 'move.parry') >= 500 || G(L, 'parry.run.best') >= 25,
    switch: 'courier/parry.js (BLOW_WINDOW, and the outline glint with it)', number: '0.25 to 0.40 real seconds' },
  ruleOfThirds: { name: 'Rule of Thirds', does: "Shows the thirds in the Veritome's frame",
    opens: (L) => G(L, 'photo.appraised') >= 300 || under(L, 'photo.four.') >= 4,
    switch: 'tools/veritome/viewfinder.js (the lens)', number: 'two lines each way, faint' },
  halfTime: { name: 'Half Time', does: 'Swings the pendulum on every other beat, never slower than the music',
    opens: (L) => G(L, 'bell.onbeat') >= 1000 || G(L, 'song.fever') >= 5,
    switch: 'vfx/crucibellehud.js (built: game.knacks?.halfTime; read it as game.knacks.on("halfTime"))', number: 'ends on quarters, a notch at the off-eighth' },
  guideTone: { name: 'Guide Tone', does: 'Sounds the next charted note a beat early',
    opens: (L) => G(L, 'rhythm.played') >= 50 || G(L, 'rhythm.accuracy.best') >= 95,
    switch: 'music/rhythm/rhythm.js (Wanda)', number: 'the note, quietly, a beat ahead' },
  wetInk: { name: 'Wet Ink', does: 'Keeps Celestial mode waiting longer after your last stroke',
    opens: (L) => G(L, 'brush.miss') >= 100 || G(L, 'sigil.cleared.best') >= 4,
    switch: 'tools/soulbrush/celestial.js (REST)', number: '0.42 to 0.7 real seconds' },
  paintStride: { name: 'Paint Stride', does: 'Your paint speeds you and refills your bottle. Other paint slows you.', // (Espada's words)
    opens: (L) => G(L, 'paint.area') >= 400 || G(L, 'paint.stroke.best') >= 30, // (about five bottles of paint laid; or 30 m² in one hold of the spray)
    switch: 'tools/soulbrush/load.js strideOf (built: LACHRYMA-LOOP.md 5, rule 1; Super Mario Sunshine: water underfoot)', number: 'own feeling x1.25, another x0.75, the bottle refilled 6 a second' },
  ariadnesThread: { name: "Ariadne's Thread", does: 'Shows on the map the way back to the last Shrine you rested at',
    opens: (L) => G(L, 'map.room') >= 50 || G(L, 'cogitomap.firstrun') >= 1,
    switch: 'feedback/cartography.js (the map)', number: 'a thread from you to the Shrine' },
  // Two-Tone (an agate's two colours on a creature's body) waits for the agate named at appraisal (`appraise.mood`), which it counts.
};

export class Knacks {
  constructor(game) {
    this.game = game; this.off = new Set(); this.heard = new Set(); this.lookT = 1;
    game.save?.section('knacks', { scope: 'player', version: 2,
      dump: () => ({ off: [...this.off], heard: [...this.heard] }),
      load: (d) => { this.off = new Set(Array.isArray(d?.off) ? d.off : []); this.heard = new Set(Array.isArray(d?.heard) ? d.heard : []); },
      reset: () => { this.off.clear(); this.heard.clear(); } });
    game.chat?.add?.('knack', { help: 'your knacks (assists you have earned): /knack, or /knack <id> on|off', run: (args) => this.command(args) });
  }
  /** Once a real second: a knack the ledger has opened since the last look is said, once (the ledger decides; this only notices). */
  update(dt = 0) {
    if ((this.lookT -= dt) > 0) return; this.lookT = 1;
    for (const id of Object.keys(KNACKS)) {
      if (this.heard.has(id) || !this.open(id)) continue;
      this.heard.add(id); this.game.save?.dirty('knacks');
      this.game.events?.emit('knack.open', { knack: id, by: 'courier' });
    }
  }
  /** Opened: the ledger says so. */
  open(id) { const k = KNACKS[id], L = this.game.ledger; return !!(k && L && k.opens(L)); }
  /** In use: opened, and not switched off. */
  on(id) { return this.open(id) && !this.off.has(id); }
  set(id, on) {
    if (!KNACKS[id] || !this.open(id)) return false;
    if (on) this.off.delete(id); else this.off.add(id);
    this.game.save?.dirty('knacks');
    this.game.events?.emit('knack.set', { knack: id, on: !!on, by: 'courier' });
    return true;
  }
  command(args = []) {
    const [id, v] = args, log = this.game.log;
    if (!id) { for (const [k, d] of Object.entries(KNACKS)) log?.say('system', `Knack: ${d.name} (${d.does}). ${this.open(k) ? (this.on(k) ? 'On' : 'Off') : 'Not yet earned'}. /knack ${k} on|off`, { key: `knack.${k}`, throttle: 0.5 }); return; }
    if (!KNACKS[id]) { log?.say('warn', `No knack called ${id}.`, { key: 'knack', throttle: 1 }); return; }
    if (!this.open(id)) { log?.say('warn', `You have not earned ${KNACKS[id].name} yet.`, { key: 'knack', throttle: 1 }); return; }
    this.set(id, v ? v !== 'off' : !this.on(id));
  }
}
