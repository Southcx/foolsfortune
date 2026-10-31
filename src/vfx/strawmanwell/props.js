// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S LOOK, THE SEWING KIT'S PROPS (a part of the Well's look, vfx/strawmanwell/look.js; plain name, the glossary's "the
// sewing kit's props"): Pip's sewing basket at giant scale in the placeholder boxes' places, each box read back by its colour and its
// lane (vfx/strawmanwell/boxes.js) and drawn as what it is there. The colours it owns, and what each is:
//   spool    a cotton reel (a platform, an overhang, a cliff), squat a bobbin (the moving platform), the Flood's lecterns small reels;
//            the Machine's seesaw plank a ruler
//   pin      the Run's wall a dressmaker's pin hung point down, the Flood's spigot a needle on its thread, the Machine's pivot a
//            thimble and its cannon's base the cannon (the goal's post is the theatre's: left as it is)
//   thread   the Climb's vine, a twisted floss knotted at its footholds; the Machine's belt's stitches
//   thin     the Run's thin floors tape measures, the Brawl's soft ledges ribbons; each hung from the flies on two threads
//   ice      sequins and glass beads      goo      spilt honey      slope    folded felt      felt     the Machine's conveyor
//   spring   the Run's spring a coil under a thimble, the Machine's switch a button
//   gold     the ? spools gilded reels with a star, spent (`used`) walnut and bare; the key a brass key; the lock's door brass-bound
//            walnut; the Flood's lectern tops thimbles
//   used     the Machine's crumbling floors cakes of tailor's chalk
// A box merged with others of its colour (the kit's) is drawn into its lane's soups and the placeholder hidden (its colliders are the
// kit's and stay). A box that moves or changes (`own`: a ? spool bumped and spent, the spring squashed, a door slid, the key carried,
// a chalk cake shaken and dropped, the plank tipped) is ridden: the look is a child of its mesh and only its own drawing is put out,
// so whatever the mechanics do still shows; the movers' belt and shuttle the same. A drawn thing keeps its walkable top where its box's
// is, within a few centimetres. No words in the world.
// DRAWS: a lane's props in three meshes (matte, metal, gloss: one vertex-coloured program, render/present.js's smoothing), a ridden
// thing one or two, the belt's moving stitches one; outline hulls where the tier draws them.
//
// Prior art: Pip's sewing basket (LORE.md); Pollock's paper theatres (flown pieces on lines, cut-out edges); Yoshi's Woolly World,
// Kirby's Epic Yarn and LittleBigPlanet (haberdashery and household things as platforms at giant scale); the house's dressing of a
// placeholder room by its colours (vfx/sandbox/hall.js) and its vertex-coloured kit meshes (vfx/racewaypark.js Tris).
//
//   dressProps(ctx) -> { lane(id), update(dt), dispose() }   (ctx: look.js)   PROPS_LOOK (the props' choices)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { addOutline, releaseOutlines } from '../../render/outline.js';
import { PropKit, frameOf, hash } from './props/kit.js';
import { spool, thimble, pin, needle, button, FLY } from './props/sewing.js';
import { tape, ribbon, hangers, felt, feltSlab, sequins, honey, vine, floss } from './props/cloth.js';
import { coilSpring, ruler, chalk, key, lockDoor, cannon, pincushion, BeltLook, MACHINE_LOOK } from './props/machine.js';

/** The props' choices: the placeholder colours this part owns, the threads the reels are wound with (a reel takes one by its place),
 *  the ribbons' colours, the chalk cakes', the materials' finish. */
export const PROPS_LOOK = {
  mine: ['spool', 'pin', 'thread', 'thin', 'ice', 'goo', 'spring', 'slope', 'used', 'felt', 'gold'],
  threads: ['rose', 'teal', 'mustard', 'sage', 'velvet', 'sky'],
  ribbons: ['teal', 'teal', 'velvet'],
  chalks: ['sky', 'rose', 'chalk'],
  finish: { matte: { roughness: 0.84, metalness: 0 }, metal: { roughness: 0.36, metalness: 0.42 }, gloss: { roughness: 0.2, metalness: 0.12 } },
};
const SOUPS = ['matte', 'metal', 'gloss'];
const colorOf = (m) => (m.material && !Array.isArray(m.material) && m.material.color ? m.material.color.getHex() : null);
const isMerged = (m) => m.isMesh && !m.userData.isOutline && m.geometry && !m.geometry.index && m.geometry.attributes.position.count % 36 === 0;

