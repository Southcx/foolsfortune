# The progression spine: three audits

> The owner, 2026-10-13: "Let's see what you got for me with 1, 2, and 4": (1) too many things grow, and several multiply the same
> numbers; (2) the god powers open by domain level, against the design law "arts only by achievement"; (4) the vessel's damage has four
> sources and no one rule.

Dovina, 2026-10-13. A proposal for each audit, with what changes in code. Nothing is changed until the owner rules (the numbered asks).

## 1. Every track gets one job

**What I found.** Twelve tracks grow something. Four of them multiply the same kinds of number:
- **Reach and size:** the domains' WIDEN (blink reach, survey radius ...), the ramp (every god power's size), WIDE (a charm), and
  Visualization (an attribute: "the canvas the Soul Brush **and the hand** work on").
- **How long:** WIDEN's `ouranurgy.still` and `manifestation.span`, the ramp's `dur`, LINGER (a charm), and Focus (an attribute: how long a
  status holds).
- **The shield:** Willpower (an attribute), Thick Walls (a knack, +10%), the stones' pool size, and the mental state's fragility.
- **What things cost:** the ramp's `made` going to zero, THRIFT (a charm), the stones' `costMult`, and the miracles' ramped cost.

The domains alone have two tables for the one job. WIDEN (17 rows, linear in level) serves the tools and the old God Arts; RAMP (23 rows,
a 1.6 curve from where a power opens) serves the new powers. The same domain grows Telekinesis's weight one way and Scoop's carry
another.

**The proposal: one job a track, and nothing else.**

| track | its one job | how it grows | never touches |
| --- | --- | --- | --- |
| **The domains** (EXP, 1 to 99) | **magnitude**: how far, how big, how long, how many, of what you do | doing it, done well | the body, accuracy, what you can do |
| **Soul Alchemy's attributes** (ranks 0 to 10) | **the body's constants**: shield, mend, draw, notice, status hold, trade, a ship's bears | pressing and firing | the magnitude of a tool or a power |
| **Arts, god powers, knacks, moves, charms** | **what you can do**: verbs, behaviours, assists | achievements (a count way and a feat way) | magnitude, except a charm's, which is a trade |
| **The stones** | **how Lachryma comes in**: trades, never upgrades | found and bought | anything once it is in |
| **The mental state** | **the moment**: power against fragility | drinking, and quiet | anything that lasts |
| **Glazes, the base material, titles** | **who you are** | earned, fired, bought | any number at all |
| **Luck** | **chance** | the surprise lived through | any skill |
| **The standing** (achievement points) | **recognition** | achievements | any number |

**What that changes** (each is a numbered ask below):
- **1.1. One table for the domains: WIDEN folds into the ramp.** Each WIDEN row becomes a RAMP row that opens at 1 (at 99, the same value
  as now). One curve and one table, so the "endgame first" table in GODHAND.md 11 lists every magnitude a domain grows.
- **1.2. Visualization is the Soul Brush's ink only** (Lachryma per stroke: a body constant). The words "and the hand" go, because the hand's
  sizes are Manifestation's and Psychokinesis's.
- **1.3. Thick Walls (+10% shield) leaves the knacks**, because a knack is an assist and never a number. Either it becomes a stone's trade
  (more shield, slower regen), or it turns into an assist that shows the shield's last tenth so you know when the next hit cracks you.
  My pick: the assist.
- **1.4. Charms that touch magnitude stay, but only as trades.** WIDE, LINGER and THRIFT already cost Lachryma or size. The rule is written
  down so no charm is ever a straight upgrade.
- **1.5. A number's top is written down.** Each number lists the most every track can make of it at once (all 99, best charm, best
  attribute), in the ramp's table. So "the endgame first" covers the stack, not one track at a time.

## 2. The god powers open by achievement, not by level

**What I found.** The five God Arts of old (Telekinesis, Sunder, Swell, Wring, Manifest) open by goals in `progress/skills.js`: ledger
counts, with variants, on the Codex's GOD ARTS shelf. The 20 I added (the matter's verbs, the 16 powers, the seven epics) open by domain
level alone (`powerOpen`). A level is pure grind, which breaks the first law: "Skill skips grind; grind closes the gap."

**The proposal.** Each power becomes a `GOD_ARTS` row in `skills.js` (the same shelf, variants later) and opens by an achievement with
both ways:
- **the count way:** its domain at the level it opens at now (the grind closes the gap);
- **the feat way:** a skilled act of the same domain, possible before you have the power (skill skips the grind).

