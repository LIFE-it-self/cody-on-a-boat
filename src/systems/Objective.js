// Objective — derives "what should the player do next" from the registry.
// Single source of truth shared by HUDScene (live objective line) and
// OverworldScene (Cody's state-aware hints, ritual trigger gating).
//
// The next action is always: the current act's minigame if it hasn't been
// cleared, otherwise the current act's ritual step. Acts are defined by the
// LEVELS registry (each act = one non-ritual minigame + one ritual step).

import { LEVELS } from '../data/levels.js';

// Short labels sized for the 8px HUD font next to the failure counter.
const OBJECTIVE_LABELS = {
  'coke-drink': 'Coke with Cody',
  'pipe-smoke': 'Smoke the pipe',
  'scuba-dive': 'Catch K-fish',
  'dinner-service': 'Serve dinner',
  'motorboat': 'Motorboat!!',
  'mermaid-shower': 'Shower Cody',
  'lullaby': 'Sing the lullaby',
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
  if (!game.registry.get('talkedToCody')) return 'Objective: Find Cody';
  const next = getNextStep(game);
  if (!next) return 'Objective: Sail home';
  const label = OBJECTIVE_LABELS[next.level.id] || next.level.instruction;
  return `Objective: ${label}`;
}
