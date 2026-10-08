# Co-op

Co-op lets other Couriers play in your world. The first kind is your **siblings**: the five divisions that build the game, each as a
Courier with a mind of its own. The second kind is **guests**: real people you share the game with. You care because a sibling fights
beside you, scouts ahead and answers when you talk to it, and a guest lets a friend wander your world.

Everything a sibling does is help, not a carry. Nothing it does counts toward your records.

## Meeting your siblings

Each sibling waits in the place its craft lives. Stand next to it and press **F** to meet it. You meet each one once.

| Sibling | Craft | Where they wait | Their tool |
| --- | --- | --- | --- |
| Petra | pentacles | by the workshop's shelves | the Sondelass's cutlass |
| Dovina | the trumps | at Raku's table | the Lockheart |
| Wanda | wands | on Old Grog's pier | the Crucibelle |
| Calissa | cups | at the kiln | the Veritome |
| Espada | swords | at the Gnomon in the Dunes | the Dreamvane |

A sibling you have not met only appears when you are within 30 m of its place.

## Calling and dismissing them

- Once met, a sibling is called or dismissed at any Shrine, or with the chat line (`/sib <name> call`, `/sib <name> dismiss`).
- **Two siblings** are out at once. A party is **four players at most**, siblings and guests together.
- Who you have met and who is out is kept. Those out come back after a reload.
- A fallen sibling shatters like you do. It stays out until you call it again.

## Telling them what to do

Hold **T** to open the **order wheel**. Flick the mouse toward a wedge and let go.

| Wheel | Order | What they do |
| --- | --- | --- |
| COME | follow | stay within about 6 m of you |
| GO | go | walk to where you look |
| HELP | fight | fight what you look at |
| WAIT | hold | hold here |

You can also type on the chat line:

`/sib <name | all> follow | hold | go <place> | fight | back | warp | call | dismiss`

- `go <place>` takes a place name. A place in another region is not walked to: travel there and they come.
- `warp` sets a sibling down beside you at once. Use it when one is stuck.
- A name alone (`/sib petra`) says who is with you. `/party` works the same.
- Every order is reported in the log.

## What a sibling does

| Sibling | Alone, it |
| --- | --- |
| Petra | stays close and parries what is aimed at you |
| Dovina | fights the biggest thing near; opens its coffin on a stunned foe for you to see |
| Calissa | flashes what threatens you (a stun) and stops to photograph views |
| Wanda | tolls on the beat, which staggers foes |
| Espada | scouts ahead, dowses and points at finds |

- A sibling's blows deal **0.4** of yours, so the fight is still yours to win.
- A foe you struck at all and a sibling finishes still counts for you.
- A sibling never picks up cubes, drops, casks or finds. It **points** at them.
- A sibling never opens chests, buys, sells or spends.
- A sibling's blows never count toward your records.

## Asking a sibling (@name)

Type `@petra how do I get across this gap?` (or `@all`) on the chat line. The sibling answers in a few real seconds, in its division's
voice, with a line in the log. If your words ask for an order, it follows it.

- It answers one question at a time, with a pause of 2.5 real seconds between questions.
- An answer is at most 120 characters. If none arrives in 20 real seconds, it is let go.
- Each ask spends one of your hour's asks (see the meter below).
- Away from the published page there is no answer, and the game tells you once.

## Letters (/letter)

`/letter dovina <words>` sends your words to the division's own working session. It wakes that session and it answers when it can. This
takes real minutes, not seconds.

- Only the owner writes letters.
- One letter to each division every 3 real minutes. One waits at a time on each division.
- A letter is at most 1,000 characters. The same words twice are not sent.
- If no answer comes in 15 real minutes, the log says the letter is late, and you may write again.

## The co-op meter (/usage)

Asking and letters spend your own Claude usage. The meter counts both over the last real hour and stops at a cap you set.

| Kind | Cap per real hour (default) |
| --- | --- |
| Asks | 40 |
| Letters | 10 |

- `/usage` says where you stand and which letters still wait.
- `/usage asks 60` or `/usage letters 5` sets a cap. `0` turns that kind off.
- Caps are saved with your settings and outlast a new build.

## Guests

A guest is a person you share the game with. They join through the published page and appear as a Courier in your world, wearing their
own glazes and moving as they move. You hear what they say on the chat line, and they hear your siblings' answers to them.

- Each guest has their own world. The same build and seed lay out the same land, but nothing is shared yet.
- The shared errand (the Great Dunemaw's descent, with the boss's health scaled for each guest) is **not built yet**. It is planned in
  `docs/plans/COOP.md`.
- A guest who has not been heard from for 5 real seconds is hidden, and let go after 60.
- A guest who sends more than 6 lines in 10 real seconds is not shown for the rest of them.

## Friendly fire

The rules are written, but the game does not use them yet.

| Rule | Number |
| --- | --- |
| Damage to an ally | 0.2 of normal |
| A status on an ally: the next of that kind needs | x2 build-up, holds 0.5 as long |
| Immune to that status | on the third within 20 real seconds |

The aim: a status put on a friend is a trick once, not a lock. Allied creatures, like spirits, are a different case. Your blows pass
through them.

## For the divisions

- The design, rulings and what is built: `docs/plans/COOP.md`
- The party, orders, `/sib`, the wheel's four orders: `src/coop/party.js`
- A sibling's body and keys: `src/coop/sibling.js`; its fighting: `src/coop/fight.js`
- Where each is met: `src/coop/meeting.js`
- Asking (`@name`): `src/coop/answer.js`; the voices: `src/coop/personas.js`
- Letters: `src/coop/letters.js`; a session's reply channel: `src/coop/channel.js`
- The meter: `src/coop/usage.js`
- Guests and presence: `src/coop/guests.js`
- Friendly fire: `src/progress/combat/friendly.js`
- The order wheel: `src/feedback/wheel.js`
