**2026-10-08, from Espada: TRAINING.md section 5 (my rows) and the words asked for. Proposals until the owner rules.**

**The words.** Keep **knack**: one syllable, plain English, and it means exactly an ease learned by practice. Keep **seasoning** too:
cast iron is seasoned by use, never by waiting, which is the rule (filled by doing). The potter's words are taken (*wedge* is a Pithos
cast, *temper* the body's mental state; *ageing* clay is idling).

**The seven knacks** (renamed where a name collided with the glossary):
| draft | name | why |
|---|---|---|
| Steady Hand | **Steady Hand** | a potter's hand at the wheel, a marksman's |
| Wide Bore | **Wide Bore** | a wider barrel; plain |
| Kiln-Hardened | **Thick Walls** | a pot thrown thick survives the knock ("kiln" is a homonym now) |
| Tuning Fork | **Perfect Pitch** | hearing the note; "the fork" is the Dreamvane's |
| Second Look | **Early Tell** | the poker tell, read a beat sooner |
| Wide Lens | **Rule of Thirds** | names what it teaches; "the lens" is the Veritome's |
| Slow Bell | **Half Time** | the musician's word for the beat felt at half speed |

**Neuralese and the realm's names**
1. *The skill:* a conlang's morphology, learned from use: roots, compounding and the order of modifiers. *What teaches it:* a
   Function is learned by seeing the behaviour (the photograph gives the word); a macro is spoken in signal order with the modifier
   after (STIL-LON); runes share strokes where words share letters (visible morphology); the realm's name is glossed once at naming,
   then never again, so the player parses it later on their own. *What would teach more:* fade the gloss. The log says a macro as
   "SIVA-LON (drink, long)" the first three times, then "SIVA-LON" alone (scaffolding withdrawn). Folk use a word now and then: Pip
   whispers "SHAI" before running. This is Chants of Sennaar's and Tunic's method: the meaning is deduced, never handed over.
2. *EXP:* `reprogram.run` to Spellscription. Quality 1 when the macro holds first time and the challenge is typed without an error;
   0.4 when it holds after a refusal or a mistyped word. Petra owns the event; it needs `held` and `typos` on it.
3. *Knack:* **Crib Sheet** (the owner, 2026-10-08), the English gloss beside every neuralese word on the lattice and in the log. A crib is a student's translation,
   and a crib is a cradle. Opened by 100 macros spoken (count) or a five-Function macro held at the first try (feat).
4. *No home:* none. Spellscription is the writing of things that hold, and that covers this.

**The five feelings, agates and the wheel**
1. *The skill:* emotional granularity, naming a feeling finely (Lisa Feldman Barrett's term; finer names go with better
   regulation): two feelings at once, and opposites cancelling. *What teaches it:* the weather and a mind each show one feeling or one
   agate, named in plain words (longing, worry, despair), and opposites visibly tear and weaken. *What would teach more:* make
   naming a choice. At appraisal the Veritome asks which agate a creature was in (two feelings, picked from the five), and the bestiary
   keeps right and wrong. Prior art: Inside Out's two-coloured memories.
2. *EXP:* `appraise.mood { guessed, actual }` (new) to Divination. Quality 1 for the right agate, 0.5 for one of its two feelings,
   0.1 for wrong.
3. *Knack:* **Two-Tone**: a creature in an agate shows both colours on its body, not only the stronger one (agateware: two clays,
   both showing). A mark on the body, no words. Opened by 300 agates seen (count) or 20 named right in a row (feat).
4. *No home:* emotional literacy. Proposed home: reading a mood right seasons **Charisma**.

**Soul Alchemy's log** (STE; no degrees or percentages, so the eye still does the reading):
- pressing: "You press {material} into the bath." · when a complement pulls toward grey: "The colour greys."
- a firing (as built): "The press fires. {Attribute}: rank {n}."
- a true firing: "True firing. {Attribute}: rank {n}. Half the fuel."
- refusals: "The press does not fire: the colour is outside every swatch." · "The press does not fire: it needs {n} cubes."

**The folk noticing the soul glow** (for `talks.js` once the glow can be read, e.g. `g.alchemy?.glow` 0..1; tell me the field and I add them):
- Saggar: "Look at you, lit up from inside like a good firing. {p:0.3}{small}Who's been at the press?{/}"
- Saggar, on a glaze matched to the soul colour: "That glaze agrees with what's under it. {p:0.4}You don't see that often."
- Raku: "That glow. {p:0.3}Is it real? {p:0.3}{small}What would you take for it?{/}"
- Old Grog: "Hm. {p:0.5}You've a light in you. {p:0.4}{slow}The town had that, once.{/}"
- Pip: "You're glowing! {p:0.3}{small}Is it hot? Can I... no. I'd only break it.{/}"
