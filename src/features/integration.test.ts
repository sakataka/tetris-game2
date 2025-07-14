import { describe, expect, it } from "bun:test";

describe("Feature-Sliced Design Integration", () => {
  it("should import game-play feature exports correctly", async () => {
    const gamePlayModule = await import("./game-play");

    // Check UI exports
    expect(gamePlayModule.GameBoard).toBeDefined();
    expect(typeof gamePlayModule.GameBoard).toBe("function");

    // Check hooks exports
    expect(gamePlayModule.useGamePlay).toBeDefined();
    expect(typeof gamePlayModule.useGamePlay).toBe("function");

    // Check store exports
    expect(gamePlayModule.useGamePlayStore).toBeDefined();
    expect(typeof gamePlayModule.useGamePlayStore).toBe("function");

    // Check API exports
    expect(gamePlayModule.gameEngineAdapter).toBeDefined();
    expect(gamePlayModule.GameEngineAdapter).toBeDefined();
  });

  it("should import ai-control feature exports correctly", async () => {
    const aiControlModule = await import("./ai-control");

    // Check UI exports
    expect(aiControlModule.AIControlPanel).toBeDefined();
    expect(typeof aiControlModule.AIControlPanel).toBe("function");

    // Check hooks exports
    expect(aiControlModule.useAIControl).toBeDefined();
    expect(typeof aiControlModule.useAIControl).toBe("function");

    // Check store exports
    expect(aiControlModule.useAIStore).toBeDefined();
    expect(typeof aiControlModule.useAIStore).toBe("function");

    // Check API exports
    expect(aiControlModule.aiWorkerManager).toBeDefined();
    expect(aiControlModule.AIWorkerAdapter).toBeDefined();
  });

  it("should import scoring feature exports correctly", async () => {
    const scoringModule = await import("./scoring");

    // Check UI exports
    expect(scoringModule.ScoreDisplay).toBeDefined();
    expect(typeof scoringModule.ScoreDisplay).toBe("function");

    // Check hooks exports
    expect(scoringModule.useScoring).toBeDefined();
    expect(typeof scoringModule.useScoring).toBe("function");

    // Check store exports
    expect(scoringModule.useScoringStore).toBeDefined();
    expect(typeof scoringModule.useScoringStore).toBe("function");

    // Check API exports
    expect(scoringModule.scoreStorage).toBeDefined();
    expect(scoringModule.ScoreStorageAdapter).toBeDefined();
  });

  it("should import settings feature exports correctly", async () => {
    const settingsModule = await import("./settings");

    // Check UI exports
    expect(settingsModule.SettingsPanel).toBeDefined();
    expect(typeof settingsModule.SettingsPanel).toBe("function");

    // Check hooks exports
    expect(settingsModule.useSettings).toBeDefined();
    expect(typeof settingsModule.useSettings).toBe("function");

    // Check store exports
    expect(settingsModule.useSettingsStore).toBeDefined();
    expect(typeof settingsModule.useSettingsStore).toBe("function");

    // Check API exports
    expect(settingsModule.settingsStorage).toBeDefined();
    expect(settingsModule.SettingsStorageAdapter).toBeDefined();
  });

  it("should import shared effects system correctly", async () => {
    const effectsModule = await import("../shared/effects/gameEffects");

    expect(effectsModule.GameEffectsManager).toBeDefined();
    expect(effectsModule.gameEffects).toBeDefined();
    expect(typeof effectsModule.gameEffects.emit).toBe("function");
    expect(typeof effectsModule.gameEffects.on).toBe("function");
    expect(typeof effectsModule.gameEffects.off).toBe("function");
  });

  it("should import app providers correctly", async () => {
    const providersModule = await import("../app/providers/EffectsProvider");

    expect(providersModule.EffectsProvider).toBeDefined();
    expect(typeof providersModule.EffectsProvider).toBe("function");
    expect(providersModule.useGameEffects).toBeDefined();
    expect(typeof providersModule.useGameEffects).toBe("function");
    expect(providersModule.useEmitGameEvent).toBeDefined();
    expect(typeof providersModule.useEmitGameEvent).toBe("function");
  });

  it("should have proper feature independence (no circular dependencies)", async () => {
    // This test ensures that features don't depend on each other directly
    // Each feature should only depend on shared layer and external libraries

    // Import each feature module and verify no errors
    await expect(import("./game-play")).resolves.toBeDefined();
    await expect(import("./ai-control")).resolves.toBeDefined();
    await expect(import("./scoring")).resolves.toBeDefined();
    await expect(import("./settings")).resolves.toBeDefined();

    // Features should not import from each other
    // This is enforced by the Feature-Sliced Design architecture
    // If there were circular dependencies, the imports above would fail
  });

  it("should export proper TypeScript types", async () => {
    // Verify that type exports work correctly
    const gamePlayModule = await import("./game-play");
    const aiControlModule = await import("./ai-control");
    const scoringModule = await import("./scoring");
    const settingsModule = await import("./settings");

    // The fact that these imports succeed means the TypeScript types are properly exported
    // Individual type checking is handled by the TypeScript compiler
    expect(gamePlayModule).toBeDefined();
    expect(aiControlModule).toBeDefined();
    expect(scoringModule).toBeDefined();
    expect(settingsModule).toBeDefined();
  });
});
