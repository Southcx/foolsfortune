// ---------------------------------------------------------------------------------------
// THE PEOPLE: who the clay folk are and where they stand (what they say is npc/talks.js). A folk's glaze is what it is made of and
// its hat is what it does; its voice is a register and a scale (npc/clayese.js), its temper the feeling it wears when no one is
// talking to it (Pip is always a little afraid, Old Grog a little sad, Raku a little sly).
// ---------------------------------------------------------------------------------------
import { BASE_Y } from '../world/basement/basement.js';
import { WEIR_SPAWN } from '../tools/sondelass/angling/weir.js';

export const PEOPLE = [
  {
    id: 'saggar', name: 'Mistress Saggar', title: 'keeper of the kiln',
    pos: () => [1.8, 0, 6.6], yaw: Math.PI * 1.08, scale: 2.1,
    glaze: 0x86ad93, rough: 0.3, hat: 'scarf', hatColor: 0x8a2a1c, // (celadon, an oxblood headscarf)
    voice: { base: 70, scale: 'hexa', bell: 0.85, clay: 0.4 }, temper: 'calm',
  },
  {
    id: 'pip', name: 'Pip', title: 'apprentice potter',
    pos: (g) => { const c = g.course?.console || { x: 0, z: 0 }; return [c.x + 4.2, BASE_Y, c.z + 2.2]; }, yawTo: 'console', scale: 1.55,
    glaze: 0xe6cfae, rough: 0.85, hat: 'cap', hatColor: 0x6f3726, // (raw bisque: not glazed yet, like its courage)
    voice: { base: 79, scale: 'yo', bell: 0.55, clay: 0.75 }, temper: 'fear',
  },
  {
    id: 'grog', name: 'Old Grog', title: 'angler of the Weir',
    pos: () => [WEIR_SPAWN.pos[0] + 4.5, WEIR_SPAWN.pos[1], WEIR_SPAWN.pos[2] + 3.5], yaw: Math.PI * 1.15, scale: 2.2,
    glaze: 0x3a2418, rough: 0.25, metal: 0.25, hat: 'straw', hatColor: 0xd9b26a, // (tenmoku: black-brown, rust where it runs thin)
    voice: { base: 58, scale: 'in', bell: 0.8, clay: 0.35, decay: 1.3 }, temper: 'sad',
  },
  {
    id: 'raku', name: 'Raku', title: 'treasurer of the Weir',
    pos: (g) => { const t = g.chests?.tithe; if (!t) return [WEIR_SPAWN.pos[0] - 6, WEIR_SPAWN.pos[1], WEIR_SPAWN.pos[2] + 30]; const s = { x: t.front.z, z: -t.front.x }; return [t.pos.x + s.x * 1.7 + t.front.x * 0.6, t.pos.y, t.pos.z + s.z * 1.7 + t.front.z * 0.6]; },
    yawTo: 'front', scale: 2.0,
    glaze: 0xeae3d6, rough: 0.2, metal: 0.4, hat: 'fez', hatColor: 0x9a2a2a, // (raku: crackled white, a copper lustre)
    voice: { base: 75, scale: 'hexaMolle', bell: 0.7, clay: 0.55 }, temper: 'sly',
  },
  // Margarite's dock (world/emocean/margarite.js): the King's buyer behind the counter, and the bounty-poster by her board
  {
    id: 'purser', name: 'the Purser', title: "the King's buyer",
    pos: (g) => g.margarite.spot('purser').pos.toArray(), yaw: Math.PI, scale: 2.0,
    glaze: 0xe6e0d6, rough: 0.2, metal: 0.3, hat: 'cap', hatColor: 0x3f6a4a, // (nacre, buttoned up; a sage cap)
    voice: { base: 66, scale: 'hexa', bell: 0.9, clay: 0.3 }, temper: 'calm',
  },
  {
    id: 'letty', name: 'Letty Marque', title: 'bounty-poster of Margarite',
    pos: (g) => g.margarite.spot('letty').pos.toArray(), yaw: 0, scale: 1.9,
    glaze: 0x8a2a2a, rough: 0.35, hat: 'straw', hatColor: 0x2a2420, // (an oxblood glaze, a dark brim)
    voice: { base: 72, scale: 'in', bell: 0.6, clay: 0.6 }, temper: 'sly',
  },
];

/** Where each stands, now that the rooms are built (some stand by things: the index console, the Tithe). */
export function placePeople(game, folk) {
  for (const d of PEOPLE) {
    try {
      const pos = d.pos(game);
      let yaw = d.yaw ?? 0;
      if (d.yawTo === 'console' && game.course?.console) yaw = Math.atan2(game.course.console.x - pos[0], game.course.console.z - pos[2]);
      if (d.yawTo === 'front' && game.chests?.tithe) yaw = Math.atan2(game.chests.tithe.front.x, game.chests.tithe.front.z);
      folk.spawn({ ...d, pos, yaw });
    } catch (e) { console.warn('folk', d.id, e); }
  }
}
