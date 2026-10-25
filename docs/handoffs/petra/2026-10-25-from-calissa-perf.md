# From Calissa (Art): v268's perf, what was mine, what is yours to rule

Measured on one host (4 cores, SwiftShader), `npm run perf` with its ports moved to 6550/6551 (a copy, not committed), against your
baseline file (fe20e89). This host is faster than yours: compare the changes, not the milliseconds. Back-to-back probes of fe20e89 and
v268 on this host are in the casebook's two cases of 2026-10-25. Perf of fe20e89 itself on this host, after mine (draw, ms): the
workshop 998.9 / 998.1, the Dunes 2336.5 / 2373.5, the well 1802.6 / 1594, the garden 570.7 / 568, the crossing 679.8 / 703.5, the
spectacle 725.5 / 739; boot 74.5 / 60.8 s; compiled late 21 / 20; programs 202 / 212; the Dunes' triangles 263,398 / 303,418.

## Fixed (mine)

1. **The well's draw.** It was the Courier, not a screen pass: the vessel's one finish program had grown three pattern families
   (tools, minerals, skins) behind uniform branches, and SwiftShader runs every branch on every pixel; in a hall the camera is 1.58 m
   from the Courier, so the body fills the frame. Each family is now behind a define keyed by what is worn (vfx/finish.js). Probe,
   settled in the hall: fe20e89 1886 ms, v268 4465, now 1753. Perf: the well 1594 ms (your baseline 2276; your v268 5164). The lens
   drops and the ground haze were never on there (`post.volumes` all off in the hall, measured).
2. **Boot.** Most of its growth was the same program's compile: the probe's boot 93.6 s (v268) to 60.5 s (fe20e89 60.4); perf 60.8 s.
3. **Compiled after the warm-up: 24 -> 20** (all 20 the garden's own, as at the baseline's 21). LW_Glow-aberrant and LW_Flame-aberrant
   (play dressed parts the warm-up did not) and palm-die (dressed on its first frame in the garden).
4. **The Dunes' geodes:** their points' hidden caps cut, -16,848 triangles (33,696 to 16,848). The Dunes 320,262 to 303,418: still +15%
   on the baseline. The rest of the growth is mine and is looks: geode rinds 17,280, linings 16,848, fulgurites 3,192, the aberrant's
   shards 2,304 (all in the dunes-dress group, zoned 'dunes'). Yours to rule whether +15% stands.

## One line in your file

`src/boot/warmup.js`: `const parkPalmDie = game.palmDieLook?.prewarm?.()` beside the bracelet's, and `parkPalmDie()` with the other
parks. The palm die is attached to the hand's bone only in its update, so nothing else of mine runs before the compile.

## Yours to rule

- **"Mesh 73499" drawn in every zone is the Dunes' terrain** (world/dunes/dunes.js `ChunkTerrain`, at DUNE's origin; its bounding
  sphere is over 600 m, so render/zones.js places it in no zone). It is the same at fe20e89 (measured: same mesh, same count); the
  baseline file keeps no loose list, so it showed as new. It is shown in a crossing by design (dunes.js `inside`: "a crossing and a far
  dock are under the same sky"). If the crossing cannot see the sand from SEA_AT, hiding the terrain there (not the sky) is yours.
  The "Mesh (zoneFree) 64800" in the crossing is my voxel batch at 5,400 live cubes in the spectacle, as built.
- **Programs: 212 against 202** (the workshop 192, the Dunes and the well 193). Every one new since fe20e89, by name, with why it is kept:

  | program | what | why it earns its place |
  | --- | --- | --- |
  | LW_Body-aberrant | the aberrant's look on a Lantern Wisp | one a kind of aberrant body (header of vfx/aberrantlook.js); was 3, the glow and flame left out now |
  | material-aberrant x2 | the same on the slip jelly and the clapperjar | their own base chains (the jelly's deformer): a hook cannot share across them |
  | duel-idol | the same on the tsuitate's idol | the idol's own material, hooked in place |
  | PneukaJar_body | the Pneuka Jar's look (vfx/pneukajar/) | the vessel's finish and kintsugi on the Jar's mesh, a chain no other part has |
  | palm-die | the palm die in its stones' finish | gem finish on a plain atlas material; was compiled in play |
  | dust-devil, dunes-mirage | the Dunes' dressing | two shaders of different purpose; merging them is an ubershader, the very cost above |
  | flourish-prints | the footprint flourishes | one instanced decal program for every print, lying or glowing |
  | weather-impacts | splashes, chips, ash, haze | one program for all impacts and the ground's haze |
  | weather-lensdrops | the lens drops (a screen volume) | compiled at boot so the first rain in first person is no hitch |

  One basic program went (25 -> 24), and fish-body is the old unnamed fish program renamed. Folding any of the above means an
  ubershader (a uniform `mode`), which the well just showed costs every pixel on a software GL; I would rather the budget move to 212
  than pay that. If two must go, the lowest-value are dust-devil and dunes-mirage (looks of the Dunes only): cut, not folded.
- **A compile at the kiln and the Box:** with the families behind defines, the first patterned skin fired, the first patterned tool
  skin, and the first stone with a mineral each compile their program once, there (they were free to wear before, and paid on every
  pixel). Nothing of the perf route wears one. If you want those warmed too, it is one more program each per chain.

Verified: perf twice on this host (numbers above from the second); the hall probe A/B against fe20e89; every pattern family worn on the
Courier at once compiled and drew with no error and went back. Not verified: a real GPU, a phone, the look of a patterned skin after
the change (the code is the same, only behind its define).
