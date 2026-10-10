# From Calissa: the crawl's look is built; it needs a body (2026-10-10)

The owner (2026-10-10): "the main animation library has a proper full-prone crawling animation or two to use for situations where
crawling is warranted (like under a wall, tight spaces)". The look is in (`src/courier/anim/crawl.js`, `CRAWL`); it plays the moment
player.js sets the state. Nothing of player.js or core/config.js is changed: the body is yours.

## What the animator reads
- `s.crawl` (truthy: down on all fours) and `s.prone` (0..1: flat on the belly instead of the hands and knees), on the animation state
  beside `crouch` (main.js builds it: `crouch: player.crouchBlend`). The speed is the capsule's, as for every gait.
- `character.crawl.busy`: the getting up still playing. Hold the low body until it is false (and ask for headroom before letting go).
- While the crawl is on, the foot IK, its reach drop, the knee guard and the prowl's head give way to it by its weight; the idle breaks
  wait.

## What the clips need (measured on the Courier, posed meshes, hair included, every tool off)
| | top | from the capsule's centre, behind / ahead | width | its own speed |
| --- | --- | --- | --- | --- |
| hands and knees (Loco_Crawl) | 1.05 m | 0.97 / 0.72 m (1.69 long) | 0.65 m | 0.29 m/s |
| the belly (Loco_CrawlProne) | 0.74 m | 1.22 / 0.97 m (2.18 long, the arms reaching) | 0.76 m | 0.39 m/s |

- So a crawl body at most 1.1 m tall for the hands and knees (the 1.35 m low capsule is too tall for anything the crouch cannot already
  pass), 0.8 m for the belly. The body is long, not tall: a 0.3 m radius upright capsule leaves the head 0.4 to 0.7 m ahead of it, so a
  capsule lying along the heading (or two spheres) fits it better. Your call.
- Getting down (Loco_CrawlEnter, 0.67 s from standing): from the crouch it plays from 0.2 s, the top 1.41 to 1.03 m in about 0.4 s.
  Getting up (Loco_CrawlExit): to the crouch's squat by 0.4 s, to standing by 0.64 s; the top back to 1.37 m by 0.4 s.
- Speeds I would start from: 0.9 m/s on hands and knees, 0.6 on the belly (the loops stretch their strides to 1.3 times, the rest
  cadence: past about 1.2 m/s they scurry).

## Where a crawl space would go
- Nothing in the game is lower than the crouch's 1.35 m today but the basement's CLEARANCE gate at 1.2 m (`world/basement/basement.js`,
  the bar heights at z 6), which nothing passes on foot (the slip form's 0.7 m blob only on wet slip). The hands and knees fit under it:
  it is the place to try the crawl first.
- For the belly: a 0.8 m duct at the course's station 8 (SW, "low": the slide chute and the 1.5 m tunnel), after the tunnel, so the
  course asks crouch, then crawl.

Sheets: the crawl on hands and knees, on the belly, and down and up from the crouch, front and side (in my session's scratchpad,
prowl-idles/crawl_look.png; docs/ART.md section 10 has the numbers).
