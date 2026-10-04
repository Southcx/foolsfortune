// ---------------------------------------------------------------------------------------
// THE GLAZES: what the Courier's vessel can be dressed in. The Courier is a vessel (Kaolin Anagami's magnum opus: docs/LORE.md), and
// they are decorated as a pot is: a GLAZE on each REGION of them (the armour of their body, its trim and stones, their mask, their hair), fired on
// at the kiln (courier/vessel/vessel.js, the kiln station: courier/moves/kiln.js). The Lachryma of their body is never glazed. Data only.
//
// The glazes are the real ones, after the potters' own families (each named for what it is): terracotta and bisque (what they are
// unglazed), shino's warm white, celadon's jade, tenmoku's iron black, oribe's copper green, raku's crackled white, oxblood (sang de
// boeuf), jun's moon blue, nuka's rice-husk ash, a copper lustre, and one black with the sheen of Lachryma itself. Each is GOT a way:
//   start        theirs from the beginning
//   ach          earned: an achievement (achievements.js) gives it, so it is retroactive like they are
//   photo        learned: the Veritome learns a colour from a good photograph (vessel.js: learnFrom)
//   shop         bought (Saggar's kiln: next round)
//
// Prior art: the glaze families of East Asian ceramics (shino, oribe, tenmoku, celadon, jun, raku, sang de boeuf), FFXIV's dyes and
// glamour (a look apart from power, a dye per channel), Splatoon's and Animal Crossing's colour-per-part, and the palette swap of the
// sprite era (the same body, a different colour for each of its parts).
//
//   REGIONS[id] = { id, name }      GLAZES[id] = { id, name, color, rough, metal, glow, blurb, got: { start | ach | photo | shop } }
//   DEFAULT_LOOK = { body, trim, mask, hair }
// ---------------------------------------------------------------------------------------
export const REGIONS = {
  body: { id: 'body', name: 'THE BODY', blurb: 'the armour of the vessel' },
  trim: { id: 'trim', name: 'THE TRIM', blurb: 'its inlays and its stones' },
  mask: { id: 'mask', name: 'THE MASK', blurb: 'the face it shows' },
  hair: { id: 'hair', name: 'THE HAIR', blurb: 'the crown of it' },
};

const G = (id, name, color, rough, metal, blurb, got, glow = 0) => ({ id, name, color, rough, metal, glow, blurb, got });
export const GLAZES = Object.fromEntries([
  G('terracotta', 'TERRACOTTA', 0xb4603f, 0.65, 0.05, 'Red earthenware, unglazed: what the Prince fired you in.', { start: true }),
  G('bisque', 'BISQUE', 0xf3c9a8, 0.4, 0, 'Fired once and left pale, the way a pot waits for its glaze. Lachryma shows through it.', { start: true }, 0.18),
  G('shino', 'SHINO', 0xe9dccb, 0.7, 0, 'A thick white feldspar glaze, pitted, with a blush of orange where it ran thin.', { start: true }),
  G('celadon', 'CELADON', 0x86ad93, 0.25, 0.02, 'Jade-green, from a little iron fired without air. The glaze of Mistress Saggar.', { ach: 'ac1' }),
  G('tenmoku', 'TENMOKU', 0x3a2418, 0.2, 0.25, 'Iron-black, rusting where it runs thin over an edge. Old Grog wears it, and has for a long time.', { ach: 'sp2' }),
  G('raku', 'RAKU', 0xeae3d6, 0.2, 0.35, 'Crackled white, pulled from the kiln red-hot and dropped in sawdust. Raku wears it, vainly.', { ach: 'sp3' }),
  G('oribe', 'ORIBE', 0x4f7a3a, 0.35, 0.05, 'Copper green, pooled dark in the hollows, as if left out in the rain on purpose.', { ach: 'vl1' }),
  G('oxblood', 'OXBLOOD', 0x8a1f1f, 0.25, 0.05, "Sang de boeuf: copper red, the hardest red to fire. Half the kiln's failures were meant to be this.", { ach: 'td1' }),
  G('jun', 'JUN', 0x7f9ccf, 0.3, 0.02, 'Moon blue, thick and opalescent, from a glaze that will not quite melt.', { ach: 'cl1' }),
  G('nuka', 'NUKA', 0xc7c0a8, 0.6, 0, 'Rice-husk ash: a milky, stony white. Humble, and it knows it.', { ach: 'br1' }),
  G('lustre', 'COPPER LUSTRE', 0xb87333, 0.3, 0.65, 'A film of copper smoked onto the glaze. It looks expensive. Raku says it is.', { ach: 'tu2' }),
  G('lachryma', 'LACHRYMA BLACK', 0x15101c, 0.15, 0.3, 'Black, with the sheen of oil on water. A lesser pot would go mad in it; you can bear it.', { ach: 'td6' }),
].map((g) => [g.id, g]));

/** How they are dressed until they fire anything else: as they were made. */
export const DEFAULT_LOOK = { body: 'terracotta', trim: 'bisque', mask: 'terracotta', hair: 'bisque' };
