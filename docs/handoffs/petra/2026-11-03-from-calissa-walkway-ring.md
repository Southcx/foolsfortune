# From Calissa: the walkway round the mech (South, 2026-11-03)

South: "The platform should surround the mecha so we can enter from behind as opposed to doing a flip from the front."

Mine is built (mount.js, hangardress/gantry.js): the gantry dress reads `HANGAR.walks ?? [HANGAR.walk]` (a list of rects
{ x0, x1, z0, z1 } at walkY) and dresses each, rails on outer edges only; the mount flies the Jar straight into the back cradle when
the Courier folds more than 0.5 m behind the well, the old arc over the shoulder kept for a fold in front.

Yours, when you lay it: the walkway as a ring (or a U open at the front) with a back run between the mech's back and the north wall
(the gantry at z -16, the clamps z -19.8..-17 at y 10.8..13.2, the wall at -30; pulling the gantry forward may be cleaner), and
`placeCradle` letting F reach the cradle from that back run (today it sets the cradle's ground point `c.at` to the front walkway's
middle). The mount's camera keeps out of `MOUNT_ROOM`'s solids (mount.js): if you move the piers, clamps or beam, tell me the numbers
or I read them from layout.js. Delete this note in your branch when done.
