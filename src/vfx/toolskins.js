// ---------------------------------------------------------------------------------------
// A TOOL'S SKIN: the look table (the owner, 2026-10-24: "Pull out all the stops and go as hard as you can on customization options, you
// can get weird with it, worst case we dial back later"). A skin is one coherent finish laid over every part of one of the seven psychic
// tools, looks only: never a tool's rules, timings or reach, never its shape (the psygun's variants keep their own bodies, the Lockheart's
// coffins their own emblems). Keyed by the tool (tools/belt.js ids), then by the skin; `stock` is each tool as it was built.
//
// A skin names a finish for each of the tool's ROLES (a role is a set of its materials, named by the model that wears it:
// vfx/toolskinwear.js wearSkin):
//   psygun      body (the one body mesh, the variants' too), grip (a zone of that body: the grip, the Carbine's stock), trim (the iron
//               sights; on the cylinder, its brass), glow (the energy's colour: the chambers' light and the charge)
//   sondelass   wood and steel (the rod's sections, alternately; steel the grapnel's tines), wrap (the grip, the crank's knob), brass (the
//               guard, the rings, the pommel, the knuckle bow, the grapnel's ring), clay (the reel's spool), blade (the cutlass, its glow)
//   soulbrush   wood (the haft), wrap (the grip), bind (the three bindings, the cord), brass (the ferrule, the butt cap), hair (the tuft,
//               its ink kept as light and shade)
//   veritome    leather (the covers), spine, dark (the boards' edges), brass (the corners, the instruments), pages (the page block)
//   dreamvane   wood (the staff, the crook), wrap (the leather where the hands go), steel (the pick, the fork's tines), brass (the bands,
//               the hoop, the fork's stem, the vane's rose), feather, bead (the dreamcatcher's heart, its glow), web
//   crucibelle  bronze (the bell), brass (its ring, stem, lip, chain and the metronome), dark (the clapper)
//   lockheart   body (the coffin), trim (its lid and bail), chain
// A role's finish: c its colour, b the pattern's colour, p the pattern (vfx/toolpatterns.js TOOL_PATTERN), s the pattern's scale (cells
// a metre), metal and rough (the surface, or the material's own), e and ei (an emissive colour and its strength, or the material's own),
// keep and mid (how much of the painting's light and shade to keep, and its midpoint: the brush's ink). A role a skin leaves out keeps
// its stock look. Colours are sRGB hex.
//
// Rows (a skin's name and line) are plain until the owner rules (CLAUDE.md, "Plain names until settled"); how each is OPENED is Dovina's
// (proposed in docs/handoffs/dovina/2026-10-24-from-calissa-tool-skins.md). DEBUG wears any: /toolskin <tool> <skin>.
//
// Prior art, as on a museum label: a weapon skin over one rig (Counter-Strike's finishes, Destiny's ornaments and shaders, Valorant's
// bundles: one finish read across every part), and the real crafts each skin is named for (see vfx/toolpatterns.js's label).
//
//   TOOL_SKINS[tool][id] -> { label, line, roles }   TOOL_LABEL[tool]   skinOf(tool, id) -> the skin (stock for an unknown id)
//   skinIds(tool) -> [ids], stock first
// ---------------------------------------------------------------------------------------

/** Each tool as the log names it. */
export const TOOL_LABEL = { psygun: 'psygun', sondelass: 'Sondelass', soulbrush: 'Soul Brush', veritome: 'Veritome', dreamvane: 'Dreamvane', crucibelle: 'Crucibelle', lockheart: 'Lockheart' };

const STOCK = { label: 'Stock', line: 'As it was made.', roles: null };

