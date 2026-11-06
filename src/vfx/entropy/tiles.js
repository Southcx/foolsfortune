// THE TILES (stub: its builder replaces this whole file; the interface below is fixed).
//   new EntropyTiles(game, look)   .attach(room)   .detach()   .tick(dt, t)   .setup()   .flip(x, z)   .top(x, z, out) -> Vector3 (a tile's top
//   centre as drawn now)   .tile(x, z) -> Mesh   .light(x, z, k, color)   (a tile lit for the board view: k 0..1)
import * as THREE from 'three';
export class EntropyTiles {
  constructor(game, look) { this.game = game; this.look = look; }
  attach(room) { this.room = room; }
  detach() { this.room = null; }
  tick() {}
  setup() {}
  flip() {}
  tile(x, z) { return this.room?.tiles[z * 7 + x] || null; }
  top(x, z, out = new THREE.Vector3()) { const m = this.tile(x, z); return m ? out.copy(m.position).setY(m.position.y + 0.125) : out; }
  light() {}
}
