// THE BOARD VIEW (stub: its builder replaces this whole file; the interface below is fixed).
//   new EntropyBoardView(game, look)   .enter(session)   .leave()   .tick(dt, t)   .on
export class EntropyBoardView {
  constructor(game, look) { this.game = game; this.look = look; this.on = false; }
  enter(session) { this.session = session; this.on = true; }
  leave() { this.session = null; this.on = false; }
  tick() {}
}