export function dressProps(ctx) {
  const P = new WellProps(ctx);
  try { P.dress(); } catch (e) { console.warn('wellLook props', e); }
  return P;
}

class WellProps {
  constructor(ctx) {
    this.ctx = ctx; this.pal = ctx.palette; this.laneId = null;
    this.mats = {};
    for (const k of SOUPS) this.mats[k] = new THREE.MeshStandardMaterial({ name: `wellprops-${k}`, color: 0xffffff, vertexColors: true, flatShading: true, ...PROPS_LOOK.finish[k] });
    this.made = []; this.hidden = []; this.unseen = []; this.outlined = []; this.riders = []; this.spent = []; this.belts = []; this.ballGeo = null;
  }

  // ---------------------------------------------------------------- dressing
  dress() {
    const C = this.ctx;
    for (const L of Object.values(C.lanes)) {
      const K = new PropKit(this.pal);
      for (const key of ['thread', ...PROPS_LOOK.mine.filter((k) => k !== 'thread')]) this.dressMerged(K, L, key);
      for (const key of PROPS_LOOK.mine) for (const { mesh, box } of C.boxes.ownBoxes(L.id, C.color[key])) this.dressOwn(L, key, mesh, box);
      if (L.id === 'machine') this.dressMovers(K, L);
      this.put(K, (m) => C.add(m, L.id));
    }
  }

  /** Every merged mesh of a colour in a lane (a colour laid both with and without outline hulls is two). */
  mergedAll(id, color) { return (this.ctx.boxes.laneGroup(id)?.children ?? []).filter((m) => isMerged(m) && colorOf(m) === color); }

  dressMerged(K, L, keyName) {
    const C = this.ctx, meshes = this.mergedAll(L.id, C.color[keyName]); if (!meshes.length) return;
    const boxes = meshes.flatMap((m) => C.boxes.boxesOf(m));
    if (keyName === 'thread') this.threads(K, L, boxes);
    else boxes.forEach((B, i) => { if (keyName === 'slope') felt(K, B); else { K.frame(frameOf(B)); this.shape(K, L, keyName, B, i); } });
    for (const m of meshes) { C.boxes.hide(m); this.hidden.push(m); }
  }

  /** One merged box in its own metres (the kit's frame set to it), by its colour and its lane. */
  shape(K, L, keyName, B, i) {
    const C = this.ctx, pal = this.pal, { w, h, d } = B, seed = Math.round(B.c.x * 7 + B.c.y * 3);
    const fly = C.at.y + FLY - B.c.y;
    switch (keyName) {
      case 'spool': return spool(K, w, h, d, { thread: this.threadOf(L, B, seed), wood: hash(seed) < 0.3 ? pal.walnut : pal.maple, seed });
      case 'pin': {
        if (L.id === 'flood' || (h > 4 && w < 0.6)) return needle(K, w, h, d, { fly });
        if (h > w * 2.5) return pin(K, w, h, { head: [pal.rose, pal.teal, pal.mustard][Math.abs(seed) % 3] });
        const can = (this.ctx.well.machine?.items ?? []).find((it) => it.kind === 'cannon' && Math.abs(it.at.x - B.c.x) < w / 2 + 1.2 && Math.abs(it.at.z - B.c.z) < 3);
        if (can) return cannon(K, w, h, d, { mx: can.at.x - B.c.x, my: can.at.y - B.c.y, dir: can.dir });
        return thimble(K, Math.min(w, d) * 0.6, Math.min(w, d) * 0.5, h, { y: -h / 2, col: pal.steel });
      }
      case 'thin':
        if (L.id === 'brawl') ribbon(K, w, h, d, { col: pal[PROPS_LOOK.ribbons[i % PROPS_LOOK.ribbons.length]] });
        else tape(K, w, h, d);
        return hangers(K, w, h, d, fly);
      case 'ice': return sequins(K, w, h, d, seed);
      case 'goo': return honey(K, w, h, d, seed);
      case 'felt': return feltSlab(K, w, h, d);
      case 'spring': return h < 0.15 ? button(K, Math.min(w, d) / 2, h, { y: -h / 2, col: pal.rose }) : coilSpring(K, w, h, d);
      case 'gold': return thimble(K, Math.min(w, d) * 0.43, Math.min(w, d) * 0.37, Math.max(0.34, h), { y: -h / 2, col: pal.brass });
      case 'used': return spool(K, w, h, d, { wood: pal.walnut, bare: true, seed });
      default: return null;
    }
  }

