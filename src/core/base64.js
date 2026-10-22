// ---------------------------------------------------------------------------------------
// BASE64 TO BYTES: a model or a clip pack inlined as base64 (vite's `?b64` import, so the published page is one file) turned back into
// its bytes, in one loop over atob's string. `Uint8Array.from(atob(s), (c) => c.charCodeAt(0))` calls a function a byte and was 24
// times slower (1.5 MB: 154 to 178 ms against 6 to 7 ms, node 22, 2026-10-21): the Solar Skiff's model decoded that way was a hitch of
// its own the first time the boat was wanted in the Dunes.
//
//   base64Bytes(b64) -> Uint8Array   base64Buffer(b64) -> ArrayBuffer
// ---------------------------------------------------------------------------------------

/** The bytes a base64 string holds. */
export function base64Bytes(b64) {
  const s = atob(b64), n = s.length, u = new Uint8Array(n);
  for (let i = 0; i < n; i++) u[i] = s.charCodeAt(i);
  return u;
}
/** The same, as the ArrayBuffer a loader parses. */
export const base64Buffer = (b64) => base64Bytes(b64).buffer;
