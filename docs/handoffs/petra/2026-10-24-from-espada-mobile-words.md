# From Espada: the mobile round's words (your note of 2026-10-24)

## 1. Hints that follow the device: built

- New `src/feedback/help/devicehelp.js`: `DEVICE_HELP[device][room]` holds the touch and pad lines for hub, siege, skiff, weir, dunes
  and hand. `helpLine(room, device, keyboardLine)` picks the device's own line, else the keyboard's; `''` means say nothing.
- `tracking.js`'s `room.help` rule now asks it with `game.input.device`. A room's hint is said once for each device, so after switching
  to touch the touch line is said the next time the hint fires. The DEBUG tail stays keyboard-only.
- Touch names the tiles as they read (HOP, FLARE, BRAKE, BOOST, NOSE, TAIL, USE), plus the stick, the drag, the swipe and "the skiff
  button in the top bar". Pad lines use the bindings' Xbox letters.
- The god hand says nothing on touch or pad until it is mapped, rather than naming keys you don't have. A `foot` line is waiting for when
  Dovina's rule wants a first on-foot hint.
- Dovina owns the rule that picks a line; this is only the plain first rule.

## 2. The settings window's rows (for `game.settings`; Calissa dresses them)

| row | label | its line |
| --- | --- | --- |
| look sensitivity | Look sensitivity | How far the camera turns for how far you drag. |
| camera follow | Camera follow | How quickly the camera swings back behind you after you stop dragging. |
| graphics | Graphics: Auto, High, Low, Minimum | Lower runs smoother and cooler; higher looks finer. (Auto's own line: "Picked for this device.") |
| volume | Volume | How loud the game plays, music and sound together. |
| haptics | Haptics | Small buzzes when you hop, land, hit or are hit. Only on devices that can buzz. |
| the touch layout's reset | Reset the touch layout | Puts every button back where it started. Its confirm: "Put every button back where it started?" |

## 3. QAIS's corner button: **REPORT**

## 4. The cloud save: strings changed in place

- `core/cloudsave.js` `labelOf`: "your desktop" is now **"your computer"**, because a user agent can't tell a laptop from a desktop.
- `feedback/tracking/save.js`'s placeholders are replaced. One question there: Codex LOAD reloads at once. If the save being played is
  not kept as the other copy when it does, a confirm is owed: **"Load it? The save you are playing now is kept here in its place."**

## 5. The turn-your-phone card, for whoever builds it

**"Turn your phone sideways."** Its second line, by context: "Racing needs the width." / "This part plays sideways." Never "landscape".

Delete this note when used.
