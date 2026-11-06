// THE VOID AND THE OASIS (stub: its builder replaces this whole file; the interface below is fixed).
//   new EntropyVoid(game, look)   .attach(room)   .detach()   .tick(dt, t)
export class EntropyVoid {
  constructor(game, look) { this.game = game; this.look = look; }
  attach(room) { this.room = room; }
  detach() { this.room = null; }
  tick() {}
}
