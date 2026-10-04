// ---------------------------------------------------------------------------------------
// EMOTES: the Courier's body language, asked for in the chatbox (/sit, /dance, /wave...). Each is a clip from the Universal
// Animation Library (CC0, baked onto the Courier by scripts/bake_anims.mjs): some go in, hold and come out (sitting), some loop until
// they move (dancing, talking), some play once (a nod) and some play once and stay (a faint, held on the floor until they get up).
// Moving (WASD, Space) ends any of them, through its way out if it has one.
//
// Prior art: Final Fantasy XI's and XIV's emotes (/sit, /wave, /dance, /bow, typed in the chat line, the motion and a line in the
// log for those who see it, "You sit down."), and the MMO's custom /em ("/em takes a bow." -> "The Courier takes a bow.").
//
//   EMOTES[id] = { enter?, loop?, once?, hold?, exit?, line, aliases }    (clip names: anims.bin; see courier/moves/emote.js for how they play)
// ---------------------------------------------------------------------------------------
export const EMOTES = {
  sit: { enter: 'sitEnter', loop: 'sitIdle', exit: 'sitExit', line: 'You sit down.', aliases: ['rest'] },
  dance: { loop: 'dance', line: 'You dance.', aliases: ['jig'] },
  talk: { loop: 'talk', line: 'You chatter away to no one in particular.', aliases: ['chatter'] },
  kneel: { loop: 'kneel', line: 'You kneel and tinker with something.', aliases: ['tinker', 'fix'] },
  nod: { once: 'nod', line: 'You nod.', aliases: ['yes'] },
  no: { once: 'shakeHead', line: 'You shake your head.', aliases: ['shake'] },
  fold: { loop: 'foldArms', line: 'You fold your arms.', aliases: ['cross', 'wait'] },
  wave: { once: 'call', line: 'You wave.', aliases: ['call', 'hail'] },
  faint: { once: 'faint', hold: true, exit: 'getUp', line: 'You faint dead away.', aliases: ['swoon', 'collapse'] },
};
export const EMOTE_OF = Object.fromEntries(Object.entries(EMOTES).flatMap(([id, e]) => [[id, id], ...(e.aliases || []).map((a) => [a, id])]));
