# From Petra: every handoff note triaged (the deep clean, 2026-10-19)

Each note read against the repo: DONE, OBSOLETE, LIVE or UNSURE, with its evidence. The reader deletes (CLAUDE.md); Petra deleted the
ten in everyone/ marked DONE or OBSOLETE. Readers: delete yours marked DONE or OBSOLETE, or say why not.

---

Triaged against the repo at HEAD `a1a7250` (branch claude/fps-third-person-demo-8zp2kx; HEAD had moved to `0f37c4d` by the end with the same 53 notes). Nothing in the repo was edited.

**How many notes.** The brief said about 95. I found 84 when I began (HEAD `7ffdd20`), 87 once Petra's three "deep clean" lists to Calissa,
Dovina and Wanda landed (`9f4d868`), and **53 now**, because Wanda (`ec3fcee`), Dovina (`3896b07`) and Calissa (`041c975`) each deleted their
done notes while I worked. I read all 87. The tables and the per-note lines below cover the **53 that remain**. The 34 deleted since are in
the appendix with my verdict from before the deletion, so Petra can see whether each deletion was sound. (A fourth, uncommitted edit set from
someone else was in the working tree: `docs/GLOSSARY.md`, `scripts/connectome.mjs`. I did not touch it.)

Verdicts follow the brief. Two conventions:
- **DONE** on a note that asks nothing (an announcement or a ruling report) means: the facts it reports are in the repo, and nobody has to act.
- **OBSOLETE (rule)** means the ask is not done but is replaced by CLAUDE.md "Plain names until settled" (the owner, 2026-10-19): "No coined or lore
  word goes in until the owner calls the thing finalized; then Espada proposes the lore names and the owner rules." The note asked for
  coined or lore names now. Casebook rule 66 says an undone note leaves "with a line in the reader's reply saying why not": this report is
  that line. Espada's README can hold one line ("lore names for the caster shells, the god hand, the Raceway and the rod's fish wait for the owner to call them finalized").

## Summary (the 53 notes that remain)

| reader folder | DONE | OBSOLETE | LIVE | UNSURE | total |
|---|---:|---:|---:|---:|---:|
| calissa | 0 | 0 | 4 | 0 | 4 |
| dovina | 2 | 0 | 3 | 0 | 5 |
| espada | 6 | 11 | 3 | 1 | 21 |
| everyone | 9 | 1 | 4 | 0 | 14 |
| petra | 0 | 0 | 1 | 0 | 1 |
| wanda | 0 | 0 | 7 | 1 | 8 |
| **total** | **17** | **12** | **22** | **2** | **53** |

Deletable now with evidence: 17 DONE + 12 OBSOLETE = 29 of 53. (README.md files are standing lists, not handoffs: keep them, update them.)

As first read, before the three divisions' deletions (87 notes): DONE 44, OBSOLETE 12, LIVE 29, UNSURE 2. Of the 34 since deleted, I had 27 as
DONE; 3 are Petra's own deep-clean lists (done by their owners); 4 I held LIVE (two optional Wanda sounds, Dovina's paid-cut question, and the old-HUD
sweep lines, which Dovina has since fixed). See the appendix.

## The notes, by reader folder

Format: `path | verdict | evidence or what is left`. Paths are under `docs/handoffs/`.

### calissa

