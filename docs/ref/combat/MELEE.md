# Super Smash Bros. Melee: sword animation, frame data and feel (reference for a sword moveset revamp)

Research only. No repo files were touched. Tags on each claim:
- **[F]** = the page was fetched and the number or statement is on it.
- **[S]** = seen only in a search-result snippet, not fetched. Treat as unverified.
- **[U]** = unsourced (common knowledge or no source found).

Several sources are old wiki revisions (ssbwiki Forward tilt is a May 2016 revision; Down tilt was last edited 2014). Community numbers vary by version. Where a number is missing, it is left out.

---

## 1. Marth frame data (Melee)

Frame counts are as listed on the pages. "Length" = animation length in frames. "Hitbox" = active frames as listed.

| Move | Hitbox (frames) | Length | IASA / interruptible / continuable | Landing lag (normal / L-cancelled) | Source |
|---|---|---|---|---|---|
| Jab 1 | not found for Melee | not found | not found | n/a | [U] (see note) |
| Jab 2 | 5-9 | 28 | IASA 27 | not found | [S] Smashboards "complete Marth hitboxes" thread, https://smashboards.com/threads/complete-marth-hitboxes-and-frame-data.285324/page-4 (fetch returned 403) |
| Forward tilt | 7-10 | 35 | not listed | n/a | [F] https://www.ssbwiki.com/Marth_(SSBM)/Forward_tilt (2016 revision) |
| Up tilt | early 6-8, clean 9-12 | 39 | interruptible from 32 | not listed | [F] https://www.ssbwiki.com/Marth_(SSBM)/Up_tilt |
| Down tilt | 7-9 | 49 | IASA 20, "not interruptible with shield" | not listed | [F] https://www.ssbwiki.com/Marth_(SSBM)/Down_tilt (last edited 2014) |
| Forward smash | 10-13 (charge frames 3-4) | 49 | IASA 48 | n/a | [F] https://www.ssbwiki.com/Marth_(SSBM)/Forward_smash ("a large amount of ending lag") |
| Up aerial | 5-8 | 45 | initial autocancel 1-4; late autocancel 27 onward | 15 / 7 | [F] https://www.ssbwiki.com/Marth_(SSBM)/Up_aerial |
| Neutral aerial | 6-7 and 15-21 | 49 | initial autocancel 1-5; late autocancel 25 onward; interruptible 50 | 15 / 7 | [F] https://www.ssbwiki.com/Marth_(SSBM)/Neutral_aerial |
| Forward aerial | 4-7 | 33 | autocancel from 27; interruptible 30 | 15 / 7 | [F] https://www.ssbwiki.com/Marth_(SSBM)/Forward_aerial |
| Dancing Blade, part 1 | 6-8 | 29 | continuable 7-25 (no IASA listed) | n/a | [F] https://www.ssbwiki.com/Marth_(SSBM)/Side_special |
| Dancing Blade, part 2 up | 12-15 | 40 | continuable 16-31 | n/a | [F] same page |
| Dancing Blade, part 2 side | 14-16 | 40 | continuable 16-32 | n/a | [F] same page |
| Dancing Blade, part 3 up | 13-17 | 40 | continuable 17-37 | n/a | [F] same page |
| Dancing Blade, part 3 side | 11-14 | 46 | continuable 15-36 | n/a | [F] same page |
| Dancing Blade, part 3 down | 15-18 | 46 | continuable 18-34 | n/a | [F] same page |
| Dancing Blade, part 4 | not extracted (page text cut off) | | | | [U] |

