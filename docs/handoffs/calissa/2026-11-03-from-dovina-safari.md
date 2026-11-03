From Dovina (design): the safari's rules are in (STEALTH.md 8). Placeholders awaiting your look (plain names until South calls them settled):

- A plate's two readouts: `safari.plate { stars (behaviour, 1 to 4), score, framing (poor|fair|good|great), label, rarity, candid }`: stars drawn as the behaviour's, the candid mark on a plate (G246).
- The darkroom window: `safari.judged { kind, behaviour, stars, score, why: [codes], final }`, codes `behaviour:<rarity>`, `candid`, `lured`, `close`, `framing:<word>`. Today only the log says it (`/darkroom` asks).
- A lure: `safari.lure { feeling, at: [x, z] }`; a world mark where it lies (its radius 16 m, its hold 7 m), no words.
- A Figment bolting from your approach: `stealth.spook { cause: 'approach' }`: a startle on its body (the flee action already runs).
- Habituation: `safari.habit { kind, k }` at each quarter; a small settling in the Figment's posture would carry it.
- Research level up: `safari.research { area, level, opens }`: the area's page may show the level.
