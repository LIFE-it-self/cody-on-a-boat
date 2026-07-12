// SequenceGuard — checks that ritual steps are attempted in the correct
// order (1, 2, 3, 4). Wrong order fires the same 'hurricane-fail' event the
// failure-threshold path uses (CutsceneRouter catches it and plays the fail
// cutscene).
//
// As of the assessment session, OverworldScene.startMinigameForLevel
// SOFT-BLOCKS out-of-order ritual attempts with a hint dialog BEFORE this
// guard runs, so in normal play this never fires — it remains as the last
// line of defense if a ritual scene is ever launched through another path.

import { EventBus } from './EventBus.js';
import { GameStateManager } from './GameStateManager.js';

// Returns true if the player is allowed to start the given ritual step.
// If not, immediately emits 'hurricane-fail' and returns false.
export function assertCanStartRitual(game, stepNumber) {
  const state = GameStateManager.getState(game);
  // Ritual steps must be done in order 1,2,3,4. The expected next step is
  // ritualProgress.length + 1.
  const expectedStep = state.ritualProgress.length + 1;
  if (stepNumber !== expectedStep) {
    EventBus.emit('hurricane-fail', {
      reason: 'wrong-ritual-order',
      attempted: stepNumber,
      expected: expectedStep,
    });
    return false;
  }
  return true;
}
