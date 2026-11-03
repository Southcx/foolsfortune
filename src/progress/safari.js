// ---------------------------------------------------------------------------------------
// THE SAFARI'S RULES (docs/plans/STEALTH.md 8; gaps G241 to G248; South, 2026-11-01: the Veritome as a "mental safari" tool): what a Figment
// is doing when the shutter falls, how rare that is, how a research level is earned, what each pays, how close a Figment lets you
// come, and how the day's best plate of each is judged. Pure data and functions: the running half is safarirun.js.
//
// Prior art: New Pokemon Snap (two readouts a plate: stars for the behaviour, a score for the framing; research levels that open a course's
// night variant and its rare things; the illumina orb and the fluffruit that provoke a behaviour; Professor Mirror's judging of the best
// shot of each), the open sea's safari (progress/opensea/habits.js: four habits a species, research as how many you hold, a first plate
// paid once), Bugsnax's sauces, and ethology (Hediger's flight zones; Stankowich and Blumstein 2005: a fast, direct approach flushes
// sooner, a path that passes by lowers the risk by about 31%; habituation to a gentle and frequent presence).
//
//   BEHAVIOURS[kind] = [{ id, label, rarity, acts, when?: { phase?, weather? } }]   rarity: anywhere | condition | lured | candid
//   behaviourNow(kind, { act, phase, weather, candid, lured }) -> behaviour | null   (the rarest whose own condition holds)
//   RARITY_STARS   readout({ score, behaviour }) -> { stars, score, framing }   framingOf(score) -> poor | fair | good | great
//   AREA_KINDS   RESEARCH { levels, opens }   researchLevel(L, area)   areaOpen(L, area, what)   behaviourFee(rarity)   levelFee(level)
//   LURES[feeling] { cost, ttl, radius, hold, kinds }   flightDistance({ bold, speed, heading, posture, hab }) -> m
//   judgeDay(plates) -> [{ kind, id, stars, score, why: [codes] }]
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';

/** The four behaviours of a Figment, one of each rarity (STEALTH.md 8.2). `acts` are ids of the mind's actions (creatures/ai/, the running
 *  action at the shutter: `brain.action.id`), so a behaviour is what the body is doing, never guessed from the hour. Words placeholders
 *  (Espada's). The lured one has no acts: any action counts while a lure holds the Figment. */
export const BEHAVIOURS = {
  slipjelly: [
    { id: 'wander', label: 'wanders', rarity: 'anywhere', acts: ['wander', 'go home', 'investigate', 'idle'] },
    { id: 'sleep', label: 'rests in the dark', rarity: 'condition', acts: ['rest', 'huddle'], when: { phase: ['night', 'dusk'] } },
    { id: 'play', label: 'plays alone', rarity: 'candid', acts: ['play', 'drink', 'forage', 'fish', 'mourn'] },
    { id: 'feed', label: 'feeds at a lure', rarity: 'lured', acts: [] },
  ],
  wisp: [
    { id: 'drift', label: 'drifts', rarity: 'anywhere', acts: ['wander', 'go home'] },
    { id: 'gutter', label: 'lets its lantern gutter', rarity: 'condition', acts: ['idle'], when: { phase: ['dawn', 'dusk', 'night'] } },
    { id: 'circle', label: 'circles a find', rarity: 'candid', acts: ['investigate', 'idle', 'wander'] },
    { id: 'follow', label: 'follows a lure', rarity: 'lured', acts: [] },
  ],
};
/** Which feeling a kind comes to (placeholder until the Figments' feelings are ruled: the slip jelly drinks Gall, the Wisp's lantern is Wonder's). */
export const KIND_FEELING = { slipjelly: 'gall', wisp: 'wonder' };

/** Stars rate the behaviour (STEALTH.md 8.1): the commonest one, a condition, a provoked one, and the rarest, only to a Figment that never knew. */
export const RARITY_STARS = { anywhere: 1, condition: 2, lured: 3, candid: 4 };
const ORDER = ['lured', 'candid', 'condition', 'anywhere']; // (which a plate that fits two is: the provoked, then the unseen)

const has = (w, v) => !w || (Array.isArray(w) ? w.includes(v) : w === v);
/** The behaviour a Figment of `kind` shows now, or null (fleeing, hunting, watching you and stunned are no behaviour).
 *  ctx: { act: the mind's running action id, phase, weather ('fair' or an aspect), candid (it did not know you were there), lured }. */
export function behaviourNow(kind, ctx = {}) {
  const list = BEHAVIOURS[kind]; if (!list) return null;
  const fits = (b) => (b.rarity === 'lured' ? !!ctx.lured : b.rarity === 'candid' ? !!ctx.candid && b.acts.includes(ctx.act) : b.acts.includes(ctx.act)) && has(b.when?.phase, ctx.phase) && has(b.when?.weather, ctx.weather || 'fair');
  for (const r of ORDER) { const b = list.find((x) => x.rarity === r && fits(x)); if (b) return b; }
  return null;
}

/** A plate's two readouts (STEALTH.md 8.1). The score is the framing's alone and keeps whatever the lens gave; the stars are the behaviour's. */
export const FRAMING = [{ below: 110, word: 'poor' }, { below: 170, word: 'fair' }, { below: 230, word: 'good' }, { below: Infinity, word: 'great' }];
export const framingOf = (score = 0) => FRAMING.find((r) => score < r.below).word;
export const readout = ({ score = 0, behaviour = null } = {}) => ({ stars: behaviour ? RARITY_STARS[behaviour.rarity] : 0, score: Math.round(score), framing: framingOf(score) });

/** Research by area (STEALTH.md 8.3): the Figments an area holds (placeholder: the Dunes' two), and what each level opens. A level is how
 *  many of the area's behaviours you hold a plate of there, as the sea's research is how many of a species' four. */
