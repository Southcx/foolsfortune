// ---------------------------------------------------------------------------------------
// THE MOUNTS AS CHOICE CARDS: Dovina's table of the tools at sea (progress/rail/mounts.js) turned into the rows a choice card draws
// (ui/choicecard.js), read and never rewritten: the label, the line, the lore name and the detail as she wrote them; the cooldown, which
// the table keeps in BARS of the crossing's cue (its header), turned to real seconds (BAR_S, progress/rail/crossing.js: the player is
// shown one clock, CLARITY.md section 7), as are the bars the detail line names (`inSeconds`); the key the slot's number (keys 1 to 3 at
// sea, in the order chosen), LMB and RMB for the Blaster that is always the gun, and the Passive keyword for a mount with no verb.
//
// Prior art: a view model (the table stays the designer's; the window reads a shaped copy), and the pier's own panel as CLARITY.md
// section 9 draws it.
//
//   mountRow(tool, { slot = 0, opens = null }) -> row | null      slot: 1.. the key it fires on, 0 not aboard; opens: a locked card's line
//   inSeconds(text) -> text                                        "two bars" told as "3 s"
//   mountRows(tools, chosen) -> [row]                              each tool, its slot read from `chosen` (the loadout, in order)
// ---------------------------------------------------------------------------------------
import { MOUNTS } from '../progress/rail/mounts.js';
import { BAR_S } from '../progress/rail/crossing.js';

const WORD = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, eight: 8 };
const sec = (v) => String(+v.toFixed(1));
/** A line with its lengths in bars ("two bars", "a bar ahead") told in real seconds ("3 s", "1.5 s ahead"): the table's detail is written
 *  in the crossing's own clock, the player is shown one (CLARITY.md section 7), and a sixteenth note or a beat is the music's, so left. */
export const inSeconds = (text) => (text == null ? text : text.replace(/\b(an?|one|two|three|four|five|six|eight|\d+)\s+bars?\b/gi, (_, n) => `${sec((WORD[n.toLowerCase()] ?? +n) * BAR_S)} s`));

/** One mount as a card's row. */
export function mountRow(tool, { slot = 0, opens = null } = {}) {
  const M = MOUNTS[tool]; if (!M) return null;
  return {
    id: tool, name: M.name, does: M.does, lore: M.lore, detail: inSeconds(M.detail),
    cost: M.cost, charges: M.charges, cooldown: M.cooldown != null ? M.cooldown * BAR_S : undefined, range: M.range, angle: M.angle,
    always: !!M.always, icon: `mount.${tool}`,
    key: M.always ? ['LMB', 'RMB'] : !M.verb ? 'passive' : slot ? String(slot) : null,
    state: opens ? 'locked' : M.always || slot ? 'equipped' : 'ready', opens: opens || undefined,
  };
}

/** Several mounts, each with its slot in the loadout `chosen` (1 the first). */
export const mountRows = (tools, chosen = []) => tools.map((t) => mountRow(t, { slot: chosen.indexOf(t) + 1 })).filter(Boolean);
