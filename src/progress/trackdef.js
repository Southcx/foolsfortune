// ---------------------------------------------------------------------------------------
// A MADE TRACK (docs/plans/TRACK-EDITOR.md; the owner, 2026-10-24: "go full steam on an editor"; bots and shared tracks, no cubes for a
// made track): what the track editor writes and the race engine rides. Pure data and pure numbers: the game, the editor and the Node tools
// read the same thing.
//
// A made track IS a house track: a world/raceway/track.js definition (a closed line through control points, each its place, height and
// half-width, and the house's own features hung on it), laid on the BUILD LOT, a square of the Raceway park flat at its floor. The
// park's own ground is reshaped there to the track's corridor (world/raceway/madetrack.js), so the board rides it as it rides the
// Sun Circuit, and its kit, rails, rings and marks are built by the park's own builders. It is kept as
//   { v: 2, name, points: [[x, z, y, halfWidth]], pieces: [{ kind, u, lat, u2?, lat2? }], traps: [{ kind, u, lat, period, offset, u2? }],
//     rules: [id], author: { seconds, hash } | null }
// in lot metres (x, z from its middle; y over its floor); a piece or trap is placed by `u`, its share of the line's length from the start,
// and `lat`, metres right of the line, so it slides with the line when the line is edited. `toTrackDef` turns it into the track.js
// definition (the start at the first point, eight gates spaced by length, each piece its house feature: progress/trackpieces.js, each
// trap a `traps` feature). A track is VALIDATED (Trackmania's rule, Mario Maker's clear check) when its author has ridden it to the line
// on the track as it now stands (`author.hash` the hash of its geometry: an edit unvalidates it); only a validated track is shared.
//
// Prior art: Trackmania's validation and author time; ModNation Racers' road laid as a line and the ground fitted round it; Super Mario
// Maker's clear check and its limits; LittleBigPlanet Karting's thermometer (the budget); a share code as Trackmania's track code.
//
//   LOT   MADE   MEDAL_K   RULES   blankTrack(name) -> def   toTrackDef(def, L?, gates?) -> track.js def   buildTrack(def) -> T
//   gatesFor(T) -> [[cp, at]]   budgetOf(def) -> { used, max }   validate(def, T) -> { ok, errors: [{ code, text, x?, z? }] }
//   hashOf(def) -> string   isValidated(def) -> bool   shareCode(def) -> 'FF2-...'   readCode(code) -> def | null   cleanDef(any) -> def | null
// ---------------------------------------------------------------------------------------
import { track } from '../world/raceway/track.js';
import { featureOf } from './trackpieces.js';
import { PIECES } from './trackpieces.js';
import { TRAPS, TRAP } from './traps.js';

/** The build lot: its middle in the park's local metres, its half-size, the blend back to the sand round it, its floor's height. */
export const LOT = { x: -830, z: 240, half: 240, blend: 40, y: 20 };
/** A made track's limits: slots kept, points, length (m), half-width (m), the tightest bend's radius (m), gates, the budget, edge margin. */
export const MADE = { slots: 3, points: [4, 48], length: [500, 3200], width: [5, 16], defaultWidth: 10, rise: 30, climb: 0.35, bend: 14, gates: 8, budget: 100, margin: 6, startClear: 60, maxRules: 3 };
// (rise: metres a point may stand over the lot's floor; climb: the steepest grade between two points the line may climb, 1 in 3, the
// Sun Circuit's switchbacks' own; a drop may be any: it is a jump)
/** A made track's medals, as shares of its reference race (progress/skiffruler.js): the Sun Circuit's own medals over its reference race
 *  (255, 285 and 330 real s over 355.3: `node scripts/skifftune.mjs`), so a made track's gold is as hard as the Sun's. */
export const MEDAL_K = { gold: 0.718, silver: 0.802, bronze: 0.929 };
/** A track's rules (Spellscription's, TRACK-EDITOR.md 5): each a modifier with a source you can see, a stele at the start. */
export const RULES = {
  noflare: { label: 'No flares', line: 'The flare will not light here.' },
  slick: { label: 'Slick sand', line: 'The sand holds two thirds as well.' },
  thirst: { label: 'Thirst', line: 'The pool drains as you ride.' },
  plates2: { label: 'Bright plates', line: 'Every sun plate pushes twice.' },
};

