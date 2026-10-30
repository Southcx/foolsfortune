// ---------------------------------------------------------------------------------------
// WHAT THE ACTION MODES SHOW ON GLASS: the cluster's faces and the strip's on foot, with a tool in hand and in a puzzle duel (docs/plans/
// MOBILE.md 8.5, 8.8, 8.9; the words Espada's, 8.3), read from the moment, read only. Each entry is a tile: its id the binding's touch
// control (core/bindings.js `touch`: the driver presses it through the live ctx), its face (a glyph `touch.<glyph>`, a word, a corner),
// and its state (lit, dim, a note pad's tint). The cluster (cluster.js) and the strip (strip.js) lay them out; nothing here moves.
//   ON FOOT       JUMP (the main), CROUCH, DASH, and the fourth by context: USE naming its thing, else PARRY once learned (the kick),
//                 else BLINK once learned. At the cluster's top edge, small: DRAW (STOW while the main is out), LEND (the sub's verb,
//                 SUB_GIFTS) and SWAP while a sub is worn, SKIFF at the Raceway and in the Dunes. The strip and the pair stand only on
//                 foot (the owner, 2026-10-26: riding, BLINK and the hook are not to be had).
//   A TOOL OUT    FIRE and AIM in the tool's own verbs and glyphs (FIRE / AIM, ATTACK / SPECIAL, CAST or REEL / SINK or GIVE LINE, THROW or
//                 REEL / PAY OUT, ATTACK / FLICK, PHOTO / LENS, PICK / DOWSE, TOLL / HIGH, HOOVER / OPEN), the third its own (SHELL, LOCK,
//                 PING, JUMP off the hook, REPROGRAM by a stunned mind, SURVEY), PARRY the fourth; the strip the tool's (the chambers and
//                 FAN, BREATH scoped; the Sondelass's forms; LURE and CRANK; PAINT or MOP; FLASH; the Crucibelle's five note pads, each in
//                 its note's colour, its number small), BLINK at its end once learned.
//   AT THE HELM   (the open sea's free helm, ctx `helm`: the stick is the rudder) FIRE (the ship's gun) and PARRY (the spit sent back)
//                 while a sea serpent hunts the hull, else USE naming MOOR or DOCK where F would; the throttle's two, each worded with
//                 the step it goes to (STOP .. FULL), dim at its end. The strip: BROADSIDE first (the side the camera looks over fires,
//                 its rim filling with that side's reload; dim while no side bears, the readier side's reload shown), the worn mounts
//                 (`mount.1`, `mount.2`: each its mount's glyph, its cooldown on the rim, the toll's charges as pips), FIX (the sky read,
//                 the Dreamvane worn) and PLATE (the Veritome worn), and USE while a serpent holds the cluster.
//   A PUZZLE DUEL (the duel's phone screen: ui/touch/duelscreen.js lays these in the flanks, the cluster and the strip stand down)
//                 END TURN (the main; dim on the foe's turn; its rim the action points left), FINISHER on a broken foe, FLEE, UNDO, FORM
//                 (what you would become: HAND or COURIER); the worn tools' moves (duelTools) (dim in the hand's form: they are the Courier's), ROTATE first while a piece
//                 is under the last touch in the hand's form; TUNE lit while its song holds, READ only where Dread's fog hides the foe; the
//                 first duel's step asked (lesson.js) lit on its tile (FORM, ROTATE, the tools' moves).
// The main tool's name small in FIRE's corner (8.3; Espada 2026-10-24: a glance tells which tool is out), the glyph a step smaller
// beside it (tile.js) and the name shrunk to fit its tile.
//
// Prior art: Genshin Impact's attack and skill tiles changing with the character, Call of Duty Mobile's fire button by weapon, Into the
// Breach's strip of moves with END TURN the largest; the cluster's own reading of the skiff (cluster.js clusterContext).
//
//   footCluster(game) toolCluster(game, tool) duelCluster(game) duelTools(game) helmCluster(game) -> [entry]   stripOf(game) -> [entry]   nearOf(game) -> [entry]   beltPairOf(game) -> [entry]
//   inHandCtx(game) -> 'psygun' | 'cutlass' | 'rod' | 'hook' | 'brush' | 'veritome' | 'dreamvane' | 'crucibelle' | 'lockheart' | null
//   entry { id, glyph, word, corner, lit, dim, tint, charge }   broadsideOf(game) -> { side, charge, bears }   mountsOf(game) -> [entry]   ACTION_TILES (the words and glyphs by tool)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SUB_GIFTS } from '../../progress/toolpairs.js';
import { DEGREE_COLOR } from '../../tools/crucibelle/songs.js';
import { useLabel } from './cluster.js';
import { ROOM } from '../../world/opensea/opensea.js';
import { SEA_FIGHT } from '../../world/opensea/seafight.js';
import { SEA_MOUNTS } from '../../progress/rail/mounts.js';
import { stepsOf } from '../../progress/duel/lesson.js';
import { skillsOf } from '../../progress/duel/skills.js';
import { legalActions, oneGesture } from '../../progress/duel/duel.js';
import { powersOf } from '../../progress/duel/powers.js';
import { DOMAIN_LOOK } from '../domainlook.js';
import { TOOL_LABEL } from '../../vfx/toolskins.js';

