// Every number that affects game feel lives here so the in-game tuning panel
// (Tab) can edit it live. Angles are in degrees, distances in metres, times in seconds.
export const DEFAULTS = {
  movement: {
    walkSpeed: 4.2,
    sprintSpeed: 6.8,
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
  shells: {
    start: 4,
    max: 8,
    refill: 3, // per reliquary visit
    reliquaryCooldown: 20,
    rackTime: 0.6,
    kick: 1.8,
    slicer: { pierce: 10, separate: 1.4, carry: 1.5, pieceLife: 25, maxPieces: 160 },
    push: { range: 10, angle: 32, velocity: 13, selfKnock: 3 },
    well: { speed: 20, gravity: 3, maxFlight: 1.6, duration: 3.2, radius: 6.5, pull: 26, swirl: 9, playerPull: 5, popRadius: 3.4, popVelocity: 11 },
    mark: { radius: 2.4, stun: 4.5, duration: 15, damageMult: 2 },
    bomb: { speed: 13, lift: 4, fuse: 1.8, bounces: 2, radius: 3.6, damage: 260, velocity: 10, droplets: 110, dropletDamage: 10,
      splatLife: 11, poolRadius: 1.6, poolLife: 12, poolDps: 45 },
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
  tpPose: {
    reach: 0.38, // wrist distance in front of the shoulders when aiming
    aimDrop: 0.1,
    adsRaise: 0.05,
    lowForward: 0.3,
    lowDrop: 0.32,
    lowPitch: 38, // how far the muzzle points down at low ready
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
    shardOutlines: true,
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
  },
  physics: {
    gravity: 14,
  },
  anim: {
    strideWalk: 1.45,
    strideRun: 2.3,
    thighSwing: 30,
    kneeBend: 55,
    runLean: 9,
    hipBob: 0.035,
    spinePitchShare: 0.55,
    landDip: 0.09,
  },
  visual: {
    outline: 0.006,
    exposure: 1.2,
    fog: 0.018,
    shadows: true,
  },
  audio: {
    volume: 0.7,
  },
};

const STORAGE_KEY = 'foolsfortune.tuning.v1';

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
    if (raw) deepMerge(T, JSON.parse(raw));
  } catch { /* storage unavailable */ }
}

export function saveTuning() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(T)); } catch { /* ignore */ }
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