const r1 = (v) => Math.round(v * 10) / 10;
/** A new track: an oval of eight points round the lot's middle. */
export function blankTrack(name = 'A new track') {
  const pts = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; pts.push([r1(Math.cos(a) * 150), r1(Math.sin(a) * 95), 0, MADE.defaultWidth]); }
  return { v: 2, name, points: pts, pieces: [], traps: [], rules: [], author: null };
}

/** The track.js definition of a made track (id 'made'), on the lot's floor (`y` over it), the start at the first point. Its features need
 *  the line's length `L` (a piece's place is a share of it) and `gates` from gatesFor(): buildTrack lays the line once to measure them. */
export function toTrackDef(def, L = 0, gates = []) {
  const features = { start: { cp: 0, at: 0 }, gates, ringGlide: 5 };
  if (L > 0) {
    for (const P of def.pieces || []) { const f = featureOf(P, L); if (f) (features[f[0]] ||= []).push(f[1]); }
    features.traps = (def.traps || []).filter((d) => TRAPS[d.kind]).map((d) => ({ kind: d.kind, cp: 0, at: d.u * L, lat: d.lat || 0, period: d.period, offset: d.offset, ...(d.u2 != null ? { at2: d.u2 * L } : {}) }));
  }
  return { id: 'made', name: def.name || 'A made track', at: { x: LOT.x, z: LOT.z, rot: 0 }, control: def.points.map((p) => [p[0], p[1], LOT.y + (p[2] || 0), p[3] ?? MADE.defaultWidth, 0, 0]), features };
}
/** A made track laid: once to measure its line, then with its features and gates (the ground is the lot's floor). */
export function buildTrack(def) {
  const ground = () => LOT.y, T0 = track(toTrackDef(def), ground);
  return track(toTrackDef(def, T0.length, gatesFor(T0)), ground);
}
/** Eight gates spaced evenly along a measured line (the last before the line itself: the race counts the lap at the line). */
export const gatesFor = (T) => Array.from({ length: MADE.gates - 1 }, (_, i) => [0, ((i + 1) * T.length) / MADE.gates]);

/** What a track spends of its budget: each piece's and trap's cost (LittleBigPlanet's thermometer: one bar, full is full). */
export function budgetOf(def) {
  let used = 0;
  for (const P of def.pieces || []) used += PIECES[P.kind]?.cost ?? 0;
  for (const Tp of def.traps || []) used += TRAPS[Tp.kind]?.cost ?? 0;
  return { used, max: MADE.budget };
}

/** Whether a made track can be ridden and shared, and why not: on the lot, a length in range, no bend tighter than MADE.bend, no leg of
 *  the line crossing another (no bridges on the lot yet), the budget, the start's straight clear, and each trap where the rules let it be
 *  (never within TRAP.grace after a gate: a rider always gets a breath, Mario Maker's no-unavoidable-damage). `T` is the built track. */
