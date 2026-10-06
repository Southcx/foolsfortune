**2026-10-06, Petra to Petra: the testing room's zone, held back until two one-word fixes land**

The testing room (`src/world/testroom/`) is not yet a zone, so it is drawn from the Workshop: about 7,000 triangles of the Workshop's
132,370 (perf, v81). The zone is written and measured (a `testroom` zone `partOf: 'workshop'` in `render/zonemap.js`, seen through its
doorway in `render/zones.js` as the basement is through its hole), and waits on two files that ask the zone where they mean the ground
(zonemap's header: "is this the same ground?" asks `wholeOf`):
- Dovina, `src/progress/weather.js` `placeOf`: `zoneOf(pos)` to `wholeOf(pos)` (else the room has no place, its exposure is 'open', and it rains indoors);
- Wanda, `src/music/choose.js`: `game.zones?.current === 'workshop'` to `game.zones?.whole === 'workshop'` (`zones.whole` is in; else the room is silent).
When both are in: apply the zone (the diff below: `git apply` it), gate, record perf, and delete this note.
`world/trial.js` will then abort a trial when you step into the room (it asks `zoneOf`): a trial belongs to its room, so that is right.

```diff
diff --git a/src/render/zonemap.js b/src/render/zonemap.js
index 51e7b61..cfbba6a 100644
--- a/src/render/zonemap.js
+++ b/src/render/zonemap.js
@@ -6,7 +6,7 @@
 // Prior art: the console's room table (a stage's areas as bounds in a list, looked up by the player's position: Ocarina of Time's
 // scene/room split, Kingdom Hearts' worlds), kept as data apart from the code that loads or draws them.
 //
-//   zoneOf(pos) -> 'workshop' | 'basement' | 'circuits' | 'beach' | 'dunes' | 'well' | null      wholeOf(pos) -> the zone, or its whole
+//   zoneOf(pos) -> 'testroom' | 'workshop' | 'basement' | 'circuits' | 'beach' | 'dunes' | 'well' | null      wholeOf(pos) -> the zone, or its whole
 //   ZONE_TESTS [{ id, test(pos), partOf? }]   inDunes(pos)   nearShore(pos)
 // ---------------------------------------------------------------------------------------
 
@@ -20,6 +20,9 @@ const inShore = (p) => shoreSector(p, SHORE_ZONE.r, SHORE_ZONE.half);
 export const nearShore = (c) => inDunes(c) && shoreSector(c, 220, 0.7);
 
 export const ZONE_TESTS = [
+  // the testing room (world/testroom/layout.js TR: x 10.5 to 30.5, z -5.5 to 10.5, 6 m high), through a door in the Workshop's east wall:
+  // drawn only from where its doorway can be seen; part of the Workshop's ground (one roof, one set of lamps)
+  { id: 'testroom', partOf: 'workshop', test: (p) => p.y > -1.2 && p.y < 7 && p.x > 10.5 && p.x < 30.6 && p.z > -5.6 && p.z < 10.6 },
   { id: 'workshop', test: (p) => p.y > -1.2 && p.y < 60 && Math.abs(p.x) < 40 && Math.abs(p.z) < 40 },
   { id: 'basement', test: (p) => p.y <= -1.2 && p.y > -150 && p.x > -250 && p.x < 450 && p.z > -300 && p.z < 200 },
   { id: 'circuits', test: (p) => p.x > 2800 && p.x < 3300 && p.z > -300 && p.z <= 380 && p.y > -120 && p.y < 120 },
diff --git a/src/render/zones.js b/src/render/zones.js
index a15d06d..2cc0ed8 100644
--- a/src/render/zones.js
+++ b/src/render/zones.js
@@ -11,7 +11,7 @@
 // Objects that follow the camera or are drawn in world space from the origin (particles, trails, ropes: `frustumCulled = false`), and
 // anything marked `userData.zoneFree`, are never hidden by zone.
 //
-//   zoneOf(pos) -> 'workshop' | 'basement' | 'circuits' | 'beach' | 'dunes' | 'well' | null        (pure, for builders: render/zonemap.js)
+//   zoneOf(pos) -> 'testroom' | 'workshop' | 'basement' | 'circuits' | 'beach' | 'dunes' | 'well' | null        (pure, for builders: render/zonemap.js)
 //   wholeOf(pos) -> the zone, or the one it is part of ('beach' is `partOf` 'dunes': one sand, one sky, walked between). Anything
 //   asking "is this the same ground?" asks the whole; anything asking "what is drawn?" asks the zone.
 //   game.zones.update(dt)        game.zones.current        game.zones.visibleAt(pos)
@@ -31,9 +31,19 @@ const seesHole = (c, cam, range) => {
   return _fr.setFromProjectionMatrix(_pm).intersectsBox(HOLE_BOX);
 };
 
+// the testing room's doorway in the workshop's east wall (world/testroom/layout.js TR.door: z 1 to 4, 3.2 m high), the wall's depth and a margin
+const DOOR_BOX = new THREE.Box3(new THREE.Vector3(9.8, 0, 0.8), new THREE.Vector3(10.8, 3.4, 4.2));
+/** Can the camera see through the testing room's doorway (in range, and the doorway on screen)? */
+const seesDoor = (c, cam, range) => {
+  if (Math.max(DOOR_BOX.distanceToPoint(c), 0) > range) return false;
+  _pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
+  return _fr.setFromProjectionMatrix(_pm).intersectsBox(DOOR_BOX);
+};
+
 // what each zone can see from where the camera stands (the tests themselves are pure: render/zonemap.js)
 const SEES = {
-  workshop: (c, cam) => (seesHole(c, cam, 30) ? ['basement'] : []),
+  workshop: (c, cam) => [...(seesHole(c, cam, 30) ? ['basement'] : []), ...(seesDoor(c, cam, 40) ? ['testroom'] : [])],
+  testroom: (c, cam) => (seesDoor(c, cam, 40) ? ['workshop'] : []),
   basement: (c, cam) => (seesHole(c, cam, 12) ? ['workshop'] : []), // (a hole in the ceiling: only from near under it)
   beach: () => ['dunes'],
   dunes: (c) => (nearShore(c) ? ['beach'] : []),
```
