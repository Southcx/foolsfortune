# Telegraphs: the vocabulary of attack mechanics (the owner, 2026-10-09)

Kept by Dovina (the vocabulary, the ladder, the numbers: `src/progress/combat/telegraphs.js`); the marks Calissa's (`src/vfx/`), the wiring
Petra's (`creatures.windup`, the timeline runner), the words Espada's. Research: `docs/plans/research/TELEGRAPHS.md` (sources).

> "Attack Telegraphs are tied to Divination and are visualized in Lachryma HUD colors. Character animation should be used to broadly
> indicate actions are about to happen (so that you don't *need* Attack Telegraphs), and Attack Telegraphs are represented on a
> spectrum of fidelity of information communicated ... We need to build out a proper vocabulary of attack mechanics and synergize them
> with the existing HUD."

**Prior art:**
- **FFXIV:** a fixed vocabulary of AoE shapes (circle, donut, cone, line, radial lines, puddles, homing), the cast bar, and head markers
  that say what to do (stack, spread, tankbuster, flare, limit-cut order). Telegraphs are hidden in harder content, so the vocabulary
  becomes something remembered. Taken: the shapes, and the answer drawn on the mark.
- **WildStar:** telegraphs as the centre of combat. The shape fills to its edge as the cast runs; colour says whose it is; there are
  colour-blind options. Taken: the fill as the clock.
- **Guild Wars 2:** red circles and dodging, and the critique "dancing on red circles". Its own guides say read the animation as well.
  The breakbar's three states. Taken: the warning. The body comes first.
- **WoW (11.1 on):** players asked for a clear outline and a distinct inside tint; frontals with soft edges are the named complaint.
  Blizzard now tests fights without addons. Taken: every mark has an edge, and the drawn area is the true area.
- **Monster Hunter:** no marks at all. Hand-keyed windups are long, and a windup is also the opening. Taken: the body is the base layer,
  and an answer read well is rewarded.
- **Into the Breach:** every enemy intent shown. **Accessibility guidelines** (Game Accessibility Guidelines, Xbox's): never colour
  alone, always a shape or pattern too. Taken: shape is the second channel, and every mark passes a greyscale test.
- **What no one has done** (as far as the research found): tie *seeing* telegraphs to a skill the player levels. That is ours:
  Divination.

## 1. The rule: the body first, the sense second

- **Every windup is readable with no mark at all.** Each creature's blow has a body tell, an animation broad enough to read: the
  rear, the scrape, the swell (Calissa's clips, `docs/AI.md`). A creature without one is a bug, not a hard creature.
- **A telegraph is what Divination adds** on top of the body: a mark on the ground or on the thing, in Lachryma's colours. It never
  replaces the tell, and the fight is always beatable without it.
- **Divination's level sets how much the mark says** (the fidelity ladder, section 2). **Perception** (a Soul Alchemy attribute,
  already built: `perception.notice`) sets **how early** it appears. Divination is what you understand; Perception is how soon you
  notice.
- **What already exists keeps its meaning:**
  - the parry mark (the Lachryma outline) means "answer this with the parry", always shown, never Divination's;
  - the resist mark means "it will refuse that";
  - the closing ring on a boss's part at sea (`vfx/closingring.js`) means "this part acts now".

  Telegraphs add to these and never wear them.

## 2. The fidelity ladder (Divination)

A telegraph says more as Divination rises. Each step adds a channel and never takes one away.

| step | Divination level | what the mark says | how it is drawn |
|---|---|---|---|
| 0. the body | 1 | "something is coming" | nothing but the animation (and the parry mark where it applies) |
| 1. **where** | 2 | the area it will cover | the shape's **edge**, in the Mind's ink (the parry mark's near-black with the schiller in it); no fill |
| 2. **when** | 8 | how long until it lands | a **fill** sweeping from the creature to the edge, landing on the strike frame (the fill is the clock) |
| 3. **what kind** | 20 | its damage type and the status it builds | the fill **tinted the type's colour** with the type's motif in it (shape redundancy), and the **status glyph** on the edge |
| 4. **how to answer** | 35 | what the player should do | the **answer glyph** on the mark: chevrons out, chevrons in, a sidestep, behind, look away, guard, bait (section 4) |

- **Why these levels:** the domain curve (`domains.js`) puts level 2 in the first minutes of using the Dreamvane or parrying, 8 within
  the first hour, 20 in about two and a half real hours of Divination's play, and 35 in about nine. The ladder is climbed in the slice,
  and the top step is a reward for someone who has paid attention, not a grind. These are first numbers; the ledger will say.
- **Divination is earned by reading.** A telegraphed blow that would have caught the Courier and did not (stepped out, parried, looked
  away) is Divination's: a source `windup.read { kind, how, by }`, with quality by how late the answer came (as the parry's is).
  Reading well is how you come to read more. The design law holds: skill skips grind.

## 3. The shapes (the vocabulary)

Every windup names one shape. The shape is the area as drawn, and **the drawn area is the true area**: the hit test and the mark read
the same numbers (`CASTS[id].area`, `creatures.windup`'s `area`).

| shape | `area.shape` | covers | example (the Great Slip Jelly, `greatjelly.js`) |
|---|---|---|---|
| **circle** | `circle` | a disc at a point | Wedge (surfaceSlam): under the Courier |
| **ring** | `out-in` / `ring` | a band between two radii; the centre safe | Throwing Rings (gelidRings): out, then back in |
| **cone** | `cone` | a sector from the body | Decant (brineCascade): 120° in front |
| **line** | `line` | a rectangle from the body | Shoulder Charge (brineLine): the ram's lane |
| **lunge** | `lunge` | a short line at a target, to the body's reach | Lidfall (crownBash) |
| **baited** | `baited` | marks that follow the Courier and drop where they stand | Slick Trail (oozeRain) |
| **floor** | `floor` | the whole floor does something (slides, floods); safe pockets marked | Centring, The Overflow |
| **gaze** | `gaze` | not an area: what looks at it is caught | Eye Cup (crownGlare) |
| **arena** | `raidwide` | everything; unavoidable, only lessened | Blowout, The Dunemaw Swallows |
| **adds** | `adds` / `split` | not an area: things that must die in time | Broodwake, Sherds |
| **tracked** | `tracked` | a shape that follows its target until it locks | (none yet: a homing spit) |
| **left** | `left` | ground left behind that harms for a while | Slick Trail's puddles |

- **Drawn where:** an area shape on the ground, conforming to it (the paint map's decal path, never a flat disc floating over a slope).
  Gaze, adds and arena have no ground: gaze puts the **eye glyph** on the creature; adds put the **target glyph** over each add; arena
  marks the **arena's rim** (a ring of the type's colour running round the bowl's edge, never a screen effect).
- **Several at once:** at most six telegraphs drawn; overlapping areas of one cast merge into one edge. Telegraphs are never culled by
  distance or by the effect budget before other effects are.

## 4. The glyphs Calissa draws (no words, no numbers: world marks)

**Answer glyphs** (step 4): chevrons and marks on the telegraph's edge, in the icons' hand (a light shape keylined dark).

| answer | glyph | used for |
|---|---|---|
| **get out** | chevrons on the edge pointing outward | circle, cone, line |
| **get in** | chevrons pointing inward, at the safe centre | ring (the second half of out-in) |
| **sidestep** | two chevrons across the line, either side | line, lunge |
| **behind** | a curved arrow round the body's back | cone |
| **look away** | the eye (Charybdis's eye family), on the creature | gaze |
| **guard** | the guard's mark (a brace) on the arena rim | arena (lessened by the guard) |
| **parry** | nothing new: the parry mark already says it | any parryable windup |
| **bait** | a crack glyph on what it should hit (a pillar) | the ram into a pillar |
| **kill first** | the target glyph over each add, with a pip a second left | adds, split |
| **high ground** | an up-chevron on each safe island | floor |

**Status glyphs** (step 3): one small glyph for each status the blow builds, on the edge where the fill will land. Drawn from that
status's aura motif (`aura.<status>`): stun, doubt, charm, blind, confusion, slow, halt, sleep, and the fight's own (`soaked`: the next
hit doubled).

**The caution edge:** at step 1 an area whose size is not yet known (a tracked shape before it locks) is drawn with a broken edge, a
dashed ring, so partial information is honest: "here, size unknown" (FFXIV's caution marker).

## 5. Colours: Lachryma's, and never colour alone

- **Step 1 to 2:** the Mind's ink (near-black, the schiller creeping through it), the parry mark's and the closing ring's family. The
  telegraph is Lachryma's sense of the blow, not a game's red.
- **Step 3 on:** the fill takes the **damage type's colour** (its damage look, `damage.<type>`) and the type's **motif** as its pattern.
  A colour always comes with a shape or pattern; every mark is checked in greyscale and with a protanopia filter before it ships.
- **Harm is never orange alone.** There is no "danger colour"; danger is the edge and the fill. A friendly area (a sibling's, a
  spirit's) never wears an edge of ink: friendly marks are the Courier's own draught colour, outline only, and never filled.

## 6. The rules (each from a critique in the research)

1. **The fill lands on the strike frame,** never before and never after. There is no hidden snapshot: what you see when the fill
   reaches the edge is what is hit.
2. **The edge is crisp and the inside tinted.** No soft-edged cones.
3. **One mark, one meaning.** The parry mark answers, the resist mark refuses, a telegraph shows an area. None wears another's look.
4. **The body is enough.** Every creature's tell is tested with telegraphs off (Divination 1), from the front and the side.
5. **Hidden only where taught.** A fight may withhold a telegraph (an "omen-less" cast) only after an earlier room has taught that
   cast with one. Never as a surprise.
6. **A windup read well opens the creature.** Monster Hunter's rule: the answer is also the opening (the ram into the pillar cracks
   the crown; the gaze turned back stuns it). A telegraph that shows only how to survive and never where to strike is half a word.
7. **No telegraph on the Courier's own screen edge.** It sits on the ground or on the thing (CLAUDE.md, "Marks in the world").
8. **The rail keeps its own** for now (the Emocean's crossing is in flux). Its closing ring is the same family, and joins this ladder
   when the rail is settled.

## 7. The data (`src/progress/combat/telegraphs.js`, Dovina's)

```js
TELEGRAPH.steps = [{ id: 'where', at: 2 }, { id: 'when', at: 8 }, { id: 'kind', at: 20 }, { id: 'answer', at: 35 }];
stepsAt(level) -> ['where', 'when', ...]                 // what a Divination level shows
SHAPES[shape] = { answer, ground: bool }                 // the default answer glyph a shape wears
markOf(windup, level) -> { shape, edge, fill, type, status, answer } | null   // what to draw, for Calissa's mark
```

`creatures.windup(c, { ..., area, type, status, answer })` gains the four fields (Petra). A cast's `area` already carries its shape;
A cast's `mark` (`greatjelly.js` CASTS: `{ type, status, answer }`) gives the rest; `answer` defaults from the shape and a cast may
override it (Lidfall: `parry`).

## 8. Who builds what, in order

1. **Dovina (done with this):** the vocabulary, the ladder, `telegraphs.js`, the glossary's entry, the Great Slip Jelly's casts given
   `type`, `status` and `answer`.
2. **Calissa:** the telegraph mark (`vfx/` — the edge, the fill, the caution edge, the merge), the answer glyphs and status glyphs
   (section 4), the arena rim ring. A workbench stage showing every shape at every step.
3. **Petra:** `creatures.windup` carries `area`, `type`, `status`, `answer`; the timeline runner passes each cast's; the mark drawn
   at `markOf(w, game.psyche.level('divination'))`; Perception's lead (`shownEta`) applies to the telegraph as it does to the parry
   mark; the `windup.read` event.
4. **Dovina:** Divination's `windup.read` source in `domains.js`, once the event exists; the ledger counts (`windup.read.<how>`).
5. **Espada:** the log line when a step is reached, and the steps' names in the Codex's Divination page.

## 9. Open

- No art or knack shows a step early: Divination is the only way. In DEBUG, the lend panel's `telegraphs` row shows every step, for
  testing the marks.
- Creatures other than the Great Slip Jelly carry their windups' shapes as each is next touched (slip jellies: `circle`; clapperjars:
  `lunge`).
