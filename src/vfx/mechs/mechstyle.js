// ---------------------------------------------------------------------------------------
// A MECH'S STYLE (plain name; South, 2026-11-02: "add in pauldron variants ... We need to have a feminine mech variant too"): the looks a
// mech wears beside its parts, chosen and kept: its form (the heroic frame, the doll or Drossel's, vfx/mechs/partsbody.js `setForm`), its pauldrons
// (`setPauldron`, the parts' `PAULDRONS`) and its helm (vfx/mechs/helms.js `game.mechHelm`). Worn on the hangar's frame whenever it is
// built or rebuilt; kept in the save (section `mechStyle`, the player's). Looks only: never a part's numbers, which are Dovina's.
// A feminine form never shows a bare head: with no helm chosen it wears its own (kit.js FORMS `helm`, South, 2026-11-02: "we're
// going with floating helmets for heads"), the kept choice still none.
// Prior art: Armored Core's paint and decal page beside its assembly (a look kept apart from the parts), the Pneuka Jar's look
// (vfx/pneukajar/look.js: slots of looks over one model, one save section).
//
//   installMechStyle(game) -> game.mechStyle { form, pauldron, helm, set(slot, id), wear(body) }   `/mechstyle form|pauldron|helm <id>`
// ---------------------------------------------------------------------------------------
import { formOf } from './parts/kit.js';

/** The looks a frame starts in. */
export const MECH_STYLE = { form: 'hero', pauldron: null, helm: null };
/** The helm a frame wears: the one chosen, else its form's own (a feminine form's), else none. */
const helmOf = (L) => L.helm ?? formOf(L.form).helm ?? null;

export function installMechStyle(game) {
  const L = { ...MECH_STYLE, worn: null };
  const body = () => game.hangar?.pilot?.mech || null;
  const said = () => game.events?.emit('mech.style', { form: L.form, pauldron: L.pauldron, helm: L.helm, by: 'courier' });
  /** Put the kept looks on a body (its form first: a form rebuilds the parts the pauldrons and the helm sit on). */
  L.wear = (B = body()) => {
    if (!B) return;
    if (B.form !== L.form) B.setForm?.(L.form);
    if ((B.pauldron ?? null) !== L.pauldron) B.setPauldron?.(L.pauldron);
    const helm = helmOf(L); if ((B.helm?.id ?? null) !== helm) game.mechHelm?.(helm);
    L.worn = B; L.stamp = B.builtAt ?? B.group?.children?.length;
  };
  L.set = (slot, id) => {
    if (!(slot in MECH_STYLE)) return false;
    L[slot] = id === 'none' || id === '' ? null : id;
    if (slot === 'form') L.form = ['doll', 'drossel'].includes(L.form) ? L.form : 'hero';
    game.save?.dirty('mechStyle'); L.wear(); said();
    return true;
  };
  game.save?.section('mechStyle', { scope: 'player', version: 1, dump: () => ({ form: L.form, pauldron: L.pauldron, helm: L.helm }),
    load: (s) => { Object.assign(L, MECH_STYLE, s ? { form: s.form, pauldron: s.pauldron ?? null, helm: s.helm ?? null } : {}); },
    reset: () => Object.assign(L, MECH_STYLE) });
  // a frame built or rebuilt (the assembly page, the gantry) wears the kept looks
  game.systems?.add?.('looks', () => { const B = body(); if (B && (L.worn !== B || B.form !== L.form)) L.wear(B); }, { clock: 'raw', name: 'mechStyle' });
  game.chat?.add?.('mechstyle', { help: "a mech's style: /mechstyle form hero|doll|drossel, /mechstyle pauldron <id|none>, /mechstyle helm <id|none>", run: ([slot, id]) => { L.set(slot, id ?? null); } });
  game.mechStyle = L;
  return L;
}