- calissa/2026-10-13-from-dovina-godhand.md | LIVE | Still stand-ins: `godhand/islandmatter.js` header ("looks are stand-ins ... Calissa's to dress"), `godhand/miracles.js` header (same), `matterarts.js:42` plain icosahedron ball, `arts.js` still draws unicode glyphs from `DOMAIN_GLAZE`; no god-hand dressing in `src/vfx/` beyond `releasecrack.js`. Landed parts: the bracelet look (`vfx/bracelet.js`, wired as `game.bracelets`), `DOMAIN_LOOK` (9e7df56), the renames (12671eb).
- calissa/2026-10-15-from-dovina-boardslide.md | LIVE | `skiff.js:501,727` hand the rider `grindTrick: 'board'`, but `courier/skiff/grabreach.js` handles only nose, tail and fifty (`GRIND_HANDS = { tail }`, lines 55, 94-100); no `'board'` in any rider file.
- calissa/2026-10-17-from-dovina-round6-rulings.md | LIVE | Item 1 built (`vfx/creaturetags.js` reads `readTag`; `READS` in `familiarity.js`). Item 2: the look reads `game.sight.waypoint` (`vfx/sight.js:567`), but the calibration surface (a plate, a Seal Book page, a charted room, calling `game.sight.calibrate`) is not drawn; only `/sight` exists (`progress/sight.js:67`). Item 3 is overtaken: a Shrine gate has one cradle (HANKO.md 6.6, the owner, 2026-10-19; `cradleSpots()` returns the threshold only).
- calissa/angling-after-melee.md | LIVE | The melee phases are built (MELEE-LOADOUT.md phase 6) but ANGLING.md phase 1 is not begun: no Shift + LMB in `angling/angler.js`, nothing emits `angle.release` (only `progress/domains.js:67` listens, dc1d580).

### dovina

