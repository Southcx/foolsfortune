// ---------------------------------------------------------------------------------------
// THE SHARED FOE: guests on the Great Dunemaw's errand fight one Great Slip Jelly (COOP.md C5, Dovina's rulings). Every player in the
// great cavern on the same game day's run says, in the room's presence, what they have done to its FOE: the health they took off
// (`d`) and the crown's crack they laid (`k`). Every page then holds its own FOE at the party's sum: its health the scaled whole
// (HEALTH x (1 + 0.75 per player beyond the first): two 1.75x, three 2.5x, four 3.25x; siblings never scale it) less every player's
// take, its crown cracked by everyone's blows. No host: each page adds the same numbers, so they agree as the presence arrives, and a
// player who leaves keeps what they did. The FOE's own heal is said only by the first player (the lowest peer id), so it is counted
// once. Its burst is each page's own: each player is paid their own run (C5: never split), its casts aim at the player each page has.
// What it carries in the presence is `w { r: the run's game day, a: the attempt, d, k, dn: down, tt, and the leader's p, f, n }`, only while in the great cavern.
// THE PARTY'S WIPE (C5): in a party, a shatter makes you whole at the Lip Stone with the fight going on, and you are down for `DOWN` real
// seconds; when every player on the attempt is down at once, each page lays its cavern again (the Dunemaw's wipe) and the attempt goes up.
// Only players on the same attempt are summed, and a page that hears a later attempt lays its cavern again too (the party returns
// together); one that has done nothing to this FOE yet takes the number without laying it again.
// ONE BODY (C5: its casts shared, Lidfall and Shoulder Charge at the player it faces): the first player leads. It says where its FOE's
// body stands (`p`), how far its fight's timeline has run (`tt`, -1 before the pull), whom it faces (`f`, the nearest player's peer id)
// and the pool it will come up in (`n`, while under). Every other page eases its FOE to that place (snapped past 6 m), keeps its
// timeline within 0.75 s of the leader's (creatures/ai/timeline.js seek) and aims it at that player (`F.prey`: their Courier as this
// page draws it); a pull on any page wakes them all. Its blows strike only the Courier of the page they are drawn on; Ooze Rain and
// the trail's slip fall on each player's own page (Slip Trail follows each player).
// Prior art: Monster Hunter's multiplayer (the host's quest, the monster's health scaled by hunters); CRDT counters (a grow-only sum
// of each peer's own count converges with no order and no host: Shapiro et al., 2011).
//
//   game.sharedFoe = new SharedFoe(game)   .say() -> { r, a, d, k, dn } | null   .hear(peer, w)   .forget(peer)   .update(dt)   .players
// Events: party.down { seconds, by }, party.wipe { attempt, by }.
//   .inParty   .down() (a shatter in the fight while in a party: true when it is the party's to carry)
// ---------------------------------------------------------------------------------------
import { HEALTH } from '../progress/combat/greatjelly.js';
import * as THREE from 'three';
import { today } from '../core/calendar.js';

const _up = new THREE.Vector3(0, 1, 0), _at = new THREE.Vector3();

/** The FOE's health for a party: the whole, scaled by every player beyond the first (MH's multiplayer scaling, C5). */
export const SHARED = { per: 0.75, max: 4, down: 20, snap: 6, follow: 3, drift: 0.75 }; // (down: real seconds a shattered player counts toward the party's wipe; snap: metres past which a follower's FOE is set at the leader's; follow: its ease a second; drift: real seconds of timeline it may lag)
export const scaleOf = (players) => 1 + SHARED.per * (Math.min(SHARED.max, Math.max(1, players)) - 1);

export class SharedFoe {
  constructor(game) {
    this.game = game; this.peers = new Map(); this.run = null; this.foe = null;
    this.d = 0; this.k = 0; this.laid = 0; this.lastHp = null; this.lastCrack = 0; this.a = 0; this.downT = 0; this.facing = null;
  }

  /** The FOE now in the great cavern, or null (the Great Dunemaw's current floor: world/well/dunemaw.js). */
  get current() { const C = this.game.well?.cur; return C?.isCavern && C.foe && !C.foe.disposed ? C.foe : null; }
  /** Players on this run's FOE: you and every peer who said the same run. */
  get players() { return 1 + this.others().length; }
  /** The peers on this run's FOE and this attempt. */
  others() { return this.entries().map(([, w]) => w); }
  entries() { return [...this.peers.entries()].filter(([, w]) => w.r === this.run && w.a === this.a); }
  /** Others on this attempt: the shatter is the party's (death.js asks through the Dunemaw's reformAt). */
  get inParty() { return !!this.current && this.others().length > 0; }
  /** Your shatter in a party's fight: down for SHARED.down real seconds; the fight goes on. */
  down() { if (!this.inParty) return false; this.downT = SHARED.down; this.game.events?.emit('party.down', { seconds: SHARED.down, by: 'courier' }); return true; }
  /** Am I the first of the party (who says the FOE's own heal)? */
  get first() { const mine = this.game.guests?.me ?? ''; return [...this.peers.entries()].every(([p, w]) => w.r !== this.run || String(mine) < String(p)); }

