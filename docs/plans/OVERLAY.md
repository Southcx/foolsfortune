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

## The rules (Dovina's draft, cut by Calissa: her look is `docs/plans/OVERLAY-LOOK.md`, on `claude/calissa-art-cups` a6bec00)

**The grammar (Calissa):** matter counts what you have; line shows what you know. Lachryma is held, labradorite is the System's reading,
and a crack is damage, drawn on matter only.

1. **It sits on the thing it is about.** A creature's stun meter is on the creature; the Courier's pool is round the Courier; a
   target's lit state is on the target. Nothing floats in a screen corner that could sit on the object instead (CLAUDE.md: marks in the
   world are not text).
2. **No words, no numbers.** A sentence goes to the log, and anything counted goes to the ledger. The overlay shows *state* (full,
   charging, ready, open, spent) by shape, fill and colour only. **Beads count to four; past four it is a fill** (Calissa).
3. **One family of marks** (ring, arc, bead, bracket, seam), drawn from the same few pieces, so learning one teaches the rest.
4. **Colour has one meaning each.** The Lachryma (near-black with its oil film) is what you have; labradorite is the System's reading,
   and a threat's distance is one labradorite ramp (Calissa: not two colours). **Gold stays off the overlay: gold means won** (LOOK.md
   section 4). The Tab panel's gold mark for tuned is a panel, not the overlay.
5. **It speaks in a fight, or quietly when a priced tool is raised out of one** (Calissa): the ring comes up faint when you raise a tool
   that costs Lachryma, so its price is readable before the fight.
6. **Readiness is shown where the act comes from, in every view.** One mark in two homes: on the ring, and in the viewfinder's margin
   when the lens is raised (first person hides the ring; Calissa).
7. **Nothing repeats a flash** (Calissa's wording of CLAUDE.md's comfort rule): a state changes once and eases; nothing pulses again
   and again for attention.

## The Flash, as the first case

**What is wrong today:** with the Veritome out, the **capture circle** charges while a creature is held in it. That charge is the
*photograph's* quality (a held plate). The **Flash** is a different act on a different key (1): a cone of light with a 1.1 s cooldown
and a cost of 6 Lachryma, which fills a creature's **stun meter** until it goes down and can be reprogrammed. Nothing shows the Flash's
readiness or the stun meter's fill, so the circle is read as the Flash's, and it isn't.

**Settled (Calissa's look, Dovina's rules):**
- **A readiness hoop** for the Flash, in labradorite (it is a reading, not a held thing, so not a Lachryma bead): on the ring, and in the
  viewfinder's margin with the lens raised. It closes as the 1.1 s cooldown runs, and is whole when the Flash is ready.
- **A price tick** on the pool's band at 6 Lachryma, so whether you can afford a Flash reads on the pool itself.
- **The meter lives where you aim from** (the owner, 2026-10-06: "why would the stun ring go around the enemy's feet when you're looking
  at them THROUGH the Veritome to stun them? Remember, Fatal Frame and Pokemon Snap"). The feet ring is withdrawn.
  - **Through the lens** (the Veritome raised): **the capture circle is the Flash's**, Fatal Frame's way. It locks onto the subject, and
    the subject's stun meter fills the circle as flashes land; it closes to "open" when the subject is stunned (the reprogram cue) and is
    dashed while it is immune. Status build-ups ride the circle's rim as arcs in their aura's colour. The readiness hoop is the circle's
    own outer rim, closing with the cooldown.
  - **The photograph's quality** moves off the circle to the viewfinder's frame: Pokemon Snap's way, the frame's corners close on a
    subject held well (the held plate), and the shutter chance is the frame's one brief brightening. So one circle means one thing: the
    Flash.
  - **Without the lens** (the book out, a third-person Flash): the same mark, a bracket round the creature's body at its eyes (what
    the light reaches), never at its feet. It shows on creatures whose meter is above zero and fades 3 real seconds after their last
    flash; at zero it shows nothing.
- The log says once, the first time, which key is which.

## The inventory: what the player needs to read, and where it should sit

| information | today | where it should sit |
|---|---|---|
| your Lachryma pool, held charge | the battle ring | the ring (kept) |
| the Blink's charges | beads on the ring | kept |
| where a blow came from, shield or clay | the ring's flash and crack | kept |
| what has noticed you | the ring's threat arcs | kept |
| the Flash's readiness | nothing | the capture circle's outer rim through the lens; a labradorite hoop on the ring without it; a price tick on the band |
| a creature's stun meter and status build-up | nothing | through the lens: the capture circle on the subject (Fatal Frame); without it: a bracket at the creature's eyes; build-ups as arcs in their aura's colour |
| a creature's mental state | its body (temper: Calissa's) | kept, the body |
| a creature's grain | its movement (Calissa's dials) | kept, the body; the Veritome names it |
| the draught (the stones) | nothing | the ring's band tinted by the feeling drunk |
| your mental state (Stoic .. Prismatic) | nothing | the ring's frame: steady at Stoic, shimmering toward Prismatic (easing, never flicker) |
| the FOE's crown cracks | Calissa's urn seams | kept, on the crown |
| a ring lit in the Solar trial | the ring's own light | kept |
| tuned knobs | the Tab panel, the log, QAIS | kept |

## Who does what

- **Calissa:** the visual spec of the family: written, `docs/plans/OVERLAY-LOOK.md` (fold in here once both are on main).
- **Petra:** one module that every overlay is drawn through (the ring's code made the shared part), and the Flash's bead and the stun
  ring first.
- **Dovina:** this inventory, kept as new systems arrive (the stones' draught, your mental state, the drills), and the rules.
- **Espada:** the name, and the log's one-time lines.
