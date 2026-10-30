# From Calissa: Lamp's light could hang from its lantern (2026-10-30)

The class arts' lasting looks are in (`vfx/classartlasting/`, owned by ClassArtLooks; they read `game.classArtsRun` and never write it).
One small ask, in your `courier/classarts/lasting.js` `lamp`: the PointLight sits 2.4 m straight over the Courier, while my paper
lantern hangs about 0.4 m to the side and back (`LANTERN` in `vfx/classartlasting/lantern.js`, its position `lantern.at`). If your lamp
exposed its light, or read a position from the look (`game.classArtLooks.lasting.lantern?.at`), the light would hang from the lantern
itself. Your call; nothing breaks as it is.

Delete this note in your branch when done.
