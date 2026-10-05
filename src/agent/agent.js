// ---------------------------------------------------------------------------------------
// THE AGENT: the game as an AI player sees and drives it (docs/plans/COOP.md, C3). An agent does not need eyes or hands: `observe()`
// gives the world as data (the Courier, what is near with its id, kind and tags, what can be interacted with, what the log said and
// what happened since it last looked), and `act(cmd)` takes INTENTS (go to a place, face a thing, use a tool, interact, hold keys for a
// while), which it carries out through the same input the player's keyboard fills, a tick at a time. In manual mode the world waits
// between steps (the stress test's seam), so an agent thinks at its own pace: look, decide, act, step.
//
// Prior art: OpenAI Gym's observe/act/step loop, the MineDojo and Voyager agents in Minecraft (named places, high-level skills over
// raw input), Sea of Thieves' and Rare's automated playtests (scripted players with goals), and a racing game's AI driver (steer by
// the angle to the next point, brake when it is not getting closer).
//
//   game.agent.observe({ places? }) -> state     game.agent.act(cmd) -> { ok, why? }     game.agent.update(dt) (main.js, each tick)
//   cmd: { do: 'goto', place | to: [x,y,z], within?, run? }  { do: 'travel', place }  { do: 'face', place | to | yaw }
//        { do: 'hold', keys: [...], ticks }  { do: 'press', key }  { do: 'interact', with? }  { do: 'use', tool }  { do: 'attack', ticks? }
//        { do: 'choose', n } (a dialogue's choice, from 1)  { do: 'say', text }  { do: 'stop' }
//   game.agent.busy (an intent is being carried out)   .result (how the last one ended: 'arrived', 'stuck', 'timeout'...)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { zoneOf } from '../render/zones.js';

const r2 = (v) => +v.toFixed(2);
const vec = (v) => [r2(v.x), r2(v.y), r2(v.z)];
const NEAR = 30;

export class Agent {
  constructor(game) {
    this.game = game;
    this.task = null; // { kind, ..., ticks }
    this.result = null;
    this.lastEv = null; this.lastLine = null; // (the last event and log line it saw: the bus keeps 300, so not an index)
  }
  get busy() { return !!this.task; }

  // ------------------------------------------------------------------ looking
  observe({ places = false } = {}) {
    const g = this.game, P = g.player;
    const since = (list, last) => list.slice(last ? list.lastIndexOf(last) + 1 : 0);
    const evs = g.events.log || [], fresh = since(evs, this.lastEv).map((e) => ({ name: e.name, t: r2(e.t), ...pick(e) })); this.lastEv = evs[evs.length - 1] || null;
    const ls = g.log?.lines || [], lines = since(ls, this.lastLine).map((l) => l.text); this.lastLine = ls[ls.length - 1] || null;
    const near = [];
    for (const c of g.creatures?.list || []) { if (c.pos.distanceTo(P.pos) > NEAR) continue; near.push({ id: c.id, kind: c.kind, name: c.name, pos: vec(c.pos), alive: c.alive !== false, hp: c.hp != null ? r2(c.hp) : undefined, state: c.state, ally: !!c.ally, foe: !!c.cls, d: r2(c.pos.distanceTo(P.pos)) }); }
    for (const e of g.ground?.list || []) if (e.pos.distanceTo(P.pos) < NEAR) near.push({ kind: 'item', item: e.id, pos: vec(e.pos), d: r2(e.pos.distanceTo(P.pos)) });
    for (const n of g.folk?.list || []) if (n.pos.distanceTo(P.pos) < NEAR) near.push({ kind: 'folk', id: n.id, name: n.name, pos: vec(n.pos), d: r2(n.pos.distanceTo(P.pos)) });
    near.sort((a, b) => a.d - b.d);
    const it = g.interact?.cur, I = (o) => ({ id: o.id, ref: refId(o), d: r2(o.d) });
    return {
      t: r2(g.events.time ?? 0), seed: g.seed, zone: zoneOf(P.pos),
      courier: { pos: vec(P.pos), vel: vec(P.vel), yaw: r2(P.yaw), grounded: !!P.grounded, tech: g.techs?.active?.id || null, shape: P.shape,
        cubes: g.cubes?.balance ?? null, lachryma: g.lachryma ? r2(g.lachryma.value ?? g.lachryma.pool ?? 0) : null, inHand: g.belt?.inHand?.id || null },
      interact: it ? I(it) : null, reach: (g.interact?.offers || []).map(I), // (the chevron's one, and everything F could be meant for)
      well: g.well?.active ? { floor: g.well.floor, mobs: g.well.mobs.filter((c) => c.alive).length, up: vec(g.well.cur.up.pos), down: g.well.cur.down ? vec(g.well.cur.down.pos) : null,
        foes: g.well.mobs.filter((c) => c.alive).map((c) => ({ id: c.id, kind: c.kind, name: c.name, pos: vec(c.pos), cls: c.cls || 0 })) } : null, // (the whole floor's: a room is out of sight, not out of mind)
      dialogue: g.dialogue?.open ? { with: g.dialogue.npc?.id, line: g.dialogue.plain, done: !!g.dialogue.typed,
        choices: g.dialogue.opts ? g.dialogue.opts.map((c) => String(g.dialogue.say(c)).replace(/<[^>]*>/g, '')) : null } : null, // (next: press F; a choice: choose)
      box: (g.pneuka?.slots || []).filter(Boolean).map((s) => s.id + (s.n > 1 ? `x${s.n}` : '')),
      worn: g.belt?.worn ? [...g.belt.worn] : [],
      near, events: fresh, log: lines,
      task: this.task ? this.task.kind : null, result: this.result,
      ...(places ? { places: g.places?.all() || [] } : {}),
    };
  }