Notes on the table:
- Jab: no Melee jab figures were readable. The SRK Marth page (https://srk.shib.live/w/SSBM/Marth) has a Melee jab table, but the captured text was column-garbled (first active frame 4, active through 20, "recovery cancellable into Jab 2 after 11 frames"). Treat that as [S] and unreliable. A Project M 3.6 thread gives Jab 1 hitbox 4-7, link to Jab 2 at frame 20, first actionable 26, but that is not Melee [S] (https://smashboards.com/threads/marth-frame-data.356485/).
- Ultimate frame data (ultimateframedata.com/marth) shows different Jab numbers and is not Melee; do not use it.
- Down tilt's "IASA 20" is the only interruptible frame listed; the shield note matters for a shield-interrupt rule.
- Dancing Blade "continuable" windows are the wiki's term. It does not give IASA. The table above is the best available.
- Fair: the Marth character page says the forward aerial "has the least ending lag of all his aerials" and "7 frames of shield stun and 7 frames of endlag" [F] https://www.ssbwiki.com/Marth_(SSBM) (the character page, read via fetch of the main Marth page). Neutral aerial is described as having "the most hitbox frames of any normal move" [F] same page.
- Landing lag: "Empty landing lag" listed as 4 frames for both NTSC and PAL [F] same character page. The aerial pages give 15 normal and 7 L-cancelled.

---

## 2. The systems

### IASA, continuable windows, autocancel
- IASA = interruptible as soon as: the first frame an action can be interrupted by another action. [S] SRK Marth page definitions, https://srk.shib.live/w/SSBM/Marth (definitions block in search snippet). Landing lag = uninterruptible frames on landing [S] same.
- Autocancel windows: landing during the start or end of an aerial triggers normal landing instead of the aerial's landing lag. The wiki calls them "initial" and "late" windows; "almost all initial auto-cancel windows end before an aerial's hitbox comes out" [F] https://www.ssbwiki.com/Autocancel.
- Normal landing lag "tends to be around 2-6 frames depending on the character" [F] same.
- Melee changed L-cancel: it now only halves landing lag, which makes autocancel more useful; gravity was raised; autocancel windows are "far less lenient across the board" [F] same page.
- Example: Ness's down aerial autocancels while its hitbox is inactive, so it is frame-safe on shield if performed perfectly [F] same.

### L-cancelling
- Input L, R or Z up to 7 frames before landing [F] https://www.ssbwiki.com/L-cancel. Smash 64 window was 11 frames or fewer, with lag 4 [F] same.
- A successful L-cancel plays the landing animation at double speed, halving the lag (rounded down) [F] same.
- Autocancel supersedes L-cancel: an auto-cancelled aerial gets no L-cancel benefit [F] same.
- Only regular aerials can be L-cancelled; specials with landing lag cannot [S] (search summary of L-cancel sources; community consensus, not checked on a page).

### Jump-cancel and input buffer
- Melee has no general input buffer. Brawl was the first game with a universal buffer for basic actions [S] search summary of ssbwiki Buffering/Jump-cancel pages (https://www.ssbwiki.com/Buffering, https://www.ssbwiki.com/Jump_cancel), not fetched.
- In Melee, input too early = the character just jumps; input too late = stuck in the air longer [S] same source group, per SmashWiki.
- Exceptions: shield inputs pressed during hitlag are held until hitlag ends (which covers L-cancels). Some attack buffers exist [S] (SmashBoards "buffer mechanics in melee" thread, https://smashboards.com/threads/buffer-mechanics-in-melee.512821).
- Jab/tilts cannot be used during jump delay but grabs can; "it is unknown why" per the SmashWiki mirror [S].

### Hitlag
- Ultimate formula, [F] https://www.ssbwiki.com/Hitlag: floor(floor(floor((d x 0.65 + 6) x h x e x s) x p) x c). Terms: h = per-hitbox multiplier (default 1); e = electric (1.5 in Ultimate); s = shielding 0.67; p = player count; c = crouch-cancel. Ultimate is not Melee's formula.
- Melee: the base is floor(d/3 + 3) with multipliers, then capped at 20 frames [S] (ssbm_utils crate, https://docs.rs/crate/ssbm_utils/latest/source/src/calc/on_hit.rs, shows `((damage / 3.0) + 3.0).floor()`, further multipliers, cap at 20; SmashWiki Hitlag summary gives the Melee form floor(floor(floor(d/3+3) x e) x c), https://www.ssbwiki.com/Hitlag, [S]).
- Melee electric: applies to the victim only [F] (SmashWiki Hitlag page, "Electric (e): Victim only in Melee"). Crouch-cancel: Brawl onward [F] same.
- Melee cap: 20 frames [F] same page ("Melee: 20 frames").
- Hitlag applies to attacker and victim unless a source says otherwise. Exceptions listed on the wiki: electric in Melee (victim only), crouch-cancel (victim only before Ultimate), perfect shield (attacker suffers hitlag, defender none) [F] same.
- Worked example (18-damage move gives 9 hitlag before multipliers): [S] SmashBoards thread "official ask anyone frame things" (https://smashboards.com/threads/official-ask-anyone-frame-things-thread.313889/page-28) per search summary; the math is consistent with the formula above.
- Shield hitlag/shieldstun not electric-affected: [S] SmashBoards thread (same search, unverified).

### SDI, hitstun vs hitlag
- "During hitlag, defending characters are capable of performing smash directional influence" [F] https://www.ssbwiki.com/Hitlag (Ultimate page). The wiki says hitlag is "officially known as hitstun in Super Smash Bros. Ultimate" and that the community term refers to a different mechanic [F] same.
- Hitstun page exists (https://ssbwiki.com/Hitstun) but was not fetched. [S]

### Tipper and sourspot, disjoint, grab
- Tipper: the tip of the sword is the strongest hitbox; "tipper" can refer to any attack's sweetspot at the tip [S] https://www.ssbwiki.com/Tipper (search summary).
- Sourspot: close-range part of a hitbox, weaker [S] https://www.ssbwiki.com/sourspot (search summary).
- Marth's tipper and non-tipper hitboxes have very different knockback values and angles, so spacing is required knowledge [S] https://ssbwiki.com/Marth_(SSBB) or https://ssbwiki.com/Marth_(SSBM)/Up_special pages seen in search (not fetched).
- Disjoint longer than the animation suggests: [S] SmashWiki disjoint text in search summary.
- Community guide calls Marth "by far the best disjoint and grab of any top tier" [S] (https://sites.google.com/view/marthrd/fundamentals/spacing, search summary, not fetched).

---

## 3. Animation craft

### Startups (from the frame data above)
- Marth's listed first-hit frames: fair 4, uair 5, nair 6 (first hitbox 6-7), Dancing Blade part 1 6, ftilt 7, dtilt 7, fsmash 10. Jab 1 not found. [F] same pages.
- Speed of Marth's small moves relative to reach: fair has the least ending lag of his aerials [F] Marth page.

### How the arc is drawn (trail, sword arc)
- No source found for how Melee draws the sword trail or arc. [U]

### Interpolation / blending between animations
- No Melee-specific source found. The search turned up a Brawl note: Brawl interpolates to the last frame of animation to smooth transitions [S] (SmashBoards "possible brute force way to determine character animations" thread, search summary); and a rukaidata writeup on Brawl keyframe sampling, interpolating between previous and next keyframes [S] (https://github2.scsujunhua.workers.dev/rukai/rukaidata/blob/main/docs/writeup.md). Not checked for Melee.
- Melee decompilation exists (doldecomp/melee, https://github.com/doldecomp/melee) and is the place to check transition code. Not read. [S]

### Dancing Blade chaining and directional variants
- First hit has pseudo-jump properties. All attacks after the first can be directed up, side or down for different follow-ups [F] https://www.ssbwiki.com/Marth_(SSBM)/Side_special.
- Each part has a hitbox window and a continuable window (table above) [F] same page. The windows are the timing gates: input inside the continuable window continues the chain; outside it, the chain ends.
- Dancing Blade has no IASA listed [F] same.

### Poses that read
- No source found on Marth's end poses reading well. [U]

### Held poses, squash and stretch, follow-through
- No Melee-specific source. See Sakurai section (his claims are about Ultimate and general practice, not Melee frame data).

---

## 4. Sakurai's own teaching

Note: I could not get direct YouTube URLs from the fetches (the amara subtitle file returned 403). Titles and dates come from search results and the GoNintendo/Gameranx write-ups. Episode numbers are from listings.

- **"Making Lead-ins Instant and Impactful [Animation]"** (about 2:27 long). Sakurai calls the first part of an attack animation the lead-in; "there's a lot of thought and craftsmanship that goes into them." Some attacks have little or no lead-in because the motion is immediate. Source: https://www.gonintendo.com/contents/13757-sakurai-details-the-process-of-making-snappy-attack-animations [F for the lead-in quote; the video itself not fetched]. Video URL: [U] (not found; channel is Masahiro Sakurai's YouTube channel).
- **"Always follow through" / follow-through video** (published 22 Feb 2023 per GoNintendo). Follow-through = recovery after an animation such as an attack; "the timing and direction of these moments can really dial up the impact in your game!" Source: https://gonintendo.com/contents/16610-sakurai-s-latest-game-dev-video-discusses-follow-through-animations [F].
- **"Damage Animations [Animation]"** (E87, aired 29 Aug 2023 per search listing, https://episodecalendar.com/ru/show/masahiro-sakurai-on-creating-games/season/2023 [S]); coverage: GoNintendo https://www.gonintendo.com/contents/25030-masahiro-sakurai-latest-video-talks-about-damage-animation [S, not fetched]. Brawl hit animations: at least 12 per character, other fighting games reuse across characters [S] (https://gameranx.com/updates/id/474375/article/masahiro-sakurai-reveals-insane-details-put-into-hit-animations-for-smash-bros/).
- **"Hit marks"** (Effects category, 25 Jul 2023): feedback when a character attacks or gets hit matters most in games with a pulled-back camera [F] https://www.gonintendo.com/contents/23556-masahiro-sakurai-discusses-hit-marks-in-his-latest-dev-video. Does not discuss hit stop or impact frames on the page.
- **"Breaking Down Attack Animations"** (Ep. 36, 11 Nov 2022, about 4 min, stance / attack / follow-through): [S] Japanese listing description via search. The exact title was not confirmed. No fetch.
- **"Too Much is Just Right"** (Ep. 28, over-the-top animation in 3D; Kazuya in Ultimate; "no such thing as too far"): [S] Fighters Generation summary, https://fightersgeneration.com/news1/tekken-oct22.htm. Title not confirmed on a page.
- **Four-phase framework (Standby, Windup, Strike, Follow-Through)**: [S] fan subtitle file of a Sakurai video, "How to Animate a Smash Bros Attack" (https://amara.org/subtitles/I8Bnr4dEmv1u/en/1/download/How%20to%20Animate%20a%20Smash%20Bros%20Attack%20%20LINK.en.txt, 403 when fetched). Treat the phase names as secondhand; the source is a subtitle track, not a checked transcript.
- **Hit stop, held poses, squash and stretch**: [U] no Sakurai source on these was reached.

---

## 5. What the Melee community names as why Marth feels elegant

- Long disjoint from sword reach. [S] (SmashWiki disjoint text; Marth guide, https://sites.google.com/view/marthrd/fundamentals/spacing).
- Tipper: the tip is the strong hitbox; sourspot is weak. Spacing is the skill. [S] (https://www.ssbwiki.com/Tipper; https://www.ssbwiki.com/sourspot).
- Grab range: "by far the best disjoint and grab of any top tier" [S] (Marth guide above).
- Low ending lag on the forward aerial: "least ending lag of all his aerials", 7 frames endlag [F] (Marth page).
- Reach-to-lag ratio: no explicit source for the phrase; the frame data above (short Fair, short-startup Ftilt/Dtilt) fits it. [U] as a named concept.
- "Elegance" as a term: not defined in any source found. [U]
- Swing arc consistency: no source found. [U]

---

## 6. What to take (for a sword moveset)

1. Give the sword's tip the strongest hitbox and the hilt side a weaker "sourspot" with lower knockback, so spacing is the skill, not the animation length (sourced: [S] SmashWiki Tipper and sourspot pages).
2. Keep the cheapest landing on the forward aerial: a short endlag (7 frames in Melee) after the hit, and a "least ending lag" rule for the fair-type move (sourced: [F] Marth page).
3. Make landing lag a halved modifier: a timed press before landing halves it and an autocancel window removes it, not a separate move (sourced: [F] L-cancel and Autocancel pages).
4. Set an IASA frame on every normal and let it be interruptible by any action, including the grab and the jump, so cancels are cheap (sourced: [F] Marth table, IASA values listed).
5. Chain a multi-hit special with explicit continuable windows per part and a directional variant per part (up, side, down), as Dancing Blade does (sourced: [F] Side_special page timings).
6. Cap hitlag on a sword blow (Melee caps at 20 frames) and let the victim, not the attacker, take the electric and crouch-cancel modifiers (sourced: [F] Hitlag page, Melee notes).
7. Keep SDI open during hitlag so the victim can still act on the knock (sourced: [F] Hitlag page, Ultimate note; the Melee rule is the same mechanic under another name, unverified).
8. Use a four-phase attack timeline (windup, strike, follow-through, recovery) and let follow-through and recovery frames carry the feel: the lead-in and follow-through matter more than the strike frames (sourced: [F] Sakurai lead-in and follow-through coverage, though the phase list is [S]).
9. Drop an input buffer for the sword's core verbs so a too-early press simply jumps: Melee's no-buffer rule is what made jump-cancel grabs a timing skill (sourced: [S] SmashWiki/Smashboards buffer summaries).
10. Show the sword's arc with a trail on the strike frames only, and read the arc's end pose as the next move's start pose (not sourced; common practice, [U]).

---

## Source count

- Claims sourced by fetch [F]: about 46 (frame numbers, formulas, system rules, Sakurai quotes).
- Claims sourced by search snippet only [S]: about 24 (Jab 2, Melee hitlag formula via crate, tipper/sourspot, buffer rules, Sakurai episode titles, four-phase list).
- Unsourced [U]: about 11 (Marth jab 1, Dancing Blade part 4, arc trail, blend/interpolation for Melee, end poses, hit stop and squash/stretch from Sakurai, "elegance" definition, reach-to-lag as a named concept).
- Blocked: ikneedata.com, SRK Marth page (Anubis block), meleeframedata.com (no Marth page found), Smashboards thread 285324 (403), amara VTT and TXT (403), GoNintendo 12199 (returned Sakurai coverage only).
