// ---------------------------------------------------------------------------------------
// ALTERATION'S GOD POWER BEYOND THE MATTER'S VERBS (docs/plans/GODHAND.md section 8), a handler for the runner (godhand/powers.js).
// Sunder, Swell and Wring are the God Arts of old (godhand/arts.js); Shape and Carve are the matter's verbs (godhand/matterarts.js).
//   TRANSMUTE  press: the sand under the hand turns to clay and the clay to sand. With Shift, the Lachryma there takes your draught's
//              feeling (the feeling you last drank).
// Prior art: Fullmetal Alchemist's circle (the same matter, another form); From Dust's Jungle and Water stones that turn the ground.
// ---------------------------------------------------------------------------------------
const strongest = (d) => { let best = null, bv = 0; for (const [f, v] of Object.entries(d || {})) if (v > bv) { bv = v; best = f; } return best; };

export const ALTER = {
  transmute: {
    begin(P, L) {
      const g = P.game, F = P.F; if (!F) return false;
      const r = P.ramp('transmute', 'r'), feeling = L.shift ? strongest(g.draught) : null;
      if (L.shift && !feeling) { g.log.say('warn', 'You have drunk no feeling to give it.', { key: 'transmute.none', throttle: 2 }); return false; }
      F.transmute(L.a.x, L.a.z, r, feeling ? { feeling } : { swap: true });
      P.ring(L.a, r, P.domainColour('transmute'), 0.8);
      P.emit('transmute', { feeling, r: +r.toFixed(1) });
      return false;
    },
  },
};
