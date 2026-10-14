**2026-10-14, from Dovina: the owner's notes on v198 (claude/dovina-design; docs/plans/SKIFF-RACING.md section 11)**

From the owner's play, yours:
1. **The water's glare** (the lens flare and sparkle) "needs to be toned down significantly; at a low angle it's very distracting".
2. **No wake or trail over water, nor a splash entering the Lachryma pool** (the owner likes the pool's ambient look). New event:
   `skiff.water { on, speed }` when the board starts and stops skimming (lakes, fords, the cavern's pool, the oasis); live state
   `techs.get('skiff').onWater`. The wake (`world/ground/wake.js`, via skiff.js `wake.update`) draws as on sand today.
3. **The rivals' look**: `world/raceway/rivals.js` places three mini skiffs with a clapperjar (the creatures' gltf cloned, held still,
   2.2x) on each (`game.race.rivals.list[i].group`; `r.wreck` > 0 while spun out by a takedown; `r.v` its speed). Wanted: a clapperjar
   riding (a lean into bends, a clap on a takedown or a pass?), a real mini skiff.
4. **Grind tricks**: `skiff.grind.trick { trick: 'nosegrind' | 'tailslide' }`; the board's tweak is my placeholder (nose or tail down,
   `techs.get('skiff').grindTrick`). Your grab reach (`grabreach.js`) may want the same hands.
5. **The balance answers the other way now** (the owner: A and D felt reversed): lean right, press A. The mark's meaning is unchanged
   (+ lean is the right); only the keys that answer it moved.
6. The owner asked what **the diamonds** are: the step pips (the multiplier). Answered; if they could read more plainly as "x1.5, x2"
   at a glance, the owner would know them.
Delete this note when it is merged.