export const TOOL_SKINS = {
  psygun: {
    stock: STOCK,
    walnut: { label: 'Brass and Walnut', line: 'A brass frame, a walnut grip.', roles: {
      body: { c: 0xc9a14a, p: 'hammered', s: 40, metal: 0.85, rough: 0.3 }, grip: { c: 0x6a4026, b: 0x2a170c, p: 'grain', s: 20 },
      trim: { c: 0xe2c06a, metal: 0.9, rough: 0.25 }, glow: { c: 0xffe2a0, e: 0xffc860 } } },
    blued: { label: 'Blued Steel and Bone', line: 'Blued steel, a bone grip.', roles: {
      body: { c: 0x1d2a40, p: 'hammered', s: 60, metal: 0.9, rough: 0.25 }, grip: { c: 0xe8dcc0, b: 0x6b5a40, p: 'bone', s: 10 },
      trim: { c: 0xb8c0cc, metal: 0.9, rough: 0.2 }, glow: { c: 0xd8f0ff, e: 0x9fd8ff } } },
    porcelain: { label: 'Cobalt Porcelain', line: 'Blue-and-white porcelain, dragons\' scales in cobalt.', roles: {
      body: { c: 0xf4f1ea, b: 0x1a3a9a, p: 'cobalt', s: 12, metal: 0, rough: 0.15 }, grip: { c: 0x203d94, b: 0xf4f1ea, p: 'cobalt', s: 14 },
      trim: { c: 0x1a3a9a, metal: 0, rough: 0.2 }, glow: { c: 0xd8e6ff, e: 0x7fb0ff } } },
    raku: { label: 'Raku', line: 'Smoked raku crackle with a copper flash.', roles: {
      body: { c: 0x2b2622, b: 0xd8a060, p: 'raku', s: 10, metal: 0, rough: 0.5 }, grip: { c: 0xd9d0c0, p: 'raku', s: 12 },
      trim: { c: 0xb87333, metal: 0.8, rough: 0.35 }, glow: { c: 0xffd0a0, e: 0xff8a3a } } },
    kintsugi: { label: 'Kintsugi', line: 'Black ware broken and mended in gold, a lacquered grip.', roles: {
      body: { c: 0x23201e, b: 0xf2c35a, p: 'kintsugi', s: 8, metal: 0.1, rough: 0.35 }, grip: { c: 0x6e1d14, p: 'makie', s: 6 },
      trim: { c: 0xf2c35a, metal: 0.95, rough: 0.2 }, glow: { c: 0xfff0c0, e: 0xffe08a } } },
    reef: { label: 'Coral Reef', line: 'Coral grown over the frame, a mother-of-pearl grip.', roles: {
      body: { c: 0xe8735a, b: 0xf3ecf7, p: 'coral', s: 30, metal: 0, rough: 0.6 }, grip: { c: 0xf0e6f2, p: 'pearl', s: 25 },
      trim: { c: 0x7fd6c8, metal: 0.2, rough: 0.2 }, glow: { c: 0xd0fff6, e: 0x7ff2e0 } } },
    data: { label: 'Corrupt Data', line: 'The data showing through: scanlines and a circuit grip.', roles: {
      body: { c: 0x0c0c14, b: 0x39ff9a, p: 'glitch', s: 10, metal: 0.3, rough: 0.4 }, grip: { c: 0x12261c, p: 'circuit', s: 30 },
      trim: { c: 0x39ff9a, metal: 0.2, rough: 0.3 }, glow: { c: 0xc8ffe0, e: 0x39ff9a } } },
  },
  sondelass: {
    stock: STOCK,
    tamahagane: { label: 'Hamon and Damascus', line: 'A folded blade with its temper line; black lacquer and indigo cord.', roles: {
      blade: { c: 0xd7dce2, b: 0x3a3f47, p: 'hamon', s: 30, metal: 0.85, rough: 0.2, e: 0x9fb4c8, ei: 0.08 },
      steel: { c: 0x8a8f98, b: 0x3a3f47, p: 'damascus', s: 30, metal: 0.85, rough: 0.25 }, wood: { c: 0x161214, b: 0xc9a14a, p: 'makie', s: 12, rough: 0.2 },
      wrap: { c: 0x2a2f5a, b: 0x0e1024, p: 'weave', s: 60 }, brass: { c: 0x3a3634, p: 'hammered', s: 40, metal: 0.7, rough: 0.4 }, clay: { c: 0x1a1818, rough: 0.3 } } },
    obsidian: { label: 'Obsidian', line: 'Volcanic glass, edge to grip, a rainbow in its sheen.', roles: {
      blade: { c: 0x0d0b12, b: 0x8a5cff, p: 'obsidian', s: 6, metal: 0, rough: 0.05, e: 0x3a1a6a, ei: 0.15 },
      steel: { c: 0x14111a, b: 0x8a5cff, p: 'obsidian', s: 8, metal: 0, rough: 0.05 }, wood: { c: 0x22202a, b: 0x5ad0ff, p: 'obsidian', s: 6, metal: 0, rough: 0.08 },
      wrap: { c: 0x3a3540, b: 0x7a6aa0, p: 'scales', s: 40 }, brass: { c: 0xa8a8b8, metal: 0.9, rough: 0.2 }, clay: { c: 0x101014, b: 0x8a5cff, p: 'obsidian', s: 8 } } },
    bamboo: { label: 'Living Bamboo', line: 'Green bamboo still growing, moss on the grip.', roles: {
      blade: { c: 0x9ec96a, b: 0x5e7a2e, p: 'bamboo', s: 4, metal: 0, rough: 0.35, e: 0x6aff8a, ei: 0.05 },
      wood: { c: 0x7ea84a, b: 0x40561e, p: 'bamboo', s: 4, metal: 0, rough: 0.4 }, steel: { c: 0xc8b47a, b: 0x7a6a3a, p: 'bamboo', s: 6, metal: 0, rough: 0.5 },
      wrap: { c: 0x3e5a24, b: 0x8fd060, p: 'moss', s: 6 }, brass: { c: 0x6b4a2a, b: 0x3a2814, p: 'grain', s: 30, metal: 0, rough: 0.7 }, clay: { c: 0x8a6a3a, b: 0x3a2814, p: 'weave', s: 50 } } },
    moonlit: { label: 'Moonlit Silver', line: 'Silver frosted by the moon, a midnight sky down the rod.', roles: {
      blade: { c: 0xdfe6f2, b: 0x9fc4ff, p: 'frost', s: 20, metal: 0.95, rough: 0.15, e: 0x8fb8ff, ei: 0.25 },
      steel: { c: 0xc8d0dc, p: 'hammered', s: 40, metal: 0.95, rough: 0.2 }, wood: { c: 0x1a2236, b: 0x5a7ad8, p: 'starfield', s: 6, metal: 0, rough: 0.3 },
      wrap: { c: 0x1c2440, b: 0x050810, p: 'weave', s: 60 }, brass: { c: 0xd8dde6, metal: 0.95, rough: 0.15 }, clay: { c: 0x2a3350, rough: 0.4 } } },
    motley: { label: 'Jester\'s Motley', line: 'The Fool\'s diamonds, red and black, gold between.', roles: {
      blade: { c: 0xd8282c, b: 0x161216, p: 'harlequin', s: 10, metal: 0.2, rough: 0.3, e: 0x000000, ei: 0 },
      wood: { c: 0x2a6ad8, b: 0xf2c35a, p: 'harlequin', s: 14, metal: 0.1 }, steel: { c: 0xf2c35a, metal: 0.95, rough: 0.2 },
      wrap: { c: 0x7a2a9a, b: 0x2a9a5a, p: 'harlequin', s: 30 }, brass: { c: 0xf2c35a, metal: 0.95, rough: 0.2 }, clay: { c: 0x2a9a5a, rough: 0.4 } } },
    molten: { label: 'Molten', line: 'A blade still cooling, its cracks alight.', roles: {
      blade: { c: 0x1a0e0a, b: 0xff6a1a, p: 'molten', s: 8, metal: 0.2, rough: 0.6, e: 0xff4a10, ei: 0.2 },
      steel: { c: 0x221410, b: 0xff6a1a, p: 'molten', s: 10, metal: 0.2, rough: 0.6 }, wood: { c: 0x231a16, b: 0xd86a2a, p: 'raku', s: 8, metal: 0 },
      wrap: { c: 0x2a1a14, b: 0x120a08, p: 'weave', s: 60 }, brass: { c: 0x5a3a2a, p: 'hammered', s: 40, metal: 0.6 }, clay: { c: 0x1a0e0a, b: 0xff6a1a, p: 'molten', s: 10 } } },
  },
  soulbrush: {
    stock: STOCK,
    lacquer: { label: 'Lacquer and Horsehair', line: 'Red urushi dusted with gold, a horsehair tuft.', roles: {
      wood: { c: 0x5a0f0c, b: 0xd8b25a, p: 'makie', s: 6, metal: 0, rough: 0.15 }, wrap: { c: 0x161012, b: 0x050404, p: 'weave', s: 50 },
      bind: { c: 0xd8b25a, metal: 0.8, rough: 0.3 }, brass: { c: 0x1a1414, metal: 0.1, rough: 0.15 }, hair: { c: 0x9a7a56, keep: 1, mid: 0.86 } } },
    peacock: { label: 'Peacock', line: 'A tuft of a peacock\'s train, eyes and all.', roles: {
      wood: { c: 0x0f3a3a, b: 0x2f8a6a, p: 'scales', s: 20, metal: 0.2 }, wrap: { c: 0x0a2a2a, b: 0x041414, p: 'weave', s: 50 },
      bind: { c: 0x6a2a8a, metal: 0.3 }, brass: { c: 0xc9a14a, metal: 0.85, rough: 0.3 }, hair: { c: 0x1f6a5a, b: 0x2fd0c0, p: 'peacock', s: 8, keep: 1, mid: 0.86 } } },
    bone: { label: 'Bone Handle', line: 'A haft of bone, iron fittings, white goat hair.', roles: {
      wood: { c: 0xe8dcc0, b: 0x5a4a30, p: 'bone', s: 6, metal: 0, rough: 0.6 }, wrap: { c: 0x4a3020, b: 0x2a1a10, p: 'grain', s: 30 },
      bind: { c: 0x8a1a1a, rough: 0.7 }, brass: { c: 0x3a3632, p: 'hammered', s: 40, metal: 0.7, rough: 0.45 }, hair: { c: 0xf4efe6, keep: 1, mid: 0.86 } } },
    jade: { label: 'Bamboo and Jade', line: 'A bamboo haft, a ferrule of jade.', roles: {
      wood: { c: 0xc8b46a, b: 0x6a5a2a, p: 'bamboo', s: 3, metal: 0, rough: 0.4 }, brass: { c: 0x4fae8a, b: 0xd8f0d0, p: 'jade', s: 8, metal: 0, rough: 0.25 },
      bind: { c: 0x2a5a3a, rough: 0.6 }, wrap: { c: 0x6a5a2a, b: 0x3a2e14, p: 'weave', s: 60 }, hair: { c: 0xe8e0d0, keep: 1, mid: 0.86 } } },
    night: { label: 'Night Sky', line: 'A haft of the night with its stars, a silver ferrule.', roles: {
      wood: { c: 0x0a0a1e, b: 0x6a3ab0, p: 'starfield', s: 4, metal: 0, rough: 0.3 }, brass: { c: 0xd8dde6, metal: 0.95, rough: 0.15 },
      bind: { c: 0xf2c35a, metal: 0.9, rough: 0.25 }, wrap: { c: 0x101030, b: 0x05051a, p: 'weave', s: 50 }, hair: { c: 0x9ab0ff, keep: 1, mid: 0.86 } } },
  },
  veritome: {
    stock: STOCK,
    jade: { label: 'Jade-Bound', line: 'Boards of jade, gold filigree at the corners.', roles: {
      leather: { c: 0x3f8a6a, b: 0xcfe8d4, p: 'jade', s: 10, metal: 0, rough: 0.3 }, spine: { c: 0x2f6a52, b: 0xa8d8b8, p: 'jade', s: 10, rough: 0.3 },
      dark: { c: 0x1d3a2e }, brass: { c: 0xd8b25a, b: 0xffe6a0, p: 'filigree', s: 12, metal: 0.9, rough: 0.25 }, pages: { c: 0xf4ecd8 } } },
    camera: { label: 'Brass Camera', line: 'Engraved brass boards on a black bellows spine.', roles: {
      leather: { c: 0xc9a14a, b: 0x6a4a1a, p: 'filigree', s: 10, metal: 0.85, rough: 0.3 }, spine: { c: 0x151214, b: 0x050404, p: 'weave', s: 30, rough: 0.8 },
      dark: { c: 0x9aa0a8, metal: 0.9, rough: 0.25 }, brass: { c: 0x9aa0a8, p: 'hammered', s: 30, metal: 0.9, rough: 0.25 }, pages: { c: 0xe8e0c8 } } },
    grimoire: { label: 'Tooled Grimoire', line: 'Black leather tooled in gilt, pewter at the corners, old pages.', roles: {
      leather: { c: 0x2a1a12, b: 0x8a5a2a, p: 'filigree', s: 8, rough: 0.8 }, spine: { c: 0x24160e, b: 0x8a5a2a, p: 'filigree', s: 8, rough: 0.8 },
      dark: { c: 0x120a08 }, brass: { c: 0x8a7a6a, p: 'hammered', s: 30, metal: 0.8, rough: 0.4 }, pages: { c: 0xd8c8a0 } } },
    ouroboros: { label: 'Serpent Skin', line: 'Bound in a serpent\'s scales, clasped in gold.', roles: {
      leather: { c: 0x2a3a1a, b: 0xa8b04a, p: 'scales', s: 30, rough: 0.5 }, spine: { c: 0x1e2a12, b: 0xa8b04a, p: 'scales', s: 30, rough: 0.5 },
      dark: { c: 0x0e140a }, brass: { c: 0xf2c35a, metal: 0.95, rough: 0.2 }, pages: { c: 0xece2c4 } } },
    codex: { label: 'Glitched Codex', line: 'A book of light and traces, its spine coming apart into data.', roles: {
      leather: { c: 0x0a0f18, b: 0x39c8ff, p: 'circuit', s: 18, metal: 0.2, rough: 0.35 }, spine: { c: 0x0a0f18, b: 0xff3a9a, p: 'glitch', s: 20 },
      dark: { c: 0x05080e }, brass: { c: 0x39c8ff, metal: 0.4, rough: 0.3, e: 0x39c8ff, ei: 0.3 }, pages: { c: 0xd8f4ff } } },
  },
  dreamvane: {
    stock: STOCK,
    weathervane: { label: 'Brass Weathervane', line: 'A staff of brass, a copper pick gone green.', roles: {
      wood: { c: 0xc9a14a, p: 'hammered', s: 30, metal: 0.85, rough: 0.3 }, wrap: { c: 0x3a2a1a, rough: 0.8 },
      steel: { c: 0xb87333, b: 0x4fa88a, p: 'verdigris', s: 12, metal: 0.85, rough: 0.35 }, brass: { c: 0xe2c06a, metal: 0.9, rough: 0.25 },
      feather: { c: 0xd8d0c0, metal: 0.6, rough: 0.4 }, bead: { c: 0xffe08a, e: 0xffb030 } } },
    driftwood: { label: 'Driftwood', line: 'Sea-bleached wood bound in twine, a rusted pick, sea glass.', roles: {
      wood: { c: 0xb8ad9a, b: 0x6e6656, p: 'grain', s: 12, metal: 0, rough: 0.9 }, wrap: { c: 0x7a6a50, b: 0x3a3020, p: 'weave', s: 40 },
      steel: { c: 0x8a8f94, b: 0x8a4a22, p: 'verdigris', s: 12, metal: 0.6, rough: 0.6 }, brass: { c: 0x7a6a50, rough: 0.9, metal: 0 },
      feather: { c: 0xe8e0d0 }, bead: { c: 0x9fd8e8, e: 0x4a8aa0 }, web: { c: 0xd8d0b8 } } },
    meteor: { label: 'Meteoric Iron', line: 'Star-iron etched in its own crystals, a staff of the night.', roles: {
      wood: { c: 0x0c0c1a, b: 0x3a4ab0, p: 'starfield', s: 3, metal: 0, rough: 0.3 }, wrap: { c: 0x1a1a2a, rough: 0.7 },
      steel: { c: 0x9a9aa2, b: 0x4a4a52, p: 'damascus', s: 20, metal: 0.9, rough: 0.25 }, brass: { c: 0xd8dde6, metal: 0.95, rough: 0.15 },
      feather: { c: 0x2a2a5a }, bead: { c: 0xb8c8ff, e: 0x6a7aff }, web: { c: 0x9ab0ff } } },
    reef: { label: 'Kelp and Coral', line: 'A staff furred with weed, a coral pick, pearl bands.', roles: {
      wood: { c: 0x2a4a2a, b: 0x6a8a3a, p: 'moss', s: 6, metal: 0, rough: 0.7 }, wrap: { c: 0x3a5a3a, rough: 0.8 },
      steel: { c: 0xe8735a, b: 0xf3ecf7, p: 'coral', s: 20, metal: 0, rough: 0.6 }, brass: { c: 0xf0e6f2, b: 0xc8b6ff, p: 'pearl', s: 20, metal: 0.1 },
      feather: { c: 0x3a8a6a }, bead: { c: 0xf3ecf7, e: 0xc8b6ff }, web: { c: 0x7fd6c8 } } },
    lightning: { label: 'Lightning Rod', line: 'A staff that carries the storm: traces lit along it, a frosted pick.', roles: {
      wood: { c: 0x161620, b: 0x7ad8ff, p: 'circuit', s: 8, metal: 0.3, rough: 0.4 }, wrap: { c: 0x22223a, rough: 0.6 },
      steel: { c: 0xdde6f0, b: 0x9fd8ff, p: 'frost', s: 20, metal: 0.95, rough: 0.15 }, brass: { c: 0x7ad8ff, metal: 0.6, rough: 0.2 },
      feather: { c: 0x2a3a5a }, bead: { c: 0xffffff, e: 0x7ad8ff }, web: { c: 0x7ad8ff } } },
  },
  crucibelle: {
    stock: STOCK,
    temple: { label: 'Temple Bronze', line: 'Old bronze greened in its hollows.', roles: {
      bronze: { c: 0x8a5a2a, b: 0x3fa88a, p: 'verdigris', s: 10, metal: 0.75, rough: 0.35 }, brass: { c: 0xc9a14a, p: 'hammered', s: 40, metal: 0.85, rough: 0.3 },
      dark: { c: 0x2a1a10 } } },
    glass: { label: 'Glass Bell', line: 'A bell of glass that rings in the colour of its note.', roles: {
      bronze: { c: 0xcfe8ff, b: 0x9fb8e8, p: 'chime', s: 10, metal: 0, rough: 0.05 }, brass: { c: 0xd8dde6, metal: 0.95, rough: 0.15 },
      dark: { c: 0x9fd8ff, metal: 0, rough: 0.05 } } },
    clay: { label: 'Clay Bell', line: 'Unglazed terracotta, the island\'s own, on a hemp cord.', roles: {
      bronze: { c: 0xb5653a, b: 0x5a2a14, p: 'bone', s: 10, metal: 0, rough: 0.9 }, brass: { c: 0x6a4a2a, b: 0x3a2814, p: 'grain', s: 40, metal: 0, rough: 0.8 },
      dark: { c: 0x3a2216, rough: 0.9 } } },
    celadon: { label: 'Celadon Kintsugi', line: 'A celadon bell broken once and mended in gold.', roles: {
      bronze: { c: 0x8fb8a0, b: 0xf2c35a, p: 'kintsugi', s: 8, metal: 0, rough: 0.2 }, brass: { c: 0xd8b25a, metal: 0.9, rough: 0.25 },
      dark: { c: 0x1a2a20 } } },
    blacksun: { label: 'Black Sun', line: 'A bell of the night sky, a gold clapper.', roles: {
      bronze: { c: 0x0a0a14, b: 0x6a3ab0, p: 'starfield', s: 5, metal: 0, rough: 0.3 }, brass: { c: 0xd8dde6, metal: 0.95, rough: 0.15 },
      dark: { c: 0xf2c35a, metal: 0.95, rough: 0.2 } } },
  },
  lockheart: {
    stock: STOCK,
    bronze: { label: 'Bronze', line: 'A cast bronze coffin, verdigris in its corners.', roles: {
      body: { c: 0x7a4a24, b: 0x3fa88a, p: 'verdigris', s: 20, metal: 0.7, rough: 0.35 }, trim: { c: 0xc9a14a, metal: 0.85, rough: 0.3 },
      chain: { c: 0x8a5a2a, metal: 0.8, rough: 0.35 } } },
    ebony: { label: 'Ebony and Pearl', line: 'Ebony set with mother-of-pearl, silver at the lid.', roles: {
      body: { c: 0x1a1412, b: 0xe8e4f4, p: 'pearl', s: 30, metal: 0, rough: 0.25 }, trim: { c: 0xd8dde6, metal: 0.95, rough: 0.15 },
      chain: { c: 0xd8dde6, metal: 0.95, rough: 0.2 } } },
    reliquary: { label: 'Glass Reliquary', line: 'A coffin of glass: what it holds rises inside it as it fills.', roles: {
      body: { c: 0xb8d8ff, b: 0x7fdcff, p: 'reliquary', s: 14, metal: 0, rough: 0.05 }, trim: { c: 0xd8b25a, metal: 0.95, rough: 0.2 },
      chain: { c: 0xd8b25a, metal: 0.9, rough: 0.25 } } },
    wicker: { label: 'Wicker', line: 'A coffin woven of willow, its lid of wood, on a rope.', roles: {
      body: { c: 0xc8a46a, b: 0x5a4020, p: 'weave', s: 60, metal: 0, rough: 0.8 }, trim: { c: 0x6a4a2a, b: 0x3a2814, p: 'grain', s: 40, metal: 0, rough: 0.7 },
      chain: { c: 0x8a7050, metal: 0, rough: 0.9 } } },
    ossuary: { label: 'Ossuary', line: 'A coffin of bone, banded in iron.', roles: {
      body: { c: 0xe8dcc0, b: 0x4a3a28, p: 'bone', s: 12, metal: 0, rough: 0.6 }, trim: { c: 0x2a2622, p: 'hammered', s: 40, metal: 0.7, rough: 0.45 },
      chain: { c: 0x3a3632, metal: 0.7, rough: 0.5 } } },
    motley: { label: 'Jester\'s Coffin', line: 'Motley for the dead: red and black diamonds, a gold lid.', roles: {
      body: { c: 0x9a1a2a, b: 0x161216, p: 'harlequin', s: 14, metal: 0.1, rough: 0.3 }, trim: { c: 0xf2c35a, metal: 0.95, rough: 0.2 },
      chain: { c: 0xf2c35a, metal: 0.95, rough: 0.2 } } },
  },
};

/** The skin of this id for this tool (stock for an unknown one). */
export const skinOf = (tool, id) => TOOL_SKINS[tool]?.[id] || STOCK;
/** A tool's skins' ids, stock first. */
export const skinIds = (tool) => Object.keys(TOOL_SKINS[tool] || {});