/** By tool in hand: FIRE's and AIM's faces, the third (or null), and what the faces become in their other moment. */
export const ACTION_TILES = {
  psygun: { fire: ['psfire', 'FIRE'], aim: ['psaim', 'AIM'], third: { id: 'shell', glyph: 'shell', word: 'SHELL' } },
  cutlass: { fire: ['cuattack', 'ATTACK'], aim: ['cuspecial', 'SPECIAL'], third: { id: 'lock', glyph: 'lock', word: 'LOCK' } },
  rod: { fire: ['cast', 'CAST'], aim: ['sink', 'SINK'], fishOn: { fire: 'REEL', aim: 'GIVE LINE' }, third: { id: 'ro.ping', glyph: 'ping', word: 'PING' } },
  hook: { fire: ['throw', 'THROW'], aim: ['payout', 'PAY OUT'], reeling: 'REEL', third: { id: 'jump', glyph: 'jump', word: null } },
  brush: { fire: ['club', 'ATTACK'], aim: ['flick', 'FLICK'], third: { id: 'lock', glyph: 'lock', word: 'LOCK' } },
  veritome: { fire: ['photo', 'PHOTO'], aim: ['lens', 'LENS'], third: { id: 've.mind', glyph: 'mind', word: 'REPROGRAM' } },
  dreamvane: { fire: ['pick', 'PICK'], aim: ['dowse', 'DOWSE'], third: { id: 'dv.survey', glyph: 'survey', word: 'SURVEY' } },
  crucibelle: { fire: ['toll', 'TOLL'], aim: ['high', 'HIGH'], third: null },
  lockheart: { fire: ['hoover', 'HOOVER'], aim: ['open', 'OPEN'], third: null },
};
/** The duel's moves by the tool that brings them (progress/duel/couriertools.js), in the keys' order. */
const DUEL_MOVES = [
  ['psygun', 'du.shoot', 'psfire', 'SHOOT'], ['sondelass', 'du.grab', 'throw', 'GRAB'], ['dreamvane', 'du.drill', 'drill', 'DRILL'],
  ['soulbrush', 'du.paint', 'paint', 'PAINT'], ['crucibelle', 'du.tune', 'tune', 'TUNE'], ['crucibelle', 'du.delay', 'delay', 'DELAY'],
  ['lockheart', 'du.hold', 'hold', 'HOLD'], ['lockheart', 'du.send', 'send', 'SEND'], ['veritome', 'du.read', 'read', 'READ'],
];
/** The first duel's step asked (lesson.js, PUZZLE-DUELS.md 18.3), lit on its tile: no words but the verb's own. */
const askedOf = (s) => { const L = s?.lesson, steps = s ? stepsOf(s) : []; return L && L.step < steps.length && s.toMove === 0 ? steps[L.step].id : null; };
const FORMS = [['so.cutlass', 'sofcutlass', 'cutlass'], ['so.rod', 'sofrod', 'rod'], ['so.hook', 'sofhook', 'hook']];

