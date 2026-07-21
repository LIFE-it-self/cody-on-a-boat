// HUDScene — parallel scene that draws the failure counter and current
// objective on top of whatever gameplay scene is running. Launched once
// from OverworldScene.create() (guarded by isActive) and persists across
// every room transition / minigame swap.
//
// As of Session 7 HUDScene is display-only: it no longer listens for
// 'hurricane-fail'. The CutsceneRouter module (src/systems/CutsceneRouter.js)
// handles the event and starts CutsceneScene, which itself stops every
// other active scene (including this one) before rendering the fail or
// victory cutscene.

import Phaser from 'phaser';
import { FAILURE_THRESHOLD } from '../systems/GameStateManager.js';
import { getObjectiveText } from '../systems/Objective.js';

export default class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene' });
  }

  create() {
    // Both HUD labels carry a black stroke so they stay legible over any
    // room's wall tiles — the per-room art ranges from dark bar shelves to
    // bright kitchen tile, and unstroked white text washes out on the light
    // rooms.
    const hudStyle = {
      font: '8px monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    };

    // Top-left: failure counter, updated via registry change events. Labeled
    // "Hurricane" so the stakes read at a glance — fill the bar, get
    // HURRICANE CODY.
    const initialCount = this.registry.get('failureCount') || 0;
    this.failText = this.add.text(4, 4, `Hurricane: ${initialCount}/${FAILURE_THRESHOLD}`, hudStyle)
      .setDepth(1000);

    // Top-right: live objective, recomputed whenever the relevant registry
    // keys change so the ritual order is always recoverable at a glance.
    this.objectiveText = this.add.text(252, 4, getObjectiveText(this.game), hudStyle)
      .setOrigin(1, 0).setDepth(1000);

    // Subscribe to registry changes for the failure counter.
    this.onFailureChanged = (parent, value) => {
      this.failText.setText(`Hurricane: ${value}/${FAILURE_THRESHOLD}`);
    };
    this.registry.events.on('changedata-failureCount', this.onFailureChanged, this);

    // Any of these keys changing can change the next objective.
    this.onObjectiveChanged = () => {
      this.objectiveText.setText(getObjectiveText(this.game));
    };
    this.registry.events.on('changedata-ritualProgress', this.onObjectiveChanged, this);
    this.registry.events.on('changedata-completedMinigames', this.onObjectiveChanged, this);
    this.registry.events.on('changedata-talkedToCaptain', this.onObjectiveChanged, this);

    this.events.once('shutdown', this.shutdown, this);
  }

  shutdown() {
    if (this.onFailureChanged) {
      this.registry.events.off('changedata-failureCount', this.onFailureChanged, this);
    }
    if (this.onObjectiveChanged) {
      this.registry.events.off('changedata-ritualProgress', this.onObjectiveChanged, this);
      this.registry.events.off('changedata-completedMinigames', this.onObjectiveChanged, this);
      this.registry.events.off('changedata-talkedToCaptain', this.onObjectiveChanged, this);
    }
  }
}
