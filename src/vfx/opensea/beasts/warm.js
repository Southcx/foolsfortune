// ---------------------------------------------------------------------------------------
// THE SEA BEASTS' PROGRAM, WARMED AT BOOT (Petra, 2026-10-27: the first beast's compile was a hitch at its spawn): one akhlut body
// parked 50 m down while the warm-up compiles the scene, so 'egregore-beast' (beastkit.js) is linked before any beast is met; the
// umibozu, the kraken and Jormungandr's dress share it or the serpent's (warmed with the fight's look).
//
// Prior art: the safari Egregores' own warm-up (egregorebodies.js prewarmEgregores), the same one copy 50 m down.
//
//   const park = prewarmSeaBeasts(game)   ...compile...   park()   (the copy hidden again; kept, so the program lives)
// ---------------------------------------------------------------------------------------
import { AkhlutBody } from './akhlut.js';

export function prewarmSeaBeasts(game) {
  const b = new AkhlutBody(game, {}), G = b.group;
  G.position.set(0, -50, 0); G.userData.zoneFree = true; G.visible = true; b.mesh && (b.mesh.userData.zoneFree = true);
  return () => { G.visible = false; };
}
