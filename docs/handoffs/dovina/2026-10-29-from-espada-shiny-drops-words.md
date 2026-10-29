# From Espada: Absorb, the drops, the shiny, du10 to du13 (your 49d5f3cf; ABERRANTS.md 8 to 10)

| where | key | words |
| --- | --- | --- |
| powers.js | `absorb.label` | `Absorb` (stands: plain English, and what a jelly does) |
| powers.js | `absorb.line` | `Drinks every junk and slime in a 3 x 3 off your half; each gives 3 to your pool` (slime named, since a player who has just met the jelly will ask) |
| learned.js | `absorb.hint` | `Learned from an aberrant slip jelly.` (stands) |
| tracking/duel.js `duel.drop` | | `` `The ${e.shiny ? 'shiny ' : ''}aberrant ${who} leaves ${e.n === 1 ? 'a material' : `${e.n} materials`} for Soul Alchemy. ${e.n === 1 ? 'It goes' : 'They go'} into your Pneuka Box.` `` |
| cosmetics.js | `pendant.lantern` hint | `An aberrant Lantern Wisp keeps it, and gives it up only one way.` |
| duelachievements.js | du10 | `Come Apart` / `Win a puzzle duel against an aberrant slip jelly with the Line short of its wall.` (both stand; the words match du9's) |
| duelachievements.js | du11 | `One in Ten` / `Win a puzzle duel against a shiny aberrant.` |
| duelachievements.js | du12 | `Quick Study` / `Learn a skill from an aberrant.` (stands) |
| duelachievements.js | du13 | `Every Lesson` / `Learn every skill the aberrants teach.` (stands) |
| collectionlog.js | section | `Learned skills` (stands) |
| collectionlog.js | slot | `A shiny aberrant` (stands) |

Why these read as they do:
- **The drop line** names the creature (`${who}`, as the log says it mid-sentence: "Lantern Wisp", "slip jelly"), so a shiny drop reads
  "The shiny aberrant slip jelly leaves 3 materials ...". It says "for Soul Alchemy" rather than "the spirit press", which is not a
  glossary word; the press at the Athanor is where they go, and Soul Alchemy is the system the player knows. The plural is guarded.
- **The pendant's hint** keeps the secret. It says there is one way, which is true because only the secret opens it, and that it is not
  the plain win. Anyone who has seen the Wisp's lantern gutter will make the link; anyone who hasn't learns only that there is something
  to find.
- **du11** is named for the odds (`SHINY.chance` 0.1) rather than for the look. "Shiny" alone as a title says nothing; "One in Ten"
  tells you what you met. It is a plain number, not a lore word.
- **"Shiny"** stays the genre's word (Pokemon's) until South calls the aberrants settled; the lore name will come then.

Delete once pasted.
