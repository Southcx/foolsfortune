// ---------------------------------------------------------------------------------------
// GUESTS: people the owner shares the game with, there with you (docs/plans/COOP.md; the glossary: guest). The published page's `room`
// (everyone who has the game open right now) carries each player's Courier as presence, about ten times a second: the place, where it
// stands and faces, how it moves (speed, ground, slide, crouch, the dash), and its look (its glazes). Each page draws the others as
// Couriers in its own world, wearing their own glazes and moving as they move, smoothed between messages. Each player keeps their own
// world (the same build and seed lay out the same land); nothing in the simulation is shared yet, so nothing can disagree: what a
// shared errand shares (Monster Hunter's model: the host's quest) is Dovina's ruling to come. Away from the published build (the dev
// server, the headless runs) there is no room and no one comes.
// The room also carries the chat line: what you say aloud goes to everyone here (the room's `chat` topic, open to Contributors), and
// so does a sibling's answer to you (coop/answer.js), so a guest hears your siblings as you do; what arrives is shown, never obeyed.
// A guest's siblings come with them (COOP.md C6: the party is the host's help): each one out in their world is said in the presence
// (`k`: who, where it stands and faces, how it moves) and drawn in yours as their sibling is drawn in theirs, in its division's look
// (party.js lookOf) with its tool in hand (coop/siblingtool.js); only seen, never solid, never struck, smoothed as the guest is.
// Safeguards: your lines go at most one every `SAY_GAP` seconds; a guest who sends more than `FLOOD` lines in ten seconds is not shown
// for the rest of them; a guest whose Courier has not been heard of for `STALE` seconds is hidden (a tab put away, a dropped line) and
// let go after `GONE`.
// IN THE SPIRIT GARDEN (SPIRIT-GARDEN.md item 21; COOP.md C8's GUEST rule): a guest in their own Inner Realm while you are in yours is
// drawn as their Pneuka Jar where it hops (`r` in the presence: its foot, up, forward, hops, ground; vfx/garden/guestjars.js, Calissa's),
// on your planetoids, in their glazes, its Courier hidden. Nothing a guest does reaches your garden: only where they are is shared, so
// the GUEST rule (hop, look; never place, prune, tend, bind or take) holds of itself. The one gift a visit waits on Dovina's transfer.
// Events: guest.join { guest }, guest.leave { guest }, guest.say { guest, line, sibling } (`guest` a display name from the `user`
// capability, or "Someone"; `sibling` set when it is a sibling answering that guest), guest.garden { guest } and { guest, leave: true }.
//
// Prior art: Journey (strangers in your world, nothing to say but a chirp), Dark Souls' phantoms (another player's Courier drawn in
// your world), and the networked games' interpolation of remote players (Valve's Source: draw a little in the past, between samples).
//
//   game.guests = new Guests(game, { makeRig })   .update(dt)   .list [Guest]   .feed(peers) (the room's peers; tests feed it by hand)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';
import { GROUPS } from '../core/physics.js';
import { DEFAULT_LOOK } from '../courier/vessel/glazes.js';
import { SIBLINGS, lookOf } from './party.js';
import { SiblingTool } from './siblingtool.js';

const SEND = 0.1; // (seconds between our own presence updates: the platform coalesces to about thirty a second; ten is enough to smooth)
const FOLLOW = 12; // (1/s: how fast a guest's drawn position closes on where it was last said to be, after moving on by its speed)
const FLAGS = { slide: 1, crouch: 2, dash: 4, mantle: 8, wall: 16 };
const PARTY = 2; // (a guest's siblings drawn at most: the party's own cap, coop/party.js)
const SAY_GAP = 0.8, FLOOD = 6, STALE = 5, GONE = 60; // (real seconds between your lines; a guest's lines in ten seconds; seconds unheard before hidden, before let go)
const nowS = () => performance.now() / 1000;
const _gd = new THREE.Vector3(0, -1, 0), _to = new THREE.Vector3();
const r2 = (x) => Math.round(x * 100) / 100;
const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g, ' ').trim().slice(0, n);

