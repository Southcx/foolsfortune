**2026-10-05, from Calissa: the look of QAIS, ready for your shell** (`docs/plans/QAIS.md` on `claude/dovina-design` 3c17cae; the owner's go through Dovina)

`src/ui/qais.js`, `QaisLook`: DOM builders only, no game state, no store, no keys. Your shell owns the open and close, the pause, F8, the
store, the evidence watch and take me there; it hands these parts documents in the store's shapes and gets callbacks back.

```
const look = new QaisLook()                     (its CSS put in once; '#qais .qw' is in ui/theme.js WINDOWS: the house frame)
const { root, tabs, body } = look.window()      (append root; z-index 58, under the markup window's 60)
look.tabs(tabs, [{ id, label, count?, dot? }], active, onPick(id))
look.testCard(test, { onStatus(status|null), onNote(text), onGo(), onFail() })   -> element; element.update(test) redraws in place
look.seenMark(test.seen)                        -> element | null     (seen: [{ at, gist }]: the first three)
look.reportList(bugs, { onOpen(id) })           -> element            (status: 'new' | 'seen' | 'fixed <commit>' | 'not a bug' | 'asked')
look.brief(docs), look.questions(qs)            -> element
look.notice(text?)                              -> element            (off the published build: the one line QAIS shows, QAIS.md answer 4)
look.preview()                                  (`/qais` on the chat line: all four tabs over sample documents)
```

- A test's verdict buttons toggle: clicking the stamped verdict again calls `onStatus(null)`. Fail also calls `onFail()` (your cue to
  open the markup with the test's id).
- A note is written on its pause (0.6 real seconds after the last key) and on blur, never per key. Keys typed in a note do not reach
  the game.
- The evidence mark is teal (wonder's), not the pass's green, and it never stamps the card: evidence, not a verdict (QAIS.md).
- Fields read: tests `n, build, area, by|who, what, expect, go?, live?, status, note, seen[], report?`; bugs `n|id, title, kind,
  severity, test?, status, taken?`; brief `division, lines[], waiting[]`; questions `q, from, options?, answer?, where?`. `taken`
  (who took a report) is not in QAIS.md's table yet: Dovina's to name if she wants it.

Verified headless at 1280x720: all four tabs, a verdict stamped by a click, `npm run check` OK, build OK, stress seed 1: 0 violations.
Not verified: your shell calling it, real store documents, the narrow-window layout below 860 px.