  /** What this page says: its run and take, only in the great cavern. */
  say() {
    const F = this.current; if (!F || this.run == null) return null;
    const w = { r: this.run, a: this.a, d: Math.round(this.d), k: +this.k.toFixed(3), dn: this.downT > 0 ? 1 : 0, tt: F.raid?.pulled ? +F.raid.T.t.toFixed(2) : -1 };
    if (this.first && this.peers.size) { const c = F.c; w.p = [+c.pos.x.toFixed(2), +c.pos.z.toFixed(2)]; w.f = this.facing ?? null; if (F.state === 'under') w.n = F.next; } // (the leader's: its body, its prey, its pool)
    return w;
  }
  hear(peer, w) {
    if (!w || typeof w !== 'object' || !Number.isFinite(+w.d) || !Number.isFinite(+w.k)) { this.peers.delete(peer); return; }
    const p = Array.isArray(w.p) && w.p.length === 2 && w.p.every(Number.isFinite) ? [+w.p[0], +w.p[1]] : null;
    this.peers.set(peer, { r: w.r, a: Math.max(0, w.a | 0), d: +w.d, k: Math.max(0, +w.k), dn: w.dn ? 1 : 0, tt: Number.isFinite(+w.tt) ? +w.tt : -1,
      p, f: w.f == null ? null : String(w.f), n: Number.isInteger(w.n) ? w.n : null }); // (d may fall: the first player's take is net of the FOE's heal)
  }
  forget(peer) { this.peers.delete(peer); }

  update(dt = 0) {
    if (this.downT > 0) this.downT = Math.max(0, this.downT - dt);
    let F = this.current;
    // (the attempt: a later one heard lays this cavern again, or is taken as it is when this page has done nothing to its FOE yet)
    const later = Math.max(this.a, ...[...this.peers.values()].filter((w) => w.r === this.run).map((w) => w.a));
    if (F && later > this.a) { const fresh = !this.d && !this.k && !this.downT; this.a = later; if (!fresh) F = this.layAgain(); }
    else if (F && this.downT > 0 && this.others().length && this.others().every((w) => w.dn)) { this.a++; F = this.layAgain(); } // (every player down at once: the party's wipe)
    if (F !== this.foe) { this.foe = F; this.d = 0; this.k = 0; this.lastHp = F?.c.hp ?? null; this.lastCrack = F?.crack ?? 0; this.laid = 0; this.run = F ? today() : null; }
    if (!F || F.ended) return;
    const c = F.c;
    // (what this page did since the last frame: its own blows; the FOE's own heal said by the first only, so it is counted once)
    const dh = this.lastHp - c.hp; if (dh > 0 || this.first) this.d += dh;
    const dk = F.crack - this.lastCrack; if (dk > 0) this.k += dk;
    const others = this.others();
    this.body(F, dt);
    if (others.length) {
      // (the party's sum laid on this page's FOE: its health of the scaled whole, its crown cracked by everyone's blows)
      const max = HEALTH * scaleOf(1 + others.length), taken = this.d + others.reduce((s, w) => s + w.d, 0);
      c.maxHp = max; c.hp = Math.max(0, Math.min(max, max - taken));
      const theirs = others.reduce((s, w) => s + w.k, 0); // (the others' crack: laid through the crown, so its stages are drawn; not the Courier's, never counted)
      if (theirs > this.laid) { F.addCrack(theirs - this.laid, 'party', 'environment'); this.laid = theirs; }
      if (c.hp <= 0 && c.alive) this.game.jellies?.burst(c, _up, 'courier', 'party'); // (the party's last blow: each page's FOE bursts, each player paid their own run)
    }
    this.lastHp = c.hp; this.lastCrack = F.crack;
  }
  /** One body for the party: the leader faces the nearest player; every other page follows its place, its timeline and its prey. */
  body(F, dt) {
    const g = this.game, c = F.c, R = F.raid, me = String(g.guests?.me ?? ''), on = this.entries();
    if (!on.length) { F.prey = null; this.facing = null; return; }
    if (R && !R.pulled && on.some(([, w]) => w.tt >= 0)) F.wake(); // (the pull is the party's: one player's wakes it for all)
    const guest = (id) => (g.guests?.list || []).find((G) => String(G.peer) === id);
    if (this.first) { // (the leader: the nearest player is the one it faces)
      const P = g.player.pos; let best = null, bd = Math.hypot(P.x - c.pos.x, P.z - c.pos.z);
      for (const [id] of on) { const G = guest(String(id)); if (!G) continue; const d = Math.hypot(G.pos.x - c.pos.x, G.pos.z - c.pos.z); if (d < bd) { bd = d; best = G; } }
      F.prey = best ? best.pos : null; this.facing = best ? String(best.peer) : me;
      return;
    }
    const [, L] = on.reduce((a, b) => (String(b[0]) < String(a[0]) ? b : a)); // (the leader: the lowest peer id)
    if (L.f != null) F.prey = L.f === me ? null : guest(L.f)?.pos || null;
    if (L.p && c.root.visible && F.state !== 'under' && F.state !== 'hidden') {
      const dx = L.p[0] - c.pos.x, dz = L.p[1] - c.pos.z;
      if (Math.hypot(dx, dz) > SHARED.snap) g.jellies?.place(c, _at.set(L.p[0], c.pos.y, L.p[1]), c.yaw);
      else { const k = 1 - Math.exp(-SHARED.follow * dt); c.pos.x += dx * k; c.pos.z += dz * k; }
    }
    if (L.n != null && F.state === 'under') F.next = L.n;
    if (R?.pulled && L.tt >= 0 && Math.abs(R.T.t - L.tt) > SHARED.drift) R.T.seek(L.tt);
  }
  /** The party's wipe on this page: the cavern laid again by the Dunemaw (its FOE whole and asleep), the Courier at the Lip Stone. */
  layAgain() {
    const g = this.game, W = g.well, at = W?.wipe?.(); this.downT = 0;
    if (at) { g.course?.teleport(at.pos, at.yaw, { keepPool: true }); g.events?.emit('party.wipe', { attempt: this.a, by: 'courier' }); }
    return this.current;
  }
}