export function validate(def, T) {
  const errors = [], err = (code, text, x, z) => errors.push({ code, text, ...(x != null ? { x: r1(x), z: r1(z) } : {}) });
  const n = def.points?.length || 0;
  if (n < MADE.points[0]) err('few', `A track needs ${MADE.points[0]} points or more.`);
  if (n > MADE.points[1]) err('many', `A track holds ${MADE.points[1]} points at most.`);
  for (const p of def.points || []) { const w = p[3] ?? MADE.defaultWidth; if (Math.max(Math.abs(p[0]), Math.abs(p[1])) > LOT.half - w - MADE.margin) err('lot', 'A point lies off the build lot.', p[0], p[1]); }
  // a climb steeper than the board can take, point to point along the way (a drop is a jump: any is allowed)
  for (let i = 0; i < n; i++) { const a = def.points[i], b = def.points[(i + 1) % n], run = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; if (((b[2] || 0) - (a[2] || 0)) / run > MADE.climb) { err('climb', `From point ${i + 1} to ${((i + 1) % n) + 1} the line climbs more than 1 in ${Math.round(1 / MADE.climb)}.`, b[0], b[1]); break; } }
  if (!T) return { ok: !errors.length, errors };
  if (T.length < MADE.length[0]) err('short', `The line is ${Math.round(T.length)} m: a track needs ${MADE.length[0]} m.`);
  if (T.length > MADE.length[1]) err('long', `The line is ${Math.round(T.length)} m: a track holds ${MADE.length[1]} m at most.`);
  // the tightest bend: the turn of the line over 6 m
  const k = Math.max(1, Math.round(3 / T.ds));
  for (let i = 0; i < T.N; i += 2) {
    const a = (i - k + T.N) % T.N, b = (i + k) % T.N, da = Math.atan2(Math.sin(Math.atan2(T.FX[b], T.FZ[b]) - Math.atan2(T.FX[a], T.FZ[a])), Math.cos(Math.atan2(T.FX[b], T.FZ[b]) - Math.atan2(T.FX[a], T.FZ[a])));
    if (Math.abs(da) / (2 * k * T.ds) > 1 / MADE.bend) { err('bend', `A bend is tighter than a ${MADE.bend} m radius.`, T.X[i] - LOT.x, T.Z[i] - LOT.z); break; }
  }
  // a leg of the line too near another (more than 60 m apart along it): the running surfaces would overlap
  outer: for (let i = 0; i < T.N; i += 3) for (let j = i + 3; j < T.N; j += 3) {
    const along = Math.min(Math.abs(i - j), T.N - Math.abs(i - j)) * T.ds; if (along < 60) continue;
    if (Math.hypot(T.X[i] - T.X[j], T.Z[i] - T.Z[j]) < T.W[i] + T.W[j] + 4) { err('cross', 'Two stretches of the line run into each other.', T.X[i] - LOT.x, T.Z[i] - LOT.z); break outer; }
  }
  const B = budgetOf(def); if (B.used > B.max) err('budget', `The track spends ${B.used} of a budget of ${B.max}.`);
  if ((def.rules || []).length > MADE.maxRules) err('rules', `A track carries ${MADE.maxRules} rules at most.`);
  for (const P of def.pieces || []) if (!PIECES[P.kind]) err('piece', `No such piece: ${P.kind}.`);
  const L = T.length, gateS = [T.line, ...T.gates], ahead = (from, s) => ((s - from) % L + L) % L, here = (s) => { const F = T.frame(s); return [F.x - LOT.x, F.z - LOT.z]; };
  for (const Tp of def.traps || []) {
    if (!TRAPS[Tp.kind]) { err('trap', `No such trap: ${Tp.kind}.`); continue; }
    const s = (((Tp.u || 0) * L) % L + L) % L;
    if (ahead(T.line, s) < MADE.startClear) err('trapstart', `Keep the first ${MADE.startClear} m after the start clear of traps.`, ...here(s));
    else if (gateS.some((g) => ahead(g, s) < TRAP.grace)) err('trapgate', `A trap stands within ${TRAP.grace} m after a gate.`, ...here(s));
  }
  if ((def.traps || []).length > TRAP.perTrack) err('traps', `A track holds ${TRAP.perTrack} traps at most.`);
  return { ok: !errors.length, errors };
}

