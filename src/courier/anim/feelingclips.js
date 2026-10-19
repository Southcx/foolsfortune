// ---------------------------------------------------------------------------------------
// THE FEELINGS' CLIPS: the Courier's body answering a feeling the moment it is learned (the awakening, feedback/awakening.js;
// docs/plans/FEELINGS-AWAKENING.md section 3, step 3). One clip of the Courier's own suite each (the social pack, courier/anim/suite.js),
// played by the emote tech as an emote is (courier/moves/emote.js: a one-shot, or a chain in then a one-shot; moving fades it out), but
// never asked for on the chat line, never logged, never counted as an emote. Nothing authored: each is the suite's clip that already is
// that feeling, judged front and side with every tool off the Courier (scratch sheets, 2026-10-11).
//
//   WONDER  looks up: the stretch's second half alone (arms rising, the head back to the sky, and down again), its first half's twist cut
//   MIRTH   laughs: the belly laugh (thrown back, then doubled over)
//   DESIRE  reaches out, then draws it in: hugging the air (the arms wide, then held to the chest: wanting, then having)
//   FURY    clenches the fists: rage (both fists up and shaking)
//   GALL    recoils: disgust (a hand up to ward it off, the head turned from it)
//   GRIEF   the head bowed, the hands to the face: crying's way in and one round of its loop, then its way out
//   DREAD   flinches: the startle (thrown back, the arms up, then settling)
//
// Prior art: the emote state of FFXIV (one clip, begun, played and left), Journey's and Okami's wordless moments (the body is the line),
// and the suite's own emotes (courier/emotes.js), played the same way so a feeling's clip and an emote never look like two systems.
//
//   FEELING_CLIPS[feeling] = { once, from?, to? } | { enter: [..], once }   (the emote tech's spec)
//   feelingClipId(feeling) -> the id the emote tech is asked for   feelingClipOf(id) -> the spec, or null (not a feeling's clip)
// ---------------------------------------------------------------------------------------

/** Each feeling's clip, in the order the feelings are shown. */
export const FEELING_CLIPS = {
  wonder: { once: 'Emote_Stretch', from: 1.85, to: 3.75 }, // (the stretch's rise: its twist before 1.8 s is a stretch, not awe)
  mirth: { once: 'Emote_BellyLaugh' },
  desire: { once: 'Emote_HugAir' },
  fury: { once: 'Emote_Rage' },
  gall: { once: 'Emote_Disgust' },
  grief: { enter: ['Emote_CryEnter', 'Emote_CryLoop'], once: 'Emote_CryExit' }, // (in, one round of the loop, out: a chain, not a loop held)
  dread: { once: 'Emote_Startle' },
};

const PREFIX = 'feeling.';
/** The emote tech's id for a feeling's clip. */
export const feelingClipId = (feeling) => `${PREFIX}${feeling}`;
/** A feeling's clip asked for by its id, or null when the id is not one (an emote's). */
export const feelingClipOf = (id) => (typeof id === 'string' && id.startsWith(PREFIX) ? FEELING_CLIPS[id.slice(PREFIX.length)] || null : null);