class Guest {
  constructor(peer, rig) { this.peer = peer; this.rig = rig; this.heardAt = nowS(); this.pos = new THREE.Vector3(); this.to = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.yaw = 0; this.c = null; this.lastYaw = 0; this.sibs = new Map(); this.sibMaking = new Set(); }
}

/** One of a guest's siblings as drawn here: a body moved as the guest's is, from what its guest says of it. */
class GuestSibling {
  constructor(game, id, rig) { this.game = game; this.id = id; this.rig = rig; this.pos = new THREE.Vector3(); this.to = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.yaw = 0; this.lastYaw = 0; this.c = null; this.tool = new SiblingTool(this); }
}

export class Guests {
  constructor(game, { makeRig }) {
    this.game = game; this.makeRig = makeRig; this.list = []; this.making = new Set(); this.sendT = 0; this.room = null; this.user = null;
    this.saidAt = -Infinity; this.lines = new Map(); // (when you last sent; each peer's recent lines)
    const say = (data) => { const t = nowS(); if (!this.room || t - this.saidAt < SAY_GAP) return; this.saidAt = t; this.room.emit('chat', data).catch(() => {}); }; // (a Viewer may not send: said only here)
    game.events.on('chat.say', (e) => say({ text: clean(e.text, 200) }));
    game.events.on('party.say', (e) => { if (e.re === 'ask') say({ sib: e.sibling, text: clean(e.line, 120) }); });
    const use = window.claude?.use;
    if (!use) return;
    Promise.all([use('room'), use('user')].map((p) => Promise.resolve(p).catch(() => null))).then(([room, user]) => {
      this.user = user; if (!room) return;
      this.room = room; room.onPeers((ch) => this.feed(ch.peers), () => {});
      room.on('chat', (m) => this.heard(m), () => {});
    });
  }

  /** The room's peers: a Courier for each other person here with one to show; the rest let go. */
  feed(peers) {
    const here = new Set();
    for (const p of peers) {
      if (p.isMe || p.kind !== 'viewer' || !p.presence?.c) continue;
      here.add(p.peer);
      const G = this.list.find((x) => x.peer === p.peer);
      if (G) { if (p.updatedAt !== G.upd) { G.upd = p.updatedAt; this.take(G, p.presence.c); } continue; } // (only a new word from that peer: another's leaves it as it was)
      if (this.making.has(p.peer)) continue;
      this.making.add(p.peer);
      this.makeRig().then(async (rig) => {
        this.making.delete(p.peer);
        const G2 = new Guest(p.peer, rig); G2.by = p.by; rig.gun.visible = false; rig.gunOff = true; rig.root.name = `Guest-${p.peer}`;
        this.game.vessel?.dress(rig, { ...DEFAULT_LOOK, ...(p.presence.c.look || {}) }, { own: true }); // (their own glazes, as they fired them)
        this.take(G2, p.presence.c); G2.pos.copy(G2.to);
        this.list.push(G2);
        this.game.events.emit('guest.join', { guest: await this.nameOf(p) });
      });
    }
    for (const G of [...this.list]) if (!here.has(G.peer)) this.drop(G);
  }

  /** A line from someone here: shown in the log as theirs (or as a sibling's answer to them), never acted on. */
  async heard(m) {
    if (m.isMe || m.kind !== 'viewer') return;
    const t = nowS(), seen = (this.lines.get(m.peer) || []).filter((x) => t - x < 10); seen.push(t); this.lines.set(m.peer, seen);
    if (seen.length > FLOOD) return; // (a flood: the rest not shown)
    const d = m.data || {}, line = clean(d.text, 200), sib = SIBLINGS.some((s) => s.id === d.sib) ? d.sib : null;
    if (line) this.game.events.emit('guest.say', { guest: await this.nameOf(m), line, sibling: sib });
  }

  take(G, c) {
    G.c = c; G.heardAt = nowS(); if (Array.isArray(c.p)) G.to.fromArray(c.p); if (Array.isArray(c.v)) G.vel.fromArray(c.v); G.yaw = +c.y || 0;
  }

  async nameOf(p) {
    try { if (p.by && this.user?.profiles) { const ps = await this.user.profiles([p.by]); return ps?.[p.by]?.name || 'Someone'; } } catch { /* the name is display only */ }
    return 'Someone';
  }

