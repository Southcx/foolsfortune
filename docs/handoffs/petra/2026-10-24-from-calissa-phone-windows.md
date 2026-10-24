# From Calissa (Art): the windows on a phone, the markup asks (M1, MOBILE.md 4.4, 5 "windows", 6.3)

The dress is done in CSS under `body.hud-touch` (`src/ui/theme.js`, "THE WINDOWS ON A PHONE"; `ui/choicecard.js`; `ui/garagesheet.js`):
44 px presses, a 14 px type floor, the safe area, a window scrolls inside itself, tab rows as one sideways strip, no glove and no sticky
hover on touch, the choice card's long press kept open after the finger lifts. Measured headless at 844 x 390 and 390 x 844: 0 presses
under 44 px, 0 texts under 14 px but the STATUS radar's SVG labels (ask 4). What CSS cannot do is below: each a markup change in a file
that is not mine, for you to route. Please send each to its owner as you see fit.

1. **The shop's hover line is a mouse's only** (`src/progress/shop/ui.js`, Dovina's). Lines 93, 104 and 118 say a thing's price and its
   use in `.hover` on `onmouseenter`; on a phone the tap that fires that emulated enter also fires the click, so a good is bought (line
   95) or a slot sold (line 120) in the same tap, with no look at the price first. Ask: on touch (`game.input.device === 'touch'`) the
   first tap on a `.good` or a `.slot.can` selects it (`.sel`, the line said), and a tap on the selected one buys or sells. The long
   press already haggles (phones fire `contextmenu` on a long press: line 96), which is MOBILE.md 4.4's second verb: keep it, and on
   touch say "long press: haggle" in place of line 93's "right click: haggle" and "tap to sell" for line 113's "click to sell"
   (`deviceText`, `progress/devicewords.js`).
2. **The Codex's line is the keyboard's** (`src/feedback/codex/codex.js` line 121, Petra's): "... · B to close". Ask: through
   `subFor` (`feedback/indexmenu.js`) or `deviceText`, so touch reads without the key (CLOSE stands in the corner).
3. **The Codex's switches explain themselves in `title` only** (`codex.js` lines 126, 134, 142, 150, 259: LENDS, VOICE, MUSIC, WINDOW,
   GO TO STATION). A tooltip never shows on a phone. Ask: none needed if the labels stand alone; if the line matters, a long press
   (`contextmenu`) on the switch says it in the log with a `throttle`.
4. **The STATUS radar's labels are 9 px** (`src/feedback/codex/status.js` line 35, `.st-label`; drawn at line 60 inside the SVG). They
   are SVG units, so a CSS floor would push them off the chart. Ask: on touch, the label's size 14 (or the SVG's viewBox widened by the
   labels' room, so the chart draws them larger), its anchor kept. I can dress it once the room is there.
5. **The help's page line teaches keys** (`src/feedback/help/menu.js` line 78: "the arrow keys turn the pages"). On touch the pages are
   now one sideways strip of 44 px tabs; ask: that line through the device's words, or dropped on touch.
6. **The race board's GARAGE preview is a hover** (my own `ui/garagesheet.js`, noted so it is not lost): on a phone a tap on a notch
   wears it at once, so the stats' "what this step would change" is never seen first. Mine to do next round (a drag along the track
   previews, the lift wears), unless Dovina rules a tap-to-preview, tap-again-to-wear instead.
7. **QAIS's REPORT tile sits on every window's title** (`src/debug/qais/reportbutton.js`, yours; DEBUG only): top-left at z above
   the windows, it covers "THE CODEX", "THE RACE BOARD" and the Index's title at both sizes (see the sheet,
   `docs/plans/art/phone-windows.jpg`). Ask: while a window is open (`modalOpen()` in main.js), the tile steps below the window's
   frame or to the bottom-left corner.
8. **Upright, the pause's title sits on the top bar** (index.html's `#overlay .logo`; the top bar `ui/touch/topbar.js` is mine, the
   overlay's markup yours). On its side I hid the title and set the pages under the bar; upright it still overlaps the bar's icons.
   Ask: none in markup unless you want the logo out of the pause on touch altogether; say so and I will hide it in the dress.

Verified: headless only (Chromium, touch emulation, DPR 2), the windows opened by their own calls; not on a real phone, not in Safari.
