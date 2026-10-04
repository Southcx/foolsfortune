// ---------------------------------------------------------------------------------------
// THE GLAZES: what the Courier's vessel can be dressed in. The Courier is a vessel (Kaolin Anagami's magnum opus: docs/LORE.md), and
// they are decorated as a pot is: a GLAZE on each REGION of them (the armour of their body, its trim and stones, their mask, their hair), fired on
// at the kiln (courier/vessel/vessel.js, the kiln station: courier/moves/kiln.js). The Lachryma of their body is never glazed. Data only.
//
// The glazes are the real ones, after the potters' own families (each named for what it is): terracotta and bisque (what they are
// unglazed), shino's warm white, celadon's jade, tenmoku's iron black, oribe's copper green, raku's crackled white, oxblood (sang de
// boeuf), jun's moon blue, nuka's rice-husk ash, a copper lustre, and one black with the sheen of Lachryma itself; the medal glazes are the prized ones (hare's fur, oil
// spot, guan, kinrande, ru, yohen tenmoku: the hardest to fire), the shop's the honest everyday ones. Each is GOT a way:
//   start        theirs from the beginning
//   ach          earned: an achievement (achievements.js) gives it, so it is retroactive like they are
//   photo        learned: the Veritome learns a colour from a good photograph (vessel.js: learnFrom)
//   shop         bought at Saggar's kiln (plan A11)
//
// Prior art: the glaze families of East Asian ceramics (shino, oribe, tenmoku, celadon, jun, raku, sang de boeuf), FFXIV's dyes and
// glamour (a look apart from power, a dye per channel), Splatoon's and Animal Crossing's colour-per-part, and the palette swap of the
// sprite era (the same body, a different colour for each of its parts).
//
//   REGIONS[id] = { id, name, kinds, shader }   GLAZES[id] = { id, name, kind, color, rough, metal, glow, blurb, got: { start | ach | photo | shop } }
//   (and, for the other kinds, color2, p, keep; a rare glaze's pattern and its colour2)   DEFAULT_LOOK = { body, trim, stones, mask, hair, skin }
// ---------------------------------------------------------------------------------------
// (each region takes finishes of its own kinds: glazes on the clay, gems in the settings, hair finishes or a glaze on the hair, and the
//  Lachryma of the skin its own tones; the shader each region wears is vfx/finish.js `shader`)
export const REGIONS = {
  body: { id: 'body', name: 'THE BODY', blurb: 'the armour of the vessel', kinds: ['glaze'], shader: 'glaze' },
  trim: { id: 'trim', name: 'THE TRIM', blurb: 'its inlays and edges', kinds: ['glaze'], shader: 'glaze' },
  stones: { id: 'stones', name: 'THE STONES', blurb: 'the gems set in it', kinds: ['gem'], shader: 'gem' },
  mask: { id: 'mask', name: 'THE MASK', blurb: 'the face it shows', kinds: ['glaze'], shader: 'glaze' },
  hair: { id: 'hair', name: 'THE HAIR', blurb: 'the crown of it', kinds: ['hair', 'glaze'], shader: 'hair' },
  skin: { id: 'skin', name: 'THE SKIN', blurb: 'the Lachryma it is filled with', kinds: ['skin'], shader: 'skin' },
};