/** On foot (the bindings' ctx): the strip and the belt's pair stand only there (riding the Solar Skiff, LEND, DRAW and BLINK cannot be done). */
const onFoot = (g) => { const L = g.actions?.live?.(); return L ? L.has('foot') : !g.techs?.get?.('skiff')?.riding; };
const techs = (g) => g.techs || g.player?.techs;
const learned = (g, id) => { const t = techs(g)?.get?.(id); return !!t && (t.usable ? t.usable() : !!t.enabled); };
const E = (id, glyph, word = null, more = {}) => ({ id, glyph, word, ...more });

/** The ctx word of the tool in the hands (the bindings' `tool.<id>` without its prefix), or null. */
export function inHandCtx(g) {
  const t = g?.belt?.inHand; if (!t) return null;
  return t.id === 'sondelass' ? t.form || 'cutlass' : t.id === 'soulbrush' ? 'brush' : t.id;
}

/** On foot, nothing in the hands: JUMP, CROUCH, DASH, the fourth by context (USE, else PARRY, else BLINK); carrying, THROW and PUT DOWN. */
export function footCluster(g, use) {
  const C = g?.player?.techs?.get?.('carry') || g?.techs?.get?.('carry');
  if (g?.techs?.active?.id === 'push') return [E('use', null, 'PUSH'), E('jump', 'jump'), E('crouch', 'crouch', 'CROUCH')]; // (F held is the push: the chevron's USE is gone while it runs, and a tile swapped out lets go; the touch audit, 2026-10-25)
  if (C?.engaged) return [E('fire', 'throw', 'THROW'), E('use', null, 'PUT DOWN'), E('jump', 'jump'), E('crouch', 'crouch', 'CROUCH')]; // (a pot in both hands: the fire button throws it, F sets it down, courier/moves/carry.js; the owner's iPhone, v274)
  const fourth = use ? 'use' : learned(g, 'kick') ? E('parry', 'parry', 'PARRY') : null;
  // (one blink tile: the DASH tile's face follows its press, BLINK on the ground standing once Blink is learned, Petra's ctx foot.ground;
  //  South, 2026-10-29: "the blink tile should be folded into the current dash tile")
  const blinks = g.actions?.resolve?.('touch', 'dash')?.id === 'blink.ground';
  return [E('jump', 'jump'), E('crouch', 'crouch', 'CROUCH'), blinks ? E('dash', 'blink', 'BLINK') : E('dash', 'dash', null), fourth];
}

/** A tool out: FIRE and AIM in its verbs, its third, PARRY the fourth. */
export function toolCluster(g, ctx) {
  const T = ACTION_TILES[ctx]; if (!T) return null;
  const tool = g.belt?.inHand, fire = E('fire', T.fire[0], T.fire[1], { corner: TOOL_LABEL[g.belt?.main]?.toUpperCase() ?? null }), aim = E('aim', T.aim[0], T.aim[1]);
  if (ctx === 'rod' && tool?.angler?.state === 'fight') { fire.word = T.fishOn.fire; aim.word = T.fishOn.aim; }
  if (ctx === 'hook' && tool?.hookshot?.reeling) fire.word = T.reeling;
  let third = T.third ? { ...T.third } : null;
  if (third?.id === 've.mind' && !g.reprogram?.target?.()) third = null; // (REPROGRAM: shown by a stunned mind)
  // (USE takes PARRY's slot while the chevron is on a thing outside a fight: MOBILE.md 4.1, Dovina 2026-10-29)
  const u = g.interact?.cur && g.liveMoment?.() !== 'fight' ? useLabel(g) : null;
  return [fire, aim, third, u ? E('use', null, u.word) : E('parry', 'parry', 'PARRY')];
}

/** A puzzle duel: END TURN, FINISHER on a broken foe, FLEE, FORM. */
export function duelCluster(g) {
  const D = g.duel, s = D?.state; if (!s) return [];
  const S = s.sides[0], broken = (s.sides[1]?.depth || 0) > 0, mine = !!D.mine;
  return [
    s.style === 'pve' ? null : E('du.end', 'endturn', 'END TURN', { dim: !mine, charge: mine && S.ap > 0 ? s.apLeft / S.ap : 0 }), // (its rim the action points left)
    broken ? E('du.finish', 'finisher', 'FINISHER', { dim: !mine }) : null,
    E('du.flee', 'flee', 'FLEE', { dim: !mine }),
    s.style === 'pve' ? null : E('du.undo', 'undo', 'UNDO', { dim: !mine || !s.undo?.length }), // (the PvE duel's drag is committed: no undo, PUZZLE-DUELS.md 23.1) // (the last action this turn taken back: dim with nothing to take back)
    oneGesture(s) ? null : S.form === 'hand' ? E('du.form', 'formcourier', 'COURIER', { dim: !mine, lit: askedOf(s) === 'form' }) : E('du.form', 'grab', 'HAND', { dim: !mine }),
  ];
}