  /** A guest in their garden while you are in yours: their Pneuka Jar drawn where it hops (Calissa's guestJars); true while it is. */
  jar(G, c, quiet) {
    const J = this.game.guestJars, on = !!(c.r && this.game.realm?.active && quiet < STALE && J);
    if (on) {
      const r = c.r; (G.jarAt ||= { foot: new THREE.Vector3(), up: new THREE.Vector3(), fwd: new THREE.Vector3(), vel: new THREE.Vector3() });
      const A = G.jarAt; A.foot.fromArray(r.p); A.up.fromArray(r.u); A.fwd.fromArray(r.f); if (Array.isArray(r.v)) A.vel.fromArray(r.v);
      J.show(G.peer, { foot: A.foot, up: A.up, fwd: A.fwd, vel: A.vel, hops: r.h | 0, grounded: !!r.g, look: c.look || null });
      if (!G.inGarden) { G.inGarden = true; this.nameOf({ by: G.by }).then((guest) => this.game.events.emit('guest.garden', { guest })); }
    } else if (G.inGarden) { G.inGarden = false; J?.drop(G.peer); this.game.events.emit('guest.garden', { guest: 'Someone', leave: true }); }
    return on;
  }

  drop(G) {
    if (G.inGarden) this.game.guestJars?.drop(G.peer);
    this.list.splice(this.list.indexOf(G), 1);
    for (const id of [...G.sibs.keys()]) this.dropSib(G, id);
    G.rig.dispose();
    this.game.events.emit('guest.leave', { guest: 'Someone' });
  }

  /** A guest's siblings, from what they said (`k`): made as they come (their look and tool), moved, shown with their guest, let go as
   *  they go. */
  sibsOf(G, c, seen, dt) {
    const want = Array.isArray(c.k) ? c.k.filter((k) => k && SIBLINGS.some((s) => s.id === k.i) && Array.isArray(k.p)).slice(0, PARTY) : [];
    for (const id of [...G.sibs.keys()]) if (!want.some((k) => k.i === id)) this.dropSib(G, id);
    for (const k of want) {
      const S = G.sibs.get(k.i);
      if (!S) {
        if (G.sibMaking.has(k.i)) continue;
        G.sibMaking.add(k.i);
        this.makeRig().then((rig) => {
          G.sibMaking.delete(k.i);
          if (!this.list.includes(G) || G.sibs.has(k.i)) { rig.dispose(); return; } // (the guest gone, or one made meanwhile)
          rig.gun.visible = false; rig.gunOff = true; rig.root.name = `GuestSibling-${G.peer}-${k.i}`;
          this.game.vessel?.dress(rig, lookOf(k.i), { own: true }); // (its division's look, as in its guest's world)
          const N = new GuestSibling(this.game, k.i, rig); this.takeSib(N, k); N.pos.copy(N.to); G.sibs.set(k.i, N);
        });
        continue;
      }
      if (k !== S.c) this.takeSib(S, k);
      S.rig.root.visible = seen; if (!seen) { if (S.tool.group) S.tool.group.visible = false; continue; } // (hidden with its guest, kept: a rig is made once)
      this.move(S, dt); this.pose(S, S.c, dt); S.tool.update(dt);
    }
  }
  takeSib(S, k) { S.c = k; S.to.fromArray(k.p); if (Array.isArray(k.v)) S.vel.fromArray(k.v); S.yaw = +k.y || 0; }
  dropSib(G, id) { const S = G.sibs.get(id); if (!S) return; G.sibs.delete(id); S.tool.dispose(); S.rig.dispose(); }