const G = (id, name, color, rough, metal, blurb, got, glow = 0) => ({ id, name, kind: 'glaze', color, rough, metal, glow, blurb, got });
// a finish of another kind (vfx/finish.js): `color2` its second colour, `p` its four numbers (gem: facets, fire, play of colour, glow
// under the surface; hair: ombre, -, sheen, -; skin: inner light, rim, sheen 0 / 1 pearl / 2 aurora, translucency), `keep` the model's own look
const F = (kind, id, name, color, color2, rough, metal, p, blurb, got, keep = false) => ({ id, name, kind, color, color2, rough, metal, p, blurb, got, keep, glow: 0 });
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
  // MEDAL GLAZES (plan A10): the prized ones, the hardest to fire, for mastery. Blurbs are placeholders for Espada's.
  G('haresfur', "HARE'S FUR", 0x5a3a24, 0.2, 0.3, 'Tenmoku drawn into fine gold-brown streaks as it runs, like the fur of a hare. Song potters raced to fire it.', { ach: 'c_braid_g' }),
  G('oilspot', 'OIL SPOT', 0x221a18, 0.18, 0.45, 'Black, scattered with silver spots where iron rose and bloomed in the fire, like oil drops on dark water.', { ach: 'c_mill_g' }),
  G('guan', 'GUAN', 0x9fb0a8, 0.3, 0.02, 'The official ware: grey-green, crazed all over with a fine dark net, the crackle fired in on purpose.', { ach: 'c_spindle_g' }),
  G('kinrande', 'KINRANDE', 0xa8281c, 0.28, 0.1, 'Gold brocade: leaf gold laid over red enamel and fired a last time, low and gentle. For a lamplighter.', { ach: 'tr4' }),
  G('ru', 'RU', 0x9cc0dc, 0.3, 0.02, 'The blue of the sky after rain. Fired for twenty years at one kiln for one court; fewer than a hundred pieces survive.', { ach: 'cx5' }),
  G('yohen', 'YOHEN TENMOKU', 0x141c36, 0.12, 0.4, 'Kiln-changed: black, with blue stars haloed in it, as if the night were trapped in the glaze. Three bowls in the world.', { ach: 'gr3' }, 0.08),
  // SHOP GLAZES (plan A11): honest everyday glazes, bought at Saggar's kiln (price: ECON.goods.glaze). Blurbs are placeholders for Espada's.
  G('ash', 'NATURAL ASH', 0x7d7a4a, 0.45, 0.02, 'No glaze at all: wood ash fell on the pot in the kiln and melted, running green down one side.', { shop: true }),
  G('kaki', 'KAKI', 0xa0522d, 0.4, 0.05, 'Persimmon: a rust-red iron glaze, matte as the fruit. A farmhouse colour.', { shop: true }),
  G('ame', 'AME', 0x9a5a1e, 0.18, 0.08, 'Amber, glossy as boiled sugar: an iron glaze fired with plenty of air.', { shop: true }),
  G('cobalt', 'COBALT', 0x2a4a9a, 0.22, 0.03, 'The blue of blue-and-white: cobalt under a clear glaze, carried by traders from Persia to every port.', { shop: true }),
  G('majolica', 'MAJOLICA', 0xf5efe2, 0.3, 0, 'A white tin glaze, opaque and bright, made to look like porcelain by potters who had none.', { shop: true }),
  G('salt', 'SALT GLAZE', 0x9c7a52, 0.5, 0.05, 'Salt thrown into the hot kiln: it turns to glass on the pot, pitted like orange peel.', { shop: true }),
  // GEMS for the stones (real gemstones, with their real optics: fire is dispersion, play is opal's, glow is moonstone's adularescence).
  // All owned for now (playtest); Dovina decides which are earned and which bought. Blurbs are placeholders for Espada's.
  F('gem', 'maker', "THE MAKER'S STONES", 0xffffff, 0xffffff, 0.3, 0, [0, 0, 0, 0], 'The stones you were set with: the Prince chose them.', { start: true }, true),
  F('gem', 'ruby', 'RUBY', 0xc0102a, 0xff6070, 0.05, 0, [2.6, 0.5, 0, 0], 'Corundum stained red by a trace of chromium; it glows red even in ultraviolet.', { start: true }),
  F('gem', 'sapphire', 'SAPPHIRE', 0x1a3aa8, 0x6a8aff, 0.05, 0, [2.6, 0.5, 0, 0], 'The same stone as ruby, blue with iron and titanium.', { start: true }),
  F('gem', 'emerald', 'EMERALD', 0x0f8a4a, 0x60e0a0, 0.06, 0, [2.2, 0.3, 0, 0], 'Green beryl, almost never without its inclusions: the jardin, the garden inside it.', { start: true }),
  F('gem', 'amethyst', 'AMETHYST', 0x7a3ab8, 0xc090ff, 0.05, 0, [2.6, 0.4, 0, 0], 'Purple quartz; the Greeks thought it kept you sober.', { start: true }),
  F('gem', 'citrine', 'CITRINE', 0xe8a020, 0xffe080, 0.05, 0, [2.6, 0.4, 0, 0], 'Yellow quartz, the colour of honey held to the light.', { start: true }),
  F('gem', 'diamond', 'DIAMOND', 0xe8eef8, 0xffffff, 0.02, 0, [3.2, 1.0, 0, 0], 'Clear, and full of fire: it splits white light into colours more than any other stone.', { start: true }),
  F('gem', 'opal', 'OPAL', 0xdcd8e8, 0x90c0ff, 0.15, 0, [1.4, 0.2, 1.0, 0], 'Silica spheres stacked like oranges, small enough to break the light into flashes of every colour.', { start: true }),
  F('gem', 'moonstone', 'MOONSTONE', 0xe0e4ee, 0x6a9aff, 0.12, 0, [1.2, 0.1, 0, 1.0], 'Feldspar in fine layers; a blue light seems to float just under its surface.', { start: true }),
  F('gem', 'onyx', 'ONYX', 0x0c0a0e, 0x403848, 0.08, 0.1, [2.0, 0.1, 0, 0], 'Black chalcedony, polished to a mirror.', { start: true }),
  // HAIR finishes (the hair can still take any glaze as well)
  F('hair', 'satin', 'SATIN', 0xe8d8bc, 0xe8d8bc, 0.45, 0, [0, 1, 0, 0], 'Pale and soft, with a sheen that slides as you turn.', { start: true }),
  F('hair', 'raven', 'RAVEN', 0x101420, 0x101420, 0.3, 0.05, [0, 1, 0, 0], 'Blue-black, with a blue light along it like a crow\'s wing.', { start: true }),
  F('hair', 'copper', 'COPPER', 0xa04a20, 0xa04a20, 0.35, 0.2, [0, 1, 0, 0], 'Red as a new penny, brightest where the light runs along it.', { start: true }),
  F('hair', 'ashen', 'ASHEN', 0x9a9690, 0x9a9690, 0.55, 0, [0, 1, 0, 0], 'The grey of wood ash, no sheen to speak of.', { start: true }),
  F('hair', 'inkgold', 'INK TO GOLD', 0x14101c, 0xd8a840, 0.35, 0.15, [1, 1, 0, 0], 'Ink at the root, run to gold at the tips: dipped, the way a brush is.', { start: true }),
  F('hair', 'clayrose', 'BISQUE TO ROSE', 0xf3c9a8, 0xd06080, 0.45, 0, [1, 1, 0, 0], 'Pale at the root and flushed at the tips.', { start: true }),
  F('hair', 'slick', 'OIL SLICK', 0x18121e, 0x18121e, 0.2, 0.1, [0, 1, 1, 0], 'Black, with every colour of oil on water sliding through it.', { start: true }),
  // SKIN tones for the Lachryma of the body
  F('skin', 'lachryma', 'LACHRYMA', 0xffffff, 0xffffff, 0.4, 0, [0, 0, 0, 0], 'What you are filled with, as you were filled.', { start: true }, true),
  F('skin', 'moonlight', 'MOONLIGHT', 0xdfe6f2, 0x7aa0ff, 0.35, 0, [0.5, 0.6, 0, 0], 'Cool and pale, lit blue from inside.', { start: true }),
  F('skin', 'ember', 'EMBER', 0xf2c8a0, 0xff7a30, 0.4, 0, [0.6, 0.7, 0, 0], 'Warm, with a coal\'s glow under it.', { start: true }),
  F('skin', 'porcelain', 'PORCELAIN', 0xf6f2ec, 0xfff0e0, 0.25, 0, [0.15, 0.25, 0, 0.7], 'White and translucent, barely lit: the Court\'s own.', { start: true }),
  F('skin', 'obsidian', 'OBSIDIAN', 0x16121c, 0x9a60ff, 0.2, 0.05, [0.3, 0.8, 0, 0], 'Dark glass, with violet at the edges.', { start: true }),
  F('skin', 'pearl', 'PEARL', 0xf2ece8, 0xffe8f0, 0.3, 0, [0.3, 0.4, 1, 0], 'Nacre: layer on layer, catching the light pink and blue.', { start: true }),
  F('skin', 'aurora', 'AURORA', 0xe8eef2, 0x80ffd0, 0.3, 0, [0.4, 0.5, 2, 0], 'Every colour of the polar sky, moving at the edges of you.', { start: true }),
].map((g) => [g.id, g]));
// the rare glazes' kiln patterns (vfx/finish.js PATTERN: 1 stars, 2 spots, 3 streaks, 4 crackle, 5 leaf) and the colour each is drawn in
const PATTERNS = { yohen: [1, 0x46b4ff], oilspot: [2, 0xc4c8d0], haresfur: [3, 0xc08a48], guan: [4, 0x2c2622], raku: [4, 0x3a3634], ru: [4, 0x7890a0], kinrande: [5, 0xe8b850] };
for (const [id, [pattern, color2]] of Object.entries(PATTERNS)) Object.assign(GLAZES[id], { pattern, color2 });

/** How they are dressed until they fire anything else: as they were made. */
export const DEFAULT_LOOK = { body: 'terracotta', trim: 'bisque', stones: 'maker', mask: 'terracotta', hair: 'bisque', skin: 'lachryma' };