/** The helm's throttle steps (helm.js THROTTLE's order), as the throttle tiles word them. */
const THROTTLE_WORDS = ['STOP', 'SLOW', 'CRUISE', 'FULL'];
const worn = (g, id) => g.belt?.main === id || g.belt?.sub === id;
const atHelm = (g) => { const L = g.actions?.live?.(); return L ? L.has('helm') : !!g.opensea?.sailing; };

/** What F does at the helm now (opensea.js sail: a quay within ROOM.quay, an islet within ROOM.moor), or null. */
export function helmUse(g) {
  const R = g.opensea, H = R?.helm; if (!H || !R.props) return null;
  for (const q of Object.values(R.props.quays || {})) if (Math.hypot(q.pos.x - H.pos.x, q.pos.z - H.pos.z) < ROOM.quay) return 'DOCK';
  return R.nearIslet?.(H.pos, ROOM.moor) ? 'MOOR' : null;
}

/** At the helm: FIRE and PARRY while a sea serpent hunts, else USE where F moors or docks; the throttle's two. */
export function helmCluster(g) {
  const H = g.opensea?.helm; if (!H) return [];
  const t = H.throttle | 0, use = helmUse(g);
  const up = E('throttle.up', 'throttleup', THROTTLE_WORDS[Math.min(3, t + 1)], { dim: t >= 3 }), down = E('throttle.down', 'throttledown', THROTTLE_WORDS[Math.max(0, t - 1)], { dim: t <= 0 });
  if (g.seaFight?.serpent) return [E('fire', 'psfire', 'FIRE'), E('parry', 'parry', 'PARRY'), up, down];
  return [use ? E('use', null, use) : null, up, down];
}

/** The broadside's side now (seafight.js `broadside`'s own test: the camera's look on port's normal, past SEA_FIGHT.broadside.beam), and
 *  its reload as a charge 0..1 (1 loaded); no side bearing, the readier side's, `bears` false. */
export function broadsideOf(g) {
  const F = g.seaFight, H = g.opensea?.helm, BS = SEA_FIGHT.broadside; if (!F?.reload || !H) return null;
  const d = g.camera?.getWorldDirection?.(_look), dot = d ? d.x * Math.cos(H.yaw) - d.z * Math.sin(H.yaw) : 0, bears = Math.abs(dot) >= BS.beam;
  const k = bears ? (dot > 0 ? 0 : 1) : F.reload[0] <= F.reload[1] ? 0 : 1;
  return { side: k ? 'starboard' : 'port', charge: Math.max(0, Math.min(1, 1 - F.reload[k] / BS.reload)), bears };
}
const _look = new THREE.Vector3();

/** The mounts at sea by their tiles (world/opensea/seamounts.js: keys 1 and 2 fire the worn tools in order, main first; a passive one,
 *  sonar, has none): its glyph (ui/icons/touchmountart.js) and word (placeholders, Espada's), its cooldown as the rim's charge (1 ready),
 *  the toll's charges left as pips, dim while it cannot be paid (no charge left, the pool short of its cost). */
const MOUNT_FACES = { sondelass: ['mharpoon', 'HARPOON'], crucibelle: ['mtoll', 'TOLL'], lockheart: ['mgulp', 'GULP'], veritome: ['mflash', 'FLASH'], soulbrush: ['mslick', 'SLICK'], dreamvane: ['msonar', 'SONAR'] };
export function mountsOf(g) {
  const F = g.seaFight?.mounts; if (!F) return [];
  return F.worn.map((t, i) => {
    const M = SEA_MOUNTS[t], face = MOUNT_FACES[t]; if (!M || M.passive || !face || i > 1) return null;
    const cd = F.cd?.[t] || 0, left = M.charges ? M.charges - (F.used?.[t] || 0) : null, pool = g.lachryma?.available;
    return E(`mount.${i + 1}`, face[0], face[1], { corner: String(i + 1), charge: M.cooldown ? Math.max(0, Math.min(1, 1 - cd / M.cooldown)) : 1, pips: left ?? 0, dim: left === 0 || (M.cost > 0 && pool != null && pool < M.cost) });
  }).filter(Boolean);
}