  // ------------------------------------------------------------------ doing
  act(cmd = {}) {
    const g = this.game, P = g.player;
    const target = (c) => (c.place ? g.places?.pos(c.place) : Array.isArray(c.to) ? new THREE.Vector3(...c.to) : null);
    this.result = null;
    switch (cmd.do) {
      case 'goto': { // (steered on foot: through the Well's doorways when it is down there)
        const to = target(cmd); if (!to) return { ok: false, why: 'no such place' };
        const zt = zoneOf(to), zc = zoneOf(P.pos);
        if (zt !== zc || Math.abs(to.y - P.pos.y) > 4) return { ok: false, why: `it is in ${zt}${zt === zc ? ', on another floor' : ''}, and you are in ${zc}: travel there first (goto walks within a room)` };
        const path = g.well?.active && g.well.route ? g.well.route(P.pos, to) : [to];
        this.task = { kind: 'goto', path, i: 0, within: cmd.within ?? 1.2, run: cmd.run !== false, ticks: cmd.ticks ?? 60 * 30, best: Infinity, still: 0 };
        return { ok: true };
      }
      case 'travel': { const r = g.places?.travel(cmd.place); return r ? { ok: true } : { ok: false, why: 'no such place, or not reachable that way' }; }
      case 'face': {
        if (cmd.yaw != null) { P.yaw = cmd.yaw; return { ok: true }; }
        const to = target(cmd); if (!to) return { ok: false, why: 'nothing to face' };
        P.yaw = Math.atan2(to.x - P.pos.x, to.z - P.pos.z); return { ok: true };
      }
      case 'hold': this.task = { kind: 'hold', keys: cmd.keys || [], ticks: cmd.ticks ?? 30 }; return { ok: true };
      case 'press': g.input.pressed.add(cmd.key); g.input.down.add(cmd.key); this.task = { kind: 'press', keys: [cmd.key], ticks: 2 }; return { ok: true };
      case 'interact': { // (with: a ref or id from `reach`, or a place's id, folk.<id>; without, whatever has the chevron)
        if (!cmd.with) { if (!g.interact?.cur) return { ok: false, why: 'nothing in reach' }; return this.act({ do: 'press', key: 'KeyF' }); }
        const want = String(cmd.with).replace(/^folk\./, ''), o = (g.interact?.offers || []).find((o) => refId(o) === want || o.id === want);
        if (!o) return { ok: false, why: `'${cmd.with}' is not in reach (reach: ${(g.interact?.offers || []).map(refId).join(', ') || 'nothing'})` };
        g.interact.pin(o.ref); this.task = { kind: 'interact', ref: o.ref, ticks: 15 }; return { ok: true };
      }
      case 'use': { const k = g.belt?.get(cmd.tool)?.key; if (!k) return { ok: false, why: `no tool '${cmd.tool}'` }; if (!g.belt?.isWorn(cmd.tool)) return { ok: false, why: 'not worn (it is in the box)' }; return this.act({ do: 'press', key: k }); }
      case 'choose': { const n = +cmd.n; if (!g.dialogue?.opts || !(n >= 1 && n <= g.dialogue.opts.length)) return { ok: false, why: 'no such choice' }; return this.act({ do: 'press', key: `Digit${n}` }); }
      case 'attack': this.task = { kind: 'attack', ticks: cmd.ticks ?? 40, k: 0 }; return { ok: true };
      case 'say': g.events.emit('chat.say', { text: String(cmd.text || '').slice(0, 120), by: 'courier' }); return { ok: true };
      case 'stop': this.stop('stopped'); return { ok: true };
      default: return { ok: false, why: `unknown intent '${cmd.do}'` };
    }
  }

