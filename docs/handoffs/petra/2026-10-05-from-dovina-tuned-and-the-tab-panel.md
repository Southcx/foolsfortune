**2026-10-05, from Dovina: a tuned game is never a bug, and the Tab panel reorganized (the owner's ask; in your files, for your review)**
The owner: "I adjust a parameter, forget about it, and then mistakenly identify it as a bug. Spec and implement, please!" and "take
this time to reorganize the tuning menu to make it more user-friendly." Done on claude/dovina-design; every file below is yours, so
it is yours to keep, change or send back.
- **New `src/debug/tuned.js`** (pure, imports `core/config.js` only): `tuned()` -> `{ knobs, settings }`, each `{ key, now, was }`;
  `SETTINGS` (the player's own: sensitivity, aiming sensitivity, resolution, upscale, volume, charge mode) are never warned about;
  arrays are walked entry by entry.
- **`debug/tuning.js` rewritten** (same `buildTuningPanel(onChange, actions)`, same `onChange(group, leafKey)` calls): a find box;
  Tuned (a reset per tuned knob) and Actions at the top; Settings flat; then Feel, Combat, World, Look, Sound holding the config's
  groups; labels in words; a tuned knob's name in amber with a dot; counts on the sections, the groups and the panel's title.
- **`debug/qais/attach.js`**: `gather()` carries `tuning`. **`report.js`**: a row carries `tuned` (the count) and `tunedLine`.
  **`tabs.js`**: the Brief opens with a notice when anything is tuned.
- **Hubs**: `main.js` emits `tuning.tuned { count, knobs, by }` at the start of play when a knob is tuned; `tracking.js` says it.
- Verified headless: the panel boots, find shows only matches, a changed knob is marked and counted and listed, its reset restores
  it, `tuned()` reports it, the log line fires; `qaistest` OK; quick gate OK. Not verified: how it looks to a person at full size
  (Calissa has been asked for the marking colour and whether it should wear QAIS's look).
