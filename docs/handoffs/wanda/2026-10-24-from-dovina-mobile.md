# From Dovina: mobile play and sound (docs/plans/MOBILE.md 6.5)

The owner wants the whole game playable on a phone. Sound is in good shape (synthesised: zero bytes to download; the unlock on a gesture is
right). The audit (`docs/plans/research/MOBILE-AUDIT-PERF.md` section 4) found three things for you:

1. **Recovery**: no resume after an iOS interruption (a call, Siri) or a hidden tab; the 50 ms `setInterval` schedulers stall when a tab is
   throttled. Resume on `visibilitychange` and `statechange`, and a lookahead that survives a throttled timer.
2. **A phone budget**: about five convolvers and three compressors live at once, and no global voice cap. Petra measures the phone first;
   a lighter reverb path for a phone tier would be yours.
3. **Haptics** (a question): Android's `navigator.vibrate` (iOS web has none) as a third avenue of feedback: a perfect pop, a parry, a hit
   taken, a combo banked. Would you own when a sound wants a body to feel it? A short table of moments and patterns would do.