export const AREA_KINDS = { weir: ['slipjelly'], shore: ['slipjelly'], ridges: ['slipjelly', 'wisp'], flats: ['wisp'], ruins: ['wisp'] };
export const RESEARCH = {
  levels: [1, 3, 5, 7], // (behaviours held for level 1 to 4; an area with one Figment tops out at 4 of 4)
  opens: [{ level: 2, what: 'night' }, { level: 3, what: 'rare' }, { level: 4, what: 'all' }], // (the area's night variant, its rare find, all of it)
};
/** The ledger key a behaviour held in an area is counted on (tracking/safari.js). */
export const areaKey = (area, kind, id) => `safari.area.${area}.${kind}.${id}`;
export const researchHeld = (L, area) => (AREA_KINDS[area] || []).reduce((s, k) => s + (BEHAVIOURS[k] || []).filter((b) => L.get(areaKey(area, k, b.id)) > 0).length, 0);
export const levelOf = (held) => RESEARCH.levels.filter((t) => held >= t).length;
export const researchLevel = (L, area) => levelOf(researchHeld(L, area));
/** Is what a research level opens open in `area` (what: 'night' | 'rare')? Petra's rare finds and the night variant ask here. */
export const areaOpen = (L, area, what) => { const lv = researchLevel(L, area); return RESEARCH.opens.some((o) => lv >= o.level && (o.what === what || o.what === 'all')); };

/** What it pays (STEALTH.md 8.7, ECONOMY.md's aim): a behaviour's first plate, minutes of play at the aim by rarity; a research level, a share
 *  of a hunt of the class its number names (the sea's discoveries, habits.js). */
export const SAFARI_PAY = { behaviour: { anywhere: 0.5, condition: 1, lured: 1.5, candid: 2 }, level: 0.25 };
export const behaviourFee = (rarity) => Math.round((SAFARI_PAY.behaviour[rarity] || 0) * ECON.perMinute);
export const levelFee = (level) => Math.round(SAFARI_PAY.level * ECON.hunt.minutes[Math.max(0, Math.min(4, level - 1))] * ECON.perMinute);

/** Lachryma lures (STEALTH.md 8.4): a feeling's lure laid on the ground draws the Figments that come to it and holds them for their lured
 *  behaviour. The cost is in the pool; it lasts `ttl` real s, calls from `radius` m and holds inside `hold` m. */
export const LURE_FEELINGS = ['wonder', 'mirth', 'desire', 'fury', 'gall', 'grief', 'dread'];
export const LURES = Object.fromEntries(LURE_FEELINGS.map((f) => [f, { cost: 8, ttl: 30, radius: 16, hold: 7, kinds: Object.keys(KIND_FEELING).filter((k) => KIND_FEELING[k] === f) }]));

/** Flight rings (STEALTH.md 7; Hediger's flight zone): how close an unaware Figment lets you come before it bolts. A bold one lets you
 *  closer; a fast approach flushes it sooner (0.75 slow .. 1.25 a sprint); a path that passes by rather than at it lowers the risk by
 *  about 31%; a low shape is gentler; habituation (0..1) halves it at most. heading: cosine of the Courier's velocity with the line to it. */
export const FLIGHT = { base: 14, bold: 0.4, speedAt: 6.5, speed: [0.75, 1.25], passBy: 0.69, posture: { stand: 1, crouch: 0.8, prone: 0.6 }, habit: 0.5, cool: 20, floor: 2 };
export function flightDistance({ bold = 1, speed = 0, heading = 1, posture = 'stand', hab = 0 } = {}) {
  const F = FLIGHT, s = Math.max(0, Math.min(1, speed / F.speedAt)), dir = Math.max(0, Math.min(1, heading)); // (a path away or across is a pass-by)
  const d = F.base * (1 + F.bold * (1 - bold)) * (F.speed[0] + (F.speed[1] - F.speed[0]) * s) * (F.passBy + (1 - F.passBy) * dir) * (F.posture[posture] ?? 1) * (1 - F.habit * Math.max(0, Math.min(1, hab)));
  return Math.max(F.floor, +d.toFixed(2));
}
/** Habituation (a gentle and frequent presence): 0..1 a kind, up with unspooked slow company, down with a fright and with time. */
export const HABITUATION = { gain: 1 / 90, decay: 1 / 600, fright: 0.25, slow: 4 };

/** The scent on the wind (STEALTH.md 7, waits on an island wind): how far downwind your signature carries (m), 0 with no wind. */
export const SCENT = { perMs: 6, max: 40 };
export const scentReach = (windSpeed = 0, pool = 1) => Math.min(SCENT.max, Math.max(0, windSpeed) * SCENT.perMs * Math.max(0, Math.min(1, pool)));

/** The darkroom (STEALTH.md 8.5): the day's best plate of each kind (stars first, then the framing) and why, as codes the log words:
 *  behaviour (its rarity named), candid, lured, close (3 m or less), framing (its word).
 *  plates: [{ kind, id, rarity, stars, score, candid, d, lured }]. */
export function judgeDay(plates = []) {
  const best = new Map();
  for (const p of plates) { const q = best.get(p.kind); if (!q || p.stars * 1000 + p.score > q.stars * 1000 + q.score) best.set(p.kind, p); }
  return [...best.values()].map((p) => {
    const why = [`behaviour:${p.rarity}`]; if (p.candid === 'candid') why.push('candid'); if (p.lured) why.push('lured'); if (p.d != null && p.d <= 3) why.push('close');
    why.push(`framing:${framingOf(p.score)}`);
    return { kind: p.kind, id: p.id, stars: p.stars, score: p.score, why };
  });
}