/** The helm's strip: BROADSIDE, the worn mounts (1, 2), FIX with the Dreamvane worn, PLATE with the Veritome, USE while a serpent holds the cluster. */
function helmStrip(g) {
  const use = g.seaFight?.serpent ? helmUse(g) : null, B = broadsideOf(g);
  return [use ? E('use', null, use) : null, // (BROADSIDE and the mounts on the near shelf: nearOf)
    worn(g, 'dreamvane') ? E('fix', 'fix', 'FIX') : null, worn(g, 'veritome') ? E('plate', 'photo', 'PLATE') : null].filter(Boolean);
}

/** The mount a tap of Y calls (Petra's JellyMount: the last one chosen, once the slip jelly is open), its glyph and word. */
export const mountFace = (g) => { const J = g.jellyMount; let jelly = false; try { jelly = J?.last === 'jelly' && !!J.open?.(); } catch { /* not there */ } return jelly ? { glyph: 'jelly', word: 'JELLY' } : { glyph: 'skiff', word: 'SKIFF' }; };

/** DRAW (STOW while the main is out), LEND (the sub's verb) and SWAP (main and sub traded, Belt.swap) at the cluster's top edge, on foot;
 *  SKIFF or JELLY (the top bar's, folded under MENU on a phone: the mount a tap calls) where a mount may come: the Raceway or the Dunes. */
export function beltPairOf(g) {
  if (g.duel?.active || !onFoot(g)) return [];
  const B = g.belt, M = mountFace(g), skiff = g.raceway?.active || g.dunes?.active ? E('skiff', M.glyph, M.word) : null;
  if (!B?.main) return skiff ? [skiff] : [];
  const out = !!B.inHand && B.inHand.id === B.main, gift = B.sub ? SUB_GIFTS[B.sub] : null;
  return [ // (USE with a tool drawn is the cluster's, in PARRY's slot outside a fight: toolCluster)
    skiff,
    B.sub ? E('swap', 'swap', 'SWAP') : null,
    gift ? E('lend', 'lend', gift.verb.toUpperCase()) : null,
    out ? E('tool', 'stow', 'STOW', { lit: true }) : E('tool', 'draw', 'DRAW'),
  ].filter(Boolean);
}

/** The strip over the cluster: the tool's own row, or the duel's moves. */
export function stripOf(g) {
  if (g.duel?.active) return []; // (the duel's moves stand in the duel's phone screen: duelscreen.js)
  if (atHelm(g)) return helmStrip(g);
  if (!onFoot(g)) return [];
  const ctx = inHandCtx(g), art = artTile(g);
  if (!ctx) return art ? [art] : []; // (nothing in hand: BLINK is the DASH tile's face on the ground, footCluster)
  const out = art ? [art] : [], tool = g.belt.inHand;
  if (ctx === 'psygun') {
    const S = g.shells, n = S?.gun?.chambers ?? S?.chambers?.length ?? 0;
    // (a pick is one tile, MOBILE.md 4.1: CHAMBER showing the chosen one's number; a tap the next chamber, a hold the cylinder as a radial)
    const k = Math.max(0, S?.selected ?? 0), ids = Array.from({ length: Math.min(7, n) }, (_, i) => `ps.ch${i + 1}`);
    if (ids.length) out.push(E('ps.chamber', 'chamber', String(k + 1), { cycle: ids, at: k, radial: ids.map((id, i) => E(id, 'chamber', String(i + 1), { lit: k === i })) }));
    out.push(E('ps.fan', 'fan', 'FAN'));
    if (g.weapon?.play?.scoped) out.push(E('ps.breath', 'breath', 'BREATH'));
  } else if (ctx === 'cutlass' || ctx === 'rod' || ctx === 'hook') {
    const k = Math.max(0, FORMS.findIndex(([, , form]) => form === ctx)); // (the forms one FORM tile, its face the form in hand: a tap the next, a hold the three as a radial)
    out.push(E('so.form', FORMS[k][1], 'FORM', { cycle: FORMS.map(([id]) => id), at: k, radial: FORMS.map(([id, glyph, form]) => E(id, glyph, null, { lit: form === ctx })) }));
    if (ctx === 'rod') out.push(E('ro.lure', 'lure', 'LURE'), E('ro.crank', 'crank', 'CRANK'));
  } else if (ctx === 'brush') {
    const mode = (tool?.load || tool?.tech?.load)?.mode || 'paint';
    out.push(mode === 'paint' ? E('br.mop', 'brmop', 'MOP') : E('br.paint', 'paint', 'PAINT')); // (one tile, its two faces: the one it goes to)
  } else if (ctx === 'veritome') out.push(E('ve.flash', 'flash', 'FLASH'));
  else if (ctx === 'crucibelle') for (let i = 0; i < 5; i++) out.push(E(`cr.n${i + 1}`, null, null, { corner: String(i + 1), tint: DEGREE_COLOR[i], pad: true }));
  return out; // (a tool drawn keeps the core movement's moves on the near shelf: nearOf)
}

