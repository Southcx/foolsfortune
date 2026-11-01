// ---------------------------------------------------------------------------------------
// THE VESSEL'S RULES: how any body with a shell takes blows, cracks, mends and shatters (docs/plans/SUBSTRATE.md, F1 and F5b; South,
// 2026-11-01: "Ships take cracks like the Courier: yes"; and of the Arena's percent as cracks, "this opens up design space for creating
// moves that have 'shatter' capability"). The Vessoul is one being in every form, so it has one body, and so does every other thing made
// with a shell: the rule here is the one rule, a form only naming its regions and how much a blow cracks it.
//
// The chain a blow follows into a vessel (the order never changes):
//   1. the pool's shield takes it first, `SHIELD` pool for a full blow (k 1), while the pool holds (forms with no pool skip this);
//   2. what the shield could not hold cracks the region struck, `crack` of a full blow (the form's own: thick planking cracks less);
//   3. the vessel shatters when a region already near broken is struck again (`REGION_BREAK`) or its cracks sum past `BREAK_AT`;
//   4. a blow with `shatter` (0..1, a property of the move, like knockback) breaks it sooner: past (1 - shatter) of either line.
// Cracks mend by themselves after a quiet spell, or at once where the form is mended (the kiln, a dock, a Shrine), in gold.
//
// The numbers are the Courier's as built (courier/vessel/damage.js: SHIELD 35, a crack of 0.65 a full blow, BREAK_AT 3.6, a region past
// 0.95 breaking): this module is their one home, which the vessel, the ships, the Jar, the Arena and a Figment's glaze shell read.
//
// Prior art: Smash's percent (damage taken makes the next blow worse, shown as a number: the Arena draws the crack sum as one),
// Monster Hunter's part breaks (a region broken by its own damage), Sekiro's posture (a second bar filled by blows, broken for a deathblow:
// the Figment's shell), kintsugi (a mend in gold, the crack kept and honoured).
//
//   SHIELD   REGION_BREAK   BREAK_AT   FORMS { form: { regions, crack, mendAfter, mendRate } }   regionsOf(form)
//   blowOn(state, { region, k, shatter, pool }, form) -> { shield, crack, broke, shatter, state }   (pure: a new state, never mutates)
//   crackSum(state)   breakLine(form)   percentOf(state)   (the Arena's percent: the crack sum against BREAK_AT, x100)   mend(state, amount, region?)
// ---------------------------------------------------------------------------------------

/** Pool drained by a full blow (k 1) on the shield. */
export const SHIELD = 35;
/** A region already cracked past this is broken by its next blow. */
export const REGION_BREAK = 0.95;
/** The vessel shatters when its cracks sum past this (about three unshielded full blows on one region, or spread over several). */
export const BREAK_AT = 3.6;

/** Each form: its regions (where a blow can land), how much a full unshielded blow cracks one (thicker shells crack less), and how its
 *  cracks mend by themselves (after `mendAfter` real s of quiet, `mendRate` a real s; 0 never: a ship mends only at a dock). */
