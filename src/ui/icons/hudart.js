// ---------------------------------------------------------------------------------------
// THE HUD'S ICONS: the pictures the touch layout's own pieces show (ui/turncard.js), in the icons' hand (ui/icons/hand.js: the light
// shape only; the bevel and the keyline are the hand's):
//   phone      a phone held upright, 10 x 16: its glass dim (the screen waiting), the speaker's slot dark, the bar at its foot lit
//   turn       a quarter turn, 14 x 8: an arc over the top, its arrowhead bright, pointing down the way the phone goes
// The turn card turns `phone` a quarter turn on the page (a whole 90 degrees: its pixels land square again).
//
// Prior art: the rotate-device glyphs of iOS's own orientation lock and of every mobile game's "rotate your device" screen (a phone
// outline and a curved arrow), drawn as a sprite with the consoles' keyline.
//
//   HUD_ART[id] -> rows
// ---------------------------------------------------------------------------------------
export const HUD_ART = {
  phone: [
    '.########.',
    '####xx####',
    '#--------#',
    '#--------#',
    '#--------#',
    '#--------#',
    '#--------#',
    '#--------#',
    '#--------#',
    '#--------#',
    '#--------#',
    '#--------#',
    '#--------#',
    '##########',
    '###++++###',
    '.########.',
  ],
  turn: [
    '....#####.....',
    '..#########...',
    '.###.....###..',
    '.##.......##..',
    '##.........##.',
    '##......++++++',
    '.........++++.',
    '..........++..',
  ],
};
