// ---------------------------------------------------------------------------------------
// BOOT CO-OP: the party: the siblings, their rigs (another Courier's model is parsed when one is called, never at boot), a sibling's
// shatter, the meetings, the guests over the published page's room, the channel the divisions steer their siblings through, what asking
// and letters spend, the answers, the letters and the chatroom.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   bootCoop(game, made) -> nothing
// ---------------------------------------------------------------------------------------
import { Character } from '../courier/character.js';
import { rigUniforms } from '../render/outline.js';
import courierB64 from '../assets/courier.glb?b64';
import gunB64 from '../assets/psygun.glb?b64';
import { SiblingShatter } from '../vfx/siblingshatter.js';
import { Party } from '../coop/party.js';
import { SiblingChannel } from '../coop/channel.js';
import { Guests } from '../coop/guests.js';
import { Meetings } from '../coop/meeting.js';
import { SiblingAnswers } from '../coop/answer.js';
import { CoopUsage } from '../coop/usage.js';
import { Letters } from '../coop/letters.js';
import { Chatroom } from '../coop/chatroom.js';

export function bootCoop(game, made) {
  const { scene, loader, bytes, clipPack } = made;
  // the party: the siblings (coop/party.js), each a Courier of its own: the rig's model is parsed when one is called, never at boot
  const makeRig = async () => { // (another Courier's rig: a sibling's or a guest's, its model parsed when it comes, never at boot)
    const [cG, gG] = await Promise.all([loader.parseAsync(bytes(courierB64), ''), loader.parseAsync(bytes(gunB64), '')]);
    return new Character(scene, cG, gG, clipPack, { uniforms: rigUniforms(), fpHide: false });
  };
  game.party = new Party(game, { makeRig }); // (the siblings: coop/party.js)
  game.siblingShatter = new SiblingShatter(game); // (a sibling emptied by friendly fire breaks and is drawn back together beside you: vfx/siblingshatter.js)
  game.meetings = new Meetings(game, game.party, { makeRig }); // (each sibling met once where its craft lives: coop/meeting.js)
  game.guests = new Guests(game, { makeRig }); // (people there with you, over the published page's room: coop/guests.js)
  game.siblingChannel = new SiblingChannel(game); // (the divisions steer their siblings through the published build's store)
  game.coopUsage = new CoopUsage(game); // (what asking and letters spend of yours, capped by the hour: /usage, coop/usage.js)
  game.answers = new SiblingAnswers(game); // ("@petra ...": a sibling answers in seconds, through the page's sample: coop/answer.js)
  game.letters = new Letters(game); // ("/letter petra ...": the division's own session answers in minutes: coop/letters.js)
  game.chatroom = new Chatroom(game); // (the five sessions and the owner in one conversation in the build's store, read in the log: coop/chatroom.js, COOP.md C7, C8)
}