export const FORMS = {
  courier: { regions: ['mask', 'torso', 'armL', 'armR', 'legL', 'legR'], crack: 0.65, mendAfter: 6, mendRate: 0.025, pool: true },
  jar:     { regions: ['lip', 'shoulder', 'belly', 'foot'], crack: 0.65, mendAfter: 6, mendRate: 0.025, pool: true }, // (the god hand's Pneuka Jar: today `hp 100`, F1)
  sibling: { regions: ['mask', 'torso', 'armL', 'armR', 'legL', 'legR'], crack: 0.65, mendAfter: 4, mendRate: 0.06, pool: false }, // (mends quicker: today 0.5 hp/s after 4 s)
  // ships: a region a part of the hull; each class's crack is BREAK_AT over the hits it bore spread across its regions (sloop 6, frigate 8,
  // destroyer 5, galleon 12, tanker 14: ships.js), so a spread pounding sinks it as before, and blows on one region break it sooner (a
  // reason to turn a fresh side to the foe); no mend at sea, all mended at a dock (in gold)
  sloop:     { regions: ['bow', 'stern', 'port', 'starboard', 'mast', 'helm'], crack: 0.65, mendAfter: 0, mendRate: 0, pool: true },
  frigate:   { regions: ['bow', 'stern', 'port', 'starboard', 'mast', 'helm'], crack: 0.45, mendAfter: 0, mendRate: 0, pool: true },
  destroyer: { regions: ['bow', 'stern', 'port', 'starboard', 'mast', 'helm'], crack: 0.72, mendAfter: 0, mendRate: 0, pool: true },
  galleon:   { regions: ['bow', 'stern', 'port', 'starboard', 'mast', 'helm'], crack: 0.3, mendAfter: 0, mendRate: 0, pool: true },
  tanker:    { regions: ['bow', 'stern', 'port', 'starboard', 'mast', 'helm'], crack: 0.26, mendAfter: 0, mendRate: 0, pool: true },
  // things of clay that are not the Vessoul: no pool, one region each, cracked by blows in power (a plain shot's 1 is a full blow on a pot)
  pot:     { regions: ['body'], crack: 0.65, mendAfter: 0, mendRate: 0, pool: false },
  clapper: { regions: ['body'], crack: 3.6, mendAfter: 0, mendRate: 0, pool: false }, // (one blow bursts it, as today)
  dummy:   { regions: ['body'], crack: 0.08, mendAfter: 0, mendRate: 0, pool: false }, // (a straw dummy's percent: 8 a full blow, as today)
  // a Figment's glaze shell: its poise as crazing; the crackle break is this shell's shatter (stun.js keeps the depth and the drain)
  shell:   { regions: ['shell'], crack: 0.08, mendAfter: 1.4, mendRate: 0.32, pool: false }, // (Impact's poise, types.js: 0.08 a blow of power 1, twelve plain shots)
};
export const regionsOf = (form) => (FORMS[form] || FORMS.courier).regions;

/** A fresh vessel's state for a form: every region uncracked. */
export const newVessel = (form = 'courier') => ({ form, crack: Object.fromEntries(regionsOf(form).map((r) => [r, 0])) });
export const crackSum = (state) => Object.values(state.crack).reduce((a, b) => a + b, 0);
/** Where a form shatters by its crack sum: BREAK_AT, or for a body of fewer regions its whole (a pot of one region breaks at 1). */
export const breakLine = (form) => Math.min(BREAK_AT, regionsOf(form).length);
/** The Arena's percent (F5): the crack sum as a share of the form's break line, x100. At 100% the next real blow shatters it. */
export const percentOf = (state) => Math.round((crackSum(state) / breakLine(state.form)) * 100);

/** One blow on a vessel: pure, the state returned new. `k` 0..1 a full blow; `pool` what the shield can draw (null for a form with no
 *  pool); `shatter` 0..1 the blow's own breaking power. Returns what the shield took (pool), the crack laid, whether a region broke and
 *  whether the vessel shattered. */
export function blowOn(state, { region = null, k = 1, shatter = 0, pool = null } = {}, form = state.form) {
  const F = FORMS[form] || FORMS.courier, out = { form, crack: { ...state.crack } };
  const r = region && region in out.crack ? region : regionsOf(form)[0];
  let left = Math.max(0, k), shield = 0;
  if (F.pool && pool != null && left > 0) {
    const cost = left * SHIELD;
    if (pool >= cost) return { shield: cost, crack: 0, broke: false, shatter: false, state: out };
    shield = pool; left *= 1 - pool / cost;
  }
  const s = Math.max(0, Math.min(1, shatter)), before = out.crack[r];
  const add = left * F.crack;
  out.crack[r] = Math.min(1, before + add);
  const regionLine = REGION_BREAK * (1 - s), sumLine = breakLine(form) * (1 - s);
  const broke = add > 0 && before >= regionLine && regionsOf(form).length > 1; // (a one-region body breaks by its sum alone)
  const shattered = add > 0 && (broke || crackSum(out) >= sumLine);
  return { shield, crack: add, broke, shatter: shattered, state: out };
}

/** Mend: `amount` taken off one region, or spread over the most cracked first. */
export function mend(state, amount, region = null) {
  const out = { form: state.form, crack: { ...state.crack } };
  if (region && region in out.crack) { out.crack[region] = Math.max(0, out.crack[region] - amount); return out; }
  let left = amount;
  for (const r of Object.keys(out.crack).sort((a, b) => out.crack[b] - out.crack[a])) {
    const take = Math.min(left, out.crack[r]); out.crack[r] -= take; left -= take; if (left <= 0) break;
  }
  return out;
}
