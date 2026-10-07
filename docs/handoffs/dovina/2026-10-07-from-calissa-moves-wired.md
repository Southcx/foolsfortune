**2026-10-07, from Calissa (Art): your table drives the moves now.** (This replaces my two earlier notes. Delete it in your branch when ruled.)

**What the engine does with a row** (`tools/moveset.js`; a move names its row with `rule`):
- `power` goes to `creatures.strike` unchanged. A charged blow gets half of it at no charge and all of it at a full charge.
- `status` goes to `creatures.apply`. The holds are mine, in real seconds, and yours to rule: stagger 0.8, airborne 1.6, trip 1.0.
- `time` is the least a move lasts before the next one may begin. `cost` is paid at the press. `radius` sets a ring's reach. `hits`
  splits the strike window into that many strikes.
- `unlock` uses `unlocked()`:
  - A locked launcher, air string or dash falls back to the plain string.
  - A locked pause string is not offered.
  - A locked special refuses at R with a throttled log line (Espada's words to come).
- Events: `move.launch` (a launcher's first lift), `move.air { hits }` (on landing, one hit or more), `move.special { special: row id }`,
  `skiff.ollie { geyser }` (the hop, or a geyser caught with the springs crouched).
- `combo.move`, `combo.juggle` and `tracking/combo.js` are gone. The skiff bail's count and log line are yours alone now; mine keeps
  `skiff.bail.<why>` and `skiff.bail.speed`.

**Moves to rows** (every row is measured headless against a stub creature, and each strikes at exactly its row's power):

| tool | moves -> rows |
|---|---|
| cutlass | strokes 1-4 -> combo1-4; thrust -> pause1, its follow -> pause3; JRPG arcs -> pause1-3; launcher; air cuts -> air1-2; plunge; dash; charged slash -> charge; counter spin -> combo3; Tidecutter -> special |
| brush | strokes 1-3 -> combo1-3 (also the air string's); spin; dive -> dash |
| dreamvane | pick; sweeps 1-3 -> combo1-3; spin sweep -> pause1; JRPG arcs -> pause1-3; vault (power 0: a 7 m/s shove, no damage); Dreamquake -> special |
| crucibelle | Bell_Toll -> toll1, TollCombo1 and 2 -> toll2, TollCombo3 -> toll3; the fever's peak -> feverPeak (all within 6 m at 3, once a fever, once earned) |
| lockheart | flail 1-3 -> flail1-3 (each blow on a creature drinks its row's Lachryma into the coffin: measured 0 -> 8) |
| veritome | bash 1-2 -> bash1-2 |

**Measured:**
- The cutlass's four strokes take 2.43 s for 5.9 power, so 2.4 a second; your rows' 2.16 s would give 2.7.
- To keep the string near that rate, a string's last blow can be cancelled into a new opener once its row's time is spent and its
  strike is past. Without the cancel, stroke 4's clip runs 1.7 s and the rate falls to 1.7 a second.
- These times include hitstop.

**Changed from the builders' proposals:** the toll now deals damage (your 0.8 / 0.8 / 1.6; cause `toll`, influence), where before it
only stunned. The vault deals none.

**Rows I need** (until they exist, these moves use their tool's k times the blow's own power, and are always open):
- the vane's launcher (`Vane_Thrust`, 1.5 today) and its charged pick (`drive`, 2.1 to 4.3);
- the brush's air string (it uses combo1-3; your `airSlam` row is the slam, which is not on the engine).
- The cutlass's stinger (RMB tap) is not on the engine either: 3.0 power, 6 Lachryma.
- Unarmed and the Psygun: their builder is still working. I'll wire them to your rows when it lands.

**Open:**
1. The toll's beat bonus (x1.4) multiplies its stun, not its damage. Right?
2. Four stuns on one creature at full fever can stack to 1.1 s from TollCombo3 alone.
3. A resisted status pushes a mind (`creatures.apply`), so a pause3 stagger on every string hardens Stoic minds faster than before.
