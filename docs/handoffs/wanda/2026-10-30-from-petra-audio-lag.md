# From Petra: South's laptop's audio lag, measured (2026-10-30)

South, 2026-10-30: "On my laptop I've noticed a lot of audio lag occurring independent of framerate." The fix is yours; here is what
the gate measured.

## The field report (South's own loads, `data/users/<id>`, `field.*`)

Load `mvuea00d3637b2`, v350, Windows 10, Chrome on the desk (tier high, frame rate up to 60). Your watch (audio/health.js) told 6
windows before its cap of 8 a load ran out of room, the audio clock against the wall clock over 2 real s:

| real s | k | sounds, notes in the window | where, cue |
| --- | --- | --- | --- |
| 80.9 | 0.885 | 13, 46 | workshop, Five Against Fate (b) |
| 101 | 0.895 | 18, 44 | workshop, Five Against Fate (b), fight |
| 441 | 0.891 | 0, 13 | testroom, Lachryma (nebula) |
| 776.9 | 0.950 | 16, 8 | raceway, The Raceway (paddock) |
| 786.9 | 0.847 | 16, 7 | raceway, The Raceway (paddock) |
| 798.9 | 0.785 | 19, 7 | raceway, The Raceway (paddock) |

The audio thread renders 78 to 95% of what real time asks for, whatever the frame rate: the graph is heavier than that laptop's audio
thread. The iPhone's loads show the same in duels (k 0.90 to 0.95, the phone mixer).

## The graph's cost, offline

Your `scripts/render_score.mjs`'s way (the game's own Arranger and Band in an OfflineAudioContext), rendered as in play: suspended every
0.1 s, the bars laid out 0.6 s ahead and the notes made 0.12 s ahead (music/arranger.js `run`), the script's own time taken off. 20 s of
Five Against Fate at 48 kHz on one 2.8 GHz Xeon core; the cost as a share of real time (1.0: the core is full):

| graph | cost |
| --- | --- |
| the fight cue as built | 0.42, 0.43 |
| the same, its convolvers as plain gains | 0.24, 0.26 |
| two arrangers at once (a change of cue: each its own band and 3.2 s convolver) | 0.90 |
| the fight cue plus the mixer's two 1.4 s rooms (audio/core.js `verb`, `verbMain`) | 0.59 |

The arranger's one 3.2 s reverb is about 40% of the music's cost, and a change of cue doubles the whole. Rendered all at once instead
(every note made up front) it costs 1.4 to 2.0: the arranger's beat-ahead is right. One caveat: an offline context does a convolver's
tail stages on its render thread; a live one moves the stages past 8192 frames to a background thread, so the live audio thread carries
less of the reverb (the CPU in all is the same).

The convolvers alive in play: the mixer's two (1.4 s), one an arranger (3.2 s; two in a change of cue), music/player.js's two (3.4 s,
3.6 s), the Crucibelle's (2.6 s), the zone's acoustic (audio/acoustics.js).

## What I would try (yours to decide)

1. One music reverb, shared: a change of cue's two arrangers send into the same convolver instead of building their own.
2. An audio tier your watch steps down: k under 0.95 for two windows running on a desk, the phone mixer's limits there (PHONE.verb's
   1.2 s impulses, `burst` and `window`), said in the field report as the tier it chose. A desk that keeps up keeps its sound as it is.
3. The band's notes: about 0.25 of the core for some 22 notes a real second; the nodes a note makes are where the rest is.

Not measured: the live graph's nodes (the harness never starts the music; your tools will), the effects' share at the Raceway's
paddock, and the laptop itself (whether its output is Bluetooth, which adds its own 150 to 250 ms: asked of South). At the gate I will
rerun the same offline measure on your branch and read South's next field reports for k.
