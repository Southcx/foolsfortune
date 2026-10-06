# The overlay: how the game tells the player things (the owner, 2026-10-06; a round-robin seed)

Opened by Dovina for Calissa (who owns the look and will write the visual spec here) and Petra (who builds it). The name "overlay" is a
placeholder for Espada's. Units: **real seconds**, metres.

> "That charging circle in photograph mode isn't functioning as an indicator for the 'Flash' attack. Coordinate with [Petra] and
> Calissa to determine how to improve the communication of the Flash mechanic and in general how information should be communicated to
> the player. I think we should really lean in to the current design language of the HUD ring around the Courier during battle and make
> a more formalized system spec out of it. I love the esoteric digital interfaces overlaid on 'physical' objects motif."

## The motif, named

**Esoteric digital interfaces laid over physical things.** The battle ring (`src/vfx/hudring.js`) is the model: a gauge drawn on the
ground round the Courier, made of the world's own matter (Lachryma in a labradorite frame), with no words and no numbers. It tells the
pool, the Blink's charges, where blows came from, and what has noticed you. The ask is to make that the rule for everything the player
needs to read, rather than a one-off.

Prior art: Zone of the Enders' ring radar; Dead Space's diegetic spine and holograms; Metroid Prime's visor (the interface as the lens
you look through); Serial Experiments Lain and .hack's esoteric UIs; Ghost in the Shell's and NieR: Automata's overlays on the world; and
Parasite Eve's and Vagrant Story's floor-borne wireframes.

## The rules (Dovina's draft, for Calissa and Petra to cut)

1. **It sits on the thing it is about.** A creature's stun meter is on the creature; the Courier's pool is round the Courier; a
   target's lit state is on the target. Nothing floats in a screen corner that could sit on the object instead (CLAUDE.md: marks in the
   world are not text).
2. **No words, no numbers.** A sentence goes to the log, and anything counted goes to the ledger. The overlay shows *state* (full,
   charging, ready, open, spent) by shape, fill and colour only.
3. **One family of marks.** Every overlay is drawn from the same few pieces, so learning one teaches the rest:
   - **a ring** (a gauge round its object);
   - **an arc** (a direction or a share);
   - **a bead** (a charge, set or spent);
   - **a bracket** (attention: what the overlay is about);
   - **a seam** (damage or a crack).
4. **Colour has one meaning each.**
   - **The Lachryma** (near-black with its oil film) is yours: what you have.
   - **Labradorite** is the mind's, and what is open to it.
   - **Copper** is a threat close by, **blue** one far off.
   - **Mirth's gold** means tuned (the Tab panel's; Calissa's ruling).

   A new overlay picks from these before it gets a colour of its own.
5. **It speaks only in a fight, or when you raise the tool** (the ring's rule today: online when the battle begins, faint when all is
   still). Out of a fight the world is clear.
6. **Readiness is always shown where the act comes from.** Anything with a cooldown, a charge or a cost shows its state on the thing
   that does it, at the moment you would use it.
7. **Nothing blinks** (CLAUDE.md, feel and comfort); state changes ease.

## The Flash, as the first case

**What is wrong today:** with the Veritome out, the **capture circle** charges while a creature is held in it. That charge is the
*photograph's* quality (a held plate). The **Flash** is a different act on a different key (1): a cone of light with a 1.1 s cooldown
and a cost of 6 Lachryma, which fills a creature's **stun meter** until it goes down and can be reprogrammed. Nothing shows the Flash's
readiness or the stun meter's fill, so the circle is read as the Flash's, and it isn't.

**Proposed (to be settled with Calissa and Petra):**
- **The Flash's readiness** sits on the lens and on the ring: a bead on the battle ring's frame, lit when the Flash is ready (the
  cooldown over and 6 Lachryma held), refilling as the cooldown runs. It follows rule 6, and it is the Blink's beads' language.
- **A creature's stun meter** sits on the creature, as a ring at its feet that fills with labradorite as flashes land and closes when
  it goes down (rule 1). The reprogram prompt is the closed ring.
- **The capture circle** stays the photograph's, and changes colour only for the photograph (its held plate, its shutter chance).
- The log says once, the first time, which key is which ("1 fires the Flash; the lens's circle is the photograph's").

## The inventory: what the player needs to read, and where it should sit

| information | today | where it should sit |
|---|---|---|
| your Lachryma pool, held charge | the battle ring | the ring (kept) |
| the Blink's charges | beads on the ring | kept |
| where a blow came from, shield or clay | the ring's flash and crack | kept |
| what has noticed you | the ring's threat arcs | kept |
| the Flash's readiness | nothing | a bead on the ring (above) |
| a creature's stun meter and status build-up | nothing on the creature | a ring at its feet: stun in labradorite, a status's build-up in its damage type's colour |
| a creature's mental state | its body (temper: Calissa's) | kept, the body |
| a creature's grain | its movement (Calissa's dials) | kept, the body; the Veritome names it |
| the draught (the stones) | nothing | the ring's band tinted by the feeling drunk |
| your mental state (Stoic .. Prismatic) | nothing | the ring's frame: steady at Stoic, shimmering toward Prismatic (easing, never flicker) |
| the FOE's crown cracks | Calissa's urn seams | kept, on the crown |
| a ring lit in the Solar trial | the ring's own light | kept |
| tuned knobs | the Tab panel, the log, QAIS | kept |

## Who does what

- **Calissa:** the visual spec of the family (the marks, their sizes, their colours, how each eases), written here as a section of her
  own.
- **Petra:** one module that every overlay is drawn through (the ring's code made the shared part), and the Flash's bead and the stun
  ring first.
- **Dovina:** this inventory, kept as new systems arrive (the stones' draught, your mental state, the drills), and the rules.
- **Espada:** the name, and the log's one-time lines.
