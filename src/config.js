// Every number that affects game feel lives here so the in-game tuning panel
// (Tab) can edit it live. Angles are in degrees, distances in metres, times in seconds.
export const DEFAULTS = {
  movement: {
    walkSpeed: 4.2,
    sprintSpeed: 6.8,
    walkSlowSpeed: 1.8, // hold Alt to walk
    adsSpeedMult: 0.55,
    groundAccel: 55,
    groundDecel: 40,
    airAccel: 10,
    jumpVelocity: 6.4,
    gravity: 21,
    coyoteTime: 0.1,
    jumpBuffer: 0.12,
    stepHeight: 0.4,
    maxSlope: 46,
    tpTurnSpeed: 11, // how fast the body turns toward the move direction in 3rd person
    tpMaxTurn: 540, // deg/s cap on that turn (doubled in combat stance)
    combatStanceTime: 1.6, // seconds the body keeps facing the crosshair after firing
    strafeSprintMult: 0.9, // sprinting sideways (anything but backwards sprints)
    maxSpeed: 14, // hard cap on horizontal speed (Titanfall tops out around 13 m/s)
    airDrag: 2.5, // m/s² momentum loss in the air above run speed (steering never kills it)
    overspeedDecel: 10, // m/s² bleed of extra speed on the ground (so a quick hop keeps it)
    groundSteer: 6,
    crouchSpeed: 2.2,
    // slide: crouch above slideMinSpeed (or out of a sprint); slopes push you along
    slideSpeed: 9.5, // a boosted slide starts at least this fast
    slideBoost: 2, // added on top of your speed when the boost is ready
    slideBoostCooldown: 1.6,
    slideMinSpeed: 5,
    slideBuffer: 0.2, // a crouch press this early still counts once you're fast enough
    slideFriction: 5.5,
    slideSlopeAccel: 30,
    slideSteer: 2.5,
    slideMaxTime: 1.2,
    slideCooldown: 0.25,
    slideJumpBoost: 1.08,
    airJumps: 1, // jump-kit double jumps (refilled on the ground and on walls)
    airJumpMult: 0.9,
    // wallrun: airborne, pushing forward, a wall beside you
    wallrunMinSpeed: 4.2,
    wallrunSpeed: 9.5,
    wallrunAccel: 7,
    wallrunHold: 0.5, // seconds of light gravity at the start
    wallrunGravity: 3,
    wallrunMaxFall: 3,
    wallrunMaxTime: 1.8,
    wallrunStartUp: 1.2,
    wallrunMinHeight: 0.6,
    wallrunReach: 0.9, // how far from your side a wall can be to catch it
    wallrunTilt: 12, // camera roll, degrees
    wallJumpOut: 5.5,
    wallJumpUp: 6.2,
    wallJumpKeep: 1.0,
    critterPush: 0.2, // share of a clapperjar overlap that moves you (the rest moves them)
    // mantle: push into a ledge while jumping or falling
    mantleMin: 0.45,
    mantleJumpMin: 0.75, // on the ground, a jump into a ledge at least this tall becomes a mantle
    mantleMax: 1.9,
    mantleReach: 0.55,
    mantleTime: 0.34,
    mantleRiseMax: 3.5,
    // air dash: Shift in the air, costs Lachryma
    dashSpeed: 13,
    dashTime: 0.17,
    dashUp: 1.2,
    dashCost: 12,
    dashCharges: 1,
  },
  camera: {
    sensitivity: 1.0,
    adsSensMult: 0.65,
    fpFov: 78,
    fpAdsFov: 54,
    tpFov: 70,
    tpAdsFov: 50,
    eyeHeight: 1.6,
    tpPivotHeight: 1.5,
    tpDistance: 3.0,
    tpAdsDistance: 1.5,
    tpShoulder: 0.7,
    tpAdsShoulder: 0.6,
    speedFov: 8, // extra fov at top speed
    tpLift: 0.18,
    viewBlendTime: 0.22,
    fpHeadBob: 0.5,
    collisionRadius: 0.2,
  },
  weapon: {
    fireInterval: 0.16, // min seconds between shots (semi-auto cap)
    inputBuffer: 0.09, // click this early and the shot still fires when ready
    damage: 100,
    impulse: 6, // N·s pushed into whatever you hit
    range: 150,
    hipSpread: 1.6,
    adsSpread: 0.1,
    moveSpread: 1.4,
    airSpread: 3.0,
    bloomPerShot: 1.1,
    bloomMax: 4.0,
    bloomRecovery: 6.5, // deg per second
    adsTime: 0.15,
    gunScale: 0.85,
    adsDistance: 0.55, // how far in front of the eye the gun sits when aiming down sights
    adsHeight: 0.0, // fine-tune sight alignment
    drawTime: 0.26, // holster -> hands: reach back, grab, whip it round
    holsterTime: 0.34,
    drawGrab: 0.4, // share of the draw spent reaching back to the grip
    swapOnWallrun: true, // right-side wallruns: pass the gun to the left hand, right hand on the wall
    swapTime: 0.22,
    drawTwist: 38, // how far the shoulders turn back to reach it (deg)
    // holstered gun across the small of the back: where the grip sits (m, relative to the
    // feet, +x left, +z forward), the muzzle dip and how far it wraps round the waist (deg)
    holster: { x: -0.2, y: 0.98, z: -0.21, tilt: 14, wrap: 12 },
    autoHolster: true, // third person: put it away after a while out of combat
    holsterDelay: 5,
  },
  charge: {
    mode: 'release', // 'release': tap fires on release, hold charges from cold. 'press': fire on press, keep holding to charge
    tapWindow: 0.13, // (release mode) presses shorter than this are taps
    delay: 0.22, // (press mode) hold this long after the tap shot before charging starts
    time: 0.85, // seconds to full charge
    min: 0.25, // release below this and nothing fires
    cost: 24, // Lachryma for a full charge (reserved as it winds up, refunded if cancelled)
    damage: 450,
    pierce: 6, // objects the beam passes through
    impulse: 30,
    blastRadius: 2.4,
    kick: 2.4, // recoil multiplier
    shake: 1.0,
    fovPunch: 7,
    moveMult: 0.75,
  },
  lachryma: {
    max: 100,
    regenRate: 3.5, // per second, after regenDelay without spending
    regenDelay: 2.2,
    shotCost: 4,
    baubleValue: 6,
    baubleRadius: 0.075,
    bounce: 0.6,
    magnetRadius: 3.2,
    magnetDelay: 0.6,
    clapperDrop: 6, // baubles inside every clapperjar
    markedDrop: 2, // baubles from a marked pot
  },
  // psychic cartography and the Zone of Influence: see cartography.js
  zoi: {
    tiers: [0.08, 0.45, 0.85], // knowledge that makes a cell sensed / charted / understood
    baseRadius: 6, baseTier: 2, // around the vessel, always charted
    passiveCap: 0.5, passiveRate: 0.5, // walking about charts (never past .5)
    pulseRadius: 14, godPulseRadius: 20, pulseCost: 12, pulseCooldown: 3,
    roomRadius: 14, roomCells: 70, // cells charted near a named place for it to count as mapped
  },
  // the god arts (godarts.js): Lachryma costs and reach
  arts: {
    telekinesis: { drain: 3, massDrain: 0.12 }, // per second held, plus this per kg
    sunder: { cost: 8, perCut: 2, maxLen: 12, height: 3.2 },
    swell: { cost: 4, drain: 5, min: 0.4, max: 2.6 },
    wring: { cost: 6, drain: 6, twist: 3.6, lobe: 0.35 },
    manifest: { cost: 8, perVol: 0.6, maxLen: 9, maxH: 4, width: 1.1, life: 40, max: 6 },
  },
  // the god hand (~): see godmode.js
  god: {
    firstWave: 22, waveEvery: 34, waveBase: 2, waveGrow: 1, vesselHp: 100,
    range: 36, dist: 17, minDist: 8, maxDist: 46, pitchDeg: 36, fov: 24, clipAbove: 3.9,
    hoverH: 1.7, grabSpeed: 14, throwBoost: 1.15, throwMax: 30, panSpeed: 1.0, edgeScroll: 16,
    castHeight: 7, castCooldown: 0.35, pushRadius: 5.5, pushForce: 11,
    regenEvery: 9, regenMax: 6, raidDamage: 7, ballDamage: 14, blastDamage: 22, thrownDamage: 4, reforge: 7,
  },
  shells: {
    start: 4,
    max: 8,
    refill: 3, // per reliquary visit
    reliquaryCooldown: 20,
    rackTime: 0.6,
    kick: 1.8,
    groove: { speed: 16, lift: 2.4, radius: 6.5, duration: 9, hop: 3.4 },
    anchor: { duration: 12 },
    hatch: { maxAllies: 5 },
    slicer: { pierce: 10, separate: 1.4, carry: 1.5, pieceLife: 25, maxPieces: 160 },
    push: { range: 10, angle: 32, velocity: 13, selfKnock: 3 },
    well: { speed: 20, gravity: 3, maxFlight: 1.6, duration: 3.2, radius: 6.5, pull: 26, swirl: 9, playerPull: 5, popRadius: 3.4, popVelocity: 11,
      // debris crushed at the core (zone grows by compressGrow over the well's life, at most
      // compressMax per step); every compressPer pieces condense into a bauble, up to compressDrops
      compressRadius: 0.8, compressGrow: 1.5, compressMax: 6, compressPer: 5, compressDrops: 8 },
    mark: { radius: 2.4, stun: 4.5, duration: 15, damageMult: 2 },
    bomb: { speed: 13, lift: 4, fuse: 1.8, bounces: 2, radius: 3.6, damage: 260, velocity: 10, droplets: 110, dropletDamage: 10,
      splatLife: 11, poolRadius: 1.6, poolLife: 12, poolDps: 45 },
    // banks off walls/floors; every bounce multiplies damage and bends toward a target in seekAngle
    ricochet: { bounces: 5, damage: 90, bounceMult: 1.35, seekAngle: 30, seekRange: 16, range: 45 },
    // hold to paint (cone around the crosshair, lockTime per target), release to fire one seeker per lock
    slip: { speed: 15, lift: 3, droplets: 90, spread: 6, patch: 1.6 },
    homing: { maxLocks: 6, lockTime: 0.18, cone: 12, range: 32, launchSpeed: 7, speed: 19, fan: 5, stagger: 0.06,
      turn: 5, turnGrow: 14, maxFlight: 4, damage: 150, splash: 0.9 },
  },
  recoil: {
    kickPitch: 3.4,
    kickYaw: 0.9,
    permanent: 0.3, // fraction of the kick that stays (you pull it down); rest springs back
    recoverSpeed: 14,
    adsMult: 0.7,
    gunKickBack: 0.08,
    gunKickRot: 16,
    gunRecoverSpeed: 16,
    shake: 0.35,
    fovPunch: 2.5,
  },
  tracer: {
    speed: 320,
    length: 3.5,
    width: 0.028,
    trailLife: 0.22,
    trailOpacity: 0.28,
  },
  shatter: {
    breakSpeed: 4.2, // impact speed (m/s) at which a falling pot breaks
    radialBurst: 2.4,
    bulletPush: 4.5,
    upBias: 1.4,
    spin: 14,
    maxChunk: 3,
    shardLife: 14,
    maxShards: 650,
    chips: 18,
    dust: 1.0,
    shardOutlines: false, // outlines double the draw calls of every shard
    ropeKick: 0.45, // impulse on rope links when the pot they carry is shot away
  },
  explosion: {
    radius: 4.5,
    velocity: 13, // velocity change at the centre, falls off to 0 at radius
    chainDelay: 0.09,
    playerKnock: 6,
    shake: 1.4,
  },
  clappers: {
    count: 4,
    upstairs: 2,
    runSpeed: 3.0,
    fleeSpeed: 4.6,
    respawn: 3.5, // seconds before a new one hops out of the kiln
    spookRadius: 1.8, // shots landing this close make them stumble and bolt
    scale: 1.15,
    hideChance: 0.55, // when spooked: hide behind a big pot instead of just running
    tauntChance: 0.3, // when idle and they can see you
    napChance: 0.12, // when idle and you're far away
    fallShatter: 2.4, // metres of fall that shatter them
    // kintsugi: idle clappers rebuild broken pots / mend badly cracked ones with gold seams
    mendChance: 0.55, // when idle and there's a job on their floor
    mendTime: 4.5,
    mendShy: 3.5, // they won't start (and give up) if you're closer than this to the job
    mendRange: 14,
    wreckDelay: 2.5, // seconds a wreck settles before anyone comes for it
    kintsugiHp: 1.6, // hp multiplier of mended pots
    kintsugiDrop: 3, // extra baubles per gold level when a mended pot breaks
  },
  physics: {
    gravity: 14,
  },
  // time trial medals (seconds, generous) and the quick-double bonus
  trial: { gold: 90, silver: 150, bronze: 240, quickWindow: 1.5, quickBonus: 1 },
  // Movement techs (src/moves/): optional techniques over the core movement above. Each
  // has an `enabled` switch; off, the core behaves exactly as if the tech didn't exist.
  tech: {
    blink: { enabled: true, distance: 5.5, time: 0.09, charges: 2, recharge: 1.8, exitSpeed: 7, airLift: 1.5, ghostLife: 0.45 }, // E
    slam: { enabled: true, lookDown: 30, minHeight: 1.8, speed: 24, steer: 3, radius: 3.2, breakFrac: 0.45, velocity: 9, window: 0.3, jumpMult: 1.15, jumpPerMetre: 0.06, jumpMax: 1.9, slidePerMetre: 0.35 }, // C in the air, looking down
    stomp: { enabled: true, minSpeed: 2, bounce: 8.5 }, // land on a pot or a clapperjar
    roll: { enabled: true, minDrop: 20, time: 0.5, speed: 8.5, speedPerFall: 0.25, iframes: 0.32, cooldown: 0.7, clipFrom: 0.3, clipTo: 1.0 }, // Shift while crouched; automatic out of a fall of 20 m or more
    slip: { enabled: true, speed: 10, accel: 45, dryCrawl: 1.4, climbSpeed: 6, jump: 8.4, keepSpeed: 10, regen: 12, coverLife: 30 }, // C on slip
    swim: { enabled: true, speed: 3.2, sprint: 5.2, underwater: 3.6, accel: 8, drag: 2.5, buoyancy: 9, exitJump: 7.4, exitPush: 2.2 }, // water
    ladder: { enabled: true, speed: 1.1, fast: 2.2, slide: 6, kickOut: 4.5, kickUp: 4.5, rung: 0.3 }, // walk into a ladder
    hang: { enabled: true, reach: 0.5, minTop: 1.92, maxTop: 2.95, handTol: 0.5, maxRise: 8, maxFall: 9, grace: 0.5, shimmy: 1.8, brachiate: 2.6, kickOut: 4.5, kickUp: 5, barReach: 0.45, barKick: 3.5, zipSpeed: 9, zipAccel: 5 }, // W at a ledge just above mantle height; an overhead bar; a cable
    latch: { enabled: true, reach: 0.55, budget: 2.2, speed: 2.4, kickOut: 5, kickUp: 5.5, slide: 1.6 }, // C in the air beside a wall
    pole: { enabled: true, speed: 2.6, ropeSpeed: 1.9, slide: 7, spin: 2.2, kickOut: 4.5, kickUp: 5 }, // walk into a pole or a rope
    grate: { enabled: true, speed: 2.4, fast: 1.6, kickOut: 5, kickUp: 5.5 }, // walk into a grate wall, jump up under a grate ceiling
    balance: { enabled: true, speed: 1.9, trot: 3.4, step: 0.8, drift: 0.12, trotDrift: 0.5 }, // walk onto a beam
    carry: { enabled: true, reach: 1.15, slow: 0.72, maxSize: 1.35, maxMass: 30, speed: 14 }, // F at a small thing: hoist it; fire throws
    push: { enabled: true, speed: 1.5, pullSpeed: 1.3 }, // hold F at a heavy crate
    kick: { enabled: true, radius: 0.85, damage: 60, launch: 6, heavyCap: 60, knock: 9, cooldown: 0.25, parrySpeed: 4.5, parryRadius: 2.0, parryOut: 12, parryIframes: 0.35, parryAssist: 0.45 }, // V
    surfer: { enabled: true, hover: 0.55, cruise: 24, trimIn: 1.18, trimOut: 0.5, windLo: 0.82, windHi: 1.2, accel: 15, coast: 2.4, brake: 22, turn: 2.6, turnFast: 1.55, steerRamp: 10, grip: 8, driftGrip: 2.2, driftTurn: 1.4, driftMin: 0.7, driftBoost: 7, driftMinSpeed: 10, maxSpeed: 42, slopeGain: 1.6, follow: 12, gravity: 24, boostMult: 1.5, boostAccel: 34, boostCost: 22, hop: 7.6, hopCharge: 6, hopTime: 0.3 }, // the Solar Surfer, in the dunes: Y stows / summons
    recoil: { enabled: true, charges: 3, kick: 5.4, chargedKick: 11, minDown: 0.35, horizontal: 0.6 }, // shoot down in the air
  },
  anim: {
    // clip-driven: see character.js. Speeds in m/s, times in seconds into the clip.
    // gait bands (m/s): idle -> walk by walkIn, walk up to walkMax, jog from jogIn (full jog at
    // movement.walkSpeed), sprint at movement.sprintSpeed. The walk hands over to the jog where a
    // walk on legs this length would have to spin; raise walkMax to see a power walk.
    walkIn: 0.5,
    walkMax: 2.4,
    jogIn: 3.4,
    strideShare: 0.5, // above a clip's own speed, this share of the extra comes from longer strides (the rest cadence)
    walkStride: 1.65, // stride warp cap while walking (a walk can reach much further than it does in the clip)
    maxStride: 1.3, // stride warp cap for the jog / sprint
    footLock: true, // pin planted feet to the ground (no skating while speeding up, turning, blending)
    crouchDepth: 0.8, // how far into the (very low) crouch clips the crouch goes
    aimRange: 50, // pitch (deg) that maps onto the aim-up / aim-down poses
    jumpFrom: 0.15, // jump clip: take-off frame
    flipFrom: 0.12, // air jump: the tuck flip's take-off
    landFrom: 0.1, // landing clip: impact frame
    slideFrom: 0.15, // slide clip: the drop
    dashFrame: 0.19, // air dash holds this frame of the take-off (stretched out)...
    dashLean: 38, // ...pitched forward this far (deg)
    climbFrom: 0.15, // mantle plays this span of the climb clip
    climbTo: 0.62,
    wallLean: 24, // whole-body roll off the wall while wallrunning (deg)
    landDip: 0.09,
  },
  visual: {
    outline: 0.006,
    exposure: 1.2,
    sun: 3.2,
    fog: 0.018,
    shadows: true,
  },
  audio: {
    volume: 0.7,
  },
};

