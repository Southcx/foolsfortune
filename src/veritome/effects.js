// ---------------------------------------------------------------------------------------
// CARD EFFECTS: what playing a Major Arcana does, the rules of the Courier's own reality laid over the world for a while. Each is a
// small piece that leans on a system the game already has (the mind's modifiers, the brush's inscriptions, the time service, the
// mood lighting, the parry, the survey, the clapperjars' own states), so a card says what changes and the systems do the changing:
//
//   start(ctx) -> state       tick(ctx, dt, state)       end(ctx, state)       (ctx: { game, P, book })
//
// What other modules ask of a card in play goes through the Book: book.mult('melee') (Strength), book.luck (the Fool and the Wheel,
// read by the Tithe), book.speedMult (the Chariot), player.unseen (the Moon, read by the clapperjars' eyes).
//
// Prior art: Final Fantasy XIV's Astrologian (a drawn card played for a short, specific buff; the seals it leaves), Greed Island's spell
// cards (Hunter x Hunter: each card one rule, stated plainly, that the world then obeys), and the tarot's own meanings, read for play.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../config.js';
import { sfx } from '../audio.js';
import { deflect } from '../parry.js';
import { inscribe } from '../brush/inscribe.js';

const UP = new THREE.Vector3(0, 1, 0);
const near = (list, p, r) => list.filter((x) => x.pos.distanceTo(p) < r);
const jars = (g, p, r) => near((g.clappers?.list || []).filter((c) => c.alive), p, r);
const potPos = (e) => { const t = e.body.translation(); return new THREE.Vector3(t.x, t.y + (e.P?.height ?? 0.4) * 0.45, t.z); };
const loose = (g, p, r) => {
  const out = [];
  for (const e of g.breakables?.items || []) if (e.alive && !e.def?.trial && !e.def?.hang && potPos(e).distanceTo(p) < r) out.push(e);
  for (const e of g.breakables?.slices || []) if (e.body?.isValid?.()) { const t = e.body.translation(); if (Math.hypot(t.x - p.x, t.y - p.y, t.z - p.z) < r) out.push(e); }
  return out;
};
const stun = (g, c, s) => g.clappers.stun(c, s, g.shells.glowOutline, g.shells.xray);
function freeSurvey(g) {
  const C = g.cartography;
  if (!C) return;
  C.pulseCool = 0;
  g.lachryma.gain(T.zoi.pulseCost, 'card');
  C.survey();
}
const inView = (g, p) => { const v = p.clone().project(g.camera); return v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1; };

