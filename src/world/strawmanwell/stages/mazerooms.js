// ---------------------------------------------------------------------------------------
// THE MAZE'S ROOMS: the day's maze laid as tiles (docs/plans/STRAWMANS-WELL.md 3.17; Spelunky's level generator). Pure: no three.js.
// A 4 x 4 grid of rooms, each MAZE.w x MAZE.h one-metre tiles; the path is walked from the top-left room (the entrance) along its row,
// turning down at random or at the grid's edge and going on the other way along the next row, until it drops out of the bottom row: that
// room is the exit. So the way from the entrance to the exit is always there, and never needs a climb (Spelunky's guarantee). Each room
// on the path is cut from a template of the stages' own verbs (thin floors, springs, pins, steps) and opened where the path passes: a
// doorway in the wall it shares with the next room along the row, a hole in its floor where the path drops (half the time a thin floor
// over the hole: S + Space drops through). The rooms off the path are rock. The same game day lays the same maze for everyone.
//
// Prior art: Spelunky (Derek Yu, 2008: the 4 x 4 grid, the path of room types 1 to 3, templates stitched); the Run's and the Stomp's verbs.
//
//   mazeOf(seed) -> { tiles (rows of strings, top row first: '#' rock, '.' air, '=' thin floor, '^' spring, 'x' pins), cols, rows, w, h,
//   path: [{ c, r, from: 'left'|'right'|'top'|null, enter: [tx, ty], down }], start: [tx, ty], exit: [tx, ty] }   MAZE   TEMPLATES   rngOf(seed)
//   (tile tx along, ty up from the bottom: the tile spans x tx..tx+1, y ty-1..ty, so the bottom rooms' floors stand at y 0)
// ---------------------------------------------------------------------------------------

/** The grid: its rooms across and down, a room's tiles across and up (its floor row and its left wall among them), the chance at each
 *  room along a row that the path turns down there. */
export const MAZE = { cols: 4, rows: 4, w: 10, h: 7, down: 0.3 };

/** A room's inside (MAZE.w - 1 across, MAZE.h - 1 up, top row first), by what it asks. Each reads both ways along the row. */
export const TEMPLATES = [
  ['.........', '.........', '.........', '.........', '.........', '.........'], // (a breather)
  ['.........', '.........', '.........', '.........', '..=====..', '..xxxxx..'], // (a thin bridge over pins)
  ['.........', '.........', '.........', '....#....', '...###...', '..#####..'], // (a hump of steps)
  ['.........', '.........', '.........', '....#....', '....#....', '...^#^...'], // (a wall and a spring on each side)
  ['.........', '.........', '.........', '...===...', '..=...=..', '.........'], // (thin shelves)
  ['.........', '.........', '.........', '.........', '.........', '.x#x#x#x.'], // (stepping stones over pins)
  ['.........', '.........', '.........', '.........', '.........', '.##xxx##.'], // (two steps, pins between)
];

/** A seeded stream (mulberry32): the day's maze is the same for everyone that game day. */
export function rngOf(seed) {
  let a = (Math.imul(seed | 0, 0x9e3779b1) ^ 0x5f3759df) >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function mazeOf(seed) {
  const { cols, rows, w, h } = MAZE, rnd = rngOf(seed), W = cols * w + 1, H = rows * h + 1;
  // the path (Spelunky's walk: along the row, down at random or at its edge, out of the bottom row)
  const path = [], on = new Map(), key = (c, r) => `${c},${r}`;
  let c = 0, r = 0, dir = 1, from = null;
  for (let guard = 0; guard < 64; guard++) {
    const room = { c, r, from, down: false }; path.push(room); on.set(key(c, r), room);
    const edge = c + dir < 0 || c + dir >= cols;
    if (edge || (rnd() < MAZE.down && path.length > 1)) {
      room.down = true;
      if (r === rows - 1) break;
      r++; from = 'top'; dir = c === 0 ? 1 : c === cols - 1 ? -1 : rnd() < 0.5 ? -1 : 1;
    } else { c += dir; from = dir > 0 ? 'left' : 'right'; }
  }
  const exitRoom = path[path.length - 1]; exitRoom.down = false; // (the last room's floor stays: the exit stands on it)
  // the tiles: rock everywhere, then each path room cut from its template and opened where the path passes
  const T = Array.from({ length: H }, () => Array(W).fill('#')); // (T[ty][tx], ty up from the bottom)
  const set = (tx, ty, ch) => { if (tx >= 0 && tx < W - 1 && ty >= 0 && ty < H - 1) T[ty][tx] = ch; };
  for (const room of path) {
    const tx0 = room.c * w, ty0 = (rows - 1 - room.r) * h, tpl = TEMPLATES[Math.floor(rnd() * TEMPLATES.length)];
    room.tpl = TEMPLATES.indexOf(tpl);
    for (let ly = 1; ly < h; ly++) for (let lx = 1; lx < w; lx++) set(tx0 + lx, ty0 + ly, tpl[h - 1 - ly][lx - 1]);
    // the doorways at both ends of the row's way through (a room's left wall is its own column 0; the next room's is its right)
    for (let ly = 1; ly <= 3; ly++) for (const lx of [1, w - 1]) set(tx0 + lx, ty0 + ly, '.');
    // where it drops: a hole in its floor (or a thin floor over it), and nothing standing over it
    if (room.down) { const thin = rnd() < 0.5; for (const lx of [4, 5]) { set(tx0 + lx, ty0, thin ? '=' : '.'); for (let ly = 1; ly <= 2; ly++) set(tx0 + lx, ty0 + ly, '.'); } }
    // where it is dropped into: a clear fall down its middle
    if (room.from === 'top') for (const lx of [3, 4, 5, 6]) for (let ly = 1; ly < h; ly++) { const t = T[ty0 + ly][tx0 + lx]; if (t === '#' || t === '^' || t === 'x') set(tx0 + lx, ty0 + ly, '.'); }
    room.enter = room.from === 'left' ? [tx0 + 1.5, ty0] : room.from === 'right' ? [tx0 + w - 0.5, ty0] : room.from === 'top' ? [tx0 + 4.5, ty0] : [tx0 + 2.5, ty0];
  }
  for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i]; if (a.r === b.r) { const right = a.c < b.c ? b : a; for (let ly = 1; ly <= 3; ly++) set(right.c * w, (rows - 1 - right.r) * h + ly, '.'); } }
  // the entrance's and the exit's ground kept clear
  const st = path[0], ex = exitRoom, sx0 = st.c * w, sy0 = (rows - 1 - st.r) * h, ex0 = ex.c * w, ey0 = (rows - 1 - ex.r) * h;
  for (let ly = 1; ly <= 3; ly++) { for (let lx = 1; lx <= 3; lx++) set(sx0 + lx, sy0 + ly, '.'); for (let lx = 6; lx < w; lx++) set(ex0 + lx, ey0 + ly, '.'); }
  return {
    tiles: T.map((row) => row.join('')).reverse(), T, cols, rows, w, h, W, H, path,
    start: [sx0 + 2.5, sy0], exit: [ex0 + 7.5, ey0], door: [ex0 + 8.9, ey0],
  };
}
