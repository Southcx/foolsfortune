// ---------------------------------------------------------------------------------------
// A VERITOME'S SIGHT (South, 2026-11-23: "way too much going on visually with all the status updates and effects on enemies ... cut back
// down to the bare minimum ... or have the Veritome tool be our test bed for observing VFX on enemies, showing the vfx when you look
// through its viewfinder"; Calissa's ruling: both). One table of what is drawn on or over a creature and where it shows:
//   'world'  always: the body's own animation, a lasting status's aura, a stun's down stars, and what play needs and the player chose
//            (those live in their own modules and are listed here only as the audit; nothing asks for them)
//   'lens'   only while the Veritome's lens is raised with the book drawn (`game.veritome.lens && toolOut`, the scan's own test,
//            vfx/creaturetags.js `scanning`): the mind's weather on a body, the type chart's tells, the comics' pops, the agitation
//            and the rungs' marks. The lens is the test bed: through it every look shows, so what an enemy feels is read there.
// A key this table does not know answers true (a typo never hides a look). Looks only: no rule asks it.
//
// Prior art: Metroid Prime's scan visor (the world plain, the visor reading what is in it), Fatal Frame's camera obscura (the camera
// showing what the eye cannot), the Veritome's own raised lens (OVERLAY.md 10.5f, the scan).
//
//   VERITOME_SIGHT   { key: 'world' | 'lens' }        sightShows(game, key) -> bool        lensUp(game) -> bool
//   (game may be omitted where a module has none, vfx/dizzy.js: the first game any caller handed in is kept)
// ---------------------------------------------------------------------------------------

export const VERITOME_SIGHT = Object.freeze({
  // in the world (the audit: their modules never ask)
  body: 'world', flinchMotion: 'world', stealthPosture: 'world', stunDown: 'world', blow: 'world', scatter: 'world',
  parryMark: 'world', telegraph: 'world', targetMark: 'world', awareLamps: 'world', flareReveal: 'world', aberrantLook: 'world', oddsTags: 'world',
  'aura.sleep': 'world', 'aura.halt': 'world', 'aura.slow': 'world', 'aura.melt': 'world', 'aura.calm': 'world',
  'aura.charm': 'world', 'aura.confusion': 'world', 'aura.doubt': 'world', 'aura.blind': 'world',
  // through a Veritome's sight
  'aura.haste': 'lens', 'aura.empower': 'lens', 'aura.forget': 'lens', 'aura.soft': 'lens', 'aura.soaked': 'lens',
  stunBuild: 'lens',       // vfx/dizzy.js: the pale stars gathering while the meter fills (the gold ring once down stays)
  flinchTint: 'lens',      // vfx/hitflinch.js: the damage type's flash on the struck body (its shake, squash and knock stay)
  typeTell: 'lens',        // vfx/typetells.js: the trump's star, the resist's deflect, the status glyph
  glyph: 'lens',           // vfx/glyphs.js: a pop over a live creature (ask, bang, dots, star, note ...)
  ward: 'lens',            // vfx/glyphs.js: the ward pop over a creature (a refused blow's resist mark: one word to flip it back)
  panic: 'lens',           // vfx/panic.js
  temper: 'lens',          // vfx/temper.js: the gloss, the glow, the steam, sparks, rings and flakes (the tremble is the body's)
  agate: 'lens',           // vfx/agatelook.js: the inner light, the crown flame, Two-Tone's veins (the Wisp's own flame stays)
  dataBug: 'lens',         // vfx/databug.js: the aura and the cast's veins and glints (the error in the body and the aberrant's look stay)
  watch: 'lens',           // vfx/domainartmarks.js: the Watch's count
  shatterShell: 'lens',    // vfx/domainartmarks.js: Shatter's crazed shell
});

let bound = null;

/** Is the Veritome's lens raised, the book drawn? */
export function lensUp(game) {
  if (game) bound = game; else game = bound ?? globalThis.__game?.game;
  const V = game?.veritome; return !!(V?.lens && V.toolOut);
}

/** Should the look `key` show now? */
export function sightShows(game, key) {
  if (game) bound = game;
  return VERITOME_SIGHT[key] !== 'lens' || lensUp(game);
}