  /** The reel's thread: the vine's colour where the Climb's vine hangs off it, else one by its place. */
  threadOf(L, B, seed) {
    if (L.id === 'climb' && this.vineX != null && Math.abs(B.c.x - B.w / 2 - this.vineX) < 0.4) return this.pal.sage;
    return this.pal[PROPS_LOOK.threads[Math.abs(seed) % PROPS_LOOK.threads.length]];
  }

  /** A lane's thread: a tall line is a vine (the short ones its footholds), anything else a twisted floss along its length. */
  threads(K, L, boxes) {
    const lines = boxes.filter((B) => B.h > 1), rungs = boxes.filter((B) => B.h <= 1 && B.w < 0.5);
    for (const B of lines) {
      K.frame(new THREE.Matrix4().makeTranslation(B.c.x, B.c.y, B.c.z));
      vine(K, B.h, rungs.filter((R) => Math.abs(R.c.x - B.c.x) < 0.3 && Math.abs(R.c.y - B.c.y) < B.h / 2).map((R) => R.c.y - B.c.y));
      if (L.id === 'climb') this.vineX = B.c.x;
    }
    for (const B of boxes) if (!lines.includes(B) && !rungs.includes(B)) { K.frame(frameOf(B)); floss(K, Math.max(B.w, B.h), B.w > B.h ? 'x' : 'y'); }
  }

  /** A box that moves or changes: the look built in its mesh's own metres and ridden as its child. */
  dressOwn(L, keyName, mesh, box) {
    const pal = this.pal, { w, h, d } = box, seed = Math.round(mesh.position.x * 7);
    if (keyName === 'pin') return;
    const K = new PropKit(pal), alt = new PropKit(pal);
    if (keyName === 'gold' && h > 2) lockDoor(K, w, h, d);
    else if (keyName === 'gold' && Math.max(w, h, d) < 0.6) key(K);
    else if (keyName === 'gold') { spool(K, w, h, d, { thread: pal.velvet, gilded: true, mark: true, seed }); spool(alt, w, h, d, { wood: pal.walnut, bare: true, seed }); }
    else if (keyName === 'used') chalk(K, w, h, d, { col: pal[PROPS_LOOK.chalks[this.riders.length % PROPS_LOOK.chalks.length]], seed });
    else if (keyName === 'spring') { if (h < 0.15) button(K, Math.min(w, d) / 2, h, { y: -h / 2, col: pal.rose }); else coilSpring(K, w, h, d); }
    else if (keyName === 'spool' && h < 0.5 && w > 2) ruler(K, w, h, d);
    else { K.frame(null); this.shape(K, L, keyName, { c: mesh.position, w, h, d }, 0); }
    if (K.empty) return;
    const R = { mesh, main: this.ride(mesh, K), spent: alt.empty ? null : this.ride(mesh, alt) };
    if (R.spent) { R.spent.visible = false; this.spent.push(R); }
    this.riders.push(R);
  }

