// ---------------------------------------------------------------------------------------
// THE GOD HAND'S MUDRAS (LORE.md 4, "Mudras: the god hand's poses", Espada's; ruled by the owner, 2026-10-24): which pose the hand takes,
// and when. Ten poses: seven are the domains' (the finger-to-thumb four a planet touching the thumb's sign, the d12), three are moments
// (Abhaya, the palm shown; Varada, a miracle let go; Dhyana, the rest that lets the Dissonance Level ebb).
//
// A pose is a look first (base change bad, DESIGN.md 22): no pose changes a rule, gates a power or costs anything, and the hand's
// controls are as they were. What this decides is only when: the selected power's domain is held lightly while it is chosen; a cast
// strikes its domain's pose; an epic miracle's release opens Varada; the palm die growing or shown raises Abhaya; and when the hand has
// been still and the Dissonance Level is above 0, it settles into Dhyana. Calissa's clips read `game.handPose.pose` (the hand's IK light).
//
// Prior art: the iconography of India and of Buddhism (each mudra a meaning held in the hand), Naruto's and the kuji-in's hand seals
// (a pose struck to cast); Black & White's hand, whose gestures were the interface; Okami's brush as the only verb.
//
//   MUDRAS[id] = { label, domain? , moment? }   DOMAIN_MUDRA[domain] -> id   POSE = { castHold, varada, abhaya, abhayaGlint, restAfter }
//   new HandPose(game) -> game.handPose: .pose { id, strength, why } | null   update(raw)   events: hand.pose { pose, why }
// ---------------------------------------------------------------------------------------
import { GOD_POWERS } from './godpowers.js';

/** The ten poses (LORE.md 4). `label` is what the screen says (plain; the Sanskrit lives in the Codex with its meaning). */
export const MUDRAS = {
  gyan: { label: 'index touch', domain: 'ouranurgy' },         // (Jupiter: index tip to thumb tip)
  shuni: { label: 'middle touch', domain: 'alteration' },      // (Saturn)
  surya: { label: 'ring touch', domain: 'divination' },        // (the Sun)
  buddhi: { label: 'little touch', domain: 'spellscription' }, // (Mercury)
  prana: { label: 'breath', domain: 'possession' },            // (the Moon: ring and little to the thumb)
  bhumisparsha: { label: 'earth touch', domain: 'manifestation' }, // (Venus: fingertips to the ground)
  karana: { label: 'horns', domain: 'psychokinesis' },         // (Mars: index and little raised)
  abhaya: { label: 'open palm', moment: 'the palm die shown' },
  varada: { label: 'giving hand', moment: 'a miracle let go' },
  dhyana: { label: 'rest', moment: 'the quiet that lets the Dissonance Level ebb' },
};
export const DOMAIN_MUDRA = Object.fromEntries(Object.entries(MUDRAS).filter(([, m]) => m.domain).map(([id, m]) => [m.domain, id]));

/** How long each moment holds (real seconds), and how long the hand must be still before it rests. The priorities: a release over the
 *  palm shown over a cast over the rest over the chosen power's light hold. */
export const POSE = { castHold: 0.8, varada: 1.6, abhaya: 2, abhayaGlint: 0.6, restAfter: 4, readyStrength: 0.4 };
const RANK = { release: 5, palm: 4, cast: 3, rest: 2, ready: 1 }; // (keyed by why the hand holds it, as hold() reads it)

/** The domain of a god power's or an art's id, if it has one. */
const domainOf = (id) => GOD_POWERS[id]?.domain ?? null;

export class HandPose {
  constructor(game) {
    this.game = game; this.pose = null; this.ready = null; this.timed = null; this.still = 0;
    const on = (k, f) => game.events?.on?.(k, f);
    on('god.select', (e) => { this.ready = DOMAIN_MUDRA[domainOf(e.id)] ?? null; });
    on('god.epic', () => this.hold('varada', POSE.varada, 'release'));
    on('god.miracle', () => this.hold('varada', POSE.varada * 0.6, 'release'));
    on('palm.grow', () => this.hold('abhaya', POSE.abhaya, 'palm'));
    on('palm.roll', () => this.hold('abhaya', POSE.abhaya, 'palm')); // (when the palm die is thrown: DICE.md 4)
    on('palm.condense', () => { if (this.game.god?.active) this.hold('abhaya', POSE.abhayaGlint, 'palm'); });
    // a cast: every god power tells `god.<id>` with `act` (godhand/powers.js); the domain's pose, struck
    for (const id of Object.keys(GOD_POWERS)) on(`god.${id}`, (e) => { if (e?.act !== false) { const m = DOMAIN_MUDRA[domainOf(id)]; if (m) this.hold(m, POSE.castHold, 'cast'); } });
  }
  /** A timed pose; a lower-ranked one never cuts a higher one short. */
  hold(id, secs, why) {
    this.still = 0;
    if (this.timed && RANK[this.timed.why] > RANK[why] && this.timed.left > 0) return;
    this.timed = { id, left: secs, why };
  }
  update(raw = 1 / 60) {
    const g = this.game, active = !!g.god?.active;
    if (!active) { if (this.pose) this.set(null); this.timed = null; this.still = 0; return; }
    if (this.timed) { this.timed.left -= raw; if (this.timed.left <= 0) this.timed = null; }
    const inp = g.input;
    this.still = inp && (inp.dx || inp.dy || inp.down?.size) ? 0 : this.still + raw; // (the hand moved, or a key or button is held: not at rest)
    const ebbing = (g.rejection?.level ?? 0) > 0;
    let next = null;
    if (this.timed) next = { id: this.timed.id, strength: 1, why: this.timed.why };
    else if (ebbing && this.still >= POSE.restAfter) next = { id: 'dhyana', strength: 1, why: 'rest' };
    else if (this.ready) next = { id: this.ready, strength: POSE.readyStrength, why: 'ready' };
    if (next?.id !== this.pose?.id || next?.why !== this.pose?.why) this.set(next);
  }
  set(pose) {
    this.pose = pose;
    this.game.events?.emit('hand.pose', { pose: pose?.id ?? null, why: pose?.why ?? null });
  }
}
