// GameStateManager — wraps Phaser's game.registry as a typed-ish singleton
// store. The registry is a key/value bag that all scenes share, and it
// emits 'changedata-<key>' events when values are written via set(), which
// HUDScene uses to keep its failure counter in sync.
//
// All writes go through set() (never mutate arrays in place) so that the
// change events fire correctly.

import { EventBus } from './EventBus.js';

export const FAILURE_THRESHOLD = 5;

export class GameStateManager {
  // Called once from BootScene.create() before any other scene starts.
  // Seeds the registry with the defaults the rest of the game expects.
  static init(game) {
    game.registry.set('ritualProgress', []);
    game.registry.set('failureCount', 0);
    game.registry.set('completedMinigames', []);
    game.registry.set('selectedCodyVariant', 'default');
    game.registry.set('currentAct', 1);
    // Set on the first captain-intro dialog. OverworldScene.tryInteract
    // reads this to swap later Captain chats to a state-aware
    // captain-next-* hint (captain-hint-1 as the fallback).
    game.registry.set('talkedToCaptain', false);
    // Music state — MusicManager reads/writes these.
    game.registry.set('currentMusicKey', null);
    game.registry.set('currentMusicInstance', null);
  }

  static getState(game) {
    return {
      ritualProgress: game.registry.get('ritualProgress'),
      failureCount: game.registry.get('failureCount'),
      completedMinigames: game.registry.get('completedMinigames'),
      selectedCodyVariant: game.registry.get('selectedCodyVariant'),
      currentAct: game.registry.get('currentAct'),
    };
  }

  static markMinigameComplete(game, levelId) {
    const next = [...game.registry.get('completedMinigames'), levelId];
    game.registry.set('completedMinigames', next);
  }

  // Increments the failure counter and returns the new value. If we just
  // hit the threshold, fires 'hurricane-fail' on the EventBus so HUDScene
  // can show the placeholder fail UI and bounce back to MainMenuScene.
  static recordFailure(game) {
    const newCount = game.registry.get('failureCount') + 1;
    game.registry.set('failureCount', newCount);
    if (newCount >= FAILURE_THRESHOLD) {
      EventBus.emit('hurricane-fail', { reason: 'too-many-failures', count: newCount });
    }
    return newCount;
  }

  // Records a successful ritual step. When all 4 are done, fires 'victory'
  // on the EventBus (Session 7 will wire that up to a real win cutscene).
  static markRitualStep(game, stepNumber) {
    const next = [...game.registry.get('ritualProgress'), stepNumber];
    game.registry.set('ritualProgress', next);
    if (next.length === 4) {
      EventBus.emit('victory', { progress: next });
    }
  }

  static reset(game) {
    GameStateManager.init(game);
  }
}