/** The worn class art's action (input action `art`, G on the desk; courier/classarts/body.js): its label the face, its rim the cooldown
 *  filling back (real seconds, `classArtsRun.cool`), dim while cooling or the pool short of its cost. On the far shelf, its first tile:
 *  the near shelf's three already reach the centre's edge at 896 x 414 (a fourth would stand in the middle). */
export function artTile(g) {
  const R = g.classArts?.numbers?.('action'), run = g.classArtsRun; if (!R) return null;
  const left = Math.max(0, (run?.cool?.[R.id] ?? 0) - (run?.now ?? 0)), full = R.cooldown || 1;
  const short = R.cost > 0 && (g.lachryma?.value ?? Infinity) < R.cost;
  return E('art', 'art', String(R.label || 'ART').toUpperCase(), { charge: left > 0 ? 1 - left / full : 0, dim: left > 0 || short });
}

/** THE NEAR SHELF (MOBILE.md 4.1): up to three tiles over the cluster on the right edge. With a tool drawn, CROUCH, DASH (BLINK on the
 *  ground, as the foot cluster's) and JUMP (the hook's third is JUMP already); at the helm, BROADSIDE and the mounts. */
export function nearOf(g) {
  if (g.duel?.active) return [];
  if (atHelm(g)) { const B = broadsideOf(g); return [B ? E('broadside', 'broadside', 'BROADSIDE', { charge: B.charge, dim: !B.bears }) : null, ...mountsOf(g)].filter(Boolean).slice(0, 3); }
  if (!onFoot(g)) return [];
  const ctx = inHandCtx(g); if (!ctx) return [];
  const blinks = g.actions?.resolve?.('touch', 'dash')?.id === 'blink.ground';
  return [E('crouch', 'crouch', 'CROUCH'), blinks ? E('dash', 'blink', 'BLINK') : E('dash', 'dash', null), ctx === 'hook' ? null : E('jump', 'jump')].filter(Boolean);
}

/** A puzzle duel's tool moves: the worn tools' (the kernel's `S.tools`: couriertools.js `wears`), ROTATE first under a picked piece in the
 *  hand's form; dim where the moment or the form refuses them, lit while one is held (a song sung, a read open). */