export const EFFECTS = {
  fool: { start: ({ book }) => { book.luck++; } },
  magician: { start: ({ game }) => game.lachryma.addModifier('card.magician', { costMult: { '*': 0 } }), end: ({ game }) => game.lachryma.removeModifier('card.magician') },
  priestess: {
    start: ({ game: g, P }) => {
      freeSurvey(g);
      const marked = [];
      for (const e of loose(g, P.pos, 25)) if (e.type === 'breakable' && !e.marked && e.mesh) { g.shells.markEnt(e); marked.push(e); }
      return { marked };
    },
  },
  empress: { start: ({ game }) => game.lachryma.addModifier('card.empress', { regenMult: 4, regenDelayMult: 0 }), end: ({ game }) => game.lachryma.removeModifier('card.empress') },
  emperor: {
    start: ({ game: g, P }) => {
      for (const e of loose(g, P.pos, 8)) inscribe(g, e, 'still', 10);
      for (const c of jars(g, P.pos, 8)) stun(g, c, 3);
    },
  },
  hierophant: {
    start: ({ game: g, P }) => {
      const list = jars(g, P.pos, 12).filter((c) => !c.ally).sort((a, b) => a.pos.distanceTo(P.pos) - b.pos.distanceTo(P.pos)).slice(0, 2);
      for (const c of list) g.shells?.casters?.befriend(c);
    },
  },
  lovers: {
    start: ({ game: g, P }) => {
      for (const c of jars(g, P.pos, 15)) { c.state = 'dance'; c.twirl = 0; c.timer = 8; c.clapT = 0.3; c.clapRate = 10; g.glyphs?.pop('note', c.pos.clone().setY(c.pos.y + 1.1), { color: 0xff9ab0, size: 0.45, life: 1.4 }); }
      g.lachryma.gain(10, 'card');
    },
  },
  chariot: { start: ({ book }) => { book.speed.chariot = 1.25; }, end: ({ book }) => { delete book.speed.chariot; } },
  strength: { start: ({ book }) => { book.mults.melee = 2; }, end: ({ book }) => { delete book.mults.melee; } },
  hermit: {
    start: ({ game: g, P }) => {
      const l = new THREE.PointLight(0xffd9a0, 22, 11, 2);
      l.position.copy(P.pos).y += 1.8;
      g.scene.add(l);
      g.lights?.scan?.();
      g.lachryma.gain(5, 'card');
      return { l };
    },
    tick: ({ P }, dt, s) => { s.l.position.lerp(new THREE.Vector3(P.renderPos.x + 0.5, P.renderPos.y + 1.9, P.renderPos.z), 1 - Math.exp(-dt * 6)); },
    end: ({ game }, s) => { game.scene.remove(s.l); s.l.dispose?.(); },
  },
  wheel: { start: (ctx) => { ctx.book.luck++; const pool = Object.keys(EFFECTS).filter((k) => k !== 'wheel' && k !== 'world'); const pick = pool[Math.floor(Math.random() * pool.length)]; ctx.book.begin(pick, { echo: true }); return { pick }; } },
  justice: { tick: ({ game: g, P }) => { deflect(g, { at: P.pos.clone().setY(P.pos.y + 1.1), radius: 2.4, speedMin: 3, outMin: 13, assist: 0.6, iframes: 0.3, by: 'card' }); } },
  hanged: {
    start: ({ game: g, P }) => {
      const bodies = [];
      for (const e of loose(g, P.pos, 10)) { const b = e.body; if (!b.isDynamic()) continue; bodies.push([b, b.gravityScale()]); b.setGravityScale(-0.35, true); g.breakables.instigate?.(e, 'courier'); }
      return { bodies };
    },
    end: (ctx, s) => { for (const [b, gs] of s.bodies) if (b.isValid()) b.setGravityScale(gs, true); },
  },
  death: {
    start: ({ game: g, P }) => {
      for (const e of [...(g.breakables?.items || [])]) {
        if (!e.alive || e.def?.trial || !(e.crackStage > 0 || e.cracks?.dark?.length)) continue;
        const p = potPos(e);
        if (p.distanceTo(P.pos) < 12) g.breakables.shatter(e, p, UP.clone(), 1, 'death', 'courier');
      }
      g.techs?.get('soulbrush')?.sigils.dropFront(P.pos, 20);
    },
  },
  temperance: {
    start: ({ game: g }) => { g.time.slow('card.temperance', 0.66); g.lachryma.addModifier('card.temperance', { costMult: { '*': 0.5 } }); },
    end: ({ game: g }) => { g.time.free('card.temperance'); g.lachryma.removeModifier('card.temperance'); },
  },
  devil: {
    start: ({ game: g, P }) => { for (const b of g.baubles?.near(P.pos, 25) || []) g.baubles.beginAbsorb(b); },
    tick: ({ game: g, P }, dt) => { const at = P.pos.clone().addScaledVector(P.lookDir(new THREE.Vector3()).setY(0).normalize(), 3); for (const c of jars(g, P.pos, 12)) g.clappers.pull(c, at, 0.8, dt); },
  },
  tower: {
    start: ({ game: g }) => {
      const cam = g.camera, o = cam.getWorldPosition(new THREE.Vector3()), d = cam.getWorldDirection(new THREE.Vector3());
      const hit = g.physics.raycast(o, d, 40, g.player.collider, undefined, (c) => !c.isSensor());
      const at = hit ? hit.point : o.addScaledVector(d, 20);
      g.techs?.get('soulbrush')?.techniques.lightning(at);
      g.shells?.pushBurst(at.clone().setY(at.y + 0.3), 6, 9);
      for (const c of jars(g, at, 3.5)) stun(g, c, 3);
      sfx.thunder?.(g.listenerDistance?.(at) ?? 0);
    },
  },
  star: {
    start: ({ game: g }) => { g.lachryma.gain(g.lachryma.max, 'card'); g.lachryma.addModifier('card.star', { regenMult: 1.5 }); },
    end: ({ game }) => game.lachryma.removeModifier('card.star'),
  },
  moon: {
    start: ({ game: g, P }) => {
      P.unseen = 15;
      g.mood?.set('card.moon', { dim: 0.5, tint: new THREE.Color(0x2a3a8a), tintK: 0.25, fog: 1.3, ease: 2 });
      for (const c of jars(g, P.pos, 15)) g.glyphs?.pop('ask', c.pos.clone().setY(c.pos.y + 1.1), { color: 0xbfd2ff, size: 0.45, life: 1.3 });
    },
    tick: ({ P }, dt) => { P.unseen = Math.max(P.unseen || 0, 0.1); },
    end: ({ game: g, P }) => { P.unseen = 0; g.mood?.free('card.moon'); },
  },
  sun: {
    start: ({ game: g, P }) => {
      for (const c of jars(g, P.pos, 20)) if (inView(g, c.pos)) stun(g, c, 3);
      g.slip?.clear();
      g.techs?.get('soulbrush')?.paint.clear();
      g.lachryma.gain(15, 'card');
      if (g.fx.boomLight) { g.fx.boomLight.position.copy(P.pos).y += 3; g.fx.boomLight.color?.set?.(0xfff1c0); g.fx.boomLight.intensity = 90; g.fx.boomT = 0.4; }
    },
  },
  judgement: {
    start: ({ game: g, P }) => {
      for (const w of [...(g.breakables?.wrecks || [])]) if (w.pos.distanceTo(P.pos) < 25 && !w.claimed) g.breakables.rebuild(w);
      for (const c of jars(g, P.pos, 20)) if (c.raider) g.clappers.hit(c, c.pos.clone().setY(c.pos.y + 0.35), UP.clone(), 1, 'judged');
    },
  },
  world: {
    start: ({ game: g, book }) => {
      for (const a of book.active) a.t = 0;
      freeSurvey(g);
      g.lachryma.gain(25, 'card');
      book.seals = ['sun', 'moon', 'star'];
      book.astrodyne();
    },
  },
};
