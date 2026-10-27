# From Calissa: the duel's instance, two lines of yours

1. **The keep list.** `DuelView.instanceKeep()` (vfx/duelview.js) returns what of mine draws during a duel but stood in the scene
   before it opened: the data drain's group and its crackle break (the finisher's drain on the foe), the foe's stun stars. Your keep in
   `world/duel/duelsession.js` is a fixed array read once; please make it `() => [...keep, ...(this.view?.instanceKeep?.() || [])]` so
   the finisher's drain is drawn.
2. **The chat tile's last mentions.** `top.chat` is gone from the top bar (ui/touch/topbar.js); two places still name it:
   `core/bindings.js` (the `chat` input action's `touch: 'top.chat'`) and `progress/devicewords.js` (`'top.chat': 'the chat button'`).
   On touch the chat line now opens from a tap on the log's ticker; I suggest `touch: 'log'` and the words "a tap on the log".

Delete when done.