  stop(why) { if (this.task) for (const k of this.task.held || []) this.game.input.down.delete(k); this.task = null; this.result = why; this.release(); }
  release() { const d = this.game.input.down; for (const k of ['KeyW', 'ShiftLeft', 'Space', 'Mouse0']) d.delete(k); }

  /** Each tick, before anything reads the input: the intent in hand, carried one step on. */
  update() {
    const T = this.task; if (!T) return;
    const g = this.game, P = g.player, d = g.input.down;
    if (--T.ticks < 0) { this.stop(T.kind === 'goto' || T.kind === 'interact' ? 'timeout' : 'done'); return; }
    if (T.kind === 'hold' || T.kind === 'press') { for (const k of T.keys) d.add(k); T.held = T.keys; if (T.ticks === 0) for (const k of T.keys) d.delete(k); return; }
    if (T.kind === 'interact') { if (g.interact.cur?.ref === T.ref) { g.input.pressed.add('KeyF'); d.add('KeyF'); this.task = { kind: 'press', keys: ['KeyF'], ticks: 2 }; } return; }
    if (T.kind === 'attack') { if ((T.k++ % 12) === 0) { g.input.pressed.add('Mouse0'); d.add('Mouse0'); } else d.delete('Mouse0'); return; }
    if (T.kind === 'goto') {
      const to = T.path[T.i], dist = Math.hypot(to.x - P.pos.x, to.z - P.pos.z), last = T.i === T.path.length - 1;
      if (dist < (last ? T.within : 0.8)) { if (last) { this.stop('arrived'); return; } T.i++; T.best = Infinity; return; }
      P.yaw = Math.atan2(to.x - P.pos.x, to.z - P.pos.z); // (it turns to the next point at once: an agent has no mouse to sweep)
      d.add('KeyW'); if (T.run && dist > 4) d.add('ShiftLeft'); else d.delete('ShiftLeft');
      // not getting closer: a hop (a lip, a step), and after a while it gives up and says so
      if (dist < T.best - 0.05) { T.best = dist; T.still = 0; } else if (++T.still % 45 === 0) { g.input.pressed.add('Space'); d.add('Space'); } else d.delete('Space');
      if (T.still > 240) this.stop('stuck');
    }
  }
}

/** What an interact offer is about, as a name (a folk's id, a chest's...). */
function refId(o) { return typeof o.ref === 'string' ? o.ref : o.ref?.def?.id ?? o.ref?.id ?? o.id; }

/** The fields of an event worth an agent's attention (the bus's own, `name` and `t`, are given apart). */
function pick(e) { const o = {}; for (const [k, v] of Object.entries(e)) if (k !== 'name' && k !== 't' && (typeof v !== 'object' || v === null || Array.isArray(v))) o[k] = v; return o; }