export function duelTools(g) {
  const D = g.duel, s = D.state; if (!s) return [];
  if (s.style === 'pve') return powerTiles(g, s); // (the PvE duel: the hand's seven powers, PUZZLE-DUELS.md 24)
  if (oneGesture(s)) return skillTiles(g, s); // (the one-gesture duel: the worn pair as two skills, PUZZLE-DUELS.md 22)
  const S = s.sides[0], worn = S.tools ? new Set(S.tools) : null, hand = S.form === 'hand', out = [], legal = legalKinds(s);
  const cell = D.picked || D.hover, piece = hand && cell ? s.board?.at?.(cell.x, cell.y) : null; // (on touch the picked cell: pick, then ROTATE)
  const ask = askedOf(s), fogged = !!s.rs?.fog && s.rs.fog.side !== 0; // (Read only where Dread's fog hides the foe: couriertools.js)
  if (hand) out.push(E('du.rotate', 'rotate', 'ROTATE', { dim: !D.mine || !piece || piece.kind === 'body', lit: ask === 'move' })); // (always first in the hand's form: the column never shifts under the thumb)
  if (hand) return out; // (the hand's form shows the hand's verbs only: the Courier's tools stand down until you dive in, South 2026-10-27: "UI hidden when not in use")
  for (const [tool, id, glyph, word] of DUEL_MOVES) {
    if ((worn && !worn.has(tool)) || (id === 'du.read' && !fogged)) continue;
    const spent = (id === 'du.tune' && !!S.tune) || (id === 'du.read' && S.read > 0); // (a song sung this turn, a read still open: lit, not again)
    const held = (id === 'du.tune' && !!S.tune) || (id === 'du.paint' && !!D.armed); // (the armed one gold: a song holding, a Paint's reach up)
    if (D.mine && !spent && !held && !legal.has(id.slice(3))) continue; // (a move the kernel would refuse now is not on the glass: Dovina's ruling, 2026-10-27)
    out.push(E(id, glyph, word, { dim: hand || !D.mine || spent, lit: (!hand && ask === 'tool') || held }));
  }
  return out;
}

/** The tool's key in the duel's bindings, by the move it owned (the session arms a skill by any of its tool's keys). */
const SKILL_TILE = { psygun: ['du.shoot', 'psfire'], sondelass: ['du.grab', 'throw'], dreamvane: ['du.drill', 'drill'], soulbrush: ['du.paint', 'paint'], crucibelle: ['du.tune', 'tune'], lockheart: ['du.hold', 'hold'], veritome: ['du.read', 'read'] };
/** The one-gesture duel's two skill tiles: the skill's label, its rim the charge filling to `need`, lit when full or armed, dim on the
 *  foe's turn (Puzzle & Dragons' skill gauge on its portrait). */
function skillTiles(g, s) {
  const D = g.duel, ask = askedOf(s); return skillsOf(s, 0).map((K) => { const [id, glyph] = SKILL_TILE[K.tool] || ['du.shoot', 'psfire'];
    return E(id, glyph, K.label.toUpperCase(), { charge: Math.min(1, K.charge / K.need), lit: (K.ready && !!D.mine) || D.armedSkill === K.tool || (ask === 'skill' && K.ready), dim: !D.mine || !K.ready }); });
}

/** The PvE duel's seven power tiles (progress/duel/powers.js powersOf), in the domains' order: each in its domain's sign and palette
 *  (DOMAIN_LOOK), square (two to a row in the left flank), its label under it shrunk to fit, its pool cost in the corner; its rim the rest running out (full again when ready), gold while
 *  armed, dim while resting, too dear, or one already cast this turn (Puzzle & Dragons' skill cooldowns on the team's portraits). */
function powerTiles(g, s) {
  const D = g.duel; return powersOf(s, 0).map((P) => { const L = DOMAIN_LOOK[P.domain] || {};
    return E(`du.power.${P.id}`, P.id === 'kindle' || P.id === 'absorb' ? `godart.${P.id}` : L.icon || null, P.label.toUpperCase(), { corner: String(P.cost), square: true, pal: L.pal, charge: P.left ? 1 - P.left / Math.max(1, P.rest) : 1,
      lit: D.armedPower === P.id, dim: !D.mine || !P.ready }); });
}

/** The kinds the kernel would take from the Courier's side now (legalActions, progress/duel/duel.js), asked once a change of the turn. */
let legalMemo = { s: null, key: '', kinds: new Set() };
function legalKinds(s) {
  const key = `${s.ply}|${s.toMove}|${s.apLeft}|${s.sides[0].form}|${s.undo?.length ?? 0}|${s.sides[0].tune ? 1 : 0}|${s.sides[0].read ?? 0}`;
  if (legalMemo.s === s && legalMemo.key === key) return legalMemo.kinds;
  let kinds = new Set(); try { if (s.toMove === 0 && s.winner == null && s.sides[0].form !== 'hand') kinds = new Set(legalActions(s, 0, { drags: 0 }).map((a) => a.kind)); } catch { /* a state the kernel cannot read: nothing legal */ }
  legalMemo = { s, key, kinds }; return kinds;
}
