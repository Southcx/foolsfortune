# Devil May Cry sword combat: reference notes

Scope: DMC3, DMC4, DMC5 (Bayonetta where it explains a shared technique). Research only; no repo files touched.
Caveat up front: I could not retrieve any DMC frame-data table, Capcom GDC/CEDEC talk on DMC5 combat animation, or the Famitsu original. Frame numbers below are absent on purpose. Several source pages returned 403/502/503 and are marked as such.

Tags: **[S]** = sourced with URL. **[U]** = unsourced common knowledge, stated for context.

---

## 1. Move structure: startup / active / recovery, cancels, switches, pause combo

- [U] Standard model: startup (before the hitbox), active (hitbox out), recovery (after hitbox until next actionable). Cancellable part is usually late recovery.
- [S] DMC5 Famitsu-derived report: the game "still reads inputs, but it won't simply skip through the animation of the previous action." Earlier entries were built around quick cancels. Source: Siliconera summary of the Famitsu interview, https://www.siliconera.com/devil-may-cry-5-devs-on-balancing-photorealism-with-action-the-mystery-3rd-hero-more/
- [S] Same source: DMC5 team aimed at "a consistent 60 fps for a high-speed battle feel."
- [S] DualShockers summary of the same interview: DMC4 "animations are canceled and connected in the same way as in fighting games"; DMC5 responds instantly but does not skip animation frames. https://www.dualshockers.com/devil-may-cry-5-info-famitsu/ (page returned 502 on fetch; quote is from search-result text, treat as secondary.)
- [S] Conflict to resolve before relying on it: one search summary (GameWatcher) says DMC5 would have move-cancelling with procedural animation smoothing. Other outlets say cancels were dropped. Primary Famitsu text not retrieved. Source of conflict: https://www.gameluster.com/capcom-boasts-devil-may-cry-5-apex-action-games/ and search results listing gamewatcher.com/news/devil-may-cry-5-more-details-announced.
- [S] Itsuno, GamesRadar video interview (via Engadget summary and search snippet): "On a micro level, the action is the same as a fighting game. From the number of frames for the button input to the number of frames for the hit itself on the enemy." Primary: https://gamesradar.com/devil-may-cry-4-interview-the-men-behind-the-mayhem/4 (search snippet only, not fetched).
- [S] Jump cancel, "Enemy Step" (Nero/Dante, DMC5 guide): "stopping the recovery frames of an aerial attack by jumping off an enemy." Timing: tap Jump "at the exact moment your attack hits an enemy." Pressing early "will cancel the hit frame of the move"; pressing late drops you. Exceptions: charged Devil Breaker attacks and detonations. Source: https://samurai-gamers.com/devil-may-cry-5/advanced-combat-techniques-guide/ (no frame numbers given).
- [S] Dante mid-combo Style change on the d-pad, with the left index finger; guns move to the middle finger. Same source above.
- [S] Style switching (a DMC4 mechanic) was carried into DMC3 Special Edition, per Capcom's announcement as reported. https://twinfinite.net/news/devil-may-cry-3-special-edition-will-borrow-dmc4s-style-switching-mechanic/ (search snippet only; no timing data.)
- [S] Dodge cancelling in Bayonetta 3 (same family of technique): "Player attacks can be canceled out by performing a dodge"; works on eight weapons, Demon Slave attacks and jumps. No frame numbers stated. https://www.svg.com/1090981/how-dodge-cancels-and-dodge-offsetting-work-in-bayonetta-3
- [S] Dodge offset (Bayonetta): hold the attack button most recently pressed in the combo while dodging; after the dodge, pressing attack continues the combo. No frame numbers. Same source.
- [S] Dodge offset is "extremely tricky to master" per a guide (secondary). Search result text: https://www.thegamer.com/bayonetta-3-expert-pro-tips/ (not fetched).
- [S] Royal Guard (DMC3): tapping Guard as an attack hits negates damage and charges the style's "Release" move. Guard at the end of a combo animation "resets the combo string to the beginning." No numbers. https://bordersdown.net/content/531-Devil-May-Cry-3-Advanced-Technique-Guide-Royal-Guard (fetch returned 403; quote from search-result text, unverified.)
- [S] DMC5 Royal Guard: timed blocks take no damage, fill the Royal Guard gauge, and allow a counter. https://www.gamewith.net/devil-may-cry-5/article/show/8163 (search snippet only.)
- [S] DMC3 Rebellion pause combo (Combo II): Triangle, a slight pause, then Triangle twice. Source: https://strategywiki.org/wiki/Devil_May_Cry_3:_Dante%27s_Awakening/Weapons_and_Upgrades (search snippet).
- [S] DMC5 Rebellion pause combo listed as "Death Coil - Y, Y, Pause Y, Y, Y." Source: same gamewith search results (search snippet only).
- [S] Pause branching concept: the pause is an input-branch window inside a string. Exact frame length of the pause: **not found**.
- [U] Reversals (Dante/Vergil "reversal" backflip-style cancels, DMC3 Judgement Cut-style reversals): common community term; no source retrieved.

