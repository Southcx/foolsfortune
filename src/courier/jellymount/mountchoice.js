// ---------------------------------------------------------------------------------------
// THE MOUNTS' CHOICE (progress/jellymount.js JELLY_MOUNT.call: Y held past `call.hold` shows the two mounts; the let go calls the one
// shown): the Solar Skiff and the slip jelly as two choice cards in a strip low in the view, the one the let go would call lit. The mouse
// moved sideways, A or D, or a thumb's push on the stick picks; it is a placeholder for Calissa's own look (a ring round the Courier), its
// words placeholders for Espada's.
//
// Prior art: the quick pick (tools/soulbrush/radial.js: held, flicked, let go), Red Dead Redemption 2's horse whistle held for a choice.
//
//   const C = new MountChoice(game, first)   C.steer(input, player) (each step while Y is held)   C.pick ('skiff' | 'jelly')   C.close()
// ---------------------------------------------------------------------------------------
import { ChoiceCard } from '../../ui/choicecard.js';
import { JELLY_MOUNT } from '../../progress/jellymount.js';

const ROWS = [
  { id: 'skiff', name: 'Solar Skiff', does: 'Sail the sand on the sun: fast, and the faster for the wind.', icon: 'touch.skiff', key: 'Y' },
  { id: 'jelly', name: 'Slip jelly', does: `Ride any open ground: fast in paint and crude, which it drinks. Health ${JELLY_MOUNT.hp.max}.`, key: 'Y' },
];
const STEP = 40; // (pixels of the mouse's sideways move to change the pick, the quick pick's)
const CSS = `#mountchoice{position:fixed;left:50%;bottom:18%;transform:translateX(-50%);display:flex;gap:12px;z-index:30;pointer-events:none}
#mountchoice .ccard{width:220px;opacity:.6;transition:opacity .12s,transform .12s}#mountchoice .ccard.lit{opacity:1;transform:translateY(-6px);outline:2px solid var(--gold,#e8c36a)}`;

export class MountChoice {
  constructor(game, first = 'jelly') {
    this.game = game; this.pick = first; this.acc = 0; this.was = 0;
    if (!document.getElementById('mountchoice-css')) { const s = document.createElement('style'); s.id = 'mountchoice-css'; s.textContent = CSS; document.head.appendChild(s); }
    this.el = document.createElement('div'); this.el.id = 'mountchoice';
    this.cards = ROWS.map((r) => { const c = new ChoiceCard(r); c.el.dataset.id = r.id; this.el.appendChild(c.el); return c; });
    document.body.appendChild(this.el);
    if (game.player?.lookScale) game.player.lookScale.wheel = 0; // (the mouse picks while it is open, not the camera)
    this.show();
  }
  show() { for (const c of this.cards) c.el.classList.toggle('lit', c.el.dataset.id === this.pick); }
  set(id) { if (id !== this.pick) { this.pick = id; this.show(); } }
  /** The mouse's sideways move, A or D, or the stick: left the skiff, right the jelly. */
  steer(inp, P) {
    this.acc += inp.dx || 0;
    if (this.acc <= -STEP) { this.acc = 0; this.set('skiff'); } else if (this.acc >= STEP) { this.acc = 0; this.set('jelly'); }
    const x = inp.axis ? inp.axis('moveX') : 0, k = (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0) || (Math.abs(x) > 0.5 ? Math.sign(x) : 0);
    if (k && k !== this.was) this.set(k < 0 ? 'skiff' : 'jelly');
    this.was = k;
  }
  close() { this.el.remove(); if (this.game.player?.lookScale) this.game.player.lookScale.wheel = 1; }
}
