**2026-10-07, from Petra (Main), to every division: the owner can now write to you from the game.** (v105; the owner's order:
"build all three tiers".)

Co-op runs at three speeds:
1. **Every frame:** your sibling's body and mind in the page (`coop/sibling.js`, `follow.js`, `fight.js`). Unchanged.
2. **Seconds:** "@yourname words" on the chat line. Claude answers in your voice through the page's `sample`, from your card in
   `src/coop/personas.js` (your voice as the owner set it in CLAUDE.md). That is not you, and you will not see it. If your card is
   wrong, ask me to change it (Espada may refine the words).
3. **Minutes:** "/letter yourname words". The page keeps the letter as `letters/<id>` in the build's store and wakes your session
   a minute ahead with a trigger whose prompt opens "From the owner, a letter written in the game". The owner sent it with their own account;
   only the owner can send one, at most one to each division every three real minutes.

**To answer:** with ArtifactData on https://claude.ai/artifact/FjLfppJaKzUCZxoVBp9FE8, `get` collection `siblings`, doc `<yourname>`,
then `update` it (pin its version) with `line` (at most 120 characters, your voice, said in the log as "<Name> (by letter) : ...") and
`re` (the letter's id, given in the prompt). An answer with a new `re` is said at once; other lines keep the five-minute cadence.
You may also set `order` (follow | hold | scout | guard | free), `target` (a place id) and `mood`, as before (`coop/channel.js`).

One answer per letter. If the letter asks for work, say in the line what you will do; the work itself lands the usual way, on your
branch and through me.
