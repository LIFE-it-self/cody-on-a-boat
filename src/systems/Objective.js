// Objective — derives "what should the player do next" from the registry.
// Single source of truth shared by HUDScene (live objective line) and
// OverworldScene (the Captain's state-aware hints, ritual trigger gating).
//
// The next action is always: the current act's minigame if it hasn't been
// cleared, otherwise the current act's ritual step. Acts are defined by the
// LEVELS registry (each act = one non-ritual minigame + one ritual step).

import { LEVELS } from '../data/levels.js';

// Short labels sized for the 8px HUD font next to the failure counter.
// Second person — the player IS Cody.
const OBJECTIVE_LABELS = {
  'coke-drink': 'Drink a Coke',
  'horse-riddle': 'Ask the horse',
  'pipe-smoke': 'Smoke the pipe',
  'scuba-dive': 'Catch K-fish',
  'dinner-service': 'Eat dinner',
  'motorboat': 'Motorboat!!',
  'mermaid-shower': 'Take a shower',
  'lullaby': 'Count the sheep',
  'mermaid-nap': 'Nap time',
};

// Returns { type: 'minigame' | 'ritual', level } for the next thing the
// player should do, or null when all four ritual steps are complete.
export function getNextStep(game) {
  const done = game.registry.get('completedMinigames') || [];
  const ritualProgress = game.registry.get('ritualProgress') || [];
  const nextRitualStep = ritualProgress.length + 1;
  if (nextRitualStep > 4) return null;

  const ritual = Object.values(LEVELS).find(
    l => l.isRitual && l.ritualStep === nextRitualStep
  );
  if (!ritual) return null;

  const minigame = Object.values(LEVELS).find(
    l => l.act === ritual.act && !l.isRitual
  );
  if (minigame && !done.includes(minigame.id)) {
    return { type: 'minigame', level: minigame };
  }

  // The pipe (step 1) additionally needs VYOOSFRUMTHA CRYHOLE from the
  // horse's riddle — route the player to the horse before the pipe.
  if (ritual.id === 'pipe-smoke' && !done.includes('horse-riddle')) {
    const horse = LEVELS['horse-riddle'];
    if (horse) return { type: 'minigame', level: horse };
  }

  return { type: 'ritual', level: ritual };
}

// True when the given ritual level's act minigame has been cleared (or the
// act has no minigame). This is the GAME-DESIGN.md §2 act gate.
export function actMinigameDone(game, ritualLevel) {
  const done = game.registry.get('completedMinigames') || [];
  const gate = Object.values(LEVELS).find(
    l => l.act === ritualLevel.act && !l.isRitual
  );
  return !gate || done.includes(gate.id);
}

export function getObjectiveText(game) {
  if (!game.registry.get('talkedToCaptain')) return 'Objective: Find the Captain';
  const next = getNextStep(game);
  if (!next) return 'Objective: Sail home';
  const label = OBJECTIVE_LABELS[next.level.id] || next.level.instruction;
  return `Objective: ${label}`;
}
