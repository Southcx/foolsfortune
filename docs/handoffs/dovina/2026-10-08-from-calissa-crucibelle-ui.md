**2026-10-08, from Calissa (Art): the Crucibelle on the compass, built (your CRUCIBELLE-UI.md, my look); for §2's rewrite and §6's sweep**

It is built and merged in my branch (`src/vfx/crucibellehud.js`, 01268f8). This note is the rewrite of your §2 to the look as built,
the words it needed, the events, and the sweep check for acceptance 5 (your file, so a diff for you).

**The look: the bell on the compass, in the vane's own line hand** (additive lines on the wire compass's tape, no words, no numbers)
- **The bell's mark** sits on the tape's centre. **The pendulum** hangs from it below the tape, as the fob hangs below the hand on the
  bell. Its swing is AMP·cos(π·phase): each end lands on an eighth of the bell's own grid (`grid()`, with or without music), easing into
  the ends like a real pendulum.
- **The downbeat:** the rod and bob thicken and that end's mark stands taller: shape only, no brightness pulse, never a flash.
- **The notches:** a forked groove at each end, spanning exactly the angle the bob sweeps inside the bell's ±0.085 s window, so the
  notch is the window, honestly.
- **The notes:** each press draws its **neume** on the arc where the bob was: solid inside the notch, hollow outside; an octave up
  (RMB) doubles its line. The five neumes are Aikin's shape notes read in the minor from la, coloured by `DEGREE_COLOR`:
  - 1, root: **square**;
  - 2: **triangle**;
  - 3: **bowl**;
  - 4: **diamond**;
  - 5: **circle**.

  All five are distinct in greyscale at 13 px.
