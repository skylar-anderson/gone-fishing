import { Fish, SceneId } from '@/lib/types';
import { loadAllFish } from '@/lib/utils/yaml';
import { getPole } from '@/data/poles';

export interface FishingResult {
  success: boolean;
  fish?: Fish;
}

export class FishingSystem {
  private fishByScene: Map<SceneId, Fish[]>;
  private allFish: Map<string, Fish>;

  constructor() {
    this.fishByScene = new Map();
    this.allFish = new Map();
    this.loadFish();
  }

  private loadFish(): void {
    const fishMap = loadAllFish();

    for (const [scene, fishList] of fishMap) {
      this.fishByScene.set(scene, fishList);

      for (const fish of fishList) {
        this.allFish.set(fish.id, fish);
      }
    }
  }

  attemptCatch(scene: SceneId, poleLevel: number = 1): FishingResult {
    const sceneFish = this.fishByScene.get(scene);
    if (!sceneFish || sceneFish.length === 0) {
      return { success: false };
    }

    // Get pole modifiers
    const pole = getPole(poleLevel);
    const modifiers = pole.modifiers;

    // Apply modifiers to catch chances
    const modifiedFish = sceneFish.map(fish => ({
      fish,
      modifiedChance: fish.catchChance * modifiers[fish.rarity],
    }));

    // Calculate total modified probability (for normalization)
    const totalModifiedChance = modifiedFish.reduce((sum, f) => sum + f.modifiedChance, 0);

    // Roll for catch (0 to total modified chance)
    const roll = Math.random() * totalModifiedChance;

    // Check each fish in order of rarity (rarest first for fair probability)
    let cumulative = 0;

    // Sort by modified chance (lowest first = rarest first)
    const sortedFish = [...modifiedFish].sort((a, b) => a.modifiedChance - b.modifiedChance);

    for (const { fish, modifiedChance } of sortedFish) {
      cumulative += modifiedChance;
      if (roll < cumulative) {
        return { success: true, fish };
      }
    }

    // No catch - shouldn't happen with normalized probabilities, but safety fallback
    return { success: false };
  }

  getFish(fishId: string): Fish | undefined {
    return this.allFish.get(fishId);
  }

  getSceneFish(scene: SceneId): Fish[] {
    return this.fishByScene.get(scene) || [];
  }
}
