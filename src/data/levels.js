// LEVELS — registry of every minigame in the game. Each entry is the data
// payload that BaseMinigame reads from this.levelConfig at scene start.
// Adding a level = new entry here + new scene class extending BaseMinigame.
// No edits to BaseMinigame, OverworldScene, or any system file required.

export const LEVELS = {
  'placeholder': {
    id: 'placeholder',
    sceneKey: 'PlaceholderGame',
    instruction: 'TEST!',
    location: 'Anywhere',
    isRitual: false,
    act: 0,
    config: {},
  },
  // Act 1 — werewolf rhythm. Cody drinks a Coke, transforms under a moon,
  // and the player taps in time with 8 howl notes. Not a ritual step (Act 1
  // setup, not the ritual itself). Mistimed taps dock one hit, so blind
  // mashing can't clear it.
  'coke-drink': {
    id: 'coke-drink',
    sceneKey: 'CokeDrinkGame',
    instruction: 'DRINK!',
    hint: 'Tap when the note hits the green zone',
    location: 'Ship Bar',
    isRitual: false,
    act: 1,
    config: { beats: 8, requiredHits: 5, noteSpacingMs: 750 },
  },
  // Act 1 — Ritual Step 1. Tap-to-puff against a draining "PIPE LIT" meter.
  // 5 puffs win the level; BaseMinigame.win() auto-records ritual step 1
  // because isRitual is true. puffCooldownMs spaces the puffs out (the pipe
  // needs a beat between puffs) so the game is a steady rhythm rather than
  // a 1-second mash; initialPower starts the meter half-lit so the decay
  // actually threatens.
  'pipe-smoke': {
    id: 'pipe-smoke',
    sceneKey: 'PipeSmoke',
    instruction: 'PUFF!',
    hint: 'Tap steadily — don\'t let the pipe go out',
    location: 'Main Deck',
    isRitual: true,
    ritualStep: 1,
    act: 1,
    config: { puffsRequired: 5, puffPower: 30, decayPerSec: 25, puffCooldownMs: 600, initialPower: 50 },
  },
  // Act 2 — top-down underwater K-fish collection. Not a ritual step; the
  // mermaid hints "the K-fish first" but DinnerService is the only enforced
  // ritual gate in the galley. First minigame to use Arcade Physics.
  'scuba-dive': {
    id: 'scuba-dive',
    sceneKey: 'ScubaDiveGame',
    instruction: 'DIVE!',
    hint: 'Collect gold fish, avoid red fish',
    location: 'Galley Hatch',
    isRitual: false,
    act: 2,
    config: { targetFish: 8, lives: 3, durationMs: 30000, fishSpawnIntervalMs: 700 },
  },
  // Act 2 — Ritual Step 2. Three Michelin-vs-mundane menu picks. Sequence
  // guard blocks this if pipe-smoke (step 1) hasn't been completed.
  'dinner-service': {
    id: 'dinner-service',
    sceneKey: 'DinnerService',
    instruction: 'EAT!',
    hint: 'Pick the fanciest dish each course',
    location: 'Galley',
    isRitual: true,
    ritualStep: 2,
    act: 2,
    config: {},
  },
  // Act 3 — rapid-tap survival against a fast-draining vertical PowerMeter.
  // Alternating Q/W or mobile L/R is the strong input (tapPower -
  // alternateBonus per tap); repeating the same key, SPACE, and the mobile
  // center button are all weak — alternation is the intended mechanic and
  // mashing one input can't keep up with the decay. First reuse of
  // PowerMeter in vertical orientation. Not a ritual step.
  'motorboat': {
    id: 'motorboat',
    sceneKey: 'MotorboatGame',
    instruction: 'BLOW!',
    hint: 'Alternate Q and W (or tap L and R) to keep the power up',
    location: 'Open Sea',
    isRitual: false,
    act: 3,
    config: { durationMs: 15000, decayPerSec: 35, tapPower: 18, alternateBonus: 6 },
  },
  // Act 3 — Ritual Step 3. Temperature-slider minigame. LEFT/RIGHT (or the
  // on-screen L/R buttons) nudge the temperature; random mermaid splashes
  // nudge it back. Win by accumulating targetSecondsInZone seconds in the
  // green band within totalDurationMs. Sequence guard blocks this if
  // dinner-service (step 2) hasn't been completed.
  'mermaid-shower': {
    id: 'mermaid-shower',
    sceneKey: 'MermaidShower',
    instruction: 'WASH!',
    hint: 'Hold L/R to keep temperature in the green',
    location: 'Mermaid Grotto',
    isRitual: true,
    ritualStep: 3,
    act: 3,
    config: { greenZone: [30, 70], targetSecondsInZone: 8, totalDurationMs: 25000, splashIntervalMs: 1400 },
  },
  // Act 4 — non-ritual lullaby rhythm. Reuses RhythmBar like CokeDrinkGame
  // (including the mistimed-tap penalty). RhythmBar's NOTE_TRAVEL_MS is
  // hard-coded at module scope, so we don't pass noteTravelMs here — only
  // beats, required hits, and note spacing.
  'lullaby': {
    id: 'lullaby',
    sceneKey: 'LullabyGame',
    instruction: 'SING!',
    hint: 'Tap when the note hits the green zone',
    location: 'Cabin Corridor',
    isRitual: false,
    act: 4,
    config: { beats: 8, requiredHits: 5, noteSpacingMs: 900 },
  },
  // Act 4 — Ritual Step 4 (final). Shush incoming noises to keep Cody
  // asleep. Each missed shush drops Cody's sleep meter by wakeOnMiss —
  // at 50, two misses lose (i.e. the finale demands 3 of 4 shushes). The
  // scene ends as soon as the last noise resolves (no dead air). Winning
  // pushes ritualProgress to [1,2,3,4] and fires 'victory'
  // (GameStateManager.markRitualStep:60) — CutsceneRouter catches it.
  // Sequence guard blocks this if mermaid-shower (step 3) is incomplete.
  'mermaid-nap': {
    id: 'mermaid-nap',
    sceneKey: 'MermaidNap',
    instruction: 'SHUSH!',
    hint: 'Tap to shush noises — keep Cody asleep',
    location: 'Cabin',
    isRitual: true,
    ritualStep: 4,
    act: 4,
    config: { numNoises: 4, totalDurationMs: 20000, shushWindowMs: 1800, wakeOnMiss: 50 },
  },
};