  /** A body moved on by its speed, then closed on where it was last said to be (a guest's Courier, a guest's sibling). */
  move(B, dt) { B.to.addScaledVector(B.vel, dt); B.pos.lerp(_to.copy(B.to), 1 - Math.exp(-FOLLOW * dt)); }
  /** A body's rig posed from what was said of it: its place, its heading's turn, its ground and its moves' flags. */
  pose(B, c, dt) {
    const turn = Math.atan2(Math.sin(B.yaw - B.lastYaw), Math.cos(B.yaw - B.lastYaw)); B.lastYaw = B.yaw;
    const ground = (this.ground ||= (x, z, yTop) => { const hit = this.game.physics.raycast({ x, y: yTop, z }, _gd, 1.4, null, GROUPS.controllerQuery, (k) => !k.isSensor() && !k.parent()?.isDynamic()); return hit && hit.normal.y > 0.6 ? hit.point.y : null; });
    const s = c?.s | 0;
    B.rig.animate(dt, {
      pos: B.pos, yaw: B.yaw, velocity: B.vel, vy: B.vel.y, turnRate: dt > 0 ? turn / dt : 0, airJump: false, ground,
      grounded: !!c?.g, groundN: null, groundVel: null, wall: s & FLAGS.wall ? 1 : 0, slide: s & FLAGS.slide ? 1 : 0, mantle: s & FLAGS.mantle ? 1 : 0, mantleT: 1,
      dash: s & FLAGS.dash ? 1 : 0, crouch: s & FLAGS.crouch ? 1 : 0, aimPitch: 0, aimYawOffset: 0, combat: 0, upper: 0, gunHand: 0, reload: -1,
      walkSpeed: T.movement.walkSpeed, sprintSpeed: T.movement.sprintSpeed, recoil: 0, adsT: 0, landed: 0, techs: null,
    });
  }

  /** Our own Courier, said to the room. */
  presence() {
    const P = this.game.player, place = this.game.zones?.current ?? this.game.course?.room ?? null;
    const s = (P.sliding ? FLAGS.slide : 0) | (P.crouching ? FLAGS.crouch : 0) | (P.dashBlend > 0.5 ? FLAGS.dash : 0) | (P.mantle ? FLAGS.mantle : 0) | (Math.abs(P.wallBlend) > 0.5 ? FLAGS.wall : 0);
    const R = this.game.realm, J = R?.active ? R.jarBody : null; // (in the Spirit Garden: the Pneuka Jar where it hops)
    const r = J ? { p: J.pos.clone().addScaledVector(J.up, -J.radius).toArray().map(r2), u: J.up.toArray().map(r2), f: J.forward.toArray().map(r2), v: J.vel.toArray().map(r2), h: J.hops, g: J.grounded ? 1 : 0 } : null;
    const k = (this.game.party?.list || []).filter((S) => !this.game.siblingShatter?.holds?.(S)).slice(0, PARTY).map((S) => { const B = S.body; return { i: S.id, p: B.pos.toArray().map(r2), v: B.vel.toArray().map(r2), y: r2(B.bodyYaw), g: B.grounded ? 1 : 0, s: (B.sliding ? FLAGS.slide : 0) | (B.crouching ? FLAGS.crouch : 0) | (B.dashBlend > 0.5 ? FLAGS.dash : 0) }; }); // (your siblings, as a guest sees them: in pieces, not said)
    return { c: { z: place, p: P.pos.toArray().map(r2), v: P.vel.toArray().map(r2), y: r2(P.bodyYaw), g: P.grounded ? 1 : 0, s, look: this.game.vessel?.look || null, ...(r ? { r } : {}), ...(k.length ? { k } : {}) } };
  }

  update(dt) {
    if (this.room && (this.sendT -= dt) <= 0) { this.sendT = SEND; this.room.presence(this.presence()).catch(() => {}); }
    const here = this.game.zones?.current ?? this.game.course?.room ?? null;
    for (const G of [...this.list]) {
      const quiet = nowS() - G.heardAt;
      if (quiet > GONE) { this.drop(G); continue; } // (not heard of in a minute: gone)
      const c = G.c || {}, R = G.rig;
      if (this.jar(G, c, quiet)) { R.root.visible = false; this.sibsOf(G, c, false, dt); continue; } // (both in the garden: their Pneuka Jar on your planetoids, no party)
      const seen = quiet < STALE && (c.z == null || here == null || c.z === here);
      R.root.visible = seen; this.sibsOf(G, c, seen, dt); if (!seen) continue;
      this.move(G, dt); this.pose(G, c, dt); // (moved on by its speed, then closed on where it was said to be)
    }
  }
}
