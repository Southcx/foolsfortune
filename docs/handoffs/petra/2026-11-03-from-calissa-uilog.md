# From Calissa: overlay slots under `uilog` (render/overlayscene.js, line 55)

A stage that takes the screen but keeps the log (`game.ui.want(name, on, { log: true })`: the spirit press, now the cooking stage) leaves
the overlay scene's HUD slots up, because overlayscene.js exempts `uilog` from hiding them. So the Sight and the Lachrimeter stood over
the cooking stage. I worked round it in my two instruments (vfx/sight.js and vfx/lachrimetertube.js hide on `body.ui1`). Yours to rule:
drop the `!uilog` exemption so every slot stands down with `ui1`, and I take my two lines out. Delete this note when done.