const STORAGE_KEY = 'foolsfortune.tuning.v2';
const OLD_KEY = 'foolsfortune.tuning.v1';
// defaults that changed since v1: stored v1 values for these are dropped on migration
const V1_DROP = [['shatter', 'shardOutlines']];
// defaults retuned since a save was made: stored values for these are ignored (so an old
// save can't bring back a slow draw or a hip holster). [version, group, key]
const RETUNED = [[1, 'weapon', 'drawTime'], [1, 'weapon', 'holsterTime'],
  [2, 'weapon', 'drawTime'], [2, 'weapon', 'holsterTime'], [2, 'weapon', 'holster'], [2, 'anim', 'strideShare'], [2, 'anim', 'maxStride']];
const RETUNE_V = 2;

function deepMerge(target, src) {
  for (const k in src) {
    if (!(k in target)) continue;
    if (typeof target[k] === 'object' && target[k] !== null) deepMerge(target[k], src[k]);
    else if (typeof src[k] === typeof target[k]) target[k] = src[k];
  }
  return target;
}

export const T = structuredClone(DEFAULTS);

export function loadTuning() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      const v = o.retunedV ?? (o.retuned1 ? 1 : 0);
      for (const [rv, g, k] of RETUNED) if (v < rv && o[g]) delete o[g][k];
      deepMerge(T, o);
    }
    else {
      const old = localStorage.getItem(OLD_KEY);
      if (old) {
        const o = JSON.parse(old);
        for (const [g, k] of V1_DROP) if (o[g]) delete o[g][k];
        deepMerge(T, o);
      }
    }
  } catch { /* storage unavailable */ }
}

export function saveTuning() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...T, retunedV: RETUNE_V })); } catch { /* ignore */ }
}

export function resetTuning() {
  deepMerge(T, structuredClone(DEFAULTS));
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export const DEG = Math.PI / 180;

// Monochrome terracotta palette: one hue, many values.
export const PALETTE = {
  outline: 0x1c0d08,
  deep: 0x3b1c13,
  dark: 0x5a2b1d,
  wall: 0x8c4a33,
  floor: 0x6f3726,
  wood: 0x9c5236,
  mid: 0xb4603f,
  pot: 0xc46a45,
  potLight: 0xd98a62,
  pale: 0xe8ab86,
  cream: 0xf3c9a8,
  glow: 0xffb27a,
  hot: 0xffe0c0,
  fracture: 0xe79b75,
};