## 2. Input: buffering, directional inputs, hold vs tap

- [S] Stinger (DMC3 Rebellion): R1 + forward + Triangle; High Time: R1 + back + Triangle. Dante dashes toward an enemy and stabs; High Time launches upward. Source: https://strategywiki.org/wiki/Devil_May_Cry_3:_Dante%27s_Awakening/Weapons_and_Upgrades (search snippet).
- [S] DMC5: High Time's blade warps into a scythe that launches enemies skyward; hold to follow the launched enemy. Source: https://www.gamewith.net/devil-may-cry-5/article/show/8163 (search snippet).
- [S] DMC5 Stinger-into-High-Time juggle: "stab with Stinger (Rebellion) and then High Time (Swordmaster Style) them into the air." Same source (search snippet).
- [S] Stinger is lock-on-aware in DMC5: after Stinger, release lock-on and hold attack (Million Stab), repeat-tap for damage. https://www.gamepressure.com/devil-may-cry-5/abilities/zac052 (search snippet; not verified in detail.)
- [S] Directional input is read relative to the locked target/facing; forward vs back changes the move. Source as above (Stinger/High Time pairs).
- [S] Itsuno: "The game should respond in a way that the player expects." "When you press a button, there should be a clear result on the screen." Source: https://kotaku.com/devil-may-cry-5s-director-tells-us-how-they-made-combat-1833642299
- [S] Itsuno: partial-success inputs. DMC4 was binary (success or failure); DMC5 gives a mistimed press partial charge to the next attack (Nero's MAX-Act sword revving). Same Kotaku source.
- [S] Nero Color Up: a melee slash during a held shoot button cancels the auto-release; "a specific window" exists, no duration given. https://samurai-gamers.com/devil-may-cry-5/advanced-combat-techniques-guide/
- [S] Dodge-offset input is "hold the last attack button, then dodge." Source: svg.com, above.
- [U] Input buffer lengths (often ~ a few frames of queued press) are not published for DMC. No source found.

## 3. Animation craft

- [S] Itsuno: "You need to know how a human moves and why they move that way." Walker: real punches show tension, and an action game needs that tension to feel good. Source: https://kotaku.com/devil-may-cry-5s-director-tells-us-how-they-made-combat-1833642299
- [S] Itsuno studied Super Street Fighter II Turbo and concluded animation was key to feel; Ryu's shoryuken shaped Dante's sword swings and Nero's Devil Breaker specials. Kotaku, above.
- [S] Itsuno: "photorealism combined with gaming animation can lead to, what I refer to as, an uncanny valley of action." Gematsu E3 2018 transcript: https://gematsu.com/2018/06/devil-may-cry-5-inside-xbox-e3-2018-special-gameplay-and-director-interview (fetch returned 502; quote from search-result text, verify before citing.) The Siliconera Famitsu summary (above) also uses the phrase "uncanny valley of action" and says game-style skipping "would look strange" with photoreal visuals.
- [S] Itsuno: "we put a lot of effort in to ensure that the game would still play with that tight Capcom play control." Gematsu E3 (see above, verify).
- [S] Weight vs responsiveness: adding weight to a turn "slows the response"; team struggled to keep both. Siliconera Famitsu summary.
- [S] Capcom 3D-scans real performers and clothing for DMC5. Siliconera Famitsu summary.
- [S] Platinum (Bayonetta) animator "Kai", 2009-05-08 post: "response and a sense of exhilaration" are the things to keep in mind for action animation; early prototype had punches "released in a single frame"; dance and ballet elements added to Bayonetta; mocap actors are "professional stuntmen and acrobats." Source: https://www.platinumgames.com/official-blog/article/1334
- [S] Platinum animator Uchi post: in-game dances built from a professional dancer's mocap, fingers hand-animated. Search snippet only, URL not fetched.
- [S] Platinum enemy-animation post by Eijiro (summary by Richard Mitchell): enemies show a tell before attacks; the tell's length sets tension vs difficulty. https://www.engadget.com/2009-05-19-bayonetta-and-the-importance-of-enemy-animation.html
- [S] Bayonetta: Platinum mocap "motion capture actors ... professional stuntmen and acrobats" as above.
- [U] Held end poses, exaggerated key poses, smears, and sword trails are standard action-animation craft; DMC uses trails. Specific DMC implementation not sourced.
- [S] Itsuno, DMC5 needed more unrealistic effects (flame trails from sword swings) than the RE7 engine gave; RE Engine was initially built for Resident Evil 7. Source: search result text from https://cgworld.jp/feature/201911-re2019-03.html (Japanese, not fetched; unverified).
- [S] Stinger root motion (lunge): DMC1 base Stinger "travels until it hits an enemy or reaches its maximum distance"; the player collision hitbox can end the rush. Source: https://intothebluesky.com/2019/03/27/devil-may-cry-files-01-stinger/ (fan analysis by BroadestOfSwords, not developer.)
- [S] DMC4 Devil Trigger Stinger: aftershock knocks enemies in travel direction; "drill-like" knockback; "extremely" quick, can slip under from a Helmbreaker. Same source.
- [S] DMC4 Stinger reference frames: none retrieved. The SuperCombo "Stinger 11 frames startup / 21 recovery" figure is for a Marvel vs Capcom Dante, **do not use for DMC**. https://archive.supercombo.gg/t/uses-for-all-of-dantes-moves/138000 (not verified.)
- [S] Returning to idle: "recovery flourish you can cut out of" is not sourced; standard action craft [U].

## 4. Impact: hit-stop, hit reactions, camera, screen effects, sound

- [S] Itsuno, on Famista: a brief hit-stop emphasized the bat-ball connection. He applied this to punches and kicks: stress impact with hit-stop even if the attack animation is only a few frames. Kotaku, above.
- [S] Itsuno: "When you press a button, there should be a clear result on the screen" and "It should be visual, audio. You need to hear it." Kotaku, above.
- [S] DMC5 music reacts to combo play so the same melody does not repeat; "players must do something flashy." Siliconera Famitsu summary.
- [S] Launch/juggle: Stinger hit then High Time launch (DMC5). Gamewith search snippet.
- [S] Hit-stop frame values: **not sourced**. No DMC or Platinum number found.
- [S] Attacker vs victim hit-stop: **not sourced**.
- [S] Knockback / stagger / juggle gravity values: **not sourced**.
- [S] Camera shake, screen effects: no DMC-specific source retrieved. Kotaku article is silent on camera. [U]
- [U] Sound sync: Itsuno's "You need to hear it" is the only sourced line; per-frame audio sync not sourced.

## 5. Named principles from developers

- [S] Itsuno, "uncanny valley of action": realistic visuals plus game-style animation feels off in combat (Gematsu E3 2018; see verify note).
- [S] Itsuno, "On a micro level, the action is the same as a fighting game" (GamesRadar, via search snippet).
- [S] Itsuno, "The game should respond in a way that the player expects." (Kotaku 2019.)
- [S] Itsuno, "stress impact by using a hit-stop" (article phrasing, Kotaku.)
- [S] Platinum (Kai, 2009): "response and a sense of exhilaration." (platinumgames.com/official-blog/article/1334)
- [S] Kamiya (ChinaJoy 2019, search snippet): action games need "special actions that will make players feel good when using it." Source: https://www.siliconera.com/2019/08/06/platinum-games-inaba-and-kamiya-on-approaching-bayonetta-and-action/ (fetch returned 403; snippet only.)
- [S] Inaba (GDC 2016, search snippet): "The purer the action game, the higher the need for a really original and unique main character." Same Siliconera URL (snippet).
- [S] Platinum designer Shibata post (blog 1630): "Anger (Emotion) -> Hit (Urge) -> Exhilaration (Emotion)." Emotion-after-urge model. https://www.platinumgames.com/official-blog/article/1630 (general design, not animation.)
- [U] Capcom RE Engine real-time mocap preview ("RE Preview", 2023): exists, postdates DMC5. https://www.docswell.com/s/CAPCOM_RandD/KLLR24-RE2023 (not fetched.)
- [S] No DMC5 GDC or CEDEC combat-animation talk was found. GDC 2019 Itsuno talk was about emotion-driven design: https://www.capcom.co.jp/ir/english/interview/2018/vol03.html (Okabe interview, search snippet.) Not the animation talk you asked for.

## Source status

- Fetched and read: Kotaku (Itsuno 2019), Siliconera Famitsu summary, platinumgames 1334 (Kai), platinumgames 1630 (Shibata), svg.com (Bayonetta 3 dodge), samurai-gamers (DMC5 advanced), engadget (Eijiro), intothebluesky (Stinger, DMC1 analysis).
- Failed to fetch (403/502/503): usgamer Itsuno interview, gematsu E3 (502; quote from snippet), dualshockers Famitsu (502), bordersdown (403), gamespot Kamiya (403), siliconera Inaba/Kamiya (403), breezewiki Stinger (Anubis block).
- Search snippet only: GamesRadar Itsuno (micro frames), gamewith DMC5 moves, strategywiki DMC3 Rebellion, gamepressure Million Stab, twinfinite DMC3 SE, thegamer Bayonetta dodge offset.
- No frame data for any DMC sword move was found. Do not invent frame numbers from these notes.

## What to take

1. Make the first 0.1 to 0.2 s of every sword move read as its result (clear visible and audible response), even when the animation's cut-in is slow. [S: Kotaku]
2. Stop cancels at the hit: a late-recovery window opens on contact, not on a timer, and a press during the windup queues the next move without skipping the previous move's full active frames (DMC5's "does not skip the animation" rule). [S: Siliconera Famitsu; S: samurai-gamers Enemy Step timing]
3. Give the sword a direction-dependent move set relative to the locked target (forward = lunge stab, back = upward launch), so one button yields a gap-closer or a juggle opener. [S: DMC3 Stinger/High Time pair]
4. Add a timed block with a reward meter and a counter (DMC3 Royal Guard, DMC5 timed guard filling a gauge), where a mistimed press still grants partial charge to the next attack (DMC5 MAX-Act revving). [S: gamewith; S: Kotaku]
5. Build a mid-string pause branch (press, short pause, press) so one string holds two outcomes; time the branch in your own frame counts, not borrowed ones. [S: strategywiki DMC3 Rebellion pause; S: gamewith DMC5 pause]
6. Use a hit-stop on impact only, scaled to the blow's weight, even on short animations. [S: Kotaku, Itsuno on Famista]
7. Exaggerate the lunge: a gap-closer travels until it hits or hits max range, and a player's own hitbox ends it early. Keep it as root motion rather than a teleport. [S: intothebluesky Stinger analysis, fan source]
8. Keep a dodge that holds the last attack input so the combo resumes after the dodge (dodge offset); test whether the same offset is worth it for your sword. [S: svg.com Bayonetta 3]
9. Animate the wind-up with tension (human-like anticipation), and keep character weight on turns from eating response time: the DMC5 team measured the trade and had to keep both. [S: Kotaku Walker tension; S: Siliconera Famitsu weight vs responsiveness]

## Counts

- Claims in this file: about 60.
- Sourced with a URL: about 52 (including snippet-only sources, which are flagged in the text).
- Unsourced [U]: about 8 (structure definitions, reversal term, input buffer lengths, camera shake, sound sync, DMC flame trails are weakly sourced, sword-trail craft generic, RE Preview date).
- Frame numbers stated: 0. None were retrievable for DMC.