/** The geometry's hash (FNV-1a over what the race rides): any edit to the line, its heights, a piece, a trap or a rule changes it. */
export function hashOf(def) {
  const s = JSON.stringify([def.points, def.pieces, def.traps, def.rules]);
  let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
export const isValidated = (def) => !!def?.author && def.author.hash === hashOf(def);

/** Anything read back (the save, a pasted code) made into a well-formed def, or null (a version-1 def, laid by x and z before made
 *  tracks were house tracks, is not read: progress resets on every build, and no code of one was ever shared). */
export function cleanDef(d) {
  if (!d || d.v !== 2 || !Array.isArray(d.points)) return null;
  const num = (v, a, b, f = 0) => (Number.isFinite(+v) ? Math.max(a, Math.min(b, +v)) : f), H = LOT.half, u3 = (v) => Math.round(num(v, 0, 1) * 10000) / 10000, lat = (v) => r1(num(v, -MADE.width[1] - 8, MADE.width[1] + 8));
  return {
    v: 2, name: String(d.name || 'A made track').slice(0, 32),
    points: d.points.slice(0, MADE.points[1]).map((p) => [r1(num(p?.[0], -H, H)), r1(num(p?.[1], -H, H)), r1(num(p?.[2], 0, MADE.rise)), r1(num(p?.[3], MADE.width[0], MADE.width[1], MADE.defaultWidth))]),
    pieces: (d.pieces || []).filter((P) => PIECES[P?.kind]).slice(0, 80).map((P) => ({ kind: P.kind, u: u3(P.u), lat: lat(P.lat), ...(PIECES[P.kind].span ? { u2: u3(P.u2 ?? P.u), lat2: lat(P.lat2 ?? P.lat) } : {}) })),
    traps: (d.traps || []).filter((P) => TRAPS[P?.kind]).slice(0, 24).map((P) => ({ kind: P.kind, u: u3(P.u), lat: lat(P.lat),
      period: r1(num(P.period, TRAPS[P.kind].cycle.min, TRAPS[P.kind].cycle.max, TRAPS[P.kind].cycle.period)), offset: r1(num(P.offset, 0, 30)),
      ...(TRAPS[P.kind].pair ? { u2: u3(P.u2 ?? P.u) } : {}) })),
    rules: (d.rules || []).filter((id) => RULES[id]).slice(0, MADE.maxRules),
    author: d.author && Number.isFinite(+d.author.seconds) ? { seconds: +(+d.author.seconds).toFixed(2), hash: String(d.author.hash || '') } : null,
  };
}

// ---- the share code: the def as compact arrays, base64url, with a check (Trackmania's track code)
const KINDS_P = Object.keys(PIECES), KINDS_T = Object.keys(TRAPS), KINDS_R = Object.keys(RULES);
const b64 = (s) => (typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s) => { const t = s.replace(/-/g, '+').replace(/_/g, '/'); return typeof atob === 'function' ? decodeURIComponent(escape(atob(t))) : Buffer.from(t, 'base64').toString('utf8'); };
const sum4 = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1679616; return h.toString(36).padStart(4, '0'); };

export function shareCode(def) {
  const c = [2, def.name, def.points.flat(), def.pieces.map((P) => [KINDS_P.indexOf(P.kind), P.u, P.lat, ...(P.u2 != null ? [P.u2, P.lat2] : [])]),
    def.traps.map((P) => [KINDS_T.indexOf(P.kind), P.u, P.lat, P.period, P.offset, ...(P.u2 != null ? [P.u2] : [])]),
    def.rules.map((id) => KINDS_R.indexOf(id)), def.author ? [def.author.seconds, def.author.hash] : 0];
  const body = b64(JSON.stringify(c));
  return `FF2-${body}-${sum4(body)}`;
}
export function readCode(code) {
  try {
    const m = /^FF2-([A-Za-z0-9_-]+)-([0-9a-z]{4})$/.exec(String(code || '').trim()); if (!m || sum4(m[1]) !== m[2]) return null;
    const c = JSON.parse(unb64(m[1])); if (!Array.isArray(c) || c[0] !== 2) return null;
    const pts = []; for (let i = 0; i + 3 < c[2].length; i += 4) pts.push([c[2][i], c[2][i + 1], c[2][i + 2], c[2][i + 3]]);
    return cleanDef({ v: 2, name: c[1], points: pts, pieces: c[3].map((a) => ({ kind: KINDS_P[a[0]], u: a[1], lat: a[2], ...(a.length > 3 ? { u2: a[3], lat2: a[4] } : {}) })),
      traps: c[4].map((a) => ({ kind: KINDS_T[a[0]], u: a[1], lat: a[2], period: a[3], offset: a[4], ...(a.length > 5 ? { u2: a[5] } : {}) })),
      rules: c[5].map((i) => KINDS_R[i]), author: c[6] ? { seconds: c[6][0], hash: c[6][1] } : null });
  } catch { return null; }
}