  /** A kit's soups as a group riding `mesh`; the mesh's own drawing (its material, its outline hull) put out. */
  ride(mesh, K) {
    const g = new THREE.Group(); g.name = 'wellprops.rider'; g.userData.zone = 'strawmanwell';
    this.put(K, (m) => g.add(m));
    mesh.add(g); this.made.push(g);
    if (mesh.material && !Array.isArray(mesh.material) && mesh.material.visible) { mesh.material.visible = false; this.unseen.push(mesh.material); }
    const o = mesh.userData.outline; if (o?.parent) { o.removeFromParent(); this.outlined.push([mesh, o]); }
    return g;
  }

  /** The Machine's movers (world/props/movers.js): the conveyor drawn where it stands with its moving stitches, the shuttle's box a bobbin riding it. */
  dressMovers(K, L) {
    const M = this.ctx.well.machine; if (!M) return;
    for (const m of M.movers ?? []) {
      const own = m.group.children.filter((o) => o.isMesh && !o.userData.isOutline);
      if (m.surface) {
        const B = new BeltLook(K, m, this.mats.matte, this.pal); this.belts.push(B); this.ctx.add(B.mesh, L.id); this.made.push(B.mesh); this.shadeOne(B.mesh);
      } else {
        const bx = own.find((o) => o.geometry?.type === 'BoxGeometry'); if (!bx) continue;
        const { width: w, height: h, depth: d } = bx.geometry.parameters, R = new PropKit(this.pal);
        spool(R, w, h, d, { thread: this.pal.teal, seed: 5 });
        const g = new THREE.Group(); g.position.copy(bx.position); this.put(R, (x) => g.add(x)); m.group.add(g); this.made.push(g);
      }
      for (const o of own) if (o.visible) { o.visible = false; this.hidden.push(o); }
    }
  }

  /** A kit's soups made meshes (one a material), each handed to `into`. */
  put(K, into) {
    for (const k of SOUPS) {
      if (K[k].empty) continue;
      const m = new THREE.Mesh(K[k].geometry(), this.mats[k]); m.name = `wellprops.${k}`; m.userData.zone = 'strawmanwell';
      m.castShadow = true; m.receiveShadow = true; into(m); this.made.push(m);
      this.shadeOne(m); addOutline(m);
    }
  }
  shadeOne(m) { this.ctx.game.present?.shadeOne?.(m, true, T.visual.smooth !== false); }

  // ---------------------------------------------------------------- each frame
  lane(id) { this.laneId = id; }

  update(dt) {
    const used = this.ctx.color.used;
    for (const R of this.spent) { const s = R.mesh.material?.color?.getHex?.() === used; R.main.visible = !s; R.spent.visible = s; }
    if (this.laneId !== 'machine') return;
    for (const B of this.belts) B.step(dt);
    const M = this.ctx.well.machine, r = MACHINE_LOOK.ball.r;
    for (const b of M?.balls ?? []) {
      let c = b.m.userData.wellProp;
      if (!c) {
        this.ballGeo ??= pincushion(this.pal);
        c = b.m.userData.wellProp = new THREE.Mesh(this.ballGeo, this.mats.matte); c.castShadow = true; c.userData.zone = 'strawmanwell';
        b.m.add(c); this.shadeOne(c); b.m.material.visible = false;
      }
      c.rotation.z = -(b.C?.dir ?? -1) * (b.d ?? 0) / r;
    }
  }

  // ---------------------------------------------------------------- let go
  dispose() {
    for (const m of this.hidden) m.visible = true;
    for (const m of this.unseen) m.visible = true;
    for (const [mesh, o] of this.outlined) if (mesh.parent) mesh.add(o);
    for (const B of this.belts) B.dispose();
    for (const o of this.made) { o.removeFromParent(); releaseOutlines(o); o.traverse?.((x) => { if (x.geometry && x.geometry !== this.ballGeo && !x.userData.isOutline) x.geometry.dispose(); }); }
    for (const b of this.ctx.well.machine?.balls ?? []) { b.m.userData.wellProp?.removeFromParent(); b.m.userData.wellProp = null; if (b.m.material) b.m.material.visible = true; }
    this.ballGeo?.dispose();
    for (const k of SOUPS) this.mats[k].dispose();
    this.made = []; this.hidden = []; this.unseen = []; this.outlined = []; this.riders = []; this.spent = []; this.belts = [];
  }
}
