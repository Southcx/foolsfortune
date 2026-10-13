// ---------------------------------------------------------------------------------------
// THE BRACELET, WORN (working name, Espada's and the owner's to rule; docs/plans/BRACELET.md): the one ring (vfx/bracelet.js) put on the
// Vessoul's three forms and driven from the bus, so nobody else's file has to call it. One job: wear it and drive it.
//
//   the hand      at the god hand's wrist (its `handR` bone: godhand/godhand.js, `god.hand.bones`)
//   the jar       round the Pneuka Jar's neck as a choker (its `chest` bone: godhand/jar.js `god.jar.group`); the same Jar is the garden's
//                 body (world/garden/realm.js shows `god.jar.group` while `realm.jarBody` moves it), so one choker serves both
//   the Courier   a slim band at the left wrist (`character.bones.handL`), shown only: the charms bend the hand's powers, never the tools
//
// What drives the glow (all existing events; nothing new emitted):
//   god.select {id}             the domain in use (progress/godpowers.js GOD_POWERS[id].domain)
//   the hand's acts             god.scoop, god.pour, god.shape, god.carve, god.sunder, god.swell, god.wring, god.manifest, god.grab,
//                               god.throw, god.miracle (Spellscription), god.epic {domain}: a pulse of the glow in that act's domain
//   game.lachryma 'spend'       while the hand or the garden is out: the glow kicks by the share of the pool spent
//   god.dissonance {level}      the Dissonance Level's red pulse
//   god.enter, garden.enter, domain.level    the sockets re-read from the domains' levels (open at 30: game.psyche.level)
//   bracelet.charm {id, domain} (Dovina's progress/bracelet.js: a charm bending an act) a charm's gold line
// The charms worn are not data yet (BRACELET.md "Not built yet"): `setCharm` is how the table will set them.
//
// Prior art: the house's own marks that live on the bus (vfx/glyphs.js, vfx/hookmark.js), Hollow Knight's charms shown on the Knight's
// inventory as worn.
//
//   wearBracelet(game, form, bone) -> Bracelet   (WEAR: each form's bone, its offset and size)
//   game.bracelets = installBracelets(game)   .hand .jar .courier (Bracelets)   .glow({ spend, domain, dissonance })   .charm(id)
//   .setCharm(socket, id)   .refresh()   .update(dt)   .prewarm() -> park()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Bracelet, SOCKETS } from './bracelet.js';
import { GOD_POWERS } from '../progress/godpowers.js';

/** Where each form wears it: the bone, the ring's centre in that bone's frame, its radius (x, y, z: an oval where the wrist is one). */
export const WEAR = {
  hand: { bone: 'handR', offset: [0.025, 0.06, 0.035], scale: [0.215, 0.215, 0.175], yaw: Math.PI },
  jar: { bone: 'chest', offset: [0, 0.005, 0], scale: [0.122, 0.122, 0.122], yaw: 0 },
  courier: { bone: 'handL', metres: { y: -0.025, r: 0.042 }, yaw: 0 }, // (metres in the world: turned into the bone's units at wearing)
};
const ACTS = { 'god.scoop': 'scoop', 'god.pour': 'scoop', 'god.shape': 'shape', 'god.carve': 'carve', 'god.sunder': 'sunder', 'god.swell': 'swell', 'god.wring': 'wring', 'god.manifest': 'manifest', 'god.grab': 'telekinesis', 'god.throw': 'telekinesis', 'god.miracle': 'miracle' };
const _s = new THREE.Vector3();

/** A new bracelet of a form, worn on that form's bone (or any object standing in for it); null without one. */
export function wearBracelet(game, form, parent) {
  if (!parent) return null;
  const W = WEAR[form], b = new Bracelet(game, { form });
  if (W.metres) {
    parent.updateWorldMatrix(true, false); parent.getWorldScale(_s); const k = 1 / (_s.x || 1);
    b.attach(parent, new THREE.Vector3(0, W.metres.y * k, 0), W.metres.r * k, { yaw: W.yaw });
  } else {
    b.attach(parent, new THREE.Vector3(...W.offset), 1, { yaw: W.yaw }); b.object.scale.set(...W.scale);
  }
  return b;
}

export function installBracelets(game) {
  const H = {
    hand: null, jar: null, courier: null, charms: {},
    get all() { return [this.hand, this.jar, this.courier].filter(Boolean); },
    glow(s) { for (const b of this.all) b.glow(s); return this; },
    pulse(k) { for (const b of this.all) b.pulse(k); return this; },
    charm(id) { for (const b of this.all) b.charm(id); return this; },
    setCharm(socket, id) { this.charms[socket] = id || null; for (const b of this.all) b.setCharm(socket, id); return this; },
    refresh() {
      const P = game.psyche; if (!P) return this;
      const levels = Object.fromEntries(SOCKETS.map((d) => [d, P.level(d)]));
      for (const b of this.all) b.setLevels(levels);
      return this;
    },
    update(dt) { for (const b of this.all) b.update(dt); },
    /** The warm-up: one bracelet with every look at once (glazes, charms, the flash, the aura) 50 m under the world. */
    prewarm() {
      const b = new Bracelet(game, { form: 'hand', aura: true }).showAll();
      b.object.position.set(0, -50, 0); b.object.userData.zoneFree = true; b.object.traverse((o) => { o.frustumCulled = false; }); game.scene.add(b.object);
      return () => { b.object.visible = false; };
    },
  };
  const wear = (form, parent) => wearBracelet(game, form, parent);
  const god = game.god;
  H.hand = wear('hand', god?.hand?.bones?.[WEAR.hand.bone]);
  H.jar = wear('jar', god?.jar?.group?.getObjectByName(WEAR.jar.bone));
  H.courier = wear('courier', game.character?.bones?.[WEAR.courier.bone]);

  // the bus
  const on = (n, fn) => game.events?.on(n, fn);
  const domainOf = (power) => GOD_POWERS[power]?.domain || null;
  on('god.select', (e) => { const d = domainOf(e.id); if (d) H.glow({ domain: d }); });
  for (const [ev, power] of Object.entries(ACTS)) on(ev, () => { const d = domainOf(power); if (d) H.glow({ domain: d }); H.pulse(0.55); });
  on('god.epic', (e) => { H.glow({ domain: e.domain }); H.pulse(1); });
  on('god.dissonance', (e) => H.glow({ dissonance: e.level || 0 }));
  for (const n of ['god.enter', 'garden.enter', 'domain.level']) on(n, () => H.refresh());
  on('bracelet.charm', (e) => H.charm(e.id));
  game.lachryma?.on?.('spend', (e) => {
    if (!(game.god?.active || game.realm?.active)) return;
    const max = game.lachryma.max || 100;
    H.pulse(Math.min(1, (e.amount || 0) / (max * 0.2)));
  });
  H.refresh();
  return H;
}
