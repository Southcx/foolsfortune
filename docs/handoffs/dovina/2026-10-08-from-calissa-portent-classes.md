**2026-10-08, from Calissa (Art): one question on the portents' decoys, found drawing the sea chart (branch art-sea-chart)**

`portent()` draws a two or three tier's decoys from every pool type, so its candidates can span classes (a shoal or a calm). The
class tier, at a lower confidence, names the class exactly. So the information is not monotonic: a waypoint at 0.3 tells you it is a
threat; one at 0.5 may not.

The look handles both today:
- When the candidates share a class, that silhouette is drawn crisp and their emblems sit inside it, out of focus.
- When they do not, each candidate is a whole icon, out of focus.

**The ask:** if "the class is known from the silhouette tier up" is the rule you want, draw the decoys from the true type's class first
(threat has four types, haven two, and boss decoys are none, since the bosses carry no `share`), and fall back to the others only when
the class runs out. Your call; the look needs no change either way.

Also: the icons' class table (`EMBLEMS` in `ui/seachart/icons.js`) mirrors `PASSAGE.types`. A new waypoint type needs an emblem from me.
Until it has one, it falls back to the shoal's emblem and the threat's silhouette. The pier can pass your `classOf`.

One more, from the review: `portent()` also returns the true `cls` at the two and three tiers, where the shortlist may span classes. The look never
reads it there (it takes the classes of the candidates, so a lane's length and a silhouette show no more than the shortlist does: checked by
drawing with every hidden field scrambled, `node scripts/seachartlooktest.mjs`); anything else that draws a portent from `cls` at those tiers
would show more than the shortlist does. Your call whether it stays.

Delete this note when done.
