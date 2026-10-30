// ---------------------------------------------------------------------------------------
// THE SEEDS' LOOKS IN PLAY: a planetoid grown from a seed kept dressed as the ring has it, and its growth drawn (Petra's ring,
// world/garden/orbit.js; Dovina's rules, progress/seeds.js; docs/plans/SEEDS-SLABS-SCANS.md section 1). One job: watch the ring's
// planted seeds (`realm.orbit.planted`) and tell each planetoid's look what it is.
//
//   DRESSED      each seed's planetoid, and a large one's own moon, given its kind, its moonlet's feeling and the tint of what it was fed
//                (`tintOf`) through `look.dressSeed` (vfx/garden/planetoid.js), drawn again only when one of them changes (a key a look:
//                a feeding that leaves the tint where it was redraws nothing). Asked on `seed.plant`, `seed.feed`, `garden.enter` and
//                every half real second (a save loaded plants without an event)
//   A GROWTH     on `seed.grow` (after the ring's regrow has made the new look): the planetoid swells from its old radius to its new
//                one, a damped spring past the whole and back (look.swell: 1.4 real s), and a burst of its own matter (its kind's colour)
//                is thrown off its old surface at twelve points round it (`garden.seed.grow`, the library's: vfx/library/garden.js);
//                two sizes passed at once swell once, from the first
//   THE POUR     the island's matter falling from the god hand onto a seed, with its ring of accretion (vfx/garden/seedpour.js)
//
// Prior art: Super Mario Galaxy's Hungry Luma (fed, it swells, bursts and is a planet), accretion as planets form (matter drawn into a
// disc and gathered), and the squash and stretch of a growing toy's spring (Disney's principles; Nintendo's "boing").
//
//   game.seedLooks = new SeedLooks(game)   .update(rawDt)   (dresses as the ring plants and feeds; swells and bursts on seed.grow)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SEEDS, SIZES, tintOf } from '../../progress/seeds.js';
import { matterOf } from './seedplanetoids.js';
import { SeedPour } from './seedpour.js';

/** A growth's burst: how many points round the old surface it is thrown from; the half real second between looks at the ring. */
const SEED_LOOK = { burst: 12, poll: 0.5 };
const _d = new THREE.Vector3(), _p = new THREE.Vector3();

export class SeedLooks {
  constructor(game) {
    this.game = game; this.keys = new WeakMap(); this.radius = new Map(); this.pollT = 0; this.dirty = true; this.pour = null;
    const E = game.events;
    for (const n of ['seed.plant', 'seed.feed', 'garden.enter']) E?.on(n, () => { this.dirty = true; });
    E?.on('seed.grow', (e) => this.grew(e));
  }

  update(raw = 1 / 60) {
    const R = this.game.realm; if (!R?.built || !R.orbit) return;
    if (this.dirty || (this.pollT -= raw) <= 0) { this.dirty = false; this.pollT = SEED_LOOK.poll; this.sync(R.orbit); }
    if (R.active || this.pour) (this.pour ||= new SeedPour(this.game, R)).update(raw);
  }
  /** Every planted seed's look (and a large one's own moon) dressed as the ring has it; its radius noted (a growth swells from it). */
  sync(O) {
    for (const [id, r] of O.planted) {
      const look = r.planet?.look; if (!look) continue;
      this.dress(look, r, id); if (r.moon) this.dress(r.moon, r, id);
      if (!this.radius.has(id)) this.radius.set(id, look.R);
    }
  }
  dress(look, r, id) {
    const S = SEEDS[id]; if (!S || !look?.dressSeed) return;
    const t = S.inner ? null : tintOf(r.fed || {}), tint = t && { feeling: t.feeling, share: Math.round(t.share * 20) / 20 };
    const key = `${S.kind}|${S.feeling || ''}|${tint ? `${tint.feeling}${tint.share}` : ''}`;
    if (this.keys.get(look) === key) return;
    this.keys.set(look, key);
    // a large one's own moon made again as its parent's kind: its roots of stone are new and born flat, shaded now (casebook rule 171)
    if (look.dressSeed({ kind: S.kind, feeling: S.feeling || null, tint })) this.game.present?.shade?.();
  }

  /** `seed.grow { seed, size }`: the new look swells from the radius it had, and throws its matter off the old surface. */
  grew(e) {
    const r = this.game.realm?.orbit?.of?.(e.seed), look = r?.planet?.look; if (!look) return;
    const i = SIZES.findIndex((z) => z.id === e.size), was = this.radius.get(e.seed) ?? SIZES[Math.max(0, i - 1)].r;
    this.radius.set(e.seed, look.R); this.dress(look, r, e.seed);
    if (look.R <= was + 1e-3) return;
    look.swell(was / look.R); this.burst(r.planet, look, was);
  }
  burst(P, look, was) {
    const V = this.game.vfx; if (!V?.play) return;
    const n = SEED_LOOK.burst, tint = matterOf(look), scale = Math.max(0.7, look.R / 9);
    for (let k = 0; k < n; k++) {
      const y = 1 - (2 * (k + 0.5)) / n, s = Math.sqrt(1 - y * y), a = k * 2.399963;
      _d.set(Math.cos(a) * s, y, Math.sin(a) * s);
      _p.copy(P.c).addScaledVector(_d, was * look.shape(_d.x, _d.y, _d.z));
      V.play('garden.seed.grow', { pos: _p, normal: _d, dir: _d, tint, scale });
    }
  }
}
