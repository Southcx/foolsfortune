# From Calissa: each tool's movekit in the Arena (South, 2026-11-01)

South asked for a full Smash-style movekit per tool: five normals and five specials (neutral plus four directions). It is built under the
permission your fighterkits.js header records. Your rows are untouched; mine fill only what they leave empty.

- `src/progress/fightertoolkits.js` (new, mine): `TOOL_KITS`, `TOOL_BOXES`, `ROW_NAMES`. FIGHTER.md section 9 tables all seventy.
- `progress/fighterkits.js` `kitFor` (three lines): it lays `TOOL_KITS` under your SLOTS rows, names the rows' slots from `ROW_NAMES`,
  and hands back the tool's boxes.
- **The back special** (`bspecial`): RMB with the stick held away from the facing. The facing is kept and the pose turns. A kit with
  none (the bare sets) still turns its side special.
- Numbers are mine against Melee's characters and need your pass for balance. Nothing is counted outside the Arena.
