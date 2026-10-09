# The DEBUG-MODE words (from Espada, 2026-10-09)

Your five asks from `docs/plans/DEBUG-MODE.md`. DEBUG chrome, so plain genre words (CLARITY): a label, one line of effect, no lore
names but the game's own terms. Strings for you to paste; the code is yours.

## 1. The lend panel (`LENDS`, `src/progress/lend.js`)

Each `opens` is one line, verb-free noun phrase, eight words or fewer; the label is the thing lent.

| key | label | opens |
| --- | --- | --- |
| arts | Movement Arts | Every Movement Art and variant. |
| godArts | God Arts | God Arts 2 to 5, wherever the hand reaches. |
| knacks | Knacks | Every knack, each still switched on or off. |
| moves | Tool Moves | Every tool's full moveset. |
| functions | Functions | Every Function known; all neuralese glossed. |
| shrines | Shrines | Every Shrine found, for fast travel. |
| garden | Spirit Garden | The garden at its top Firing. Attributes unchanged. |
| sea | Sea | Entropolis open; any ship sails without a rutter. |
| siblings | Siblings | All five siblings met. |
| feelings | Feelings | Gall and Fury known. |
| glazes | Glazes | Every glaze and kiln pattern firable. |
| codex | Codex | Every hidden entry shown. |

Changes from yours, with the reason:
- **Tool Moves**, "full moveset": "the moveset" is the glossary's word for the launcher, air string, dash attack, pause string and
  special; the list was the definition spelled out.
- **Spirit Garden**, not "Garden": the glossary's term in full. "Firing" stays as your plan has it (the word is unruled; if
  the owner renames it, this line follows).
- **Glazes**: "kiln look" is not a glossary word; a glaze and its kiln pattern are.
- **Functions**: "every neuralese word glossed" shortened; same meaning.

## 2. The log line (`feedback/tracking/qais.js`)

`Lend: {label} on.` / `Lend: {label} off.`

Verb first, the house's STE. "Lent" reads as past tense and as a loan returned; "Lend" is the switch's own word (`lendAll`, ALL
ARTS). If you want the panel's verb instead: `Unlock: {label} on.` reads worse. Keep "Lend".

## 3. The title's STORY button

`STORY (coming later)`

"not written yet" tells the player that writing is the work; "coming later" says only what they need. Label stays STORY.

## 4. The Codex's save line

- `DEBUG save` / `STORY save`: keep both; they are labels and they match the title's buttons.
- `from a preset` -> `Preset: {preset label}` when one was loaded, nothing when not. A label and its value, no sentence.

## 5. The first drink of Gall or Fury (`feedback/tracking/weather.js`)

`{Feeling} known. Refine it now.`

One fact, then what to do with it; the feeling capitalised as the five are. "You know ... now. You can ..." is two
sentences of filler round one fact. Same shape as the lend panel's "Gall and Fury known."

Delete this note when done.
