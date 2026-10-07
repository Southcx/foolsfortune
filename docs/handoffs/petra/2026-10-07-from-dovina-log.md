# The log: following the newest line, and the ISO \ key (from Dovina, 2026-10-07; the owner asked)

The owner: "ensure that the log stays focused on the latest entry ... the slider bar drifts from the latest entry, forcing me to press
Page Down", and "I don't know if the minimize key is working".

**Measured** (the workshop sweep's new part 8, `scripts/sweeps/workshop.mjs`, the log section):
- Once the log reaches its cap of 140 lines, a burst of lines unpins it, and the view ended 4,320 px above the newest line.
  Each append drops the first child; the browser's scroll anchoring then moves `scrollTop` and fires a scroll event. The handler at
  `gamelog.js:101` reads that event as the player scrolling back, and sets `pinned = false`.
- A merged line that grows onto a second row is never followed (the merge branch of `say` sets no `toEnd`); the view ended 72 px short.
- `\` works on a US keyboard. On UK and other ISO keyboards the `\` key by the left Shift is `IntlBackslash`, which `key()` ignores.
  That is my guess at the owner's report, not confirmed with them.

**The fix, tested on my branch and reverted (your file).** With it, all three checks pass:
- The log lets go only on the player's own scroll: the wheel up, PageUp, or a drag on the bar. Reaching the end again takes it back.
- `overflow-anchor: none` on the body.
- The merge branch follows the line it grew.
- `IntlBackslash` toggles minimise too.

The diff:

```diff
diff --git a/src/feedback/gamelog.js b/src/feedback/gamelog.js
index d7afb67..37a5cbc 100644
--- a/src/feedback/gamelog.js
+++ b/src/feedback/gamelog.js
@@ -56,7 +56,7 @@ const CSS = `
 #chatlog .tab.on { color: #fff1e0; background: rgba(196,106,69,.30); border-color: #9a5a44; }
 #chatlog .tab.new { color: #ffd67e; }
 #chatlog .tab.on.new { color: #fff1e0; }
-#chatlog .body { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 3px 6px 4px; font-size: 16px; line-height: 18px; scrollbar-width: thin; scrollbar-color: #9a5a44 transparent; }
+#chatlog .body { flex: 1; overflow-y: auto; overflow-anchor: none; overflow-x: hidden; padding: 3px 6px 4px; font-size: 16px; line-height: 18px; scrollbar-width: thin; scrollbar-color: #9a5a44 transparent; }
 #chatlog .ln { text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px rgba(0,0,0,.6); word-wrap: break-word; }
 #chatlog .ts { color: #a98572; margin-right: 8px; }
 #chatlog .ln.ach { color: #ffd45e; }
@@ -98,7 +98,13 @@ export class GameLog {
     this.root = root;
     this.body = root.querySelector('.body');
     this.pinned = true; // (following the newest line; let go while they scroll back to read)
-    this.body.addEventListener('scroll', () => { this.pinned = this.body.scrollHeight - this.body.scrollTop - this.body.clientHeight < 40; }, { passive: true });
+    // (it lets go only when you scroll back yourself: the wheel up, PageUp, a drag on the bar; reaching the end again takes it back.
+    //  A scroll the log makes itself, or one the browser makes when old lines are dropped at the cap, never lets go: SWEEPS.md, the log)
+    const atEnd = () => this.body.scrollHeight - this.body.scrollTop - this.body.clientHeight < 40;
+    this.body.addEventListener('wheel', (e) => { if (e.deltaY < 0) this.pinned = false; else if (atEnd()) this.pinned = true; }, { passive: true });
+    this.body.addEventListener('pointerdown', () => { this.dragging = true; });
+    addEventListener('pointerup', () => { if (this.dragging) { this.dragging = false; this.pinned = atEnd(); } });
+    this.body.addEventListener('scroll', () => { if (this.dragging || !this.pinned) this.pinned = atEnd(); }, { passive: true });
     this.tabEls = [...root.querySelectorAll('.tab')];
     this.foot = root.querySelector('.n');
     // minimised: only the tab strip (new lines light their tab); the button, or \\ (kept between visits)
@@ -175,10 +181,10 @@ export class GameLog {
     if ((e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Slash') && !e.repeat && (this.canOpen?.() ?? true)) {
       e.preventDefault(); this.open(e.code === 'Slash' ? '/' : ''); return;
     }
-    if (e.code === 'PageUp') { this.body.scrollTop -= this.body.clientHeight * 0.8; this.wake(); e.preventDefault(); }
-    else if (e.code === 'PageDown') { this.body.scrollTop += this.body.clientHeight * 0.8; this.wake(); e.preventDefault(); }
-    else if (e.code === 'End') { this.body.scrollTop = this.body.scrollHeight; this.wake(); }
-    else if (e.code === 'Backslash') this.setMini(!this.mini);
+    if (e.code === 'PageUp') { this.pinned = false; this.body.scrollTop -= this.body.clientHeight * 0.8; this.wake(); e.preventDefault(); }
+    else if (e.code === 'PageDown') { this.body.scrollTop += this.body.clientHeight * 0.8; this.pinned = this.body.scrollHeight - this.body.scrollTop - this.body.clientHeight < 40; this.wake(); e.preventDefault(); }
+    else if (e.code === 'End') { this.pinned = true; this.body.scrollTop = this.body.scrollHeight; this.wake(); }
+    else if (e.code === 'Backslash' || e.code === 'IntlBackslash') this.setMini(!this.mini); // (IntlBackslash: the \\ key by the left Shift on UK and other ISO keyboards)
     else if (e.code === 'BracketRight') this.setTab((this.tab + 1) % TABS.length);
     else if (e.code === 'BracketLeft') this.setTab((this.tab + TABS.length - 1) % TABS.length);
   }
@@ -229,6 +235,7 @@ export class GameLog {
       p.n++; p.t = now;
       p.text = fmt ? fmt(p.n) : p.text;
       if (p.el) p.el.lastChild.textContent = p.text;
+      if (this.pinned !== false) this.toEnd = true; // (a merged line can grow onto a second row: follow it)
       this.afterSay(p);
       return p;
     }
```

Also, the owner reversed their ruling: **move the course timer and the lap circuit panel to the log** (the earlier exception is gone
from CLAUDE.md). Take `#course` (`basement.js`) and `#circuit` (`circuits.js`) off the screen. The log already says each course station,
split, lap, speed gate, circuit gate, fall and finish.
`circuit.enter` now says the medal times and your best when the event carries them. Please add `par: def.par` and `best:
this.best[def.id]?.time` to it at `circuits.js:120`.

Delete this note in your branch when done.
