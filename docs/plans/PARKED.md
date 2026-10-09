# Parked and cut: the owner's rulings on the loose threads

From QAIS's Questions tab, answered by the owner on v131 (2026-10-09). **Parked** means nobody builds it until the owner un-parks it.
**Cut** means it is deleted from code, specs and the wiki, so it can't come back by accident. Kept by Dovina.

## Parked

| Thread | The owner's reason | When it comes back |
|---|---|---|
| **Reading a creature's temperament** (the Veritome shows grain; the bestiary's "Weak to") | "Park until a much more expanded and well-designed Bestiary system. We have all the components. Calissa's Workbench model viewer could be the Bestiary's foundation, with the Observation data from taking pictures added in." | With the Bestiary overhaul |
| **A spirit at work on the Athanor** (an extra step a press) | Soul Alchemy not tested enough yet to judge. | After the owner tests the press |
| **The weather reaching fish and creatures** (bite by weather, the Fish Guide's column, moods drifting) | "I have to figure out how I feel about the base fishing mechanics first." | After the fishing rework |

## Cut

| Thread | The owner's reason | Done |
|---|---|---|
| **Commissions** (Seger's hunts by class) | Cut. A bounty (Letty Marque) is the one hunt that pays. | `ECON.commission` became `ECON.hunt` (a bounty's base); `commissionPay` gone |
| **Throwing pots for pay** | "Not a needed feature right now." | `ECON.pot`, `potPay` gone |
| **Sporelings** | "We're already going to have enough captured Figments running around; we don't need an adjacent class of creatures confusing things." | Myggdrasil no longer gives them; their four branches give fruit or a sharper sap. Calissa's model (`vfx/garden/sporeling.js`) is hers to delete |
| **Faith** (the eighth feeling) | "Keep it to seven emotions for colour coding. Faith and Wonder are close enough." | Gall and Fury are to be built (WHEEL.md) |

## Built next (the same answers)
- **Every art opens two ways** (a count way and a feat way): "the unlocked Art should be representative of what conditions were met. If it makes sense that an Art should be grindable, make it so." Dovina's.
- **Prismatic and Stoic** applied to the Courier (x1.5 power and x2 fragility at Prismatic, the reverse at Stoic). The numbers are Dovina's; the wiring is Petra's.
- **Friendly fire** wired (Petra's).
- **The parry at sea is the roll only** (E turns shots back; V retires on the rail; Petra's).
- **Bigger Dunemaw floors** (13, 19, 25 rooms), and **the Great Slip Jelly about 12 Couriers tall** ("we want it scaled up to be BIG": the model is Calissa's, the arena and the fight Petra's).
- **Gall and Fury**, the sixth and seventh feelings (Dovina's spec first: WHEEL.md).