| power | count way | feat way (draft) |
| --- | --- | --- |
| Scoop, Shape, Carve | open from the start | (basic, like Telekinesis) |
| Sculpt | Manifestation 15 | manifest a 10 m wall |
| Set | Manifestation 35 | sculpt a creation of 20 m³ |
| Totem | Manifestation 60 | draw a miracle's sign scored 90 or better |
| Portal | Ouranurgy 15 | a grapple swing at a peak of 14 m/s |
| Hasten / Stay | Ouranurgy 15 | leave blade mode with 8 cuts |
| Fold | Ouranurgy 35 | a zandatsu |
| Strata | Divination 15 | a survey pulse that charts a quarter of new ground |
| Course | Divination 35 | strike a crystal's sweet spot ten times running |
| Read | Divination 60 | parry five windups running |
| Gust | Psychokinesis 15 | throw a thing at 25 m/s |
| Slab | Psychokinesis 35 | scoop 20 m³ in one stroke |
| Herd | Possession 15 | reprogram a mind with a held five-word macro |
| Take | Possession 35 | catch a Figment in the Warden's Lockheart |
| Muster | Possession 60 | reach wave 10 in a raid |
| Transmute | Alteration 15 | sunder three things with one stroke |
| Ward | Spellscription 15 | an inscription with three sigils |
| Stamp | Spellscription 35 | transcribe a Cogitomap |
| the seven epics | the domain at 80 | the feeling's miracle at its greatest size, its sign scored 95, at Dissonance Level 5 |

Each is a predicate over the ledger (the domain's `exp.<domain>` is already there), so it stays retroactive. The bracelet's sockets keep
opening at level 30, because a socket is capacity (a magnitude), not a verb.

## 4. One pressure model for the vessel

**What I found.** The vessel cracks five ways, under three rules:

| source | path | through the shield? | the crack | when it shatters |
| --- | --- | --- | --- | --- |
| a blow (jelly, wisp, foe, stalactite, fall) | `vesselDamage.hit`, k 0.3 to 1 | yes: the pool pays 35 Lachryma a full blow first | `k x 0.65` on the region struck | a region past 0.95, or all cracks past 3.6 |
| the Caster's toll (a tier IV shell) | `vesselDamage.toll` | no | the least cracked part set to at least 0.6 | three parts already cracked |
| the Overload's recoil | `toll`, once per unit of the coffin's power | no | as the toll | as the toll |
| an epic miracle | `jar.hit`, a quarter of the jar's strength | (the jar's own) | the jar's strength, not the vessel | the jar breaks (its own rule) |
| the mental state | a multiplier on the blow | n/a | x0.5 (Stoic) to x2 (Prismatic) | n/a |

There are two shatter rules, and the toll ignores how hard you let it out. The epic is paid in a different body, though the jar and the
Courier are one being. The owner's rule, "an open cup when putting things in, a pressurized vessel when taking things out", already covers
all of them.

**The proposal: two directions, one vessel.**
- **In (a blow from outside):** the cup is open. The pool cushions it first as the shield, then the region struck cracks. The mental state
  sets how hard a blow lands. Unchanged.
- **Out (power let out: a tier IV shell, an Overload, an epic, any later release):** the vessel is under pressure. A release has a
  **pressure**: how much Lachryma it lets out, over the **aperture**. The aperture is a number on **the stones**, the Maker's at 1: they are
  already "where Lachryma enters the vessel", and now they are where it leaves too. Each whole unit of pressure cracks the least cracked
  part, where the vessel is weakest. It never goes through the shield, because the shield is outside. Wide-aperture stones become a trade:
  safer releases, at a cost the stone names.
- **One shatter rule for both directions:** a region pushed past 1, or all the cracks past 3.6. The toll's "three parts" rule goes.
- **The epic is a release from the jar**, so it costs pressure on the one body, not a separate strength bar. The jar and the Courier are
  one being. Open question: whether raids' blows on the jar crack the vessel too (4.4).
- **One mend rule:** quiet mends (Resilience widens it), a finishing station mends at once for cubes, and a Shrine makes you whole after a
  shatter.

## 5. The asks

| # | ask | Dovina's pick |
| --- | --- | --- |
| 1.1 | WIDEN folds into the ramp: one table, one curve | yes |
| 1.2 | Visualization: the Soul Brush's ink only | yes |
| 1.3 | Thick Walls: an assist that shows the shield's last tenth (or a stone's trade) | the assist |
| 1.4 | A charm that touches magnitude is always a trade | yes |
| 1.5 | Every number's top, with every track stacked, is written in the ramp's table | yes |
| 2.1 | The 20 god powers and 7 epics become GOD_ARTS rows, each opened by a count way (the level) or a feat way | yes |
| 2.2 | The feats as drafted (tune any row) | as drafted |
| 4.1 | Two directions: blows through the shield, releases as pressure over the stones' aperture | yes |
| 4.2 | One shatter rule (a region past 1, or the sum past 3.6) | yes |
| 4.3 | An epic costs pressure on the vessel, not the jar's strength | yes |
| 4.4 | Raids' blows on the jar crack the vessel too | no: the jar's strength stays the raids' (the god hand's own fight) |
