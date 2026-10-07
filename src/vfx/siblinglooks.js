// ---------------------------------------------------------------------------------------
// THE SIBLINGS' LOOKS: the five Couriers of the owner's party, one per division (the owner, 2026-10-07: co-op, coop/party.js SIBLINGS).
// Each is the Courier's own model, dressed by the vessel like the Courier (`vessel.dress(rig, look, { own: true })`: courier/vessel/
// glazes.js, every finish a real one), so a sibling costs no program of its own. A look is a whole firing, every region, and each one is
// its sister's voice in clay, told apart at a glance by lightness and warmth as well as hue (docs/ART.md: readable without colour):
//
//   petra    the stonemason: natural ash over stoneware, salt-glazed trim, an iron-black tenmoku mask, onyx set in it, obsidian within:
//            the darkest and plainest of the five, fired hard
//   dovina   the gambler: Lachryma black, the game's own glaze, like a black jacket at the table, kinrande's gold leaf over red at its
//            edges, an opal's play of colour for its stones, and the rarest bowl in the world for a face (yohen tenmoku: the long odds)
//   wanda    the bandleader's fire: oxblood's copper red, persimmon kaki trim, a warm shino mask that burns orange where thin,
//            copper hair, citrine, ember within: the warmest
//   calissa  the glazer: jun's moon blue, thick and opalescent, ru's sky after rain at the edges, a celadon mask, moonstone's glow,
//            clay-rose hair, pearl within: the bluest and coolest
//   espada   the librarian: guan, the scholars' ware crazed on purpose, cobalt blue-and-white trim (the ink of a written pot), a white
//            majolica mask like a page, sapphires, ink-and-gold hair, moonlight within
//
// Prior art: the tarot's four suits (pentacles earth, cups water, wands fire, swords air) and the trumps; Monster Hunter's palico and
// Persona's party (one silhouette, told apart by colour and finish); and the glazes themselves (ART.md section 4).
//
//   SIBLING_LOOKS[id] -> { body, trim, stones, mask, hair, skin }   (glaze ids; dressed with { own: true })
// ---------------------------------------------------------------------------------------

export const SIBLING_LOOKS = {
  petra: { body: 'ash', trim: 'salt', stones: 'onyx', mask: 'tenmoku', hair: 'ashen', skin: 'obsidian' },
  dovina: { body: 'lachryma', trim: 'kinrande', stones: 'opal', mask: 'yohen', hair: 'raven', skin: 'aurora' },
  wanda: { body: 'oxblood', trim: 'kaki', stones: 'citrine', mask: 'shino', hair: 'copper', skin: 'ember' },
  calissa: { body: 'jun', trim: 'ru', stones: 'moonstone', mask: 'celadon', hair: 'clayrose', skin: 'pearl' },
  espada: { body: 'guan', trim: 'cobalt', stones: 'sapphire', mask: 'majolica', hair: 'inkgold', skin: 'moonlight' },
};