- **The motif:** the last notes' neumes trail along the tape like a phrase. When they make a song, they gather into **that song's
  neume** (its own heads heighted by pitch and joined in one ligature, the chant's compound neume) and are taken into the bell's mark.
  Too dry to sing: they fall instead.
- **Fever:** the bob is an ember, glowing and trailing a thread of smoke that rises with fever. At the peak a ring of smoke travels out
  round the tape once.
- **No music:** the bell's own 96, the line drawn fainter.
- **Settings from the start:** `visual.pendulumSize` and `visual.compassContrast`. At the default contrast the pendulum gets a faint
  dark keyline under its lines, because additive lines vanish on the Dunes' noon sky; I kept it on, since readability is the point.
- **Half Time** (the knack's flag `game.knacks?.halfTime`, wired, the knack not built): the ends land on quarters, and a centre notch
  marks the off-eighth. Its name and whether it is "Half Time" or TRAINING's "Slow Bell" are yours and Espada's.

**Words (in the glossary, same commit):**
- **the pendulum:** *not* the metronome, which is the fob on the bell itself.
- **a neume:** *not* a sigil, which is the Soul Brush's.
- **the wire compass:** finally an entry of its own.

**Events (the HUD reads):** `crucibelle.note { degree, onBeat }`, `song.play` (emitted before the last note's `crucibelle.note`; the HUD
takes either order), the bell's `fever` each frame, and its `grid()` / `now()` / `lastNote`. Petra's to add (in her note):
- `note`, `octave` and `by` on `crucibelle.note`;
- `by` on `song.play`;
- an export of the bell's `WINDOW`, which the HUD mirrors as 0.085.

**Acceptance, measured headless:**
1. The ends land within one sample of every eighth: worst 2 ms against the music's grid at 75 bpm, and all 16 ends within their sample
   against the bell's own 96.
2. Solid inside the notch, hollow outside.
3. Five neumes distinct in greyscale.
4. A song gathers and is cast.
5. With the sound muted, THE RALLY (1 3 5) was played by reading only `game.crucibelleHud.read()`: all three notes on the beat, the song
   cast, the notch agreeing with the bell's own judgement on every note.

Not run: stress, perf, a real GPU, first person.

**The sweep check for acceptance 5** (your `scripts/sweeps/tools.mjs`; it passed 19/19 with `--only pendulum` and was reverted from my
branch). The diff:

```diff
diff --git a/scripts/sweeps/tools.mjs b/scripts/sweeps/tools.mjs
index d723b06..b379194 100644
--- a/scripts/sweeps/tools.mjs
+++ b/scripts/sweeps/tools.mjs
@@ -13,7 +13,7 @@
 //
 //   npm run dev &                     (or URL=http://host:port/ for a build under `vite preview`)
 //   node scripts/sweeps/tools.mjs [--out dir] [--seed 1] [--quick] [--only places,base,draw,...]   (shots: <out>/shots, default <tmp>/sweeps/tools)
-//   parts: places base draw sondelass brush fittings swap moves god careless leak   (--only runs some, in that order; base is always run)
+//   parts: places base draw sondelass brush fittings swap moves god careless pendulum leak   (--only runs some, in that order; base is always run)
 //
 // Mouse buttons are put on the game's input directly (`input.pressed` / `input.down`, as the replay does): headless, the canvas under the
 // crosshair is not always the element Playwright's click lands on. Keys go through the page's keyboard, as a person's do.
@@ -472,6 +472,44 @@ if (part('careless')) {
   S.check('careless: the core movement exactly as before', sameCore(c), { base: BASE, now: c });
 }
 
+// ================================================================== 9b. the Crucibelle's pendulum (vfx/crucibellehud.js), played by sight alone
+// (docs/plans/CRUCIBELLE-UI.md, acceptance 5): the sound muted, THE RALLY (1 3 5) pressed only while the pendulum's bob is in its notch and
+// swinging toward its end, as read off game.crucibelleHud.read(), never off the music's clock. The notes must land on the beat, the song
+// be cast, and the notch agree with the bell's own judgement on every note.
+if (part('pendulum')) {
+  S.phase = 'pendulum';
+  await tl(`stand(${J(LAB)}, ${LAB_YAW})`);
+  const slot = await tl("slotOf('tool.crucibelle')");
+  if (slot >= 0) { await S.ev((s) => __game.game.pneuka.wear(s), slot); await S.ticks(10); }
+  await S.ev(() => { __game.T.audio.volume = 0; __game.game.lachryma.value = __game.game.lachryma.max; });
+  await key('KeyU', 2); await S.ticks(70);
+  const seen = await S.ev(() => __game.game.crucibelleHud?.read());
+  S.check('pendulum: shown with the Crucibelle drawn', seen?.shown === true, seen);
+  const played = await S.ev(() => {
+    const g = __game.game, I = __game.input, H = g.crucibelleHud, out = { notes: [], song: null };
+    const offN = g.events.on('crucibelle.note', (e) => out.notes.push(e.onBeat)), offS = g.events.on('song.play', (e) => { out.song = e.song; });
+    for (const d of [1, 3, 5]) {
+      let pressed = false;
+      for (let i = 0; i < 400 && !pressed; i++) {
+        __sw.tick(1);
+        const r = H.read();
+        if (r.shown && r.inNotch && r.towardEnd) { I.pressed.add('Digit' + d); I.down.add('Digit' + d); __sw.tick(1); I.down.delete('Digit' + d); pressed = true; }
+      }
+      if (!pressed) out.notes.push('never in the notch');
+    }
+    offN(); offS();
+    return { ...out, disagree: H.read().disagree, own: H.read().own };
+  });
+  S.check('pendulum: by sight alone, THE RALLY on the beat and cast (sound muted)', played.notes.length === 3 && played.notes.every((x) => x === true) && played.song === 'rally', played);
+  S.check('pendulum: the notch agrees with the bell on every note', played.disagree === 0, { disagree: played.disagree });
+  await S.shot('pendulum-rally');
+  await key('KeyU', 2); await S.ticks(80);
+  const gone = await S.ev(() => __game.game.crucibelleHud?.read());
+  S.check('pendulum: gone when the Crucibelle is stowed', gone?.shown === false, gone);
+  await tl(`wearSet(${J(WORN0)})`);
+  await settledChecks('pendulum: after', { expectOut: null });
+}
+
 // ================================================================== 10. leaks: twenty draws and stows of each tool
 if (part('leak')) {
   S.phase = 'leak';
```

Delete this note when done.
