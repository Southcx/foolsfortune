# The bracelet (working name; Espada's and the owner's to rule)

> The owner, 2026-10-13 (through Calissa): "the more I think about it the cooler it sounds as a modifier for Godhand abilities... as well
> as ties in a line of thinking I had about 'Rings' and 'Halos' and 'Aura' a long time ago. 'Bracelet' is a great consolidation of all of
> them, and can also be visualized as a 'Choker' around the Pneuka Jar."

**What it is.** One ring, worn by the Vessoul in every form. On the god hand it is a bracelet at the wrist; on the Pneuka Jar a choker at
the neck; on the Courier a band at the wrist. It holds the **charms** that modify the hand's powers. Its glow is the hand's state, shown
on the thing and never said: a world mark.

**Prior art.** Vagrant Story's gem slots (a weapon's sockets take gems that bend it). Final Fantasy VII's support materia, linked in a
slot pair, which modifies the materia beside it ("All", "Quadra Magic"). Hollow Knight's charms (few notches, many charms, a build).
The house's own Possibilikeys (the Lockheart's TWIN, WIDE and ECHO), whose verbs the charms reuse, so a lesson learned on the Lockheart
carries to the hand.

## The decisions, with the reason for each

1. **Seven sockets, one for each domain, plus the clasp.**
   - Each socket is a band glazed in its domain's kiln glaze (Calissa's `DOMAIN_LOOK`).
   - A charm in a domain's socket bends only that domain's powers. So a build is a choice per domain, and the radar on the STATUS shelf
     shows what the bracelet can hold.
   - A domain's socket opens at level 30 of that domain.
   - **The clasp** holds one charm that bends every power. It opens at a total level of 350, about half of "The World".
   - At most eight charms are worn at once.
   - Why: across-all-arts charms would make one best charm. Per-domain sockets make eight small decisions, and they read on the ring
     itself.
2. **Earned, never bought: arts by achievement** (DESIGN.md section 22).
   - Each charm comes from an achievement, with a count way and a feat way.
   - Echo: a power used 200 times, or a power that hits five things at once.
   - Charms are knacks in form: switched on or off in their socket, never gating the skill.
   - The ramp (GODHAND.md section 11) still sets the numbers. A charm multiplies the ramp's value, and no charm loosens the walls (the
     ZoI, the mending, the epic's toll, rejection's notice).
3. **The charms: the Possibilikeys' verbs, and a few of the hand's own.** Numbers are drafts.

   | charm | does | costs |
   | --- | --- | --- |
   | TWIN | the power acts twice, a beat apart | x1.6 Lachryma |
   | WIDE | x1.5 reach and size | x1.5 Lachryma |
   | ECHO | the act repeats once where it ended, after 3 real seconds | x1.3 Lachryma |
   | QUIET | half of rejection's heat | x0.8 size |
   | THRIFT | half of the made matter's Lachryma | x0.8 rate |
   | LINGER | twice as long (rifts, wards, totems, statuses) | x1.3 Lachryma |
   | GENTLE | no harm to creatures (blows become knockbacks) | none (a choice) |

   Every charm has a cost, so it is a build, not a strict upgrade. TWIN, WIDE and ECHO are the Possibilikeys' own words.
4. **It shows on the Courier too, at the wrist.** Courier, hand and jar are one being, so they wear one ring. On the Courier it is shown
   only: the charms bend the hand's powers, never the tools.
5. **The halo and the aura: the ring's glow.** One glow is read four ways:
   - its brightness is how much of the pool a power is spending;
   - its colour is the glaze of the domain in use;
   - a slow red pulse is rejection's step (0 to 5);
   - a gold line is a charm triggering.
   This folds in the rings and halos already scattered through the game. The HUD's Lachryma ring, the reach dome and the jar's choker
   become one mark.
6. **The Lockheart and the Veritome stay the Courier's data tools.** The bracelet does not drain, read or catch. It bends what the hand
   does. The only overlap is the shared verbs. A charm never applies to a tool, and a Possibilikey never goes on the bracelet.

## The Overload's recoil (the owner's ruling, same day; built)

The vessel is "an open cup when putting things in, but a pressurized vessel when taking things out". An Overload let out of a Lockheart
takes the Caster's toll from the vessel: one toll for each unit of the coffin's power (full 1, brimming 2). A toll cracks the least
cracked part past the shield, and shatters the vessel when three parts are already cracked. The numbers are in
`tools/lockheart/table.js` (`OUTCOMES.nuke.recoil`), the code in `outcomes.js`, the event is `lockheart.recoil`, and the rule is in
`feedback/tracking/lockheart.js`. Draining itself never hurts the Courier. The look of the recoil (pressure, cracks) is Calissa's.

## Not built yet
The bracelet itself. Its look comes first (Calissa), then the sockets and charms as data in `progress/godpowers.js` (a `CHARMS` table and
`charmOf(id, socket)` folded into `rampOf`), the achievements, and the ring's glow as one mark. The owner rules on the shape before it is
built.
