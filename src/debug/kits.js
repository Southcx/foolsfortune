// ---------------------------------------------------------------------------------------
// THE DEBUG KITS (docs/plans/DEBUG-CHESTS.md; the owner, 2026-10-08: "leave me a chest near the facility you want me to test that gives
// me the requisite items ... CLEARLY identified as debug chests"): what each debug chest holds, beside the feature it serves. Data only;
// each row is written by the division that asks for the test, in the same commit as its QAIS test (Dovina keeps the table); the chest
// itself is debug/debugchest.js. A kit holds items and cubes, never state (a rank, an art, the ledger: the all-arts switch's job).
//
//   DEBUG_KITS[kit] = { at (a spot debugchest.js knows), for, by, tests: ['T<n>'], items: [[id, count, data?]], cubes? }
//   a material's data is { tier } (makeMaterial's); a tool is its item id (`tool.dreamvane`), given only if neither worn nor boxed
// ---------------------------------------------------------------------------------------

const KINDS = ['eldritch', 'arcane', 'finery', 'mechanism', 'edge', 'art', 'provision']; // (materials.js KIND_IDS, the seven kinds)
const mats = (count, tier) => KINDS.map((k) => [`mat.${k}`, count, { tier }]);
const TOOLS = () => ['psygun', 'sondelass', 'soulbrush', 'veritome', 'dreamvane', 'crucibelle', 'lockheart'].map((t) => [`tool.${t}`, 1]); // (pneuka/items.js TOOL_ITEMS: given only if neither worn nor boxed)

export const DEBUG_KITS = {
  press: { at: 'athanor', for: 'Soul Alchemy: the press station (SOUL-ALCHEMY.md 4)', by: 'dovina', tests: ['T155', 'T156'],
    items: [...mats(2, 1), ...mats(1, 3)], cubes: 2000 },
  garden: { at: 'shed', for: 'the Spirit Garden: features, beds, a bought planetoid', by: 'dovina', tests: [],
    items: mats(3, 1), cubes: 3000 },
  ostraca: { at: 'sealed', for: 'the ostraca: digging one up, ringing the sealed room open', by: 'dovina', tests: ['T164', 'T165'],
    items: [['tool.dreamvane', 1]] },
  crucibelle: { at: 'busk.weir', for: "the Crucibelle's pendulum by sight, and busking", by: 'dovina', tests: [],
    items: [['tool.crucibelle', 1]] },
  dunemaw: { at: 'well.mouth', for: 'a run of the Great Dunemaw to the great cavern and the fight', by: 'dovina', tests: [],
    items: [['whistle.wake', 1], ['bottle.small', 2]], cubes: 500 },
  jetty: { at: 'jetty', for: 'a drafted passage: the sea chart, a long crossing, the encounters, the turns of the rail', by: 'petra', tests: ['T172', 'T173', 'T174'],
    items: [['cask.mirth', 4], ['rutter', 1, { from: 'anagami', to: 'margarite', route: 'anagami>margarite', day: 0, passage: [], legs: [], rank: 'C', read: 0, minutes: 5, worth: 40 }]], cubes: 3000 }, // (cubes for the fuel of a long passage, casks for the Wreckers to take, a rutter for Letty to buy)
  paintrange: { at: 'testroom.paintrange', for: 'painting at range: the reticle, the spread, the splats (LACHRYMA-LOOP.md 3)', by: 'petra', tests: ['T178'],
    items: [['tool.soulbrush', 1], ['bottle.small', 1]] }, // (the brush, and a bottle to paint from and to mop into)
  throwing: { at: 'testroom.index', for: 'the drills (Steady Hand and Wide Bore open by drill hits)', by: 'dovina', tests: [],
    items: [['tool.psygun', 1]] },
  // the combat wing's stations (docs/plans/COMBAT-LAB.md section 7): every tool, since each answers and strikes its own way; the QAIS
  // tests that will name them are not written yet (each station's mechanic first), so these are the first drafts, Calissa's
  sparring: { at: 'sparring.circle', for: "Strawman's strings: the parry in the window's glint, a combo answered", by: 'calissa', tests: [], items: TOOLS() },
  parryrange: { at: 'parry.range', for: "the parry range: each tool's answer to a plain and an outlined shot", by: 'calissa', tests: [], items: [...TOOLS(), ['bottle.small', 1]] }, // (the bottle: the mop's soak drinks into it)
  statusbench: { at: 'status.bench', for: 'the status bench: each status landed, its aura, its glyph, its log line', by: 'calissa', tests: [], items: [...TOOLS(), ['bottle.small', 1]] },
  jugglepen: { at: 'juggle.pen', for: 'the juggle pen: the launcher and the air string', by: 'calissa', tests: [], items: TOOLS() },
};