- dovina/2026-10-08-from-calissa-mount-preview.md | DONE | 9e7df56 (2026-10-09): "angle is the cone's full width", read as half-angle by `courier/ship/mounts.js:27-29`; the other three numbers live in `MOUNT_LOOK` (`vfx/mountpreview.js:46`); the two sweep checks are in `scripts/sweeps/emocean.mjs:186-192`.
- dovina/2026-10-13-from-calissa-domain-look.md | LIVE | `DOMAIN_LOOK` is in (9e7df56) and used by the bracelet, icons and release crack, but `godhand/arts.js` and `feedback/codex/status.js` still import `DOMAIN_GLAZE` (`arts.js:25`, `status.js:18`) and `DOMAIN_GLAZE` is unshrunk (`progress/godpowers.js:57`). The note's `glazeTileUrl` clause is moot: Calissa's deep clean (041c975) removed that dead export; use `glazeTile(id)` or drop it.
- dovina/2026-10-17-from-calissa-open-emocean.md | LIVE | The owner wants an open-Emocean exploration module "on top of Crossings"; no plan for it exists (grep of `docs/plans/` finds none). Dovina's to plan or to rule out.
- dovina/README.md | LIVE | Standing backlog. "Planned, not built: a tunable Strawman" still unbuilt (DUNEMAW-SYSTEMS.md:49; BUILD.md "not built"; `world/testroom/strawmanstrings.js` is only the sparring lectern's attack strings, with no rig console for grain, affinities, poise or presets). Its first line (SLICE.md "E4 is next on Petra's side") is stale.
- dovina/casino-clarity-art-brief.md | DONE | Calissa's questions "answered 2026-10-15" (CASINO-CLARITY.md:91, c6792d8); every module it names exists (`ui/tablehud.js` 6187cc8, `seatplate`, `goalbar`, `tablebuttons`, `tabletip`, `scoreceremony` 6d1cab7, `howto.js` 45ebda2, `vfx/seatlook.js`, `tablemarks.js`). Archive or move rather than delete: seven `src/` comments cite it (`ui/reel.js`, `rollnum.js`, `seatplate.js`, `tablehud.js`, `tablehud.css.js`, `vfx/seatlook.js`, `tablemarks.js`).

### espada

- espada/2026-10-07-from-calissa-combo-skiff-lines.md | OBSOLETE (rule) | Strings are still the plain placeholders (`tools/moveset.js:387`, `tracking/skiff.js:14`, `tracking/heldstrikes.js:18,23,29`); plain English is the house register until finalised. The "names wanted" for the cutlass's moves became genre labels (`sondelassloadout.js`: Slash, Rising Slash, Hop Slash, Leap Strike).
- espada/2026-10-07-from-calissa-emote-lines.md | OBSOLETE (rule) | `courier/emotes.js` unchanged since fdf6a22; its lines are plain ("You bow."); chat commands must stay stable. Nothing to coin.
- espada/2026-10-07-from-dovina-garden-sweep.md | DONE | 4ff7da3 (2026-10-07): "Espada's garden words: THE SPIRIT GARDEN help page, the features as said, the drills"; "the Jar's hop" kept in the glossary's `hop` row.
- espada/2026-10-07-from-dovina-room-sweeps.md | LIVE | Concrete defects remain: `progress/combat/greatjelly.js:42` + `tracking/dunemaw.js:36` still say "readies The Dunemaw Swallows." (capital mid-sentence); `tracking/dunemaw.js:29` "You break a clutch. Fewer brood will wake." is still marked a placeholder; `tracking/dunemaw.js:26` "It drops <name>."; `world/emocean/stage.js:385` and `tracking.js:689` still say "Your Pneuka Jar is made whole". The Great Dunemaw's fight is in flux, so Espada may park the Dunemaw lines.
- espada/2026-10-07-from-petra-placeholder-words.md | OBSOLETE (rule) | The lines are all still in place and plain (`tracking/wells.js:26`, `world/well/dunemaw.js:359`, `tracking/place.js:22`); the help rows went in with 4ff7da3. Espada's README carries "the log's lines in the robotic register".
- espada/2026-10-08-from-calissa-choice-card.md | OBSOLETE (rule) | The mount labels were adopted from Espada's own clarity note (`progress/rail/mounts.js:28-34`); `STATE_WORDS` (`ui/choicecard.js:43`) and the keywords are CLARITY's plain genre words; the glossary now names "a choice card".
- espada/2026-10-08-from-calissa-silhouette-names.md | OBSOLETE (rule) | Informational; "if the log or bestiary ever names them". Nothing names them: the silhouette and the ambient geometry live in the workbench and the rail (in flux). Plain until finalised.
- espada/2026-10-08-from-calissa-veritome-memory.md | DONE | `tools/veritome/ui.js:65,68,133` now say MEMORY / THE MEMORY; `scripts/check.mjs:36` enforces. Strays: `npc/talks.js:149` Old Grog still says "film" (Espada's file), `ui.js:9` comment says THE FILM.
- espada/2026-10-08-from-dovina-rail-overhaul.md | DONE | 43b39e1 (2026-10-08): "Espada's words for the passage and the overhauled crossing" (the reckoning, the eyewall, the Drowned Light, the Purser's ...).
- espada/2026-10-09-from-calissa-lend-panel-words.md | LIVE | Two player lines still tell you to "set ALL ARTS to ON", a switch that is gone (`codex.js:120` "in place of the ALL ARTS switch"): `feedback/help/pages.js:59` and `world/basement/techwing.js:77`.
- espada/2026-10-10-from-calissa-idle-labels.md | OBSOLETE (rule) | `courier/anim/idlebreak.js:77-86` already hold the eight labels in CLARITY's form (a genre label, a verb-first line of at most eight words); no lore name wanted.
- espada/2026-10-11-from-calissa-gall-fury-fish.md | OBSOLETE (rule) | "Sour Grudge" and "Short Fuse" are coined names still in `angling/species.js:86,107`; the rod is being reworked (ANGLING.md phase 1 unbegun), so names wait for the owner to call the rod finalised.
- espada/2026-10-12-from-dovina-caster-shells.md | OBSOLETE (rule) | Asks for a hundred lore names; the shells keep their genre labels (CASTER-SHELLS.md "labels there are working genre words"). Lore names come when the owner calls the shells finalised.
- espada/2026-10-13-from-dovina-godhand.md | OBSOLETE (rule) | Asks for lore labels, achievement names, a base-material name and an antibody Figment name; the glossary still carries "base material (working name ...)", the miracles and powers keep placeholders. Wait for finalisation. (The Set and Portal log lines exist: `tracking/god.js:12`.)
- espada/2026-10-14-from-dovina-raceway-3.md | OBSOLETE (rule) | Names wanted for the cavern, trick combo, banked flare, grabs; the glossary lists them as "working name, Espada's to rule" and the rule keeps them plain.
- espada/2026-10-14-from-dovina-raceway-park.md | OBSOLETE (rule) | Same: the Gorge Run, the Coaster, the antlion are working names in the glossary.
- espada/2026-10-15-from-dovina-casino-phase2.md | LIVE | One stale string remains: Raku's title in `npc/people.js:29` is still "treasurer of the Weir" (he keeps Raku's Bazaar since 2026-10-15). Rest landed: terms in the glossary, Espada's casino words 1738fbb, croupier lines routed to `npc/talks.js` (LORE.md:739).
- espada/2026-10-16-from-dovina-neuralese-script.md | DONE | 272213b + 85adc8f (2026-10-17): the lexicon, particles, grammar and a speller (`npc/neuraleseroots.js`, `neuralesespelling.js` `cellsOf`, docs/NEURALESE.md); LORE.md:794 the abugida orthography; islands' dress ruled 2026-10-16 (glossary "an island's dress").
- espada/2026-10-17-from-calissa-neuralese-language.md | DONE | The root list with written forms is `npc/neuraleseroots.js` (124 roots) + `cellsOf` (272213b, 85adc8f); Calissa's glyphs read from it.
- espada/2026-10-17-from-dovina-hanko.md | DONE | Names and lore proposed at LORE.md:794-822; "cradle" ruled by the owner 2026-10-19, the rest "parked by Plain names until settled" (LORE.md:818); the Thai/Tamil hand is LORE.md:794.
- espada/README.md | UNSURE | Standing state dated 2026-10-07. Known stale: "Seger's talk when Seger stands" (commissions were cut 2026-10-09, `progress/econ/table.js:106`); LORE section 11's list has changed. Only Espada can say which to-dos are current; settle by Espada re-dating it.

### everyone

- everyone/2026-10-06-from-wanda-the-dunemaw-s-sound.md | LIVE | `dunemaw.beat` is emitted by nothing (only `vfx/cavekit.js:154` and DUNEMAW.md:78 mention it); no stalactite, place-reverb or Strawman sounds in `src/audio/` or `src/music/`; only the geyser sound exists (`audio/jelly.js:54`). Wanda's README still lists it. Cited by `docs/plans/DUNEMAW.md:126`.
- everyone/2026-10-07-from-dovina-haiku-subagents.md | DONE | In CLAUDE.md, Threads: "Subagents: the right model for the task".
- everyone/2026-10-07-from-petra-letters.md | DONE | Built and documented: `src/coop/letters.js` + `answer.js` (v105); the protocol is also in the prompt `letters.js` sends (line ~91). On deletion, fix the comment at `letters.js:9` that cites this note.
- everyone/2026-10-07-from-petra-round-robin.md | OBSOLETE | A recommendation to the owner, no ask of readers. Co-op built (`src/coop/`), the ghost built (`game.race.ghost`), Espada's proposals parked by the owner 2026-10-11 (3dd72c7, LORE.md:446); Wanda's two hook asks are tracked in petra-open.
- everyone/2026-10-07-from-petra-the-owners-order.md | DONE | BUILD.md:3 "The four rounds planned here are done; ... `unbuilt.mjs` lists 0"; docs trimmed (DOCS-CLEANUP.md, glossary slimmed 2026-10-08); co-op built.
- everyone/2026-10-07-from-petra-your-sibling.md | DONE | Siblings built (`coop/sibling.js:52` uses Wanda's `sfx.voiceAt`); Espada's party lines are 29b02ac.
- everyone/2026-10-07-from-wanda-round-robin.md | LIVE | `move.step { surface }` and an `acoustic` on each zone do not exist (no hits in `src/`); the third proposal (blows ringing the cue's chord) is not built either. Duplicates "Wanda's two asks" in petra-open. The owner's go-ahead is not on record.
- everyone/2026-10-08-from-dovina-clarity.md | LIVE | Landed: CLARITY.md, `scripts/clarity.mjs`, UI-AUDIT, slim glossary, the wiki, choice cards, keyword icons, mount preview, labels, the log rule, OST archive (07a2ea1), LOOK into ART. Left for Petra: the casebook split (`docs/CASEBOOK.md` is 3,866 lines; no `docs/archive/casebook/`), the HANDOFFS/CIRCUITS/ARCHITECTURE merges (files still exist), archiving built plans (SLICE, BUILD, SHRINES, TESTROOM, STRAWMAN, DUNES, PARRY still in `docs/plans/`), and `world/garden/hand.js:34,229` still uses `FEATURE_NAME` ('herb terrace', 'incense burner') instead of `FEATURES[id].name`.
- everyone/2026-10-08-from-dovina-test-lean.md | DONE | In CLAUDE.md, Scope: "Test lean".
- everyone/2026-10-08-from-dovina-training.md | DONE | All four divisions' replies are in TRAINING.md (sections 2-4, owners named per row); the knacks are built (`progress/knacks.js`).
- everyone/2026-10-11-from-petra-casebook-numbers.md | DONE | CLAUDE.md "A new rule is `NEW:<slug>`"; `scripts/casebook-number.mjs` exists.
- everyone/2026-10-12-from-petra-geometry-budget.md | DONE | ARCHITECTURE.md:120 (1,000,000 triangles) and `scripts/perf.mjs:28` (`tris: 1_000_000`, `calls: 450`).
- everyone/2026-10-12-from-petra-one-paint-surface.md | DONE | PAINT.md phases 1-3 built (2715754, 82aa071); the Paint Dive is in the glossary; wet depth is `T.tech.slip.wet`.
- everyone/2026-10-15-from-dovina-overlay.md | LIVE | The direction is in CLAUDE.md (Feedback) and Espada's working names are in the glossary. Left: Wanda's "sound column" of OVERLAY.md section 9 still has "?" cells (the pool, a cap on the pool, a ship's hits on the rail). Low weight.

### petra

- petra/2026-10-07-petra-open.md | LIVE | Petra's own standing list; most bullets still true (verified: no `music.scale` in `tools/crucibelle/`; no `move.step` or `acoustic` in `src/`; `game.emocean` 27 uses and `src/world/testroom/` still not renamed; `mindDrift`/`fishPull`/`signatureMult` have no callers and are parked by the owner in PARKED.md; the parry's three windows are 0.25 / 0.26 / 0.28). Stale bullet: "Grain is imported by nothing" (`vfx/creaturetags.js:47` imports `poles`). Plus the heap section dated today.

### wanda

- wanda/2026-10-07-from-dovina-garden-sound.md | LIVE | Done: the hand's brushes (`audio/spirits.js` `sculpt`, `garden.sculpt` in `cues.js:126`) and a cue by phase and draught (`music/garden.js`). Not done: water running and pooling, and rain inside the Jar by mental state; no garden water or rain sound in `src/audio/`.
- wanda/2026-10-08-from-calissa-garden-rain.md | LIVE | The data source for the item above (`game.realm.rainLook`, `waterworks.looks`, `garden.cascade`); still unused by any sound. Merge with the garden-sound note.
- wanda/2026-10-08-from-calissa-silhouette-sounds.md | UNSURE | The silhouette, rail rings and folded sea exist as looks, but the silhouette is only in the workbench (`workbench/swarmstage.js`; `crossinglook.js` has no silhouette) and no runtime event drives them; the rail is in flux. Settle by Petra or the owner saying whether they are to be wired into the crossing.
- wanda/2026-10-10-from-calissa-parry-window.md | LIVE | `parry.window` is emitted (`vfx/parrymark.js:173`) but no audio cue listens (`audio/cues.js` has no `parry.window`).
- wanda/2026-10-10-from-calissa-sibling-reform.md | LIVE | `sibling.reform` is emitted (`vfx/siblingshatter.js:256`) but nothing in `src/audio/` hears it (only `sibling.hit`, `cues.js:38`).
- wanda/2026-10-13-from-dovina-godhand.md | LIVE | `audio/cues.js` has no `god.*` entry; matter, miracles, epics and the 16 powers still use `sfx.thump` (`matterarts.js:120,142`, `arts.js:551`) or nothing; no Dissonance stack in the music.
- wanda/2026-10-17-from-petra-seal-stamp.md | LIVE | No `seal.set` / `seal.unset` / `seal.carve` listener in `src/audio/`; the stamp is silent.
- wanda/README.md | LIVE | Standing open list; most items open. Stale: the puzzle duel line (`vfx/duelview/beats.js:60` now calls `sfx.duelEvent`), the garden's brushes (done), and the Sondelass form-change sound (`sondelassFormChange` was removed as dead in ec3fcee).

## The LIVE notes: what remains, and for whom (22)

1. calissa/2026-10-13-from-dovina-godhand.md: Calissa dresses the god hand's stand-ins in one look (island matter, the matter ball, miracles and epics, the drawn sign, creations, each power's marks, the seven domain and 25 art icons on the bar).
2. calissa/2026-10-15-from-dovina-boardslide.md: Calissa adds the boardslide stance (rider straddling the rail, body turned with the board) for `grindTrick === 'board'` in `grabreach.js`.
3. calissa/2026-10-17-from-dovina-round6-rulings.md: Calissa draws the Sight's calibration surface (a plate, a Seal Book page, a charted room) calling `game.sight.calibrate`; item 3 of the note is overtaken and can be struck.
4. calissa/angling-after-melee.md: Calissa starts ANGLING.md phase 1 (rope rule, Shift + LMB, brace, the rod's bend, emit `angle.release`), Dovina's numbers.
5. dovina/2026-10-13-from-calissa-domain-look.md: Dovina switches `godhand/arts.js` and `codex/status.js` to `DOMAIN_LOOK` and shrinks `DOMAIN_GLAZE` (using `glazeTile`, since `glazeTileUrl` is gone).
6. dovina/2026-10-17-from-calissa-open-emocean.md: Dovina decides whether to plan an open-Emocean exploration module, then tells Calissa what to draw.
7. dovina/README.md: Dovina builds or drops the tunable Strawman and refreshes the stale first line.
8. espada/2026-10-07-from-dovina-room-sweeps.md: Espada fixes the mid-sentence "The Dunemaw Swallows", the clutch line, "It drops <name>." and the "Your Pneuka Jar is made whole" lines (or parks the Dunemaw ones while the fight is in flux).
9. espada/2026-10-09-from-calissa-lend-panel-words.md: Espada rewrites the two "set ALL ARTS to ON" lines (`help/pages.js:59`, `techwing.js:77`) for the LENDS shelf; the files are Petra's, the strings Espada's.
10. espada/2026-10-15-from-dovina-casino-phase2.md: Espada (or Petra, as a string) changes Raku's title in `npc/people.js:29`.
11. everyone/2026-10-06-from-wanda-the-dunemaw-s-sound.md: Petra or Dovina emit `dunemaw.beat` once a cycle; Wanda builds the stalactite, place and Strawman sounds.
12. everyone/2026-10-07-from-wanda-round-robin.md: Petra builds `move.step { surface }` and a zone `acoustic`, Wanda then builds footsteps and reverb by place; the owner's go-ahead is needed.
13. everyone/2026-10-08-from-dovina-clarity.md: Petra does the casebook split, the HANDOFFS / CIRCUITS / ARCHITECTURE merges, archives the built plans, and points `hand.js` at `FEATURES[id].name`.
14. everyone/2026-10-15-from-dovina-overlay.md: Wanda fills the "?" sound cells in OVERLAY.md section 9.
15. petra/2026-10-07-petra-open.md: Petra works the whole list (the heap section is the deep clean's own).
16. wanda/2026-10-07-from-dovina-garden-sound.md: Wanda builds the garden's water and rain sounds.
17. wanda/2026-10-08-from-calissa-garden-rain.md: Wanda reads these values for the same sounds, then deletes both notes.
18. wanda/2026-10-10-from-calissa-parry-window.md: Wanda adds a small high ting on `parry.window` in `audio/cues.js`.
19. wanda/2026-10-10-from-calissa-sibling-reform.md: Wanda sounds the shards' return and the clink on `sibling.reform`.
20. wanda/2026-10-13-from-dovina-godhand.md: Wanda sounds the god hand's matter, miracles, epics and powers, with a Dissonance stack under its cue.
21. wanda/2026-10-17-from-petra-seal-stamp.md: Wanda gives the seal's stamp and lift a sound on `seal.set` / `seal.unset`.
22. wanda/README.md: Wanda updates her open list (duel and brushes done) and keeps the rest.

UNSURE (2): espada/README.md (Espada must re-date it), wanda/2026-10-08-from-calissa-silhouette-sounds.md (Petra or the owner must say whether the shoal silhouette and rail rings are to be wired into the crossing).

## Appendix: deleted while I worked (34), with my verdict before the deletion

Wanda, `ec3fcee` (11): rail-overhaul DONE (34110b4); caster-shells DONE (`audio/shellparts.js`; RYNO / Fool / Stop-Motion / Thirteen moments remain in her README); raceway-2 DONE (`cues.js:103-106`); raceway-3 DONE (`cues.js:45-56,100`); raceway-v198-notes DONE (4f48604); casino-clarity DONE and casino DONE (`audio/casino.js`, `music/casino.js`, `cues.js:85-97`); stun-depth DONE (`cues.js:95`); her deep-clean list DONE (ec3fcee). Two I had as LIVE-optional: **raceway-park** (the note said "if you want them"; the antlion's snap `raceway.pit`, the coaster rail, the bridge deck and the cavern's sandfall still have no sound) and **cylinder-events** (`shell.dry` still uncalled, `audio/psyguncylinder.js:5`; her README does not name the dry click). Both deletions are defensible; add one line to her README for each if she still wants them.

Dovina, `3896b07` (12): choice-card DONE; espada-clarity DONE; hightime DONE (informational); catalogue DONE (cb8b343); melee-loadout DONE; run-edges DONE; hanko-ruled DONE; round6-questions DONE; tags-veritome DONE; her deep-clean list DONE. Two I had as LIVE: **old-hud-retired** (the three sweep lines read the gone `#compass` / `#toolstrip`; 3896b07 edited `scripts/sweeps/garden.mjs`, `tools.mjs`, `emocean.mjs`, so it is now fixed: agree) and **sondelass** (all rows landed; one open question, whether the paid cut is earned: `moves.js:74` is still `paidCut: { cost: 5, unlock: always }` and no ruling is recorded; deleting it stands as "stays always", and one line in MELEE-LOADOUT-EARNING.md would say so).

Calissa, `041c975` (11): caster-shells (S1-S10: f3b3875, 60cb948), raceway (a9e560e, 1307b91), spine (2281173), casino-clarity (6187cc8, 6d1cab7, 45ebda2), overlay-scene (38ed0ff; ten modules use it), seal-picker (009a695, `main.js:956`), cradles (`ui/sealpicker.js:13`, `vfx/sealimprint.js:36`), cylinder-and-ring-hooks (76bfff1, `vfx/sondelassguard.js:228`), gate-overlay-pieces (86e938f, bdd60d8; `scripts/perf-baseline.json` 18d3879: calls 431 workshop / 85 well, 0 compiled late; programs 200 in ARCHITECTURE.md), tag-veritome-ruled (09f1bec, 05517bb; `vfx/creaturetags.js:43,395`), her deep-clean list: all DONE, agree with all eleven.

## Things to do when deleting (side findings)

- **Dangling citations.** `src/coop/letters.js:9` cites everyone/2026-10-07-from-petra-letters.md (fix the comment); `docs/plans/DUNEMAW.md:126` cites the Dunemaw sound note (LIVE, keep); seven `src/` comments cite dovina/casino-clarity-art-brief.md (archive it, or re-point them to CASINO-CLARITY.md).
- **A ruling nobody applied.** MELEE-LOADOUT-EARNING.md:97 rules the stinger's strike at its row's 3.0 ("one number in `cutlass.js` `stingStep`, Calissa's"); `tools/sondelass/cutlass.js:324` still strikes creatures at `2.2 * STING.power`. The note that tracked it (dovina catalogue) is deleted, so no note carries it now.
- **Retired word left.** `npc/talks.js:149` (Old Grog) still says "film"; `tools/veritome/ui.js:9` comment says THE FILM.
- **The glossary** says an encounter not yet met is "a Sighting", but `src/` has no such word (`git log -S'Sighting' -- src` is empty); not a note's job, but worth a look.
