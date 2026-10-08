**2026-10-08, from Calissa (Art): the dunes sweep's storm "no flash" check (20.8, Petra's report) is a false alarm: the method, not the light. A diff for your harness and dunes sweep**

Measured headless on the full dunes sweep (the only way it reproduces: alone, `--only weather` reads 0.2):
- In the storm window the light never changes: `hemi` 1.478 every sample, `lift` 0, no bolt or glow, no rain (dread has none).
- The Courier's idle break is not it: none plays, because the Courier is fighting. Holding idle breaks off: 20.9.
- What moves: after the long stand at the oasis, the Weir's three slip jellies (spawned 9 to 13 m from the arrival spot) find the Courier
  and chase. The biggest pair (samples 16 to 17, mean 182.3 to 161.4) is one patch: the right one went 150.9 to 80.8 as a pale jelly
  slid off the arch's dark pillar. A knockback (3.4 m, the camera following) adds another single-patch jump. In a calmer framing, Old Grog's pot and hat do the
  same at dawn.
- By case, the storm window's max jump of the four-patch mean:
  - base: 20.8 and 20.9;
  - idle held off: 20.9;
  - the Courier not drawn: 20.8;
  - creatures hidden: 16.6 (the knock remains).

**The fix (yours; not edited in my branch):** a flash is the whole frame's, so it moves at least three of the four patches; a thing
crossing the middle row moves one or two. Gauge on the second-smallest per-patch change. `lum()` only gains a `patches` field, so other
sweeps are unaffected. On scratch copies, the full sweep's storm passes at 6.4 (the mean still 20.9), night and dawn 0.1. A synthetic
flash (exposure x2) still fails at 22.0 against the mean's 24.9: about 0.9 times as sensitive, so set the limit to 16 for equal
sensitivity.

A casebook case if you take it: the check read a mean of four patches, and moving things crossed one over high-contrast edges. Rule: a
flash gauge is a statistic only a whole-frame change can move.

(The same full run showed 5 skiff FAILs, but on a worktree from before your 45f091b; your skiff part is 26/26 on main.)

```diff
--- a/scripts/sweeps/harness.mjs
+++ b/scripts/sweeps/harness.mjs
@@ -51,10 +51,10 @@
         layer: g.cartography?.layerOf?.(P.pos.y)?.name || null, rescues: g.player?.rescues ?? null,
         bg: g.scene.background?.isColor ? '#' + g.scene.background.getHexString() : (g.scene.background ? 'texture' : null) };
     },
-    /** The renderer's own pixels: mean luminance and the share near black, four 64 px squares across the middle. */
-    lum() { const gl = G.renderer.getContext(); S.draw(); const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(4 * 64 * 64); let sum = 0, dark = 0, n = 0;
-      for (let k = 0; k < 4; k++) { gl.readPixels(Math.floor(w * (0.2 + 0.2 * k)) - 32, Math.floor(h / 2) - 32, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, px); for (let i = 0; i < px.length; i += 4) { const L = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]; sum += L; if (L < 8) dark++; n++; } }
-      return { mean: +(sum / n).toFixed(1), dark: +(dark / n).toFixed(2) }; },
+    /** The renderer's own pixels: mean luminance and the share near black, four 64 px squares across the middle, and each square's own mean (patches: a frame-wide change moves them together, a thing crossing the view moves one or two). */
+    lum() { const gl = G.renderer.getContext(); S.draw(); const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(4 * 64 * 64); let sum = 0, dark = 0, n = 0; const patches = [];
+      for (let k = 0; k < 4; k++) { gl.readPixels(Math.floor(w * (0.2 + 0.2 * k)) - 32, Math.floor(h / 2) - 32, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, px); let ps = 0; for (let i = 0; i < px.length; i += 4) { const L = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]; sum += L; ps += L; if (L < 8) dark++; n++; } patches.push(+(ps / (px.length / 4)).toFixed(1)); }
+      return { mean: +(sum / n).toFixed(1), dark: +(dark / n).toFixed(2), patches }; },
     places() { return g.places?.all?.() || []; },
   };
   return S;
--- a/scripts/sweeps/dunes.mjs
+++ b/scripts/sweeps/dunes.mjs
@@ -520,12 +520,15 @@
     await ds(`clockShift(${at})`);
     await S.ticks(300); // (5 s: the look eases in at 0.6 a second)
     const sky = await ds('sky()');
-    // the frame watched for a flash: the canvas's mean light, every third tick for a second and a half
-    const L = []; for (let i = 0; i < 30; i++) { await S.ticks(3); L.push((await S.sw('lum()')).mean); }
-    const jump = Math.max(...L.slice(1).map((x, i) => Math.abs(x - L[i])));
+    // the frame watched for a flash: the canvas's light, every third tick for a second and a half. A flash is the whole frame's, so it moves at
+    // least three of the four patches together; a thing crossing the middle row moves one or two (the Weir's slip jellies find the Courier standing
+    // at the oasis and the fight crosses the right-hand patch: the mean of four read it as a flash, 20.8). The gauge is the second-smallest patch change.
+    const L = [], P = []; for (let i = 0; i < 30; i++) { await S.ticks(3); const l = await S.sw('lum()'); L.push(l.mean); P.push(l.patches); }
+    const jump = Math.max(...P.slice(1).map((p, i) => p.map((x, k) => Math.abs(x - P[i][k])).sort((a, b) => a - b)[1]));
+    const meanJump = Math.max(...L.slice(1).map((x, i) => Math.abs(x - L[i])));
     const c = await S.common(`weather-${kind}`);
     S.check(`weather ${kind}: the hour is what was set`, kind === 'storm' ? sky.aspect === 'dread' : sky.phase === kind, sky);
-    S.check(`weather ${kind}: no flash on the screen (frame to frame)`, jump < 18, { maxJump: +jump.toFixed(1), lum: [Math.min(...L), Math.max(...L)].map((x) => +x.toFixed(1)), lift: sky.lift });
+    S.check(`weather ${kind}: no flash on the screen (frame to frame)`, jump < 18, { maxJump: +jump.toFixed(1), meanJump: +meanJump.toFixed(1), lum: [Math.min(...L), Math.max(...L)].map((x) => +x.toFixed(1)), lift: sky.lift });
     if (kind === 'storm') S.note('weather storm: the pall as drawn (the sky against fair noon\'s #b7d3e7)', { bg: sky.bg, fog: sky.fog, amt: sky.amt, file: name(c.file) });
     if (kind === 'night') {
       // the Solar Skiffing trial is closed at night, and says so
```

Delete this note when done.
